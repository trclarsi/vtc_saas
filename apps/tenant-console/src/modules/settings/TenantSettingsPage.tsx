import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check } from "lucide-react";
import {
  PageHeader,
  Card,
  DetailField,
  ErrorState,
  Skeleton,
  TextField,
  SelectField,
  Button,
  useToast,
} from "@vtc/ui";
import type { Tenant, TenantBranding, TenantTheme, TenantTimeZone } from "@vtc/types";
import { apiClient } from "../../api";
import { PLAN_LABELS, STATUS_LABELS } from "./tenantLabels";

interface FormValues {
  name: string;
  currency: string;
  branding: TenantBranding;
  timeZone: TenantTimeZone;
  defaultPhonePrefix: string;
}

// Valeurs alignees sur les blocs `:root[data-brand="…"]` de tokens.css --
// un seul endroit connait les 3 couleurs reelles (packages/ui), celui-ci ne
// sert qu'a dessiner les pastilles de choix, pas a definir la couleur.
const THEME_OPTIONS: { value: TenantTheme; label: string; swatch: string }[] = [
  { value: "amber", label: "Ambre", swatch: "#e0862d" },
  { value: "cobalt", label: "Cobalt", swatch: "#2e5aac" },
  { value: "indigo", label: "Indigo", swatch: "#4f46c7" },
];

const TIMEZONE_OPTIONS: { value: TenantTimeZone; label: string }[] = [
  { value: "Africa/Dakar", label: "Dakar (GMT)" },
  { value: "Africa/Abidjan", label: "Abidjan (GMT)" },
  { value: "UTC", label: "UTC" },
];

function toFormValues(tenant: Tenant): FormValues {
  return {
    name: tenant.name,
    currency: tenant.currency,
    branding: { ...tenant.branding },
    timeZone: tenant.timeZone,
    defaultPhonePrefix: tenant.defaultPhonePrefix,
  };
}

// Doc 04 §3 -- ecran "Configuration du tenant". Un Admin Tenant ne configure
// que ses champs propres (identite, devise, branding) ; l'offre commerciale,
// les modules actives et le statut restent du ressort du Super Admin
// (regle 2) et sont donc affiches en lecture seule, jamais editables ici.
export function TenantSettingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: tenant, isLoading, isError, refetch } = useQuery({
    queryKey: ["tenant"],
    queryFn: apiClient.tenant.get,
  });

  const [values, setValues] = useState<FormValues | null>(null);
  const [errors, setErrors] = useState<Partial<Record<"name" | "currency" | "defaultPhonePrefix", string>>>(
    {},
  );

  // Le formulaire se resynchronise sur les donnees serveur a chaque
  // (re)chargement -- une page de parametres n'a pas de brouillon local a
  // preserver entre deux visites, contrairement a un formulaire de creation.
  useEffect(() => {
    if (tenant) setValues(toFormValues(tenant));
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: (input: FormValues) => apiClient.tenant.update(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(["tenant"], updated);
      showToast("Paramètres enregistrés.");
    },
    onError: () => showToast("L'enregistrement a échoué.", "danger"),
  });

  function validate(next: FormValues): boolean {
    const nextErrors: typeof errors = {};
    if (!next.name.trim()) nextErrors.name = "Le nom affiché est requis.";
    if (!/^[A-Z]{3}$/.test(next.currency.trim())) {
      nextErrors.currency = "Code devise ISO 4217 sur 3 lettres majuscules (ex. XOF).";
    }
    if (!/^\+\d{1,4}$/.test(next.defaultPhonePrefix.trim())) {
      nextErrors.defaultPhonePrefix = "Indicatif au format +221.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit() {
    if (!values) return;
    const trimmed: FormValues = {
      ...values,
      name: values.name.trim(),
      currency: values.currency.trim().toUpperCase(),
      defaultPhonePrefix: values.defaultPhonePrefix.trim(),
      branding: { ...values.branding, logoUrl: values.branding.logoUrl?.trim() || null },
    };
    if (validate(trimmed)) mutation.mutate(trimmed);
  }

  return (
    <div>
      <PageHeader eyebrow="Configuration" title="Paramètres du tenant" />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          {isError ? (
            <ErrorState title="Impossible de charger les paramètres" onRetry={() => refetch()} />
          ) : isLoading || !tenant || !values ? (
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-5 p-4">
              <TextField
                id="tenant-name"
                label="Nom affiché"
                value={values.name}
                error={errors.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
              <TextField
                id="tenant-currency"
                label="Devise (ISO 4217)"
                placeholder="XOF"
                value={values.currency}
                error={errors.currency}
                onChange={(e) => setValues({ ...values, currency: e.target.value })}
              />
              <TextField
                id="tenant-phone-prefix"
                label="Indicatif téléphonique par défaut"
                placeholder="+221"
                value={values.defaultPhonePrefix}
                error={errors.defaultPhonePrefix}
                onChange={(e) => setValues({ ...values, defaultPhonePrefix: e.target.value })}
              />
              <SelectField
                id="tenant-timezone"
                label="Fuseau horaire"
                value={values.timeZone}
                onChange={(e) =>
                  setValues({ ...values, timeZone: e.target.value as TenantTimeZone })
                }
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </SelectField>
              <TextField
                id="tenant-logo-url"
                label="URL du logo"
                type="url"
                placeholder="https://…"
                value={values.branding.logoUrl ?? ""}
                onChange={(e) =>
                  setValues({ ...values, branding: { ...values.branding, logoUrl: e.target.value } })
                }
              />

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink">Couleur de marque</span>
                <div className="flex gap-2">
                  {THEME_OPTIONS.map((theme) => {
                    const selected = values.branding.theme === theme.value;
                    return (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() =>
                          setValues({ ...values, branding: { ...values.branding, theme: theme.value } })
                        }
                        aria-pressed={selected}
                        title={theme.label}
                        className={`flex h-10 w-10 items-center justify-center rounded-md border-2 transition-colors ${
                          selected ? "border-ink" : "border-transparent hover:border-line"
                        }`}
                      >
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: theme.swatch }}
                        >
                          {selected && <Check size={14} className="text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {mutation.isError && (
                <p className="text-xs font-medium text-danger">
                  L'enregistrement a échoué. Vérifiez la connexion et réessayez.
                </p>
              )}

              <div>
                <Button onClick={handleSubmit} disabled={mutation.isPending}>
                  {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          {tenant && (
            <>
              <Card>
                <span className="block px-4 pt-4 font-mono text-[11px] uppercase tracking-wide text-neutral">
                  Aperçu
                </span>
                <div className="flex items-center gap-3 p-4">
                  {values?.branding.logoUrl ? (
                    <img
                      src={values.branding.logoUrl}
                      alt=""
                      className="h-10 w-10 flex-shrink-0 rounded-md border border-line object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-line bg-paper text-neutral">
                      <Building2 size={18} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">
                      {values?.name || "—"}
                    </p>
                    <p className="font-mono text-[11px] text-neutral">{values?.currency || "—"}</p>
                  </div>
                  <span
                    className="ml-auto h-6 w-6 flex-shrink-0 rounded-full border border-line"
                    style={{
                      backgroundColor: THEME_OPTIONS.find((t) => t.value === values?.branding.theme)
                        ?.swatch,
                    }}
                    aria-hidden="true"
                  />
                </div>
              </Card>

              <Card>
                <span className="block px-4 pt-4 font-mono text-[11px] uppercase tracking-wide text-neutral">
                  Défini par le Super Admin
                </span>
                <DetailField label="Statut" value={STATUS_LABELS[tenant.status]} />
                <DetailField label="Offre" value={PLAN_LABELS[tenant.plan]} />
                <DetailField label="Modules actifs" value={tenant.modulesEnabled.join(", ") || "—"} />
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
