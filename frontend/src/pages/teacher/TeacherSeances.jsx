import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import {
    fetchTeacherSeances,
    createTeacherSeance,
    fetchStudentsByGroup,
    submitAttendance,
} from "../../api/teacher";
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

    const [form, setForm] = useState({
        dateSeance: "",
        heureDebut: "",
        heureFin: "",
        typeSeance: "cours",
        salle: "",
        moduleId: "",
        groupId: "",
    });
    const [creating, setCreating] = useState(false);

    // Attendance modal
    const [openAttend, setOpenAttend] = useState(false);
    const [selectedSeance, setSelectedSeance] = useState(null);
    const [students, setStudents] = useState([]);
    const [attLoading, setAttLoading] = useState(false);
    const [attErr, setAttErr] = useState("");
    const [saving, setSaving] = useState(false);
    const [attMap, setAttMap] = useState({});

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
            setGroups(g);
            setModules(m);
        } finally {
            setRefsLoading(false);
        }
    }

    useEffect(() => {
        loadSeances();
        loadRefs();
    }, []);

    const sortedSeances = useMemo(() => {
        return [...seances].sort((a, b) => new Date(b.dateSeance) - new Date(a.dateSeance));
    }, [seances]);

    async function handleCreate(e) {
        e.preventDefault();
        setCreating(true);
        try {
            await createTeacherSeance(form);
            setForm({
                dateSeance: "",
                heureDebut: "",
                heureFin: "",
                typeSeance: "cours",
                salle: "",
                moduleId: "",
                groupId: "",
            });
            loadSeances();
        } catch (e) {
            alert(e?.response?.data?.detail || "Erreur création");
        } finally {
            setCreating(false);
        }
    }

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Gestion des <span className="text-indigo-600">Séances</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Planifiez vos cours et validez les présences</p>
                </div>
                <button onClick={loadSeances} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm hover:border-indigo-200 transition-all flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Rafraîchir
                </button>
            </div>

            

                {/* List Column */}
                <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                        <h2 className="text-xl font-black text-slate-800">Historique des séances</h2>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" /></div>
                    ) : sortedSeances.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 font-bold">Aucune séance enregistrée.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                                        <th className="px-8 py-4">Date & Heure</th>
                                        <th className="px-8 py-4">Module</th>
                                        <th className="px-8 py-4">Groupe</th>
                                        <th className="px-8 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sortedSeances.map(s => (
                                        <tr key={s.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900">{s.dateSeance}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 underline decoration-indigo-200">{s.heureDebut} - {s.heureFin}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">{modules.find(m => m.id === s.moduleId)?.titre || "Module"}</span>
                                            </td>
                                            <td className="px-8 py-5 font-bold text-slate-700 text-sm">
                                                {groups.find(g => g.id === s.groupId)?.nomGroupe || "Groupe"}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => openAttendance(s)}
                                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                                                >
                                                    PRÉSENCE
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            {/* </div>  */}

            {/* Attendance Modal */}
            {openAttend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !saving && setOpenAttend(false)} />
                    <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Prendre la présence</h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <StatBadge label="Présents" count={attStats.present} color="bg-emerald-500" />
                                    <StatBadge label="Absents" count={attStats.absent} color="bg-rose-500" />
                                    <StatBadge label="Retards" count={attStats.retard} color="bg-amber-500" />
                                </div>
                            </div>
                            <button onClick={() => setOpenAttend(false)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            {attLoading ? (
                                <div className="text-center py-10"><div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" /></div>
                            ) : (
                                <div className="space-y-3">
                                    {students.map(st => (
                                        <div key={st.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                                            <div>
                                                <p className="font-black text-slate-900">{st.nom} {st.prenom}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{st.CIN}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <AttBtn active={attMap[st.id] === STATUT.PRESENT} color="bg-emerald-500" label="P" onClick={() => setAttMap({ ...attMap, [st.id]: STATUT.PRESENT })} />
                                                <AttBtn active={attMap[st.id] === STATUT.ABSENT} color="bg-rose-500" label="A" onClick={() => setAttMap({ ...attMap, [st.id]: STATUT.ABSENT })} />
                                                <AttBtn active={attMap[st.id] === STATUT.RETARD} color="bg-amber-500" label="R" onClick={() => setAttMap({ ...attMap, [st.id]: STATUT.RETARD })} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-50 flex justify-end gap-4">
                            <button onClick={() => setOpenAttend(false)} className="px-8 py-3 font-black text-slate-400 uppercase tracking-widest text-xs">Annuler</button>
                            <button
                                onClick={submitAtt}
                                disabled={saving}
                                className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all text-sm"
                            >
                                {saving ? "ENVOI..." : "VALIDER LA LISTE"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function StatBadge({ label, count, color }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}: <span className="text-slate-900">{count}</span></span>
        </div>
    );
}

function AttBtn({ active, color, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${active ? `${color} text-white shadow-lg` : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
        >
            {label}
        </button>
    );
}