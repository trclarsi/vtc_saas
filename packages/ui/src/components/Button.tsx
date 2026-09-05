import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-ink text-white hover:bg-ink-soft",
  secondary: "bg-surface text-ink border border-line hover:border-ink",
  ghost: "bg-transparent text-ink hover:bg-paper",
  // Pour un bouton pose sur un fond deja sombre (ex. BulkActionBar) --
  // "secondary"/"ghost" y sont quasi invisibles (pense pour un fond clair).
  inverse: "bg-white/10 text-white border border-white/10 hover:bg-white/20",
  dangerInverse: "bg-danger/20 text-white border border-danger/40 hover:bg-danger/30",
} as const;

// Definis comme des chaines completes par taille (pas de override partiel de
// classes) -- deux utilitaires Tailwind qui ciblent la meme propriete (ex.
// px-4 puis px-2.5) n'ont pas de garantie d'ordre de priorite fiable a la
// simple concatenation de chaines, contrairement a un choix complet par variante.
const SIZES = {
  md: "px-4 py-2.5 text-[13px]",
  sm: "px-2.5 py-1.5 text-xs",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg border border-transparent font-body font-semibold whitespace-nowrap transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
