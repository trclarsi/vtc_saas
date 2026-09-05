import { TONES, type StatusTone } from "./StatusDot";

export interface DistributionSegment {
  label: string;
  value: number;
  tone: StatusTone;
  onClick?: () => void;
}

// Inspire du widget "repartition par statut" de Fleetio (barre segmentee
// coloree + legende cliquable) -- adapte a nos tokens (StatusTone partage
// avec StatusDot, pas de palette dediee) et branche sur de vraies actions :
// chaque segment/legende renvoie vers la liste filtree correspondante
// (reutilise useUrlFilters, B3) plutot que d'etre un graphique statique.
export function DistributionBar({ segments }: { segments: DistributionSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const nonEmpty = segments.filter((s) => s.value > 0);

  if (total === 0) {
    return <div className="h-2 w-full rounded-full bg-paper" />;
  }

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-paper">
        {nonEmpty.map((s) => (
          <div
            key={s.label}
            className={`h-full ${TONES[s.tone]}`}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label} : ${s.value}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) =>
          s.onClick ? (
            <button
              key={s.label}
              onClick={s.onClick}
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-ink transition-opacity hover:opacity-70"
            >
              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${TONES[s.tone]}`} />
              {s.label} <span className="text-neutral">{s.value}</span>
            </button>
          ) : (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-ink"
            >
              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${TONES[s.tone]}`} />
              {s.label} <span className="text-neutral">{s.value}</span>
            </span>
          ),
        )}
      </div>
    </div>
  );
}
