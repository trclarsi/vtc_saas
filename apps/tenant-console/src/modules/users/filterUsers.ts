import type { User, UserStatus } from "@vtc/types";

export function filterUsers(users: User[], query: string, statusFilter: UserStatus | "all"): User[] {
  const q = query.trim().toLowerCase();
  return users.filter((u) => {
    const matchesQuery =
      !q ||
      u.email.toLowerCase().includes(q) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
}
