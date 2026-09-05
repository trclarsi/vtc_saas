import { createApiClient } from "@vtc/api-client";
import { QueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "./apiBase";

// Point unique de creation du client API pour toute l'app (Doc 06 §6).
// La resolution du token sera branchee sur le vrai flux d'authentification
// une fois le backend `auth` disponible (Doc 07 §5). En attendant, les
// requetes sont interceptees en dev par le backend simule (voir mocks/).
export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  getAccessToken: () => localStorage.getItem("access_token"),
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});
