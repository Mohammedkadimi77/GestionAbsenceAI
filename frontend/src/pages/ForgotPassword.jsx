import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../auth/auth";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await forgotPasswordRequest(email);
            setMessage(res.message);
        } catch (err) {
            setError("Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-blue-600 p-8 text-center text-white">
                    <h2 className="text-2xl font-bold">Récupération</h2>
                    <p className="text-blue-100 mt-1">Entrez votre email pour continuer</p>
                </div>

                <form onSubmit={onSubmit} className="p-8 space-y-6">
                    {message && (
                        <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm font-medium border border-green-100">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    {!message && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="votre@email.com"
                            />
                        </div>
                    )}

                    {!message && (
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-70"
                        >
                            {loading ? "Envoi..." : "Envoyer le lien"}
                        </button>
                    )}

                    <div className="text-center pt-4">
                        <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                            Retour à la connexion
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
