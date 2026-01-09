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

export default function TeacherHome() {
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Espace <span className="text-indigo-600">Enseignant</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Gérez vos séances et faites l'appel simplement.</p>
                    </div>
                    <button onClick={loadSeances} className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Rafraîchir
                    </button>
                </div>

                {/* Form Column - Nouvelle Séance */}
                <div className="lg:col-span-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-8">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Nouvelle Séance</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <FormItem label="Module">
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    value={form.moduleId}
                                    onChange={e => setForm({ ...form, moduleId: e.target.value })}
                                    required
                                >
                                    <option value="">Choisir un module...</option>
                                    {modules.map(m => <option key={m.id} value={m.id}>{m.titre}</option>)}
                                </select>
                            </FormItem>

                            <FormItem label="Groupe">
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    value={form.groupId}
                                    onChange={e => setForm({ ...form, groupId: e.target.value })}
                                    required
                                >
                                    <option value="">Choisir un groupe...</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.nomGroupe}</option>)}
                                </select>
                            </FormItem>

                            <div className="grid grid-cols-2 gap-4">
                                <FormItem label="Date">
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:bg-white outline-none transition-all"
                                        value={form.dateSeance}
                                        onChange={e => setForm({ ...form, dateSeance: e.target.value })}
                                        required
                                    />
                                </FormItem>
                                <FormItem label="Type">
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:bg-white outline-none transition-all"
                                        value={form.typeSeance}
                                        onChange={e => setForm({ ...form, typeSeance: e.target.value })}
                                    >
                                        <option value="cours">Cours</option>
                                        <option value="td">TD</option>
                                        <option value="tp">TP</option>
                                    </select>
                                </FormItem>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormItem label="Début">
                                    <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:bg-white outline-none" value={form.heureDebut} onChange={e => setForm({ ...form, heureDebut: e.target.value })} required />
                                </FormItem>
                                <FormItem label="Fin">
                                    <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:bg-white outline-none" value={form.heureFin} onChange={e => setForm({ ...form, heureFin: e.target.value })} required />
                                </FormItem>
                            </div>

                            <FormItem label="Salle">
                                <input
                                    type="text"
                                    placeholder="Ex: Salle 10..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    value={form.salle}
                                    onChange={e => setForm({ ...form, salle: e.target.value })}
                                />
                            </FormItem>

                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4"
                            >
                                {creating ? "Création..." : "Ajouter la séance"}
                            </button>
                        </form>
                    </div>
                </div>



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
            </div>
        </AppLayout >
    );
}

/* --- Helpers --- */

function FormItem({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
            {children}
        </div>
    );
}

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
