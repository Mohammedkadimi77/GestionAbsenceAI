import { useEffect, useState } from "react";
import { listAlerts } from "../../api/admin";

const pill = (s) => {
  if (s === "nouvelle") return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "en_cours") return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "traitee") return "bg-green-50 text-green-700 border-green-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

export default function AdminAlerts() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [alerts, setAlerts] = useState([]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await listAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Erreur chargement alertes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-blue-800">Alertes IA</h2>
          <p className="text-slate-600 text-sm mt-1">
            Absences suspectes détectées automatiquement.
          </p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl border border-blue-200 bg-white text-blue-700 font-bold hover:bg-blue-50"
        >
          Rafraîchir
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-red-700 font-semibold">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 text-slate-600">Chargement…</div>
      ) : alerts.length === 0 ? (
        <div className="mt-4 text-slate-600">Aucune alerte.</div>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((a) => (
            <div
              key={a.id || a._id}
              className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-blue-800 font-extrabold">
                    {a.typeAlerte || "Alerte"}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    Score IA :{" "}
                    <span className="font-extrabold text-blue-700">
                      {Number(a.scoreAnomalie ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    Étudiant : <span className="font-semibold">{a.studentName || a.studentId || "—"}</span>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full border text-xs font-extrabold ${pill(a.statut)}`}>
                  {a.statut || "—"}
                </span>
              </div>

              {/* Reasons si ton backend les expose */}
              {Array.isArray(a.reasons) && a.reasons.length > 0 ? (
                <div className="mt-3 text-sm text-slate-700">
                  <div className="font-bold text-slate-700 mb-1">Raisons :</div>
                  <ul className="list-disc ml-5">
                    {a.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
