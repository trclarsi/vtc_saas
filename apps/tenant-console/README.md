# tenant-console

App back-office web (React) — Admin Tenant, Manager opérationnel, Fleet Manager.

Voir [`docs/Document_06_Architecture_Logicielle.pdf`](../../../docs/Document_06_Architecture_Logicielle.pdf) (§3) pour le pourquoi de cette app, et [`docs/Document_04_Specifications_Fonctionnelles_MVP.md`](../../../docs/Document_04_Specifications_Fonctionnelles_MVP.md) pour les règles de gestion que chaque module implémente.

Le suivi détaillé des améliorations UX/UI de cette app est dans [`docs/DESIGN_ROADMAP.md`](./docs/DESIGN_ROADMAP.md).
La vision métier (fonctionnalités attendues d'une console de gestion de flotte VTC, KPI de
tableau de bord, apps de référence) est dans
[`docs/EXPERTISE_METIER_FLOTTE_VTC.md`](./docs/EXPERTISE_METIER_FLOTTE_VTC.md).

## Structure

```
src/modules/   un dossier par module fonctionnel (auth, drivers, vehicles, reservations, users, dashboard)
src/shared/    mise en page, navigation
```

Chaque module consomme `@vtc/api-client` et `@vtc/types` (voir `../../packages`) — jamais d'appel `fetch` direct ni de type dupliqué localement.

## Backend simulé (dev uniquement)

Aucun backend réel n'existe encore (Doc 07 §5). En développement, [MSW](https://mswjs.io)
intercepte les appels `fetch` vers `http://localhost:3000/api/*` et répond avec des données de
démonstration en mémoire (`src/mocks/data.ts`) — les listes se remplissent, les actions
(valider un chauffeur, annuler une réservation, etc.) modifient réellement ces données.

- Démarré automatiquement par `pnpm dev` (`main.tsx`, gated par `import.meta.env.DEV`).
- **Jamais présent dans le build de production** — l'import de `msw` est dynamique et éliminé
  au build par Vite ; vérifiable via `grep -r setupWorker dist/assets/` après `pnpm build`.
- Pour pointer exceptionnellement un `pnpm dev` vers un vrai backend local : `VITE_API_MOCKING=false pnpm dev`.
- Les handlers vivent dans `src/mocks/handlers.ts`, un par route de `@vtc/api-client` — à tenir à jour si une route change.

## Commandes

```bash
pnpm dev         # serveur de dev (port 5173)
pnpm typecheck   # verification TypeScript
pnpm build       # build de production
```
