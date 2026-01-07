import { Navigate } from "react-router-dom";
import { getRole, isLoggedIn } from "./auth";

export default function ProtectedRoute({ children, roles }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0) {
    const role = getRole();
    if (!roles.includes(role)) {
      if (role === "admin") return <Navigate to="/admin" replace />;
      if (role === "teacher") return <Navigate to="/teacher" replace />;
      return <Navigate to="/student" replace />;
    }
  }
  return children;
}
