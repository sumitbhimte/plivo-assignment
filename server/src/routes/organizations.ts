import { Router } from "express";
import { requireAuth, requireOrg } from "../middleware/auth";
import { getOrCreateOrganization } from "../lib/organization";
import { prisma } from "../lib/prisma";

const router = Router();

// All routes require authentication and organization
router.use(requireAuth);
router.use(requireOrg);

// GET /api/organizations/current - Get current user's organization
router.get("/current", async (req: any, res) => {
  try {
    const { orgId } = req;

    if (!orgId) {
      return res.status(404).json({ error: "No organization found" });
    }

    // Sync and get organization
    const org = await getOrCreateOrganization(orgId);

    res.json(org);
  } catch (error: any) {
    console.error("Error fetching organization:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/organizations/:id - Get organization by ID
router.get("/:id", async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        services: true,
        incidents: true,
        maintenances: true,
      },
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json(org);
  } catch (error: any) {
    console.error("Error fetching organization:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;

