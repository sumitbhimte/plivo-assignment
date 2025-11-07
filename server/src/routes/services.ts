import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import { requireAuth, requireOrg } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router = Router();

// All routes require authentication
router.use(requireAuth);
// Only require organization for non-hardcoded-admin users
router.use(async (req: any, res: Response, next: NextFunction) => {
  const isHardcodedAdmin = (req as any).isHardcodedAdmin;
  if (!isHardcodedAdmin) {
    return requireOrg(req, res, next);
  }
  next();
});

// Validation schemas
const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["OPERATIONAL", "DEGRADED", "PARTIAL_OUTAGE", "MAJOR_OUTAGE"]).optional(),
});

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["OPERATIONAL", "DEGRADED", "PARTIAL_OUTAGE", "MAJOR_OUTAGE"]).optional(),
});

// GET /api/services - Get all services for organization
router.get("/", async (req: any, res) => {
  try {
    const { dbOrgId, orgId, isHardcodedAdmin } = req;

    // Hardcoded admin can access without organization
    if (isHardcodedAdmin && !dbOrgId) {
      // Return empty array for admin without org
      return res.json([]);
    }

    if (!dbOrgId && orgId) {
      // Organization not synced yet, return empty array
      return res.json([]);
    }

    if (!dbOrgId) {
      return res.status(403).json({ error: "Organization required" });
    }

    const services = await prisma.service.findMany({
      where: {
        organizationId: dbOrgId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(services);
  } catch (error: any) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/services/:id - Get single service
router.get("/:id", async (req: any, res) => {
  try {
    const { dbOrgId } = req;
    const { id } = req.params;

    const service = await prisma.service.findFirst({
      where: {
        id,
        organizationId: dbOrgId,
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(service);
  } catch (error: any) {
    console.error("Error fetching service:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/services - Create new service
router.post("/", async (req: any, res) => {
  try {
    const { dbOrgId, userId, orgId, isHardcodedAdmin } = req;

    // For hardcoded admin, try to sync organization or use a default
    if (isHardcodedAdmin && !dbOrgId && orgId) {
      try {
        const { getOrCreateOrganization } = await import("../lib/organization");
        const org = await getOrCreateOrganization(orgId);
        (req as any).dbOrgId = org.id;
      } catch (error) {
        // If sync fails, admin can still create services
        // We'll need to handle this case - maybe create a default org
      }
    }

    if (!dbOrgId && orgId) {
      // Try to sync organization first
      const { getOrCreateOrganization } = await import("../lib/organization");
      const org = await getOrCreateOrganization(orgId);
      (req as any).dbOrgId = org.id;
    }

    // Hardcoded admin can create services even without org (we'll handle this differently)
    if (!dbOrgId && !isHardcodedAdmin) {
      return res.status(403).json({ error: "Organization required" });
    }

    // Validate input
    const data = createServiceSchema.parse(req.body);

    // For hardcoded admin without org, we need to handle this case
    // For now, require orgId to be present
    if (!dbOrgId) {
      return res.status(403).json({ error: "Please select an organization first" });
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status || "OPERATIONAL",
        organizationId: dbOrgId,
      },
    });

    // Create status history entry
    await prisma.statusHistory.create({
      data: {
        serviceId: service.id,
        status: service.status,
        changedBy: userId,
      },
    });

    res.status(201).json(service);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error creating service:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// PUT /api/services/:id - Update service
router.put("/:id", async (req: any, res) => {
  try {
    const { dbOrgId, userId } = req;
    const { id } = req.params;

    // Validate input
    const data = updateServiceSchema.parse(req.body);

    // Check if service exists and belongs to organization
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        organizationId: dbOrgId,
      },
    });

    if (!existingService) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Update service
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // If status changed, create history entry
    if (data.status && data.status !== existingService.status) {
      await prisma.statusHistory.create({
        data: {
          serviceId: service.id,
          status: service.status,
          changedBy: userId,
        },
      });
    }

    res.json(service);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error updating service:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// DELETE /api/services/:id - Delete service
router.delete("/:id", async (req: any, res) => {
  try {
    const { dbOrgId } = req;
    const { id } = req.params;

    // Check if service exists and belongs to organization
    const service = await prisma.service.findFirst({
      where: {
        id,
        organizationId: dbOrgId,
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Delete service (cascades will handle related records)
    await prisma.service.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;

