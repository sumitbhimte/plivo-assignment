import { clerkMiddleware, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { hasPermission, hasRole } from "../lib/auth";
import { getOrCreateOrganization } from "../lib/organization";
import { clerkClient } from "@clerk/express";

// Clerk middleware for authentication
export const authMiddleware = clerkMiddleware();

// Middleware to check if user is authenticated
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, orgId, orgRole, orgPermissions } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Hardcoded admin check: If username is "admin123", bypass organization requirement
    let isHardcodedAdmin = false;
    let effectiveOrgId = orgId;

    try {
      const user = await clerkClient.users.getUser(userId);
      if (user.username === "admin123") {
        isHardcodedAdmin = true;
        (req as any).isAdmin = true;

        if (!effectiveOrgId) {
          const memberships = await clerkClient.users.getOrganizationMembershipList({
            userId,
          });
          const firstMembership = memberships.data[0];
          if (firstMembership) {
            effectiveOrgId = firstMembership.organization.id;
          }
        }
      }
    } catch (error) {
      // Continue if we can't fetch user
    }

    // Sync organization to our database if we have one
    let dbOrgId = null;
    if (effectiveOrgId) {
      try {
        const org = await getOrCreateOrganization(effectiveOrgId);
        dbOrgId = org.id;
      } catch (error) {
        console.error("Error syncing organization:", error);
        // Continue even if sync fails
      }
    }

    // Attach user info to request
    (req as any).userId = userId;
    (req as any).orgId = effectiveOrgId || null; // Clerk org ID (with fallback)
    (req as any).dbOrgId = dbOrgId; // Our database org ID
    (req as any).orgRole = isHardcodedAdmin ? "admin" : orgRole;
    (req as any).orgPermissions = orgPermissions;
    (req as any).isHardcodedAdmin = isHardcodedAdmin;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Middleware to check if user has organization
// Hardcoded admin bypass: admin123 can bypass this check
export const requireOrg = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isHardcodedAdmin = (req as any).isHardcodedAdmin;
    const orgId = (req as any).orgId || getAuth(req).orgId;
    
    // Hardcoded admin can bypass organization requirement
    if (isHardcodedAdmin) {
      return next();
    }
    
    if (!orgId) {
      return res.status(403).json({ error: "Organization required" });
    }

    (req as any).orgId = orgId;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Organization required" });
  }
};

// Middleware to check if user has a specific permission
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!hasPermission(req, permission)) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: `Missing permission: ${permission}` 
        });
      }
      next();
    } catch (error) {
      return res.status(403).json({ error: "Forbidden" });
    }
  };
};

// Middleware to check if user has a specific role
export const requireRole = (role: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!hasRole(req, role)) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: `Missing role: ${role}` 
        });
      }
      next();
    } catch (error) {
      return res.status(403).json({ error: "Forbidden" });
    }
  };
};

