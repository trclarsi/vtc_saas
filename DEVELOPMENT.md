# Développement — Notes pratiques

## Installation

```bash
pnpm install
```

## Lancer `tenant-console` en dev

```bash
pnpm --filter tenant-console dev
```

Ouvre ensuite `http://localhost:5173`.

## Vérifier les types sur tout le monorepo

```bash
pnpm turbo run typecheck
```

## ⚠️ Si ce dépôt est monté via un chemin réseau WSL (`\\wsl.localhost\...`)

pnpm utilise un module natif de copie accélérée (Copy-on-Write) sur Windows qui **plante** sur les chemins réseau WSL (`EPERM` / panic Rust lors de `pnpm install`). npm a le même type de problème avec les liens symboliques de workspace (`EISDIR`).

**Solution qui fonctionne** : exécuter les commandes depuis l'intérieur de WSL, sur le chemin Linux natif, pas depuis PowerShell/Git Bash sur le chemin `\\wsl.localhost\...`.

```bash
# Depuis PowerShell/Git Bash Windows :
wsl.exe -e bash -lc "cd /home/trclarsi/projets/pro/vtc_saas/platform && pnpm install"
wsl.exe -e bash -lc "cd /home/trclarsi/projets/pro/vtc_saas/platform/apps/tenant-console && pnpm dev --host"
```

Ou plus simplement : ouvrir un terminal WSL directement (`wsl` dans un terminal Windows) et travailler depuis `/home/trclarsi/projets/pro/vtc_saas/platform`, pas depuis l'explorateur de fichiers Windows.

Node a été installé dans WSL via `nvm` (pas de `sudo` nécessaire) :
```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
corepack enable && corepack prepare pnpm@10.34.5 --activate
```

## État actuel

- Monorepo pnpm + Turborepo (Doc 06 §6, Doc 07 §4)
- `packages/types`, `packages/api-client`, `packages/auth`, `packages/ui` — squelettes fonctionnels, à enrichir au fur et à mesure des modules backend
- `apps/tenant-console` — structure modulaire complète (`auth`, `dashboard`, `drivers`, `vehicles`, `reservations`, `users`), écrans connectés à `@vtc/api-client`. En dev, un backend simulé (MSW, voir `apps/tenant-console/README.md`) répond avec des données de démonstration ; absent du build de production, en attente du vrai backend
- Backend (`NestJS`), `platform-admin`, `driver-app` (Flutter) — pas encore démarrés
