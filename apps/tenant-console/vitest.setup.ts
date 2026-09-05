import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Sans mode "globals", @testing-library/react ne detecte pas automatiquement
// un afterEach global pour nettoyer le DOM entre les tests -- sans ça, le
// rendu d'un test precedent reste visible et fausse les requetes suivantes.
afterEach(() => {
  cleanup();
});
