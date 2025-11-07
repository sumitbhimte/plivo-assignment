import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserRole, isAdmin } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Debug: Check what we're getting
  const { orgId } = await auth();
  const orgMemberships = (user as any).organizationMemberships || [];
  
  console.log("Dashboard Debug:", {
    orgIdFromSession: orgId,
    hasMemberships: orgMemberships.length > 0,
    memberships: orgMemberships.map((m: any) => ({
      orgId: m.organization.id,
      orgName: m.organization.name,
      role: m.role
    }))
  });

  const role = await getUserRole();
  const admin = await isAdmin();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}!
            </p>
          </div>
          {role && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Role</div>
              <div className={`text-lg font-semibold ${role === 'admin' ? 'text-blue-600' : 'text-gray-600'}`}>
                {role.toUpperCase()}
              </div>
            </div>
          )}
        </div>
        {!role && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-900 dark:text-yellow-100 mb-2">
              <strong>Debug Info:</strong>
            </p>
            <ul className="text-sm text-yellow-900 dark:text-yellow-100 list-disc list-inside space-y-1">
              <li>Org ID from session: {orgId || "None"}</li>
              <li>Organization memberships: {orgMemberships.length}</li>
              {orgMemberships.length > 0 && (
                <li>Organizations: {orgMemberships.map((m: any) => `${m.organization.name} (${m.role})`).join(", ")}</li>
              )}
              <li>Make sure you&apos;ve selected the organization in the switcher above</li>
            </ul>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>View and manage services</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/services">
              <Button className="w-full">View Services</Button>
            </Link>
          </CardContent>
        </Card>

        {admin && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Incidents</CardTitle>
                <CardDescription>Create and manage incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/incidents">
                  <Button className="w-full">Manage Incidents</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance</CardTitle>
                <CardDescription>Schedule and track maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/maintenance">
                  <Button className="w-full">Manage Maintenance</Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

