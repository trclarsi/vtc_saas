import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MailPlus } from "lucide-react";
import { useUrlFilters } from "../../shared/useUrlFilters";
import {
  PageHeader,
  DataTable,
  StatusDot,
  Avatar,
  Button,
  Card,
  SearchInput,
  TableSkeleton,
  FilterChip,
  ErrorState,
} from "@vtc/ui";
import type { User, UserStatus } from "@vtc/types";
import { apiClient } from "../../api";
import { UserInviteForm } from "./UserInviteForm";
import { filterUsers } from "./filterUsers";
import { STATUS_LABELS } from "./userLabels";

// Doc 04 §4 — gestion des utilisateurs (comptes internes du tenant)
const STATUS_FILTERS: { value: UserStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "actif", label: "Actifs" },
  { value: "invite", label: "Invités" },
  { value: "suspendu", label: "Suspendus" },
];

export function UsersPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: apiClient.users.list,
  });
  const { query, setQuery, statusFilter, setStatusFilter } = useUrlFilters<UserStatus | "all">("all");

  const filtered = useMemo(() => {
    return filterUsers(data ?? [], query, statusFilter);
  }, [data, query, statusFilter]);

  const hasActiveFilter = query.length > 0 || statusFilter !== "all";
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="Équipe"
        title="Utilisateurs"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <MailPlus size={15} />
            Inviter un collaborateur
          </Button>
        }
      />

      <UserInviteForm open={formOpen} onClose={() => setFormOpen(false)} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          className="max-w-xs"
          placeholder="Rechercher par nom ou email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un utilisateur"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
            />
          ))}
        </div>
      </div>

      <Card>
        {isError ? (
          <ErrorState
            title="Impossible de charger les utilisateurs"
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <TableSkeleton columns={3} />
        ) : (
          <DataTable<User>
            rows={filtered}
            emptyTitle={hasActiveFilter ? "Aucun résultat" : "Aucun collaborateur"}
            emptyHint={
              hasActiveFilter
                ? "Essayez une autre adresse email ou filtre."
                : "Invitez un premier collaborateur pour partager la gestion de ce tenant."
            }
            columns={[
              {
                header: "Nom",
                render: (u) => (
                  <span className="flex items-center gap-2.5">
                    <Avatar firstName={u.firstName} lastName={u.lastName} avatarUrl={u.avatarUrl} size="sm" />
                    {u.firstName} {u.lastName}
                  </span>
                ),
                sortKey: (u) => `${u.firstName} ${u.lastName}`.toLowerCase(),
              },
              { header: "Email", render: (u) => u.email, mono: true, sortKey: (u) => u.email },
              {
                header: "Statut",
                render: (u) => {
                  const status = STATUS_LABELS[u.status];
                  return <StatusDot label={status.label} tone={status.tone} />;
                },
                sortKey: (u) => u.status,
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
