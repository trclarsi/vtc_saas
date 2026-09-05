import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PageHeader, StatCard, DistributionBar, StatusDot, Card, Skeleton, ErrorState, TONE_BORDERS } from "@vtc/ui";
import { useSession, hasRole } from "@vtc/auth";
import type { Driver, DriverValidationStatus, Vehicle, VehicleStatus, Reservation, ReservationStatus } from "@vtc/types";
import { apiClient } from "../../api";
import { VALIDATION_LABELS } from "../drivers/driverLabels";
import { STATUS_LABELS as VEHICLE_STATUS_LABELS } from "../vehicles/vehicleLabels";
import { STATUS_LABELS as RESERVATION_STATUS_LABELS } from "../reservations/reservationLabels";
import { useComplianceAlerts } from "../../shared/useComplianceAlerts";

function countBy<T, K extends string>(items: T[], key: (item: T) => K): Partial<Record<K, number>> {
  const counts: Partial<Record<K, number>> = {};
  for (const item of items) {
    const k = key(item);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

// Doc 04 §9 — indicateurs cles scopes au tenant de la session. Chaque carte
// est un "widget" au sens Fleetio (repartition par statut, quick-links vers
// la vue filtree correspondante) mais sans le systeme de widgets deplacables/
// personnalisables de Fleetio -- ca suppose de persister une disposition par
// utilisateur, donc un backend, hors de portee "frontend seul" pour l'instant.
export function DashboardPage() {
  const session = useSession();
  const navigate = useNavigate();
  const driversQuery = useQuery({ queryKey: ["drivers"], queryFn: apiClient.drivers.list });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles"], queryFn: apiClient.vehicles.list });
  const reservationsQuery = useQuery({
    queryKey: ["reservations"],
    queryFn: apiClient.reservations.list,
  });

  const canSeeVehicles = hasRole(session, "admin_tenant", "fleet_manager");

  const drivers = driversQuery.data ?? [];
  const vehicles = vehiclesQuery.data ?? [];
  const reservations = reservationsQuery.data ?? [];

  const { pendingDrivers, complianceEntries } = useComplianceAlerts();

  const driverCounts = countBy<Driver, DriverValidationStatus>(drivers, (d) => d.validationStatus);
  const vehicleCounts = countBy<Vehicle, VehicleStatus>(vehicles, (v) => v.status);
  const reservationCounts = countBy<Reservation, ReservationStatus>(reservations, (r) => r.status);

  const isLoading = driversQuery.isLoading || vehiclesQuery.isLoading || reservationsQuery.isLoading;
  const isError = driversQuery.isError || vehiclesQuery.isError || reservationsQuery.isError;

  function retryAll() {
    driversQuery.refetch();
    vehiclesQuery.refetch();
    reservationsQuery.refetch();
  }

  return (
    <div>
      <PageHeader eyebrow="Vue d'ensemble" title="Tableau de bord" />

      {isError ? (
        <Card>
          <ErrorState title="Impossible de charger le tableau de bord" onRetry={retryAll} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <>
                <Skeleton className="h-[150px]" />
                <Skeleton className="h-[150px]" />
                <Skeleton className="h-[150px]" />
              </>
            ) : (
              <>
                <StatCard
                  eyebrow="Effectif"
                  label="Chauffeurs"
                  value={drivers.length}
                  footer={
                    <DistributionBar
                      segments={(Object.keys(VALIDATION_LABELS) as DriverValidationStatus[]).map((status) => ({
                        label: VALIDATION_LABELS[status].label,
                        tone: VALIDATION_LABELS[status].tone,
                        value: driverCounts[status] ?? 0,
                        onClick: () => navigate(`/drivers?status=${status}`),
                      }))}
                    />
                  }
                />
                {canSeeVehicles && (
                  <StatCard
                    eyebrow="Parc"
                    label="Véhicules"
                    value={vehicles.length}
                    footer={
                      <DistributionBar
                        segments={(Object.keys(VEHICLE_STATUS_LABELS) as VehicleStatus[]).map((status) => ({
                          label: VEHICLE_STATUS_LABELS[status].label,
                          tone: VEHICLE_STATUS_LABELS[status].tone,
                          value: vehicleCounts[status] ?? 0,
                          onClick: () => navigate(`/vehicles?status=${status}`),
                        }))}
                      />
                    }
                  />
                )}
                <StatCard
                  eyebrow="Activité"
                  label="Réservations"
                  value={reservations.length}
                  footer={
                    <DistributionBar
                      segments={(Object.keys(RESERVATION_STATUS_LABELS) as ReservationStatus[]).map((status) => ({
                        label: RESERVATION_STATUS_LABELS[status].label,
                        tone: RESERVATION_STATUS_LABELS[status].tone,
                        value: reservationCounts[status] ?? 0,
                        onClick: () => navigate(`/reservations?status=${status}`),
                      }))}
                    />
                  }
                />
              </>
            )}
          </div>

          {!isLoading && (pendingDrivers.length > 0 || complianceEntries.length > 0) && (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {pendingDrivers.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-teal">
                      Chauffeurs en attente de validation
                    </span>
                    <button
                      onClick={() => navigate("/drivers?status=en_attente")}
                      className="text-[13px] font-medium text-ink transition-opacity hover:opacity-70"
                    >
                      Voir tout →
                    </button>
                  </div>
                  <div className="divide-y divide-line">
                    {pendingDrivers.slice(0, 5).map((driver) => (
                      <div key={driver.key} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-ink">
                          {driver.firstName} {driver.lastName}
                        </span>
                        <span className="font-mono text-[13px] text-neutral">{driver.phone}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {complianceEntries.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-teal">
                      Conformité — documents à renouveler
                    </span>
                    <span className="text-[13px] font-medium text-neutral">{complianceEntries.length}</span>
                  </div>
                  <div className="divide-y divide-line">
                    {complianceEntries.slice(0, 5).map((entry) => (
                      <button
                        key={entry.key}
                        onClick={() => navigate(entry.href)}
                        className={`flex w-full items-center justify-between border-l-[3px] px-4 py-3 text-left transition-colors hover:bg-paper ${TONE_BORDERS[entry.tone]}`}
                      >
                        <span>
                          <span className="block text-sm text-ink">{entry.label}</span>
                          <span className="text-[12px] text-neutral">{entry.document}</span>
                        </span>
                        <StatusDot
                          label={entry.daysLeft < 0 ? "Expiré" : `${entry.daysLeft} j`}
                          tone={entry.tone}
                        />
                      </button>
                    ))}
                  </div>
                  {complianceEntries.length > 5 && (
                    <p className="border-t border-line px-4 py-2.5 text-[13px] text-neutral">
                      + {complianceEntries.length - 5} autre(s)
                    </p>
                  )}
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
