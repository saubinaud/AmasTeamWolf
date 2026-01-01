import { useEffect, useState, useRef } from 'react';
import { useHandleSignInCallback, useLogto } from '@logto/react';
import { Loader2 } from 'lucide-react';

interface LogtoCallbackProps {
    onNavigate: (page: string) => void;
    onLoadProfile: (authId: string, email?: string) => Promise<void>;
}

const PROFILE_CHECK_URL = 'https://pallium-n8n.s6hx3x.easypanel.host/webhook/perfil-usuario';

export function LogtoCallback({ onNavigate, onLoadProfile }: LogtoCallbackProps) {
    const [status, setStatus] = useState<'loading' | 'checking' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const hasProcessed = useRef(false);

    const { isLoading, error } = useHandleSignInCallback(async () => {
        console.log('Logto sign-in callback completed');
    });

    const { getIdTokenClaims, isAuthenticated } = useLogto();

    useEffect(() => {
        const handleCallback = async () => {
            if (hasProcessed.current || !isAuthenticated || isLoading) {
                return;
            }

            hasProcessed.current = true;

            try {
                setStatus('checking');

                const claims = await getIdTokenClaims();
                if (!claims) {
                    console.error('No token claims available');
                    onNavigate('home');
                    return;
                }

                const authId = claims.sub;
                const email = claims.email as string | undefined;

                console.log('=== CALLBACK DEBUG ===');
                console.log('Logto user authenticated:', { authId, email });

                // Check if user already has a linked profile
                console.log('Sending profile check to:', PROFILE_CHECK_URL);

                const response = await fetch(PROFILE_CHECK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ auth_id: authId, email }),
                });

                console.log('Response status:', response.status, response.ok);

                if (response.ok) {
                    const result = await response.json();
                    console.log('Profile check result:', JSON.stringify(result, null, 2));

                    // Handle different response formats
                    const data = Array.isArray(result) && result.length > 0 ? result[0] : result;
                    console.log('Extracted data keys:', data ? Object.keys(data) : 'null');

                    // Check multiple possible fields that indicate a valid profile
                    const checks = {
                        hasAuthIdMatch: data?.auth_id === authId,
                        hasApoderadoId: !!data?.apoderado_id,
                        hasAlumnoId: !!data?.alumno_id,
                        hasEstudianteNombre: !!data?.estudiante?.nombre,
                        hasFamiliaNombre: !!(data?.familia?.nombreFamilia),
                        hasAlumnoNombre: !!data?.alumno_nombre,
                        hasApoderadoNombre: !!data?.apoderado_nombre,
                        // Check for any data at all (webhook returned something)
                        hasAnyData: data && typeof data === 'object' && Object.keys(data).length > 0,
                    };
                    console.log('Profile checks:', checks);

                    const hasValidProfile = checks.hasAnyData || checks.hasAuthIdMatch || checks.hasApoderadoId ||
                        checks.hasAlumnoId || checks.hasEstudianteNombre ||
                        checks.hasFamiliaNombre || checks.hasAlumnoNombre ||
                        checks.hasApoderadoNombre;

                    console.log('Has valid profile:', hasValidProfile);

                    if (hasValidProfile) {
                        console.log('✅ Valid profile found! Loading and navigating to perfil');
                        setStatus('success');
                        await onLoadProfile(authId, email);
                        onNavigate('perfil');
                        return;
                    } else {
                        console.log('❌ No valid profile fields found in response');
                    }
                } else {
                    console.log('❌ Response not OK:', response.status);
                }

                // No valid profile - redirect to link account
                console.log('Redirecting to vincular-cuenta');
                onNavigate('vincular-cuenta');

            } catch (err) {
                console.error('Error in callback:', err);
                setStatus('error');
                setErrorMessage(err instanceof Error ? err.message : 'Error desconocido');
                setTimeout(() => onNavigate('home'), 3000);
            }
        };

        handleCallback();
    }, [isAuthenticated, isLoading]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="text-center p-8 bg-zinc-900 rounded-xl border border-red-500/30 max-w-md">
                    <div className="text-4xl mb-4">❌</div>
                    <h2 className="text-xl font-bold text-white mb-2">Error de autenticación</h2>
                    <p className="text-white/70 mb-4">{error.message}</p>
                    <button
                        onClick={() => onNavigate('home')}
                        className="px-6 py-2 bg-[#FA7B21] text-white rounded-lg hover:bg-[#F36A15] transition-colors"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="text-center p-8 bg-zinc-900 rounded-xl border border-amber-500/30 max-w-md">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-white mb-2">Error de conexión</h2>
                    <p className="text-white/70 mb-4">{errorMessage}</p>
                    <p className="text-white/50 text-sm">Redirigiendo...</p>
                </div>
            </div>
        );
    }

    const statusMessages = {
        loading: 'Iniciando sesión...',
        checking: 'Verificando tu perfil...',
        success: '¡Listo! Redirigiendo a tu perfil...',
        error: 'Error de conexión',
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-[#FA7B21] animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">{statusMessages[status]}</p>
                <p className="text-white/60 text-sm mt-2">
                    {status === 'checking' && 'Buscando tu perfil de alumno...'}
                    {status === 'success' && 'Cargando información...'}
                </p>
            </div>
        </div>
    );
}
