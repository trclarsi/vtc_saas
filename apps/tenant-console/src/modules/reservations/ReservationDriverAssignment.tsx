import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Select, useToast } from "@vtc/ui";
import type { Driver } from "@vtc/types";
import { apiClient } from "../../api";

// Miroir de DriverVehicleAssignment/VehicleDriverAssignment -- ne propose que
// les chauffeurs valides et actifs, sans contrainte d'exclusivite (un
// chauffeur peut avoir plusieurs reservations, a des creneaux differents).
export function ReservationDriverAssignment({
  reservationId,
  currentDriver,
  drivers,
}: {
  reservationId: string;
  currentDriver: Driver | null;
  drivers: Driver[];
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [picking, setPicking] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const eligibleDrivers = drivers.filter((d) => d.validationStatus === "valide" && !d.archivedAt);

  const assignMutation = useMutation({
    mutationFn: (driverId: string) => apiClient.reservations.assignDriver(reservationId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setPicking(false);
      setSelectedDriverId("");
      showToast("Chauffeur assigné.");
    },
    onError: () => showToast("L'assignation a échoué.", "danger"),
  });

  const removeMutation = useMutation({
    mutationFn: () => apiClient.reservations.assignDriver(reservationId, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
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
          {eligibleDrivers.map((d) => (
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
        <Link to={`/drivers/${currentDriver.id}`} className="text-teal">
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
