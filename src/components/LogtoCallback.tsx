import { useEffect, useState, useRef } from 'react';
import { useHandleSignInCallback, useLogto } from '@logto/react';
import { Loader2 } from 'lucide-react';

interface LogtoCallbackProps {
    onNavigate: (page: string) => void;
    onLoadProfile: (authId: string, email?: string) => Promise<void>;
}

export function LogtoCallback({ onNavigate, onLoadProfile }: LogtoCallbackProps) {
    const [status, setStatus] = useState<'loading' | 'processing' | 'success' | 'error'>('loading');
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
                setStatus('processing');

                const claims = await getIdTokenClaims();
                if (!claims) {
                    console.error('No token claims available');
                    onNavigate('home');
                    return;
                }

                const authId = claims.sub;
                const email = claims.email as string | undefined;

                console.log('Authenticated user:', { authId, email });

                // Try to load the profile - this will work if account is linked
                // If not linked, PerfilPage will handle the linking flow
                try {
                    await onLoadProfile(authId, email);
                } catch (profileError) {
                    console.log('Profile load error (expected for new accounts):', profileError);
                }

                // Always redirect to perfil - the page will handle unlinked accounts
                setStatus('success');
                console.log('Redirecting to perfil');
                onNavigate('perfil');

            } catch (err) {
                console.error('Error in callback:', err);
                setStatus('error');
                setErrorMessage(err instanceof Error ? err.message : 'Error desconocido');
                setTimeout(() => onNavigate('home'), 3000);
            }
        };

        handleCallback();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        processing: 'Preparando tu perfil...',
        success: '¡Listo! Redirigiendo...',
        error: 'Error de conexión',
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-[#FA7B21] animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">{statusMessages[status]}</p>
            </div>
        </div>
    );
}
