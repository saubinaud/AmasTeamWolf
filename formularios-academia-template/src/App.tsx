import { useState } from 'react';
import { FormularioMatricula } from './components/FormularioMatricula';
import { FormularioRenovacion } from './components/FormularioRenovacion';
import { RegistroMensualPage } from './components/RegistroMensualPage';
import { RegistroTresMesesPage } from './components/RegistroTresMesesPage';
import { RegistroSeisMesesPage } from './components/RegistroSeisMesesPage';
import { RenovacionPage } from './components/RenovacionPage';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

type Page = 'home' | 'registro-mensual' | 'registro-3meses' | 'registro-6meses' | 'renovacion';

function App() {
    const [currentPage, setCurrentPage] = useState<Page>('home');

    const handleNavigateHome = () => {
        setCurrentPage('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRegistrationSuccess = (total: number) => {
        toast.success(`¡Inscripción completada! Total: S/ ${total}`);
        setTimeout(() => {
            setCurrentPage('home');
        }, 1500);
    };

    // Render pages
    if (currentPage === 'registro-mensual') {
        return (
            <>
                <RegistroMensualPage
                    onNavigateHome={handleNavigateHome}
                    onSuccess={handleRegistrationSuccess}
                />
                <Toaster position="top-center" richColors />
            </>
        );
    }

    if (currentPage === 'registro-3meses') {
        return (
            <>
                <RegistroTresMesesPage
                    onNavigateHome={handleNavigateHome}
                    onSuccess={handleRegistrationSuccess}
                />
                <Toaster position="top-center" richColors />
            </>
        );
    }

    if (currentPage === 'registro-6meses') {
        return (
            <>
                <RegistroSeisMesesPage
                    onNavigateHome={handleNavigateHome}
                    onSuccess={handleRegistrationSuccess}
                />
                <Toaster position="top-center" richColors />
            </>
        );
    }

    if (currentPage === 'renovacion') {
        return (
            <>
                <RenovacionPage
                    onNavigateHome={handleNavigateHome}
                    onSuccess={() => {
                        setTimeout(() => setCurrentPage('home'), 1500);
                    }}
                />
                <Toaster position="top-center" richColors />
            </>
        );
    }

    // Home page - Show form options
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950 text-white">
            <Toaster position="top-center" richColors />

            {/* Header */}
            <header className="border-b border-white/10 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-xl font-bold text-white">
                        {/* ⚠️ PERSONALIZAR: Nombre de tu academia */}
                        Mi Academia
                    </h1>
                </div>
            </header>

            {/* Hero */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                        Formularios de <span className="text-[#FA7B21]">Inscripción</span>
                    </h2>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto">
                        Selecciona el tipo de formulario que necesitas
                    </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Matrícula - 1 Mes */}
                    <button
                        onClick={() => setCurrentPage('registro-mensual')}
                        className="group bg-zinc-900/80 border border-zinc-800 hover:border-[#FA7B21]/50 rounded-xl p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-[#FA7B21]/10"
                    >
                        <div className="text-3xl mb-3">📋</div>
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#FA7B21] transition-colors">
                            Programa 1 Mes
                        </h3>
                        <p className="text-white/50 text-sm">
                            Inscripción al programa mensual de 8 clases
                        </p>
                        <div className="mt-4 text-[#FA7B21] font-bold text-xl">S/ 330</div>
                    </button>

                    {/* Matrícula - 3 Meses */}
                    <button
                        onClick={() => setCurrentPage('registro-3meses')}
                        className="group bg-zinc-900/80 border border-zinc-800 hover:border-[#FA7B21]/50 rounded-xl p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-[#FA7B21]/10"
                    >
                        <div className="text-3xl mb-3">🥋</div>
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#FA7B21] transition-colors">
                            Programa 3 Meses Full
                        </h3>
                        <p className="text-white/50 text-sm">
                            Programa completo con uniforme incluido - 24 clases
                        </p>
                        <div className="mt-4 text-[#FA7B21] font-bold text-xl">S/ 869</div>
                    </button>

                    {/* Matrícula - 6 Meses */}
                    <button
                        onClick={() => setCurrentPage('registro-6meses')}
                        className="group bg-zinc-900/80 border border-zinc-800 hover:border-[#FA7B21]/50 rounded-xl p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-[#FA7B21]/10"
                    >
                        <div className="text-3xl mb-3">⚡</div>
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#FA7B21] transition-colors">
                            Programa 6 Meses
                        </h3>
                        <p className="text-white/50 text-sm">
                            Programa semestral con uniforme y beneficios - 48 clases
                        </p>
                        <div className="mt-4 text-[#FA7B21] font-bold text-xl">S/ 1,699</div>
                    </button>

                    {/* Renovación */}
                    <button
                        onClick={() => setCurrentPage('renovacion')}
                        className="group bg-zinc-900/80 border border-[#FA7B21]/30 hover:border-[#FA7B21]/60 rounded-xl p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-[#FA7B21]/10"
                    >
                        <div className="text-3xl mb-3">🔄</div>
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#FA7B21] transition-colors">
                            Renovación
                        </h3>
                        <p className="text-white/50 text-sm">
                            Renueva tu membresía y elige tu próximo plan
                        </p>
                        <div className="mt-4 text-[#FA7B21] font-bold text-sm">Varios planes disponibles</div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
