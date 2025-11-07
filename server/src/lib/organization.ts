import { prisma } from "./prisma";
import { clerkClient } from "@clerk/express";

/**
 * Sync organization from Clerk to our database
 * Creates organization in our DB if it doesn't exist
 */
export async function syncOrganization(clerkOrgId: string) {
  try {
    // Check if organization already exists
    const existing = await prisma.organization.findUnique({
      where: { clerkId: clerkOrgId },
    });

    if (existing) {
      return existing;
    }

    // Fetch organization details from Clerk
    const clerkOrg = await clerkClient.organizations.getOrganization({
      organizationId: clerkOrgId,
    });

    // Create organization in our database
    const org = await prisma.organization.create({
      data: {
        clerkId: clerkOrgId,
        name: clerkOrg.name,
        slug: clerkOrg.slug || clerkOrg.name.toLowerCase().replace(/\s+/g, "-"),
      },
    });

    return org;
  } catch (error) {
    console.error("Error syncing organization:", error);
    throw error;
  }
}

/**
 * Get or create organization for a Clerk org ID
 */
export async function getOrCreateOrganization(clerkOrgId: string) {
  let org = await prisma.organization.findUnique({
    where: { clerkId: clerkOrgId },
  });

  if (!org) {
    org = await syncOrganization(clerkOrgId);
  }

  return org;
}

