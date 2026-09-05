import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, TextField, SelectField, SlideOver, useToast } from "@vtc/ui";
import type { RoleCode } from "@vtc/types";
import { apiClient } from "../../api";

// Doc 03 §19 -- roles qu'un Admin Tenant peut attribuer a un collaborateur
// (super_admin, chauffeur, passager n'ont pas de sens ici).
const ASSIGNABLE_ROLES: { value: RoleCode; label: string }[] = [
  { value: "admin_tenant", label: "Administrateur" },
  { value: "manager_operationnel", label: "Manager opérationnel" },
  { value: "fleet_manager", label: "Gestionnaire de flotte" },
];

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: RoleCode;
}

const EMPTY: FormValues = { firstName: "", lastName: "", email: "", role: "manager_operationnel" };

export function UserInviteForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<"firstName" | "lastName" | "email", string>>>({});

  const mutation = useMutation({
    mutationFn: () => apiClient.users.invite(values),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setValues(EMPTY);
      onClose();
      showToast(`Invitation envoyée à ${user.firstName} ${user.lastName}.`);
    },
  });

  function validate(): boolean {
    const next: typeof errors = {};
    if (!values.firstName.trim()) next.firstName = "Le prénom est requis.";
    if (!values.lastName.trim()) next.lastName = "Le nom est requis.";
    if (!values.email.trim() || !values.email.includes("@")) {
      next.email = "Une adresse email valide est requise.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validate()) mutation.mutate();
  }

  return (
    <SlideOver open={open} title="Inviter un collaborateur" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          id="invite-first-name"
          label="Prénom"
          value={values.firstName}
          error={errors.firstName}
          onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
        />
        <TextField
          id="invite-last-name"
          label="Nom"
          value={values.lastName}
          error={errors.lastName}
          onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
        />
        <TextField
          id="invite-email"
          label="Email"
          type="email"
          placeholder="prenom.nom@entreprise.sn"
          value={values.email}
          error={errors.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
        <SelectField
          id="invite-role"
          label="Rôle"
          value={values.role}
          onChange={(e) => setValues((v) => ({ ...v, role: e.target.value as RoleCode }))}
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </SelectField>

        {mutation.isError && (
          <p className="text-xs font-medium text-danger">
            L'invitation a échoué. Vérifiez la connexion et réessayez.
          </p>
        )}

        <div className="mt-2 flex gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Envoi en cours…" : "Envoyer l'invitation"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
