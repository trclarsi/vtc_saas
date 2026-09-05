import { describe, it, expect } from "vitest";
import type { Reservation } from "@vtc/types";
import { filterReservations } from "./filterReservations";

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "1",
    tenantId: "tenant-1",
    passengerUserId: "user-1",
    driverId: null,
    vehicleId: null,
    scheduledStart: "2026-01-01T08:00:00.000Z",
    scheduledEnd: "2026-01-01T09:00:00.000Z",
    status: "planifiee",
    statusChangedAt: "2026-01-01T08:00:00.000Z",
    createdBy: "user-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterReservations", () => {
  const reservations = [
    makeReservation({ id: "1", status: "planifiee" }),
    makeReservation({ id: "2", status: "en_cours" }),
    makeReservation({ id: "3", status: "annulee" }),
  ];

  it("retourne tout quand le filtre est 'all'", () => {
    expect(filterReservations(reservations, "all")).toHaveLength(3);
  });

  it("filtre par statut precis", () => {
    expect(filterReservations(reservations, "en_cours").map((r) => r.id)).toEqual(["2"]);
  });

  it("retourne une liste vide si aucun statut ne correspond", () => {
    expect(filterReservations(reservations, "terminee")).toHaveLength(0);
  });
});
