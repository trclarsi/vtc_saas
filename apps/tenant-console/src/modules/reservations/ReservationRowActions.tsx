import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, useToast } from "@vtc/ui";
import type { Reservation } from "@vtc/types";
import { apiClient } from "../../api";

// Doc 04 §7, regle 2 -- "annulee" seulement depuis "planifiee" ou "confirmee".
// Place a la fois dans la ligne de ReservationsPage et sur ReservationDetailPage.
export function ReservationRowActions({ reservation }: { reservation: Reservation }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: () => apiClient.reservations.cancel(reservation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      showToast("Réservation annulée.", "danger");
    },
    onError: () => showToast("L'annulation a échoué.", "danger"),
  });

  const canCancel = reservation.status === "planifiee" || reservation.status === "confirmee";
  if (!canCancel) {
    return <span className="text-neutral">—</span>;
  }

  return (
    <div
      className="flex w-full justify-end"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Button size="sm" variant="ghost" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        Annuler la réservation
      </Button>
    </div>
  );
}
