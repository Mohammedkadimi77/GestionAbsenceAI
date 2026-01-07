import { NavLink, useNavigate } from "react-router-dom";
import { getRole, logout } from "../auth/auth";

const linkClass = ({ isActive }) =>
  `group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300
   ${isActive
    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]"
    : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-[1.02]"}`;

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
    student: "bg-indigo-500",
    guest: "bg-slate-500"
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-50/50 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl p-4 lg:p-8">
        <div className="grid grid-cols-12 gap-6 lg:gap-8">

          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-6 sticky top-8 flex flex-col min-h-[calc(100vh-4rem)]">

              {/* Brand Section */}
              <div className="flex items-center gap-4 mb-10 px-2 transition-transform hover:scale-105 duration-300 cursor-default">
                <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black grid place-items-center text-xl shadow-lg shadow-indigo-200 rotate-3 group-hover:rotate-0 transition-transform">
                  A
                </div>
                <div>
                  <div className="text-slate-900 font-black text-lg tracking-tight leading-tight">Absence<span className="text-indigo-600">Tracker</span></div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${roleColors[role] || "bg-slate-400"}`} />
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{roleLabel[role]}</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2 flex-1">
                {role === "student" && (
                  <>
                    <NavItem to="/student" icon={<HomeIcon />} label="Tableau de bord" />
                    <NavItem to="/student/absences" icon={<HistoryIcon />} label="Mes Absences" />
                    <NavItem to="/student/justifications" icon={<FileIcon />} label="Justificatifs" />
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
                    <NavItem to="/admin" icon={<HomeIcon />} label="Vue d'ensemble" />
                    <NavItem to="/admin/alerts" icon={<BellIcon />} label="Alertes" />
                    <NavItem to="/admin/justifications" icon={<ShieldIcon />} label="Validations" />
                    <NavItem to="/admin/import" icon={<UploadIcon />} label="Import Données" />
                  </>
                )}
              </nav>

              {/* User Profile & Logout Section */}
              <div className="mt-8 pt-8 border-t border-slate-50 space-y-4 px-2">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-between group/logout p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-rose-50 hover:border-rose-100 transition-all duration-300"
                >
                  <span className="text-slate-600 font-bold text-sm group-hover/logout:text-rose-600 transition-colors flex items-center gap-3">
                    <LogoutIcon />
                    Déconnexion
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover/logout:bg-white group-hover/logout:border-rose-200 group-hover/logout:scale-110 transition-all">
                    <ArrowRightIcon />
                  </div>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="col-span-12 lg:col-span-9 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-white/60 backdrop-blur-md border border-white rounded-[3rem] shadow-xl shadow-slate-200/40 p-6 lg:p-10 min-h-[calc(100vh-4rem)]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={linkClass} end>
      {({ isActive }) => (
        <>
          <span className={`transition-colors duration-300 ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"}`}>
            {icon}
          </span>
          <span className="flex-1">{label}</span>
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse" />
          )}
        </>
      )}
    </NavLink>
  );
}

/* ================= ICON HELPERS ================= */
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4 text-slate-400 group-hover/logout:text-rose-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
  </svg>
);
