import type { ReactNode } from "react";

export function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-none">
      <span className="font-mono text-[11px] uppercase tracking-wide text-neutral">{label}</span>
      <div className="text-right text-sm text-ink">{value}</div>
    </div>
  );
}
