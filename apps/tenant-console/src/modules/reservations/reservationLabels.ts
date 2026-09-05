import type { ReservationStatus } from "@vtc/types";
import type { StatusTone } from "@vtc/ui";

// Doc 04 §7 -- utilise par DashboardPage (widget de repartition). WaypointTracker
// reste la representation signature dans les tableaux (progression le long
// d'un trajet) ; cette map ne sert que la ou une couleur simple suffit.
export const STATUS_LABELS: Record<ReservationStatus, { label: string; tone: StatusTone }> = {
  planifiee: { label: "Planifiée", tone: "neutral" },
  confirmee: { label: "Confirmée", tone: "info" },
  en_cours: { label: "En cours", tone: "warning" },
  terminee: { label: "Terminée", tone: "success" },
  annulee: { label: "Annulée", tone: "danger" },
};
