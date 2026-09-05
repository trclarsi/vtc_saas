import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, TextField, Modal, useToast } from "@vtc/ui";
import { apiClient } from "../../api";
import { useTenant } from "../../shared/useTenant";

interface FormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  licenseNumber: string;
}

const EMPTY: FormValues = { firstName: "", lastName: "", phone: "", email: "", licenseNumber: "" };

export function DriverCreateForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const tenant = useTenant();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormValues>>({});

  // Pre-remplit l'indicatif configure par le tenant (Parametres) a
  // l'ouverture, sans ecraser une saisie deja en cours si le panneau etait
  // deja ouvert quand les donnees tenant arrivent.
  useEffect(() => {
    if (open && !values.phone && tenant) {
      setValues((v) => ({ ...v, phone: `${tenant.defaultPhonePrefix} ` }));
    }
  }, [open, tenant, values.phone]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.drivers.create({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email.trim() || undefined,
        licenseNumber: values.licenseNumber.trim() || undefined,
      }),
    onSuccess: (driver) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setValues(EMPTY);
      onClose();
      showToast(`${driver.firstName} ${driver.lastName} a été ajouté aux chauffeurs.`);
    },
  });

  function validate(): boolean {
    const next: Partial<FormValues> = {};
    if (!values.firstName.trim()) next.firstName = "Le prénom est requis.";
    if (!values.lastName.trim()) next.lastName = "Le nom est requis.";
    if (!values.phone.trim()) next.phone = "Le numéro de téléphone est requis.";
    if (values.email.trim() && !values.email.includes("@")) next.email = "Adresse email invalide.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validate()) mutation.mutate();
  }

  return (
    <Modal
      open={open}
      title="Ajouter un chauffeur"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="driver-create-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Ajout en cours…" : "Ajouter le chauffeur"}
          </Button>
        </>
      }
    >
      <form id="driver-create-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          id="driver-first-name"
          label="Prénom"
          value={values.firstName}
          error={errors.firstName}
          onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
        />
        <TextField
          id="driver-last-name"
          label="Nom"
          value={values.lastName}
          error={errors.lastName}
          onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
        />
        <TextField
          id="driver-phone"
          label="Téléphone"
          type="tel"
          placeholder="+221 77 000 00 00"
          value={values.phone}
          error={errors.phone}
          onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
        />
        <TextField
          id="driver-email"
          label="Email (optionnel)"
          type="email"
          value={values.email}
          error={errors.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
        <TextField
          id="driver-license-number"
          label="Numéro de permis (optionnel)"
          value={values.licenseNumber}
          onChange={(e) => setValues((v) => ({ ...v, licenseNumber: e.target.value }))}
        />

        {mutation.isError && (
          <p className="text-xs font-medium text-danger">
            La création a échoué. Vérifiez la connexion et réessayez.
          </p>
        )}
      </form>
    </Modal>
  );
}
