import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  User,
  Mail,
  CreditCard,
  LogOut,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Sparkles,
  Megaphone,
  CheckCircle2,
  Calendar,
  Clock,
  MessageSquare,
  ChevronRight,
  Phone,
  Trophy,
  Target,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

interface PerfilPageProps {
  onNavigate: (page: string) => void;
}

export function PerfilPage({ onNavigate }: PerfilPageProps) {
  const { user, logout, refreshUserData, isAuthenticated } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Animación de entrada
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirección si no hay sesión
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('inicio-sesion');
    }
  }, [isAuthenticated, onNavigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    toast.success('Datos actualizados');
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  // PANTALLA DE CARGA
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#FA7B21]/30 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#FA7B21] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-white/50 text-sm animate-pulse">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // CALCULAR DÍAS RESTANTES
  const calcularDiasRestantes = () => {
    const hoy = new Date();
    const fechaFin = new Date(user.matricula.fechaFin);
    const diferencia = fechaFin.getTime() - hoy.getTime();
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    return dias > 0 ? dias : 0;
  };

  const calcularProgreso = () => {
    const fechaInicio = new Date(user.matricula.fechaInicio);
    const fechaFin = new Date(user.matricula.fechaFin);
    const hoy = new Date();
    const totalDias = fechaFin.getTime() - fechaInicio.getTime();
    const diasTranscurridos = hoy.getTime() - fechaInicio.getTime();
    const progreso = (diasTranscurridos / totalDias) * 100;
    return Math.min(Math.max(progreso, 0), 100);
  };

  const diasRestantes = calcularDiasRestantes();
  const progreso = calcularProgreso();

  // OBTENER INICIALES
  const getIniciales = (nombre: string) => {
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // HELPER VISUAL SEGÚN EL ESTADO DE PAGO
  const getStatusColor = (estado: string) => {
    const status = estado?.toLowerCase() || '';
    if (status.includes('pagado') || status.includes('activo')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    if (status.includes('vencido')) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (status.includes('vencer')) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-white/10 text-white border-white/20';
  };

  const isPagado = user.pagos.estadoPago?.toLowerCase().includes('pagado');

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white font-sans selection:bg-[#FA7B21] selection:text-black">
      
      {/* Fondo con efectos */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FA7B21]/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-zinc-800/50 rounded-full blur-[100px]" />
      </div>

      <div className={`relative z-10 max-w-lg mx-auto px-4 py-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={() => onNavigate('home')} 
            variant="ghost" 
            className="text-white/70 hover:text-white hover:bg-white/10 -ml-2 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5 mr-2" /> Volver
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              size="icon" 
              variant="ghost"
              className="text-white/70 hover:text-[#FA7B21] hover:bg-[#FA7B21]/10 transition-all duration-300 hover:scale-110"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={handleLogout} 
              size="icon" 
              variant="ghost"
              className="text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 hover:scale-110"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Saludo y Avatar */}
        <div className={`text-center mb-8 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Avatar con iniciales */}
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FA7B21] to-orange-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-[#FA7B21]/30 transition-transform duration-300 hover:scale-105">
              {getIniciales(user.estudiante.nombre)}
            </div>
            {/* Indicador de estado */}
            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg ${isPagado ? 'bg-emerald-500' : 'bg-amber-500'} flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110`}>
              {isPagado ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Clock className="h-4 w-4 text-white" />}
            </div>
          </div>
          
          {/* Nombre del alumno */}
          <h1 className="text-2xl font-bold text-white mb-1">
            {user.estudiante.nombre}
          </h1>
          <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
            <Badge variant="outline" className="border-[#FA7B21]/50 text-[#FA7B21] bg-[#FA7B21]/10 px-2 py-0.5 text-xs">
              {user.estudiante.categoria}
            </Badge>
            <span>•</span>
            <span>{user.matricula.programa}</span>
          </div>
        </div>

        {/* Tarjetas de resumen rápido */}
        <div className={`grid grid-cols-2 gap-3 mb-6 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Días restantes */}
          <Card className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border-zinc-700/50 backdrop-blur-sm overflow-hidden group hover:border-[#FA7B21]/50 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FA7B21]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-5 w-5 text-[#FA7B21]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{diasRestantes}</p>
                  <p className="text-xs text-zinc-400">días restantes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado de pago */}
          <Card className={`bg-gradient-to-br ${isPagado ? 'from-emerald-900/30 to-emerald-950/30 border-emerald-700/50 hover:border-emerald-500/50' : 'from-amber-900/30 to-amber-950/30 border-amber-700/50 hover:border-amber-500/50'} backdrop-blur-sm overflow-hidden group transition-all duration-300`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${isPagado ? 'bg-emerald-500/20' : 'bg-amber-500/20'} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  {isPagado ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Clock className="h-5 w-5 text-amber-400" />}
                </div>
                <div>
                  <p className={`text-lg font-bold ${isPagado ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {user.pagos.estadoPago}
                  </p>
                  <p className="text-xs text-zinc-400">estado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de progreso del programa */}
        <div className={`mb-6 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-zinc-400">Progreso del programa</span>
                <span className="text-xs text-[#FA7B21] font-medium">{Math.round(progreso)}%</span>
              </div>
              <div className="h-2 bg-zinc-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FA7B21] to-orange-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progreso}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-zinc-500">{user.matricula.fechaInicio}</span>
                <span className="text-xs text-zinc-500">{user.matricula.fechaFin}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mensaje destacado */}
        {user.mensaje.contenido && (
          <div className={`mb-6 transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Card className="bg-gradient-to-br from-[#FA7B21]/10 via-orange-900/10 to-transparent border-[#FA7B21]/30 backdrop-blur-sm overflow-hidden relative group hover:border-[#FA7B21]/50 transition-all duration-300">
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FA7B21]/20 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-[#FA7B21]" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-[#FA7B21]">Nuevo comunicado</CardTitle>
                      <p className="text-xs text-zinc-500">{user.mensaje.fecha}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {user.mensaje.contenido}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Información rápida */}
        <div className={`mb-6 transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              {/* Días de clase */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-700/50 group hover:bg-white/5 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Días de clase</p>
                    <p className="text-xs text-zinc-400">{user.clases[0]?.horario || 'No definido'}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>

              {/* Tallas */}
              <div className="flex items-center justify-between p-4 group hover:bg-white/5 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Tallas</p>
                    <p className="text-xs text-zinc-400">Uniforme: {user.estudiante.tallaUniforme} • Polo: {user.estudiante.tallaPolo}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pestañas */}
        <div className={`transition-all duration-700 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Tabs defaultValue="padres" className="w-full">
            <TabsList className="w-full bg-zinc-800/50 border border-zinc-700/50 p-1 mb-4 h-auto grid grid-cols-2 rounded-xl backdrop-blur-sm">
              <TabsTrigger 
                value="padres" 
                className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FA7B21] data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#FA7B21]/20 text-zinc-400 transition-all rounded-lg text-sm"
              >
                <User className="h-4 w-4 mr-2" /> Apoderado
              </TabsTrigger>
              <TabsTrigger 
                value="plan" 
                className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FA7B21] data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#FA7B21]/20 text-zinc-400 transition-all rounded-lg text-sm"
              >
                <CreditCard className="h-4 w-4 mr-2" /> Pagos
              </TabsTrigger>
            </TabsList>

            {/* Tab Padres */}
            <TabsContent value="padres" className="mt-0">
              <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-zinc-700/50 flex items-center justify-center">
                      <User className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Nombre</p>
                      <p className="text-white font-medium truncate">{user.familia.nombreFamilia}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-zinc-700/50 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">DNI</p>
                      <p className="text-white font-mono">{user.familia.dniFamilia}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-[#FA7B21]/20 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-[#FA7B21]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Correo</p>
                      <p className="text-white truncate">{user.familia.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-[#FA7B21]/20 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-[#FA7B21]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Dirección</p>
                      <p className="text-white truncate">{user.familia.direccion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Plan/Pagos */}
            <TabsContent value="plan" className="mt-0">
              <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  {/* Total destacado */}
                  <div className={`p-6 rounded-2xl mb-4 text-center ${isPagado ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 border border-emerald-700/30' : 'bg-gradient-to-br from-amber-900/30 to-amber-950/50 border border-amber-700/30'}`}>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Total del programa</p>
                    <p className="text-4xl font-bold text-white mb-2">S/ {user.pagos.precioAPagar}</p>
                    <Badge className={`${isPagado ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-amber-500/20 text-amber-400 border-amber-500/50'} px-4 py-1`}>
                      {isPagado && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {user.pagos.estadoPago?.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Detalles */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-xl">
                      <span className="text-zinc-400 text-sm">Precio regular</span>
                      <span className="text-white font-medium">S/ {user.pagos.precioPrograma}</span>
                    </div>
                    
                    {user.pagos.descuento > 0 && (
                      <div className="flex justify-between items-center p-3 bg-emerald-900/20 rounded-xl border border-emerald-700/30">
                        <span className="text-emerald-400 text-sm">Descuento aplicado</span>
                        <span className="text-emerald-400 font-bold">- S/ {user.pagos.descuento}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Acciones rápidas */}
        <div className={`mt-6 transition-all duration-700 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <a 
            href="https://wa.me/51989717412" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <Phone className="h-5 w-5" />
            Contactar por WhatsApp
          </a>
        </div>

        {/* Espaciado final para scroll */}
        <div className="h-8" />
      </div>
    </div>
  );
}
