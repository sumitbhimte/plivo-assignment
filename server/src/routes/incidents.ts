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
const createIncidentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"]).optional(),
  impact: z.enum(["NONE", "MINOR", "MAJOR", "CRITICAL"]).optional(),
  serviceIds: z.array(z.string()).optional(),
});

const updateIncidentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"]).optional(),
  impact: z.enum(["NONE", "MINOR", "MAJOR", "CRITICAL"]).optional(),
});

const createIncidentUpdateSchema = z.object({
  status: z.enum(["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"]),
  message: z.string().min(1),
});

// GET /api/incidents - Get all incidents for organization
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

    const incidents = await prisma.incident.findMany({
      where: {
        organizationId: dbOrgId,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        updates: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(incidents);
  } catch (error: any) {
    console.error("Error fetching incidents:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/incidents/:id - Get single incident
router.get("/:id", async (req: any, res) => {
  try {
    const { dbOrgId } = req;
    const { id } = req.params;

    const incident = await prisma.incident.findFirst({
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
        updates: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json(incident);
  } catch (error: any) {
    console.error("Error fetching incident:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/incidents - Create new incident
router.post("/", async (req: any, res) => {
  try {
    const { dbOrgId, userId, orgId } = req;

    if (!dbOrgId && orgId) {
      const { getOrCreateOrganization } = await import("../lib/organization");
      const org = await getOrCreateOrganization(orgId);
      (req as any).dbOrgId = org.id;
    }

    if (!dbOrgId) {
      return res.status(403).json({ error: "Organization required" });
    }

    // Validate input
    const data = createIncidentSchema.parse(req.body);

    // Create incident
    const incident = await prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || "INVESTIGATING",
        impact: data.impact || "MAJOR",
        organizationId: dbOrgId,
      },
    });

    // Associate with services if provided
    if (data.serviceIds && data.serviceIds.length > 0) {
      await prisma.serviceIncident.createMany({
        data: data.serviceIds.map((serviceId: string) => ({
          incidentId: incident.id,
          serviceId,
        })),
      });
    }

    // Create initial update
    await prisma.incidentUpdate.create({
      data: {
        incidentId: incident.id,
        status: incident.status,
        message: `Incident created: ${incident.title}`,
      },
    });

    res.status(201).json(incident);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error creating incident:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// PUT /api/incidents/:id - Update incident
router.put("/:id", async (req: any, res) => {
  try {
    const { dbOrgId, userId } = req;
    const { id } = req.params;

    // Check if incident exists and belongs to organization
    const existingIncident = await prisma.incident.findFirst({
      where: {
        id,
        organizationId: dbOrgId,
      },
    });

    if (!existingIncident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // Validate input
    const data = updateIncidentSchema.parse(req.body);

    // Update incident
    const incident = await prisma.incident.update({
      where: { id },
      data: {
        ...data,
        resolvedAt: data.status === "RESOLVED" ? new Date() : existingIncident.resolvedAt,
        updatedAt: new Date(),
      },
    });

    // If status changed, create update entry
    if (data.status && data.status !== existingIncident.status) {
      await prisma.incidentUpdate.create({
        data: {
          incidentId: incident.id,
          status: incident.status,
          message: `Status updated to ${incident.status}`,
        },
      });
    }

    res.json(incident);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error updating incident:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/incidents/:id/updates - Add update to incident
router.post("/:id/updates", async (req: any, res) => {
  try {
    const { dbOrgId } = req;
    const { id } = req.params;

    // Check if incident exists
    const incident = await prisma.incident.findFirst({
      where: {
        id,
        organizationId: dbOrgId,
      },
    });

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // Validate input
    const data = createIncidentUpdateSchema.parse(req.body);

    // Create update
    const update = await prisma.incidentUpdate.create({
      data: {
        incidentId: id,
        status: data.status,
        message: data.message,
      },
    });

    // Update incident status if changed
    if (data.status !== incident.status) {
      await prisma.incident.update({
        where: { id },
        data: {
          status: data.status,
          resolvedAt: data.status === "RESOLVED" ? new Date() : incident.resolvedAt,
        },
      });
    }

    res.status(201).json(update);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error creating incident update:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// DELETE /api/incidents/:id - Delete incident
router.delete("/:id", async (req: any, res) => {
  try {
    const { dbOrgId } = req;
    const { id } = req.params;

    // Check if incident exists and belongs to organization
    const incident = await prisma.incident.findFirst({
      where: {
        id,
        organizationId: dbOrgId,
      },
    });

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // Delete incident (cascades will handle related records)
    await prisma.incident.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting incident:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;

