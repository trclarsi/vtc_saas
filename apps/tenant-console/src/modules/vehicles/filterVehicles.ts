import type { Vehicle, VehicleStatus } from "@vtc/types";

export function filterVehicles(
  vehicles: Vehicle[],
  query: string,
  statusFilter: VehicleStatus | "all",
): Vehicle[] {
  const q = query.trim().toLowerCase();
  return vehicles.filter((v) => {
    const matchesQuery = !q || `${v.plateNumber} ${v.brand} ${v.model}`.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
}
