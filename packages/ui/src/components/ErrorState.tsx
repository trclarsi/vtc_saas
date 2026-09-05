import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

// Distingue explicitement "la requete a echoue" de "la liste est vide" (DataTable) --
// les deux etats ne doivent jamais se confondre, sinon on ment sur l'etat reel des donnees.
export function ErrorState({
  title = "Le chargement a échoué",
  hint = "Vérifiez votre connexion et réessayez.",
  onRetry,
}: {
  title?: string;
  hint?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
      <span className="font-display text-base font-semibold text-ink">{title}</span>
      <span className="text-neutral">{hint}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          Réessayer
        </Button>
      )}
    </div>
  );
}
