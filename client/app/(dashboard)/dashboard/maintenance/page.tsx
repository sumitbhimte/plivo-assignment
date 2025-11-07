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
  Calendar,
  XCircle,
  Pencil,
  Trash2,
  Plus,
  Clock,
  Wrench,
} from "lucide-react";

const STATUS_OPTIONS = [
  {
    value: "SCHEDULED",
    label: "Scheduled",
    description: "Maintenance is scheduled",
    icon: Calendar,
    color: "text-blue-600",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    description: "Maintenance is currently happening",
    icon: Wrench,
    color: "text-orange-600",
    badge: "bg-orange-100 text-orange-800",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    description: "Maintenance has been completed",
    icon: CheckCircle2,
    color: "text-green-600",
    badge: "bg-green-100 text-green-800",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    description: "Maintenance was cancelled",
    icon: XCircle,
    color: "text-gray-600",
    badge: "bg-gray-100 text-gray-800",
  },
] as const;

const EMPTY_MAINTENANCE = {
  title: "",
  description: "",
  scheduledStart: "",
  scheduledEnd: "",
  status: "SCHEDULED" as MaintenanceStatus,
  serviceIds: [] as string[],
};

const formatDate = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDateTimeLocal = (date: string) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getStatusMeta = (status: MaintenanceStatus) =>
  STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[0];

type MaintenanceStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

interface Service {
  id: string;
  name: string;
}

interface ServiceMaintenance {
  service: Service;
}

interface Maintenance {
  id: string;
  title: string;
  description?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  services?: ServiceMaintenance[];
}

type FormState = {
  title: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: MaintenanceStatus;
  serviceIds: string[];
};

type RequestState = "idle" | "loading" | "error" | "success";
type SubmitType = "create" | "update";

export default function MaintenancePage() {
  const { user } = useUser();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<SubmitType>("create");
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [formState, setFormState] = useState<FormState>(EMPTY_MAINTENANCE);
  const [requestState, setRequestState] = useState<RequestState>("idle");

  const isAdmin = useMemo(() => {
    const username = user?.username?.toLowerCase();
    const hasAdminRole = (user as any)?.organizationMemberships?.some(
      (membership: any) => membership.role?.toLowerCase().includes("admin")
    );
    return username === "admin123" || Boolean(hasAdminRole);
  }, [user]);

  const resetForm = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setFormState({
      ...EMPTY_MAINTENANCE,
      scheduledStart: formatDateTimeLocal(now.toISOString()),
      scheduledEnd: formatDateTimeLocal(oneHourLater.toISOString()),
    });
    setSelectedMaintenance(null);
    setDialogType("create");
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogType("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setFormState({
      title: maintenance.title,
      description: maintenance.description ?? "",
      scheduledStart: formatDateTimeLocal(maintenance.scheduledStart),
      scheduledEnd: formatDateTimeLocal(maintenance.scheduledEnd),
      status: maintenance.status,
      serviceIds: maintenance.services?.map((sm) => sm.service.id) ?? [],
    });
    setDialogType("update");
    setIsDialogOpen(true);
  };

  const fetchServices = async () => {
    try {
      const data = await apiClient.get<Service[]>("/api/services");
      setServices(data);
    } catch (err) {
      console.error("Failed to load services:", err);
    }
  };

  const fetchMaintenances = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Maintenance[]>("/api/maintenance");
      setMaintenances(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load maintenance windows. Please try again or refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchMaintenances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestState("loading");
    setError(null);

    // Validate dates
    const startDate = new Date(formState.scheduledStart);
    const endDate = new Date(formState.scheduledEnd);

    if (endDate <= startDate) {
      setError("End time must be after start time.");
      setRequestState("error");
      return;
    }

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      scheduledStart: new Date(formState.scheduledStart).toISOString(),
      scheduledEnd: new Date(formState.scheduledEnd).toISOString(),
      status: formState.status,
      serviceIds: formState.serviceIds,
    };

    try {
      if (dialogType === "create") {
        await apiClient.post<Maintenance>("/api/maintenance", payload);
      } else if (selectedMaintenance) {
        await apiClient.put<Maintenance>(
          `/api/maintenance/${selectedMaintenance.id}`,
          payload
        );
      }
      setRequestState("success");
      setIsDialogOpen(false);
      resetForm();
      fetchMaintenances();
    } catch (err) {
      console.error(err);
      setRequestState("error");
      setError("Unable to save maintenance window. Please check your input and try again.");
    }
  };

  const handleDelete = async (maintenanceId: string) => {
    if (!confirm("Are you sure you want to delete this maintenance window?")) return;
    try {
      await apiClient.delete(`/api/maintenance/${maintenanceId}`);
      fetchMaintenances();
    } catch (err) {
      console.error(err);
      setError("Failed to delete maintenance window. Please try again.");
    }
  };

  const handleStatusChange = async (
    maintenance: Maintenance,
    newStatus: MaintenanceStatus
  ) => {
    try {
      await apiClient.put(`/api/maintenance/${maintenance.id}`, { status: newStatus });
      fetchMaintenances();
    } catch (err) {
      console.error(err);
      setError("Failed to update status. Please try again.");
    }
  };

  const renderStatusSelect = (maintenance: Maintenance) => {
    if (!isAdmin) {
      return (
        <div className="inline-flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium ${getStatusMeta(maintenance.status).badge}`}
          >
            {React.createElement(getStatusMeta(maintenance.status).icon, {
              className: "h-4 w-4",
            })}
            {getStatusMeta(maintenance.status).label}
          </span>
        </div>
      );
    }

    return (
      <Select
        value={maintenance.status}
        onValueChange={(value) =>
          handleStatusChange(maintenance, value as MaintenanceStatus)
        }
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

  const getTimeUntil = (date: string) => {
    const now = new Date();
    const target = new Date(date);
    const diff = target.getTime() - now.getTime();

    if (diff < 0) {
      return "Past";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Schedule and manage maintenance windows for your services. Keep your customers informed about planned downtime.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {dialogType === "create"
                      ? "Schedule Maintenance"
                      : "Update Maintenance"}
                  </DialogTitle>
                  <DialogDescription>
                    {dialogType === "create"
                      ? "Schedule a new maintenance window for your services."
                      : "Update the details for this maintenance window."}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formState.title}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="Database maintenance"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formState.description}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Describe what maintenance will be performed..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="scheduledStart">Start Time</Label>
                      <Input
                        id="scheduledStart"
                        type="datetime-local"
                        value={formState.scheduledStart}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            scheduledStart: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="scheduledEnd">End Time</Label>
                      <Input
                        id="scheduledEnd"
                        type="datetime-local"
                        value={formState.scheduledEnd}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            scheduledEnd: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formState.status}
                      onValueChange={(value) =>
                        setFormState((prev) => ({
                          ...prev,
                          status: value as MaintenanceStatus,
                        }))
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

                  <div className="grid gap-2">
                    <Label htmlFor="services">Affected Services</Label>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!formState.serviceIds.includes(value)) {
                          setFormState((prev) => ({
                            ...prev,
                            serviceIds: [...prev.serviceIds, value],
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select services..." />
                      </SelectTrigger>
                      <SelectContent>
                        {services
                          .filter((s) => !formState.serviceIds.includes(s.id))
                          .map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {formState.serviceIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formState.serviceIds.map((serviceId) => {
                          const service = services.find((s) => s.id === serviceId);
                          return (
                            <span
                              key={serviceId}
                              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                            >
                              {service?.name}
                              <button
                                type="button"
                                onClick={() =>
                                  setFormState((prev) => ({
                                    ...prev,
                                    serviceIds: prev.serviceIds.filter(
                                      (id) => id !== serviceId
                                    ),
                                  }))
                                }
                                className="hover:text-blue-600"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
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
                      ? "Schedule"
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
            Loading maintenance windows...
          </CardContent>
        </Card>
      ) : maintenances.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No maintenance scheduled</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Schedule your first maintenance window."
                : "No maintenance windows have been scheduled yet."}
            </CardDescription>
          </CardHeader>
          {isAdmin && (
            <CardFooter>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" /> Schedule Maintenance
              </Button>
            </CardFooter>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {maintenances.map((maintenance) => {
            const statusMeta = getStatusMeta(maintenance.status);
            const isUpcoming =
              maintenance.status === "SCHEDULED" &&
              new Date(maintenance.scheduledStart) > new Date();
            return (
              <Card key={maintenance.id} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{maintenance.title}</CardTitle>
                      {maintenance.description && (
                        <CardDescription className="mt-1">
                          {maintenance.description}
                        </CardDescription>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(maintenance)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(maintenance.id)}
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
                      Status
                    </span>
                    {renderStatusSelect(maintenance)}
                    <p className="text-xs text-muted-foreground">
                      {statusMeta.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">Start</div>
                        <div className="text-muted-foreground">
                          {formatDate(maintenance.scheduledStart)}
                        </div>
                        {isUpcoming && (
                          <div className="text-xs text-blue-600 mt-1">
                            In {getTimeUntil(maintenance.scheduledStart)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">End</div>
                        <div className="text-muted-foreground">
                          {formatDate(maintenance.scheduledEnd)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {maintenance.services && maintenance.services.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Affected Services
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {maintenance.services.map((sm) => (
                          <span
                            key={sm.service.id}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                          >
                            {sm.service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-1 text-xs text-muted-foreground">
                    <span>
                      Created: <strong>{formatDate(maintenance.createdAt)}</strong>
                    </span>
                    <span>
                      Last updated: <strong>{formatDate(maintenance.updatedAt)}</strong>
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
