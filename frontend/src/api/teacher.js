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
