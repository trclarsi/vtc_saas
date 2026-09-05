const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-[13px]",
  lg: "h-16 w-16 text-lg",
} as const;

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Cercle d'identite : photo reelle si `avatarUrl` est fourni, sinon initiales
// -- jamais de photo generique/inventee pour combler l'absence de donnee.
export function Avatar({
  firstName,
  lastName,
  avatarUrl,
  size = "md",
}: {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`flex-shrink-0 rounded-full object-cover ${SIZES[size]}`}
      />
    );
  }

  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-ink-soft font-semibold text-white ${SIZES[size]}`}
      aria-hidden="true"
    >
      {initials(firstName, lastName)}
    </span>
  );
}
