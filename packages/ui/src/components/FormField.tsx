import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

const fieldWrap = "flex flex-col gap-1.5";
const labelClass = "text-xs font-semibold text-ink";
const errorClass = "text-xs font-medium text-danger";
const controlBase =
  "rounded-lg border bg-surface px-3 py-2.5 text-sm text-ink transition-colors focus:outline-none";

function controlClass(error?: string) {
  return `${controlBase} ${error ? "border-danger focus:border-danger" : "border-line focus:border-accent"}`;
}

// Tailles en style inline plutot qu'en classes Tailwind : cet environnement
// (pas de depot Git, cf. journal de design) ne compile pas de facon fiable
// une classe Tailwind qui n'est encore utilisee nulle part ailleurs dans le
// projet ("appearance-none", "pr-9", "pl-3" ne l'etaient pas) -- verifie a
// plusieurs reprises (vue liste des chauffeurs, modale). Seules les classes
// deja utilisees ailleurs dans l'app (rounded-lg, border-line, bg-surface...)
// restent en Tailwind ; tout le reste passe en style inline, fiable quel que
// soit ce probleme de compilation.
const SELECT_SIZES = {
  md: { paddingTop: "0.625rem", paddingBottom: "0.625rem", paddingLeft: "0.75rem", paddingRight: "2.25rem", fontSize: "0.875rem" },
  sm: { paddingTop: "0.5rem", paddingBottom: "0.5rem", paddingLeft: "0.75rem", paddingRight: "2rem", fontSize: "13px" },
} as const;

// Select natif habille (fleche par defaut du navigateur remplacee par une
// icone coherente avec le reste du design system) -- utilise partout ou un
// menu deroulant apparait, seul ou dans SelectField ci-dessous.
export function Select({
  size = "md",
  error,
  // Pleine largeur par defaut (comportement des champs de formulaire type
  // TextField) ; false pour un select compact type barre de filtres.
  fullWidth = true,
  className = "",
  style,
  ...props
}: {
  size?: keyof typeof SELECT_SIZES;
  error?: string;
  fullWidth?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">) {
  return (
    <div className="relative" style={{ width: fullWidth ? "100%" : "fit-content" }}>
      <select
        className={`rounded-lg border bg-surface text-ink transition-colors focus:outline-none ${
          error ? "border-danger focus:border-danger" : "border-line focus:border-accent"
        } ${className}`}
        style={{
          width: fullWidth ? "100%" : undefined,
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          ...SELECT_SIZES[size],
          ...style,
        }}
        aria-invalid={!!error}
        {...props}
      />
      <ChevronDown
        className="pointer-events-none absolute h-4 w-4 text-neutral"
        style={{ right: "0.625rem", top: "50%", transform: "translateY(-50%)" }}
      />
    </div>
  );
}

export function TextField({
  label,
  error,
  id,
  ...props
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={fieldWrap}>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <input id={id} className={controlClass(error)} aria-invalid={!!error} {...props} />
      {error && <span className={errorClass}>{error}</span>}
    </div>
  );
}

export function SelectField({
  label,
  error,
  id,
  children,
  ...props
}: { label: string; error?: string; children: ReactNode } & Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
>) {
  return (
    <div className={fieldWrap}>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <Select id={id} error={error} {...props}>
        {children}
      </Select>
      {error && <span className={errorClass}>{error}</span>}
    </div>
  );
}
