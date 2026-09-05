# Feuille de route UX/UI — tenant-console

Améliorations progressives, une partie à la fois. Chaque partie s'appuie sur un patron précis observé dans une app de référence du même métier (voir la discussion de cadrage pour la liste complète : Samsara, Fleetio, Onfleet, Bolt, Grab, Linear, Stripe Dashboard, Vercel).

## Statut

- [x] **Partie 1 — Coquille applicative (sidebar + top bar)**
      Inspiration : Linear (repliable), Samsara (hiérarchie de nav)
      Sidebar repliable en icônes seules sur desktop, tiroir avec fond superposé sur mobile/tablette.

- [x] **Partie 2 — Tableau de bord**
      Inspiration : Samsara (aperçu opérationnel), Stripe (cartes avec tendance)

      **Point tranché avant implémentation** : une tendance type "+3 cette semaine" a été
      écartée pour l'instant — elle demanderait de comparer à une période passée, et rien
      dans l'API actuelle ne fournit ça honnêtement (pas d'endpoint d'historique). L'inventer
      côté client violerait le principe directeur ci-dessous. À la place, on affiche des
      répartitions réelles, calculées à partir des données déjà chargées :

      1. Ajouter `createdAt` aux types `Driver`/`Vehicle`/`Reservation`/`User` (`packages/types`)
         — prévu par le Doc 05 §1 mais oublié à la création des types, à corriger.
      2. Carte Chauffeurs : total + badge alerte "N en attente de validation" (réel, actionnable).
      3. Carte Véhicules : total + badge "N indisponibles".
      4. Carte Réservations : total + "N en cours en ce moment" (pertinent temps réel pour un dispatcher).
      5. ~~"Nouveaux cette semaine" par carte~~ — écarté à l'implémentation : deux métriques
         par carte (alerte + delta temporel) surchargeaient une carte de cette taille. L'alerte
         actionnable (chauffeur en attente, véhicule indisponible) a plus de valeur pour un
         dispatcher qu'un delta informatif — un seul message par carte, pas deux. `createdAt`
         reste ajouté aux types (Doc 05 §1), prêt si un vrai besoin de tendance apparaît plus tard.
      6. Liste compacte des chauffeurs en attente de validation (3–5 lignes) — reprend le pattern d'alerte de Samsara.
      7. Squelettes de chargement sur les cartes (actuellement juste "—").

- [x] **Partie 3 — Tableaux de données (Chauffeurs, Véhicules, Réservations, Utilisateurs)**
      Inspiration : Stripe Dashboard (tri/filtres/pagination), Fleetio (densité lisible)
      Tri par colonne, filtre par statut (chips), pagination quand la liste grandit.

- [x] **Partie 4 — Formulaires & création**
      Inspiration : Linear (panneau latéral, garde le contexte), Stripe (validation inline)

      Panneau latéral (`SlideOver`) + champs avec erreurs inline (`TextField`/`SelectField`),
      réutilisables. Mutations réelles via `@tanstack/react-query`, invalidation de la liste
      concernée au succès.

      - Chauffeurs : formulaire complet (prénom, nom, téléphone) → `apiClient.drivers.create()`
      - Véhicules : formulaire complet (immatriculation, marque, modèle) → `apiClient.vehicles.create()`
      - Utilisateurs : formulaire complet (email, rôle limité aux rôles tenant pertinents,
        Doc 03 §19) → nouvelle méthode `apiClient.users.invite()` ajoutée à cette occasion
      - **Réservations : bouton "Nouvelle réservation" désactivé, pas construit.** Créer une
        réservation exige de sélectionner un passager, or `User` ne porte pas son rôle côté
        client (le rôle vit dans la table de jointure `UserRole`, Doc 05 §3) — impossible de
        distinguer un passager d'un collaborateur sans fabriquer une fausse liste. Le bouton
        est désactivé avec une raison explicite (`title`) plutôt que branché sur du faux.
        À reprendre une fois qu'un endpoint de sélection de passager existe côté backend.

- [x] **Partie 5 — États d'erreur réseau**
      Inspiration : Vercel/Linear (dire quoi s'est passé et quoi faire)

      **Vrai bug corrigé** : jusqu'ici, un échec de requête (`isError`) n'était pas distingué
      d'une liste vide — `data ?? []` masquait silencieusement l'erreur et affichait "Aucune
      donnée" comme si tout allait bien. Avec aucun backend en place, c'était le cas sur
      *chaque* page en permanence.

      `ErrorState` (packages/ui) appliqué aux 5 pages (Chauffeurs, Véhicules, Réservations,
      Utilisateurs, Tableau de bord) avec bouton "Réessayer" branché sur `refetch()`.

- [x] **Partie 6 — Micro-interactions**
      Inspiration : Linear (transitions discrètes)

      `ToastProvider`/`useToast` (packages/ui) — confirmation après création réussie sur les
      3 formulaires réels (Chauffeur, Véhicule, Invitation). Jusqu'ici, fermer le panneau était
      la seule confirmation ; rien ne disait explicitement que l'action avait réussi.
      Transition en fondu (150 ms) au changement de route dans `Layout`, respecte
      `prefers-reduced-motion` (règle globale déjà en place, tokens.css).

- [x] **Partie 7 — Responsive / mobile (tableaux)**
      Tableaux en cartes empilées sur petit écran. (La sidebar mobile est traitée en Partie 1.)

      `DataTable` bascule automatiquement en liste de cartes (label/valeur) sous `md`, plutôt
      qu'un défilement horizontal peu pratique au doigt — un seul composant, deux rendus.
      **Limite connue et acceptée** : le tri par colonne n'a pas de déclencheur sur mobile
      (pas d'en-têtes de tableau visibles) ; les cartes respectent le tri déjà actif mais on
      ne peut pas le changer depuis la vue mobile. Non demandé par cette partie, pas construit
      pour éviter d'ajouter une interface non prévue.

## Phase 2 — plan exhaustif (frontend uniquement, sans backend)

Les 7 premières parties couvraient l'habillage et les interactions de base. Ce qui suit va plus
loin, organisé par groupe, avec un ordre de priorité justifié. Tout reste "frontend seul" — les
actions qui appellent une API échoueront tant qu'aucun backend n'existe, exactement comme les
formulaires de création déjà construits (Partie 4) : c'est un choix assumé, pas un oubli.

### Groupe A — Fiabilité et qualité (avant d'ajouter de la surface)

- [x] **A1. Accessibilité — corriger de vrais manques actuels**
      - `SlideOver` : piège à focus ajouté (Tab/Shift+Tab reste dans le panneau), focus déplacé
        au premier élément focusable à l'ouverture, et rendu à l'élément déclencheur (le bouton
        "Ajouter…") à la fermeture — trois manquements WCAG réels, pas du confort optionnel.
      - `ToastProvider` : `aria-live="polite"` sur le conteneur — un lecteur d'écran annonce
        maintenant la confirmation sans avoir à naviguer dessus.
      - Audit rapide du contraste : `ink`/`paper`, `ink`/`surface` et `teal`/`surface` passent
        largement AA. `accent` n'est jamais utilisé comme texte de petite taille sur fond clair
        (uniquement icônes, fonds, bordures, ou texte sur fond sombre) — pas de correction nécessaire.
- [x] **A2. Tests unitaires** sur la logique non triviale : tri/pagination de `DataTable`,
      `WaypointTracker` (mapping statut → étape), filtres client des 4 pages liste.

      Vitest (cohérent avec Vite déjà en place) + Testing Library pour `packages/ui`
      (composants qui rendent quelque chose de non trivial), Vitest seul pour `tenant-console`
      (fonctions pures, pas de rendu nécessaire). La logique de filtrage des 4 pages a été
      **extraite en fonctions pures** (`filterDrivers.ts`, `filterVehicles.ts`, `filterUsers.ts`,
      `filterReservations.ts`) — bénéfice en passant : logique séparée de l'affichage, testable
      sans rendre de DOM.

      **Deux vrais bugs trouvés par les tests eux-mêmes, avant même de tester la logique
      métier** :
      1. Le DOM n'était pas nettoyé entre les tests (`@testing-library/react` ne détecte pas
         automatiquement un `afterEach` global sans le mode `globals` de Vitest) — corrigé dans
         `vitest.setup.ts`.
      2. `tsc` ne connaissait pas les matchers `jest-dom` (`toBeInTheDocument`) car le fichier
         qui les importe (`vitest.setup.ts`) n'était pas inclus dans le `tsconfig.json` du
         package — corrigé via un fichier d'augmentation de types dédié dans `src/`.

      25 tests passent (8 dans `packages/ui`, 17 dans `tenant-console`).
- [x] **A3. Découpage du bundle par route** (`React.lazy` + `Suspense`)

      Chaque page (Dashboard, Chauffeurs, Véhicules, Réservations, Utilisateurs, Connexion)
      devient un chunk séparé, chargé à la navigation. Le chunk principal est passé de
      ~250 Ko à ~210 Ko ; les pages individuelles pèsent entre 2,7 et 4,5 Ko chacune.
      `RouteFallback` (texte "Chargement…") comme repli pendant le chargement d'un chunk.

### Groupe B — Fonctionnalités manquantes pour un usage réel

- [x] **B1. Vues détail** (Chauffeur, Véhicule, Réservation)

      `DataTable` gagne un `onRowClick?: (row: T) => void` générique (pas de prop "href" —
      le composant ne doit pas dépendre de react-router, packages/ui reste utilisable par
      n'importe quelle app, Doc 06 §6). Chaque page liste navigue vers `/drivers/:id`,
      `/vehicles/:id`, `/reservations/:id` au clic — accessible au clavier (Entrée/Espace sur
      une ligne focusable), pas seulement à la souris.

      Nouveau composant partagé `DetailField` (paire étiquette/valeur). Les correspondances
      statut → libellé, jusqu'ici dupliquées dans chaque page liste, ont été extraites
      (`driverLabels.ts`, `vehicleLabels.ts`) et réutilisées dans les fiches détail.

      Les fiches Véhicule et Réservation ont un lien croisé vers le Chauffeur affecté quand il
      existe — utilité concrète de la navigation par fiche plutôt qu'un simple habillage.

      `Utilisateurs` ne reçoit pas de fiche détail dans cette partie (hors périmètre B1, moins
      critique opérationnellement qu'un chauffeur/véhicule/réservation).
- [x] **B2. Actions contextuelles par ligne** (valider/rejeter un chauffeur, changer le statut
      d'un véhicule, annuler une réservation)

      `Button` gagne une prop `size` ("md"/"sm") définie en chaînes complètes par taille plutôt
      qu'un override partiel de classes Tailwind (deux utilitaires ciblant la même propriété
      n'ont pas d'ordre de priorité garanti à la simple concaténation de chaînes).

      Trois composants d'action (`DriverRowActions`, `VehicleRowActions`,
      `ReservationRowActions`), chacun conditionné aux règles de gestion réelles du Doc 04 :
      - Chauffeur : Valider/Rejeter, visibles seulement si `en_attente` (règle 2, §5)
      - Véhicule : bascule disponible/indisponible + Retirer, masqué si déjà `retire`
        (règle 4, §6 — jamais de suppression physique, Doc 05 §1)
      - Réservation : Annuler, visible seulement si `planifiee`/`confirmee` (règle 2, §7 —
        jamais depuis `en_cours`/`terminee`)

      Chaque composant est **réutilisé tel quel** entre la ligne de liste (colonne "Actions")
      et le pied de la fiche détail (B1) — pas de duplication de la logique de mutation.
      `stopPropagation` sur clic et clavier pour éviter qu'une action dans une ligne ne
      déclenche aussi la navigation vers la fiche détail (`onRowClick` du parent).
- [x] **B3. Filtres/tri persistés dans l'URL** (query params) — permet de partager un lien filtré
      et rend le bouton retour du navigateur cohérent.

      Hook partagé `useUrlFilters` (`shared/useUrlFilters.ts`), bâti sur `useSearchParams` de
      react-router-dom, appliqué aux 4 pages liste (Chauffeurs, Véhicules, Réservations,
      Utilisateurs) à la place d'un `useState` local pour `query`/`statusFilter`. `?q=` et
      `?status=` reflètent l'état réel — un lien copié-collé rouvre la page dans le même état
      filtré, et le bouton retour du navigateur redonne l'état précédent au lieu de tout
      réinitialiser silencieusement. `{ replace: true }` sur chaque mise à jour pour ne pas
      empiler une entrée d'historique à chaque frappe dans le champ de recherche — seule la
      navigation entre pages doit créer une entrée, pas la frappe.

      **Volontairement hors périmètre : le tri de colonne n'est pas persisté dans l'URL.**
      `DataTable` gère son tri en interne (`useState` local, Partie 3) ; le rendre pilotable
      depuis l'extérieur demanderait de faire remonter l'état de tri au composant parent sur
      les 4 pages — un refactor plus lourd que ce que justifie le besoin actuel. Le filtre de
      statut et la recherche couvrent le cas d'usage réel ("partager cette vue filtrée") ; le
      tri, moins souvent partagé tel quel, reste local pour l'instant.
- [x] **B4. Actions groupées** (sélection multiple + action de masse)

      `DataTable` gagne une colonne case à cocher optionnelle (`selectedIds`/`onSelectionChange`,
      contrôlée par l'appelant — le composant ne connaît pas les règles d'éligibilité métier).
      La case d'en-tête sélectionne/désélectionne la page courante uniquement (comportement
      standard : la sélection ne s'étend pas silencieusement aux pages non visibles).

      Nouveau `BulkActionBar` (packages/ui) : apparaît au-dessus du tableau dès qu'une sélection
      existe, affiche le nombre sélectionné et les actions groupées disponibles.

      Nouveau hook `useBulkAction` (`shared/useBulkAction.ts`) factorise le patron commun aux
      3 pages concernées : appliquer une mutation à chaque élément sélectionné via
      `Promise.allSettled` (pas de transaction atomique possible sans endpoint bulk dédié côté
      backend), invalider la liste, puis annoncer un résultat honnête — y compris les échecs
      partiels ("3 réussite(s), 1 échec(s)") plutôt qu'un message générique qui masquerait une
      erreur sur un sous-ensemble.

      **Chaque bouton n'agit que sur le sous-ensemble réellement éligible de la sélection**,
      avec le compte affiché dans le libellé et le bouton désactivé (+ `title` explicatif) si
      ce sous-ensemble est vide — mêmes règles de gestion que les actions par ligne (B2), pas de
      nouvelle règle inventée pour l'occasion :
      - Chauffeurs : Valider/Rejeter, comptés parmi les sélectionnés `en_attente`
      - Véhicules : Marquer disponible / indisponible / Retirer, chacun compté parmi les
        sélectionnés éligibles à cette transition
      - Réservations : Annuler, compté parmi les sélectionnés `planifiee`/`confirmee`

      La sélection est réinitialisée (intersection avec les lignes encore visibles) à chaque
      changement de recherche/filtre, pour qu'une ligne masquée par un filtre ne reste jamais
      sélectionnée invisiblement.

      **Utilisateurs n'a pas d'actions groupées dans cette partie** — cohérent avec B1/B2 :
      cette page n'a jamais eu d'actions par ligne, donc aucune règle métier à généraliser en
      masse.

### Groupe C — Espaces encore vides

- [x] **C1. Page paramètres du tenant** (branding : nom, logo, couleurs — Doc 02 §5)

      **Vrai manque comblé dans les types** : `Tenant` (packages/types) n'avait ni `branding`
      (prévu par le Doc 05 §3 — "JSON, structure volontairement souple") ni `createdAt`/
      `updatedAt` (convention transverse du Doc 05 §1, même oubli déjà corrigé pour
      `Driver`/`Vehicle`/`Reservation`/`User` en Partie 2). `TenantBranding` fixe côté frontend
      les deux seuls champs réellement affichés dans cet écran (`logoUrl`, `primaryColor`) —
      la souplesse JSON reste un détail d'implémentation backend, pas une raison de typer
      `unknown` côté client.

      Nouvelle ressource `apiClient.tenant` (`get`/`update`), nouvelle page
      `TenantSettingsPage` accessible via `/settings`, lien "Paramètres" ajouté à la barre
      latérale (visible seulement pour `admin_tenant`, même pattern que "Utilisateurs").

      **Respecte strictement la règle 2 du Doc 04 §3** : "un tenant ne peut configurer que
      les champs qui lui sont propres (identité, devise, branding) — jamais les modules
      activés ni son offre commerciale". Le formulaire n'expose donc que nom affiché, devise
      (validée ISO 4217, 3 lettres) et branding (URL logo, couleur principale). Statut, offre
      commerciale et modules actifs sont affichés en lecture seule dans un second panneau
      explicitement intitulé "Défini par le Super Admin" — pas de champ désactivé qui
      suggérerait à tort une édition possible.

      Panneau d'aperçu (logo/couleur/nom en temps réel pendant la frappe) — utilité concrète
      immédiate du formulaire plutôt qu'un simple enregistrement à l'aveugle.

      **Pas de bouton "Activer le tenant"** : la règle 5 du Doc 04 §3 fait de l'activation
      une conséquence automatique de la complétion des champs (nom, devise, premier admin),
      pas une action déclenchée manuellement — en ajouter une aurait été une affordance qui
      ne correspond à aucune règle métier documentée.
- [x] **C2. Page profil utilisateur**

      **Vrai manque comblé** : l'avatar de la top bar (`Layout`) était déjà présent visuellement
      depuis la Partie 1 mais ne réagissait à aucun clic — une affordance qui ne fait rien,
      contraire au principe directeur. Il pointe maintenant vers `/profile`.

      `ProfilePage` affiche email, rôle, statut du compte, tenant et date d'ajout, via
      `apiClient.users.me()` + `useSession()`. `ROLE_LABELS` (jusqu'ici local à `Layout.tsx`) et
      `STATUS_LABELS` (jusqu'ici local à `UsersPage.tsx`) ont été extraits dans des fichiers
      partagés (`shared/roleLabels.ts`, `modules/users/userLabels.ts`) pour être réutilisés ici
      sans duplication — même logique d'extraction qu'en B1 pour les libellés chauffeur/véhicule.

      **Volontairement en lecture seule, aucun champ éditable** : le modèle `User` (Doc 05 §3)
      n'expose aucune donnée que l'utilisateur peut modifier lui-même (pas de nom affiché, pas
      d'avatar personnalisé). Un changement de mot de passe en cours de session n'est pas un
      écran prévu par le Doc 04 §2 — seuls "mot de passe oublié" et "définition à la première
      connexion" le sont, tous deux hors du périmètre d'une page de profil. Construire un
      formulaire d'édition ici aurait simulé une capacité absente du modèle de données.

      **Pas de bouton de déconnexion** — cohérent avec la Partie 1 ("top bar avec identité de
      rôle, sans fausses données utilisateur ni déconnexion") : `SessionProvider` reçoit
      aujourd'hui une session de développement figée (`main.tsx`), il n'existe encore aucun
      mécanisme réel pour la réinitialiser tant que le flux d'authentification (Doc 07 §5)
      n'est pas branché.

### Groupe D — Confort avancé (le plus dispensable, à ne faire qu'en dernier)

**Mis en pause après C2** : les groupes A, B et C (fiabilité, fonctionnalités opérationnelles,
pages vides) couvrent tout ce qui a une valeur d'usage réelle pour un dispatcher/admin tenant.
D reste du confort pur (raccourcis, palette de commandes, thème) — à reprendre seulement si le
besoin se fait sentir, pas par défaut de suite logique.

- [ ] **D1. Palette de commandes (Cmd+K)**, façon Linear
- [ ] **D2. Raccourcis clavier de navigation**
- [ ] **D3. Mode sombre**

### Ordre recommandé

**A → B → C → D.** Les groupes A corrigent des manques réels (accessibilité, absence de tests)
avant que la surface de code ne grossisse encore ; B apporte la valeur opérationnelle la plus
attendue par un dispatcher réel ; C comble des pages vides mais moins urgentes ; D est du confort
pur, à ne considérer qu'une fois tout le reste stable.

## Hors séquence A→D

Deux chantiers réalisés en dehors de l'ordre ci-dessus, sur demande explicite, plutôt que de
continuer vers le Groupe D mis en pause.

### Backend simulé (MSW)

Jusqu'ici, chaque page en dev affichait son `ErrorState` ("Impossible de charger…") faute de
backend réel — comportement honnête mais qui ne permettait pas de juger l'app avec de vraies
données. [MSW](https://mswjs.io) intercepte maintenant les appels `fetch` en développement
(`src/mocks/`) et répond avec un jeu de données en mémoire réaliste (chauffeurs, véhicules,
réservations et tenant à la couleur de Dakar — noms, plaques `DK-####-XX`, devise XOF). Les
mutations (valider un chauffeur, annuler une réservation…) modifient réellement ces données en
mémoire, donc les actions ont un effet visible immédiat.

- Démarré automatiquement par `pnpm dev`, jamais présent dans le build de production (import
  dynamique gated par `import.meta.env.DEV` — vérifié : aucune référence à `setupWorker` dans
  `dist/assets/` après `pnpm build`).
- Documenté dans `README.md` (section "Backend simulé").

### Tableau de bord — inspiration Fleetio

Le tableau de bord (Partie 2) affichait un total et un seul badge de statut par carte. Après
étude du dashboard de [Fleetio](https://www.fleetio.com) (widgets par catégorie, répartition
par statut en barres colorées, quick-links, visibilité par rôle), deux apports repris et
adaptés à notre système de design plutôt que copiés tels quels :

- Nouveau composant `DistributionBar` (`packages/ui`) : barre segmentée colorée + légende,
  construite sur `StatusTone` (déjà partagé avec `StatusDot`) plutôt qu'une palette de graphique
  dédiée. Différence volontaire avec Fleetio : chaque segment est un **vrai lien** vers la liste
  filtrée correspondante (`/drivers?status=en_attente`), en réutilisant `useUrlFilters` (B3) —
  chez Fleetio c'est un graphique consultable, ici c'est un raccourci fonctionnel.
- Les 3 cartes du tableau de bord affichent maintenant la répartition complète par statut
  (pas seulement un badge d'alerte). La carte Véhicules est masquée pour les rôles qui n'y ont
  pas accès (`hasRole`), écho au "permissions-based data views" de Fleetio, cohérent avec le
  filtrage déjà appliqué à la barre latérale (Partie 1).

**Volontairement pas repris** : le système de widgets déplaçables/redimensionnables/
personnalisables de Fleetio. Ça suppose de persister une disposition par utilisateur, donc un
vrai backend — hors de portée "frontend seul" pour l'instant. Voir aussi
[`EXPERTISE_METIER_FLOTTE_VTC.md`](./EXPERTISE_METIER_FLOTTE_VTC.md) pour la vision métier plus
large (KPI, modules attendus) qui a motivé ce chantier.

### Tableau de bord — widget de conformité documentaire

Approfondissement du chantier Fleetio ci-dessus : leurs widgets "renewal reminders" (échéances
de documents) correspondent exactement au manque identifié comme le plus critique dans
`EXPERTISE_METIER_FLOTTE_VTC.md` §2.1/§2.2 — un document véhicule/chauffeur expiré est un risque
réglementaire concret, pas un confort d'affichage.

- `Driver` gagne `licenseExpiresAt`, `Vehicle` gagne `insuranceExpiresAt`/`inspectionExpiresAt`
  (`packages/types`, tous `string | null`). Données de démonstration mises à jour (`mocks/data.ts`)
  avec un mélange volontaire d'échéances passées, proches et lointaines pour que le widget soit
  réellement démontrable.
- Nouvelle logique partagée `shared/expiry.ts` (seuil unique : 30 jours) et composant
  `shared/DocumentExpiry.tsx`, utilisés à la fois par les fiches détail (Chauffeur, Véhicule) et
  le nouveau widget — la fiche détail et le tableau de bord ne racontent jamais deux histoires
  différentes sur la même échéance.
- Widget "Conformité — documents à renouveler" sur le tableau de bord : liste triée par urgence,
  cliquable vers la fiche concernée, **n'apparaît que s'il y a au moins une échéance dans les
  30 jours ou déjà expirée** — pas de widget "tout va bien" qui ajouterait du bruit visuel à
  chaque chargement (même principe que le widget "chauffeurs en attente" déjà existant).
- Les entrées véhicule ne sont incluses que si le rôle a accès aux véhicules (`canSeeVehicles`),
  cohérent avec le reste du tableau de bord.

**Volontairement pas fait** : aucun champ de saisie de ces échéances dans les formulaires de
création (Chauffeur/Véhicule) — ajouter la capture de données est un chantier distinct de
l'affichage de l'alerte, non demandé ici.

### Refonte visuelle — typographie et bordures (première étape)

Premier pas d'une refonte visuelle demandée explicitement, "doucement doucement" — étapes
suivantes à définir séparément (couleurs, densité, autres composants).

- **Police** : `Space Grotesk` + `IBM Plex Sans` + `IBM Plex Mono` remplacés par `Inter`
  (titres et texte courant) + `JetBrains Mono` (données : plaques, téléphones, IDs). Choix
  validé explicitement par l'utilisateur parmi 3 options proposées — c'est le standard des
  dashboards SaaS pro (Linear, Vercel, Notion), plus sûr visuellement que l'ancienne paire.
  Sous-ensemble `latin` uniquement conservé (même contrainte réseau Dakar qu'avant).
- **Bordures** : rayon resserré de `rounded-lg` (8px) à `rounded-md` (6px) sur `Card`,
  `BulkActionBar` et les cartes mobiles de `DataTable` — c'étaient les 3 seuls composants encore
  à 8px, tout le reste du design system (`Button`, `FormField`, `SearchInput`, `ToastProvider`,
  pagination…) était déjà à 6px. Corrige au passage une incohérence d'échelle qui existait déjà,
  pas seulement une préférence esthétique. Couleur de bordure (`--color-line`) légèrement
  refroidie et contrastée (`#e4e7ec` → `#dfe3ea`).

### Refonte visuelle — sidebar (deuxième étape)

**Vrai manque comblé dans le modèle de données** : `User` (Doc 05 §4) n'avait ni nom
(`firstName`/`lastName`) ni `avatarUrl` — seul l'email identifiait un compte. Demandé
explicitement pour afficher un nom réel dans la sidebar plutôt qu'un email ou une donnée
inventée. Répercussions pour rester cohérent (un nom qui existe doit être visible partout où
un utilisateur est représenté, pas seulement dans la sidebar) :
- `UserInviteForm` collecte désormais prénom/nom à l'invitation
- `UsersPage` affiche une colonne Nom (recherche étendue au nom, pas seulement l'email)
- `ProfilePage` affiche le nom réel + le nouvel `Avatar`
- Données mockées mises à jour avec des noms réalistes

Nouveau composant `Avatar` (`packages/ui`) : photo réelle si `avatarUrl` est défini, sinon
initiales sur fond `ink-soft` — jamais de photo générique inventée pour combler l'absence de
donnée. Réutilisé à la fois dans la sidebar, la top bar (qui affichait avant une icône
générique `UserRound` — incohérent avec le nouvel avatar réel) et `UsersPage`.

Changements sidebar proprement dits :
- En-tête : nom réel du tenant (remplace le texte figé "Fleet Console") + nom de l'utilisateur
  connecté en sous-titre + `Avatar`. Squelette de chargement pendant la première requête
  (`apiClient.tenant.get()`/`apiClient.users.me()`, mêmes `queryKey` que Paramètres/Profil —
  cache partagé, pas de requête réseau supplémentaire une fois l'une des deux pages visitée).
- Regroupement par section : "Opérations" (Chauffeurs/Véhicules/Réservations) et
  "Administration" (Utilisateurs/Paramètres), "Tableau de bord" hors section (un groupe d'un
  seul item n'apporte rien). Les items masqués par rôle peuvent vider une section entière —
  la section elle-même se masque alors, pas de libellé "Administration" affiché au-dessus
  d'une liste vide.
- Indicateur actif : liseré vertical coloré sur le bord gauche de l'item actif, en plus du fond
  teinté déjà existant — masqué en mode réduit (icônes seules) où il n'y a pas la place de le
  distinguer proprement.
- Bouton "Réduire le menu" restylé comme un item de nav (même hover, même densité) et séparé du
  reste par une ligne — avant, c'était une icône isolée sans lien visuel avec le menu.
- Badge Compass retiré (demande explicite) ; en mode réduit, l'avatar utilisateur sert seul
  d'ancre visuelle en haut de la sidebar plutôt qu'une case vide.

### Paramètres entreprise — logo, thème de couleur, fuseau horaire, indicatif

**Vrai manque comblé** : `branding.logoUrl`/`primaryColor` existaient déjà (C1) mais ne
servaient qu'à un aperçu local dans la page Paramètres — aucun effet réel ailleurs dans l'app.
Exactement le genre d'affordance qui ne fait rien que ce projet évite partout ailleurs.

- **Couleur** : le champ couleur libre est remplacé par `branding.theme` (`amber` / `cobalt` /
  `indigo`, `packages/types`), 3 palettes prédéfinies plutôt qu'un color picker continu — décision
  volontaire pour éviter un accent illisible ou en collision avec les couleurs sémantiques.
  **Seul l'accent est retinté** (`--color-accent`/`--color-accent-soft`, blocs
  `:root[data-brand="…"]` dans `tokens.css`) ; `success`/`warning`/`danger` restent fixes quel
  que soit le thème choisi — ce sont des couleurs de statut, pas des couleurs de marque, les
  mélanger romprait la lisibilité des statuts dans toute l'app. Appliqué réellement via un
  `useEffect` dans `Layout` qui pose `document.documentElement.dataset.brand`, pas seulement
  affiché en aperçu.
- **Logo** : affiché dans la sidebar (à la place du badge retiré ci-dessus) ; si aucun logo
  n'est défini, une pastille avec l'initiale du tenant — jamais un espace vide ou une icône
  générique.
- **Fuseau horaire** (`Tenant.timeZone`, 3 options pertinentes pour le marché cible — pas une
  liste IANA complète) : effet réel sur l'affichage des heures de réservation (liste + fiche
  détail), via un nouvel utilitaire partagé `shared/formatDateTime.ts` +
  `shared/useTenantTimeZone.ts`, au lieu du fuseau du navigateur qui consulte l'écran.
- **Indicatif téléphonique par défaut** (`Tenant.defaultPhonePrefix`) : pré-remplit le champ
  téléphone de `DriverCreateForm` à l'ouverture, sans écraser une saisie déjà en cours.

Nouveau hook partagé `shared/useTenant.ts` (même `queryKey` que Paramètres/sidebar/profil,
cache React Query commun) — base commune pour `useTenantTimeZone` et tout futur besoin de
données tenant côté frontend.

### Sidebar — transition de réduction, top bar

**Vrai bug corrigé** : la largeur de la sidebar (`w-60` → `w-[76px]`) n'avait aucune
transition définie (seul `transition-transform` existait, qui n'anime que le tiroir mobile) —
la réduction/expansion sautait instantanément au lieu de s'animer. Corrigé
(`transition-[width,transform] duration-200 ease-out` + `overflow-hidden` sur le `<nav>` pour
clipper proprement le contenu pendant la transition).

Fondu des libellés ajouté **seulement là où il ne casse pas le centrage de l'icône en mode
réduit** : les libellés des items de nav et du bouton "Réduire le menu" utilisent une
transition `max-width`/`opacity` (CSS ne peut pas animer vers/depuis `auto`, d'où un
`max-width` fixe plutôt qu'un simple `hidden`). Le nom du tenant et l'utilisateur connecté en
en-tête de sidebar restent en bascule instantanée (`hidden`) : un fondu avec largeur
retenue y aurait décalé l'avatar de son centrage — compromis délibéré, sans grand coût
puisque l'identité du tenant est désormais aussi visible dans la top bar (voir ci-dessous).

**Top bar — remplacement d'un faux indicateur** : "Système opérationnel" était un badge
statique (`bg-success` codé en dur, ne reflétant aucun état réel) — exactement le genre de
fausse affordance évitée partout ailleurs dans ce projet. Remplacé par le vrai logo/nom du
tenant (même repli pastille-initiale que la sidebar). Bénéfice réel au-delà de l'honnêteté :
l'identité du tenant devient visible sur mobile et quand la sidebar est réduite, deux
contextes où elle disparaissait complètement avant.

### Sidebar — logo retiré (doublon), bug de positionnement, recherche globale

- **Logo retiré de l'en-tête sidebar** (demande explicite) : redondant avec celui maintenant
  affiché dans la top bar. Le nom du tenant, le nom de l'utilisateur connecté et l'avatar
  restent en revanche dans la sidebar.
- **Vrai bug corrigé** : la sidebar utilisait `md:static` sur desktop, donc suivait la hauteur
  du contenu de la page au lieu de rester épinglée au viewport — sur une page plus longue que
  l'écran (ex. Paramètres selon le contenu), la sidebar défilait avec la page et semblait
  "devenir scrollable" en y naviguant, puis redevenait normale sur une page plus courte. Corrigé
  avec `md:sticky md:top-0 md:h-screen` — la sidebar reste épinglée, seul le contenu défile.
  Ce composant étant partagé par toutes les pages (`App.tsx`), le correctif s'applique à tout
  le site en un seul endroit.
- **Recherche globale** (`shared/GlobalSearch.tsx`), ajoutée dans la top bar à droite de
  l'identité du tenant : un seul champ qui cherche parmi Chauffeurs, Véhicules et Utilisateurs
  simultanément, résultats groupés par type, clic pour naviguer vers la fiche concernée
  (liste filtrée pour Utilisateurs, qui n'a pas de fiche détail — B1). **Réservations
  volontairement exclues** : contrairement aux 3 autres entités, une réservation n'a pas de
  champ texte naturel (pas de nom client) — y chercher aurait voulu dire matcher sur des
  identifiants internes peu lisibles pour un dispatcher, une recherche de faible valeur plutôt
  qu'un vrai raccourci.

### Top bar — itérations d'ajustement (logo seul, avatar unique, cloche de notifications)

Suite de petits ajustements demandés successivement sur la top bar :
- Nom du tenant retiré à côté du logo (redondant avec le logo lui-même, `title`/`alt` gardent
  le nom accessible au survol).
- Rôle + avatar retirés de la top bar ; **seul point d'accès au Profil restant : l'avatar de
  la sidebar**, rendu cliquable à cette occasion (il n'était qu'un affichage jusqu'ici) — sans
  ça, le Profil serait devenu inatteignable depuis l'interface, point signalé avant
  implémentation.
- **Cloche de notifications** (`shared/NotificationBell.tsx`) ajoutée à droite de la top bar.
  Volontairement construite comme un vrai agrégateur plutôt qu'une icône décorative : reprend
  les deux signaux déjà réels du tableau de bord (chauffeurs en attente de validation,
  documents expirés/expirant) dans un badge + menu déroulant, accessible depuis n'importe
  quelle page. Logique extraite dans `shared/useComplianceAlerts.ts`, partagée avec
  `DashboardPage` (qui l'utilisait déjà en dur) — une seule source pour "qu'est-ce qui a
  besoin d'attention", pas deux implémentations qui pourraient diverger.

### Aperçu de profil rapide + profil enfin éditable

**Vrai manque comblé** : `ProfilePage` était documentée comme volontairement en lecture seule
parce qu'au moment de sa construction (C2), `User` n'avait aucun champ éditable par
l'utilisateur lui-même. Depuis, `firstName`/`lastName`/`avatarUrl` ont été ajoutés (pour la
sidebar) — la page était donc devenue lecture-seule *par obsolescence*, pas par choix. Corrigé :

- Nouvel endpoint `apiClient.users.updateMe()` (+ handler backend simulé). Email, rôle et
  statut restent en lecture seule : email demande une vérification (hors scope), rôle vient du
  RBAC (Doc 05 §3, jamais auto-attribuable), statut est géré par un Admin Tenant, pas par
  l'utilisateur concerné.
- `ProfilePage` a maintenant un vrai formulaire (prénom/nom) avec enregistrement.
- Nouveau `shared/ProfilePopover.tsx` : clic sur l'avatar (sidebar) ouvre un petit panneau
  ancré (même pattern que `NotificationBell`/`GlobalSearch`) avec avatar/nom/rôle et un bouton
  "Modifier mon profil" qui renvoie vers `/profile` — reste volontairement en lecture seule,
  pas de formulaire dupliqué à deux endroits.

  **Itération corrigée** : une première version utilisait une vraie fenêtre modale centrée
  avec fond assombri (nouveau composant `Modal` dans `packages/ui`) — jugée trop lourde pour
  un simple résumé ("catastrophique"). Remplacée par le panneau ancré ci-dessus ; `Modal.tsx`
  et son export ont été supprimés (aucun autre appelant, pas de code mort laissé derrière).

**En attente** : le fondu de transition au changement de route (Partie 6) a été diagnostiqué
comme donnant une impression de rechargement à chaque clic dans la sidebar — retrait proposé,
pas encore confirmé/implémenté.

### Correctif — la sidebar coupait le panneau de profil

**Vrai bug corrigé** : `overflow-hidden` sur la `<nav>` (ajouté pour l'animation de réduction)
rognait aussi `ProfilePopover`, qui doit déborder de la sidebar pour s'afficher par-dessus la
page. Retiré du `<nav>` — chaque libellé qui doit se clipper pendant la transition de largeur
porte déjà son propre `overflow-hidden` individuel (voir plus haut), l'`overflow-hidden` global
était devenu redondant en plus d'être nuisible.

### Accessibilité des panneaux ancrés — rattrapage

**Vraie régression corrigée** : `GlobalSearch`, `NotificationBell` et `ProfilePopover` (tous
ajoutés récemment) n'avaient pas la fermeture au clavier (Échap) ni le retour de focus au
déclencheur que `SlideOver` avait déjà (Partie A1) — une régression introduite en ajoutant ces
3 panneaux sans reprendre ce qui avait été appris. Corrigé via un nouveau hook partagé
`shared/useDismissablePopover.ts` (clic extérieur + Échap + retour de focus), adopté par les
3 composants — une seule implémentation du comportement plutôt que trois copies qui auraient pu
diverger. Piège à focus complet (cycle Tab) volontairement pas repris ici : ces panneaux sont
courts (1 à 5 actions), contrairement à `SlideOver`/`Modal` qui justifiaient ce niveau de
rigueur pour un formulaire plus long.

### Rafraîchissement identité visuelle — typographie, arrondis, bande de statut

Deuxième passe sur l'identité visuelle (après le remplacement Space Grotesk/IBM Plex →
Inter/JetBrains Mono, déjà en place) : le retour terrain était "pro, moderne, avec de bons
arrondis comme les nouvelles interfaces". Ne touche pas au système des 3 thèmes de couleur
(amber/cobalt/indigo) déjà validé — porte uniquement sur la couche structurelle neutre.

- **Typographie à deux rôles** : `--font-display` passe à **Archivo** (600/700, `@fontsource/archivo`)
  pour les titres (`h1`/`h2`/`h3`) et la nav — une grotesque plus affirmée qu'Inter, à l'esprit
  signalétique routière, cohérente avec le métier transport/flotte. `--font-body` reste **Inter**
  (le corps de texte dense n'avait pas besoin de changer) et `--font-mono` reste **JetBrains Mono**.
- **Arrondis resserrés vers un langage plus généreux** (tendance interfaces 2024+) : `Card` passe de
  `rounded-md` (6px) à `rounded-xl` (12px) ; boutons, inputs, tableaux, popovers, skeleton, toasts
  passent de `rounded-md` à `rounded-lg` (8px). Les pastilles/avatars/chips restent `rounded-full`
  (déjà corrects), et les petites vignettes logo/avatar (h-6 à h-10, ex. `Layout.tsx`, `LoginPage.tsx`)
  restent `rounded-md` intentionnellement — ce sont des glyphes miniatures, pas des conteneurs.
- **Élément signature — bande de statut** : nouveau `TONE_BORDERS` (mapping tonalité → `border-*`,
  même source que `TONES` dans `StatusDot.tsx`) appliqué en `border-l-[3px]` sur les lignes
  porteuses d'un vrai statut de conformité (`DashboardPage` et `NotificationBell`, sections
  "documents à renouveler") — chaque bande encode une information réelle (la tonalité du statut),
  jamais posée par pure décoration.

### Retrait du fondu de remontage à chaque navigation

Le `<div key={location.pathname} className="animate-[fade-in_.15s_ease]">` qui enveloppait
l'`Outlet` dans `Layout.tsx` provoquait un démontage/remontage complet de la page à chaque clic
de nav — même vers une page déjà visitée — perçu comme "le site s'actualise". Retiré : `Outlet`
est rendu directement. Suppressions associées pour éviter le code mort : `useLocation`/la variable
`location` (plus aucun autre usage dans le fichier) et le `@keyframes fade-in` dans `tokens.css`
(plus aucune classe ne le référence).

### Comblement du trou de couverture de tests

`tenant-console` n'avait jusqu'ici que des tests de fonctions pures (les `filterX.test.ts`) —
aucune infrastructure de rendu React (`tsc`/`vitest run` tournaient en environnement `node` par
défaut, suffisant pour ces tests-là mais pas pour des composants). Ajouté `vitest.config.ts`
(environnement `jsdom` + `vitest.setup.ts` avec `@testing-library/jest-dom` et cleanup automatique,
même pattern que `packages/ui`) et les devDependencies `@testing-library/react`,
`@testing-library/user-event`, `jsdom`.

Nouveaux tests, sur les éléments ajoutés depuis la Partie A2/B qui n'avaient encore aucune
couverture :
- `Avatar.test.tsx`, `DistributionBar.test.tsx` (packages/ui)
- `formatDateTime.test.ts`, `expiry.test.ts`, `useComplianceAlerts.test.tsx`,
  `useDismissablePopover.test.tsx` (tenant-console) — `useComplianceAlerts` est mocké au niveau
  de `../api` (pas de reseau réel) et couvre le tri par urgence ainsi que le masquage des alertes
  véhicule pour un rôle sans accès au parc ; `useDismissablePopover` est testé via un petit
  composant hôte (clic extérieur, Échap, retour de focus).

### Module Chauffeurs — modèle enrichi, vue carte, formulaire complété

Retour d'usage : le module Chauffeurs manquait de champs (email, numéro de permis, photo) et
n'offrait qu'une vue tableau. Deux points tranchés avant implémentation (voir échange) :
la photo reste un champ `avatarUrl` nullable comme sur `User` mais **sans bouton d'upload** pour
l'instant — un vrai upload sans stockage backend serait une fausse affordance ; email et numéro
de permis sont **optionnels**, cohérent avec une création rapide du chauffeur complétée plus tard.

- **`Driver`** (packages/types) gagne `email: string | null`, `avatarUrl: string | null`,
  `licenseNumber: string | null` — ce dernier distinct de `licenseExpiresAt` déjà suivi (l'un est
  l'identifiant du document, l'autre son échéance réglementaire).
- **`DriverCreateForm`** : deux champs optionnels ajoutés (email avec validation légère "contient
  un @", numéro de permis en texte libre) ; envoyés comme `undefined` si vides plutôt que chaîne
  vide, pour rester cohérent avec le `null` du modèle côté backend simulé.
- **`DriverDetailPage`** : bandeau d'en-tête avec `Avatar` (taille `lg`) + nom + email, numéro de
  permis affiché séparément de son échéance.
- **Vue carte** (`DriverCard.tsx`, nouveau) : bascule liste/carte via deux boutons (icônes
  `List`/`LayoutGrid`), état en `useState` local à la page (pas persisté — préférence d'affichage
  ponctuelle, pas un filtre partageable). La carte reprend exactement les mêmes libellés/actions
  que la ligne de tableau (`driverLabels.ts`, `DriverRowActions`) pour ne jamais raconter deux
  histoires différentes du même chauffeur selon la vue choisie ; la sélection (cases à cocher)
  fonctionne dans les deux vues et alimente les mêmes actions groupées.
- **`filterDrivers`** : la recherche texte couvre désormais aussi l'email et le numéro de permis.
- Colonne "Nom" de la vue liste : ajout de l'`Avatar` (initiales par défaut), même traitement que
  `UsersPage`.

### Correctif — la vue liste des chauffeurs n'affichait aucune donnée

Signalé : "en vue liste, les données ne s'affichent pas" (la vue carte fonctionnait, pas la vue
liste). Diagnostic fait directement dans le navigateur (console + inspection du CSS calculé),
pas seulement par lecture de code : la div `hidden overflow-x-auto md:block` de `DataTable.tsx`
(vue tableau desktop) restait `display: none` même à une largeur d'écran bien au-dessus du seuil
`md`. Cause identifiée : dans la feuille de style Tailwind compilée par ce projet (pnpm workspace
sans dépôt Git), l'utilitaire `.md\:block` se retrouvait positionné *avant* `.hidden` dans l'ordre
de cascade — donc jamais prioritaire — alors que d'autres variantes `md:` (`md:hidden`, `md:flex`,
`md:static`) étaient correctement ordonnées. Un test empirique direct dans le navigateur a confirmé
que `md:flex` s'applique correctement dans ce même environnement. Corrigé en remplaçant
`md:block` par `md:flex` sur ce wrapper (équivalent visuellement pour un conteneur à enfant unique
comme celui-ci) plutôt que de dépendre d'un ordre de cascade qui s'est avéré peu fiable ici.
Ce bug est antérieur au travail sur le module Chauffeurs — il touchait `DataTable`, utilisé par
tous les modules en liste — mais n'était visible qu'en vue tableau desktop, jamais testée
visuellement auparavant (outil de capture de navigateur resté défaillant tout au long de la
session précédente).

### `DriverCreateForm` — retour à une modale centrée

Retour d'usage : pour ce formulaire (plusieurs champs), une modale centrée était jugée préférable
au panneau latéral `SlideOver`. Recréé `Modal.tsx` (packages/ui) — supprimé plus tôt cette session
car jugé inadapté à `ProfilePopover` (un simple résumé, mieux servi par un petit panneau ancré) —
mais un vrai formulaire multi-champs est exactement le cas d'usage pour lequel une modale centrée
a du sens : capter l'attention plutôt que garder le contexte de la liste visible. Reprend
exactement la même logique de piège à focus / Échap / retour de focus que `SlideOver`, pas de
comportement réinventé. `DriverCreateForm` est le seul appelant pour l'instant.

### Correctif — la modale débordait, aucune largeur maximale appliquée

Signalé : "la modale est très mal faite, ça déborde de partout". Vérifié dans le navigateur :
`max-w-md` sur le panneau de `Modal.tsx` ne compilait pas du tout (`max-width: none` en CSS
calculé) — la modale prenait quasiment toute la largeur de l'écran au lieu de faire 28rem. Même
famille de bug que le correctif "vue liste" précédent (des classes Tailwind valides, présentes
dans le code, mais absentes de la feuille de style compilée dans cet environnement — projet sans
dépôt Git, cf. correctif précédent). Testé systématiquement dans la console du navigateur :
`max-w-sm`, `max-w-lg`, `backdrop-blur-sm`, `bg-ink/50` (couleur avec opacité), `shadow-2xl`
échouaient tous de la même façon ; seules les classes déjà utilisées ailleurs dans le projet
(`max-w-xs`, `max-w-80`, `rounded-xl`...) compilaient correctement.

Plutôt que de continuer à deviner quelles classes Tailwind "marcheront" dans cet environnement,
`Modal.tsx` et `SlideOver.tsx` (qui avait exactement le même `max-w-md` jamais vérifié
visuellement cette session) passent en **style inline** pour les propriétés touchées
(`maxWidth`, `boxShadow`, couleur/flou du fond assombri) — indépendant du scanner Tailwind,
donc fiable quel que soit ce problème d'environnement. Les autres classes Tailwind (déjà
vérifiées fonctionnelles) restent en `className`.

**Point de vigilance pour la suite** : dans ce projet précis (pas de dépôt Git), une classe
Tailwind flambant neuve peut ne pas se compiler silencieusement, sans erreur. Vérifier
visuellement (pas seulement via typecheck/tests) toute nouvelle classe inhabituelle, surtout
`max-w-*`, les variantes responsives (`md:`, `lg:`) et les couleurs avec modificateur d'opacité.

### Édition d'un chauffeur — combler le vrai trou fonctionnel

Jusqu'ici, un chauffeur créé restait figé : ni l'email/le numéro de permis ne pouvaient être
complétés après coup, ni surtout **l'échéance du permis** ne pouvait jamais être renseignée
(`licenseExpiresAt` restait `null` à vie) — alors que tout le système d'alertes de conformité
(widget du tableau de bord, cloche de notifications, `useComplianceAlerts`) dépend de cette
donnée. Sans formulaire d'édition, ces alertes ne se seraient jamais déclenchées dans un usage
réel.

- `apiClient.drivers.update(id, patch)` (packages/api-client) — PATCH partiel sur
  firstName/lastName/phone/email/licenseNumber/licenseExpiresAt.
- Handler mock `PATCH /drivers/:id` (générique, distinct des routes `/validate` et `/reject`
  déjà existantes).
- `DriverEditForm.tsx` (nouveau) — réutilise `Modal`, mêmes champs que la création plus un champ
  date pour l'échéance du permis ; pré-rempli depuis le chauffeur, resynchronisé si on ré-ouvre
  pour un chauffeur différent.
- Bouton "Modifier" ajouté dans les actions de `DriverDetailPage`.

Vérifié de bout en bout dans le navigateur (pas seulement via les tests) : ouverture du
formulaire pré-rempli, soumission réelle, requête `PATCH` à 200, fermeture de la modale.

### Édition en ligne plutôt que modale séparée

Retour d'usage : préférence pour cliquer directement sur un champ de la fiche chauffeur pour le
modifier, plutôt qu'ouvrir un formulaire séparé. `DriverEditForm.tsx` (modale) supprimé,
remplacé par une édition en ligne directement dans `DriverDetailPage.tsx` :

- Chaque champ modifiable (prénom, nom, téléphone, email, numéro de permis, échéance du permis)
  est un `EditableField` — affiché comme texte cliquable, devient un `<input>` au clic (focus
  automatique), repasse en lecture au blur/Entrée/Échap. L'échéance du permis garde son affichage
  coloré habituel (`DocumentExpiry`) en lecture, mais édite la date brute.
- Un seul état local `values` pour tous les champs à la fois (pas un état par champ) : le bouton
  **"Enregistrer" n'apparaît dans l'en-tête que si au moins un champ diffère des données
  serveur**, avec un bouton "Annuler" pour tout revenir en arrière sans requête. Un seul
  `PATCH` envoie tous les champs modifiés ensemble, pas une requête par champ.
- Validation minimale avant sauvegarde (prénom/nom/téléphone non vides, email au format valide)
  — bouton désactivé sinon, avec l'explication en `title`.

Vérifié de bout en bout dans le navigateur, y compris en inspectant directement le cache
React Query (`queryClient.getQueryData`) pour confirmer que la donnée persiste réellement côté
mock, pas seulement à l'écran.

### Historique des courses — page dédiée avec export CSV

Première version (carte "Courses" directement sur la fiche chauffeur) remplacée par une page
dédiée `/drivers/:id/history` (`DriverHistoryPage.tsx`), accessible via un bouton "Historique des
courses" dans l'en-tête de la fiche — pour ne pas surcharger la fiche détail, et parce qu'un
export n'a de sens que sur sa propre vue, pas comme affordance secondaire d'une carte résumée.

- Table complète (`DataTable`, tri par colonne) des réservations du chauffeur
  (`Reservation.driverId === driver.id`, filtré côté client sur `["reservations"]`, même cache
  partagé que `useComplianceAlerts`/l'ancienne carte).
- Bouton **"Télécharger"** — génère un vrai CSV (RFC 4180 : échappement des virgules/guillemets/
  retours à la ligne, BOM UTF-8 pour qu'Excel affiche correctement les accents) via `Blob` +
  téléchargement natif, désactivé si aucune course. Pas de dépendance externe, ~30 lignes.
- Réutilise `WaypointTracker`, `formatDateTime`/`useTenantTimeZone`, `STATUS_LABELS` déjà en
  place pour les réservations — même représentation partout dans l'app.

Vérifié dans le navigateur en interceptant réellement le `Blob` généré (pas seulement le clic) :
nom de fichier et contenu CSV corrects.

### Archiver un chauffeur, changer sa disponibilité

Deux vrais trous fonctionnels comblés : jusqu'ici, `availabilityStatus` ne pouvait jamais être
modifié après la création (figé sur "hors_ligne" à vie), et il n'existait aucun moyen de retirer
un chauffeur qui a quitté la flotte — seulement "Rejeter" (statut de validation, sans rapport).

- **`Driver.archivedAt: string | null`** (nouveau champ) — jamais de suppression définitive :
  un chauffeur archivé reste dans les données, son historique de courses (`Reservation.driverId`)
  n'est jamais cassé. `apiClient.drivers.archive/unarchive`, handlers mock associés.
- **`DriverArchiveAction.tsx`** (nouveau, volontairement séparé de `DriverRowActions`) — bouton
  "Archiver"/"Réactiver", **uniquement sur la fiche détail**, jamais dans la liste/vue carte où un
  clic malheureux serait trop facile. Confirmation via `window.confirm` avant d'archiver (première
  utilisation de ce pattern dans l'app — pas de composant de confirmation dédié pour l'instant,
  pas encore justifié pour une seule action destructive).
- **`DriversPage`** exclut les chauffeurs archivés par défaut ; case à cocher "Afficher les
  archivés" pour les retrouver, badge "Archivé" sur la ligne/carte. `DriverDetailPage` affiche une
  bannière quand le chauffeur consulté est archivé.
- **`AvailabilityField`** (nouveau, dans `DriverDetailPage.tsx`) — remplace le `StatusDot` figé de
  "Disponibilité" par un `<select>` qui déclenche un `PATCH` immédiat au changement, séparé du
  gros formulaire d'édition (même logique que Valider/Rejeter : un changement de statut doit
  s'appliquer tout de suite, pas attendre un "Enregistrer" groupé).

Vérifié de bout en bout dans le navigateur : changement de disponibilité, archivage/réactivation,
exclusion/réapparition dans la liste selon la case à cocher.

### Archivage groupé + refonte des boutons de la barre d'actions

Ajout d'un bouton "Archiver" à la barre d'actions groupées de `DriversPage` (`useBulkAction`,
même patron que Valider/Rejeter — `Promise.allSettled`, invalidation, message honnête en cas
d'échec partiel), avec confirmation (`window.confirm`) et exclusion des chauffeurs déjà archivés
de la sélection éligible.

**Corrigé au passage** : les boutons Valider/Rejeter utilisaient `variant="secondary"`, pensé
pour un fond clair (`bg-surface` + `border-line`) — quasi invisible sur le fond sombre de
`BulkActionBar` (`bg-ink`). Deux nouvelles variantes ajoutées à `Button` (packages/ui), pour tout
bouton posé sur un fond déjà sombre :
- `inverse` — `bg-white/10 text-white`, pour une action neutre (Valider/Rejeter)
- `dangerInverse` — `bg-danger/20 text-white border-danger/40`, pour une action à impact plus
  fort (Archiver) — distingue visuellement "annule/rejette" de "retire de la liste active"

Vérifié dans le navigateur (classes calculées inspectées directement) : les trois boutons
ressortent correctement sur le fond sombre, avec une couleur distincte pour l'action d'archivage.

### Upload de photo — revient sur le choix initial de le différer

Décidé plus tôt cette session de différer l'upload de photo (pas de vrai stockage backend).
Reconsidéré : tout le backend de cette app est déjà simulé (MSW, données en mémoire) — un
upload qui convertit l'image en data URL côté client et l'enregistre comme `avatarUrl` est un
**vrai** upload fonctionnel dans cet environnement (affiché immédiatement, persiste comme toute
autre modification de la session), pas une fausse affordance. Différent du cas "modale
d'ajout" (Part B, Doc 04 §5) où on avait tranché différemment pour la création rapide — ici la
fiche détail est l'endroit naturel pour ce genre d'action.

- `DriverAvatarUpload.tsx` (nouveau) — clic sur l'avatar (icône appareil photo au survol) ouvre
  le sélecteur de fichier ; validation type (`image/*`) et taille (2 Mo max) avant conversion ;
  `apiClient.drivers.update({ avatarUrl })` élargi pour accepter ce champ.
- Remplace l'`Avatar` statique du bandeau d'en-tête de `DriverDetailPage`.

Vérifié dans le navigateur avec un vrai fichier (PNG encodé, injecté via `DataTransfer`) : upload
réussi, avatar mis à jour immédiatement et reflété dans la liste des chauffeurs ; rejet correct
d'un fichier non-image avec message clair.

### Vue agrandie de la photo, séparée du clic d'upload

Retour d'usage : cliquer sur l'avatar déclenchait directement l'upload, aucun moyen de voir la
photo en grand. Séparé les deux intentions dans `DriverAvatarUpload.tsx` :
- **Photo déjà présente** → le clic ouvre une vue agrandie (`Modal`, image en `object-contain`)
  avec un bouton "Changer la photo" à l'intérieur pour l'upload.
- **Pas encore de photo** → le clic ouvre directement le sélecteur de fichier (rien à agrandir).

Vérifié dans le navigateur avec une vraie image uploadée : la vue agrandie s'ouvre bien avec le
nom du chauffeur en titre et le bouton de changement.

### Badge photo permanent quand il n'y en a pas encore

Retour d'usage : l'indice pour ajouter une photo n'apparaissait qu'au survol — invisible au
tactile, facile à manquer. Quand `avatarUrl` est absent, `DriverAvatarUpload.tsx` affiche
désormais un petit badge rond (icône appareil photo) **en permanence** dans le coin de l'avatar,
même pattern que LinkedIn/Google pour "ajouter une photo de profil". Le survol reste le seul
indice pour l'action secondaire "voir en grand" une fois une photo déjà présente — moins
critique à découvrir.

### Véhicule actuel sur la fiche chauffeur

Ajout d'un champ "Véhicule actuel" sur `DriverDetailPage` — la relation existait déjà côté
données (`Vehicle.currentDriverId`) mais rien ne l'affichait côté chauffeur : un dispatcher devait
aller chercher dans la liste des véhicules pour savoir avec lequel un chauffeur roule. Filtre
client sur le cache déjà partagé `["vehicles"]` (même pattern que `useComplianceAlerts` :
pas de nouvelle requête dédiée). Plaque + marque/modèle + statut (`StatusDot`, mêmes libellés que
`VehiclesPage`), lien vers la fiche véhicule ; "Aucun véhicule assigné" sinon.

### Filtres validation + disponibilité en menus déroulants

Ajout d'un filtre par disponibilité (Disponible/Hors ligne/En course) sur `DriversPage`, en plus
du filtre de validation déjà présent. Les deux passés en `<select>` compact plutôt qu'en chips —
la barre de filtres avait déjà pas mal d'éléments (recherche, case "archivés", bascule
liste/carte) ; deux rangées de chips l'auraient surchargée. `filterDrivers.ts` élargi avec un
4ᵉ paramètre optionnel `availabilityFilter` (test ajouté). Filtre de disponibilité en état local
(comme `showArchived`), pas persisté dans l'URL contrairement au filtre de validation (déjà géré
par `useUrlFilters`) — pas jugé nécessaire de le rendre partageable par lien pour l'instant.

### Refonte de tous les menus déroulants (composant `Select`)

Retour d'usage : "ce qui est là n'est pas moderne" — les `<select>` natifs gardaient la flèche
par défaut du navigateur, incohérente avec le reste du design system. Nouveau composant
`Select` (packages/ui/FormField.tsx) : flèche standard masquée, remplacée par `ChevronDown`
positionné dans le select, mêmes bordures/rayons/couleurs que le reste des champs. `SelectField`
(déjà utilisé par `TenantSettingsPage` pour le fuseau horaire) le réutilise en interne — corrigé
partout d'un coup, pas seulement sur les deux nouveaux écrans. Appliqué aux filtres de
`DriversPage` (validation + disponibilité, en `size="sm"`/`fullWidth=false`) et au sélecteur de
disponibilité de `DriverDetailPage`. Plus aucun `<select>` brut dans tout le projet.

**Piège rencontré et corrigé** : `appearance-none` et le padding du chevron (`pr-9`, `pl-3`)
ne compilaient pas du tout au premier essai — même famille de bug que les correctifs précédents
(classe Tailwind jamais utilisée ailleurs dans le projet, silencieusement absente de la feuille
de style compilée dans cet environnement sans dépôt Git). Réécrit en **style inline** pour ces
propriétés précises (vérifié : `appearance: none` et paddings corrects en CSS calculé), tout en
gardant en classes Tailwind les propriétés déjà prouvées ailleurs (bordures, rayons, couleurs).

### Assignation véhicule ↔ chauffeur

Comblé le dernier vrai trou identifié : la relation `Vehicle.currentDriverId` n'était affichée
nulle part en édition, ni côté chauffeur ni côté véhicule.

- `apiClient.vehicles.assignDriver(vehicleId, driverId | null)` — la mutation vit côté véhicule
  (c'est là qu'est stocké le champ), mais l'action reste utilisable depuis la fiche chauffeur.
- Handler mock `PATCH /vehicles/:id/assign-driver` : un chauffeur ne conduit qu'un seul véhicule
  à la fois — assigner en retire automatiquement tout autre véhicule qu'il conduisait avant,
  plutôt que de laisser deux véhicules pointer sur le même chauffeur.
- `DriverVehicleAssignment.tsx` (nouveau, dans `DriverDetailPage`) : "Assigner un véhicule" si
  aucun ; sinon "Changer"/"Retirer" à côté du véhicule affiché. Le sélecteur ne propose que les
  véhicules `disponible` **et** pas déjà assignés à un autre chauffeur — jamais de vol silencieux
  d'affectation.

Vérifié de bout en bout dans le navigateur : assignation, changement de vue après invalidation
du cache, retrait.

### Comblement du trou de couverture de tests (module Chauffeurs)

17 nouveaux tests sur les composants ajoutés cette session sans aucune couverture : archivage
(`DriverArchiveAction`), upload/rejet de photo (`DriverAvatarUpload`), disponibilité
(`AvailabilityField`, désormais exporté depuis `DriverDetailPage.tsx` pour être testable
isolément), assignation de véhicule (`DriverVehicleAssignment`), historique + export CSV
(`DriverHistoryPage`).

**Corrigé au passage** : le typecheck de `tenant-console` acceptait silencieusement des matchers
jest-dom (`toBeInTheDocument`, `toBeDisabled`, `toHaveValue`) jamais réellement exercés jusqu'ici
par aucun test existant — `apps/tenant-console/vitest.setup.ts` (qui importe
`@testing-library/jest-dom/vitest` au runtime) vit hors de `src/`, donc hors du projet TS
(`tsconfig.json` n'inclut que `"src"`), et son import seul ne suffisait pas pour que `tsc`
connaisse ces matchers. Ajouté `src/vitest.d.ts` (même fichier que `packages/ui`, qui avait déjà
ce correctif) pour rendre les types visibles au typecheck, pas seulement à l'exécution.

**Pièges rencontrés en écrivant ces tests** (notés pour la suite) :
- `userEvent.upload()` s'est montré peu fiable sur un `<input type="file">` cliqué indirectement
  via un bouton parent — remplacé par `fireEvent.change(input, { target: { files: [file] } })`,
  plus direct.
- `Blob.text()` n'est pas implémenté par jsdom — lecture via `FileReader.readAsText`/
  `readAsArrayBuffer` à la place (déjà le mécanisme utilisé par `DriverAvatarUpload` lui-même).
- Le BOM UTF-8 ajouté pour Excel est correctement stripé par un décodage UTF-8 conforme
  (`readAsText`) — vérifié sur les octets bruts (`readAsArrayBuffer`), pas sur le texte redécodé.

### Module Véhicules — parité avec le module Chauffeurs

Repris systématiquement chaque amélioration faite côté Chauffeurs pour vérifier si elle
s'appliquait aussi aux Véhicules (plan de travail temporaire : `docs/PLAN_TEMP_VEHICULES.md`,
maintenant réversé ici et supprimé).

**Bugs corrigés** :
- Chauffeur affecté affiché en ID brut (`drv-1`) sur `VehiclesPage.tsx`/`VehicleDetailPage.tsx` —
  résolu vers le nom.
- Boutons de `BulkActionBar` invisibles sur fond sombre (`variant="secondary"`) — passés en
  `inverse`/`dangerInverse`, même correctif que pour les Chauffeurs.
- Filtres en chips (`FilterChip`) remplacés par le composant `Select` modernisé.

**Vraies lacunes fonctionnelles comblées** :
- Aucun moyen de réactiver un véhicule "Retiré" — même trou que l'archivage des chauffeurs avant
  l'ajout de "Réactiver". Résolu deux fois : d'abord un bouton dédié "Remettre en service", puis
  remplacé par le passage en `Select` (voir plus bas) qui couvre nativement ce cas.
- Aucune édition possible après création (plaque/marque/modèle figés), ni des échéances
  assurance/visite technique — édition en ligne ajoutée sur `VehicleDetailPage.tsx`, même pattern
  que `DriverDetailPage.tsx`. `EditableField` (jusque-là une fonction locale à
  `DriverDetailPage.tsx`) extrait en composant partagé `shared/EditableField.tsx` à cette
  occasion, pour ne pas le dupliquer sur ce deuxième consommateur.
- Assignation chauffeur ↔ véhicule unidirectionnelle (possible depuis la fiche chauffeur, pas
  l'inverse) — `VehicleDriverAssignment.tsx` créé en miroir de `DriverVehicleAssignment.tsx`
  (mêmes règles d'éligibilité : chauffeur validé, actif, pas déjà assigné ailleurs).
- Pas de vue carte sur `VehiclesPage.tsx` — `VehicleCard.tsx` ajouté (miroir de `DriverCard`,
  pictogramme `Car` à la place d'une photo, la photo véhicule restant différée).
- Pas d'historique des courses du véhicule (`Reservation.vehicleId` existait déjà, inexploité) —
  `VehicleHistoryPage.tsx` créée (miroir de `DriverHistoryPage.tsx`), route
  `/vehicles/:id/history`, export CSV identique.

**Questions ouvertes tranchées** : les deux écarts de cohérence relevés pendant l'audit ont été
alignés sur le comportement Chauffeurs.
- `VehicleCreateForm.tsx` : `SlideOver` → `Modal` centrée (même structure que
  `DriverCreateForm.tsx`, footer Annuler/Ajouter, formulaire lié par `form=`).
- `VehicleRowActions.tsx` : boutons dédiés ("Marquer disponible/indisponible/Retirer") remplacés
  par un `Select` à effet immédiat, même logique que `AvailabilityField`. Le cas "Retiré →
  remettre en service" est désormais couvert par ce même menu, sans bouton dédié.

Vérifié à chaque étape : typecheck + suite de tests + build, puis vérification manuelle dans le
navigateur (y compris via navigation SPA pour éviter le faux positif de perte de données au
rechargement complet, déjà documenté plus haut pour le module Chauffeurs).

### Module Réservations — parité avec Chauffeurs/Véhicules

Même exercice pour le dernier module de données (plan de travail temporaire :
`docs/PLAN_TEMP_RESERVATIONS.md`, maintenant réversé ici et supprimé).

**Bugs corrigés** :
- Chauffeur/véhicule affichés en ID brut (`drv-1`, `veh-3`) sur `ReservationsPage.tsx` (colonnes)
  et `ReservationDetailPage.tsx` — résolus vers le nom (lien conservé sur la fiche détail).
- Bouton "Annuler" du `BulkActionBar` invisible sur fond sombre — passé en `dangerInverse`
  (action destructrice, même traitement que "Retirer" côté Véhicules).
- Filtres en chips remplacés par `Select`.

**Vraies lacunes fonctionnelles comblées** :
- Aucune assignation chauffeur/véhicule depuis la fiche réservation quand "Non affecté" —
  l'api-client des réservations n'exposait que `list`/`get`/`cancel`. Ajout de
  `assignDriver`/`assignVehicle` (endpoints mock dédiés) et de
  `ReservationDriverAssignment.tsx`/`ReservationVehicleAssignment.tsx`, miroirs de
  `DriverVehicleAssignment`/`VehicleDriverAssignment` — sans la contrainte d'exclusivité de ces
  derniers, un chauffeur ou un véhicule pouvant légitimement avoir plusieurs réservations à des
  créneaux différents.
- Aucune reprogrammation possible (`scheduledStart`/`scheduledEnd` figés après création) — édition
  en ligne (`EditableField`, `type="datetime-local"`) ajoutée sur `ReservationDetailPage.tsx`,
  disponible seulement tant que la réservation est "planifiée" ou "confirmée" (même règle
  d'éligibilité que l'annulation). Validation cliente : l'arrivée doit rester après le départ.

  **Piège traité explicitement** : un `<input type="datetime-local">` raisonne dans le fuseau
  horaire du *navigateur*, pas celui configuré pour le tenant (`formatDateTime.ts` affiche déjà
  tout dans ce fuseau ailleurs dans l'app) — les convertir naïvement aurait décalé l'heure affichée
  d'un dispatcher dans un autre fuseau que celui du tenant. Nouvel helper
  `shared/tzDateTimeInput.ts` (`isoToTzInputValue`/`tzInputValueToIso`) qui calcule le décalage
  réel du fuseau cible pour la date concernée (gère le changement heure d'été/hiver) plutôt que de
  supposer un décalage fixe. Testé (`tzDateTimeInput.test.ts`) : conversion vers un fuseau à heure
  d'été, aller-retour ISO → saisie → ISO sur plusieurs fuseaux et plusieurs saisons.

**Pas des manques (limitations déjà connues, pas des bugs)** :
- Le passager (`passengerUserId`, ex. `pax-1`) reste non résolu en nom : ces identifiants ne
  correspondent à aucun utilisateur de la liste des Users du tenant (réservée au staff) — aucune
  donnée disponible côté mock pour l'afficher autrement.
- Le bouton "Nouvelle réservation" reste désactivé, cause déjà documentée en Partie 4 ci-dessus
  (sélection de passager impossible sans endpoint dédié côté backend).

Vérifié à chaque étape : typecheck + suite de tests (dont les 3 nouveaux tests du fuseau horaire)
+ build, puis vérification manuelle dans le navigateur (résolution des noms, sélecteur de statut,
assignation chauffeur, reprogrammation avec persistance confirmée après navigation SPA).

## Principe directeur

Ne jamais ajouter une affordance qui ne fait rien (bouton, lien, animation qui suggère une action sans effet réel) — cohérent avec le principe déjà appliqué au reste du projet : documenter honnêtement ce qui est fait vs différé, plutôt que de simuler une fonctionnalité absente.
