import type { Vehicle } from "@vtc/types";
import type { StatusTone } from "@vtc/ui";

// Doc 04 §6 -- partage entre VehiclesPage (liste) et VehicleDetailPage (fiche)
export const STATUS_LABELS: Record<Vehicle["status"], { label: string; tone: StatusTone }> = {
  disponible: { label: "Disponible", tone: "success" },
  indisponible: { label: "Indisponible", tone: "warning" },
  retire: { label: "Retiré", tone: "neutral" },
};
