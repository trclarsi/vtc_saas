# vtc-saas — monorepo applicatif

Code de la plateforme SaaS de gestion de flotte VTC multi-tenant. Monorepo pnpm + Turborepo.

> La documentation de cadrage (vision produit, architecture, spécifications fonctionnelles)
> vit un niveau au-dessus de ce dossier, dans `../docs/` — pas incluse dans ce dépôt Git pour
> l'instant.

## Structure

```
apps/
  tenant-console/   Back-office web (React) — Admin Tenant, Manager opérationnel, Fleet Manager
                    voir apps/tenant-console/README.md

packages/
  types/            Types partagés entre apps (Driver, Vehicle, Reservation, User, Tenant...)
  api-client/       Client HTTP typé vers le backend (un module par ressource)
  auth/             Session React (tenant_id, rôle) et vérification de rôle côté UI
  ui/               Design system partagé (Button, Card, Modal, Select, DataTable...)
```

D'autres apps sont prévues dans ce même monorepo mais pas encore démarrées : un backend
(NestJS), `platform-admin` (back-office multi-tenant), `driver-app` (mobile, Flutter).

## Démarrer

```bash
pnpm install
pnpm --filter tenant-console dev
```

Ouvrir `http://localhost:5173`. Aucun backend réel n'est requis en développement : un backend
simulé (MSW) répond avec des données de démonstration directement dans le navigateur — voir
`apps/tenant-console/README.md` pour le détail.

**Sous Windows avec ce dépôt monté via un chemin réseau WSL** (`\\wsl.localhost\...`), voir
[`DEVELOPMENT.md`](./DEVELOPMENT.md) — `pnpm install` plante sur ce type de chemin, il faut
travailler depuis un terminal WSL natif.

## Commandes courantes

```bash
pnpm turbo run typecheck   # verification TypeScript sur tout le monorepo
pnpm turbo run test        # tests (vitest) sur tout le monorepo
pnpm --filter tenant-console build   # build de production
```

## État actuel

- `packages/types`, `packages/api-client`, `packages/auth`, `packages/ui` — squelettes
  fonctionnels, enrichis au fur et à mesure des modules
- `apps/tenant-console` — structure modulaire complète (auth, dashboard, chauffeurs, véhicules,
  réservations, utilisateurs, paramètres), connectée à `@vtc/api-client`. Journal détaillé des
  choix UX/UI dans [`apps/tenant-console/docs/DESIGN_ROADMAP.md`](./apps/tenant-console/docs/DESIGN_ROADMAP.md)
- Backend réel, `platform-admin`, `driver-app` — pas encore démarrés
