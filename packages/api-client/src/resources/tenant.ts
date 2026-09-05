import type { Tenant } from "@vtc/types";
import type { HttpClient } from "../http";

export function createTenantResource(http: HttpClient) {
  return {
    get: () => http.request<Tenant>("/tenant"),
    // Doc 04 §3, regle 2 -- un Admin Tenant ne configure que ses champs
    // propres (identite, devise, branding), jamais le plan ni les modules
    // actives : le type d'entree restreint volontairement la surface possible.
    update: (patch: Pick<Tenant, "name" | "currency" | "branding" | "timeZone" | "defaultPhonePrefix">) =>
      http.request<Tenant>("/tenant", {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
  };
}
