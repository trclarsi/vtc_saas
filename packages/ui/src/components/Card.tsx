import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(20,33,61,0.04),0_1px_8px_rgba(20,33,61,0.05)] ${className}`}
      {...props}
    />
  );
}
