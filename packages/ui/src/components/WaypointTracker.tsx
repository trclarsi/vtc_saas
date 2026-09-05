import type { ReservationStatus } from "@vtc/types";

// Element signature du design system -- le statut d'une reservation EST une
// progression le long d'un trajet (Doc 04 §7), donc une suite d'etapes reliees
// encode une information reelle, ce n'est pas une decoration.
const STEPS: { key: ReservationStatus; label: string }[] = [
  { key: "planifiee", label: "Planifiée" },
  { key: "confirmee", label: "Confirmée" },
  { key: "en_cours", label: "En cours" },
  { key: "terminee", label: "Terminée" },
];

export function WaypointTracker({ status }: { status: ReservationStatus }) {
  if (status === "annulee") {
    return (
      <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-danger">
        Annulée
      </span>
    );
  }

  const currentIndex = STEPS.findIndex((step) => step.key === status);

  return (
    <div className="flex items-center">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <span className="flex items-center" key={step.key}>
            {index > 0 && (
              <span className={`h-0.5 w-[18px] flex-shrink-0 ${isDone || isCurrent ? "bg-teal" : "bg-line"}`} />
            )}
            <span
              title={step.label}
              className={[
                "h-[9px] w-[9px] flex-shrink-0 rounded-full border-2",
                isCurrent
                  ? "border-accent bg-accent ring-4 ring-accent-soft"
                  : isDone
                    ? "border-teal bg-teal"
                    : "border-line bg-surface",
              ].join(" ")}
            />
          </span>
        );
      })}
      <span className="ml-2.5 whitespace-nowrap font-mono text-[11px] uppercase tracking-wide text-neutral">
        {STEPS[currentIndex]?.label}
      </span>
    </div>
  );
}
