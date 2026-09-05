import type { RoleCode } from "@vtc/types";

// Doc 03 §19 -- partage entre Layout (identite dans la top bar) et ProfilePage (C2)
export const ROLE_LABELS: Record<RoleCode, string> = {
  super_admin: "Super Admin",
  admin_tenant: "Administrateur",
  manager_operationnel: "Manager opérationnel",
  fleet_manager: "Gestionnaire de flotte",
  chauffeur: "Chauffeur",
  passager: "Passager",
};
