// Doc 05 §3 — module reservations
export type ReservationStatus =
  | "planifiee"
  | "confirmee"
  | "en_cours"
  | "terminee"
  | "annulee";

export interface Reservation {
  id: string;
  tenantId: string;
  passengerUserId: string;
  driverId: string | null;
  vehicleId: string | null;
  scheduledStart: string; // ISO 8601
  scheduledEnd: string; // ISO 8601
  status: ReservationStatus;
  statusChangedAt: string;
  createdBy: string;
  createdAt: string; // ISO 8601 -- Doc 05 §1, convention transverse
  updatedAt: string;
}
