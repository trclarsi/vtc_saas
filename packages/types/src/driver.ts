// Doc 05 §3 — module drivers
export type DriverValidationStatus = "en_attente" | "valide" | "rejete";
export type DriverAvailabilityStatus = "hors_ligne" | "disponible" | "en_course";

export interface Driver {
  id: string;
  tenantId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  // Optionnel -- un chauffeur n'a pas forcement de compte utilisateur donc
  // pas forcement d'email a saisir des la creation.
  email: string | null;
  // Reelle si fournie, jamais generee/inventee cote client -- l'absence se
  // traduit par un avatar a initiales (composant Avatar), pas une fausse photo.
  avatarUrl: string | null;
  validationStatus: DriverValidationStatus;
  availabilityStatus: DriverAvailabilityStatus;
  // Identifiant du permis (distinct de son echeance ci-dessous) -- optionnel,
  // completable apres la creation rapide du chauffeur.
  licenseNumber: string | null;
  // Echeance du permis de conduire -- point de conformite reglementaire concret
  // (pas seulement un confort), null tant que le document n'a pas ete saisi.
  licenseExpiresAt: string | null;
  // Chauffeur qui a quitte la flotte -- retire des listes/actions actives
  // sans supprimer son historique de courses (Reservation.driverId le
  // reference toujours). null tant qu'il est actif.
  archivedAt: string | null;
  createdAt: string; // ISO 8601 -- Doc 05 §1, convention transverse
  updatedAt: string;
}
