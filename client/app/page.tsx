import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const user = await currentUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Status Page Application
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Monitor and manage your services, incidents, and maintenance windows
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Service Management</CardTitle>
              <CardDescription>
                Track the status of all your services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor uptime, performance, and availability of your services in real-time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Incident Management</CardTitle>
              <CardDescription>
                Handle incidents and outages efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create incidents, add updates, and keep your users informed about service disruptions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Windows</CardTitle>
              <CardDescription>
                Schedule and track maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Plan scheduled maintenance and notify users in advance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

