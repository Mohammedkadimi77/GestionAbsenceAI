import { http } from "./http";

// ✅ à créer côté backend si pas encore dispo : GET /seances/{seanceId}
export async function getSeanceById(seanceId) {
  const res = await http.get(`/seances/${seanceId}`);
  return res.data;
}
