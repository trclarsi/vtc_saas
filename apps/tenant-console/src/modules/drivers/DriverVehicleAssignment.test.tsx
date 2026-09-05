import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@vtc/ui";
import type { Vehicle } from "@vtc/types";
import { DriverVehicleAssignment } from "./DriverVehicleAssignment";

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "veh-1",
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

const assignDriver = vi.fn();

vi.mock("../../api", () => ({
  apiClient: {
    vehicles: {
      assignDriver: (id: string, driverId: string | null) => assignDriver(id, driverId),
    },
  },
}));

function renderWithProviders(props: Parameters<typeof DriverVehicleAssignment>[0]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <DriverVehicleAssignment {...props} />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("DriverVehicleAssignment", () => {
  beforeEach(() => {
    assignDriver.mockReset();
  });

  it("propose d'assigner un vehicule quand aucun n'est affecte", () => {
    renderWithProviders({ driverId: "drv-1", currentVehicle: null, vehicles: [] });
    expect(screen.getByRole("button", { name: "Assigner un véhicule" })).toBeInTheDocument();
  });

  it("ne propose que les vehicules disponibles et non deja assignes", async () => {
    const vehicles = [
      makeVehicle({ id: "veh-1", plateNumber: "DK-1111-AA", status: "disponible", currentDriverId: null }),
      makeVehicle({ id: "veh-2", plateNumber: "DK-2222-AA", status: "disponible", currentDriverId: "drv-9" }),
      makeVehicle({ id: "veh-3", plateNumber: "DK-3333-AA", status: "indisponible", currentDriverId: null }),
    ];
    renderWithProviders({ driverId: "drv-1", currentVehicle: null, vehicles });

    await userEvent.click(screen.getByRole("button", { name: "Assigner un véhicule" }));

    const select = screen.getByRole("combobox", { name: "Choisir un véhicule" });
    const options = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toEqual(["Choisir un véhicule…", "DK-1111-AA — Toyota Corolla"]);
  });

  it("assigne le vehicule choisi", async () => {
    assignDriver.mockResolvedValue(makeVehicle({ currentDriverId: "drv-1" }));
    const vehicles = [makeVehicle({ id: "veh-1", plateNumber: "DK-1111-AA" })];
    renderWithProviders({ driverId: "drv-1", currentVehicle: null, vehicles });

    await userEvent.click(screen.getByRole("button", { name: "Assigner un véhicule" }));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Choisir un véhicule" }), "veh-1");
    await userEvent.click(screen.getByRole("button", { name: "Assigner" }));

    expect(assignDriver).toHaveBeenCalledWith("veh-1", "drv-1");
  });

  it("affiche le vehicule assigne avec les actions Changer/Retirer", () => {
    const currentVehicle = makeVehicle({ currentDriverId: "drv-1" });
    renderWithProviders({ driverId: "drv-1", currentVehicle, vehicles: [currentVehicle] });

    expect(screen.getByText("DK-1234-AB")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Changer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retirer" })).toBeInTheDocument();
  });

  it("retire l'assignation en cours", async () => {
    assignDriver.mockResolvedValue(makeVehicle({ currentDriverId: null }));
    const currentVehicle = makeVehicle({ id: "veh-1", currentDriverId: "drv-1" });
    renderWithProviders({ driverId: "drv-1", currentVehicle, vehicles: [currentVehicle] });

    await userEvent.click(screen.getByRole("button", { name: "Retirer" }));

    expect(assignDriver).toHaveBeenCalledWith("veh-1", null);
  });
});
