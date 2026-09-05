import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "./Avatar";

// Regle metier : jamais de photo generique/inventee pour combler l'absence
// de donnee -- ce test protege le choix "initiales sinon rien" plutot qu'un
// avatar par defaut factice.
describe("Avatar", () => {
  it("affiche les initiales majuscules quand aucune photo n'est fournie", () => {
    render(<Avatar firstName="Awa" lastName="Diop" avatarUrl={null} />);
    expect(screen.getByText("AD")).toBeInTheDocument();
  });

  it("affiche la photo quand avatarUrl est fourni, sans initiales", () => {
    const { container } = render(
      <Avatar firstName="Awa" lastName="Diop" avatarUrl="https://example.com/awa.jpg" />,
    );
    // alt="" est volontaire (photo purement decorative, le nom est porte par
    // le texte adjacent) -- ca retire le role accessible "img", donc requete
    // par selecteur CSS plutot que getByRole ici.
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com/awa.jpg");
    expect(screen.queryByText("AD")).not.toBeInTheDocument();
  });
});
