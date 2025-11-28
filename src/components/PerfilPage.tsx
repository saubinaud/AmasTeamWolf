import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress'; // Asegúrate de tener este componente o usa un div simple
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Clock,
  MapPin,
  Shirt,
  Trophy,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Megaphone
} from 'lucide-react';
import { toast } from 'sonner';

interface PerfilPageProps {
  onNavigate: (page: string) => void;
}

// Interfaz adaptada al nuevo JSON plano
interface UserData {
  row_number: number;
  "Fecha inscripción": string;
  "Programa": string;
  "Nombre del alumno": string;
  "DNI del alumno": number;
  "Fecha de nacimiento alumno": string;
  "Nombre del padre": string;
  "Correo": string;
  "Dirección": string;
  "DNI del padre": number;
  "Fecha inicio": string;
  "Fecha final": string;
  "Clases totales": number;
  "Días tentativos": string;
  "Talla uniforme": string;
  "Talla Polo": string;
  "Edad del alumno": string | number;
  "Categoría": string;
  "Precio del programa": number;
  "Precio a pagar": number;
  "Código promocional": string;
  "Descuento": number;
  "Contrato": string;
  "Contraseña": string;
  "Fecha": string; // Fecha del mensaje
  "Mensaje": string;
}

export function PerfilPage({ onNavigate }: PerfilPageProps) {
  // Asumimos que user ahora tiene la estructura de UserData
  const { user, logout, refreshUserData, isAuthenticated } = useAuth() as any; 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<'Activo' | 'Por Vencer' | 'Vencido'>('Activo');
  const [progress, setProgress] = useState(0);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('inicio-sesion');
    }
  }, [isAuthenticated, onNavigate]);

  // Calcular estado y progreso de la membresía
  useEffect(() => {
    if (user) {
      const fechaFin = new Date(user["Fecha final"]);
      const fechaInicio = new Date(user["Fecha inicio"]);
      const hoy = new Date();

      // Cálculo de días restantes
      const diffTime = fechaFin.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Cálculo de progreso (0 a 100%)
      const totalDuration = fechaFin.getTime() - fechaInicio.getTime();
      const elapsed = hoy.getTime() - fechaInicio.getTime();
      const percentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
      setProgress(percentage);

      // Determinar Estado
      if (diffDays < 0) {
        setStatus('Vencido');
      } else if (diffDays <= 15) {
        setStatus('Por Vencer');
      } else {
        setStatus('Activo');
      }
    }
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    toast.success('Información actualizada correctamente');
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Hasta pronto');
    onNavigate('home');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#FA7B21] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#FA7B21] animate-pulse font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Helpers para estilos dinámicos
  const getStatusColor = () => {
    switch (status) {
      case 'Activo': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Por Vencer': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Vencido': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Activo': return <CheckCircle2 className="w-4 h-4 mr-1" />;
      case 'Por Vencer': return <Clock className="w-4 h-4 mr-1" />;
      case 'Vencido': return <AlertTriangle className="w-4 h-4 mr-1" />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white font-sans selection:bg-[#FA7B21] selection:text-white">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FA7B21]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Navbar Simplificado */}
        <header className="flex items-center justify-between mb-8">
          <Button onClick={() => onNavigate('home')} variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 group">
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="icon" className={`border-white/10 bg-white/5 hover:bg-white/10 hover:text-[#FA7B21] ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleLogout} variant="outline" className="border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30">
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </header>

        {/* Hero Card: Estilo Ficha de Jugador */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Columna Izquierda: Identidad */}
          <Card className="md:col-span-2 bg-zinc-900/50 backdrop-blur-md border-zinc-800 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FA7B21]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start relative z-10">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#FA7B21] to-orange-600 p-[2px] shadow-2xl shadow-orange-500/20">
                  <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                    <User className="h-12 w-12 text-white/50" />
                    {/* Si tuvieras foto: <img src={user.foto} className="w-full h-full object-cover" /> */}
                  </div>
                </div>
                <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white border border-zinc-700 px-3 py-1 shadow-lg whitespace-nowrap">
                  {user["Categoría"]}
                </Badge>
              </div>
              
              <div className="text-center sm:text-left flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                      {user["Nombre del alumno"]}
                    </h1>
                    <p className="text-zinc-400 flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <Trophy className="w-4 h-4 text-[#FA7B21]" />
                      Programa: <span className="text-white font-medium">{user["Programa"]}</span>
                    </p>
                  </div>
                  <Badge variant="outline" className={`px-3 py-1 text-sm font-medium border ${getStatusColor()} flex items-center`}>
                    {getStatusIcon()}
                    {status.toUpperCase()}
                  </Badge>
                </div>
                
                {/* Progress Bar de Membresía */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500 font-medium">
                    <span>Inicio: {new Date(user["Fecha inicio"]).toLocaleDateString()}</span>
                    <span>Fin: {new Date(user["Fecha final"]).toLocaleDateString()}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                     <div 
                        className={`h-full transition-all duration-1000 ease-out ${
                          status === 'Vencido' ? 'bg-red-500' : 
                          status === 'Por Vencer' ? 'bg-yellow-500' : 'bg-[#FA7B21]'
                        }`}
                        style={{ width: `${progress}%` }}
                     />
                  </div>
                  {status === 'Por Vencer' && (
                    <p className="text-xs text-yellow-400 animate-pulse mt-1 text-center sm:text-right font-semibold">
                      ¡Tu plan está por terminar! Recuerda renovar.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Columna Derecha: Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <Card className="bg-zinc-900/50 backdrop-blur-md border-zinc-800 hover:border-[#FA7B21]/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-[#FA7B21]/10 rounded-lg">
                  <Shirt className="w-6 h-6 text-[#FA7B21]" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Tallas</p>
                  <p className="text-white font-medium">Uniforme: {user["Talla uniforme"]} • Polo: {user["Talla Polo"]}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 backdrop-blur-md border-zinc-800 hover:border-[#FA7B21]/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Días de Clase</p>
                  <p className="text-white font-medium text-sm">{user["Días tentativos"]}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900/50 backdrop-blur-md border-zinc-800 hover:border-[#FA7B21]/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                 <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Clases Totales</p>
                  <p className="text-white font-medium">{user["Clases totales"]}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tablero de Detalles */}
        <Tabs defaultValue="mensaje" className="w-full space-y-6">
          <TabsList className="w-full bg-zinc-900/80 p-1 border border-zinc-800 rounded-xl grid grid-cols-3 h-auto">
            <TabsTrigger value="mensaje" className="py-3 data-[state=active]:bg-[#FA7B21] data-[state=active]:text-white transition-all rounded-lg">
               <Megaphone className="w-4 h-4 mr-2" /> 
               <span className="hidden sm:inline">Avisos</span>
               <span className="sm:hidden">Avisos</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="py-3 data-[state=active]:bg-[#FA7B21] data-[state=active]:text-white transition-all rounded-lg">
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Datos Personales</span>
              <span className="sm:hidden">Datos</span>
            </TabsTrigger>
            <TabsTrigger value="pagos" className="py-3 data-[state=active]:bg-[#FA7B21] data-[state=active]:text-white transition-all rounded-lg">
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Finanzas</span>
              <span className="sm:hidden">Pagos</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: Mensajes y Avisos */}
          <TabsContent value="mensaje" className="space-y-4 focus-visible:outline-none">
            <Card className="border-l-4 border-l-[#FA7B21] bg-gradient-to-r from-[#FA7B21]/5 to-transparent border-y-zinc-800 border-r-zinc-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#FA7B21]/20 rounded-full">
                       <Megaphone className="h-5 w-5 text-[#FA7B21]" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">Comunicado Importante</CardTitle>
                      <CardDescription className="text-zinc-400 mt-1">
                        {user["Fecha"]}
                      </CardDescription>
                    </div>
                  </div>
                  {status === 'Por Vencer' && (
                    <Badge className="bg-red-500 animate-pulse text-white">Acción Requerida</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed text-lg">
                    {user["Mensaje"]}
                  </p>
                </div>
                {status !== 'Activo' && (
                  <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-zinc-400 text-sm text-center sm:text-left">
                      ¿Listo para renovar? No pierdas tus beneficios.
                    </p>
                    <Button className="bg-[#FA7B21] hover:bg-orange-600 text-white w-full sm:w-auto font-bold shadow-lg shadow-orange-500/20">
                      Contactar Administración
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Datos Personales */}
          <TabsContent value="info" className="focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tarjeta Alumno */}
              <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <User className="h-5 w-5 text-[#FA7B21]" />
                    Datos del Alumno
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">DNI</p>
                      <p className="text-white font-mono">{user["DNI del alumno"]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Fecha Nacimiento</p>
                      <p className="text-white">{user["Fecha de nacimiento alumno"]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Edad</p>
                      <p className="text-white">{user["Edad del alumno"] || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Contraseña Web</p>
                      <p className="text-white font-mono bg-zinc-800 px-2 py-1 rounded inline-block text-sm">
                        {user["Contraseña"]}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tarjeta Apoderado */}
              <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <User className="h-5 w-5 text-blue-400" />
                    Datos del Apoderado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-3">
                    <div>
                      <p className="text-xs text-zinc-500">Nombre Completo</p>
                      <p className="text-white font-medium">{user["Nombre del padre"]}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                        <p className="text-xs text-zinc-500">DNI</p>
                        <p className="text-white font-mono">{user["DNI del padre"]}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-zinc-800/50">
                      <Mail className="h-4 w-4 text-zinc-500 mt-1" />
                      <div>
                        <p className="text-xs text-zinc-500">Correo Electrónico</p>
                        <p className="text-white break-all">{user["Correo"]}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-zinc-500 mt-1" />
                      <div>
                        <p className="text-xs text-zinc-500">Dirección</p>
                        <p className="text-white">{user["Dirección"]}</p>
                      </div>
                    </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Finanzas */}
          <TabsContent value="pagos" className="focus-visible:outline-none">
             <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CreditCard className="h-5 w-5 text-green-400" />
                    Detalle del Plan Actual
                  </CardTitle>
                  <CardDescription>Resumen financiero de la inscripción vigente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Precio de Lista</span>
                        <span className="text-white font-mono">S/ {user["Precio del programa"]}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Descuento</span>
                        <span className="text-green-400 font-mono">- S/ {user["Descuento"]}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Código Promocional</span>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                          {user["Código promocional"]}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 flex flex-col justify-center items-center text-center space-y-2">
                      <span className="text-zinc-500 text-sm uppercase tracking-widest">Total a Pagar</span>
                      <span className="text-4xl font-bold text-white tracking-tight">
                        S/ {user["Precio a pagar"]}
                      </span>
                      <Badge className={`mt-2 ${status === 'Activo' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {status === 'Activo' ? 'Pagado y Vigente' : 'Renovación Pendiente'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-zinc-950/30 border-t border-zinc-800 p-4">
                  <p className="text-xs text-zinc-500 w-full text-center">
                    Contrato Ref: {user["Contrato"] || "N/A"} • Para facturas o recibos, solicítelo en recepción.
                  </p>
                </CardFooter>
             </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
