import { useSearchParams } from "react-router-dom";

// B3 -- persiste recherche et filtre de statut dans l'URL (?q=...&status=...)
// plutot que dans un useState local : lien partageable, bouton retour du
// navigateur coherent. `replace: true` evite de polluer l'historique a chaque
// frappe dans le champ de recherche.
export function useUrlFilters<S extends string>(defaultStatus: S) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const statusFilter = (searchParams.get("status") as S) || defaultStatus;

  function setQuery(value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set("q", value);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }

  function setStatusFilter(value: S) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value !== defaultStatus) next.set("status", value);
        else next.delete("status");
        return next;
      },
      { replace: true },
    );
  }

  return { query, setQuery, statusFilter, setStatusFilter };
}
