import type { ReactNode } from "react";
import { X } from "lucide-react";

// B4 -- barre d'actions groupees, affichee au-dessus d'un DataTable des qu'une
// selection est non vide. `actions` reste des boutons fournis par l'appelant :
// ce composant ne connait pas les regles metier d'eligibilite (ex. seuls les
// chauffeurs "en_attente" sont validables), c'est a la page de les respecter.
export function BulkActionBar({
  count,
  onClear,
  actions,
}: {
  count: number;
  onClear: () => void;
  actions: ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink bg-ink px-4 py-2.5 text-white">
      <div className="flex items-center gap-3">
        <button
          onClick={onClear}
          aria-label="Désélectionner tout"
          className="rounded p-0.5 transition-colors hover:bg-ink-soft"
        >
          <X size={16} />
        </button>
        <span className="text-[13px] font-medium">
          {count} sélectionné{count > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}
