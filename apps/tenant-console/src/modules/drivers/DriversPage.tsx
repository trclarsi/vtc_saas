import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useUrlFilters } from "../../shared/useUrlFilters";
import { useBulkAction } from "../../shared/useBulkAction";
import { UserPlus, Check, X, Archive, List, LayoutGrid } from "lucide-react";
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
  Avatar,
} from "@vtc/ui";
import type { Driver, DriverAvailabilityStatus, DriverValidationStatus } from "@vtc/types";
import { apiClient } from "../../api";
import { DriverCreateForm } from "./DriverCreateForm";
import { DriverCard } from "./DriverCard";
import { filterDrivers } from "./filterDrivers";
import { VALIDATION_LABELS, AVAILABILITY_LABELS } from "./driverLabels";
import { DriverRowActions } from "./DriverRowActions";

type ViewMode = "list" | "card";

// Doc 04 §5 — gestion des chauffeurs
const VALIDATION_FILTERS: { value: DriverValidationStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes validations" },
  { value: "en_attente", label: "En attente" },
  { value: "valide", label: "Validés" },
  { value: "rejete", label: "Rejetés" },
];

const AVAILABILITY_FILTERS: { value: DriverAvailabilityStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes disponibilités" },
  { value: "disponible", label: AVAILABILITY_LABELS.disponible.label },
  { value: "hors_ligne", label: AVAILABILITY_LABELS.hors_ligne.label },
  { value: "en_course", label: AVAILABILITY_LABELS.en_course.label },
];

export function DriversPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["drivers"],
    queryFn: apiClient.drivers.list,
  });
  const { query, setQuery, statusFilter, setStatusFilter } = useUrlFilters<DriverValidationStatus | "all">(
    "all",
  );
  const [showArchived, setShowArchived] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<DriverAvailabilityStatus | "all">("all");

  // Un chauffeur qui a quitte la flotte sort des listes actives par defaut
  // (plus assignable, plus visible dans le flux courant) mais reste
  // consultable via la case a cocher -- jamais vraiment supprime.
  const activeData = useMemo(
    () => (data ?? []).filter((d) => showArchived || !d.archivedAt),
    [data, showArchived],
  );
  const filtered = useMemo(
    () => filterDrivers(activeData, query, statusFilter, availabilityFilter),
    [activeData, query, statusFilter, availabilityFilter],
  );

  const hasActiveFilter = query.length > 0 || statusFilter !== "all" || availabilityFilter !== "all";
  const [formOpen, setFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Une ligne qui sort de la vue filtree (recherche, filtre de statut) ne doit
  // plus rester "selectionnee" invisiblement.
  useEffect(() => {
    const visibleIds = new Set(filtered.map((d) => d.id));
    setSelectedIds((current) => new Set([...current].filter((id) => visibleIds.has(id))));
  }, [filtered]);

  const selectedDrivers = filtered.filter((d) => selectedIds.has(d.id));
  const eligibleToValidate = selectedDrivers.filter((d) => d.validationStatus === "en_attente");
  const eligibleToArchive = selectedDrivers.filter((d) => !d.archivedAt);

  const validateBulk = useBulkAction<Driver>({
    queryKey: "drivers",
    action: (d) => apiClient.drivers.validate(d.id),
    successMessage: (n) => `${n} chauffeur${n > 1 ? "s" : ""} validé${n > 1 ? "s" : ""}.`,
  });
  const rejectBulk = useBulkAction<Driver>({
    queryKey: "drivers",
    action: (d) => apiClient.drivers.reject(d.id),
    successMessage: (n) => `${n} chauffeur${n > 1 ? "s" : ""} rejeté${n > 1 ? "s" : ""}.`,
  });
  const archiveBulk = useBulkAction<Driver>({
    queryKey: "drivers",
    action: (d) => apiClient.drivers.archive(d.id),
    successMessage: (n) => `${n} chauffeur${n > 1 ? "s" : ""} archivé${n > 1 ? "s" : ""}.`,
  });

  function handleArchiveSelection() {
    const n = eligibleToArchive.length;
    if (
      window.confirm(
        `Archiver ${n} chauffeur${n > 1 ? "s" : ""} ? Il${n > 1 ? "s" : ""} ne ser${n > 1 ? "ont" : "a"} plus proposé${n > 1 ? "s" : ""} pour de nouvelles courses, mais l'historique reste consultable.`,
      )
    ) {
      archiveBulk.mutate(eligibleToArchive);
      setSelectedIds(new Set());
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Effectif"
        title="Chauffeurs"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <UserPlus size={15} />
            Ajouter un chauffeur
          </Button>
        }
      />

      <DriverCreateForm open={formOpen} onClose={() => setFormOpen(false)} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          className="max-w-xs"
          placeholder="Rechercher un chauffeur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un chauffeur"
        />
        <Select
          size="sm"
          fullWidth={false}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DriverValidationStatus | "all")}
          aria-label="Filtrer par statut de validation"
        >
          {VALIDATION_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
        <Select
          size="sm"
          fullWidth={false}
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value as DriverAvailabilityStatus | "all")}
          aria-label="Filtrer par disponibilité"
        >
          {AVAILABILITY_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-1.5 text-[13px] font-medium text-neutral">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 accent-ink"
          />
          Afficher les archivés
        </label>
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
              disabled={eligibleToValidate.length === 0 || validateBulk.isPending}
              onClick={() => validateBulk.mutate(eligibleToValidate)}
              title={
                eligibleToValidate.length === 0
                  ? "Aucun chauffeur sélectionné n'est en attente de validation"
                  : undefined
              }
            >
              <Check size={14} />
              Valider ({eligibleToValidate.length})
            </Button>
            <Button
              size="sm"
              variant="inverse"
              disabled={eligibleToValidate.length === 0 || rejectBulk.isPending}
              onClick={() => rejectBulk.mutate(eligibleToValidate)}
              title={
                eligibleToValidate.length === 0
                  ? "Aucun chauffeur sélectionné n'est en attente de validation"
                  : undefined
              }
            >
              <X size={14} />
              Rejeter ({eligibleToValidate.length})
            </Button>
            <Button
              size="sm"
              variant="dangerInverse"
              disabled={eligibleToArchive.length === 0 || archiveBulk.isPending}
              onClick={handleArchiveSelection}
              title={
                eligibleToArchive.length === 0
                  ? "Les chauffeurs sélectionnés sont déjà archivés"
                  : undefined
              }
            >
              <Archive size={14} />
              Archiver ({eligibleToArchive.length})
            </Button>
          </>
        }
      />

      {isError ? (
        <Card>
          <ErrorState title="Impossible de charger les chauffeurs" onRetry={() => refetch()} />
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
                {hasActiveFilter ? "Aucun résultat" : "Aucun chauffeur enregistré"}
              </span>
              <span>
                {hasActiveFilter
                  ? "Essayez un autre nom, numéro ou filtre."
                  : "Ajoutez votre premier chauffeur pour commencer à planifier des courses."}
              </span>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                selected={selectedIds.has(driver.id)}
                onToggleSelect={() =>
                  setSelectedIds((current) => {
                    const next = new Set(current);
                    if (next.has(driver.id)) next.delete(driver.id);
                    else next.add(driver.id);
                    return next;
                  })
                }
                onClick={() => navigate(`/drivers/${driver.id}`)}
              />
            ))}
          </div>
        )
      ) : (
        <Card>
          <DataTable<Driver>
            rows={filtered}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onRowClick={(d) => navigate(`/drivers/${d.id}`)}
            emptyTitle={hasActiveFilter ? "Aucun résultat" : "Aucun chauffeur enregistré"}
            emptyHint={
              hasActiveFilter
                ? "Essayez un autre nom, numéro ou filtre."
                : "Ajoutez votre premier chauffeur pour commencer à planifier des courses."
            }
            columns={[
              {
                header: "Nom",
                render: (d) => (
                  <span className="flex items-center gap-2.5">
                    <Avatar firstName={d.firstName} lastName={d.lastName} avatarUrl={d.avatarUrl} size="sm" />
                    {d.firstName} {d.lastName}
                    {d.archivedAt && (
                      <span className="rounded-md bg-paper px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-neutral">
                        Archivé
                      </span>
                    )}
                  </span>
                ),
                sortKey: (d) => `${d.firstName} ${d.lastName}`.toLowerCase(),
              },
              { header: "Téléphone", render: (d) => d.phone, mono: true },
              {
                header: "Validation",
                render: (d) => {
                  const status = VALIDATION_LABELS[d.validationStatus];
                  return <StatusDot label={status.label} tone={status.tone} />;
                },
                sortKey: (d) => d.validationStatus,
              },
              {
                header: "Disponibilité",
                render: (d) => {
                  const status = AVAILABILITY_LABELS[d.availabilityStatus];
                  return <StatusDot label={status.label} tone={status.tone} />;
                },
                sortKey: (d) => d.availabilityStatus,
              },
              {
                header: "Actions",
                render: (d) => <DriverRowActions driver={d} />,
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
