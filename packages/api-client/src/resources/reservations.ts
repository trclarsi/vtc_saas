import type { Reservation } from "@vtc/types";
import type { HttpClient } from "../http";

export function createReservationsResource(http: HttpClient) {
  return {
    list: () => http.request<Reservation[]>("/reservations"),
    get: (id: string) => http.request<Reservation>(`/reservations/${id}`),
    // Doc 04 §7, regle 2 -- "annulee" n'est accessible que depuis "planifiee" ou "confirmee".
    // La regle elle-meme est appliquee cote backend ; le frontend ne fait que proposer
    // l'action quand elle est plausible (voir ReservationRowActions).
    cancel: (id: string) => http.request<Reservation>(`/reservations/${id}/cancel`, { method: "PATCH" }),
  };
}
