import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface ToastItem {
  id: string;
  message: string;
  tone: "success" | "danger";
}

interface ToastContextValue {
  showToast: (message: string, tone?: "success" | "danger") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;

// Confirmation discrete apres une action (Linear) -- ne remplace jamais l'etat
// d'erreur d'une page (ErrorState), sert uniquement a confirmer une mutation
// reussie/echouee sans obliger a rester sur l'ecran.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, tone: "success" | "danger" = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-medium text-ink shadow-lg animate-[toast-in_.2s_ease]"
          >
            {t.tone === "success" ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0 text-danger" aria-hidden="true" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé à l'intérieur d'un ToastProvider");
  return ctx;
}
