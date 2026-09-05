// Conversion entre un ISO 8601 (UTC) et la valeur attendue par un
// <input type="datetime-local"> ("YYYY-MM-DDTHH:mm"), exprimee dans le
// fuseau horaire du tenant plutot que celui du navigateur -- meme raison que
// formatDateTime.ts : deux dispatchers dans des fuseaux differents doivent
// reprogrammer la meme reservation sur la meme heure de depart.

function partsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

export function isoToTzInputValue(iso: string, timeZone: string): string {
  const { year, month, day, hour, minute } = partsInTimeZone(new Date(iso), timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

export function tzInputValueToIso(value: string, timeZone: string): string {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);

  // Le decalage horaire d'un fuseau varie selon la date (heure d'ete/hiver) :
  // on part d'une estimation UTC, on regarde a quelle heure locale elle
  // correspond dans le fuseau cible, puis on corrige l'ecart constate.
  const guessUtcMs = Date.UTC(y, m - 1, d, hh, mm);
  const shown = partsInTimeZone(new Date(guessUtcMs), timeZone);
  const shownAsUtcMs = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute);
  const offsetMs = shownAsUtcMs - guessUtcMs;
  return new Date(guessUtcMs - offsetMs).toISOString();
}
