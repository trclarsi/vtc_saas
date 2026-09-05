import { describe, it, expect } from "vitest";
import { expiryStatus, isExpiryUrgent } from "./expiry";

const DAY_MS = 86_400_000;
function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

// Seuil unique partage entre la fiche detail et le widget de conformite du
// tableau de bord (Doc 04) -- ce test protege les trois zones (expire /
// bientot / a jour) qui doivent rester coherentes partout ou elles sont lues.
describe("expiryStatus", () => {
  it("retourne null quand aucune date n'est renseignee", () => {
    expect(expiryStatus(null)).toBeNull();
  });

  it("marque une date passee comme expiree, tonalite danger", () => {
    const status = expiryStatus(daysFromNow(-5));
    expect(status).toMatchObject({ tone: "danger", label: "Expiré" });
  });

  it("marque une date dans la fenetre de 30 jours comme avertissement", () => {
    const status = expiryStatus(daysFromNow(10));
    expect(status?.tone).toBe("warning");
    expect(status?.label).toContain("10");
  });

  it("marque une date au-dela de 30 jours comme a jour", () => {
    const status = expiryStatus(daysFromNow(40));
    expect(status).toMatchObject({ tone: "success", label: "À jour" });
  });
});

describe("isExpiryUrgent", () => {
  it("n'est pas urgent quand il n'y a pas de statut", () => {
    expect(isExpiryUrgent(null)).toBe(false);
  });

  it("n'est pas urgent quand le document est a jour", () => {
    expect(isExpiryUrgent(expiryStatus(daysFromNow(40)))).toBe(false);
  });

  it("est urgent pour un document expire ou bientot expire", () => {
    expect(isExpiryUrgent(expiryStatus(daysFromNow(-1)))).toBe(true);
    expect(isExpiryUrgent(expiryStatus(daysFromNow(10)))).toBe(true);
  });
});
