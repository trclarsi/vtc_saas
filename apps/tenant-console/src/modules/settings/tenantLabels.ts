import type { TenantPlan, TenantStatus } from "@vtc/types";

export const STATUS_LABELS: Record<TenantStatus, string> = {
  en_configuration: "En configuration",
  actif: "Actif",
  suspendu: "Suspendu",
};

export const PLAN_LABELS: Record<TenantPlan, string> = {
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
};
