import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { fetchMyAbsences, submitJustificationForm } from "../../api/student";

const STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  RETARD: "retard",
};

const statusLabel = (s) => {
  if (s === STATUS.PRESENT) return "Présent";
  if (s === STATUS.ABSENT) return "Absent";
  if (s === STATUS.RETARD) return "Retard";
  return s || "-";
};

// helpers d’affichage
const safe = (v, fallback = "—") => (v === null || v === undefined || v === "" ? fallback : v);

export default function StudentDashboard() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // modal justification
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

      setJOk("Justification envoyée ✅");
      await load();
      setTimeout(() => closeJustif(), 600);
    } catch (e2) {
      setJErr(e2?.response?.data?.detail || "Envoi échoué.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppLayout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">
            Mon <span className="text-indigo-600">Dashboard</span>
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Suivi en temps réel de vos absences
          </p>
        </div>

        <button
          onClick={load}
          className="group relative px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-indigo-500 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Rafraîchir
        </button>
      </div>

      {/* KPI Section with modern gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <KPI
          label="Total"
          value={stats.total}
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"
          gradient="from-slate-800 to-slate-900"
          accent="bg-slate-700"
        />
        <KPI
          label="Présences"
          value={stats.present}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          gradient="from-indigo-600 to-indigo-700"
          accent="bg-white/20"
        />
        <KPI
          label="Absences"
          value={stats.absent}
          icon="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          gradient="from-rose-500 to-rose-600"
          accent="bg-white/20"
        />
        <KPI
          label="Retards"
          value={stats.retard}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          gradient="from-amber-500 to-amber-600"
          accent="bg-white/20"
        />
      </div>

      {err ? (
        <div className="mb-6 rounded-2xl border-l-4 border-rose-500 bg-rose-50 p-4 text-rose-800 font-semibold flex items-center gap-3">
          <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {err}
        </div>
      ) : null}

      {/* Main Content Table Area */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Historique des Absences
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Gérez vos justificatifs et suivez le statut de vos absences
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4" />
            <p className="text-slate-500 font-bold">Récupération des données...</p>
          </div>
        ) : absences.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-extrabold text-lg">Tout est à jour !</h3>
            <p className="text-slate-500">Vous n'avez aucune absence enregistrée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold text-xs uppercase tracking-widest border-b border-slate-100/50">
                  <th className="px-8 py-5">Séance</th>
                  <th className="px-8 py-5">Module</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5">Justification</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {absences
                  .filter((a) => a.statut !== STATUS.PRESENT)
                  .map((a, idx) => {
                    const key = a.id || a._id || idx;
                    const date = a.dateSeance || a.seanceDate || a.date || "—";
                    const heure = a.heureDebut && a.heureFin ? `${a.heureDebut} - ${a.heureFin}` : a.heure || "—";
                    const module = a.moduleTitre || a.module || a.codeModule || "—";
                    const statut = a.statut;
                    const jStatut = a.justificationStatut || a.justification?.statut || null;
                    const fileUrl = a.justification?.fileUrl || a.justification?.url || null;

                    return (
                      <tr key={key} className="group hover:bg-slate-50/80 transition-all duration-300">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-bold text-base">{safe(date)}</span>
                            <span className="text-slate-400 text-xs font-semibold">{safe(heure)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm shadow-indigo-100">
                              {module.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-slate-700 font-bold">{safe(module)}</span>
                          </div>
                        </td>

                        <td className="px-8 py-5">
                          <StatusBadge s={statut} />
                        </td>

                        <td className="px-8 py-5">
                          {jStatut ? (
                            <div className="flex flex-col gap-1.5">
                              <JustificationBadge s={jStatut} />
                              {fileUrl && (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-indigo-600 font-black hover:underline tracking-tighter uppercase inline-flex items-center gap-1"
                                >
                                  VOIR DOCUMENT
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-tight">Non Fourni</span>
                          )}
                        </td>

                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => openJustif(a)}
                            disabled={!!jStatut}
                            className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all duration-300 transform border shadow-sm ${jStatut
                              ? "opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                              : "bg-white text-indigo-600 border-slate-200 hover:border-indigo-500 hover:scale-105 hover:shadow-lg hover:shadow-indigo-200 active:scale-95"
                              }`}
                          >
                            JUSTIFIER
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

      {/* Modern Glass Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop avec flou progressif */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closeJustif}
          />

          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/50 overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 pb-0 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Justification</h3>
                <p className="text-slate-500 font-medium text-sm mt-1">Fournir un justificatif légal</p>
              </div>
              <button
                onClick={closeJustif}
                className="p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={onSubmitJustif} className="p-8 space-y-6">
              {jErr && <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-sm font-bold rounded-r-xl">{jErr}</div>}
              {jOk && <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-sm font-bold rounded-r-xl">{jOk}</div>}

              {/* Box info rappel */}
              <div className="bg-indigo-50/50 rounded-3xl p-5 border border-indigo-100/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Absence du {safe(target?.dateSeance || target?.date)}</p>
                  <p className="text-slate-700 font-bold leading-tight mt-1">{safe(target?.moduleTitre || target?.module || target?.codeModule)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Raison détaillé</label>
                <textarea
                  value={raison}
                  onChange={(e) => setRaison(e.target.value)}
                  required
                  rows={3}
                  placeholder="Expliquez brièvement le motif..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Pièce Jointe (PDF, Image)</label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".pdf,image/*"
                  />
                  <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] p-6 text-center group-hover:bg-indigo-50 group-hover:border-indigo-300 transition-all">
                    <svg className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 mx-auto mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-slate-500 font-bold text-sm">
                      {file ? <span className="text-indigo-600 font-black underline">{file.name}</span> : "Glisser un fichier ou cliquer ici"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeJustif}
                  disabled={sending}
                  className="flex-1 px-6 py-4 rounded-[1.5rem] bg-slate-100 text-slate-700 font-black text-sm hover:bg-slate-200 transition-all border-b-4 border-slate-300 active:border-b-0 active:translate-y-1"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-[2] px-6 py-4 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all border-b-4 border-indigo-900 shadow-lg shadow-indigo-200 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "TRANSMETTRE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function KPI({ label, value, icon, gradient, accent }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-6 rounded-[2.5rem] shadow-2xl transition-transform hover:scale-[1.03] duration-500 group`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${accent} opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-700`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl ${accent} flex items-center justify-center`}>
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon} />
            </svg>
          </div>
          <span className="text-4xl font-black text-white">{String(value)}</span>
        </div>
        <div className="text-xs font-black text-white/70 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ s }) {
  if (s === STATUS.ABSENT) return (
    <span className="px-4 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 text-xs font-black rounded-full uppercase tracking-tighter flex items-center gap-2 w-max">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Absent
    </span>
  );
  if (s === STATUS.RETARD) return (
    <span className="px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 text-xs font-black rounded-full uppercase tracking-tighter flex items-center gap-2 w-max">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Retard
    </span>
  );
  return (
    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-black rounded-full uppercase tracking-tighter flex items-center gap-2 w-max">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Présent
    </span>
  );
}

function JustificationBadge({ s }) {
  if (s === "en_attente") return (
    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black rounded-lg uppercase whitespace-nowrap">⏳ En attente</span>
  );
  if (s === "validee") return (
    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black rounded-lg uppercase whitespace-nowrap">✅ Validée</span>
  );
  if (s === "refusee") return (
    <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-black rounded-lg uppercase whitespace-nowrap">❌ Refusée</span>
  );
  return <span className="text-slate-400">—</span>;
}
