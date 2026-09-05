import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Select, useToast } from "@vtc/ui";
import type { Vehicle } from "@vtc/types";
import { apiClient } from "../../api";

// Miroir de ReservationDriverAssignment -- ne propose que les vehicules
// disponibles (un vehicule "indisponible" ou "retire" ne peut pas etre
// affecte, meme regle que pour l'affectation chauffeur d'un vehicule).
export function ReservationVehicleAssignment({
  reservationId,
  currentVehicle,
  vehicles,
}: {
  reservationId: string;
  currentVehicle: Vehicle | null;
  vehicles: Vehicle[];
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [picking, setPicking] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const eligibleVehicles = vehicles.filter((v) => v.status === "disponible");

  const assignMutation = useMutation({
    mutationFn: (vehicleId: string) => apiClient.reservations.assignVehicle(reservationId, vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setPicking(false);
      setSelectedVehicleId("");
      showToast("Véhicule assigné.");
    },
    onError: () => showToast("L'assignation a échoué.", "danger"),
  });

  const removeMutation = useMutation({
    mutationFn: () => apiClient.reservations.assignVehicle(reservationId, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
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
          {eligibleVehicles.map((v) => (
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
        <Link to={`/vehicles/${currentVehicle.id}`} className="text-teal">
          {currentVehicle.plateNumber}
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
