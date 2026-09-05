import type { Reservation, ReservationStatus } from "@vtc/types";

export function filterReservations(
  reservations: Reservation[],
  statusFilter: ReservationStatus | "all",
): Reservation[] {
  if (statusFilter === "all") return reservations;
  return reservations.filter((r) => r.status === statusFilter);
}
