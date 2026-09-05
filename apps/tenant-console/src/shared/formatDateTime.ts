// Doc 04 §3 -- formate une date dans le fuseau horaire configure par le
// tenant (Parametres), pas celui du navigateur qui consulte l'ecran. Deux
// dispatchers dans des fuseaux differents doivent voir la meme heure de
// depart pour la meme reservation.
export function formatDateTime(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString("fr-FR", { timeZone });
}
