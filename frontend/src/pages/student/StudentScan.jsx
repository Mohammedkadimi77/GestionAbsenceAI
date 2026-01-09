import { useState } from "react";
import { Scanner } from '@yudiel/react-qr-scanner';
import { scanQR } from "../../api/student";

export default function StudentScan({ onClose, onScanSuccess }) {
    const [error, setError] = useState("");
    const [scanning, setScanning] = useState(true);

    async function handleScan(result) {
        if (result && result[0] && scanning) {
            setScanning(false);
            try {
                const token = result[0].rawValue;
                const res = await scanQR(token);
                onScanSuccess(res);
            } catch (e) {
                setError(e.response?.data?.detail || "Code QR invalide ou expiré");
                // Allow retry after 3 seconds if error
                setTimeout(() => setScanning(true), 3000);
            }
        }
    }

    function handleError(err) {
        console.error(err);
        setError("Impossible d'accéder à la caméra.");
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm relative animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Scanner le QR Code</h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative aspect-square bg-black overflow-hidden bg-slate-100">
                    <Scanner
                        onScan={handleScan}
                        onError={handleError}
                        components={{
                            audio: false,
                            finder: false,
                        }}
                        styles={{
                            container: { width: '100%', height: '100%' },
                            video: { width: '100%', height: '100%', objectFit: 'cover' }
                        }}
                    />

                    {/* Overlay Frame */}
                    <div className="absolute inset-0 border-[40px] border-slate-900/50 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-48 h-48 border-4 border-indigo-500/50 rounded-2xl relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 -ml-1 -mt-1 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 -mr-1 -mt-1 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 -ml-1 -mb-1 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 -mr-1 -mb-1 rounded-br-lg" />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="absolute bottom-6 left-6 right-6 bg-rose-500 text-white text-xs font-bold p-3 rounded-xl text-center shadow-lg animate-in slide-in-from-bottom-2 z-20">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 text-center">
                    <p className="text-slate-500 text-sm font-medium">Placez le QR Code dans le cadre pour valider votre présence.</p>
                </div>

            </div>
        </div>
    );
}
