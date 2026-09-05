import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { Driver, Reservation, Tenant } from "@vtc/types";
import { DriverHistoryPage } from "./DriverHistoryPage";

function makeDriver(overrides: Partial<Driver> = {}): Driver {
  return {
    id: "drv-1",
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

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "res-1",
    tenantId: "tenant-1",
    passengerUserId: "pax-1",
    driverId: "drv-1",
    vehicleId: "veh-1",
    scheduledStart: "2026-06-01T08:00:00.000Z",
    scheduledEnd: "2026-06-01T09:00:00.000Z",
    status: "terminee",
    statusChangedAt: "2026-06-01T09:00:00.000Z",
    createdBy: "usr-1",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
    ...overrides,
  };
}

const driversGet = vi.fn();
const reservationsList = vi.fn();
const tenantGet = vi.fn();

vi.mock("../../api", () => ({
  apiClient: {
    drivers: { get: (id: string) => driversGet(id) },
    reservations: { list: () => reservationsList() },
    tenant: { get: () => tenantGet() },
  },
}));

function renderWithProviders() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/drivers/drv-1/history"]}>
        <Routes>
          <Route path="/drivers/:id/history" element={<DriverHistoryPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DriverHistoryPage", () => {
  beforeEach(() => {
    driversGet.mockReset();
    reservationsList.mockReset();
    tenantGet.mockReset();
    tenantGet.mockResolvedValue({ timeZone: "UTC" } as Tenant);
  });

  it("ne liste que les courses du chauffeur consulte, triees de la plus recente a la plus ancienne", async () => {
    driversGet.mockResolvedValue(makeDriver());
    reservationsList.mockResolvedValue([
      makeReservation({ id: "res-1", driverId: "drv-1", scheduledStart: "2026-06-01T08:00:00.000Z" }),
      makeReservation({ id: "res-2", driverId: "drv-2", scheduledStart: "2026-06-02T08:00:00.000Z" }),
      makeReservation({ id: "res-3", driverId: "drv-1", scheduledStart: "2026-06-03T08:00:00.000Z" }),
    ]);
    renderWithProviders();

    const rows = await screen.findAllByRole("row");
    // 1 ligne d'en-tete + 2 courses de drv-1 (res-2 exclue)
    expect(rows).toHaveLength(3);
    expect(rows[1].textContent).toContain("03/06/2026");
    expect(rows[2].textContent).toContain("01/06/2026");
  });

  it("desactive le telechargement quand il n'y a aucune course", async () => {
    driversGet.mockResolvedValue(makeDriver());
    reservationsList.mockResolvedValue([]);
    renderWithProviders();

    expect(await screen.findByText("Aucune course")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Télécharger/ })).toBeDisabled();
  });

  it("genere un CSV avec BOM et en-tetes lors du telechargement", async () => {
    driversGet.mockResolvedValue(makeDriver());
    reservationsList.mockResolvedValue([makeReservation()]);

    let capturedBlob: Blob | null = null;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock";
    });
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    renderWithProviders();
    const button = await screen.findByRole("button", { name: /Télécharger/ });
    await waitFor(() => expect(button).not.toBeDisabled());
    button.click();

    expect(capturedBlob).not.toBeNull();
    // jsdom n'implemente pas Blob.text() -- FileReader, lui, fonctionne deja
    // ailleurs dans ce module (DriverAvatarUpload).
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(capturedBlob!);
    });
    expect(text).toContain("Départ,Arrivée,Statut");
    // Le BOM UTF-8 (EF BB BF) est strippe par le decodage readAsText -- comme
    // le ferait n'importe quel decodeur UTF-8 conforme -- donc verifie sur
    // les octets bruts, pas sur le texte redecode.
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(capturedBlob!);
    });
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
    expect(clickSpy).toHaveBeenCalled();

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy.mockRestore();
  });
});
