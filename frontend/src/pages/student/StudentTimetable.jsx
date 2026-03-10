import { useEffect, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { fetchTimetable } from "../../api/student";

export default function StudentTimetable() {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchTimetable();
      // data est maintenant { groupsTimetableUrl: ..., sessions: [...] }
      if (data && typeof data === "object") {
        setImageUrl(data.groupsTimetableUrl || null);
      } else {
        setImageUrl(null);
      }
    } catch {
      setErr("Impossible de charger l'emploi du temps.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Mon <span className="text-blue-600">Emploi du Temps</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Consultez vos séances de cours prévues.</p>
        </div>

        {err && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {err}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">Chargement...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {!imageUrl ? (
              <div className="py-12 px-6 text-center bg-white border border-slate-200 rounded-3xl shadow-sm border-dashed flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Emploi du temps non disponible</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  L'administration n'a pas encore partagé l'image officielle de l'emploi du temps pour votre groupe. 
                  Veuillez revenir plus tard.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Officielle</span>
                  </div>
                  <a href={imageUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold text-[10px] uppercase hover:underline flex items-center gap-1">
                    <span>Ouvrir en plein écran</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
                <div className="p-2 bg-slate-50/30">
                  <img 
                    src={imageUrl} 
                    alt="Emploi du temps" 
                    className="w-full h-auto rounded-2xl shadow-inner border border-slate-100" 
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
