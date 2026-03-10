import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-lg">G</div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">Gestion<span className="text-indigo-600">Absence</span></span>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                        <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">Comment ça marche</a>
                        <a href="#security" className="hover:text-indigo-600 transition-colors">Sécurité</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate("/login")}
                            className="text-slate-600 hover:text-indigo-600 font-semibold text-sm transition-colors"
                        >
                            Se Connecter
                        </button>
                        <button 
                            onClick={() => navigate("/login")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                            Démarrer
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-32 px-6 overflow-hidden bg-slate-50">
                {/* Mesh Gradient Background Effect */}
                <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8">
                        GestionAbsence
                    </h1>
                    <p className="text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12 font-medium">
                        Une plateforme moderne de gestion d'absences qui détecte les anomalies et simplifie le suivi administratif pour les institutions et entreprises.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => navigate("/login")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-indigo-600/30"
                        >
                            Se Connecter
                        </button>
                        <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-md">
                            En savoir plus
                        </button>
                    </div>
                </div>
            </section>

            {/* Section Features */}
            <section id="features" className="py-32 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 text-center mb-20 leading-tight">
                        Pourquoi choisir notre solution ?
                    </h2>
                    
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { 
                                title: "Gestion Simplifiée", 
                                desc: "Déposez vos justificatifs en un clic et suivez vos statistiques de présence en temps réel.",
                                icon: (
                                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                                    </svg>
                                )
                            },
                            { 
                                title: "Détection d'Anomalies", 
                                desc: "Notre algorithme identifie automatiquement les comportements atypiques (absences répétées, fraudes) pour vous alerter.",
                                icon: (
                                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                                    </svg>
                                )
                            },
                            { 
                                title: "Transparence Totale", 
                                desc: "Une communication fluide entre les administrateurs et les utilisateurs grâce aux notifications instantanées.",
                                icon: (
                                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                                    </svg>
                                )
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-xl group">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comment ça marche ? */}
            <section id="how-it-works" className="py-32 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 text-center mb-24">
                        Comment ça marche ?
                    </h2>
                    
                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Horizontal on Desktop) */}
                        <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0"></div>

                        {[
                            { step: "01", title: "Connexion sécurisée", desc: "Accédez à votre espace via vos identifiants sécurisés." },
                            { step: "02", title: "Suivi automatique", desc: "Enregistrement en temps réel des présences et absences." },
                            { step: "03", title: "Analyse par l'IA", desc: "Génération d'alertes immédiates en cas d'irrégularité détectée." },
                            { step: "04", title: "Reporting complet", desc: "Exportez vos rapports et analysez les données globales." }
                        ].map((item, i) => (
                            <div key={i} className="relative z-10 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-lg transition-all">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-6 text-lg shadow-lg shadow-indigo-200">
                                    {item.step}
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                                <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section Sécurité */}
            <section id="security" className="py-32 px-6 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
                        {/* Decorative element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-extrabold mb-8 leading-tight">
                                    Confiance et Technologie au service de la sécurité
                                </h2>
                                <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">
                                    Nous plaçons la sécurité de vos données au cœur de notre architecture technique.
                                </p>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-xl mb-2 italic">Analyse Prédictive</h5>
                                        <p className="text-slate-400 font-medium italic">Compréhension des tendances pour aider à la décision.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 15v2m-6 4h12l-1-12c0-5.5-4.5-5.5-5-5.5s-5 0-5 5.5l-1 12z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-xl mb-2 italic">Protection des données</h5>
                                        <p className="text-slate-400 font-medium italic">Chiffrement conforme aux normes RGPD.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-lg">G</div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">Gestion<span className="text-indigo-600">Absence</span></span>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
                            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
                            <a href="#" className="hover:text-indigo-600 transition-colors">Aide</a>
                            <a href="#" className="hover:text-indigo-600 transition-colors">Mentions légales</a>
                        </div>
                    </div>
                    
                    <div className="text-center text-slate-400 text-sm font-medium">
                        <p>© 2026 GestionAbsence. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
