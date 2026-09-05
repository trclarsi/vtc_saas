import { useState, type FormEvent } from "react";
import { Compass } from "lucide-react";
import { Button } from "@vtc/ui";

const ROUTE_POINTS: [number, number][] = [
  [40, 560],
  [120, 460],
  [110, 340],
  [220, 280],
  [240, 160],
  [360, 40],
];

// Doc 04 §2 — authentification. Le flux reel (appel a /auth/login,
// stockage du JWT) sera branche quand le module backend `auth` existera
// (Doc 07 §5). Pour l'instant, ecran seul.
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // TODO: appeler apiClient une fois l'endpoint /auth/login disponible.
    console.log("Connexion", { email, password });
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="relative hidden flex-col justify-end overflow-hidden bg-ink p-12 text-white md:flex">
        <svg className="absolute inset-0 opacity-50" viewBox="0 0 400 600" fill="none" aria-hidden="true">
          <path
            d="M40 560 L120 460 L110 340 L220 280 L240 160 L360 40"
            stroke="#0E7C7B"
            strokeWidth="2"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
          {ROUTE_POINTS.map(([cx, cy], i) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r={i === ROUTE_POINTS.length - 1 ? 6 : 3.5}
              fill={i === ROUTE_POINTS.length - 1 ? "#E0862D" : "#0E7C7B"}
            />
          ))}
        </svg>
        <div className="relative z-10">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-wider text-accent">
            Console de flotte
          </span>
          <p className="max-w-[360px] font-display text-[28px] font-semibold leading-tight">
            Chaque véhicule, chaque chauffeur, chaque course — sur un seul écran.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="flex w-full max-w-80 flex-col gap-3">
          <span className="mb-4 flex h-8 w-8 items-center justify-center rounded-md bg-accent">
            <Compass className="h-[18px] w-[18px] text-ink" />
          </span>
          <h1 className="mb-1 font-display text-[22px] font-semibold text-ink">Connexion</h1>
          <p className="mb-3 text-[13px] text-neutral">Accédez à la console de votre entreprise.</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="mt-2 justify-center">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
}
