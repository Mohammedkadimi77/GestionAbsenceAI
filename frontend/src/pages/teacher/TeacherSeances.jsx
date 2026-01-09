import { useState, useEffect, useMemo } from "react";
import AppLayout from "../../layouts/AppLayout";
import {
    fetchTeacherSeances,
    fetchStudentsByGroup,
    submitAttendance,
    generateQR,
} from "../../api/teacher";
import QRCode from "react-qr-code";
import { fetchTeacherGroups, fetchTeacherModules } from "../../api/ref";

const STATUT = {
    PRESENT: "present",
    ABSENT: "absent",
    RETARD: "retard",
};

export default function TeacherSeances() {
    const [seances, setSeances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [groups, setGroups] = useState([]);
    const [modules, setModules] = useState([]);
    const [refsLoading, setRefsLoading] = useState(true);

    const [selectedGroupId, setSelectedGroupId] = useState(null);

    // Attendance modal
    const [openAttend, setOpenAttend] = useState(false);
    const [selectedSeance, setSelectedSeance] = useState(null);
    const [students, setStudents] = useState([]);
    const [attLoading, setAttLoading] = useState(false);
    const [attErr, setAttErr] = useState("");
    const [saving, setSaving] = useState(false);
    const [attMap, setAttMap] = useState({});

    // QR Modal
    const [openQR, setOpenQR] = useState(false);
    const [qrToken, setQrToken] = useState(null);
    const [qrExpiry, setQrExpiry] = useState(null);

    async function loadSeances() {
        setLoading(true);
        try {
            const data = await fetchTeacherSeances();
            setSeances(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr(e?.response?.data?.detail || "Erreur chargement séances");
        } finally {
            setLoading(false);
        }
    }

    async function loadRefs() {
        setRefsLoading(true);
        try {
            const [g, m] = await Promise.all([fetchTeacherGroups(), fetchTeacherModules()]);
            setGroups(Array.isArray(g) ? g : []);
            setModules(Array.isArray(m) ? m : []);
        } finally {
            setRefsLoading(false);
        }
    }

    useEffect(() => {
        loadSeances();
        loadRefs();
    }, []);

    const filteredSeances = useMemo(() => {
        let list = [...seances];
        if (selectedGroupId) {
            list = list.filter(s => {
                const gid = s.groupId?.id || s.groupId?._id || s.groupId;
                return gid === selectedGroupId;
            });
        }
        return list.sort((a, b) => new Date(b.dateSeance) - new Date(a.dateSeance));
    }, [seances, selectedGroupId]);

    const activeGroupName = useMemo(() => {
        if (!selectedGroupId) return null;
        const g = groups.find(g => (g.id || g._id) === selectedGroupId);
        return g?.nomGroupe || "Groupe";
    }, [selectedGroupId, groups]);

    async function openAttendance(s) {
        setSelectedSeance(s);
        setOpenAttend(true);
        setAttLoading(true);
        try {
            const gId = s.groupId?.id || s.groupId?._id || s.groupId;
            const list = await fetchStudentsByGroup(gId);
            setStudents(list);
            const init = {};
            list.forEach(st => init[st.id || st._id] = STATUT.PRESENT);
            setAttMap(init);
        } catch (e) {
            setAttErr("Erreur chargement étudiants");
        } finally {
            setAttLoading(false);
        }
    }

    async function submitAtt() {
        setSaving(true);
        try {
            const items = Object.entries(attMap).map(([studentId, statut]) => ({ studentId, statut }));
            await submitAttendance(selectedSeance.id || selectedSeance._id, { items });
            setOpenAttend(false);
        } catch (e) {
            setAttErr("Erreur validation");
        } finally {
            setSaving(false);
        }
    }

    async function handleGenerateQR(seance) {
        setSelectedSeance(seance);
        try {
            const res = await generateQR(seance.id || seance._id);
            setQrToken(res.qrToken);
            setQrExpiry(new Date(res.expiresAt));
            setOpenQR(true);
        } catch (e) {
            alert("Erreur génération QR");
        }
    }

    const attStats = useMemo(() => {
        const vals = Object.values(attMap);
        return {
            present: vals.filter(v => v === STATUT.PRESENT).length,
            absent: vals.filter(v => v === STATUT.ABSENT).length,
            retard: vals.filter(v => v === STATUT.RETARD).length,
        };
    }, [attMap]);

    return (
        <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        {selectedGroupId && (
                            <button
                                onClick={() => setSelectedGroupId(null)}
                                className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {selectedGroupId ? `Séances : ${activeGroupName}` : "Mes Groupes"}
                        </h1>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        {selectedGroupId ? "Consultez l'historique et gérez les présences de ce groupe." : "Sélectionnez un groupe pour voir ses séances."}
                    </p>
                </div>
                <button onClick={loadSeances} className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Rafraîchir
                </button>
            </div>

            {loading || refsLoading ? (
                <div className="py-20 flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 text-sm font-medium">Chargement...</p>
                </div>
            ) : !selectedGroupId ? (
                /* GROUPS GRID */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groups.map(g => (
                        <button
                            key={g.id || g._id}
                            onClick={() => setSelectedGroupId(g.id || g._id)}
                            className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex flex-col gap-4"
                        >
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{g.nomGroupe}</h3>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mt-1">Cliquez pour voir les séances</p>
                            </div>
                        </button>
                    ))}
                    {groups.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-medium">Aucun groupe trouvé.</div>}
                </div>
            ) : (
                /* SEANCES LIST FOR SELECTED GROUP */
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Historique des séances</h2>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">{filteredSeances.length} séance(s)</span>
                    </div>

                    {filteredSeances.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-slate-400 font-medium">Aucune séance enregistrée pour ce groupe.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                                        <th className="px-6 py-4">Date & Heure</th>
                                        <th className="px-6 py-4">Module</th>
                                        <th className="px-6 py-4">Salle</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSeances.map(s => (
                                        <tr key={s.id || s._id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-800">{s.dateSeance}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{s.heureDebut} - {s.heureFin}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">
                                                    {modules.find(m => (m.id || m._id) === s.moduleId)?.titre || "Module"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-medium text-slate-500">{s.salle || "-"}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => openAttendance(s)}
                                                    className="px-3 py-2 bg-white border border-slate-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 mr-2"
                                                >
                                                    Appel
                                                </button>
                                                <button
                                                    onClick={() => handleGenerateQR(s)}
                                                    className="px-3 py-2 bg-slate-900 border border-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                                                >
                                                    QR Code
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Attendance Modal */}
            {openAttend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Prendre la présence</h3>
                                <div className="flex items-center gap-6 mt-3">
                                    <StatBadge label="Présents" count={attStats.present} color="bg-emerald-500" />
                                    <StatBadge label="Absents" count={attStats.absent} color="bg-rose-500" />
                                    <StatBadge label="Retards" count={attStats.retard} color="bg-amber-500" />
                                </div>
                            </div>
                            <button onClick={() => setOpenAttend(false)} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            {attLoading ? (
                                <div className="text-center py-10">
                                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-slate-400 text-sm font-medium">Chargement des étudiants...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {students.map(st => (
                                        <div key={st.id || st._id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-colors shadow-sm">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{st.nom} {st.prenom}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{st.CIN || st.cin || '-'}</p>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <AttBtn
                                                    active={attMap[st.id || st._id] === STATUT.PRESENT}
                                                    color="bg-emerald-500"
                                                    label="P"
                                                    onClick={() => setAttMap({ ...attMap, [st.id || st._id]: STATUT.PRESENT })}
                                                />
                                                <AttBtn
                                                    active={attMap[st.id || st._id] === STATUT.ABSENT}
                                                    color="bg-rose-500"
                                                    label="A"
                                                    onClick={() => setAttMap({ ...attMap, [st.id || st._id]: STATUT.ABSENT })}
                                                />
                                                <AttBtn
                                                    active={attMap[st.id || st._id] === STATUT.RETARD}
                                                    color="bg-amber-500"
                                                    label="R"
                                                    onClick={() => setAttMap({ ...attMap, [st.id || st._id]: STATUT.RETARD })}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                            <button onClick={() => setOpenAttend(false)} className="px-6 py-3 font-bold text-slate-500 text-xs uppercase tracking-widest hover:text-slate-700 transition-colors">Annuler</button>
                            <button
                                onClick={submitAtt}
                                disabled={saving}
                                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-widest"
                            >
                                {saving ? "Envoi..." : "Valider l'appel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Modal */}
            {openQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setOpenQR(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h3 className="text-2xl font-black text-slate-900 mb-2">Code QR</h3>
                        <p className="text-slate-500 text-sm font-medium mb-6">Valable 10 minutes pour cette séance.</p>

                        <div className="bg-white p-4 rounded-xl border-2 border-slate-100 inline-block mb-6 shadow-sm">
                            {qrToken ? (
                                <QRCode value={qrToken} size={200} />
                            ) : (
                                <div className="w-[200px] h-[200px] bg-slate-100 animate-pulse rounded-lg" />
                            )}
                        </div>

                        {qrExpiry && (
                            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full inline-block">
                                Expire à {qrExpiry.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
        </AppLayout >
    );
}

/* --- Helpers --- */

function StatBadge({ label, count, color }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}: <span className="text-slate-900">{count}</span></span>
        </div>
    );
}

function AttBtn({ active, color, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${active
                ? `${color} text-white shadow-md active:scale-95`
                : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-indigo-50 hover:text-indigo-500'}`}
        >
            {label}
        </button>
    );
}