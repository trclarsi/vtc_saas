import { StatusDot } from "@vtc/ui";
import { expiryStatus } from "./expiry";

// Affiche une echeance documentaire (permis, assurance, visite technique)
// avec la meme logique de seuil que le widget de conformite du tableau de
// bord (expiry.ts) -- une fiche detail et le dashboard ne doivent jamais
// raconter deux histoires differentes sur la meme donnee.
export function DocumentExpiry({ dateIso }: { dateIso: string | null }) {
  const status = expiryStatus(dateIso);
  if (!status || !dateIso) {
    return <span className="text-neutral">Non renseigné</span>;
  }
  return (
    <StatusDot
      label={`${status.label} — ${new Date(dateIso).toLocaleDateString("fr-FR")}`}
      tone={status.tone}
    />
  );
}
