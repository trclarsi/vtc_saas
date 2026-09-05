import { describe, it, expect } from "vitest";
import type { User } from "@vtc/types";
import { filterUsers } from "./filterUsers";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "1",
    tenantId: "tenant-1",
    email: "admin@tenant.sn",
    firstName: "Aïcha",
    lastName: "Diallo",
    avatarUrl: null,
    status: "actif",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterUsers", () => {
  const users = [
    makeUser({ id: "1", email: "admin@tenant.sn", firstName: "Aïcha", lastName: "Diallo", status: "actif" }),
    makeUser({ id: "2", email: "manager@tenant.sn", firstName: "Moussa", lastName: "Sy", status: "invite" }),
    makeUser({ id: "3", email: "fleet@tenant.sn", firstName: "Omar", lastName: "Kane", status: "suspendu" }),
  ];

  it("retourne tout sans recherche ni filtre", () => {
    expect(filterUsers(users, "", "all")).toHaveLength(3);
  });

  it("filtre par email, insensible à la casse", () => {
    expect(filterUsers(users, "MANAGER", "all").map((u) => u.id)).toEqual(["2"]);
  });

  it("filtre par nom, insensible à la casse", () => {
    expect(filterUsers(users, "moussa", "all").map((u) => u.id)).toEqual(["2"]);
  });

  it("filtre par statut", () => {
    expect(filterUsers(users, "", "suspendu").map((u) => u.id)).toEqual(["3"]);
  });

  it("combine recherche et filtre de statut", () => {
    expect(filterUsers(users, "fleet", "suspendu").map((u) => u.id)).toEqual(["3"]);
    expect(filterUsers(users, "fleet", "actif")).toHaveLength(0);
  });
});
