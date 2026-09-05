import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PageHeader,
  Card,
  DetailField,
  StatusDot,
  Avatar,
  TextField,
  Button,
  ErrorState,
  Skeleton,
  useToast,
} from "@vtc/ui";
import { useSession } from "@vtc/auth";
import { apiClient } from "../../api";
import { STATUS_LABELS } from "../users/userLabels";
import { ROLE_LABELS } from "../../shared/roleLabels";

interface FormValues {
  firstName: string;
  lastName: string;
}

// C2 -- profil du compte connecte. Email, role et statut restent en lecture
// seule : email demande une verification (hors scope), role vient du RBAC
// (Doc 05 §3, pas auto-attribuable), statut est gere par un Admin Tenant.
// Prenom/nom sont en revanche de vrais champs editables depuis que `User`
// les porte (ajoutes pour l'avatar/sidebar).
export function ProfilePage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", "me"],
    queryFn: apiClient.users.me,
  });

  const [values, setValues] = useState<FormValues | null>(null);
  const [errors, setErrors] = useState<Partial<FormValues>>({});

  useEffect(() => {
    if (user) setValues({ firstName: user.firstName, lastName: user.lastName });
  }, [user]);

  const mutation = useMutation({
    mutationFn: (input: FormValues) =>
      apiClient.users.updateMe({ ...input, avatarUrl: user?.avatarUrl ?? null }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["users", "me"], updated);
      showToast("Profil mis à jour.");
    },
    onError: () => showToast("La mise à jour a échoué.", "danger"),
  });

  function handleSubmit() {
    if (!values) return;
    const trimmed: FormValues = { firstName: values.firstName.trim(), lastName: values.lastName.trim() };
    const nextErrors: Partial<FormValues> = {};
    if (!trimmed.firstName) nextErrors.firstName = "Le prénom est requis.";
    if (!trimmed.lastName) nextErrors.lastName = "Le nom est requis.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) mutation.mutate(trimmed);
  }

  return (
    <div>
      <PageHeader eyebrow="Compte" title="Mon profil" />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            {isLoading || !user || !values ? (
              <>
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <Avatar
                  firstName={values.firstName || user.firstName}
                  lastName={values.lastName || user.lastName}
                  avatarUrl={user.avatarUrl}
                  size="lg"
                />
                <div>
                  <p className="font-display text-base font-semibold text-ink">
                    {values.firstName} {values.lastName}
                  </p>
                  <p className="text-[13px] text-neutral">{ROLE_LABELS[session.role]}</p>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          {isError ? (
            <ErrorState title="Impossible de charger votre profil" onRetry={() => refetch()} />
          ) : isLoading || !user || !values ? (
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-5 p-4">
              <TextField
                id="profile-first-name"
                label="Prénom"
                value={values.firstName}
                error={errors.firstName}
                onChange={(e) => setValues({ ...values, firstName: e.target.value })}
              />
              <TextField
                id="profile-last-name"
                label="Nom"
                value={values.lastName}
                error={errors.lastName}
                onChange={(e) => setValues({ ...values, lastName: e.target.value })}
              />

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

        {!isLoading && user && (
          <Card className="lg:col-start-2">
            <DetailField label="Email" value={<span className="font-mono">{user.email}</span>} />
            <DetailField label="Rôle" value={ROLE_LABELS[session.role]} />
            <DetailField
              label="Statut"
              value={
                <StatusDot label={STATUS_LABELS[user.status].label} tone={STATUS_LABELS[user.status].tone} />
              }
            />
            <DetailField
              label="Membre depuis"
              value={new Date(user.createdAt).toLocaleDateString("fr-FR")}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
