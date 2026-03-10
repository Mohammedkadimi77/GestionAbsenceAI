import { useState, useRef } from "react";
import { Scanner } from '@yudiel/react-qr-scanner';
import jsQR from "jsqr";
import { scanQR } from "../../api/student";

export default function StudentScan({ onClose, onScanSuccess }) {
    const [error, setError] = useState("");
    const [scanning, setScanning] = useState(true);
    const [decoding, setDecoding] = useState(false);
    const fileInputRef = useRef(null);

    async function processQRCode(token) {
        setScanning(false);
        setDecoding(true);
        try {
            const res = await scanQR(token);
            onScanSuccess(res);
        } catch (e) {
            setError(e.response?.data?.detail || "Code QR invalide ou expiré");
            setTimeout(() => {
                setScanning(true);
                setDecoding(false);
            }, 3000);
        } finally {
            setDecoding(false);
        }
    }

    async function handleScan(result) {
        if (result && result[0] && scanning && !decoding) {
            processQRCode(result[0].rawValue);
        }
    }

    function handleError(err) {
        console.error(err);
        setError("Impossible d'accéder à la caméra.");
    }

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");
        setDecoding(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                if (!context) {
                    setError("Erreur lors du traitement de l'image.");
                    setDecoding(false);
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0, img.width, img.height);
                
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    processQRCode(code.data);
                } else {
                    setError("Aucun code QR détecté dans cette image.");
                    setDecoding(false);
                }
            };
            img.onerror = () => {
                setError("Format d'image non supporté.");
                setDecoding(false);
            };
            img.src = event.target?.result;
        };
        reader.readAsDataURL(file);
    };

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

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />

                {/* Scanner Area */}
                <div className="relative aspect-square bg-black overflow-hidden bg-slate-100">
                    {!decoding && scanning && (
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
                    )}

                    {decoding && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm z-30">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                            <p className="text-blue-600 font-bold text-sm">Analyse de l'image...</p>
                        </div>
                    )}

                    {/* Overlay Frame */}
                    <div className="absolute inset-0 border-[40px] border-slate-900/50 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-48 h-48 border-4 border-blue-500/50 rounded-2xl relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -ml-1 -mt-1 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mr-1 -mt-1 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -ml-1 -mb-1 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mr-1 -mb-1 rounded-br-lg" />
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
                <div className="p-6 text-center space-y-4">
                    <p className="text-slate-500 text-sm font-medium">Placez le QR Code dans le cadre ou uploadez une image.</p>
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center gap-3 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Importer une image QR
                    </button>
                </div>

            </div>
        </div>
    );
}
