import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Card, DetailField, StatusDot, ErrorState, Skeleton } from "@vtc/ui";
import { apiClient } from "../../api";
import { STATUS_LABELS } from "./vehicleLabels";
import { VehicleRowActions } from "./VehicleRowActions";
import { DocumentExpiry } from "../../shared/DocumentExpiry";

// Doc 04 §6 — fiche detail d'un vehicule (B1)
export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: vehicle, isLoading, isError, refetch } = useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => apiClient.vehicles.get(id!),
    enabled: !!id,
  });

  return (
    <div>
      <Link
        to="/vehicles"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Véhicules
      </Link>

      <PageHeader eyebrow="Fiche véhicule" title={vehicle?.plateNumber ?? "Véhicule"} />

      <Card>
        {isError ? (
          <ErrorState title="Impossible de charger ce véhicule" onRetry={() => refetch()} />
        ) : isLoading || !vehicle ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : (
          <div>
            <DetailField
              label="Immatriculation"
              value={<span className="font-mono">{vehicle.plateNumber}</span>}
            />
            <DetailField label="Marque" value={vehicle.brand} />
            <DetailField label="Modèle" value={vehicle.model} />
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
                vehicle.currentDriverId ? (
                  <Link to={`/drivers/${vehicle.currentDriverId}`} className="font-mono text-teal">
                    {vehicle.currentDriverId}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <DetailField
              label="Assurance"
              value={<DocumentExpiry dateIso={vehicle.insuranceExpiresAt} />}
            />
            <DetailField
              label="Visite technique"
              value={<DocumentExpiry dateIso={vehicle.inspectionExpiresAt} />}
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
