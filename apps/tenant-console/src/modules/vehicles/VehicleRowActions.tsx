import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, useToast } from "@vtc/ui";
import type { Vehicle } from "@vtc/types";
import { apiClient } from "../../api";
import { STATUS_LABELS } from "./vehicleLabels";

// Doc 04 §6 -- changer le statut d'un vehicule. Place a la fois dans la ligne
// de VehiclesPage et sur VehicleDetailPage (meme composant, reutilise).
// Changement immediat au choix dans le menu, meme logique que
// AvailabilityField cote Chauffeurs.
export function VehicleRowActions({ vehicle }: { vehicle: Vehicle }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: (status: Vehicle["status"]) => apiClient.vehicles.updateStatus(vehicle.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      showToast(`${vehicle.plateNumber} : statut mis à jour.`);
    },
    onError: () => showToast("La mise à jour a échoué.", "danger"),
  });

  return (
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Select
        size="sm"
        fullWidth={false}
        aria-label={`Statut de ${vehicle.plateNumber}`}
        value={vehicle.status}
        onChange={(e) => mutation.mutate(e.target.value as Vehicle["status"])}
        disabled={mutation.isPending}
      >
        {(Object.keys(STATUS_LABELS) as Vehicle["status"][]).map((key) => (
          <option key={key} value={key}>
            {STATUS_LABELS[key].label}
          </option>
        ))}
      </Select>
    </div>
  );
}
