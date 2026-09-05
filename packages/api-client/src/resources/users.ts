import type { User, RoleCode } from "@vtc/types";
import type { HttpClient } from "../http";

export function createUsersResource(http: HttpClient) {
  return {
    me: () => http.request<User>("/users/me"),
    // Un utilisateur ne peut modifier que sa propre identite affichee -- pas
    // son email (verification requise, hors scope) ni son role (RBAC, pas
    // auto-attribue).
    updateMe: (patch: Pick<User, "firstName" | "lastName" | "avatarUrl">) =>
      http.request<User>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    list: () => http.request<User[]>("/users"),
    // Doc 04 §4 -- seul un Admin Tenant peut inviter, le role doit venir du
    // referentiel RBAC (Doc 05 §3), jamais une valeur libre.
    invite: (input: { email: string; firstName: string; lastName: string; role: RoleCode }) =>
      http.request<User>("/users/invite", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  };
}
