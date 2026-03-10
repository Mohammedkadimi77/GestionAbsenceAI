import { useEffect, useState } from "react";
import { listAlerts, generateAIAlerts, deleteAlert, sendMessage } from "../../api/admin";

const riskStyles = {
  high: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
    label: "Risque Élevé",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  },
  medium: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    label: "Risque Moyen",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  low: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    label: "Risque Faible",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  }
};

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [err, setErr] = useState("");

  // Custom Confirm Modal State
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  // Contact Modal State
  const [contact, setContact] = useState({ show: false, studentId: null, studentName: "", content: "" });
  const [sending, setSending] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await listAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load alerts", e);
      setErr("Erreur lors du chargement des anomalies.");
    } finally {
      setLoading(false);
    }
  }

  async function onDetect() {
    setDetecting(true);
    setErr("");
    try {
      await generateAIAlerts("30d");
      await load();
    } catch (e) {
      console.error("Detection failed", e);
      setErr(e?.response?.data?.detail || "Échec de la détection IA.");
    } finally {
      setDetecting(false);
    }
  }

  async function confirmDeletion() {
    const alertId = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await deleteAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (e) {
      console.error("Delete failed", e);
      alert("Erreur lors de la suppression.");
    }
  }

  function openConfirm(id) {
    setConfirmDelete({ show: true, id });
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    setSending(true);
    try {
      await sendMessage({ studentId: contact.studentId, content: contact.content });
      setContact({ show: false, studentId: null, studentName: "", content: "" });
      alert("Message envoyé avec succès !");
    } catch (e) {
      console.error("Send message failed", e);
      alert("Erreur lors de l'envoi du message.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Intelligence Artificielle</h3>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Détectez les comportements atypiques et prévenez le décrochage.</p>
        </div>
        <button
          onClick={onDetect}
          disabled={detecting}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            detecting 
            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100/50 active:scale-95 ring-4 ring-blue-50"
          }`}
        >
          {detecting ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
              Analyse en cours...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Lancer la détection
            </>
          )}
        </button>
      </div>

      {err && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {err}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Chargement des anomalies...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-20 bg-white border border-slate-200 border-dashed rounded-3xl text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h4 className="text-slate-800 font-bold mb-1 tracking-tight">Aucune anomalie</h4>
          <p className="text-slate-400 text-sm font-medium">Tout semble en ordre. Lancez une analyse pour vérifier.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alerts.map((a) => {
            const risk = riskStyles[a.riskLevel] || riskStyles.low;
            return (
              <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between group h-full">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-100 shadow-inner">
                        {a.studentName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-none text-[13px]">{a.studentName || "Inconnu"}</h5>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest opacity-60">Étudiant</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${risk.bg} ${risk.text} ${risk.border}`}>
                      {risk.icon}
                      {risk.label}
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 opacity-60 flex items-center gap-2">
                        <span className="w-1 h-3 bg-slate-200 rounded-full"></span>
                        Facteurs de risque
                      </p>
                      <ul className="space-y-2">
                        {(a.reasons || []).map((reason, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-slate-700 leading-snug">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0 shadow-sm shadow-blue-200"></span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {a.metrics && (
                      <div className="grid grid-cols-3 gap-2 pt-5 border-t border-slate-50 mt-2">
                        <div className="text-center group/m">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1 transition-colors group-hover/m:text-blue-500">Absences</p>
                          <p className="text-sm font-black text-slate-800">{Math.round(a.metrics.absent_rate * 100)}%</p>
                        </div>
                        <div className="text-center border-x border-slate-100 group/m">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1 transition-colors group-hover/m:text-blue-500">Retards</p>
                          <p className="text-sm font-black text-slate-800">{Math.round(a.metrics.late_rate * 100)}%</p>
                        </div>
                        <div className="text-center group/m">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1 transition-colors group-hover/m:text-blue-500">Série</p>
                          <p className="text-sm font-black text-slate-800">{a.metrics.max_streak}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button 
                    onClick={() => setContact({ show: true, studentId: a.studentId, studentName: a.studentName || "Inconnu", content: "" })}
                    className="flex-1 py-3 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-100 transition-all uppercase tracking-widest"
                  >
                    Contacter
                  </button>
                  <button 
                    onClick={() => openConfirm(a.id)}
                    className="px-3.5 py-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 border border-transparent transition-all shadow-sm active:scale-95 group/trash"
                    title="Supprimer l'alerte"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover/trash:-rotate-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmDelete.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Êtes-vous sûr de vouloir supprimer cette anomalie ? Cette action est irréversible.
              </p>
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setConfirmDelete({ show: false, id: null })}
                className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDeletion}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {contact.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-bold text-slate-900 leading-tight">Envoyer un message</h3>
                   <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">À: {contact.studentName}</p>
                </div>
                <button 
                  onClick={() => setContact({ show: false, studentId: null, studentName: "", content: "" })}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSendMessage} className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block opacity-60">Votre message</label>
                <textarea 
                  required
                  rows={5}
                  value={contact.content}
                  onChange={(e) => setContact(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Tapez votre message ici..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => setContact({ show: false, studentId: null, studentName: "", content: "" })}
                  className="flex-1 py-4 bg-white border border-slate-200 rounded-xl text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={sending}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
