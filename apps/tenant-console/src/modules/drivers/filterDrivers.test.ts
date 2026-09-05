import { describe, it, expect } from "vitest";
import type { Driver } from "@vtc/types";
import { filterDrivers } from "./filterDrivers";

function makeDriver(overrides: Partial<Driver> = {}): Driver {
  return {
    id: "1",
    tenantId: "tenant-1",
    userId: null,
    firstName: "Awa",
    lastName: "Diop",
    phone: "+221770000000",
    email: null,
    avatarUrl: null,
    validationStatus: "valide",
    availabilityStatus: "disponible",
    licenseNumber: null,
    licenseExpiresAt: null,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterDrivers", () => {
  const drivers = [
    makeDriver({ id: "1", firstName: "Awa", lastName: "Diop", validationStatus: "valide" }),
    makeDriver({ id: "2", firstName: "Moussa", lastName: "Fall", validationStatus: "en_attente" }),
    makeDriver({ id: "3", firstName: "Fatou", lastName: "Ba", validationStatus: "rejete" }),
  ];

  it("retourne tout sans recherche ni filtre", () => {
    expect(filterDrivers(drivers, "", "all")).toHaveLength(3);
  });

  it("filtre par nom, insensible à la casse", () => {
    expect(filterDrivers(drivers, "moussa", "all").map((d) => d.id)).toEqual(["2"]);
  });

  it("filtre par numéro de téléphone", () => {
    const withUniquePhone = [
      ...drivers,
      makeDriver({ id: "4", phone: "+221770001234" }),
    ];
    expect(filterDrivers(withUniquePhone, "1234", "all").map((d) => d.id)).toEqual(["4"]);
  });

  it("filtre par email", () => {
    const withEmail = [...drivers, makeDriver({ id: "4", email: "unique@example.com" })];
    expect(filterDrivers(withEmail, "unique@example.com", "all").map((d) => d.id)).toEqual(["4"]);
  });

  it("filtre par statut de validation", () => {
    expect(filterDrivers(drivers, "", "en_attente").map((d) => d.id)).toEqual(["2"]);
  });

  it("combine recherche texte et filtre de statut", () => {
    expect(filterDrivers(drivers, "fatou", "rejete").map((d) => d.id)).toEqual(["3"]);
    expect(filterDrivers(drivers, "fatou", "valide")).toHaveLength(0);
  });

  it("filtre par disponibilité", () => {
    const withAvailability = [
      makeDriver({ id: "1", availabilityStatus: "disponible" }),
      makeDriver({ id: "2", availabilityStatus: "en_course" }),
      makeDriver({ id: "3", availabilityStatus: "hors_ligne" }),
    ];
    expect(filterDrivers(withAvailability, "", "all", "en_course").map((d) => d.id)).toEqual(["2"]);
    expect(filterDrivers(withAvailability, "", "all", "all")).toHaveLength(3);
  });
});
