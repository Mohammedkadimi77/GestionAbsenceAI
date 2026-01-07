import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import {
  adminStats,
  importExcel,
  listAlerts,
  pendingJustifications,
  decideJustification,
  listJustifications,
} from "../../api/admin";

const pillStatus = (s) => {
  if (s === "nouvelle" || s === "en_attente") return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (s === "en_cours") return "bg-amber-50 text-amber-800 border-amber-100";
  if (s === "traitee" || s === "validee") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (s === "refusee") return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-slate-50 text-slate-700 border-slate-100";
};

export default function AdminHome() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);

  // import
  const [excel, setExcel] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  // decide
  const [acting, setActing] = useState({});

  async function loadAll() {
    setErr("");
    setLoading(true);
    try {
      const [s, a, p, h] = await Promise.all([
        adminStats(),
        listAlerts(),
        pendingJustifications(),
        listJustifications(),
      ]);

      setStats(s || null);
      setAlerts(Array.isArray(a) ? a : []);
      setPending(Array.isArray(p) ? p : []);
      setHistory(Array.isArray(h) ? h : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Erreur de chargement admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const pendingCount = pending.length;

  const kpis = useMemo(() => {
    return {
      totalStudents: stats?.totalStudents ?? stats?.students ?? 0,
      totalTeachers: stats?.totalTeachers ?? stats?.teachers ?? 0,
      totalAbsences: stats?.totalAbsences ?? stats?.absences ?? 0,
      totalAlerts: stats?.alerts?.total ?? stats?.totalAlerts ?? alerts.length ?? 0
    };
  }, [stats, alerts.length]);

  async function onImport(e) {
    e.preventDefault();
    if (!excel) return;

    setImporting(true);
    setImportMsg("");
    try {
      await importExcel(excel);
      setImportMsg("Import réussi ✅");
      setExcel(null);
      await loadAll();
    } catch (e2) {
      setImportMsg(e2?.response?.data?.detail || "Import échoué.");
    } finally {
      setImporting(false);
    }
  }

  async function decide(justifId, decision) {
    setActing((p) => ({ ...p, [justifId]: true }));
    try {
      await decideJustification(justifId, { statut: decision });
      await loadAll();
    } catch (e) {
      alert(e?.response?.data?.detail || "Action échouée");
    } finally {
      setActing((p) => ({ ...p, [justifId]: false }));
    }
  }

  return (
    <AppLayout>
      {/* Decorative background elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-100/30 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-blue-100/30 rounded-full blur-[100px] -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Dashboard <span className="text-indigo-600">Admin</span>
          </h1>
          <p className="text-slate-500 font-medium italic">Administration globale et surveillance du système</p>
        </div>
        <button
          onClick={loadAll}
          className="px-6 py-3 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl font-bold shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-2 group"
        >
          <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Actualiser
        </button>
      </div>

      {/* Tabs - Sleek Pill Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-[1.5rem] w-fit backdrop-blur-sm border border-slate-200/50">
        <NavTab active={tab === "overview"} onClick={() => setTab("overview")} label="Vue d'ensemble" />
        <NavTab active={tab === "import"} onClick={() => setTab("import")} label="Import Excel" />
        <NavTab active={tab === "justifs"} onClick={() => setTab("justifs")} label="Justifications" badge={pendingCount} />
        <NavTab active={tab === "alerts"} onClick={() => setTab("alerts")} label="Anomalies" />
        <NavTab active={tab === "history"} onClick={() => setTab("history")} label="Documents" />
      </div>

      {err && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 font-bold animate-in fade-in slide-in-from-top-2">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PremiumKPI
                label="Total Étudiants"
                value={kpis.totalStudents}
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                color="from-blue-600 to-indigo-600 shadow-blue-200"
              />
              <PremiumKPI
                label="Corps Enseignant"
                value={kpis.totalTeachers}
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                color="from-indigo-600 to-violet-600 shadow-indigo-200"
              />
              <PremiumKPI
                label="Cumul Absences"
                value={kpis.totalAbsences}
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                color="from-amber-500 to-orange-600 shadow-amber-200"
              />
              <PremiumKPI
                label="Alertes Système"
                value={kpis.totalAlerts}
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                color="from-rose-500 to-pink-600 shadow-rose-200"
              />
            </div>
          )}

          {/* IMPORT */}
          {tab === "import" && (
            <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl p-10 mt-6">
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-800">Import des données</h2>
                <p className="text-slate-500 font-medium max-w-sm">Mettez à jour la base de données via un fichier Excel.</p>
              </div>

              <form onSubmit={onImport} className="space-y-6">
                <div className="relative group">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcel(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border-3 border-dashed border-slate-100 group-hover:border-blue-300 rounded-[2rem] p-8 text-center bg-slate-50 group-hover:bg-blue-50 transition-all">
                    <p className="text-slate-500 font-bold">{excel ? excel.name : "Cliquez ou glissez votre fichier .xlsx"}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">Format Excel supporté</p>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    type="submit"
                    disabled={!excel || importing}
                    className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {importing ? "IMPORT EN COURS..." : "LANCER L'IMPORTATION"}
                  </button>
                </div>

                {importMsg && (
                  <div className={`p-4 rounded-2xl text-center font-black text-sm border ${importMsg.includes('réussi') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    {importMsg}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* JUSTIFS */}
          {tab === "justifs" && (
            <GlassSection title="Justifications à traiter">
              {pending.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold italic">Aucune justification en attente de décision.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                        <th className="px-8 py-5">Étudiant</th>
                        <th className="px-8 py-5 text-center">Raison invoquée</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pending.map((j, idx) => (
                        <tr key={j.id || idx} className="group hover:bg-indigo-50/30 transition-all">
                          <td className="px-8 py-6">
                            <span className="text-sm font-black text-slate-900 leading-tight">{j.studentName || j.student || "Étudiant Inconnu"}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <span className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-sm">{j.raison || "Non spécifiée"}</span>
                              {j.fileUrl && (
                                <a
                                  href={j.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 underline tracking-widest"
                                >
                                  VOIR LE DOCUMENT
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-end gap-3">
                              <ActionBtn
                                onClick={() => decide(j.id, "validee")}
                                loading={acting[j.id]}
                                label="ACCEPTER"
                                color="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100"
                              />
                              <ActionBtn
                                onClick={() => decide(j.id, "refusee")}
                                loading={acting[j.id]}
                                label="REFUSER"
                                color="bg-rose-500 hover:bg-rose-600 shadow-rose-100"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassSection>
          )}

          {/* ALERTS */}
          {tab === "alerts" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {alerts.map((a, idx) => (
                  <AnomalyCard key={a.id || idx} alert={a} />
                ))}
                {alerts.length === 0 && (
                  <div className="col-span-full py-24 text-center bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-white">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Tout est sous contrôle</h3>
                    <p className="text-slate-400 font-medium">Aucune anomalie détectée pour le moment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORY */}
          {tab === "history" && (
            <GlassSection title="Registre des décisions">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                      <th className="px-8 py-5">Bénéficiaire</th>
                      <th className="px-8 py-5">Motif</th>
                      <th className="px-8 py-5">Décision</th>
                      <th className="px-8 py-5 text-right">Date action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.map((j, idx) => (
                      <tr key={j.id || idx} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-5 font-black text-slate-800 text-sm whitespace-nowrap">{j.studentName || j.student || "—"}</td>
                        <td className="px-8 py-5 text-slate-500 font-medium text-xs line-clamp-1 h-16 flex items-center">{j.raison || "Aucun motif"}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${pillStatus(j.statut)}`}>
                            {j.statut}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 tracking-tighter">
                          {j.decisionAt || "Récemment"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassSection>
          )}
        </div>
      )}
    </AppLayout>
  );
}

/* --- Styled Components --- */

function NavTab({ active, onClick, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active
        ? "bg-white text-indigo-600 shadow-sm"
        : "text-slate-500 hover:text-slate-900 border border-transparent hover:bg-white/50"
        }`}
    >
      {label}
      {badge > 0 && (
        <span className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white text-[9px] rounded-full animate-pulse font-black shadow-lg shadow-indigo-200">
          {badge}
        </span>
      )}
    </button>
  );
}

function PremiumKPI({ label, value, icon, color }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-xl hover:-translate-y-2 transition-all duration-300">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} text-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</div>
      <div className="text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
    </div>
  );
}

function GlassSection({ title, children }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl overflow-hidden mt-6">
      <div className="px-8 py-6 border-b border-white bg-white/30">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, loading, label, color }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-5 py-2.5 ${color} text-white text-[10px] font-black rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50`}
    >
      {loading ? "..." : label}
    </button>
  );
}

function AnomalyCard({ alert }) {
  const score = alert.scoreAnomalie ?? 0;
  const isCritical = score > 60;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Étudiant</span>
          <h5 className="font-bold text-slate-900">{alert.studentName || "Étudiant Inconnu"}</h5>
        </div>
        <div className={`flex flex-col items-end`}>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Score IA</span>
          <div className={`px-3 py-1 rounded-full text-sm font-black ${isCritical ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
            {score}%
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Type d'anomalie</span>
        <p className="text-sm font-medium text-slate-700 leading-snug">
          {alert.typeAlerte || "Anomalie non spécifiée"}
        </p>
      </div>

      {isCritical && (
        <div className="mt-4 flex items-center gap-2 text-rose-500">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Alerte Prioritaire</span>
        </div>
      )}
    </div>
  );
}
