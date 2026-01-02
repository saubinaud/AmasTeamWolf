import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLogto } from '@logto/react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: ReactNode;
    onNavigate: (page: string) => void;
    requireAuth?: boolean;
    redirectIfAuth?: boolean;
}

/**
 * AuthGuard - Centralized authentication routing component
 * 
 * Handles all auth-based routing decisions in one place:
 * - requireAuth: true → Redirects to login if not authenticated
 * - redirectIfAuth: true → Redirects to profile if already authenticated
 * 
 * Uses render-based decisions instead of useEffect redirects to prevent loops
 */
export function AuthGuard({
    children,
    onNavigate,
    requireAuth = false,
    redirectIfAuth = false
}: AuthGuardProps) {
    const { user, isLoading: authLoading } = useAuth();
    const { isAuthenticated, isLoading: logtoLoading } = useLogto();

    const isLoading = authLoading || logtoLoading;

    // Show loading while auth state is being determined
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#FA7B21] animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    // If this route requires auth and user is not authenticated
    if (requireAuth && !isAuthenticated) {
        // Render a redirect component instead of using useEffect
        return <RedirectTo page="inicio-sesion" onNavigate={onNavigate} />;
    }

    // If this route should redirect authenticated users (e.g., login page)
    if (redirectIfAuth && isAuthenticated) {
        return <RedirectTo page="perfil" onNavigate={onNavigate} />;
    }

    // All checks passed, render children
    return <>{children}</>;
}

/**
 * RedirectTo - Simple component that triggers navigation once on mount
 * Uses a one-time effect to prevent loops
 */
function RedirectTo({ page, onNavigate }: { page: string; onNavigate: (page: string) => void }) {
    // Use setTimeout to ensure navigation happens after render
    // This prevents React state update warnings
    setTimeout(() => {
        onNavigate(page);
    }, 0);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-[#FA7B21] animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">
                    Redirigiendo{page === 'perfil' ? ' a tu perfil' : ''}...
                </p>
            </div>
        </div>
    );
}
