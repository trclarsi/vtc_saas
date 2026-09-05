import { createContext, useContext, type ReactNode } from "react";
import type { RoleCode } from "@vtc/types";

// Le tenant_id et le role sont encodes dans le payload du JWT a l'emission
// (Doc 07 §5) --- la session cote client se contente de les exposer, jamais
// de les redemander au backend a chaque rendu.
export interface Session {
  userId: string;
  tenantId: string | null;
  role: RoleCode;
  accessToken: string;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession doit etre utilise a l'interieur d'un SessionProvider");
  }
  return session;
}

// Verification de role cote UI --- ne remplace jamais le controle RBAC
// applique par le backend sur chaque requete (Doc 04 §11, Doc 05 §6).
// Sert uniquement a afficher/masquer des elements d'interface.
export function hasRole(session: Session, ...roles: RoleCode[]): boolean {
  return roles.includes(session.role);
}
