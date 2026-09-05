import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WaypointTracker } from "./WaypointTracker";

// Doc 04 §7 -- la sequence planifiee -> confirmee -> en_cours -> terminee est
// une vraie progression metier, pas un simple badge : ce test protege le
// mapping statut -> etape, qui est le coeur de l'element signature du design system.
describe("WaypointTracker", () => {
  it("affiche l'etape courante correspondant au statut", () => {
    render(<WaypointTracker status="confirmee" />);
    expect(screen.getByText("Confirmée")).toBeInTheDocument();
  });

  it("affiche 'Planifiée' pour le tout premier statut", () => {
    render(<WaypointTracker status="planifiee" />);
    expect(screen.getByText("Planifiée")).toBeInTheDocument();
  });

  it("affiche 'Terminée' pour le dernier statut de la sequence", () => {
    render(<WaypointTracker status="terminee" />);
    expect(screen.getByText("Terminée")).toBeInTheDocument();
  });

  it("affiche un etat distinct 'Annulée', hors de la sequence normale", () => {
    render(<WaypointTracker status="annulee" />);
    expect(screen.getByText("Annulée")).toBeInTheDocument();
    // Aucune des etapes de la sequence normale ne doit apparaitre pour une reservation annulee.
    expect(screen.queryByText("Planifiée")).not.toBeInTheDocument();
  });
});
