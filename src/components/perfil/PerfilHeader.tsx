import { RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { getIniciales, toTitleCase } from './utils';

interface PerfilHeaderProps {
  user: any;
  onRefresh: () => void;
  onLogout: () => void;
  isRefreshing: boolean;
  isPagado: boolean;
  isMobile: boolean;
}

export function PerfilHeader({ user, onRefresh, onLogout, isRefreshing, isPagado, isMobile }: PerfilHeaderProps) {
  if (isMobile) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative transition-transform duration-200 hover:scale-105">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FA7B21] to-orange-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-[#FA7B21]/20">
                {getIniciales(user.estudiante?.nombre || '')}
              </div>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-black",
                isPagado ? "bg-emerald-500" : "bg-amber-500"
              )} />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">{user.estudiante?.nombre}</h1>
              <p className="text-sm text-zinc-500">{user.matricula?.programa}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-200 hover:scale-110 active:scale-90"
            >
              <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
            </button>
            <button
              onClick={onLogout}
              className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:scale-110 active:scale-90"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop header
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative transition-transform duration-200 hover:scale-105">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center shadow-2xl shadow-[#FA7B21]/30">
              <span className="text-3xl font-bold text-white">
                {getIniciales(user?.estudiante?.nombre || 'Usuario')}
              </span>
            </div>
            {isPagado && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1
                className="text-4xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 50%, #FDCB6E 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {toTitleCase(user?.estudiante?.nombre || 'Estudiante')}
              </h1>
              <Badge className="bg-[#FA7B21]/20 text-[#FCA929] border-[#FA7B21]/30">
                {user?.estudiante?.categoria || 'Estudiante'}
              </Badge>
            </div>
            <p className="text-white/60 text-lg">
              {user?.matricula?.programa || 'Sin programa activo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onRefresh}
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Actualizar
          </Button>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesion
          </Button>
        </div>
      </div>
    </div>
  );
}
