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
const createMaintenanceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  serviceIds: z.array(z.string()).optional(),
});

const updateMaintenanceSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

// GET /api/maintenance - Get all maintenance windows for organization
router.get("/", async (req: any, res) => {
  try {
    const { dbOrgId, orgId, isHardcodedAdmin } = req;

    // Hardcoded admin can access without organization - return empty array
    if (isHardcodedAdmin && !dbOrgId) {
      return res.json([]);
    }

    if (!dbOrgId && orgId) {
      return res.json([]);
    }

    if (!dbOrgId) {
      return res.status(403).json({ error: "Organization required" });
    }

    const maintenances = await prisma.maintenance.findMany({
      where: {
        organizationId: dbOrgId,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        scheduledStart: "desc",
      },
    });

    res.json(maintenances);
  } catch (error: any) {
    console.error("Error fetching maintenance:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/maintenance/:id - Get single maintenance
router.get("/:id", async (req: any, res) => {
  try {
    const { dbOrgId } = req;
    const { id } = req.params;

    const maintenance = await prisma.maintenance.findFirst({
      where: {
        id,
        organizationId: dbOrgId,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!maintenance) {
      return res.status(404).json({ error: "Maintenance not found" });
    }

    res.json(maintenance);
  } catch (error: any) {
    console.error("Error fetching maintenance:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/maintenance - Create new maintenance window
router.post("/", async (req: any, res) => {
  try {
    const { dbOrgId, orgId } = req;

    if (!dbOrgId && orgId) {
      const { getOrCreateOrganization } = await import("../lib/organization");
      const org = await getOrCreateOrganization(orgId);
      (req as any).dbOrgId = org.id;
    }

    if (!dbOrgId) {
      return res.status(403).json({ error: "Organization required" });
    }

    // Validate input
    const data = createMaintenanceSchema.parse(req.body);

    // Create maintenance
    const maintenance = await prisma.maintenance.create({
      data: {
        title: data.title,
        description: data.description,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        status: data.status || "SCHEDULED",
        organizationId: dbOrgId,
      },
    });

    // Associate with services if provided
    if (data.serviceIds && data.serviceIds.length > 0) {
      await prisma.serviceMaintenance.createMany({
        data: data.serviceIds.map((serviceId: string) => ({
          maintenanceId: maintenance.id,
          serviceId,
        })),
      });
    }

    res.status(201).json(maintenance);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error creating maintenance:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// PUT /api/maintenance/:id - Update maintenance
router.put("/:id", async (req: any, res) => {
  try {
    const { dbOrgId } = req;
    const { id } = req.params;

    // Check if maintenance exists and belongs to organization
    const existingMaintenance = await prisma.maintenance.findFirst({
      where: {
        id,
        organizationId: dbOrgId,
      },
    });

    if (!existingMaintenance) {
      return res.status(404).json({ error: "Maintenance not found" });
    }

    // Validate input
    const data = updateMaintenanceSchema.parse(req.body);

    // Update maintenance
    const maintenance = await prisma.maintenance.update({
      where: { id },
      data: {
        ...data,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
        updatedAt: new Date(),
      },
    });

    res.json(maintenance);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error updating maintenance:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// DELETE /api/maintenance/:id - Delete maintenance
router.delete("/:id", async (req: any, res) => {
  try {
    const { dbOrgId } = req;
    const { id } = req.params;

    // Check if maintenance exists and belongs to organization
    const maintenance = await prisma.maintenance.findFirst({
      where: {
        id,
        organizationId: dbOrgId,
      },
    });

    if (!maintenance) {
      return res.status(404).json({ error: "Maintenance not found" });
    }

    // Delete maintenance (cascades will handle related records)
    await prisma.maintenance.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting maintenance:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;

