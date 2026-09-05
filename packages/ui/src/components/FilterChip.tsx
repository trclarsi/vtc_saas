export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}
