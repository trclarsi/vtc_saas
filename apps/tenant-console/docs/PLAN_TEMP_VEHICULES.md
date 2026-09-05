# Plan temporaire — Améliorations Véhicules

> Document de travail, à supprimer une fois toutes les cases cochées (contenu à reverser dans
> `DESIGN_ROADMAP.md` au fur et à mesure, comme pour le module Chauffeurs).

Inspiré des améliorations faites sur le module Chauffeurs. État constaté au moment de la
rédaction (`apps/tenant-console/src/modules/vehicles/`).

## Bugs / lacunes prioritaires

- [x] **Chauffeur affecté affiché en ID brut** (`drv-1` au lieu du nom) — `VehicleDetailPage.tsx`
      et `VehiclesPage.tsx` (colonne "Chauffeur affecté"). Résoudre vers le nom + lien, comme
      fait côté Chauffeurs pour le véhicule assigné.
- [x] **Boutons de `BulkActionBar` invisibles sur fond sombre** — `VehiclesPage.tsx` utilise
      `variant="secondary"` au lieu de `inverse`/`dangerInverse` (corrigé côté Chauffeurs).
- [x] **Filtres en chips** (`FilterChip`) au lieu du composant `Select` modernisé — `VehiclesPage.tsx`.

## Vraies lacunes fonctionnelles

- [x] **Aucun moyen de réactiver un véhicule "Retiré"** — `VehicleRowActions.tsx` n'affiche plus
      aucune action une fois `status === "retire"` (juste "—"). Même trou que l'archivage des
      chauffeurs avant l'ajout de "Réactiver".

- [x] **Aucune édition après création** (plaque/marque/modèle figés) — ajouter édition en ligne
      sur `VehicleDetailPage.tsx`, même pattern que `DriverDetailPage.tsx`.
- [x] **Échéances assurance/visite technique en lecture seule** — jamais modifiables après coup.
      (`EditableField` factorisé en composant partagé `shared/EditableField.tsx`, réutilisé par
      Chauffeurs et Véhicules — pas de duplication.)
- [x] **Assignation chauffeur unidirectionnelle** — possible depuis la fiche chauffeur
      (`DriverVehicleAssignment`) mais pas l'inverse depuis la fiche véhicule. Miroir créé :
      `VehicleDriverAssignment.tsx` (ne propose que les chauffeurs validés, actifs, sans
      véhicule déjà affecté ailleurs).
- [x] **Pas de vue carte** sur `VehiclesPage.tsx` (seulement tableau). `VehicleCard.tsx` créé
      (miroir de `DriverCard`, pictogramme à la place d'une photo — différée).
- [x] **Pas d'historique des courses** du véhicule (`Reservation.vehicleId` existe déjà,
      inexploité) — page dédiée + export CSV, comme `DriverHistoryPage.tsx`. `VehicleHistoryPage.tsx`
      créée (miroir de `DriverHistoryPage.tsx`), route `/vehicles/:id/history`, bouton "Historique
      des courses" sur `VehicleDetailPage.tsx`.

## Questions ouvertes (à trancher avant d'implémenter)

- [x] **Formulaire d'ajout** : `VehicleCreateForm.tsx` utilisait `SlideOver` — remplacé par une
      modale centrée (`Modal`), même structure que `DriverCreateForm.tsx` (footer avec
      Annuler/Ajouter, formulaire lié par `form="vehicle-create-form"`).
- [x] **Disponibilité** : les boutons dédiés de `VehicleRowActions.tsx` ("Marquer
      disponible/indisponible/Retirer") ont été remplacés par un menu déroulant (`Select`) à effet
      immédiat, même logique que `AvailabilityField` côté Chauffeurs. Le cas "Retiré → remettre en
      service" est désormais couvert par le même select (plus besoin d'un bouton dédié).

## Pas un manque (déjà couvert autrement)

- Le statut `"retire"` joue déjà le rôle d'"archivé" chez les chauffeurs — pas de nouveau champ
  `archivedAt` nécessaire pour les véhicules.

## Différé (basse priorité, comme pour Chauffeurs)

- Photo du véhicule
- Couverture de tests (`VehicleRowActions`, `VehicleCreateForm`, `VehicleDetailPage`, etc.)

## Ordre convenu avec l'utilisateur

1 → 2 → 3 (rapides, cohérence visuelle) puis 4 → 5 → 6 → 7 → 8.
