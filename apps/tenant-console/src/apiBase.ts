// Point unique de connaissance de l'URL du backend -- partage entre le vrai
// client API (api.ts) et le backend simule utilise en dev (mocks/handlers.ts)
// pour que les deux ciblent toujours exactement les memes routes.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
