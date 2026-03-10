import { NavLink, useNavigate } from "react-router-dom";
import { getRole, logout } from "../auth/auth";

const linkClass = ({ isActive }) =>
  `group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
   ${isActive
    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
    : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"}`;

export default function AppLayout({ children }) {
  const nav = useNavigate();
  const role = getRole() || "guest";

  function onLogout() {
    logout();
    nav("/login", { replace: true });
  }

  const roleLabel = {
    admin: "Administrateur",
    teacher: "Enseignant",
    student: "Étudiant",
    guest: "Invité"
  };

  const roleColors = {
    admin: "bg-rose-500",
    teacher: "bg-amber-500",
    student: "bg-blue-500",
    guest: "bg-slate-500"
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans text-slate-900">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 bg-white border-r border-slate-100">
          <div className="p-8 flex-1 flex flex-col">

            {/* Brand Section */}
            <div className="flex items-center gap-3 mb-10">
              <div>
                <h1 className="text-slate-900 font-extrabold text-base tracking-tight leading-tight">Gestion Absence</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${roleColors[role] || "bg-slate-400"}`} />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{roleLabel[role]}</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1.5 flex-1">
              {role === "student" && (
                <>
                  <NavItem to="/student" icon={<HomeIcon />} label="Tableau de bord" />
                  <NavItem to="/student/timetable" icon={<CalendarIcon />} label="Emploi du Temps" />
                </>
              )}

              {role === "teacher" && (
                <>
                  <NavItem to="/teacher" icon={<HomeIcon />} label="Tableau de bord" />
                  <NavItem to="/teacher/seances" icon={<CalendarIcon />} label="Mes Séances" />
                </>
              )}

              {role === "admin" && (
                <>
                  <NavItem to="/admin" icon={<HomeIcon />} label="Tableau de bord" />
                  <NavItem to="/admin/alerts" icon={<BellIcon />} label="Anomalies IA" />
                </>
              )}
            </nav>

            {/* Logout Section */}
            <div className="mt-auto pt-6 border-t border-slate-50">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-100 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all group active:scale-[0.98]"
              >
                <span className="text-slate-400 group-hover:text-rose-500 transition-colors">
                  <LogoutIcon />
                </span>
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-72 min-h-screen">
          <div className="p-4 lg:p-10">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={linkClass} end>
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronIcon />
    </NavLink>
  );
}

/* ================= ICONS ================= */
const HomeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);
const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const BellIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
);
const ShieldIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
);
const UploadIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
);
const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);
const ChevronIcon = () => (
  <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
);
