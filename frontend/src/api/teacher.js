import { http } from "./http";

// ✅ Séances du prof
export async function fetchTeacherSeances() {
  const res = await http.get("/teacher/seances");
  return res.data; // array
}

// ✅ Créer une séance
export async function createTeacherSeance(payload) {
  const res = await http.post("/teacher/seances", payload);
  return res.data;
}

// ✅ Etudiants d’un groupe (retour: [{id,nom,prenom,email,CIN,statut}, ...])
export async function fetchStudentsByGroup(groupId) {
  const res = await http.get(`/teacher/groups/${groupId}/students`);
  return res.data;
}

// ✅ Soumettre présence (payload exact swagger)
export async function submitAttendance(seanceId, payload) {
  const res = await http.post(`/teacher/seances/${seanceId}/attendance`, payload);
  return res.data;
}

// ✅ Générer QR Token
export async function generateQR(seanceId) {
  const res = await http.post(`/teacher/seances/${seanceId}/qr`);
  return res.data;
}
// ✅ Valider l'appel (Backend: Auto-marquage des absents + close seance)
export async function validateAttendance(seanceId, payload) {
  const res = await http.post(`/teacher/seances/${seanceId}/attendance/validate`, payload);
  return res.data;
}

// ✅ Finaliser la séance (Timeout ou Manuel sans liste)
export async function finalizeSeance(seanceId) {
  const res = await http.post(`/teacher/seances/${seanceId}/finalize`);
  return res.data;
}

// ✅ Récupérer historique des présences d'une séance
export async function fetchSeanceAttendance(seanceId) {
  const res = await http.get(`/teacher/seances/${seanceId}/attendance`);
  return res.data;
}
