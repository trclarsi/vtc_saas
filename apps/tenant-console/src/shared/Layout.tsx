import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  UserRound,
  Car,
  Route,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useSession, hasRole } from "@vtc/auth";
import type { RoleCode } from "@vtc/types";
import { apiClient } from "../api";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { ProfilePopover } from "./ProfilePopover";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: RoleCode[];
}

// Regroupement par section (au-dela de 5-6 items, une liste plate melange
// des choses de nature differente : consultation quotidienne vs gestion
// administrative) -- pas de section pour "Tableau de bord" seul, une section
// d'un seul item n'apporte rien.
const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  { items: [{ to: "/", label: "Tableau de bord", icon: LayoutDashboard }] },
  {
    label: "Opérations",
    items: [
      { to: "/drivers", label: "Chauffeurs", icon: UserRound },
      { to: "/vehicles", label: "Véhicules", icon: Car, roles: ["admin_tenant", "fleet_manager"] },
      { to: "/reservations", label: "Réservations", icon: Route },
    ],
  },
  {
    label: "Administration",
    items: [{ to: "/users", label: "Utilisateurs", icon: Users, roles: ["admin_tenant"] }],
  },
];

// Isole du reste de la nav, juste au-dessus du bouton de reduction (demande
// explicite) -- un reglage global du tenant, pas une section de contenu au
// meme titre que les autres.
const SETTINGS_ITEM: NavItem = {
  to: "/settings",
  label: "Paramètres",
  icon: Settings,
  roles: ["admin_tenant"],
};

const SIDEBAR_COLLAPSE_KEY = "tenant-console:sidebar-collapsed";

export function Layout() {
  const session = useSession();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1",
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Meme queryKey que TenantSettingsPage/ProfilePage -- reutilise le cache
  // React Query, pas de requete supplementaire une fois l'une des deux
  // pages visitee.
  const tenantQuery = useQuery({ queryKey: ["tenant"], queryFn: apiClient.tenant.get });
  const meQuery = useQuery({ queryKey: ["users", "me"], queryFn: apiClient.users.me });

  // Retinte l'accent de toute l'app (packages/ui/tokens.css,
  // `:root[data-brand="…"]`) a partir de la couleur de marque choisie dans
  // Parametres -- reellement applique, pas juste un apercu local a la page.
  useEffect(() => {
    const theme = tenantQuery.data?.branding.theme;
    if (theme) document.documentElement.dataset.brand = theme;
  }, [tenantQuery.data?.branding.theme]);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || hasRole(session, ...item.roles)),
  })).filter((group) => group.items.length > 0);

  const canSeeSettings = !SETTINGS_ITEM.roles || hasRole(session, ...SETTINGS_ITEM.roles);

  function renderNavItem(item: NavItem) {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/"}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          [
            "relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
            collapsed ? "md:justify-center md:px-0" : "",
            isActive ? "bg-accent/15 text-accent" : "text-white/75 hover:bg-white/[.06] hover:text-white",
          ].join(" ")
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-opacity ${
                isActive ? "opacity-100" : "opacity-0"
              } ${collapsed ? "md:hidden" : ""}`}
              aria-hidden="true"
            />
            <Icon className="h-[17px] w-[17px] flex-shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ${
                collapsed ? "md:max-w-0 md:opacity-0" : "max-w-[170px] opacity-100"
              }`}
            >
              {item.label}
            </span>
          </>
        )}
      </NavLink>
    );
  }

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav
        className={[
          // md:sticky + md:h-screen -- la sidebar reste epinglee au viewport
          // pendant que le contenu de la page defile, au lieu de defiler avec
          // lui (bug corrige : `md:static` laissait la nav suivre la hauteur
          // du contenu, donc "disparaitre" en scrollant sur une page longue).
          // Pas d'`overflow-hidden` ici : chaque libelle qui doit se clipper
          // pendant la transition de largeur porte deja son propre
          // `overflow-hidden` (voir renderNavItem) -- un overflow-hidden sur
          // le <nav> entier rognait aussi le panneau du profil (ProfilePopover),
          // qui doit deborder de la sidebar pour s'afficher par-dessus la page.
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-shrink-0 flex-col gap-8 bg-ink px-3 py-6 text-white transition-[width,transform] duration-200 ease-out md:sticky md:top-0 md:h-screen md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-[76px]" : "md:w-60",
        ].join(" ")}
      >
        <div
          className={`flex items-center justify-between gap-2 px-1 ${collapsed ? "md:justify-center" : ""}`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`flex min-w-0 flex-col leading-tight ${collapsed ? "md:hidden" : ""}`}>
              {tenantQuery.data ? (
                <span className="truncate whitespace-nowrap font-display text-[15px] font-semibold">
                  {tenantQuery.data.name}
                </span>
              ) : (
                <span className="h-4 w-24 animate-pulse rounded bg-white/10" aria-hidden="true" />
              )}
              <span className="truncate whitespace-nowrap text-[11px] text-white/50">
                {meQuery.data ? `${meQuery.data.firstName} ${meQuery.data.lastName}` : "…"}
              </span>
            </span>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            <ProfilePopover />
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white md:hidden"
              aria-label="Fermer le menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {visibleGroups.map((group, groupIndex) => (
            <div key={group.label ?? groupIndex} className="flex flex-col gap-0.5">
              {group.label && (
                <span
                  className={`px-3 pb-1 font-mono text-[10px] uppercase tracking-wide text-white/35 ${collapsed ? "md:hidden" : ""}`}
                >
                  {group.label}
                </span>
              )}
              {group.items.map(renderNavItem)}
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-3">
          {canSeeSettings && (
            <div className="mb-0.5 flex flex-col gap-0.5">{renderNavItem(SETTINGS_ITEM)}</div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`hidden w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/[.06] hover:text-white md:flex ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
            )}
            <span
              className={`overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ${
                collapsed ? "md:max-w-0 md:opacity-0" : "max-w-[170px] opacity-100"
              }`}
            >
              Réduire le menu
            </span>
          </button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-line bg-surface px-6 py-3 md:px-12">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex-shrink-0 rounded-lg p-1.5 text-ink hover:bg-paper md:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden flex-shrink-0 sm:block">
            {tenantQuery.data?.branding.logoUrl ? (
              <img
                src={tenantQuery.data.branding.logoUrl}
                alt={tenantQuery.data.name}
                className="h-6 w-6 flex-shrink-0 rounded-md object-cover"
              />
            ) : (
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-accent text-[11px] font-semibold text-ink"
                title={tenantQuery.data?.name}
              >
                {tenantQuery.data?.name.charAt(0).toUpperCase() ?? ""}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 sm:max-w-sm">
            <GlobalSearch />
          </div>

          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-6 py-6 md:px-12 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
