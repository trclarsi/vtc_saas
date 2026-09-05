import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type DataTableColumn } from "./DataTable";

interface Row {
  id: string;
  name: string;
}

const columns: DataTableColumn<Row>[] = [{ header: "Nom", render: (r) => r.name, sortKey: (r) => r.name }];

function namesInTable(): (string | null)[] {
  const table = screen.getByRole("table");
  return within(table)
    .getAllByRole("row")
    .slice(1) // ignore la ligne d'en-tete
    .map((row) => row.textContent);
}

describe("DataTable", () => {
  it("trie par ordre croissant puis decroissant au clic sur l'en-tete triable", async () => {
    const rows: Row[] = [
      { id: "1", name: "Charlie" },
      { id: "2", name: "Alice" },
      { id: "3", name: "Bravo" },
    ];
    render(<DataTable rows={rows} columns={columns} />);

    // Ordre naturel avant tout tri
    expect(namesInTable()).toEqual(["Charlie", "Alice", "Bravo"]);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Nom/ }));
    expect(namesInTable()).toEqual(["Alice", "Bravo", "Charlie"]);

    await user.click(screen.getByRole("button", { name: /Nom/ }));
    expect(namesInTable()).toEqual(["Charlie", "Bravo", "Alice"]);
  });

  it("pagine au-dela de 20 lignes et navigue au clic sur Suivant/Precedent", async () => {
    const rows: Row[] = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      name: `Item ${String(i).padStart(2, "0")}`,
    }));
    render(<DataTable rows={rows} columns={columns} />);

    expect(screen.getByText(/Page 1 sur 2/)).toBeInTheDocument();
    expect(namesInTable()).toHaveLength(20);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getByText(/Page 2 sur 2/)).toBeInTheDocument();
    expect(namesInTable()).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: "Précédent" }));
    expect(screen.getByText(/Page 1 sur 2/)).toBeInTheDocument();
  });

  it("n'affiche aucune pagination en dessous de 20 lignes", () => {
    render(<DataTable rows={[{ id: "1", name: "Solo" }]} columns={columns} />);
    expect(screen.queryByText(/Page \d+ sur/)).not.toBeInTheDocument();
  });

  it("affiche l'etat vide fourni quand la liste est vide", () => {
    render(
      <DataTable
        rows={[]}
        columns={columns}
        emptyTitle="Rien ici"
        emptyHint="Ajoutez une premiere ligne."
      />,
    );
    expect(screen.getByText("Rien ici")).toBeInTheDocument();
    expect(screen.getByText("Ajoutez une premiere ligne.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
