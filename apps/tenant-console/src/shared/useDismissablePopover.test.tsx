import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useDismissablePopover } from "./useDismissablePopover";

// Comportement commun aux 3 panneaux ancres (GlobalSearch, NotificationBell,
// ProfilePopover) -- ce test protege les trois sorties (clic exterieur,
// Echap, retour de focus) pour que les trois consommateurs restent alignes
// sans avoir a dupliquer ce test dans chacun d'eux.
function TestPopover({ onClose }: { onClose: () => void }) {
  const ref = useDismissablePopover<HTMLDivElement>(true, onClose);
  return (
    <div>
      <button>Déclencheur</button>
      <div ref={ref} data-testid="panel">
        Contenu du panneau
      </div>
      <button>Autre élément</button>
    </div>
  );
}

describe("useDismissablePopover", () => {
  it("ferme au clic en dehors du conteneur", async () => {
    const onClose = vi.fn();
    render(<TestPopover onClose={onClose} />);
    await userEvent.click(screen.getByText("Autre élément"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ne ferme pas au clic a l'interieur du conteneur", async () => {
    const onClose = vi.fn();
    render(<TestPopover onClose={onClose} />);
    await userEvent.click(screen.getByTestId("panel"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ferme avec la touche Echap", async () => {
    const onClose = vi.fn();
    render(<TestPopover onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rend le focus au declencheur precedent a la fermeture", async () => {
    const onClose = vi.fn();
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(<TestPopover onClose={onClose} />);
    unmount();

    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });
});
