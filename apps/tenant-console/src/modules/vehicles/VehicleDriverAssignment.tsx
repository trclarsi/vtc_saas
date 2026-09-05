import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Select, useToast } from "@vtc/ui";
import type { Driver, Vehicle } from "@vtc/types";
import { apiClient } from "../../api";

// Miroir de DriverVehicleAssignment (module drivers) -- meme mutation
// (apiClient.vehicles.assignDriver) vue depuis l'autre bout de la relation.
// Seuls les chauffeurs valides, actifs et sans vehicule deja assigne
// ailleurs sont proposes -- meme logique de non-vol d'affectation.
export function VehicleDriverAssignment({
  vehicleId,
  currentDriver,
  drivers,
  vehicles,
}: {
  vehicleId: string;
  currentDriver: Driver | null;
  drivers: Driver[];
  vehicles: Vehicle[];
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [picking, setPicking] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const assignedDriverIds = new Set(vehicles.map((v) => v.currentDriverId).filter(Boolean));
  const availableDrivers = drivers.filter(
    (d) => d.validationStatus === "valide" && !d.archivedAt && !assignedDriverIds.has(d.id),
  );

  const assignMutation = useMutation({
    mutationFn: (driverId: string) => apiClient.vehicles.assignDriver(vehicleId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setPicking(false);
      setSelectedDriverId("");
      showToast("Chauffeur assigné.");
    },
    onError: () => showToast("L'assignation a échoué.", "danger"),
  });

  const removeMutation = useMutation({
    mutationFn: () => apiClient.vehicles.assignDriver(vehicleId, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      showToast("Chauffeur retiré.");
    },
    onError: () => showToast("Le retrait a échoué.", "danger"),
  });

  if (picking) {
    return (
      <div className="flex items-center gap-2">
        <Select
          size="sm"
          fullWidth={false}
          value={selectedDriverId}
          onChange={(e) => setSelectedDriverId(e.target.value)}
          aria-label="Choisir un chauffeur"
        >
          <option value="">Choisir un chauffeur…</option>
          {availableDrivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.firstName} {d.lastName}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          onClick={() => assignMutation.mutate(selectedDriverId)}
          disabled={!selectedDriverId || assignMutation.isPending}
        >
          Assigner
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPicking(false)}>
          Annuler
        </Button>
      </div>
    );
  }

  if (currentDriver) {
    return (
      <div className="flex items-center gap-3">
        <Link to={`/drivers/${currentDriver.id}`} className="text-teal hover:underline">
          {currentDriver.firstName} {currentDriver.lastName}
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
      Assigner un chauffeur
    </button>
  );
}
