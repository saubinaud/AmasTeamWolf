import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTextoContrato } from '../hooks/useTextoContrato';
import type { Terminos } from '../hooks/useTextoContrato';
import { BloquesLegales } from './legal/BloquesLegales';
// Respaldo estático (SEO y sin conexión). Se regenera desde amas-api:
//   node scripts/exportar-terminos.js ../amas-web/src/data/terminos.json
import respaldo from '../data/terminos.json';

// El texto vive en amas-api/src/services/contratoTexto.js: es la misma fuente
// que el contrato que firman las familias. Aquí no se escribe ninguna sección.

interface TerminosCondicionesPageProps {
    onNavigate: (page: string) => void;
}

export function TerminosCondicionesPage({ onNavigate }: TerminosCondicionesPageProps) {
    const { texto } = useTextoContrato();
    const t: Terminos = texto?.terminos ?? (respaldo.terminos as Terminos);

    useEffect(() => {
        const id = window.location.hash.slice(1);
        const destino = id ? document.getElementById(id) : null;
        if (destino) destino.scrollIntoView();
        else window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 py-12 px-4 sm:px-6 md:px-8 lg:px-8 animate-fadeIn">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-[#FA7B21]/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#FCA929]/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-4xl mx-auto">
                {/* Back button */}
                <button
                    onClick={() => onNavigate('home')}
                    className="flex items-center text-white/60 hover:text-[#FCA929] transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al Inicio
                </button>

                {/* Content Card */}
                <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-8 sm:p-10 md:p-12 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-10 pb-8 border-b border-white/10">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FA7B21]/30">
                            <span className="text-3xl">📜</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                            {t.titulo}
                        </h1>
                        <p className="text-white/60">
                            {t.subtitulo}
                        </p>
                    </div>

                    {/* Terms Content */}
                    <div className="max-w-none space-y-8">
                        {t.secciones.map((sec) => (
                            <section key={sec.id} id={sec.id} className="scroll-mt-24">
                                <h2 className="text-xl font-bold text-[#FCA929] mb-4">{sec.numero}. {sec.titulo.toUpperCase()}</h2>
                                <BloquesLegales bloques={sec.bloques} />
                            </section>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-10 pt-8 border-t border-white/10 text-center">
                        <p className="text-white/40 text-sm">
                            Última actualización: {t.actualizado}
                        </p>
                        <button
                            onClick={() => onNavigate('home')}
                            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white rounded-lg hover:from-[#F36A15] hover:to-[#FA7B21] transition-all"
                        >
                            Aceptar y Volver
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
