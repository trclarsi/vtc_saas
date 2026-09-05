// Doc 05 §3 — module vehicles
export type VehicleStatus = "disponible" | "indisponible" | "retire";

export interface Vehicle {
  id: string;
  tenantId: string;
  plateNumber: string;
  brand: string;
  model: string;
  status: VehicleStatus;
  currentDriverId: string | null; // reference logique, sans FK physique (Doc 05 §2)
  // Echeances documentaires -- assurance et visite technique, les deux points
  // de blocage reglementaire concrets pour un VTC (contrairement a une simple
  // preference d'affichage). null tant que le document n'a pas ete saisi.
  insuranceExpiresAt: string | null;
  inspectionExpiresAt: string | null;
  createdAt: string; // ISO 8601 -- Doc 05 §1, convention transverse
  updatedAt: string;
}
