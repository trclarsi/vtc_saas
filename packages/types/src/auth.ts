// Doc 05 §3 — module auth / users
export type UserStatus = "invite" | "actif" | "suspendu";

// Doc 03 §19 — roles prioritaires du MVP
export type RoleCode =
  | "super_admin"
  | "admin_tenant"
  | "manager_operationnel"
  | "fleet_manager"
  | "chauffeur"
  | "passager";

export interface User {
  id: string;
  tenantId: string | null; // nullable uniquement pour le Super Admin (Doc 05 §3)
  email: string;
  firstName: string;
  lastName: string;
  // Reelle si fournie, jamais generee/inventee cote client -- l'absence se
  // traduit par un avatar a initiales (composant Avatar), pas une fausse photo.
  avatarUrl: string | null;
  status: UserStatus;
  createdAt: string; // ISO 8601 -- Doc 05 §1, convention transverse
  updatedAt: string;
}

export interface Role {
  id: string;
  code: RoleCode;
  label: string;
}
