import type { Driver } from "@vtc/types";
import type { StatusTone } from "@vtc/ui";

// Doc 04 §5 -- partage entre DriversPage (liste) et DriverDetailPage (fiche)
export const VALIDATION_LABELS: Record<Driver["validationStatus"], { label: string; tone: StatusTone }> = {
  en_attente: { label: "En attente", tone: "warning" },
  valide: { label: "Validé", tone: "success" },
  rejete: { label: "Rejeté", tone: "danger" },
};

export const AVAILABILITY_LABELS: Record<Driver["availabilityStatus"], { label: string; tone: StatusTone }> = {
  disponible: { label: "Disponible", tone: "success" },
  hors_ligne: { label: "Hors ligne", tone: "neutral" },
  en_course: { label: "En course", tone: "info" },
};
