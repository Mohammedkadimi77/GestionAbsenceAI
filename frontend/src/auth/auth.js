import { http } from "../api/http";

export async function loginRequest(email, password) {
  const res = await http.post("/auth/login", { email, password });
  const { access_token, refresh_token, role, user_id } = res.data;

  localStorage.setItem("access_token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
  localStorage.setItem("role", role);
  localStorage.setItem("user_id", user_id);

  return { role, user_id };
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("role");
  localStorage.removeItem("user_id");
}

export function isLoggedIn() {
  return !!localStorage.getItem("access_token");
}

export function getRole() {
  return localStorage.getItem("role");
}

export function getUserId() {
  return localStorage.getItem("user_id");
}


export async function forgotPasswordRequest(email) {
  const res = await http.post("/auth/forgot-password", { email });
  return res.data;
}

export async function resetPasswordRequest(token, new_password) {
  const res = await http.post("/auth/reset-password", { token, new_password });
  return res.data;
}
