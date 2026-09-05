import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, useToast } from "@vtc/ui";
import type { Vehicle } from "@vtc/types";
import { apiClient } from "../../api";

// Doc 04 §6 -- changer le statut d'un vehicule. Place a la fois dans la ligne
// de VehiclesPage et sur VehicleDetailPage (meme composant, reutilise).
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

  if (vehicle.status === "retire") {
    return <span className="text-neutral">—</span>;
  }

  return (
    <div
      className="flex w-full justify-end gap-1.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {vehicle.status === "disponible" ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => mutation.mutate("indisponible")}
          disabled={mutation.isPending}
        >
          Marquer indisponible
        </Button>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => mutation.mutate("disponible")}
          disabled={mutation.isPending}
        >
          Marquer disponible
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={() => mutation.mutate("retire")} disabled={mutation.isPending}>
        Retirer
      </Button>
    </div>
  );
}
