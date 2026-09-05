import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, type Session } from "@vtc/auth";
import { ToastProvider } from "@vtc/ui";
import "@vtc/ui/tokens.css";
import { App } from "./App";
import { queryClient } from "./api";

// TODO(auth) : remplacer par une session issue du flux de connexion reel
// (Doc 04 §2) une fois le backend `auth` disponible (Doc 07 §5). Le
// tenant_id et le role viendront du payload du JWT, pas d'une valeur figee.
const devSession: Session = {
  userId: "dev-user",
  tenantId: "dev-tenant",
  role: "admin_tenant",
  accessToken: "",
};

// Backend simule (MSW) en dev uniquement -- import dynamique pour que `msw`
// ne fasse jamais partie du bundle de production (le code n'est meme pas
// evalue quand `import.meta.env.DEV` est faux, Vite l'exclut au build).
// `VITE_API_MOCKING=false` permet de pointer un dev exceptionnellement vers
// un vrai backend local sans toucher au code.
async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCKING === "false") return;
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={devSession}>
          <ToastProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ToastProvider>
        </SessionProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
});
