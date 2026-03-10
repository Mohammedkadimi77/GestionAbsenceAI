import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import AdminAlerts from "./AdminAlerts";
import {
  adminStats,
  importExcel,
  listAlerts,
  pendingJustifications,
  decideJustification,
  listJustifications,
  listGroups,
  uploadGroupTimetable,
} from "../../api/admin";

export default function AdminHome() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [groups, setGroups] = useState([]);

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
      const [s, a, p, h, g] = await Promise.all([
        adminStats(),
        listAlerts(),
        pendingJustifications(),
        listJustifications(),
        listGroups(),
      ]);

      setStats(s || null);
      setAlerts(Array.isArray(a) ? a : []);
      setPending(Array.isArray(p) ? p : []);
      setHistory(Array.isArray(h) ? h : []);
      setGroups(Array.isArray(g) ? g : []);
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

  async function onUploadTimetable(groupId, file) {
    if (!file) return;
    setActing((p) => ({ ...p, [groupId]: true }));
    try {
      await uploadGroupTimetable(groupId, file);
      await loadAll();
    } catch (e) {
      alert(e?.response?.data?.detail || "Upload échoué");
    } finally {
      setActing((p) => ({ ...p, [groupId]: false }));
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Tableau de bord <span className="text-blue-600">Administrateur</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Supervision globale et gestion des assiduités.</p>
          </div>
          <button
            onClick={loadAll}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm gap-2"
          >
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>

        {/* Tabs - Simple Pill Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} label="Vue d'ensemble" />
          <TabBtn active={tab === "import"} onClick={() => setTab("import")} label="Import" />
          <TabBtn active={tab === "justifs"} onClick={() => setTab("justifs")} label="Justifications" badge={pendingCount} />
          <TabBtn active={tab === "groups"} onClick={() => setTab("groups")} label="Groupes" />
          <TabBtn active={tab === "alerts"} onClick={() => setTab("alerts")} label="Anomalies" />
          <TabBtn active={tab === "history"} onClick={() => setTab("history")} label="Historique" />
        </div>

        {err && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {err}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">Chargement des données...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SimpleKPI label="Étudiants" value={kpis.totalStudents} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} color="text-blue-600 bg-blue-50" />
                <SimpleKPI label="Enseignants" value={kpis.totalTeachers} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} color="text-blue-600 bg-blue-50" />
                <SimpleKPI label="Absences" value={kpis.totalAbsences} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-amber-600 bg-amber-50" />
                <SimpleKPI label="Alertes" value={kpis.totalAlerts} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} color="text-rose-600 bg-rose-50" />
              </div>
            )}

            {/* IMPORT */}
            {tab === "import" && (
              <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Importation Excel</h2>
                <form onSubmit={onImport} className="space-y-6">
                  <div className="border-2 border-dashed border-slate-100 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-200 transition-all cursor-pointer relative group">
                    <input type="file" accept=".xlsx,.xls" onChange={(e) => setExcel(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <p className="text-sm font-semibold text-slate-600">{excel ? excel.name : "Sélectionner un fichier .xlsx"}</p>
                    <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">Feuilles "students" et "teachers" requises</p>
                  </div>
                  <button type="submit" disabled={!excel || importing} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-100">
                    {importing ? "Importation..." : "Importer les données"}
                  </button>
                  {importMsg && (
                    <div className={`p-3 rounded-lg text-center text-xs font-bold border ${importMsg.includes('réussi') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {importMsg}
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* JUSTIFS */}
            {tab === "justifs" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800">Justifications à valider</h2>
                </div>
                {pending.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-medium">Aucune demande en attente.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                          <th className="px-6 py-4">Étudiant</th>
                          <th className="px-6 py-4">Motif</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pending.map((j) => (
                          <tr key={j.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-5">
                              <span className="text-slate-800 font-semibold text-sm">{j.studentName || "Inconnu"}</span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1">
                                <span className="text-slate-600 text-sm font-medium">{j.raison || "—"}</span>
                                {j.fileUrl && (
                                  <a href={j.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 font-bold hover:underline uppercase tracking-tight">Voir document</a>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => decide(j.id, "validee")} disabled={acting[j.id]} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all uppercase">Accepter</button>
                                <button onClick={() => decide(j.id, "refusee")} disabled={acting[j.id]} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-all uppercase">Refuser</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ALERTS */}
            {tab === "alerts" && (
              // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              //   {alerts.map((a) => (
              //     <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-all">
              //       <div className="flex justify-between items-start mb-4">
              //         <div>
              //           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Étudiant</p>
              //           <h5 className="font-bold text-slate-900">{a.studentName || "Inconnu"}</h5>
              //         </div>
              //         <div className="text-right">
              //           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score IA</p>
              //           <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${a.scoreAnomalie > 60 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>{a.scoreAnomalie}%</span>
              //         </div>
              //       </div>
              //       <div className="pt-4 border-t border-slate-50">
              //         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type d'anomalie</p>
              //         <p className="text-sm font-medium text-slate-700">{a.typeAlerte || "Non spécifiée"}</p>
              //       </div>
              //     </div>
              //   ))}
              //   {alerts.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-medium">Aucune anomalie détectée.</div>}
              // </div>
              <AdminAlerts />
            )}

            {/* HISTORY */}
            {tab === "history" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800">Historique des décisions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">Bénéficiaire</th>
                        <th className="px-6 py-4">Décision</th>
                        <th className="px-6 py-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((j) => (
                        <tr key={j.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-5">
                            <span className="text-slate-800 font-semibold text-sm">{j.studentName || "—"}</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${j.statut === "validee" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                              j.statut === "refusee" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                "bg-slate-50 text-slate-500 border border-slate-100"
                              }`}>
                              {j.statut}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-[10px] font-bold text-slate-400">{j.decisionAt || "—"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* GROUPS */}
            {tab === "groups" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Gestion des Groupes</h2>
                  <p className="text-xs text-slate-500 font-medium italic">Uploadez l'image de l'emploi du temps pour chaque groupe.</p>
                </div>
                {groups.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-medium">Aucun groupe trouvé.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                          <th className="px-6 py-4">Groupe</th>
                          <th className="px-6 py-4">Niveau / Filière</th>
                          <th className="px-6 py-4">Emploi du temps</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groups.map((g) => (
                          <tr key={g.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-5">
                              <span className="text-slate-800 font-bold text-sm">{g.nomGroupe}</span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-slate-500 text-xs font-semibold">{g.niveau} — {g.filiere}</span>
                            </td>
                            <td className="px-6 py-5">
                              {g.timetableUrl ? (
                                <a href={g.timetableUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 group/link">
                                  <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0">
                                    <img src={g.timetableUrl} alt="Emploi du temps" className="w-full h-full object-cover group-hover/link:opacity-75 transition-opacity" />
                                  </div>
                                  <span className="text-blue-500 text-[10px] font-bold hover:underline uppercase tracking-tight">Voir l'image</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 text-[10px] font-semibold italic">Non défini</span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="relative inline-block">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id={`file-${g.id}`}
                                  className="hidden"
                                  onChange={(e) => onUploadTimetable(g.id, e.target.files?.[0])}
                                />
                                <label
                                  htmlFor={`file-${g.id}`}
                                  className={`cursor-pointer inline-flex items-center px-4 py-2 border border-blue-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                    acting[g.id] 
                                    ? "bg-slate-50 text-slate-400 border-slate-200 animate-pulse pointer-events-none" 
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                                  }`}
                                >
                                  {acting[g.id] ? "Upload..." : g.timetableUrl ? "Modifier" : "Uploader"}
                                </label>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout >
  );
}

/* --- Components --- */

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

function TabBtn({ active, onClick, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${active
        ? "bg-white text-blue-600 shadow-sm"
        : "text-slate-500 hover:text-slate-800"
        }`}
    >
      {label}
      {badge > 0 && (
        <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[9px] rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}
