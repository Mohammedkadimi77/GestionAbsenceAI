import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { fetchMyAbsences, submitJustificationForm, fetchMessages } from "../../api/student";
import StudentScan from "./StudentScan";
import Chatbot from "./Chatbot";

const STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  RETARD: "retard",
};

// Simple helpers
const safe = (v, fallback = "—") => (v === null || v === undefined || v === "" ? fallback : v);

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [target, setTarget] = useState(null);
  const [raison, setRaison] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [jErr, setJErr] = useState("");
  const [jOk, setJOk] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await fetchMyAbsences();
      setAbsences(Array.isArray(data) ? data : []);
      
      const msgData = await fetchMessages();
      setMessages(Array.isArray(msgData) ? msgData : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Impossible de charger vos données.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const absent = absences.filter((a) => a.statut === STATUS.ABSENT).length;
    const retard = absences.filter((a) => a.statut === STATUS.RETARD).length;
    const present = absences.filter((a) => a.statut === STATUS.PRESENT).length;
    return { total: absences.length, present, absent, retard };
  }, [absences]);

  function openJustif(absence) {
    setTarget(absence);
    setRaison("");
    setFile(null);
    setJErr("");
    setJOk("");
    setOpen(true);
  }

  function closeJustif() {
    if (sending) return;
    setOpen(false);
    setTarget(null);
  }

  async function onSubmitJustif(e) {
    e.preventDefault();
    if (!target) return;
    setSending(true);
    setJErr("");
    setJOk("");
    try {
      const absenceId = target.id || target._id || target.absenceId;
      await submitJustificationForm({ absenceId, raison, file });
      setJOk("Justification envoyée avec succès ✅");
      await load();
      setTimeout(() => closeJustif(), 1000);
    } catch (e2) {
      setJErr(e2?.response?.data?.detail || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Tableau de bord <span className="text-blue-600">Étudiant</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Gérez vos présences et vos justifications simplement.</p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm gap-2"
          >
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>


          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm gap-2 active:scale-95"
              title="Messages de l'administration"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce-slow">
                  {messages.length}
                </span>
              )}
              Notifications
            </button>

            <button
              onClick={() => setScanning(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 gap-2 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              Scanner Présence
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SimpleKPI label="Total Séances" value={stats.total} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} color="text-slate-600 bg-slate-100" />
          <SimpleKPI label="Présences" value={stats.present} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-emerald-600 bg-emerald-50" />
          <SimpleKPI label="Absences" value={stats.absent} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-rose-600 bg-rose-50" />
          <SimpleKPI label="Retards" value={stats.retard} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-amber-600 bg-amber-50" />
        </div>

        {err && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {err}
          </div>
        )}


        {/* Main Content Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Historique des séances</h2>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm font-medium">Chargement des absences...</p>
            </div>
          ) : absences.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-400 font-medium">Aucune donnée disponible.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Séance</th>
                    <th className="px-6 py-4">Module</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">Justification</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {absences
                    .filter(a => a.statut !== STATUS.PRESENT)
                    .map((a, idx) => {
                      const key = a.id || a._id || idx;
                      const date = a.dateSeance || a.seanceDate || a.date || "—";
                      const module = a.moduleTitre || a.module || "Module Inconnu";
                      const jStatut = a.justificationStatut || a.justification?.statut || null;
                      const fileUrl = a.justification?.fileUrl || a.justification?.url || null;

                      return (
                        <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <span className="text-slate-800 font-semibold text-sm">{safe(date)}</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-slate-700 font-medium text-sm">{safe(module)}</span>
                          </td>
                          <td className="px-6 py-5">
                            <StatusBadge s={a.statut} />
                          </td>
                          <td className="px-6 py-5">
                            {jStatut ? (
                              <div className="flex flex-col gap-1.5">
                                <JustificationBadge s={jStatut} />
                                {fileUrl && (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-tight transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Document
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button
                              onClick={() => openJustif(a)}
                              disabled={!!jStatut}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${jStatut
                                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                                }`}
                            >
                              {jStatut ? "Justifié" : "Justifier"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Simplified Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Justification</h3>
              <button onClick={closeJustif} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={onSubmitJustif} className="p-6 space-y-5">
              {jErr && <div className="text-xs text-rose-500 font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">{jErr}</div>}
              {jOk && <div className="text-xs text-emerald-500 font-bold bg-emerald-50 p-3 rounded-lg border border-emerald-100">{jOk}</div>}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Détails de l'absence</p>
                <p className="text-slate-800 font-bold text-sm">{safe(target?.moduleTitre || target?.module)}</p>
                <p className="text-slate-500 text-xs font-medium mt-0.5">{safe(target?.dateSeance || target?.date)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Raison</label>
                <textarea
                  required
                  value={raison}
                  onChange={(e) => setRaison(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none shadow-sm"
                  placeholder="Pourquoi étiez-vous absent/en retard ?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Document (PDF, JPG, PNG)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,image/*"
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeJustif}
                  disabled={sending}
                  className="flex-1 px-4 py-3 bg-slate-50 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all active:scale-95"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-[1.5] px-4 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                >
                  {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )
      }

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Messages <span className="text-blue-600">Admin</span></h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 opacity-60">Communications de l'établissement</p>
              </div>
              <button 
                onClick={() => setShowNotifications(false)}
                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:shadow-lg transition-all active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.length === 0 ? (
                <div className="py-20 text-center">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                      <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 5-8-5" /></svg>
                   </div>
                   <p className="text-slate-400 font-bold">Aucun message pour le moment</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="group relative bg-slate-50 border border-slate-100 rounded-3xl p-6 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-lg">Admin</span>
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 text-sm font-semibold leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm shadow-blue-200"></div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fin des notifications</p>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {
        scanning && (
          <StudentScan
            onClose={() => setScanning(false)}
            onScanSuccess={(res) => {
              setScanning(false);
              alert(res?.message || "Présence validée !");
              load();
            }}
          />
        )
      }
      <Chatbot />
    </AppLayout >
  );
}

/* --- Styled Components --- */

function SimpleKPI({ label, value, icon, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 transition-colors flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ s }) {
  const styles = {
    [STATUS.ABSENT]: "bg-rose-50 text-rose-600 border-rose-100",
    [STATUS.RETARD]: "bg-amber-50 text-amber-600 border-amber-100",
    [STATUS.PRESENT]: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };
  const labels = {
    [STATUS.ABSENT]: "Absent",
    [STATUS.RETARD]: "En Retard",
    [STATUS.PRESENT]: "Présent",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 border rounded-lg text-xs font-bold ${styles[s] || "bg-slate-50 text-slate-400 border-slate-100"}`}>
      {labels[s] || s}
    </span>
  );
}

function JustificationBadge({ s }) {
  const styles = {
    en_attente: "text-blue-600 bg-blue-50 border-blue-100",
    validee: "text-emerald-600 bg-emerald-50 border-emerald-100",
    refusee: "text-rose-600 bg-rose-50 border-rose-100",
  };
  const labels = {
    en_attente: "En attente",
    validee: "Validée",
    refusee: "Refusée",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-tight ${styles[s] || "bg-slate-50 text-slate-400 border-slate-100"}`}>
      {labels[s] || s}
    </span>
  );
}
