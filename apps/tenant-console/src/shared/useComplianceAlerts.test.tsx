import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, type Session } from "@vtc/auth";
import type { Driver, Vehicle } from "@vtc/types";
import { useComplianceAlerts } from "./useComplianceAlerts";

const DAY_MS = 86_400_000;
function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

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

const driversList = vi.fn();
const vehiclesList = vi.fn();

// La logique reelle (apiClient, requetes reseau) est mockee -- ce test porte
// sur l'agregation/le tri des signaux "a traiter", pas sur la couche reseau
// deja couverte ailleurs.
vi.mock("../api", () => ({
  apiClient: {
    drivers: { list: () => driversList() },
    vehicles: { list: () => vehiclesList() },
  },
}));

function makeSession(role: Session["role"]): Session {
  return { userId: "u1", tenantId: "tenant-1", role, accessToken: "token" };
}

function renderWithProviders(role: Session["role"]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useComplianceAlerts(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={makeSession(role)}>{children}</SessionProvider>
      </QueryClientProvider>
    ),
  });
}

describe("useComplianceAlerts", () => {
  it("liste les chauffeurs en attente de validation", async () => {
    driversList.mockResolvedValue([
      makeDriver({ id: "1", validationStatus: "en_attente" }),
      makeDriver({ id: "2", validationStatus: "valide" }),
    ]);
    vehiclesList.mockResolvedValue([]);

    const { result } = renderWithProviders("fleet_manager");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pendingDrivers).toHaveLength(1);
    expect(result.current.pendingDrivers[0].key).toBe("pending-1");
  });

  it("remonte les permis et documents vehicule proches de l'expiration, tries du plus urgent au moins urgent", async () => {
    driversList.mockResolvedValue([
      makeDriver({ id: "1", licenseExpiresAt: daysFromNow(20) }),
    ]);
    vehiclesList.mockResolvedValue([
      makeVehicle({ id: "1", insuranceExpiresAt: daysFromNow(-2) }),
    ]);

    const { result } = renderWithProviders("fleet_manager");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.complianceEntries.map((e) => e.document)).toEqual([
      "Assurance",
      "Permis de conduire",
    ]);
  });

  it("masque les alertes vehicule pour un role sans acces au parc", async () => {
    driversList.mockResolvedValue([]);
    vehiclesList.mockResolvedValue([makeVehicle({ id: "1", insuranceExpiresAt: daysFromNow(-2) })]);

    const { result } = renderWithProviders("chauffeur");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.complianceEntries).toHaveLength(0);
  });
});
