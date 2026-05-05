import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: ReactNode;
    onNavigate?: (page: string) => void;
    requireAuth?: boolean;
    redirectIfAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = false, redirectIfAuth = false }: AuthGuardProps) {
    const { isAuthenticated, isLoading } = useAuth();

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

    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/inicio-sesion" replace />;
    }

    if (redirectIfAuth && isAuthenticated) {
        return <Navigate to="/perfil" replace />;
    }

    return <>{children}</>;
}
