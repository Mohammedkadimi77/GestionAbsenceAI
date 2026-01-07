import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { fetchMyAbsences, submitJustificationForm } from "../../api/student";

const STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  RETARD: "retard",
};

// Simple helpers
const safe = (v, fallback = "—") => (v === null || v === undefined || v === "" ? fallback : v);

export default function StudentDashboard() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [raison, setRaison] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [jErr, setJErr] = useState("");
  const [jOk, setJOk] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await fetchMyAbsences();
      setAbsences(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Impossible de charger vos absences.");
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
              Tableau de bord <span className="text-indigo-600">Étudiant</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Gérez vos présences et vos justifications simplement.</p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm gap-2"
          >
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
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
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
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
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-tight transition-colors"
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
                                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"
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
                  value={raison}
                  onChange={(e) => setRaison(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none shadow-sm"
                  placeholder="Pourquoi étiez-vous absent/en retard ?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Document (PDF, JPG, PNG)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,image/*"
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-all"
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
                  className="flex-[1.5] px-4 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/* --- Styled Components --- */

function SimpleKPI({ label, value, icon, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-200 transition-colors flex items-center gap-4">
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
    en_attente: "text-indigo-600 bg-indigo-50 border-indigo-100",
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
