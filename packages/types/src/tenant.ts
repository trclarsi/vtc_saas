// Doc 05 §3 — module tenants
export type TenantStatus = "en_configuration" | "actif" | "suspendu";
export type TenantPlan = "starter" | "business" | "enterprise";
export type PricingModel = "base_km_min" | "zone_fixe" | "manuel";

// Doc 05 §3 -- "structure volontairement souple pour rester configurable sans
// migration" ; le frontend ne fige que les champs qu'il expose reellement
// dans l'ecran de configuration (Doc 04 §3, ecran "Configuration du tenant").
// `theme` remplace un champ couleur libre : un jeu ferme de palettes
// coordonnees, pas de color picker qui pourrait produire un accent illisible
// ou en collision avec les couleurs semantiques (succes/alerte/danger).
export type TenantTheme = "amber" | "cobalt" | "indigo";

export interface TenantBranding {
  logoUrl: string | null;
  theme: TenantTheme;
}

// Fuseaux pertinents pour le marche cible (Doc 00-A §1) -- pas une liste
// IANA complete, qui n'aurait aucun sens pour un tenant operant a Dakar.
export type TenantTimeZone = "Africa/Dakar" | "Africa/Abidjan" | "UTC";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  currency: string;
  branding: TenantBranding;
  timeZone: TenantTimeZone;
  // Indicatif utilise pour pre-remplir le champ telephone a la creation d'un
  // chauffeur (Doc 04 §5) -- evite de le ressaisir a chaque fiche.
  defaultPhonePrefix: string;
  plan: TenantPlan;
  modulesEnabled: string[];
  pricingModel: PricingModel;
  pricingConfig: Record<string, unknown>;
  createdAt: string; // ISO 8601 -- Doc 05 §1, convention transverse
  updatedAt: string;
}
