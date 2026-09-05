import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CalendarPlus } from "lucide-react";
import {
  PageHeader,
  DataTable,
  WaypointTracker,
  Button,
  Card,
  TableSkeleton,
  FilterChip,
  ErrorState,
  BulkActionBar,
} from "@vtc/ui";
import type { Reservation, ReservationStatus } from "@vtc/types";
import { apiClient } from "../../api";
import { filterReservations } from "./filterReservations";
import { ReservationRowActions } from "./ReservationRowActions";
import { useUrlFilters } from "../../shared/useUrlFilters";
import { useBulkAction } from "../../shared/useBulkAction";
import { useTenantTimeZone } from "../../shared/useTenantTimeZone";
import { formatDateTime } from "../../shared/formatDateTime";

// Doc 04 §7 — réservations et planning
const STATUS_FILTERS: { value: ReservationStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "planifiee", label: "Planifiées" },
  { value: "confirmee", label: "Confirmées" },
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminées" },
  { value: "annulee", label: "Annulées" },
];

export function ReservationsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reservations"],
    queryFn: apiClient.reservations.list,
  });
  const { statusFilter, setStatusFilter } = useUrlFilters<ReservationStatus | "all">("all");
  const timeZone = useTenantTimeZone();

  const filtered = useMemo(
    () => filterReservations(data ?? [], statusFilter),
    [data, statusFilter],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const visibleIds = new Set(filtered.map((r) => r.id));
    setSelectedIds((current) => new Set([...current].filter((id) => visibleIds.has(id))));
  }, [filtered]);

  const selectedReservations = filtered.filter((r) => selectedIds.has(r.id));
  const eligibleToCancel = selectedReservations.filter(
    (r) => r.status === "planifiee" || r.status === "confirmee",
  );

  const cancelBulk = useBulkAction<Reservation>({
    queryKey: "reservations",
    action: (r) => apiClient.reservations.cancel(r.id),
    successMessage: (n) => `${n} réservation${n > 1 ? "s" : ""} annulée${n > 1 ? "s" : ""}.`,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Activité"
        title="Réservations"
        actions={
          <Button
            disabled
            title="Nécessite un mécanisme de sélection du passager, pas encore disponible côté API"
          >
            <CalendarPlus size={15} />
            Nouvelle réservation
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={statusFilter === f.value}
            onClick={() => setStatusFilter(f.value)}
          />
        ))}
      </div>

      <BulkActionBar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={
          <Button
            size="sm"
            variant="secondary"
            disabled={eligibleToCancel.length === 0 || cancelBulk.isPending}
            onClick={() => cancelBulk.mutate(eligibleToCancel)}
            title={
              eligibleToCancel.length === 0
                ? "Aucune réservation sélectionnée n'est planifiée ou confirmée"
                : undefined
            }
          >
            Annuler ({eligibleToCancel.length})
          </Button>
        }
      />

      <Card>
        {isError ? (
          <ErrorState
            title="Impossible de charger les réservations"
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <TableSkeleton columns={4} />
        ) : (
          <DataTable<Reservation>
            rows={filtered}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onRowClick={(r) => navigate(`/reservations/${r.id}`)}
            emptyTitle={statusFilter === "all" ? "Aucune réservation planifiée" : "Aucun résultat"}
            emptyHint={
              statusFilter === "all"
                ? "Le planning de ce tenant est vide pour le moment."
                : "Essayez un autre filtre de statut."
            }
            columns={[
              {
                header: "Créneau",
                render: (r) => formatDateTime(r.scheduledStart, timeZone),
                mono: true,
                sortKey: (r) => r.scheduledStart,
              },
              { header: "Chauffeur", render: (r) => r.driverId ?? "Non affecté", mono: true },
              { header: "Véhicule", render: (r) => r.vehicleId ?? "Non affecté", mono: true },
              {
                header: "Progression",
                render: (r) => <WaypointTracker status={r.status} />,
                sortKey: (r) => r.status,
              },
              {
                header: "Actions",
                render: (r) => <ReservationRowActions reservation={r} />,
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
