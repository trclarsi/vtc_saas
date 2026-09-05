import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button, useToast } from "@vtc/ui";
import type { Driver } from "@vtc/types";
import { apiClient } from "../../api";

// Volontairement separe de DriverRowActions (valider/rejeter) : ce n'est pas
// une decision liee a la validation, et ne doit apparaitre que sur la fiche
// detail -- jamais dans la liste/vue carte, ou un clic malheureux serait
// trop facile. Archiver ne supprime rien (Reservation.driverId continue de
// referencer le chauffeur) : ca le retire juste des listes/actions actives.
export function DriverArchiveAction({ driver }: { driver: Driver }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const archiveMutation = useMutation({
    mutationFn: () => apiClient.drivers.archive(driver.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showToast(`${driver.firstName} ${driver.lastName} a été archivé.`);
    },
    onError: () => showToast("L'archivage a échoué.", "danger"),
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => apiClient.drivers.unarchive(driver.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showToast(`${driver.firstName} ${driver.lastName} a été réactivé.`);
    },
    onError: () => showToast("La réactivation a échoué.", "danger"),
  });

  if (driver.archivedAt) {
    return (
      <Button
        variant="secondary"
        onClick={() => unarchiveMutation.mutate()}
        disabled={unarchiveMutation.isPending}
      >
        <ArchiveRestore size={15} />
        Réactiver ce chauffeur
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={() => {
        if (
          window.confirm(
            `Archiver ${driver.firstName} ${driver.lastName} ? Il ne sera plus proposé pour de nouvelles courses, mais son historique reste consultable.`,
          )
        ) {
          archiveMutation.mutate();
        }
      }}
      disabled={archiveMutation.isPending}
    >
      <Archive size={15} />
      Archiver ce chauffeur
    </Button>
  );
}
