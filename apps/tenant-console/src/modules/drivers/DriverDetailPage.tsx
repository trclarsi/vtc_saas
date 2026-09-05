import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, History } from "lucide-react";
import { PageHeader, Card, DetailField, StatusDot, Select, Button, ErrorState, Skeleton, useToast } from "@vtc/ui";
import type { Driver, DriverAvailabilityStatus } from "@vtc/types";
import { apiClient } from "../../api";
import { VALIDATION_LABELS, AVAILABILITY_LABELS } from "./driverLabels";
import { DriverRowActions } from "./DriverRowActions";
import { DriverArchiveAction } from "./DriverArchiveAction";
import { DriverAvatarUpload } from "./DriverAvatarUpload";
import { DriverVehicleAssignment } from "./DriverVehicleAssignment";
import { DocumentExpiry } from "../../shared/DocumentExpiry";
import { EditableField } from "../../shared/EditableField";

interface EditableValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiresAt: string; // "YYYY-MM-DD" pour <input type="date">, "" si non renseigne
}

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function valuesFromDriver(driver: Driver): EditableValues {
  return {
    firstName: driver.firstName,
    lastName: driver.lastName,
    phone: driver.phone,
    email: driver.email ?? "",
    licenseNumber: driver.licenseNumber ?? "",
    licenseExpiresAt: toDateInputValue(driver.licenseExpiresAt),
  };
}

// Changement immediat, separe du gros formulaire d'edition -- une
// disponibilite n'est pas un brouillon qu'on valide plus tard, l'utilisateur
// s'attend a un effet tout de suite (meme logique que Valider/Rejeter).
export function AvailabilityField({ driver }: { driver: Driver }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: (status: DriverAvailabilityStatus) =>
      apiClient.drivers.update(driver.id, { availabilityStatus: status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["drivers", driver.id], updated);
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: () => showToast("Le changement de disponibilité a échoué.", "danger"),
  });

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <span className="font-mono text-[11px] uppercase tracking-wide text-neutral">Disponibilité</span>
      <Select
        size="sm"
        fullWidth={false}
        value={driver.availabilityStatus}
        onChange={(e) => mutation.mutate(e.target.value as DriverAvailabilityStatus)}
        disabled={mutation.isPending}
      >
        {(Object.keys(AVAILABILITY_LABELS) as DriverAvailabilityStatus[]).map((key) => (
          <option key={key} value={key}>
            {AVAILABILITY_LABELS[key].label}
          </option>
        ))}
      </Select>
    </div>
  );
}

// Doc 04 §5 — fiche detail d'un chauffeur (B1)
export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: driver, isLoading, isError, refetch } = useQuery({
    queryKey: ["drivers", id],
    queryFn: () => apiClient.drivers.get(id!),
    enabled: !!id,
  });
  // Meme cache partage que VehiclesPage (queryKey ["vehicles"]) -- pas de
  // requete dediee "vehicule courant du chauffeur X", juste un filtre client
  // sur une liste deja chargee ailleurs dans l'app.
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: apiClient.vehicles.list,
  });
  const currentVehicle = vehicles?.find((v) => v.currentDriverId === id) ?? null;

  const [values, setValues] = useState<EditableValues | null>(null);

  // Resynchronise a chaque nouvelle donnee serveur (chargement initial, ou
  // apres un enregistrement reussi) -- pendant une edition en cours, `driver`
  // ne change pas tant qu'on n'a pas sauvegarde, donc ca n'ecrase jamais une
  // saisie non enregistree.
  useEffect(() => {
    if (driver) setValues(valuesFromDriver(driver));
  }, [driver]);

  const isDirty = !!driver && !!values && JSON.stringify(values) !== JSON.stringify(valuesFromDriver(driver));
  const hasRequiredFields = !!values && !!values.firstName.trim() && !!values.lastName.trim() && !!values.phone.trim();
  const hasValidEmail = !!values && (!values.email.trim() || values.email.includes("@"));
  const canSave = isDirty && hasRequiredFields && hasValidEmail;

  const mutation = useMutation({
    mutationFn: () => {
      const v = values!;
      return apiClient.drivers.update(driver!.id, {
        firstName: v.firstName,
        lastName: v.lastName,
        phone: v.phone,
        email: v.email.trim() || null,
        licenseNumber: v.licenseNumber.trim() || null,
        licenseExpiresAt: v.licenseExpiresAt ? new Date(v.licenseExpiresAt).toISOString() : null,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["drivers", id], updated);
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showToast("Chauffeur mis à jour.");
      // Referme un champ laisse ouvert sans avoir perdu le focus (ex. clic
      // direct sur "Enregistrer" sans repasser par Tab/clic ailleurs).
      (document.activeElement as HTMLElement | null)?.blur();
    },
    onError: () => showToast("La mise à jour a échoué.", "danger"),
  });

  function handleCancel() {
    if (driver) setValues(valuesFromDriver(driver));
  }

  return (
    <div>
      <Link
        to="/drivers"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Chauffeurs
      </Link>

      <PageHeader
        eyebrow="Fiche chauffeur"
        title={driver ? `${driver.firstName} ${driver.lastName}` : "Chauffeur"}
        actions={
          <>
            {isDirty && (
              <>
                <Button variant="ghost" onClick={handleCancel} disabled={mutation.isPending}>
                  Annuler
                </Button>
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={!canSave || mutation.isPending}
                  title={!hasRequiredFields ? "Prénom, nom et téléphone sont requis." : undefined}
                >
                  {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </>
            )}
            {driver && (
              <Button variant="secondary" onClick={() => navigate(`/drivers/${driver.id}/history`)}>
                <History size={15} />
                Historique des courses
              </Button>
            )}
          </>
        }
      />

      <Card>
        {isError ? (
          <ErrorState title="Impossible de charger ce chauffeur" onRetry={() => refetch()} />
        ) : isLoading || !driver || !values ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : (
          <div>
            {driver.archivedAt && (
              <div className="border-b border-line bg-paper px-4 py-2.5 text-[13px] text-neutral">
                Chauffeur archivé le {new Date(driver.archivedAt).toLocaleDateString("fr-FR")} — non
                proposable pour de nouvelles courses.
              </div>
            )}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <DriverAvatarUpload driver={driver} />
              <div>
                <p className="font-display text-base font-semibold text-ink">
                  {values.firstName} {values.lastName}
                </p>
                <p className="text-[13px] text-neutral">{values.email || "Email non renseigné"}</p>
              </div>
            </div>
            <EditableField
              label="Prénom"
              value={values.firstName}
              onChange={(v) => setValues((s) => s && { ...s, firstName: v })}
            />
            <EditableField
              label="Nom"
              value={values.lastName}
              onChange={(v) => setValues((s) => s && { ...s, lastName: v })}
            />
            <EditableField
              label="Téléphone"
              type="tel"
              value={values.phone}
              onChange={(v) => setValues((s) => s && { ...s, phone: v })}
            />
            <EditableField
              label="Email"
              type="email"
              value={values.email}
              onChange={(v) => setValues((s) => s && { ...s, email: v })}
            />
            <DetailField
              label="Validation"
              value={
                <StatusDot
                  label={VALIDATION_LABELS[driver.validationStatus].label}
                  tone={VALIDATION_LABELS[driver.validationStatus].tone}
                />
              }
            />
            <AvailabilityField driver={driver} />
            <DetailField
              label="Véhicule actuel"
              value={
                <DriverVehicleAssignment
                  driverId={driver.id}
                  currentVehicle={currentVehicle}
                  vehicles={vehicles ?? []}
                />
              }
            />
            <EditableField
              label="Numéro de permis"
              value={values.licenseNumber}
              onChange={(v) => setValues((s) => s && { ...s, licenseNumber: v })}
            />
            <EditableField
              label="Échéance du permis"
              type="date"
              value={values.licenseExpiresAt}
              onChange={(v) => setValues((s) => s && { ...s, licenseExpiresAt: v })}
              displayValue={
                <DocumentExpiry
                  dateIso={values.licenseExpiresAt ? new Date(values.licenseExpiresAt).toISOString() : null}
                />
              }
            />
            <DetailField
              label="Ajouté le"
              value={new Date(driver.createdAt).toLocaleDateString("fr-FR")}
            />
            <div className="flex items-center justify-end gap-2 px-4 py-3">
              <DriverArchiveAction driver={driver} />
              <DriverRowActions driver={driver} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
