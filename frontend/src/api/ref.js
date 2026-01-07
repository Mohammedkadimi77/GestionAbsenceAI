import { http } from "./http";

export async function fetchTeacherGroups() {
  const res = await http.get("/teacher/groups");
  return res.data; // [{id, nomGroupe, niveau, filiere}]
}

export async function fetchTeacherModules() {
  const res = await http.get("/teacher/modules");
  return res.data; // [{id, codeModule, titre, semestre}]
}
