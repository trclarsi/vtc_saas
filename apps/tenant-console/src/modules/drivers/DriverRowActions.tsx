import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { Button, useToast } from "@vtc/ui";
import type { Driver } from "@vtc/types";
import { apiClient } from "../../api";

// Doc 04 §5 -- valider/rejeter un chauffeur en attente. Place a la fois dans
// la ligne de DriversPage et sur DriverDetailPage (meme composant, reutilise).
export function DriverRowActions({ driver }: { driver: Driver }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const validateMutation = useMutation({
    mutationFn: () => apiClient.drivers.validate(driver.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showToast(`${driver.firstName} ${driver.lastName} a été validé.`);
    },
    onError: () => showToast("La validation a échoué.", "danger"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiClient.drivers.reject(driver.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showToast(`${driver.firstName} ${driver.lastName} a été rejeté.`, "danger");
    },
    onError: () => showToast("Le rejet a échoué.", "danger"),
  });

  if (driver.validationStatus !== "en_attente") {
    return <span className="text-neutral">—</span>;
  }

  const pending = validateMutation.isPending || rejectMutation.isPending;

  return (
    <div
      className="flex w-full justify-end gap-1.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Button size="sm" variant="secondary" onClick={() => validateMutation.mutate()} disabled={pending}>
        <Check size={14} />
        Valider
      </Button>
      <Button size="sm" variant="ghost" onClick={() => rejectMutation.mutate()} disabled={pending}>
        <X size={14} />
        Rejeter
      </Button>
    </div>
  );
}
