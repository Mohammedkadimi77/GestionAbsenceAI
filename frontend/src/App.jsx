import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./auth/ProtectedRoute";

import AdminHome from "./pages/admin/AdminHome";
import TeacherHome from "./pages/teacher/TeacherHome";
import StudentHome from "./pages/student/StudentHome";
import TeacherSeances from "./pages/teacher/TeacherSeances";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <TeacherHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/seances"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <TeacherSeances />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentHome />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
