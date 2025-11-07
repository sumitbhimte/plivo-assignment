"use client";

import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

interface PermissionGateProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * Usage: <PermissionGate permission="org:services:create">...</PermissionGate>
 */
export function PermissionGate({ 
  permission, 
  fallback = null, 
  children 
}: PermissionGateProps) {
  const { orgPermissions } = useAuth();

  const hasAccess = orgPermissions?.includes(permission) || false;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGateProps {
  role: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 * Usage: <RoleGate role="admin">...</RoleGate>
 */
export function RoleGate({ 
  role, 
  fallback = null, 
  children 
}: RoleGateProps) {
  const { orgRole } = useAuth();

  const hasAccess = orgRole === role;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

