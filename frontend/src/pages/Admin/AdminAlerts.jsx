import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { listAlerts, generateAIAlerts } from "../../api/admin";

const pill = (s) => {
    if (s === "nouvelle") return "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (s === "en_cours") return "bg-amber-50 text-amber-700 border-amber-100";
    if (s === "traitee") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    return "bg-slate-50 text-slate-600 border-slate-100";
};

export default function AdminAlerts() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [alerts, setAlerts] = useState([]);
    const [detecting, setDetecting] = useState(false);
    const [msg, setMsg] = useState("");

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const data = await listAlerts();
            setAlerts(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr(e?.response?.data?.detail || "Erreur de chargement");
        } finally {
            setLoading(false);
        }
    }

    async function handleDetect() {
        setDetecting(true);
        setMsg("");
        try {
            const res = await generateAIAlerts("30d");
            setMsg(res.message);
            load();
        } catch (e) {
            setErr("Erreur lors de la détection IA");
        } finally {
            setDetecting(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Back Button */}
            <Link
                to="/admin"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors group"
            >
                <div className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Tableau de bord</span>
            </Link>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                        </span>
                        Intelligence Artificielle
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Anomalies <span className="text-indigo-600">Détectées</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 max-w-md leading-relaxed font-medium">
                        Surveillance automatique des comportements d'assiduité suspects.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={load}
                        className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:bg-slate-50 transition-all active:scale-95 group shadow-sm"
                        title="Rafraîchir"
                    >
                        <svg className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    <button
                        onClick={handleDetect}
                        disabled={detecting}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg
              ${detecting
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-100 ring-4 ring-indigo-50"}`}
                    >
                        {detecting ? (
                            <svg className="w-4 h-4 animate-spin outline-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        )}
                        {detecting ? "Analyse..." : "Lancer Détection"}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {(msg || err) && (
                <div className="animate-in slide-in-from-top-4 duration-500">
                    {msg && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex items-center gap-3 shadow-sm shadow-emerald-50/50">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="font-bold text-sm tracking-tight">{msg}</span>
                        </div>
                    )}
                    {err && (
                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>
                            <span className="font-bold text-sm tracking-tight">{err}</span>
                        </div>
                    )}
                </div>
            )}

            {/* List Content (Bar Style) */}
            <div className="flex flex-col gap-3">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse w-full"></div>
                    ))
                ) : alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Aucune anomalie</h3>
                        <p className="text-slate-400 text-sm mt-1 max-w-xs text-center font-medium">Tout semble en ordre !</p>
                    </div>
                ) : (
                    alerts.map((a, i) => (
                        <div
                            key={a.id || a._id}
                            className="group bg-white rounded-2xl border border-slate-200 p-4 md:px-6 md:py-4 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/30 transition-all duration-300 animate-in fade-in slide-in-from-left-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            style={{ animationDelay: `${i * 30}ms` }}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-100">
                                    {a.studentName?.charAt(0) || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-black text-slate-900 truncate">{a.studentName || "Inconnu"}</span>
                                        <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-tighter ${pill(a.statut)}`}>
                                            {a.statut}
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                        {a.typeAlerte || "Alerte Assiduité"}
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar (Bar aspect) */}
                            <div className="flex-1 max-w-xs hidden sm:block px-4">
                                <div className="flex items-center justify-between mb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Indice de Risque</span>
                                    <span className="text-indigo-600">{(Number(a.scoreAnomalie ?? 0) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min(Number(a.scoreAnomalie ?? 0) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="hidden lg:flex flex-col items-end mr-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score IA</span>
                                    <span className="text-xs font-black text-slate-900">{(Number(a.scoreAnomalie ?? 0) * 100).toFixed(1)}%</span>
                                </div>
                                <button className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 shadow-sm">
                                    Examiner
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
