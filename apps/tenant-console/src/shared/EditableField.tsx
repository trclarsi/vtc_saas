import { useState, type ReactNode } from "react";

// Edition en ligne (clic sur la valeur -> champ modifiable -> "Enregistrer"
// apparait des qu'un champ change) plutot qu'une modale separee -- retour
// utilisateur explicite. Partage entre DriverDetailPage et VehicleDetailPage
// (memes formulaires "fiche detail" avec plusieurs champs modifiables a la
// fois et un seul point de sauvegarde groupe) -- pas de raison de dupliquer.
export function EditableField({
  label,
  value,
  onChange,
  type = "text",
  displayValue,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  // Rendu different en mode lecture (ex. pastille de statut coloree pour une
  // echeance) -- l'edition reste sur la valeur brute, seul l'affichage change.
  displayValue?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-none">
      <span className="font-mono text-[11px] uppercase tracking-wide text-neutral">{label}</span>
      {editing ? (
        <input
          autoFocus
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
          }}
          className="w-56 rounded-lg border border-line bg-surface px-2 py-1 text-right text-sm text-ink focus:border-accent focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded px-1.5 py-0.5 text-right text-sm text-ink transition-colors hover:bg-paper"
        >
          {displayValue ?? (value || <span className="text-neutral">Non renseigné</span>)}
        </button>
      )}
    </div>
  );
}
