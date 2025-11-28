import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
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
  Sparkles,
  Megaphone,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface PerfilPageProps {
  onNavigate: (page: string) => void;
}

export function PerfilPage({ onNavigate }: PerfilPageProps) {
  // 1. OBTENER LOS DATOS CRUDOS
  const { user, logout, refreshUserData, isAuthenticated } = useAuth() as any;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 2. EXTRAER LOS DATOS DEL ARRAY (SOLUCIÓN AL PROBLEMA DE CARGA)
  // Si 'user' es una lista [ {datos...} ], sacamos el primero con user[0].
  // Si 'user' ya es el objeto {datos...}, lo usamos directo.
  const userData = user && Array.isArray(user) ? user[0] : user;

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

  // 3. PANTALLA DE CARGA (Si userData es null o undefined)
  if (!userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FA7B21] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/50 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // 4. HELPERS VISUALES SEGÚN EL JSON
  const getStatusColor = (estado: string) => {
    const status = estado?.toLowerCase() || '';
    if (status.includes('pagado') || status.includes('activo')) return 'bg-green-500/10 text-green-400 border-green-500/50';
    if (status.includes('vencido')) return 'bg-red-500/10 text-red-400 border-red-500/50';
    if (status.includes('vencer')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50';
    return 'bg-white/10 text-white border-white/20';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FA7B21] selection:text-black pb-10">
      
      {/* Fondo Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FA7B21]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6">
        
        {/* Header de Navegación */}
        <div className="flex justify-between items-center mb-6">
          <Button onClick={() => onNavigate('home')} variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5 mr-2" /> Volver
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} size="icon" variant="outline" className="border-white/10 bg-white/5 text-white hover:text-[#FA7B21]">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleLogout} size="icon" variant="outline" className="border-white/10 bg-white/5 text-white hover:text-red-500">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* --- TARJETA PRINCIPAL (DATOS DEL ALUMNO) --- */}
        <Card className="bg-zinc-900/80 backdrop-blur-md border-zinc-800 overflow-hidden mb-6 relative">
          {/* Barra lateral de color según estado */}
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${userData["Estado"] === 'Pagado' ? 'bg-green-500' : 'bg-[#FA7B21]'}`} />
          
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-[#FA7B21]/50 text-[#FA7B21] bg-[#FA7B21]/10 px-3">
                    {userData["Categoría"]}
                  </Badge>
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                    {userData["Programa"]}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {userData["Nombre del alumno"]}
                </h1>
                <p className="text-zinc-400 flex items-center gap-2 text-sm">
                   <User className="h-4 w-4" />
                   DNI: {userData["DNI del alumno"]}
                </p>
              </div>

              {/* Estado Badge Grande */}
              <div className={`px-5 py-2 rounded-xl border flex flex-col items-center justify-center min-w-[140px] ${getStatusColor(userData["Estado"])}`}>
                 <span className="text-xs font-bold uppercase tracking-wider opacity-80">Estado</span>
                 <span className="text-lg font-bold flex items-center gap-2">
                    {userData["Estado"] === 'Pagado' && <CheckCircle2 className="h-4 w-4" />}
                    {userData["Estado"]}
                 </span>
              </div>
            </div>
            
            {/* Grid de Datos Rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
               <div>
                  <p className="text-xs text-zinc-500 uppercase">Inicio</p>
                  <p className="text-white font-medium">{userData["Fecha inicio"]}</p>
               </div>
               <div>
                  <p className="text-xs text-zinc-500 uppercase">Fin</p>
                  <p className="text-white font-medium">{userData["Fecha final"]}</p>
               </div>
               <div>
                  <p className="text-xs text-zinc-500 uppercase">Días</p>
                  <p className="text-white font-medium truncate">{userData["Días tentativos"]}</p>
               </div>
               <div>
                  <p className="text-xs text-zinc-500 uppercase">Tallas</p>
                  <p className="text-white font-medium text-sm">U: {userData["Talla uniforme"]} / P: {userData["Talla Polo"]}</p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* --- PESTAÑAS --- */}
        <Tabs defaultValue="avisos" className="w-full">
          <TabsList className="w-full bg-zinc-900 border border-zinc-800 p-1 mb-6 h-auto grid grid-cols-3 rounded-lg">
            <TabsTrigger value="avisos" className="py-3 data-[state=active]:bg-[#FA7B21] data-[state=active]:text-white text-zinc-400 transition-all rounded">
              <Megaphone className="h-4 w-4 mr-2" /> Avisos
            </TabsTrigger>
            <TabsTrigger value="padres" className="py-3 data-[state=active]:bg-[#FA7B21] data-[state=active]:text-white text-zinc-400 transition-all rounded">
              <User className="h-4 w-4 mr-2" /> Padres
            </TabsTrigger>
            <TabsTrigger value="plan" className="py-3 data-[state=active]:bg-[#FA7B21] data-[state=active]:text-white text-zinc-400 transition-all rounded">
              <CreditCard className="h-4 w-4 mr-2" /> Plan
            </TabsTrigger>
          </TabsList>

          {/* 1. AVISOS (Mensaje + Fecha) */}
          <TabsContent value="avisos" className="mt-0">
             <Card className="border-[#FA7B21]/30 bg-gradient-to-br from-[#FA7B21]/5 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <div className="flex items-center gap-2 text-[#FA7B21]">
                      <Sparkles className="h-5 w-5" />
                      <CardTitle className="text-lg">Comunicado</CardTitle>
                   </div>
                   {/* Fecha arriba del mensaje */}
                   <Badge variant="outline" className="border-[#FA7B21]/40 text-white bg-black/40">
                      {userData["Fecha"]}
                   </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                   {userData["Mensaje"] ? (
                     <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                        <p className="text-zinc-100 whitespace-pre-wrap leading-relaxed text-base">
                           {userData["Mensaje"]}
                        </p>
                     </div>
                   ) : (
                      <p className="text-center text-zinc-500 py-8">No hay mensajes nuevos.</p>
                   )}
                </CardContent>
             </Card>
          </TabsContent>

          {/* 2. PADRES (Datos del tutor) */}
          <TabsContent value="padres" className="mt-0">
             <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                   <CardTitle className="text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      Información del Apoderado
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                         <p className="text-xs text-zinc-500 uppercase">Nombre Completo</p>
                         <p className="text-white text-lg font-medium">{userData["Nombre del padre"]}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-xs text-zinc-500 uppercase">DNI</p>
                         <p className="text-white font-mono bg-white/5 inline-block px-2 py-1 rounded">{userData["DNI del padre"]}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-xs text-zinc-500 uppercase">Correo Electrónico</p>
                         <div className="flex items-center gap-2 text-white">
                            <Mail className="h-4 w-4 text-[#FA7B21]" />
                            {userData["Correo"]}
                         </div>
                      </div>
                      <div className="space-y-1">
                         <p className="text-xs text-zinc-500 uppercase">Dirección</p>
                         <div className="flex items-center gap-2 text-white">
                            <MapPin className="h-4 w-4 text-[#FA7B21]" />
                            {userData["Dirección"]}
                         </div>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* 3. PLAN (Finanzas) */}
          <TabsContent value="plan" className="mt-0">
             <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                   <CardTitle className="text-white flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-400" />
                      Detalles Financieros
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-full space-y-3 flex-1">
                         <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-zinc-400">Precio Regular</span>
                            <span className="text-white">S/ {userData["Precio del programa"]}</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-zinc-400">Descuento</span>
                            <span className="text-green-400 font-bold">- S/ {userData["Descuento"]}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Contraseña Web</span>
                            <span className="font-mono text-[#FA7B21] bg-[#FA7B21]/10 px-2 rounded text-sm">{userData["Contraseña"]}</span>
                         </div>
                      </div>
                      
                      <div className="bg-black p-6 rounded-xl border border-zinc-800 text-center w-full md:w-auto min-w-[200px]">
                         <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Total a Pagar</p>
                         <p className="text-4xl font-bold text-white mb-2">S/ {userData["Precio a pagar"]}</p>
                         <Badge className={getStatusColor(userData["Estado"])}>
                            {userData["Estado"]?.toUpperCase()}
                         </Badge>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
