import { useState } from 'react';
import { useLogto } from '@logto/react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Search, CheckCircle, AlertCircle, User, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

interface VincularCuentaPageProps {
    onNavigate: (page: string) => void;
}

const VINCULAR_API_URL = 'https://pallium-n8n.s6hx3x.easypanel.host/webhook/vincular-cuenta';

export function VincularCuentaPage({ onNavigate }: VincularCuentaPageProps) {
    const { getIdTokenClaims } = useLogto();
    const { loadUserProfile } = useAuth();

    const [dniAlumno, setDniAlumno] = useState('');
    const [dniPadre, setDniPadre] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<any>(null);
    const [isLinking, setIsLinking] = useState(false);
    const [linked, setLinked] = useState(false);

    const handleSearch = async () => {
        if (!dniAlumno && !dniPadre) {
            toast.error('Ingresa al menos un DNI para buscar');
            return;
        }

        setIsSearching(true);
        setSearchResult(null);

        try {
            const response = await fetch(VINCULAR_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'buscar',
                    dni_alumno: dniAlumno,
                    dni_padre: dniPadre,
                }),
            });

            const result = await response.json();
            const data = Array.isArray(result) && result.length > 0 ? result[0] : result;

            if (data && (data.alumno_nombre || data.apoderado_nombre)) {
                setSearchResult(data);
                toast.success('¡Perfil encontrado!');
            } else {
                toast.error('No se encontró ningún perfil con esos datos');
                setSearchResult(null);
            }
        } catch (error) {
            console.error('Error searching:', error);
            toast.error('Error al buscar. Intenta de nuevo.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleLink = async () => {
        if (!searchResult) return;

        setIsLinking(true);

        try {
            const claims = await getIdTokenClaims();
            if (!claims?.sub) {
                toast.error('Error: No se pudo obtener tu ID de usuario');
                return;
            }

            const authId = claims.sub;
            const email = claims.email as string | undefined;

            const response = await fetch(VINCULAR_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'vincular',
                    auth_id: authId,
                    email: email,
                    apoderado_id: searchResult.apoderado_id || searchResult.id,
                }),
            });

            const result = await response.json();

            if (result.success || response.ok) {
                setLinked(true);
                toast.success('¡Cuenta vinculada exitosamente!');

                // Load the user profile
                await loadUserProfile(authId, email);

                // Redirect to profile after 2 seconds
                setTimeout(() => {
                    onNavigate('perfil');
                }, 2000);
            } else {
                toast.error('Error al vincular la cuenta');
            }
        } catch (error) {
            console.error('Error linking:', error);
            toast.error('Error al vincular. Intenta de nuevo.');
        } finally {
            setIsLinking(false);
        }
    };

    if (linked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
                <div className="text-center">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">¡Cuenta Vinculada!</h2>
                    <p className="text-white/60">Redirigiendo a tu perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-[#FA7B21]/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#FCA929]/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-lg mx-auto">
                {/* Card */}
                <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FA7B21]/30">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Vincular mi Cuenta
                        </h1>
                        <p className="text-white/60 text-sm">
                            Conecta tu nueva cuenta con tu perfil de alumno existente en AMAS
                        </p>
                    </div>

                    {/* Search Form */}
                    <div className="space-y-6">
                        <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                            <p className="text-white/70 text-sm mb-4">
                                Ingresa el DNI del alumno o del apoderado para buscar tu perfil:
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="dniAlumno" className="text-white mb-2">
                                        DNI del Alumno
                                    </Label>
                                    <Input
                                        id="dniAlumno"
                                        type="text"
                                        value={dniAlumno}
                                        onChange={(e) => setDniAlumno(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Ej: 12345678"
                                        maxLength={8}
                                        className="bg-zinc-800 border-white/20 text-white"
                                    />
                                </div>

                                <div className="text-center text-white/40 text-sm">— o —</div>

                                <div>
                                    <Label htmlFor="dniPadre" className="text-white mb-2">
                                        DNI del Apoderado
                                    </Label>
                                    <Input
                                        id="dniPadre"
                                        type="text"
                                        value={dniPadre}
                                        onChange={(e) => setDniPadre(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Ej: 87654321"
                                        maxLength={8}
                                        className="bg-zinc-800 border-white/20 text-white"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSearch}
                                disabled={isSearching || (!dniAlumno && !dniPadre)}
                                className="w-full mt-4 bg-zinc-700 hover:bg-zinc-600 text-white"
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Buscando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4 mr-2" />
                                        Buscar mi Perfil
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Search Result */}
                        {searchResult && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-green-400 font-semibold mb-2">
                                            ¡Perfil Encontrado!
                                        </h3>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-white">
                                                <span className="text-white/60">Alumno:</span>{' '}
                                                {searchResult.alumno_nombre}
                                            </p>
                                            <p className="text-white">
                                                <span className="text-white/60">Apoderado:</span>{' '}
                                                {searchResult.apoderado_nombre}
                                            </p>
                                            {searchResult.programa && (
                                                <p className="text-white">
                                                    <span className="text-white/60">Programa:</span>{' '}
                                                    {searchResult.programa}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleLink}
                                    disabled={isLinking}
                                    className="w-full mt-4 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white"
                                >
                                    {isLinking ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Vinculando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Vincular esta Cuenta
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Help text */}
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-white/5">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-[#FCA929] flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-white/60">
                                    <p className="mb-2">
                                        <strong className="text-white/80">¿No encuentras tu perfil?</strong>
                                    </p>
                                    <p>
                                        Contacta a la academia por WhatsApp para verificar tus datos de registro.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skip link */}
                    <div className="mt-6 pt-6 border-t border-white/10 text-center">
                        <button
                            onClick={() => onNavigate('home')}
                            className="text-white/50 hover:text-white/80 text-sm transition-colors"
                        >
                            Omitir por ahora
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
