import type { Driver, DriverAvailabilityStatus, DriverValidationStatus } from "@vtc/types";

export function filterDrivers(
  drivers: Driver[],
  query: string,
  statusFilter: DriverValidationStatus | "all",
  availabilityFilter: DriverAvailabilityStatus | "all" = "all",
): Driver[] {
  const q = query.trim().toLowerCase();
  return drivers.filter((d) => {
    const matchesQuery =
      !q ||
      `${d.firstName} ${d.lastName} ${d.phone} ${d.email ?? ""} ${d.licenseNumber ?? ""}`
        .toLowerCase()
        .includes(q);
    const matchesStatus = statusFilter === "all" || d.validationStatus === statusFilter;
    const matchesAvailability = availabilityFilter === "all" || d.availabilityStatus === availabilityFilter;
    return matchesQuery && matchesStatus && matchesAvailability;
  });
}
