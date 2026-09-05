import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CirclePlus } from "lucide-react";
import { useUrlFilters } from "../../shared/useUrlFilters";
import { useBulkAction } from "../../shared/useBulkAction";
import {
  PageHeader,
  DataTable,
  StatusDot,
  Button,
  Card,
  SearchInput,
  TableSkeleton,
  FilterChip,
  ErrorState,
  BulkActionBar,
} from "@vtc/ui";
import type { Vehicle, VehicleStatus } from "@vtc/types";
import { apiClient } from "../../api";
import { VehicleCreateForm } from "./VehicleCreateForm";
import { filterVehicles } from "./filterVehicles";
import { STATUS_LABELS } from "./vehicleLabels";
import { VehicleRowActions } from "./VehicleRowActions";

// Doc 04 §6 — gestion des véhicules
const STATUS_FILTERS: { value: VehicleStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "disponible", label: "Disponibles" },
  { value: "indisponible", label: "Indisponibles" },
  { value: "retire", label: "Retirés" },
];

export function VehiclesPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vehicles"],
    queryFn: apiClient.vehicles.list,
  });
  const { query, setQuery, statusFilter, setStatusFilter } = useUrlFilters<VehicleStatus | "all">("all");

  const filtered = useMemo(
    () => filterVehicles(data ?? [], query, statusFilter),
    [data, query, statusFilter],
  );

  const hasActiveFilter = query.length > 0 || statusFilter !== "all";
  const [formOpen, setFormOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const visibleIds = new Set(filtered.map((v) => v.id));
    setSelectedIds((current) => new Set([...current].filter((id) => visibleIds.has(id))));
  }, [filtered]);

  const selectedVehicles = filtered.filter((v) => selectedIds.has(v.id));
  const eligibleToMakeAvailable = selectedVehicles.filter((v) => v.status === "indisponible");
  const eligibleToMakeUnavailable = selectedVehicles.filter((v) => v.status === "disponible");
  const eligibleToRetire = selectedVehicles.filter((v) => v.status !== "retire");

  const statusBulk = useBulkAction<Vehicle>({
    queryKey: "vehicles",
    action: (v) => apiClient.vehicles.updateStatus(v.id, v.status === "disponible" ? "indisponible" : "disponible"),
    successMessage: (n) => `${n} véhicule${n > 1 ? "s" : ""} mis à jour.`,
  });
  const retireBulk = useBulkAction<Vehicle>({
    queryKey: "vehicles",
    action: (v) => apiClient.vehicles.updateStatus(v.id, "retire"),
    successMessage: (n) => `${n} véhicule${n > 1 ? "s" : ""} retiré${n > 1 ? "s" : ""}.`,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Parc"
        title="Véhicules"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <CirclePlus size={15} />
            Ajouter un véhicule
          </Button>
        }
      />

      <VehicleCreateForm open={formOpen} onClose={() => setFormOpen(false)} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          className="max-w-xs"
          placeholder="Rechercher un véhicule…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un véhicule"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
            />
          ))}
        </div>
      </div>

      <BulkActionBar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              disabled={eligibleToMakeAvailable.length === 0 || statusBulk.isPending}
              onClick={() => statusBulk.mutate(eligibleToMakeAvailable)}
              title={
                eligibleToMakeAvailable.length === 0
                  ? "Aucun véhicule sélectionné n'est indisponible"
                  : undefined
              }
            >
              Marquer disponible ({eligibleToMakeAvailable.length})
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={eligibleToMakeUnavailable.length === 0 || statusBulk.isPending}
              onClick={() => statusBulk.mutate(eligibleToMakeUnavailable)}
              title={
                eligibleToMakeUnavailable.length === 0
                  ? "Aucun véhicule sélectionné n'est disponible"
                  : undefined
              }
            >
              Marquer indisponible ({eligibleToMakeUnavailable.length})
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={eligibleToRetire.length === 0 || retireBulk.isPending}
              onClick={() => retireBulk.mutate(eligibleToRetire)}
              title={
                eligibleToRetire.length === 0 ? "Tous les véhicules sélectionnés sont déjà retirés" : undefined
              }
            >
              Retirer ({eligibleToRetire.length})
            </Button>
          </>
        }
      />

      <Card>
        {isError ? (
          <ErrorState
            title="Impossible de charger les véhicules"
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <TableSkeleton columns={4} />
        ) : (
          <DataTable<Vehicle>
            rows={filtered}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onRowClick={(v) => navigate(`/vehicles/${v.id}`)}
            emptyTitle={hasActiveFilter ? "Aucun résultat" : "Aucun véhicule enregistré"}
            emptyHint={
              hasActiveFilter
                ? "Essayez une autre plaque, marque, modèle ou filtre."
                : "Ajoutez votre premier véhicule pour l'affecter à un chauffeur."
            }
            columns={[
              {
                header: "Immatriculation",
                render: (v) => v.plateNumber,
                mono: true,
                sortKey: (v) => v.plateNumber,
              },
              {
                header: "Marque / Modèle",
                render: (v) => `${v.brand} ${v.model}`,
                sortKey: (v) => `${v.brand} ${v.model}`.toLowerCase(),
              },
              {
                header: "Statut",
                render: (v) => {
                  const status = STATUS_LABELS[v.status];
                  return <StatusDot label={status.label} tone={status.tone} />;
                },
                sortKey: (v) => v.status,
              },
              {
                header: "Chauffeur affecté",
                render: (v) => v.currentDriverId ?? "—",
                mono: true,
              },
              {
                header: "Actions",
                render: (v) => <VehicleRowActions vehicle={v} />,
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
