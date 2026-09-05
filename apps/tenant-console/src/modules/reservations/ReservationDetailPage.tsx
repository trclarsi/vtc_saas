import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Card, DetailField, WaypointTracker, Button, ErrorState, Skeleton, useToast } from "@vtc/ui";
import type { Reservation } from "@vtc/types";
import { apiClient } from "../../api";
import { ReservationRowActions } from "./ReservationRowActions";
import { ReservationDriverAssignment } from "./ReservationDriverAssignment";
import { ReservationVehicleAssignment } from "./ReservationVehicleAssignment";
import { EditableField } from "../../shared/EditableField";
import { useTenantTimeZone } from "../../shared/useTenantTimeZone";
import { formatDateTime } from "../../shared/formatDateTime";
import { isoToTzInputValue, tzInputValueToIso } from "../../shared/tzDateTimeInput";

interface EditableValues {
  scheduledStart: string;
  scheduledEnd: string;
}

function valuesFromReservation(reservation: Reservation, timeZone: string): EditableValues {
  return {
    scheduledStart: isoToTzInputValue(reservation.scheduledStart, timeZone),
    scheduledEnd: isoToTzInputValue(reservation.scheduledEnd, timeZone),
  };
}

// Doc 04 §7 — fiche detail d'une reservation (B1)
export function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: reservation, isLoading, isError, refetch } = useQuery({
    queryKey: ["reservations", id],
    queryFn: () => apiClient.reservations.get(id!),
    enabled: !!id,
  });
  const { data: drivers } = useQuery({ queryKey: ["drivers"], queryFn: apiClient.drivers.list });
  const { data: vehicles } = useQuery({ queryKey: ["vehicles"], queryFn: apiClient.vehicles.list });
  const driver = drivers?.find((d) => d.id === reservation?.driverId);
  const vehicle = vehicles?.find((v) => v.id === reservation?.vehicleId);
  const timeZone = useTenantTimeZone();

  // Une reservation deja en cours, terminee ou annulee n'a plus de creneau a
  // reprogrammer -- meme regle que l'annulation (ReservationRowActions).
  const canReschedule = reservation?.status === "planifiee" || reservation?.status === "confirmee";

  const [values, setValues] = useState<EditableValues | null>(null);

  useEffect(() => {
    if (reservation) setValues(valuesFromReservation(reservation, timeZone));
  }, [reservation, timeZone]);

  const isDirty =
    !!reservation && !!values && JSON.stringify(values) !== JSON.stringify(valuesFromReservation(reservation, timeZone));
  const isRangeValid = !!values && values.scheduledEnd > values.scheduledStart;
  const canSave = isDirty && isRangeValid;

  const mutation = useMutation({
    mutationFn: () => {
      const v = values!;
      return apiClient.reservations.update(reservation!.id, {
        scheduledStart: tzInputValueToIso(v.scheduledStart, timeZone),
        scheduledEnd: tzInputValueToIso(v.scheduledEnd, timeZone),
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["reservations", id], updated);
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      showToast("Créneau mis à jour.");
      (document.activeElement as HTMLElement | null)?.blur();
    },
    onError: () => showToast("La mise à jour a échoué.", "danger"),
  });

  function handleCancel() {
    if (reservation) setValues(valuesFromReservation(reservation, timeZone));
  }

  return (
    <div>
      <Link
        to="/reservations"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Réservations
      </Link>

      <PageHeader
        eyebrow="Fiche réservation"
        title="Réservation"
        actions={
          isDirty && (
            <>
              <Button variant="ghost" onClick={handleCancel} disabled={mutation.isPending}>
                Annuler
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={!canSave || mutation.isPending}
                title={!isRangeValid ? "L'heure d'arrivée doit être après l'heure de départ." : undefined}
              >
                {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </>
          )
        }
      />

      <Card>
        {isError ? (
          <ErrorState title="Impossible de charger cette réservation" onRetry={() => refetch()} />
        ) : isLoading || !reservation || !values ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : (
          <div>
            {canReschedule ? (
              <>
                <EditableField
                  label="Départ"
                  type="datetime-local"
                  value={values.scheduledStart}
                  onChange={(v) => setValues((s) => s && { ...s, scheduledStart: v })}
                  displayValue={
                    <span className="font-mono">{formatDateTime(reservation.scheduledStart, timeZone)}</span>
                  }
                />
                <EditableField
                  label="Arrivée"
                  type="datetime-local"
                  value={values.scheduledEnd}
                  onChange={(v) => setValues((s) => s && { ...s, scheduledEnd: v })}
                  displayValue={
                    <span className="font-mono">{formatDateTime(reservation.scheduledEnd, timeZone)}</span>
                  }
                />
              </>
            ) : (
              <DetailField
                label="Créneau"
                value={
                  <span className="font-mono">
                    {formatDateTime(reservation.scheduledStart, timeZone)} →{" "}
                    {formatDateTime(reservation.scheduledEnd, timeZone)}
                  </span>
                }
              />
            )}
            <DetailField label="Progression" value={<WaypointTracker status={reservation.status} />} />
            <DetailField
              label="Chauffeur"
              value={
                <ReservationDriverAssignment
                  reservationId={reservation.id}
                  currentDriver={driver ?? null}
                  drivers={drivers ?? []}
                />
              }
            />
            <DetailField
              label="Véhicule"
              value={
                <ReservationVehicleAssignment
                  reservationId={reservation.id}
                  currentVehicle={vehicle ?? null}
                  vehicles={vehicles ?? []}
                />
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
