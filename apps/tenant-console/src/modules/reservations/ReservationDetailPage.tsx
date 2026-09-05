import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Card, DetailField, WaypointTracker, ErrorState, Skeleton } from "@vtc/ui";
import { apiClient } from "../../api";
import { ReservationRowActions } from "./ReservationRowActions";
import { useTenantTimeZone } from "../../shared/useTenantTimeZone";
import { formatDateTime } from "../../shared/formatDateTime";

// Doc 04 §7 — fiche detail d'une reservation (B1)
export function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: reservation, isLoading, isError, refetch } = useQuery({
    queryKey: ["reservations", id],
    queryFn: () => apiClient.reservations.get(id!),
    enabled: !!id,
  });
  const timeZone = useTenantTimeZone();

  return (
    <div>
      <Link
        to="/reservations"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Réservations
      </Link>

      <PageHeader eyebrow="Fiche réservation" title="Réservation" />

      <Card>
        {isError ? (
          <ErrorState title="Impossible de charger cette réservation" onRetry={() => refetch()} />
        ) : isLoading || !reservation ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : (
          <div>
            <DetailField
              label="Créneau"
              value={
                <span className="font-mono">
                  {formatDateTime(reservation.scheduledStart, timeZone)} →{" "}
                  {formatDateTime(reservation.scheduledEnd, timeZone)}
                </span>
              }
            />
            <DetailField label="Progression" value={<WaypointTracker status={reservation.status} />} />
            <DetailField
              label="Chauffeur"
              value={
                reservation.driverId ? (
                  <Link to={`/drivers/${reservation.driverId}`} className="font-mono text-teal">
                    {reservation.driverId}
                  </Link>
                ) : (
                  "Non affecté"
                )
              }
            />
            <DetailField
              label="Véhicule"
              value={
                reservation.vehicleId ? (
                  <Link to={`/vehicles/${reservation.vehicleId}`} className="font-mono text-teal">
                    {reservation.vehicleId}
                  </Link>
                ) : (
                  "Non affecté"
                )
              }
            />
            <DetailField
              label="Dernier changement"
              value={formatDateTime(reservation.statusChangedAt, timeZone)}
            />
            <div className="flex justify-end px-4 py-3">
              <ReservationRowActions reservation={reservation} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
