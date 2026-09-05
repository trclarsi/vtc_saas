import { describe, it, expect } from "vitest";
import { isoToTzInputValue, tzInputValueToIso } from "./tzDateTimeInput";

describe("tzDateTimeInput", () => {
  it("convertit un ISO UTC vers l'heure locale du fuseau du tenant", () => {
    // 2026-06-15T10:00:00Z -- Africa/Dakar est en UTC+0 toute l'annee (pas
    // d'heure d'ete), donc l'heure affichee doit rester 10:00.
    expect(isoToTzInputValue("2026-06-15T10:00:00.000Z", "Africa/Dakar")).toBe("2026-06-15T10:00");
    // Europe/Paris est en UTC+2 en juin (heure d'ete).
    expect(isoToTzInputValue("2026-06-15T10:00:00.000Z", "Europe/Paris")).toBe("2026-06-15T12:00");
  });

  it("convertit une valeur datetime-local vers l'ISO UTC correspondant", () => {
    expect(tzInputValueToIso("2026-06-15T10:00", "Africa/Dakar")).toBe("2026-06-15T10:00:00.000Z");
    expect(tzInputValueToIso("2026-06-15T12:00", "Europe/Paris")).toBe("2026-06-15T10:00:00.000Z");
  });

  it("fait un aller-retour sans perte a travers les fuseaux et les saisons", () => {
    for (const timeZone of ["Africa/Dakar", "Europe/Paris", "America/New_York"]) {
      for (const iso of ["2026-01-10T08:30:00.000Z", "2026-07-20T23:15:00.000Z"]) {
        const value = isoToTzInputValue(iso, timeZone);
        expect(tzInputValueToIso(value, timeZone)).toBe(iso);
      }
    }
  });
});
