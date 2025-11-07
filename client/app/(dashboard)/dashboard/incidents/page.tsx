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
  Search,
  XCircle,
  Pencil,
  Trash2,
  Plus,
  MessageSquare,
  Clock,
} from "lucide-react";

const STATUS_OPTIONS = [
  {
    value: "INVESTIGATING",
    label: "Investigating",
    description: "We're looking into the issue",
    icon: Search,
    color: "text-blue-600",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    value: "IDENTIFIED",
    label: "Identified",
    description: "We've identified the cause",
    icon: AlertCircle,
    color: "text-yellow-600",
    badge: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "MONITORING",
    label: "Monitoring",
    description: "We're monitoring the fix",
    icon: Clock,
    color: "text-orange-600",
    badge: "bg-orange-100 text-orange-800",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
    description: "Issue has been resolved",
    icon: CheckCircle2,
    color: "text-green-600",
    badge: "bg-green-100 text-green-800",
  },
] as const;

const IMPACT_OPTIONS = [
  { value: "NONE", label: "None", badge: "bg-gray-100 text-gray-800" },
  { value: "MINOR", label: "Minor", badge: "bg-yellow-100 text-yellow-800" },
  { value: "MAJOR", label: "Major", badge: "bg-orange-100 text-orange-800" },
  { value: "CRITICAL", label: "Critical", badge: "bg-red-100 text-red-800" },
] as const;

const EMPTY_INCIDENT = {
  title: "",
  description: "",
  status: "INVESTIGATING" as IncidentStatus,
  impact: "MAJOR" as IncidentImpact,
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

const getStatusMeta = (status: IncidentStatus) =>
  STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[0];

const getImpactMeta = (impact: IncidentImpact) =>
  IMPACT_OPTIONS.find((option) => option.value === impact) ?? IMPACT_OPTIONS[2];

type IncidentStatus =
  | "INVESTIGATING"
  | "IDENTIFIED"
  | "MONITORING"
  | "RESOLVED";

type IncidentImpact = "NONE" | "MINOR" | "MAJOR" | "CRITICAL";

interface Service {
  id: string;
  name: string;
}

interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  message: string;
  createdAt: string;
}

interface ServiceIncident {
  service: Service;
}

interface Incident {
  id: string;
  title: string;
  description?: string | null;
  status: IncidentStatus;
  impact: IncidentImpact;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  services?: ServiceIncident[];
  updates?: IncidentUpdate[];
}

type FormState = {
  title: string;
  description: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  serviceIds: string[];
};

type RequestState = "idle" | "loading" | "error" | "success";
type SubmitType = "create" | "update";

export default function IncidentsPage() {
  const { user } = useUser();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [dialogType, setDialogType] = useState<SubmitType>("create");
  const [formState, setFormState] = useState<FormState>(EMPTY_INCIDENT);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateStatus, setUpdateStatus] = useState<IncidentStatus>("INVESTIGATING");
  const [requestState, setRequestState] = useState<RequestState>("idle");

  const isAdmin = useMemo(() => {
    const username = user?.username?.toLowerCase();
    const hasAdminRole = (user as any)?.organizationMemberships?.some(
      (membership: any) => membership.role?.toLowerCase().includes("admin")
    );
    return username === "admin123" || Boolean(hasAdminRole);
  }, [user]);

  const resetForm = () => {
    setFormState(EMPTY_INCIDENT);
    setSelectedIncident(null);
    setDialogType("create");
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogType("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (incident: Incident) => {
    setSelectedIncident(incident);
    setFormState({
      title: incident.title,
      description: incident.description ?? "",
      status: incident.status,
      impact: incident.impact,
      serviceIds: incident.services?.map((si) => si.service.id) ?? [],
    });
    setDialogType("update");
    setIsDialogOpen(true);
  };

  const openUpdateDialog = (incident: Incident) => {
    setSelectedIncident(incident);
    setUpdateStatus(incident.status);
    setUpdateMessage("");
    setIsUpdateDialogOpen(true);
  };

  const fetchServices = async () => {
    try {
      const data = await apiClient.get<Service[]>("/api/services");
      setServices(data);
    } catch (err) {
      console.error("Failed to load services:", err);
    }
  };

  const fetchIncidents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Incident[]>("/api/incidents");
      setIncidents(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load incidents. Please try again or refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestState("loading");
    setError(null);

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      status: formState.status,
      impact: formState.impact,
      serviceIds: formState.serviceIds,
    };

    try {
      if (dialogType === "create") {
        await apiClient.post<Incident>("/api/incidents", payload);
      } else if (selectedIncident) {
        await apiClient.put<Incident>(`/api/incidents/${selectedIncident.id}`, payload);
      }
      setRequestState("success");
      setIsDialogOpen(false);
      resetForm();
      fetchIncidents();
    } catch (err) {
      console.error(err);
      setRequestState("error");
      setError("Unable to save incident. Please check your input and try again.");
    }
  };

  const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedIncident || !updateMessage.trim()) return;

    setRequestState("loading");
    setError(null);

    try {
      await apiClient.post(`/api/incidents/${selectedIncident.id}/updates`, {
        status: updateStatus,
        message: updateMessage.trim(),
      });
      setRequestState("success");
      setIsUpdateDialogOpen(false);
      setUpdateMessage("");
      fetchIncidents();
    } catch (err) {
      console.error(err);
      setRequestState("error");
      setError("Unable to add update. Please try again.");
    }
  };

  const handleDelete = async (incidentId: string) => {
    if (!confirm("Are you sure you want to delete this incident?")) return;
    try {
      await apiClient.delete(`/api/incidents/${incidentId}`);
      fetchIncidents();
    } catch (err) {
      console.error(err);
      setError("Failed to delete incident. Please try again.");
    }
  };

  const handleStatusChange = async (incident: Incident, newStatus: IncidentStatus) => {
    try {
      await apiClient.put(`/api/incidents/${incident.id}`, { status: newStatus });
      fetchIncidents();
    } catch (err) {
      console.error(err);
      setError("Failed to update status. Please try again.");
    }
  };

  const renderStatusSelect = (incident: Incident) => {
    if (!isAdmin) {
      return (
        <div className="inline-flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium ${getStatusMeta(incident.status).badge}`}
          >
            {React.createElement(getStatusMeta(incident.status).icon, {
              className: "h-4 w-4",
            })}
            {getStatusMeta(incident.status).label}
          </span>
        </div>
      );
    }

    return (
      <Select
        value={incident.status}
        onValueChange={(value) => handleStatusChange(incident, value as IncidentStatus)}
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
      <h1 className="text-3xl font-bold">Incidents</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Track and manage incidents affecting your services. Keep your customers informed with regular updates.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {dialogType === "create" ? "Create Incident" : "Update Incident"}
                  </DialogTitle>
                  <DialogDescription>
                    {dialogType === "create"
                      ? "Report a new incident affecting your services."
                      : "Update the details for this incident."}
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
                      placeholder="Service outage"
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
                      placeholder="Describe what's happening..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formState.status}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, status: value as IncidentStatus }))
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
                    <Label htmlFor="impact">Impact</Label>
                    <Select
                      value={formState.impact}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, impact: value as IncidentImpact }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMPACT_OPTIONS.map((impact) => (
                          <SelectItem key={impact.value} value={impact.value}>
                            {impact.label}
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
                                    serviceIds: prev.serviceIds.filter((id) => id !== serviceId),
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
            Loading incidents...
          </CardContent>
        </Card>
      ) : incidents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No incidents yet</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Create your first incident to start tracking issues."
                : "No incidents have been reported yet."}
            </CardDescription>
          </CardHeader>
          {isAdmin && (
            <CardFooter>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" /> Create Incident
              </Button>
            </CardFooter>
          )}
        </Card>
      ) : (
        <div className="grid gap-6">
          {incidents.map((incident) => {
            const statusMeta = getStatusMeta(incident.status);
            const impactMeta = getImpactMeta(incident.impact);
            return (
              <Card key={incident.id} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle>{incident.title}</CardTitle>
                      {incident.description && (
                        <CardDescription className="mt-1">
                          {incident.description}
                        </CardDescription>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openUpdateDialog(incident)}
                          title="Add update"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(incident)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(incident.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm font-semibold text-muted-foreground">
                          Status
                        </span>
                        <div className="mt-1">{renderStatusSelect(incident)}</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-muted-foreground">
                          Impact
                        </span>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${impactMeta.badge}`}
                          >
                            {impactMeta.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {incident.services && incident.services.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Affected Services
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {incident.services.map((si) => (
                          <span
                            key={si.service.id}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                          >
                            {si.service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {incident.updates && incident.updates.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Updates
                      </span>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {incident.updates.map((update) => (
                          <div
                            key={update.id}
                            className="rounded-lg border bg-muted/50 p-3 text-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">
                                {getStatusMeta(update.status).label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(update.createdAt)}
                              </span>
                            </div>
                            <p className="text-muted-foreground">{update.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-1 text-xs text-muted-foreground">
                    <span>
                      Created: <strong>{formatDate(incident.createdAt)}</strong>
                    </span>
                    {incident.resolvedAt && (
                      <span>
                        Resolved: <strong>{formatDate(incident.resolvedAt)}</strong>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Add Update</DialogTitle>
              <DialogDescription>
                Add an update to keep users informed about this incident.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="update-status">Status</Label>
                <Select
                  value={updateStatus}
                  onValueChange={(value) => setUpdateStatus(value as IncidentStatus)}
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
                <Label htmlFor="update-message">Message</Label>
                <Textarea
                  id="update-message"
                  value={updateMessage}
                  onChange={(event) => setUpdateMessage(event.target.value)}
                  placeholder="Provide an update on the incident..."
                  rows={4}
                  required
                />
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
                  setIsUpdateDialogOpen(false);
                  setUpdateMessage("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={requestState === "loading"}>
                {requestState === "loading" ? "Adding..." : "Add Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
