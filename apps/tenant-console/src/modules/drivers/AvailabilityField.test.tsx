import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@vtc/ui";
import type { Driver } from "@vtc/types";
import { AvailabilityField } from "./DriverDetailPage";

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

const update = vi.fn();

vi.mock("../../api", () => ({
  apiClient: {
    drivers: {
      update: (id: string, patch: unknown) => update(id, patch),
    },
  },
}));

function renderWithProviders(driver: Driver) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AvailabilityField driver={driver} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("AvailabilityField", () => {
  beforeEach(() => {
    update.mockReset();
  });

  it("affiche la disponibilite actuelle du chauffeur", () => {
    renderWithProviders(makeDriver({ availabilityStatus: "en_course" }));
    expect(screen.getByRole("combobox")).toHaveValue("en_course");
  });

  it("declenche une mise a jour immediate au changement, sans bouton 'Enregistrer' separe", async () => {
    update.mockResolvedValue(makeDriver({ availabilityStatus: "hors_ligne" }));
    renderWithProviders(makeDriver({ availabilityStatus: "disponible" }));

    await userEvent.selectOptions(screen.getByRole("combobox"), "hors_ligne");

    expect(update).toHaveBeenCalledWith("drv-1", { availabilityStatus: "hors_ligne" });
  });
});
