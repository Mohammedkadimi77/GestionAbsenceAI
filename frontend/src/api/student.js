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
