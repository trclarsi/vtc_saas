import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, TextField, Modal, useToast } from "@vtc/ui";
import { apiClient } from "../../api";

interface FormValues {
  plateNumber: string;
  brand: string;
  model: string;
}

const EMPTY: FormValues = { plateNumber: "", brand: "", model: "" };

export function VehicleCreateForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormValues>>({});

  const mutation = useMutation({
    mutationFn: () => apiClient.vehicles.create(values),
    onSuccess: (vehicle) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setValues(EMPTY);
      onClose();
      showToast(`Le véhicule ${vehicle.plateNumber} a été ajouté.`);
    },
  });

  function validate(): boolean {
    const next: Partial<FormValues> = {};
    if (!values.plateNumber.trim()) next.plateNumber = "L'immatriculation est requise.";
    if (!values.brand.trim()) next.brand = "La marque est requise.";
    if (!values.model.trim()) next.model = "Le modèle est requis.";
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
      title="Ajouter un véhicule"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="vehicle-create-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Ajout en cours…" : "Ajouter le véhicule"}
          </Button>
        </>
      }
    >
      <form id="vehicle-create-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          id="vehicle-plate"
          label="Immatriculation"
          placeholder="DK-1234-AB"
          value={values.plateNumber}
          error={errors.plateNumber}
          onChange={(e) => setValues((v) => ({ ...v, plateNumber: e.target.value }))}
        />
        <TextField
          id="vehicle-brand"
          label="Marque"
          value={values.brand}
          error={errors.brand}
          onChange={(e) => setValues((v) => ({ ...v, brand: e.target.value }))}
        />
        <TextField
          id="vehicle-model"
          label="Modèle"
          value={values.model}
          error={errors.model}
          onChange={(e) => setValues((v) => ({ ...v, model: e.target.value }))}
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
