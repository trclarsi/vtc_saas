import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@vtc/ui";
import type { Driver } from "@vtc/types";
import { DriverAvatarUpload } from "./DriverAvatarUpload";

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
        <DriverAvatarUpload driver={driver} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("DriverAvatarUpload", () => {
  beforeEach(() => {
    update.mockReset();
  });

  it("rejette un fichier qui n'est pas une image, sans appeler l'API", async () => {
    renderWithProviders(makeDriver());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["texte"], "notes.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("Choisissez un fichier image.")).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("rejette une image trop lourde (> 2 Mo), sans appeler l'API", async () => {
    renderWithProviders(makeDriver());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigContent = new Uint8Array(2 * 1024 * 1024 + 1);
    const file = new File([bigContent], "photo.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("Image trop lourde (2 Mo maximum).")).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("envoie une image valide en data URL", async () => {
    update.mockResolvedValue(makeDriver({ avatarUrl: "data:image/png;base64,AAAA" }));
    renderWithProviders(makeDriver());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("Photo mise à jour.")).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith("drv-1", { avatarUrl: expect.stringMatching(/^data:image\/png/) });
  });

  it("ouvre une vue agrandie au clic quand une photo existe deja, sans ouvrir le selecteur de fichier", async () => {
    renderWithProviders(makeDriver({ avatarUrl: "data:image/png;base64,AAAA" }));

    await userEvent.click(screen.getByRole("button", { name: "Voir la photo du chauffeur" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Changer la photo/ })).toBeInTheDocument();
  });
});
