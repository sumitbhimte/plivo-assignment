"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Activity,
  XCircle,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

const STATUS_OPTIONS = [
  {
    value: "OPERATIONAL",
    label: "Operational",
    description: "Service is working normally",
    icon: CheckCircle2,
    color: "text-green-600",
    badge: "bg-green-100 text-green-800",
  },
  {
    value: "DEGRADED",
    label: "Degraded",
    description: "Service is experiencing issues",
    icon: AlertCircle,
    color: "text-yellow-600",
    badge: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "PARTIAL_OUTAGE",
    label: "Partial Outage",
    description: "Service is partially down",
    icon: Activity,
    color: "text-orange-600",
    badge: "bg-orange-100 text-orange-800",
  },
  {
    value: "MAJOR_OUTAGE",
    label: "Major Outage",
    description: "Service is down",
    icon: XCircle,
    color: "text-red-600",
    badge: "bg-red-100 text-red-800",
  },
] as const;

const EMPTY_SERVICE = {
  name: "",
  description: "",
  status: "OPERATIONAL" as ServiceStatus,
};

const formatDate = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getStatusMeta = (status: ServiceStatus) =>
  STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[0];

type ServiceStatus =
  | "OPERATIONAL"
  | "DEGRADED"
  | "PARTIAL_OUTAGE"
  | "MAJOR_OUTAGE";

interface Service {
  id: string;
  name: string;
  description?: string | null;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

type FormState = {
  name: string;
  description: string;
  status: ServiceStatus;
};

type RequestState = "idle" | "loading" | "error" | "success";

type SubmitType = "create" | "update";

export default function ServicesPage() {
  const { user } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<SubmitType>("create");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formState, setFormState] = useState<FormState>(EMPTY_SERVICE);
  const [requestState, setRequestState] = useState<RequestState>("idle");

  const isAdmin = useMemo(() => {
    const username = user?.username?.toLowerCase();
    const hasAdminRole = (user as any)?.organizationMemberships?.some(
      (membership: any) => membership.role?.toLowerCase().includes("admin")
    );
    return username === "admin123" || Boolean(hasAdminRole);
  }, [user]);

  const resetForm = () => {
    setFormState(EMPTY_SERVICE);
    setSelectedService(null);
    setDialogType("create");
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogType("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    setFormState({
      name: service.name,
      description: service.description ?? "",
      status: service.status,
    });
    setDialogType("update");
    setIsDialogOpen(true);
  };

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Service[]>("/api/services");
      setServices(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load services. Please try again or refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestState("loading");
    setError(null);

    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      status: formState.status,
    };

    try {
      if (dialogType === "create") {
        await apiClient.post<Service>("/api/services", payload);
      } else if (selectedService) {
        await apiClient.put<Service>(`/api/services/${selectedService.id}`, payload);
      }
      setRequestState("success");
      setIsDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (err) {
      console.error(err);
      setRequestState("error");
      setError("Unable to save service. Please check your input and try again.");
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await apiClient.delete(`/api/services/${serviceId}`);
      fetchServices();
    } catch (err) {
      console.error(err);
      setError("Failed to delete service. Please try again.");
    }
  };

  const handleStatusChange = async (service: Service, newStatus: ServiceStatus) => {
    try {
      await apiClient.put(`/api/services/${service.id}`, { status: newStatus });
      fetchServices();
    } catch (err) {
      console.error(err);
      setError("Failed to update status. Please try again.");
    }
  };

  const renderStatusSelect = (service: Service) => {
    if (!isAdmin) {
      return (
        <div className="inline-flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium ${getStatusMeta(service.status).badge}`}
          >
            {React.createElement(getStatusMeta(service.status).icon, {
              className: "h-4 w-4",
            })}
            {getStatusMeta(service.status).label}
          </span>
        </div>
      );
    }

    return (
      <Select
        value={service.status}
        onValueChange={(value) => handleStatusChange(service, value as ServiceStatus)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              <div className="flex flex-col">
                <span className="font-semibold">{status.label}</span>
                <span className="text-xs text-muted-foreground">
                  {status.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Manage the services monitored by your status page. Keep statuses up to date so your customers always know what&apos;s happening.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {dialogType === "create" ? "Create Service" : "Update Service"}
                  </DialogTitle>
                  <DialogDescription>
                    {dialogType === "create"
                      ? "Define a new service to monitor. You can update its status at any time."
                      : "Update the details for this service."}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Service Name</Label>
                    <Input
                      id="name"
                      value={formState.name}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="API Gateway"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formState.description}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, description: event.target.value }))
                      }
                      placeholder="Short description of what this service does"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formState.status}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, status: value as ServiceStatus }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex flex-col">
                              <span className="font-semibold">{status.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {status.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && requestState === "error" && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <DialogFooter className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={requestState === "loading"}>
                    {requestState === "loading"
                      ? "Saving..."
                      : dialogType === "create"
                      ? "Create"
                      : "Update"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && requestState !== "error" && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading services...
          </CardContent>
        </Card>
      ) : services.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No services yet</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Create your first service to start tracking its status."
                : "No services have been added yet. Contact your administrator."}
            </CardDescription>
          </CardHeader>
          {isAdmin && (
            <CardFooter>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </CardFooter>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const statusMeta = getStatusMeta(service.status);
            return (
              <Card key={service.id} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{service.name}</CardTitle>
                      {service.description && (
                        <CardDescription className="mt-1">
                          {service.description}
                        </CardDescription>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Current Status
                    </span>
                    {renderStatusSelect(service)}
                    <p className="text-xs text-muted-foreground">
                      {statusMeta.description}
                    </p>
                  </div>

                  <div className="grid gap-1 text-xs text-muted-foreground">
                    <span>
                      Last updated: <strong>{formatDate(service.updatedAt)}</strong>
                    </span>
                    <span>
                      Created: <strong>{formatDate(service.createdAt)}</strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
