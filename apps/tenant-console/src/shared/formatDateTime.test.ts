import { describe, it, expect } from "vitest";
import { formatDateTime } from "./formatDateTime";

// Le fuseau horaire du tenant (Parametres) doit reellement changer l'heure
// affichee -- deux dispatchers dans des fuseaux differents ne doivent jamais
// voir la meme heure de depart formatee differemment "par accident".
describe("formatDateTime", () => {
  const instant = "2026-06-15T12:00:00.000Z";

  it("formate dans le fuseau horaire fourni, pas celui du systeme", () => {
    expect(formatDateTime(instant, "UTC")).toContain("12:00");
    expect(formatDateTime(instant, "America/New_York")).toContain("08:00");
  });
});
