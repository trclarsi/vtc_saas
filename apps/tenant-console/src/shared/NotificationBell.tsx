import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { StatusDot, TONE_BORDERS } from "@vtc/ui";
import { useComplianceAlerts } from "./useComplianceAlerts";
import { useDismissablePopover } from "./useDismissablePopover";

// Agrege les signaux "a traiter" deja reels ailleurs dans l'app (chauffeurs
// en attente de validation, documents expires/expirant -- meme source que
// le tableau de bord, useComplianceAlerts) pour les rendre accessibles
// depuis n'importe quelle page, pas seulement le tableau de bord.
export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useDismissablePopover<HTMLDivElement>(open, () => setOpen(false));
  const { pendingDrivers, complianceEntries } = useComplianceAlerts();

  const total = pendingDrivers.length + complianceEntries.length;

  function goTo(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-ink transition-colors hover:bg-paper"
        aria-label={total > 0 ? `Notifications (${total})` : "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-surface shadow-lg">
          {total === 0 ? (
            <p className="px-4 py-4 text-center text-[13px] text-neutral">
              Rien à signaler pour le moment.
            </p>
          ) : (
            <>
              {pendingDrivers.length > 0 && (
                <div>
                  <span className="block px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-wide text-neutral">
                    Chauffeurs en attente de validation
                  </span>
                  {pendingDrivers.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => goTo(d.href)}
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
              {complianceEntries.length > 0 && (
                <div>
                  <span className="block px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-wide text-neutral">
                    Documents à renouveler
                  </span>
                  {complianceEntries.map((entry) => (
                    <button
                      key={entry.key}
                      onClick={() => goTo(entry.href)}
                      className={`flex w-full items-center justify-between border-l-[3px] px-4 py-2 text-left text-[13px] text-ink transition-colors hover:bg-paper ${TONE_BORDERS[entry.tone]}`}
                    >
                      <span>
                        <span className="block">{entry.label}</span>
                        <span className="text-[12px] text-neutral">{entry.document}</span>
                      </span>
                      <StatusDot
                        label={entry.daysLeft < 0 ? "Expiré" : `${entry.daysLeft} j`}
                        tone={entry.tone}
                      />
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
