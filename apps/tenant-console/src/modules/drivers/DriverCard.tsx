import { Avatar, Card, StatusDot } from "@vtc/ui";
import type { Driver } from "@vtc/types";
import { VALIDATION_LABELS, AVAILABILITY_LABELS } from "./driverLabels";
import { DocumentExpiry } from "../../shared/DocumentExpiry";
import { DriverRowActions } from "./DriverRowActions";

// Vue carte (alternative a DataTable, B1) -- utile pour reperer visuellement
// un chauffeur (photo, statuts) plutot que scanner une ligne de tableau.
// Reprend les memes libelles/actions que la vue liste pour ne jamais raconter
// deux histoires differentes du meme chauffeur selon la vue choisie.
export function DriverCard({
  driver,
  selected,
  onToggleSelect,
  onClick,
}: {
  driver: Driver;
  selected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}) {
  const validation = VALIDATION_LABELS[driver.validationStatus];
  const availability = AVAILABILITY_LABELS[driver.availabilityStatus];

  return (
    <Card
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-paper"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar firstName={driver.firstName} lastName={driver.lastName} avatarUrl={driver.avatarUrl} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
              {driver.firstName} {driver.lastName}
              {driver.archivedAt && (
                <span className="rounded-md bg-paper px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-neutral">
                  Archivé
                </span>
              )}
            </p>
            <p className="truncate font-mono text-[12px] text-neutral">{driver.phone}</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Sélectionner ${driver.firstName} ${driver.lastName}`}
          className="mt-1 h-4 w-4 flex-shrink-0 accent-ink"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3">
        <StatusDot label={validation.label} tone={validation.tone} />
        <StatusDot label={availability.label} tone={availability.tone} />
      </div>

      <div className="text-[13px] text-neutral">
        <DocumentExpiry dateIso={driver.licenseExpiresAt} />
      </div>

      <div className="flex justify-end border-t border-line pt-3">
        <DriverRowActions driver={driver} />
      </div>
    </Card>
  );
}
