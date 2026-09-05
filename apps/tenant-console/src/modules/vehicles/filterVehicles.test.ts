import { describe, it, expect } from "vitest";
import type { Vehicle } from "@vtc/types";
import { filterVehicles } from "./filterVehicles";

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "1",
    tenantId: "tenant-1",
    plateNumber: "DK-1234-AB",
    brand: "Toyota",
    model: "Corolla",
    status: "disponible",
    currentDriverId: null,
    insuranceExpiresAt: null,
    inspectionExpiresAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterVehicles", () => {
  const vehicles = [
    makeVehicle({ id: "1", plateNumber: "DK-1234-AB", brand: "Toyota", status: "disponible" }),
    makeVehicle({ id: "2", plateNumber: "DK-5678-CD", brand: "Hyundai", status: "indisponible" }),
    makeVehicle({ id: "3", plateNumber: "DK-9999-EF", brand: "Toyota", status: "retire" }),
  ];

  it("retourne tout sans recherche ni filtre", () => {
    expect(filterVehicles(vehicles, "", "all")).toHaveLength(3);
  });

  it("filtre par plaque d'immatriculation", () => {
    expect(filterVehicles(vehicles, "5678", "all").map((v) => v.id)).toEqual(["2"]);
  });

  it("filtre par marque, insensible à la casse", () => {
    expect(filterVehicles(vehicles, "toyota", "all").map((v) => v.id)).toEqual(["1", "3"]);
  });

  it("filtre par statut", () => {
    expect(filterVehicles(vehicles, "", "retire").map((v) => v.id)).toEqual(["3"]);
  });

  it("combine recherche et filtre de statut", () => {
    expect(filterVehicles(vehicles, "toyota", "retire").map((v) => v.id)).toEqual(["3"]);
  });
});
