import type { User } from "@vtc/types";
import type { StatusTone } from "@vtc/ui";

// Doc 04 §4 -- partage entre UsersPage (liste) et ProfilePage (C2)
export const STATUS_LABELS: Record<User["status"], { label: string; tone: StatusTone }> = {
  actif: { label: "Actif", tone: "success" },
  invite: { label: "Invité", tone: "warning" },
  suspendu: { label: "Suspendu", tone: "danger" },
};
