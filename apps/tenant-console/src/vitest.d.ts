// Etend les types de `expect` avec les matchers jest-dom (toBeInTheDocument, etc.)
// pour tsc, pas seulement pour vitest a l'execution -- vitest.setup.ts (a la racine
// de l'app, hors de "src") importe la meme chose au runtime mais n'est pas inclus
// dans ce projet TS, donc son import seul ne suffit pas pour le typecheck.
import "@testing-library/jest-dom/vitest";
