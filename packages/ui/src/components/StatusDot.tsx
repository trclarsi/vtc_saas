// Exporte pour etre reutilise par tout composant qui doit colorer par tone
// sans dupliquer le mapping (ex. DistributionBar).
export const TONES = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
  info: "bg-teal",
} as const;

// Bande de bord gauche pour les lignes/cartes porteuses d'un statut (ex.
// echeances de conformite) -- meme mapping de tonalite que TONES, applique a
// border-l plutot qu'a bg.
export const TONE_BORDERS = {
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
  neutral: "border-neutral",
  info: "border-teal",
} as const;

export type StatusTone = keyof typeof TONES;

export function StatusDot({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-ink">
      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${TONES[tone]}`} />
      {label}
    </span>
  );
}
