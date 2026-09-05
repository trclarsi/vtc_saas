import { Car } from "lucide-react";
import { Card, StatusDot } from "@vtc/ui";
import type { Driver, Vehicle } from "@vtc/types";
import { STATUS_LABELS } from "./vehicleLabels";
import { DocumentExpiry } from "../../shared/DocumentExpiry";
import { VehicleRowActions } from "./VehicleRowActions";

// Vue carte (miroir de DriverCard) -- pas de photo de vehicule pour l'instant
// (differe, cf. plan), un pictogramme suffit a distinguer visuellement une
// carte d'une autre dans le flux, contrairement a un avatar qui porte une
// vraie information (l'identite du chauffeur).
export function VehicleCard({
  vehicle,
  assignedDriver,
  selected,
  onToggleSelect,
  onClick,
}: {
  vehicle: Vehicle;
  assignedDriver: Driver | null;
  selected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}) {
  const status = STATUS_LABELS[vehicle.status];

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
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink-soft text-white">
            <Car size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-semibold text-ink">{vehicle.plateNumber}</p>
            <p className="truncate text-[12px] text-neutral">
              {vehicle.brand} {vehicle.model}
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Sélectionner ${vehicle.plateNumber}`}
          className="mt-1 h-4 w-4 flex-shrink-0 accent-ink"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3">
        <StatusDot label={status.label} tone={status.tone} />
        <span className="text-[13px] text-neutral">
          {assignedDriver ? `${assignedDriver.firstName} ${assignedDriver.lastName}` : "Aucun chauffeur"}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-neutral">
        <DocumentExpiry dateIso={vehicle.insuranceExpiresAt} />
        <DocumentExpiry dateIso={vehicle.inspectionExpiresAt} />
      </div>

      <div className="flex justify-end border-t border-line pt-3">
        <VehicleRowActions vehicle={vehicle} />
      </div>
    </Card>
  );
}
