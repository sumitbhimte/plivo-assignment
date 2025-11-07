import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OrganizationSelector } from "@/components/shared/OrganizationSelector";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <OrganizationSelector />
      {/* Navigation Bar */}
      <nav className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold">
              Status Page
            </Link>
            <div className="hidden md:flex gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/services"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Services
              </Link>
              <Link
                href="/dashboard/incidents"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Incidents
              </Link>
              <Link
                href="/dashboard/maintenance"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Maintenance
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <OrganizationSwitcher 
              hidePersonal
              afterSelectOrganizationUrl="/dashboard"
              afterCreateOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  organizationSwitcherTrigger: "px-3 py-2",
                },
              }}
            />
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

