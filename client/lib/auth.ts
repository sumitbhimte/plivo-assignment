import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Simple check: Is the user an admin?
 * Hardcoded: If username is "admin123", always return true
 */
export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  
  if (!user) {
    return false;
  }

  // Hardcoded admin check - check username
  const username = user.username || "";
  if (username === "admin123") {
    return true;
  }

  // Try to get orgRole directly from auth() first
  const { orgId, orgRole, userId } = await auth();
  
  if (orgRole === "admin") {
    return true;
  }
  
  // If we have orgId but no orgRole, try to get it from Clerk API
  if (orgId && userId && !orgRole) {
    try {
      const membership = await clerkClient.users.getOrganizationMembershipList({
        userId: userId,
      });
      const orgMembership = membership.data.find(m => m.organization.id === orgId);
      if (orgMembership?.role === "admin") {
        return true;
      }
    } catch (error) {
      console.error("Error fetching membership from Clerk API:", error);
    }
  }
  
  // Fallback: Get from user memberships
  const activeOrgId = orgId || (user as any).organizationMemberships?.[0]?.organization.id;

  if (!activeOrgId) {
    console.log("No organization found");
    return false;
  }

  try {
    const membership = (user as any).organizationMemberships?.find(
      (m: any) => m.organization.id === activeOrgId
    );
    
    if (!membership) {
      console.log("No membership found for org:", activeOrgId);
      return false;
    }
    
    const isAdminUser = membership.role === "admin";
    
    return isAdminUser;
  } catch (error) {
    console.error("Error checking admin:", error);
    return false;
  }
}

/**
 * Get user's role (admin or member)
 * Hardcoded: If username is "admin123", always return "admin"
 */
export async function getUserRole(): Promise<"admin" | "member" | null> {
  const user = await currentUser();
  
  if (!user) {
    return null;
  }

  // Hardcoded admin check - check username
  const username = user.username || "";
  if (username === "admin123") {
    return "admin";
  }

  // Try to get orgRole directly from auth() first
  const { orgId, orgRole, userId } = await auth();
  
  if (orgRole) {
    return orgRole as "admin" | "member";
  }
  
  // If we have orgId but no orgRole, try to get it from Clerk API
  if (orgId && userId && !orgRole) {
    try {
      const membership = await clerkClient.users.getOrganizationMembershipList({
        userId: userId,
      });
      const orgMembership = membership.data.find(m => m.organization.id === orgId);
      if (orgMembership?.role) {
        return orgMembership.role as "admin" | "member";
      }
    } catch (error) {
      console.error("Error fetching membership from Clerk API:", error);
    }
  }
  
  // Fallback: Get from user memberships
  const activeOrgId = orgId || (user as any).organizationMemberships?.[0]?.organization.id;

  if (!activeOrgId) {
    console.log("No organization found for role check");
    return null;
  }

  try {
    const membership = (user as any).organizationMemberships?.find(
      (m: any) => m.organization.id === activeOrgId
    );
    
    if (!membership) {
      console.log("No membership found for org:", activeOrgId);
      return null;
    }
    
    const role = (membership.role as "admin" | "member") || "member";
    
    return role;
  } catch (error) {
    console.error("Error getting role:", error);
    return null;
  }
}

/**
 * Simple permission check
 */
export async function canManageServices(): Promise<boolean> {
  return await isAdmin();
}

/**
 * Simple permission check for viewing
 */
export async function canViewServices(): Promise<boolean> {
  const { userId } = await auth();
  const user = await currentUser();
  return !!(userId && ((user as any)?.organizationMemberships?.length > 0 || user?.username === "admin123"));
}
