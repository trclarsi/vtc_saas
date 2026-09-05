import type { Driver } from "@vtc/types";
import type { HttpClient } from "../http";

export function createDriversResource(http: HttpClient) {
  return {
    list: () => http.request<Driver[]>("/drivers"),
    get: (id: string) => http.request<Driver>(`/drivers/${id}`),
    create: (input: Pick<Driver, "firstName" | "lastName" | "phone"> & Partial<Pick<Driver, "email" | "licenseNumber">>) =>
      http.request<Driver>("/drivers", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (
      id: string,
      input: Partial<
        Pick<
          Driver,
          | "firstName"
          | "lastName"
          | "phone"
          | "email"
          | "licenseNumber"
          | "licenseExpiresAt"
          | "availabilityStatus"
          | "avatarUrl"
        >
      >,
    ) =>
      http.request<Driver>(`/drivers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    // Doc 04 §5, regle 2 -- seul un chauffeur "valide" est affectable a une reservation.
    validate: (id: string) => http.request<Driver>(`/drivers/${id}/validate`, { method: "PATCH" }),
    reject: (id: string) => http.request<Driver>(`/drivers/${id}/reject`, { method: "PATCH" }),
    // Retire un chauffeur des listes/actions actives sans supprimer son
    // historique de courses -- jamais de suppression definitive (Reservation
    // reference toujours son driverId).
    archive: (id: string) => http.request<Driver>(`/drivers/${id}/archive`, { method: "PATCH" }),
    unarchive: (id: string) => http.request<Driver>(`/drivers/${id}/unarchive`, { method: "PATCH" }),
  };
}
