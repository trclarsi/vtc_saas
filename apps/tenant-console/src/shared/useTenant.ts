import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api";

// Meme queryKey que TenantSettingsPage/Layout -- cache React Query partage,
// pas de requete supplementaire une fois une premiere page l'ayant chargee.
export function useTenant() {
  return useQuery({ queryKey: ["tenant"], queryFn: apiClient.tenant.get }).data;
}
