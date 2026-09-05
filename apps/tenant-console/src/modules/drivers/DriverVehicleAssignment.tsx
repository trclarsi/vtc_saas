import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Select, StatusDot, useToast } from "@vtc/ui";
import type { Vehicle } from "@vtc/types";
import { apiClient } from "../../api";
import { STATUS_LABELS as VEHICLE_STATUS_LABELS } from "../vehicles/vehicleLabels";

// La relation vit cote vehicule (Vehicle.currentDriverId), donc la mutation
// reelle passe par apiClient.vehicles -- mais l'action reste utilisable
// directement depuis la fiche chauffeur, la ou un dispatcher en a besoin.
// Un chauffeur ne conduit qu'un seul vehicule a la fois (assurance cote
// serveur simule, voir handlers.ts) ; le selecteur ne propose que les
// vehicules disponibles et pas deja assignes, pour ne jamais retirer
// silencieusement un vehicule a un autre chauffeur.
export function DriverVehicleAssignment({
  driverId,
  currentVehicle,
  vehicles,
}: {
  driverId: string;
  currentVehicle: Vehicle | null;
  vehicles: Vehicle[];
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [picking, setPicking] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const availableVehicles = vehicles.filter((v) => v.status === "disponible" && v.currentDriverId === null);

  const assignMutation = useMutation({
    mutationFn: (vehicleId: string) => apiClient.vehicles.assignDriver(vehicleId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setPicking(false);
      setSelectedVehicleId("");
      showToast("Véhicule assigné.");
    },
    onError: () => showToast("L'assignation a échoué.", "danger"),
  });

  const removeMutation = useMutation({
    mutationFn: () => apiClient.vehicles.assignDriver(currentVehicle!.id, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      showToast("Véhicule retiré.");
    },
    onError: () => showToast("Le retrait a échoué.", "danger"),
  });

  if (picking) {
    return (
      <div className="flex items-center gap-2">
        <Select
          size="sm"
          fullWidth={false}
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          aria-label="Choisir un véhicule"
        >
          <option value="">Choisir un véhicule…</option>
          {availableVehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plateNumber} — {v.brand} {v.model}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          onClick={() => assignMutation.mutate(selectedVehicleId)}
          disabled={!selectedVehicleId || assignMutation.isPending}
        >
          Assigner
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPicking(false)}>
          Annuler
        </Button>
      </div>
    );
  }

  if (currentVehicle) {
    return (
      <div className="flex items-center gap-3">
        <Link to={`/vehicles/${currentVehicle.id}`} className="inline-flex items-center gap-2 hover:text-accent">
          <span className="font-mono">{currentVehicle.plateNumber}</span>
          <span className="text-neutral">
            {currentVehicle.brand} {currentVehicle.model}
          </span>
          <StatusDot
            label={VEHICLE_STATUS_LABELS[currentVehicle.status].label}
            tone={VEHICLE_STATUS_LABELS[currentVehicle.status].tone}
          />
        </Link>
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          Changer
        </button>
        <button
          type="button"
          onClick={() => removeMutation.mutate()}
          disabled={removeMutation.isPending}
          className="text-[13px] font-medium text-danger hover:underline"
        >
          Retirer
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPicking(true)}
      className="text-[13px] font-medium text-accent hover:underline"
    >
      Assigner un véhicule
    </button>
  );
}
