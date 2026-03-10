import { http } from "./http";

export async function fetchMyAbsences() {
  const res = await http.get("/student/absences");
  return res.data;
}

// ✅ multipart/form-data
export async function submitJustificationForm({ absenceId, raison, file }) {
  const fd = new FormData();
  fd.append("absenceId", absenceId);
  fd.append("raison", raison);
  if (file) fd.append("file", file);

  const res = await http.post("/student/justifications", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

// ✅ Scanner QR
export async function scanQR(qrToken) {
  const res = await http.post("/student/scan", { qrToken });
  return res.data;
}

// ✅ Chatbot
export async function chatWithBot(message, history = []) {
  const res = await http.post("/chatbot", { message, history });
  return res.data;
}

// ✅ Emploi du temps
export async function fetchTimetable() {
  const res = await http.get("/student/timetable");
  return res.data;
}

export async function fetchMessages() {
  const res = await http.get("/student/messages");
  return res.data;
}
