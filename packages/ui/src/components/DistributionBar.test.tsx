import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DistributionBar } from "./DistributionBar";

describe("DistributionBar", () => {
  it("affiche une barre vide quand tous les segments sont a zero", () => {
    const { container } = render(
      <DistributionBar segments={[{ label: "Validé", value: 0, tone: "success" }]} />,
    );
    // Aucune legende cliquable/textuelle a afficher pour une repartition vide.
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });

  it("affiche chaque segment non vide avec sa valeur en legende", () => {
    render(
      <DistributionBar
        segments={[
          { label: "Validé", value: 3, tone: "success" },
          { label: "En attente", value: 1, tone: "warning" },
        ]}
      />,
    );
    expect(screen.getByText("Validé")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("En attente")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("rend la legende cliquable comme un bouton uniquement si onClick est fourni", async () => {
    const onClick = vi.fn();
    render(
      <DistributionBar
        segments={[
          { label: "Validé", value: 3, tone: "success", onClick },
          { label: "Rejeté", value: 2, tone: "danger" },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Validé/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Rejeté/ })).not.toBeInTheDocument();
  });
});
