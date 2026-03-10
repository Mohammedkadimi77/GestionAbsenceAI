import { http } from "./http";

export async function adminStats() {
  const res = await http.get("/admin/stats");
  return res.data;
}

export async function listAlerts() {
  const res = await http.get("/admin/alerts");
  return res.data;
}

export async function getAlert(alertId) {
  const res = await http.get(`/admin/alerts/${alertId}`);
  return res.data;
}

export async function deleteAlert(alertId) {
  const res = await http.delete(`/admin/alerts/${alertId}`);
  return res.data;
}

export async function pendingJustifications() {
  const res = await http.get("/admin/justifications/pending");
  return res.data;
}

export async function listJustifications() {
  const res = await http.get("/admin/justifications");
  return res.data;
}

// body exemple: { decision: "validee" } ou { decision: "refusee", reason?: "..." }
export async function decideJustification(justifId, body) {
  const res = await http.patch(`/admin/justifications/${justifId}`, body);
  return res.data;
}

// multipart/form-data file Excel
export async function importExcel(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await http.post("/admin/import", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}
export async function generateAIAlerts(period = "30d") {
  const res = await http.post(`/admin/ai/detect?period=${period}`);
  return res.data;
}

export async function listGroups() {
  const res = await http.get("/admin/groups");
  return res.data;
}

export async function uploadGroupTimetable(groupId, file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await http.post(`/admin/groups/${groupId}/timetable`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function sendMessage(payload) {
  const res = await http.post("/admin/messages", payload);
  return res.data;
}
