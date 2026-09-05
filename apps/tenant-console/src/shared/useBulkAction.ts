import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@vtc/ui";

// B4 -- factorise le patron commun aux 3 actions groupees (chauffeurs,
// vehicules, reservations) : appliquer une mutation a chaque element
// selectionne independamment (`Promise.allSettled`, pas de transaction cote
// client possible sans backend dedie), invalider la liste, puis annoncer un
// resultat honnete -- y compris les echecs partiels, plutot qu'un message
// generique "fait" qui masquerait une erreur reseau sur un sous-ensemble.
export function useBulkAction<T>({
  queryKey,
  action,
  successMessage,
}: {
  queryKey: string;
  action: (item: T) => Promise<unknown>;
  successMessage: (succeeded: number) => string;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (items: T[]) => {
      const results = await Promise.allSettled(items.map(action));
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      return { succeeded, failed: results.length - succeeded };
    },
    onSuccess: ({ succeeded, failed }) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (failed === 0) {
        showToast(successMessage(succeeded));
      } else {
        showToast(`${succeeded} réussite(s), ${failed} échec(s).`, "danger");
      }
    },
    onError: () => showToast("L'action groupée a échoué.", "danger"),
  });
}
