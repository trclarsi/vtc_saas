import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

export function SearchInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 focus-within:border-accent ${className}`}
    >
      <Search className="h-4 w-4 flex-shrink-0 text-neutral" />
      <input
        className="w-full border-none bg-transparent text-sm text-ink placeholder:text-neutral focus:outline-none"
        {...props}
      />
    </div>
  );
}
