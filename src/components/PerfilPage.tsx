import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  User,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Trophy,
  Calendar,
  CreditCard,
  Shirt,
  MapPin,
  Mail,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';

interface PerfilPageProps {
  onNavigate: (page: string) => void;
}

export function PerfilPage({ onNavigate }: PerfilPageProps) {
  const { user, logout, refreshUserData, isAuthenticated } = useAuth() as any;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<'Activo' | 'Por Vencer' | 'Vencido'>('Activo');
  const [daysLeft, setDaysLeft] = useState(0);
  const [progress, setProgress] = useState(0);

  // CORRECCIÓN CLAVE: Detectar si user es un array o un objeto
  const currentUser = user ? (Array.isArray(user) ? user[0] : user) : null;

  // Redirigir
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('inicio-sesion');
    }
  }, [isAuthenticated, onNavigate]);

  // Cálculos de fechas y estados
  useEffect(() => {
    if (currentUser) {
      // Asegurarse de que las fechas existan antes de calcular
      if (!currentUser["Fecha final"] || !currentUser["Fecha inicio"]) return;

      const fechaFin = new Date(currentUser["Fecha final"]);
      const fechaInicio = new Date(currentUser["Fecha inicio"]);
      const hoy = new Date();

      const diffTime = fechaFin.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(diffDays);

      const totalDuration = fechaFin.getTime() - fechaInicio.getTime();
      const elapsed = hoy.getTime() - fechaInicio.getTime();
      const percentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
      setProgress(percentage);

      if (diffDays < 0) setStatus('Vencido');
      else if (diffDays <= 15) setStatus('Por Vencer');
      else setStatus('Activo');
    }
  }, [currentUser]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    toast.success('Perfil actualizado');
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-[#FA7B21] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white/50 animate-pulse">Cargando perfil de jugador...</p>
      </div>
    );
  }

  // Configuración visual dinámica según el estado
  const statusColors = {
    Activo: 'from-green-500 to-emerald-700 shadow-emerald-500/20',
    'Por Vencer': 'from-yellow-500 to-orange-600 shadow-orange-500/20',
    Vencido: 'from-red-500 to-rose-700 shadow-red-500/20',
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FA7B21] selection:text-black overflow-x-hidden">
      
      {/* Fondo Ambient (Luces de estadio) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#FA7B21]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto sm:max-w-4xl p-4 pb-20">
        
        {/* Header Transparente */}
        <header className="flex justify-between items-center py-4 mb-6">
          <Button onClick={() => onNavigate('home')} variant="ghost" className="text-white hover:bg-white/10 rounded-full h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="ghost" className={`text-white hover:bg-white/10 rounded-full h-10 w-10 p-0 ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="text-white hover:bg-red-500/20 hover:text-red-400 rounded-full h-10 w-10 p-0">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* --- TARJETA PRINCIPAL ESTILO FUT (FIFA ULTIMATE TEAM) --- */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[21/9] bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 mb-6 group">
          {/* Fondo dinámico de la tarjeta */}
          <div className={`absolute inset-0 bg-gradient-to-br ${statusColors[status]} opacity-20`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end sm:justify-center sm:items-start h-full">
            
            {/* Badge de Estado Flotante */}
            <div className="absolute top-6 right-6">
               <Badge className={`px-4 py-1.5 text-sm font-bold border-0 bg-gradient-to-r ${statusColors[status]} text-white shadow-lg backdrop-blur-md`}>
                 {status.toUpperCase()}
               </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 w-full">
              {/* Avatar "Héroe" */}
              <div className="relative shrink-0">
                <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-br ${statusColors[status]}`}>
                  <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden border-4 border-black">
                     <User className="h-16 w-16 text-white/30" />
                     {/* Aquí iría: <img src={currentUser.foto} className="w-full h-full object-cover" /> */}
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black border border-[#FA7B21] text-[#FA7B21] px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-lg">
                  {currentUser["Categoría"]}
                </div>
              </div>

              {/* Información Principal */}
              <div className="text-center sm:text-left flex-1 space-y-2 pb-2">
                <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-lg">
                  {currentUser["Nombre del alumno"]}
                </h1>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm font-medium text-white/80">
                  <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                    <Trophy className="w-4 h-4 text-[#FA7B21]" />
                    {currentUser["Programa"]}
                  </span>
                  <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                    <Shirt className="w-4 h-4 text-blue-400" />
                    Talla: {currentUser["Talla uniforme"]}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Temporada (Progreso) */}
            <div className="w-full mt-8 bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase tracking-widest text-white/60">Progreso de Membresía</span>
                <span className="text-xs font-bold text-white">{daysLeft > 0 ? `${daysLeft} Días restantes` : 'Finalizado'}</span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${statusColors[status]}`}
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-white/40 font-mono">
                <span>INICIO: {currentUser["Fecha inicio"]}</span>
                <span>FIN: {currentUser["Fecha final"]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN DE MENSAJE (NOTIFICACIÓN) --- */}
        {currentUser["Mensaje"] && (
          <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FA7B21] to-[#FF4D00] p-[1px]">
            <div className="bg-zinc-950 rounded-2xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FA7B21]/20 blur-[50px] rounded-full pointer-events-none" />
               
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-[#FA7B21] rounded-lg shadow-lg shadow-orange-500/30">
                     <Sparkles className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-white leading-none">Aviso del Club</h3>
                     <span className="text-xs text-[#FA7B21]">{currentUser["Fecha"]}</span>
                   </div>
                 </div>
                 
                 <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                   {currentUser["Mensaje"]}
                 </p>

                 {status !== 'Activo' && (
                   <Button className="w-full bg-white text-black hover:bg-zinc-200 font-bold">
                     Renovar Membresía Ahora
                     <ChevronRight className="w-4 h-4 ml-2" />
                   </Button>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* --- GRID DE ESTADÍSTICAS Y DATOS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Tarjeta de Clases */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
            <h4 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Horarios de Entrenamiento
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                 <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    {currentUser["Clases totales"]}
                 </div>
                 <div>
                   <p className="text-white font-bold text-sm">Sesiones Totales</p>
                   <p className="text-white/50 text-xs">Incluidas en el plan</p>
                 </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                 <p className="text-white/50 text-xs mb-1">Días Asignados</p>
                 <p className="text-white font-medium">{currentUser["Días tentativos"]}</p>
              </div>
            </div>
          </div>

          {/* Tarjeta Financiera */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
            <h4 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Estado de Cuenta
            </h4>
            
            <div className="flex flex-col gap-1 mb-4">
              <span className="text-3xl font-bold text-white tracking-tight">
                S/ {currentUser["Precio a pagar"]}
              </span>
              <span className="text-xs text-white/40 line-through">
                Precio regular: S/ {currentUser["Precio del programa"]}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm py-2 border-b border-white/5">
                <span className="text-white/60">Descuento</span>
                <span className="text-green-400 font-bold">- S/ {currentUser["Descuento"]}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-white/5">
                <span className="text-white/60">Código</span>
                <span className="text-white font-mono bg-white/10 px-2 rounded text-xs py-0.5">
                  {currentUser["Código promocional"]}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta Padre/Tutor (Expandida) */}
          <div className="md:col-span-2 bg-zinc-900/50 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
             <h4 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Tutor Responsable
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase">Nombre</p>
                    <p className="text-white font-medium">{currentUser["Nombre del padre"]}</p>
                    <p className="text-xs text-white/40 mt-1">DNI: {currentUser["DNI del padre"]}</p>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#FA7B21]/10 rounded-lg text-[#FA7B21]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-white/40 uppercase">Contacto</p>
                    <p className="text-white font-medium truncate">{currentUser["Correo"]}</p>
                    <p className="text-xs text-white/40 mt-1 truncate">{currentUser["Dirección"]}</p>
                  </div>
               </div>
            </div>
          </div>

        </div>

        <div className="mt-8 text-center">
            <p className="text-[10px] text-white/20 font-mono uppercase">
              ID Contrato: {currentUser["Contrato"] || "PENDIENTE"} • AMAS Team Wolf App v2.0
            </p>
        </div>

      </div>
    </div>
  );
}
