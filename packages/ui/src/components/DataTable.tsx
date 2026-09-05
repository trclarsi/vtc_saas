import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface DataTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  mono?: boolean;
  sortKey?: (row: T) => string | number;
}

const PAGE_SIZE = 20;

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyTitle = "Aucune donnée",
  emptyHint,
  onRowClick,
  selectedIds,
  onSelectionChange,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyTitle?: string;
  emptyHint?: string;
  // Volontairement un callback generique, pas une prop "href" -- ce composant
  // ne doit pas dependre de react-router (packages/ui reste utilisable par
  // n'importe quelle app, Doc 06 §6). C'est a l'appelant de naviguer.
  onRowClick?: (row: T) => void;
  // Selection groupee (B4) -- optionnelle. Fournir les deux active la colonne
  // case a cocher ; l'appelant reste proprietaire de l'etat (il connait seul
  // les regles d'eligibilite aux actions groupees, ex. seuls les chauffeurs
  // "en_attente" sont validables).
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}) {
  const [sortHeader, setSortHeader] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // La page revient à 1 dès que la liste source change (nouvelle recherche, nouveau filtre)
  useEffect(() => {
    setPage(1);
  }, [rows]);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.header === sortHeader);
    if (!col?.sortKey) return rows;
    const withKeys = rows.map((row) => ({ row, key: col.sortKey!(row) }));
    withKeys.sort((a, b) => {
      if (a.key < b.key) return sortDirection === "asc" ? -1 : 1;
      if (a.key > b.key) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return withKeys.map((w) => w.row);
  }, [rows, columns, sortHeader, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectable = !!selectedIds && !!onSelectionChange;
  const pageSelectedCount = paginated.filter((r) => selectedIds?.has(r.id)).length;
  const allPageSelected = paginated.length > 0 && pageSelectedCount === paginated.length;

  function toggleRow(id: string) {
    if (!selectedIds || !onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  function togglePage() {
    if (!selectedIds || !onSelectionChange) return;
    const next = new Set(selectedIds);
    if (allPageSelected) {
      for (const r of paginated) next.delete(r.id);
    } else {
      for (const r of paginated) next.add(r.id);
    }
    onSelectionChange(next);
  }

  function handleSort(header: string) {
    if (sortHeader !== header) {
      setSortHeader(header);
      setSortDirection("asc");
    } else {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-14 text-center text-neutral">
        <span className="font-display text-base font-semibold text-ink">{emptyTitle}</span>
        {emptyHint && <span>{emptyHint}</span>}
      </div>
    );
  }

  return (
    <div>
      {/* Vue tableau -- ecrans md et plus, defilement horizontal en dernier recours */}
      <div className="hidden overflow-x-auto md:flex">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {selectable && (
                <th className="w-10 border-b border-line px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={togglePage}
                    aria-label="Sélectionner toute la page"
                    className="h-4 w-4 accent-ink"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.header}
                  className="whitespace-nowrap border-b border-line px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-neutral"
                >
                  {col.sortKey ? (
                    <button
                      onClick={() => handleSort(col.header)}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      {col.header}
                      {sortHeader === col.header ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                className={`transition-colors hover:bg-paper [&:last-child>td]:border-none ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {selectable && (
                  <td
                    className="border-b border-line px-4 py-3.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(row.id) ?? false}
                      onChange={() => toggleRow(row.id)}
                      aria-label="Sélectionner cette ligne"
                      className="h-4 w-4 accent-ink"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={`border-b border-line px-4 py-3.5 text-sm text-ink ${col.mono ? "font-mono text-[13px]" : ""}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue cartes -- en dessous de md, une carte par ligne plutot qu'un tableau qui deborde */}
      <div className="flex flex-col gap-3 p-4 md:hidden">
        {paginated.map((row) => (
          <div
            key={row.id}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }
                : undefined
            }
            tabIndex={onRowClick ? 0 : undefined}
            role={onRowClick ? "button" : undefined}
            className={`rounded-lg border border-line p-4 ${onRowClick ? "cursor-pointer transition-colors hover:bg-paper" : ""}`}
          >
            {selectable && (
              <div
                className="mb-2 flex justify-end border-b border-line pb-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedIds?.has(row.id) ?? false}
                  onChange={() => toggleRow(row.id)}
                  aria-label="Sélectionner cette ligne"
                  className="h-4 w-4 accent-ink"
                />
              </div>
            )}
            {columns.map((col) => (
              <div
                key={col.header}
                className="flex items-center justify-between gap-3 border-b border-line py-2 first:pt-0 last:border-none last:pb-0"
              >
                <span className="flex-shrink-0 font-mono text-[11px] uppercase tracking-wide text-neutral">
                  {col.header}
                </span>
                <div
                  className={`text-right text-sm text-ink ${col.mono ? "font-mono text-[13px]" : ""}`}
                >
                  {col.render(row)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <span className="text-[13px] text-neutral">
            Page {page} sur {totalPages} — {sorted.length} résultats
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
