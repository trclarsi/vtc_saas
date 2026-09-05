import { useEffect, useRef } from "react";

// Comportement commun aux petits panneaux ancres (GlobalSearch, NotificationBell,
// ProfilePopover) : clic a l'exterieur ferme, Echap ferme, le focus clavier
// revient au declencheur a la fermeture -- meme principe que SlideOver
// (Partie A1), pas de raison que ces panneaux plus recents en fassent moins.
export function useDismissablePopover<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const containerRef = useRef<T>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  return containerRef;
}
