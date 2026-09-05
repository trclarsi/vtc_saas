import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, History } from "lucide-react";
import { PageHeader, Card, DetailField, StatusDot, Button, ErrorState, Skeleton, useToast } from "@vtc/ui";
import type { Vehicle } from "@vtc/types";
import { apiClient } from "../../api";
import { STATUS_LABELS } from "./vehicleLabels";
import { VehicleRowActions } from "./VehicleRowActions";
import { VehicleDriverAssignment } from "./VehicleDriverAssignment";
import { DocumentExpiry } from "../../shared/DocumentExpiry";
import { EditableField } from "../../shared/EditableField";

interface EditableValues {
  plateNumber: string;
  brand: string;
  model: string;
  insuranceExpiresAt: string; // "YYYY-MM-DD" pour <input type="date">, "" si non renseigne
  inspectionExpiresAt: string;
}

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function valuesFromVehicle(vehicle: Vehicle): EditableValues {
  return {
    plateNumber: vehicle.plateNumber,
    brand: vehicle.brand,
    model: vehicle.model,
    insuranceExpiresAt: toDateInputValue(vehicle.insuranceExpiresAt),
    inspectionExpiresAt: toDateInputValue(vehicle.inspectionExpiresAt),
  };
}

// Doc 04 §6 — fiche detail d'un vehicule (B1)
export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: vehicle, isLoading, isError, refetch } = useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => apiClient.vehicles.get(id!),
    enabled: !!id,
  });
  // Meme cache partage que DriversPage (queryKey ["drivers"]) -- pas de
  // requete dediee, juste resoudre l'id en nom d'affichage.
  const { data: drivers } = useQuery({ queryKey: ["drivers"], queryFn: apiClient.drivers.list });
  const assignedDriver = drivers?.find((d) => d.id === vehicle?.currentDriverId) ?? null;
  // Pour determiner quels chauffeurs sont deja affectes ailleurs (meme cache
  // que VehiclesPage) -- evite de proposer un chauffeur qui conduit deja un
  // autre vehicule.
  const { data: vehiclesForAssignment } = useQuery({
    queryKey: ["vehicles"],
    queryFn: apiClient.vehicles.list,
  });

  const [values, setValues] = useState<EditableValues | null>(null);

  useEffect(() => {
    if (vehicle) setValues(valuesFromVehicle(vehicle));
  }, [vehicle]);

  const isDirty = !!vehicle && !!values && JSON.stringify(values) !== JSON.stringify(valuesFromVehicle(vehicle));
  const hasRequiredFields =
    !!values && !!values.plateNumber.trim() && !!values.brand.trim() && !!values.model.trim();
  const canSave = isDirty && hasRequiredFields;

  const mutation = useMutation({
    mutationFn: () => {
      const v = values!;
      return apiClient.vehicles.update(vehicle!.id, {
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        insuranceExpiresAt: v.insuranceExpiresAt ? new Date(v.insuranceExpiresAt).toISOString() : null,
        inspectionExpiresAt: v.inspectionExpiresAt ? new Date(v.inspectionExpiresAt).toISOString() : null,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["vehicles", id], updated);
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      showToast("Véhicule mis à jour.");
      (document.activeElement as HTMLElement | null)?.blur();
    },
    onError: () => showToast("La mise à jour a échoué.", "danger"),
  });

  function handleCancel() {
    if (vehicle) setValues(valuesFromVehicle(vehicle));
  }

  return (
    <div>
      <Link
        to="/vehicles"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Véhicules
      </Link>

      <PageHeader
        eyebrow="Fiche véhicule"
        title={vehicle?.plateNumber ?? "Véhicule"}
        actions={
          <>
            {vehicle && (
              <Button variant="secondary" onClick={() => navigate(`/vehicles/${vehicle.id}/history`)}>
                <History size={15} />
                Historique des courses
              </Button>
            )}
            {isDirty && (
              <>
                <Button variant="ghost" onClick={handleCancel} disabled={mutation.isPending}>
                  Annuler
                </Button>
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={!canSave || mutation.isPending}
                  title={!hasRequiredFields ? "Immatriculation, marque et modèle sont requis." : undefined}
                >
                  {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </>
            )}
          </>
        }
      />

      <Card>
        {isError ? (
          <ErrorState title="Impossible de charger ce véhicule" onRetry={() => refetch()} />
        ) : isLoading || !vehicle || !values ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : (
          <div>
            <EditableField
              label="Immatriculation"
              value={values.plateNumber}
              onChange={(v) => setValues((s) => s && { ...s, plateNumber: v })}
              displayValue={<span className="font-mono">{values.plateNumber}</span>}
            />
            <EditableField
              label="Marque"
              value={values.brand}
              onChange={(v) => setValues((s) => s && { ...s, brand: v })}
            />
            <EditableField
              label="Modèle"
              value={values.model}
              onChange={(v) => setValues((s) => s && { ...s, model: v })}
            />
            <DetailField
              label="Statut"
              value={
                <StatusDot
                  label={STATUS_LABELS[vehicle.status].label}
                  tone={STATUS_LABELS[vehicle.status].tone}
                />
              }
            />
            <DetailField
              label="Chauffeur affecté"
              value={
                <VehicleDriverAssignment
                  vehicleId={vehicle.id}
                  currentDriver={assignedDriver}
                  drivers={drivers ?? []}
                  vehicles={vehiclesForAssignment ?? []}
                />
              }
            />
            <EditableField
              label="Assurance"
              type="date"
              value={values.insuranceExpiresAt}
              onChange={(v) => setValues((s) => s && { ...s, insuranceExpiresAt: v })}
              displayValue={
                <DocumentExpiry
                  dateIso={values.insuranceExpiresAt ? new Date(values.insuranceExpiresAt).toISOString() : null}
                />
              }
            />
            <EditableField
              label="Visite technique"
              type="date"
              value={values.inspectionExpiresAt}
              onChange={(v) => setValues((s) => s && { ...s, inspectionExpiresAt: v })}
              displayValue={
                <DocumentExpiry
                  dateIso={values.inspectionExpiresAt ? new Date(values.inspectionExpiresAt).toISOString() : null}
                />
              }
            />
            <DetailField
              label="Ajouté le"
              value={new Date(vehicle.createdAt).toLocaleDateString("fr-FR")}
            />
            <div className="flex justify-end px-4 py-3">
              <VehicleRowActions vehicle={vehicle} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
