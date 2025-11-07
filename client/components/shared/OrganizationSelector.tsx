"use client";

import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OrganizationSelector() {
  const { organization, isLoaded } = useOrganization();
  const { setActive, organizationList } = useOrganizationList();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !organization && organizationList && organizationList.length > 0) {
      // Auto-select first organization if none is selected
      const firstOrg = organizationList[0];
      if (firstOrg) {
        setActive({ organization: firstOrg.id }).then(() => {
          router.refresh();
        });
      }
    }
  }, [isLoaded, organization, organizationList, setActive, router]);

  if (!isLoaded) {
    return null;
  }

  return null;
}

