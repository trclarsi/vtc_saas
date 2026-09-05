import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchInput } from "@vtc/ui";
import { apiClient } from "../api";
import { filterDrivers } from "../modules/drivers/filterDrivers";
import { filterVehicles } from "../modules/vehicles/filterVehicles";
import { filterUsers } from "../modules/users/filterUsers";
import { useDismissablePopover } from "./useDismissablePopover";

const RESULTS_PER_SECTION = 5;

// Recherche globale cote client, limitee aux entites qui ont un champ texte
// naturel (nom, plaque, email). Les reservations n'en ont pas -- pas de nom
// client, juste des identifiants internes -- les inclure aurait fait
// chercher sur des ID peu lisibles pour un dispatcher : exclues
// volontairement plutot que d'offrir une recherche de faible valeur.
export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useDismissablePopover<HTMLDivElement>(open, () => setOpen(false));

  const driversQuery = useQuery({ queryKey: ["drivers"], queryFn: apiClient.drivers.list });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles"], queryFn: apiClient.vehicles.list });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: apiClient.users.list });

  const q = query.trim();
  const drivers = q ? filterDrivers(driversQuery.data ?? [], q, "all").slice(0, RESULTS_PER_SECTION) : [];
  const vehicles = q ? filterVehicles(vehiclesQuery.data ?? [], q, "all").slice(0, RESULTS_PER_SECTION) : [];
  const users = q ? filterUsers(usersQuery.data ?? [], q, "all").slice(0, RESULTS_PER_SECTION) : [];
  const hasResults = drivers.length > 0 || vehicles.length > 0 || users.length > 0;

  function goTo(path: string) {
    navigate(path);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <SearchInput
        placeholder="Rechercher un chauffeur, véhicule, utilisateur…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Recherche globale"
      />
      {open && q && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-surface shadow-lg">
          {!hasResults ? (
            <p className="px-4 py-3 text-[13px] text-neutral">Aucun résultat pour « {q} ».</p>
          ) : (
            <>
              {drivers.length > 0 && (
                <div>
                  <span className="block px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-wide text-neutral">
                    Chauffeurs
                  </span>
                  {drivers.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => goTo(`/drivers/${d.id}`)}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-[13px] text-ink transition-colors hover:bg-paper"
                    >
                      <span>
                        {d.firstName} {d.lastName}
                      </span>
                      <span className="font-mono text-[12px] text-neutral">{d.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              {vehicles.length > 0 && (
                <div>
                  <span className="block px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-wide text-neutral">
                    Véhicules
                  </span>
                  {vehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => goTo(`/vehicles/${v.id}`)}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-[13px] text-ink transition-colors hover:bg-paper"
                    >
                      <span className="font-mono">{v.plateNumber}</span>
                      <span className="text-neutral">
                        {v.brand} {v.model}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {users.length > 0 && (
                <div>
                  <span className="block px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-wide text-neutral">
                    Utilisateurs
                  </span>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => goTo(`/users?q=${encodeURIComponent(`${u.firstName} ${u.lastName}`)}`)}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-[13px] text-ink transition-colors hover:bg-paper"
                    >
                      <span>
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="font-mono text-[12px] text-neutral">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
