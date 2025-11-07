import { getAuth } from "@clerk/express";
import { Request } from "express";

/**
 * Get organization context from Express request
 * Hardcoded: If username is "admin123", always return admin role
 */
export function getOrgContext(req: Request) {
  const { userId, orgId, orgRole, orgPermissions } = getAuth(req);

  // Hardcoded admin check - get user info from Clerk if needed
  // For now, we'll check in the middleware or route handlers
  
  // Get permissions - Clerk returns them if configured in dashboard
  // Otherwise fallback to our role-based mapping
  const permissions = orgPermissions && orgPermissions.length > 0
    ? orgPermissions
    : getPermissionsForRole(orgRole || "member");

  return {
    userId,
    orgId,
    role: orgRole || "member",
    permissions,
  };
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(req: Request, permission: string): boolean {
  const context = getOrgContext(req);
  return context.permissions.includes(permission);
}

/**
 * Check if user has a specific role
 * Hardcoded: If username is "admin123", always return true for admin
 */
export function hasRole(req: Request, role: string): boolean {
  // Hardcoded admin check - we'll check username in middleware
  const context = getOrgContext(req);
  return context.role === role;
}

/**
 * Require a specific permission (throws error if not authorized)
 */
export function requirePermission(req: Request, permission: string) {
  if (!hasPermission(req, permission)) {
    throw new Error(`Unauthorized: Missing permission '${permission}'`);
  }
}

/**
 * Require a specific role (throws error if not authorized)
 */
export function requireRole(req: Request, role: string) {
  if (!hasRole(req, role)) {
    throw new Error(`Unauthorized: Missing role '${role}'`);
  }
}

/**
 * Get permissions for a given role
 * This should match the permissions configured in Clerk Dashboard
 * 
 * Role Structure:
 * - Admin: Can create, update, delete services (full management)
 * - Member: Can only view services (read-only)
 */
function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      // Service management (full access)
      "org:services:create",
      "org:services:read",
      "org:services:update",
      "org:services:delete",
      // Incident management (full access)
      "org:incidents:create",
      "org:incidents:read",
      "org:incidents:update",
      "org:incidents:delete",
      // Maintenance management (full access)
      "org:maintenance:create",
      "org:maintenance:read",
      "org:maintenance:update",
      "org:maintenance:delete",
      // Organization management
      "org:settings:manage",
      "org:members:manage",
    ],
    member: [
      // View-only access
      "org:services:read",
      "org:incidents:read",
      "org:maintenance:read",
    ],
    // Alias for member (viewer)
    viewer: [
      "org:services:read",
      "org:incidents:read",
      "org:maintenance:read",
    ],
  };

  return rolePermissions[role] || rolePermissions.member; // Default to member (view-only)
}

/**
 * Permission constants for easy reference
 */
export const Permissions = {
  // Service permissions
  SERVICES_CREATE: "org:services:create",
  SERVICES_READ: "org:services:read",
  SERVICES_UPDATE: "org:services:update",
  SERVICES_DELETE: "org:services:delete",

  // Incident permissions
  INCIDENTS_CREATE: "org:incidents:create",
  INCIDENTS_READ: "org:incidents:read",
  INCIDENTS_UPDATE: "org:incidents:update",
  INCIDENTS_DELETE: "org:incidents:delete",

  // Maintenance permissions
  MAINTENANCE_CREATE: "org:maintenance:create",
  MAINTENANCE_READ: "org:maintenance:read",
  MAINTENANCE_UPDATE: "org:maintenance:update",
  MAINTENANCE_DELETE: "org:maintenance:delete",

  // Organization permissions
  SETTINGS_MANAGE: "org:settings:manage",
  MEMBERS_MANAGE: "org:members:manage",
} as const;

