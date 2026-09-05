import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@vtc/ui";
import type { Driver } from "@vtc/types";
import { DriverArchiveAction } from "./DriverArchiveAction";

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

const archive = vi.fn();
const unarchive = vi.fn();

vi.mock("../../api", () => ({
  apiClient: {
    drivers: {
      archive: (id: string) => archive(id),
      unarchive: (id: string) => unarchive(id),
    },
  },
}));

function renderWithProviders(driver: Driver) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <DriverArchiveAction driver={driver} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("DriverArchiveAction", () => {
  beforeEach(() => {
    archive.mockReset();
    unarchive.mockReset();
  });

  it("demande confirmation avant d'archiver, et n'appelle rien si annule", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWithProviders(makeDriver());

    await userEvent.click(screen.getByRole("button", { name: /Archiver ce chauffeur/ }));

    expect(window.confirm).toHaveBeenCalled();
    expect(archive).not.toHaveBeenCalled();
  });

  it("archive le chauffeur une fois la confirmation acceptee", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    archive.mockResolvedValue(makeDriver({ archivedAt: "2026-06-01T00:00:00.000Z" }));
    renderWithProviders(makeDriver());

    await userEvent.click(screen.getByRole("button", { name: /Archiver ce chauffeur/ }));

    expect(archive).toHaveBeenCalledWith("drv-1");
  });

  it("affiche 'Reactiver' pour un chauffeur deja archive, sans demander confirmation", async () => {
    unarchive.mockResolvedValue(makeDriver({ archivedAt: null }));
    renderWithProviders(makeDriver({ archivedAt: "2026-06-01T00:00:00.000Z" }));

    expect(screen.queryByRole("button", { name: /Archiver ce chauffeur/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Réactiver ce chauffeur/ }));

    expect(unarchive).toHaveBeenCalledWith("drv-1");
  });
});
