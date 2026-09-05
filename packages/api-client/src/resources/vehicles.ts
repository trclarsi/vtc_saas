import type { Vehicle, VehicleStatus } from "@vtc/types";
import type { HttpClient } from "../http";

export function createVehiclesResource(http: HttpClient) {
  return {
    list: () => http.request<Vehicle[]>("/vehicles"),
    get: (id: string) => http.request<Vehicle>(`/vehicles/${id}`),
    create: (input: Pick<Vehicle, "plateNumber" | "brand" | "model">) =>
      http.request<Vehicle>("/vehicles", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    // Doc 04 §6, regle 3 -- un vehicule "indisponible" ou "retire" ne peut pas etre affecte.
    updateStatus: (id: string, status: VehicleStatus) =>
      http.request<Vehicle>(`/vehicles/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    // Un chauffeur n'a qu'un seul vehicule courant a la fois -- assigner ce
    // vehicule a un nouveau chauffeur retire automatiquement l'ancien du
    // vehicule qu'il conduisait avant (cote serveur simule, voir handlers.ts).
    assignDriver: (id: string, driverId: string | null) =>
      http.request<Vehicle>(`/vehicles/${id}/assign-driver`, {
        method: "PATCH",
        body: JSON.stringify({ driverId }),
      }),
  };
}
