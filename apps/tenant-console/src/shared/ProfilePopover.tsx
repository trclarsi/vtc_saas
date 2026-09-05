import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Button } from "@vtc/ui";
import { useSession } from "@vtc/auth";
import { apiClient } from "../api";
import { ROLE_LABELS } from "./roleLabels";
import { useDismissablePopover } from "./useDismissablePopover";

// Apercu rapide accessible depuis n'importe quelle page (clic sur l'avatar) --
// panneau ancre, meme pattern que NotificationBell/GlobalSearch, pas une
// fenetre modale avec fond assombri (trop lourd pour un simple resume).
// Reste volontairement en lecture seule : renvoie vers /profile pour toute
// modification, pas de formulaire duplique a deux endroits.
export function ProfilePopover() {
  const navigate = useNavigate();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useDismissablePopover<HTMLDivElement>(open, () => setOpen(false));
  const { data: me } = useQuery({ queryKey: ["users", "me"], queryFn: apiClient.users.me });

  if (!me) return null;

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full transition-opacity hover:opacity-80"
        title={`${me.firstName} ${me.lastName} — ${ROLE_LABELS[session.role]}`}
      >
        <Avatar firstName={me.firstName} lastName={me.lastName} avatarUrl={me.avatarUrl} size="sm" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-line bg-surface shadow-lg">
          <div className="flex items-center gap-2.5 border-b border-line px-3 py-3">
            <Avatar firstName={me.firstName} lastName={me.lastName} avatarUrl={me.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">
                {me.firstName} {me.lastName}
              </p>
              <p className="truncate text-[12px] text-neutral">{ROLE_LABELS[session.role]}</p>
            </div>
          </div>
          <div className="p-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
            >
              Modifier mon profil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
