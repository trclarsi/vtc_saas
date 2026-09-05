import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CirclePlus, List, LayoutGrid } from "lucide-react";
import { useUrlFilters } from "../../shared/useUrlFilters";
import { useBulkAction } from "../../shared/useBulkAction";
import {
  PageHeader,
  DataTable,
  StatusDot,
  Button,
  Card,
  SearchInput,
  Select,
  TableSkeleton,
  ErrorState,
  BulkActionBar,
} from "@vtc/ui";
import type { Vehicle, VehicleStatus } from "@vtc/types";
import { apiClient } from "../../api";
import { VehicleCreateForm } from "./VehicleCreateForm";
import { VehicleCard } from "./VehicleCard";
import { filterVehicles } from "./filterVehicles";
import { STATUS_LABELS } from "./vehicleLabels";
import { VehicleRowActions } from "./VehicleRowActions";

type ViewMode = "list" | "card";

// Doc 04 §6 — gestion des véhicules
const STATUS_FILTERS: { value: VehicleStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
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
  // Meme cache partage que DriversPage -- resout Vehicle.currentDriverId en
  // nom d'affichage plutot que de laisser un id brut dans la colonne.
  const { data: drivers } = useQuery({ queryKey: ["drivers"], queryFn: apiClient.drivers.list });
  const { query, setQuery, statusFilter, setStatusFilter } = useUrlFilters<VehicleStatus | "all">("all");

  const filtered = useMemo(
    () => filterVehicles(data ?? [], query, statusFilter),
    [data, query, statusFilter],
  );

  const hasActiveFilter = query.length > 0 || statusFilter !== "all";
  const [formOpen, setFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

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
        <Select
          size="sm"
          fullWidth={false}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | "all")}
          aria-label="Filtrer par statut"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex gap-1 rounded-lg border border-line p-0.5">
          <button
            onClick={() => setViewMode("list")}
            aria-label="Vue liste"
            aria-pressed={viewMode === "list"}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === "list" ? "bg-ink text-white" : "text-neutral hover:text-ink"
            }`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode("card")}
            aria-label="Vue carte"
            aria-pressed={viewMode === "card"}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === "card" ? "bg-ink text-white" : "text-neutral hover:text-ink"
            }`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      <BulkActionBar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={
          <>
            <Button
              size="sm"
              variant="inverse"
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
              variant="inverse"
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
              variant="dangerInverse"
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

      {isError ? (
        <Card>
          <ErrorState title="Impossible de charger les véhicules" onRetry={() => refetch()} />
        </Card>
      ) : isLoading ? (
        <Card>
          <TableSkeleton columns={4} />
        </Card>
      ) : viewMode === "card" ? (
        filtered.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-14 text-center text-neutral">
              <span className="font-display text-base font-semibold text-ink">
                {hasActiveFilter ? "Aucun résultat" : "Aucun véhicule enregistré"}
              </span>
              <span>
                {hasActiveFilter
                  ? "Essayez une autre plaque, marque, modèle ou filtre."
                  : "Ajoutez votre premier véhicule pour l'affecter à un chauffeur."}
              </span>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                assignedDriver={drivers?.find((d) => d.id === vehicle.currentDriverId) ?? null}
                selected={selectedIds.has(vehicle.id)}
                onToggleSelect={() =>
                  setSelectedIds((current) => {
                    const next = new Set(current);
                    if (next.has(vehicle.id)) next.delete(vehicle.id);
                    else next.add(vehicle.id);
                    return next;
                  })
                }
                onClick={() => navigate(`/vehicles/${vehicle.id}`)}
              />
            ))}
          </div>
        )
      ) : (
        <Card>
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
                render: (v) => {
                  const driver = drivers?.find((d) => d.id === v.currentDriverId);
                  return driver ? `${driver.firstName} ${driver.lastName}` : "—";
                },
              },
              {
                header: "Actions",
                render: (v) => <VehicleRowActions vehicle={v} />,
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
