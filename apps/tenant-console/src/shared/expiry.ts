import type { StatusTone } from "@vtc/ui";

const WARNING_WINDOW_DAYS = 30;

export interface ExpiryStatus {
  tone: StatusTone;
  label: string;
  daysLeft: number;
}

// Doc 04 §5/§6 (implicite) -- une echeance documentaire (permis, assurance,
// visite technique) est un risque reglementaire concret, pas un confort
// d'affichage. Seuil unique partage entre la fiche detail et le widget de
// conformite du tableau de bord pour que les deux racontent la meme chose.
export function expiryStatus(dateIso: string | null): ExpiryStatus | null {
  if (!dateIso) return null;
  const daysLeft = Math.ceil((new Date(dateIso).getTime() - Date.now()) / 86_400_000);
  if (daysLeft < 0) return { tone: "danger", label: "Expiré", daysLeft };
  if (daysLeft <= WARNING_WINDOW_DAYS) return { tone: "warning", label: `Expire dans ${daysLeft} j`, daysLeft };
  return { tone: "success", label: "À jour", daysLeft };
}

export function isExpiryUrgent(status: ExpiryStatus | null): boolean {
  return status !== null && status.tone !== "success";
}
