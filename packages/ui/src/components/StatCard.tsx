import type { ReactNode } from "react";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  eyebrow,
  footer,
}: {
  label: string;
  value: number | string | undefined;
  eyebrow?: string;
  footer?: ReactNode;
}) {
  return (
    <Card className="flex min-w-[200px] flex-1 flex-col gap-1.5 p-5">
      {eyebrow && (
        <span className="font-mono text-[11px] uppercase tracking-wide text-teal">{eyebrow}</span>
      )}
      <span className="font-mono text-[32px] font-medium leading-none text-ink">{value ?? "—"}</span>
      <span className="text-[13px] text-neutral">{label}</span>
      {footer && <div className="mt-2 border-t border-line pt-2.5">{footer}</div>}
    </Card>
  );
}
