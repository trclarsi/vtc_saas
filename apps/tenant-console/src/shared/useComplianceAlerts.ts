import { useQuery } from "@tanstack/react-query";
import { useSession, hasRole } from "@vtc/auth";
import { apiClient } from "../api";
import { expiryStatus, isExpiryUrgent } from "./expiry";

export interface ComplianceEntry {
  key: string;
  label: string;
  document: string;
  daysLeft: number;
  tone: "danger" | "warning";
  href: string;
}

export interface PendingDriverEntry {
  key: string;
  firstName: string;
  lastName: string;
  phone: string;
  href: string;
}

// Partage entre DashboardPage (widgets) et NotificationBell (menu global) --
// une seule source pour "qu'est-ce qui a besoin d'attention", pour ne jamais
// raconter deux histoires differentes du meme signal a deux endroits.
export function useComplianceAlerts() {
  const session = useSession();
  const driversQuery = useQuery({ queryKey: ["drivers"], queryFn: apiClient.drivers.list });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles"], queryFn: apiClient.vehicles.list });

  const canSeeVehicles = hasRole(session, "admin_tenant", "fleet_manager");
  const drivers = driversQuery.data ?? [];
  const vehicles = vehiclesQuery.data ?? [];

  const pendingDrivers: PendingDriverEntry[] = drivers
    .filter((d) => d.validationStatus === "en_attente")
    .map((d) => ({
      key: `pending-${d.id}`,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      href: `/drivers/${d.id}`,
    }));

  const complianceEntries: ComplianceEntry[] = [];
  for (const d of drivers) {
    const status = expiryStatus(d.licenseExpiresAt);
    if (isExpiryUrgent(status)) {
      complianceEntries.push({
        key: `drv-${d.id}`,
        label: `${d.firstName} ${d.lastName}`,
        document: "Permis de conduire",
        daysLeft: status!.daysLeft,
        tone: status!.tone as "danger" | "warning",
        href: `/drivers/${d.id}`,
      });
    }
  }
  if (canSeeVehicles) {
    for (const v of vehicles) {
      const insurance = expiryStatus(v.insuranceExpiresAt);
      if (isExpiryUrgent(insurance)) {
        complianceEntries.push({
          key: `veh-${v.id}-insurance`,
          label: v.plateNumber,
          document: "Assurance",
          daysLeft: insurance!.daysLeft,
          tone: insurance!.tone as "danger" | "warning",
          href: `/vehicles/${v.id}`,
        });
      }
      const inspection = expiryStatus(v.inspectionExpiresAt);
      if (isExpiryUrgent(inspection)) {
        complianceEntries.push({
          key: `veh-${v.id}-inspection`,
          label: v.plateNumber,
          document: "Visite technique",
          daysLeft: inspection!.daysLeft,
          tone: inspection!.tone as "danger" | "warning",
          href: `/vehicles/${v.id}`,
        });
      }
    }
  }
  complianceEntries.sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    pendingDrivers,
    complianceEntries,
    isLoading: driversQuery.isLoading || vehiclesQuery.isLoading,
  };
}
