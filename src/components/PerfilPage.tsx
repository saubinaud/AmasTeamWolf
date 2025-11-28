import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
  AlertTriangle,
  CheckCircle2,
  Megaphone,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';

interface PerfilPageProps {
  onNavigate: (page: string) => void;
}

export function PerfilPage({ onNavigate }: PerfilPageProps) {
  // 1. OBTENCIÓN DE DATOS
  const { user, logout, refreshUserData, isAuthenticated } = useAuth() as any;
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados para la lógica visual
  const [estado, setEstado] = useState<'Activo' | 'Por Vencer' | 'Vencido'>('Activo');
  const [diasRestantes, setDiasRestantes] = useState(0);
  const [progreso, setProgreso] = useState(0);

  // 2. CORRECCIÓN CRÍTICA: Convertir el Array en Objeto utilizable
  // Si 'user' es una lista [{}], tomamos el primero. Si es objeto, lo usamos directo.
  const data = user && Array.isArray(user) ? user[0] : user;

  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('inicio-sesion');
    }
  }, [isAuthenticated, onNavigate]);

  // 3. LÓGICA DE ESTADO (Cálculo de fechas)
  useEffect(() => {
    if (data && data["Fecha final"]) {
      try {
        const fin = new Date(data["Fecha final"]);
        const inicio = new Date(data["Fecha inicio"]);
        const hoy = new Date();

        // Días restantes
        const diffTime = fin.getTime() - hoy.getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDiasRestantes(days);

        // Barra de progreso
        const total = fin.getTime() - inicio.getTime();
        const actual = hoy.getTime() - inicio.getTime();
        const porc = Math.min(Math.max((actual / total) * 100, 0), 100);
        setProgreso(porc);

        // Determinar etiqueta
        if (days < 0) setEstado('Vencido');
        else if (days <= 15) setEstado('Por Vencer');
        else setEstado('Activo');

      } catch (e) {
        console.error("Error calculando fechas", e);
      }
    }
  }, [data]);

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

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#FA7B21] animate-pulse font-bold text-xl">Cargando perfil...</div>
      </div>
    );
  }

  // Configuración de colores según estado
  const colorEstado = {
    Activo: "text-green-400 border-green-500/50 bg-green-500/10",
    'Por Vencer': "text-yellow-400 border-yellow-500/50 bg-yellow-500/10",
    Vencido: "text-red-500 border-red-500/50 bg-red-500/10"
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-[#FA7B21] selection:text-white pb-10">
      
      {/* Fondo Decorativo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FA7B21]/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6">
        
        {/* HEADER SIMPLE */}
        <header className="flex justify-between items-center mb-6">
          <Button onClick={() => onNavigate('home')} variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5 mr-2" /> Inicio
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} size="icon" variant="ghost" className={`text-zinc-400 hover:text-[#FA7B21] ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button onClick={handleLogout} size="icon" variant="ghost" className="text-zinc-400 hover:text-red-500">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* --- TARJETA HERO (EL CAMBIO VISUAL GRANDE) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Panel Izquierdo: Info Alumno y Estado */}
          <Card className="md:col-span-2 border-zinc-800 bg-zinc-900/50 backdrop-blur-xl relative overflow-hidden group">
            {/* Barra lateral de estado */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-500 ${
              estado === 'Activo' ? 'bg-green-500' : estado === 'Vencido' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <Badge variant="outline" className="mb-3 border-[#FA7B21]/30 text-[#FA7B21] bg-[#FA7B21]/5">
                    {data["Categoría"] || "Estudiante"}
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight mb-1">
                    {data["Nombre del alumno"]}
                  </h1>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Trophy className="h-4 w-4 text-[#FA7B21]" />
                    {data["Programa"]}
                  </div>
                </div>

                {/* Badge Grande de Estado */}
                <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${colorEstado[estado]}`}>
                  {estado === 'Activo' && <CheckCircle2 className="h-5 w-5" />}
                  {estado === 'Por Vencer' && <Clock className="h-5 w-5 animate-pulse" />}
                  {estado === 'Vencido' && <AlertTriangle className="h-5 w-5" />}
                  <span className="font-bold uppercase tracking-wider">{estado}</span>
                </div>
              </div>

              {/* Barra de Progreso Visual */}
              <div className="mt-8">
                <div className="flex justify-between text-xs text-zinc-500 mb-2 font-medium">
                  <span>Progreso del plan</span>
                  <span>{diasRestantes > 0 ? `${diasRestantes} días restantes` : 'Finalizado'}</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      estado === 'Activo' ? 'bg-[#FA7B21]' : estado === 'Vencido' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${progreso}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-mono">
                  <span>INICIO: {data["Fecha inicio"]}</span>
                  <span>FIN: {data["Fecha final"]}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Panel Derecho: Datos Rápidos */}
          <div className="flex flex-col gap-4">
             <Card className="flex-1 border-zinc-800 bg-zinc-900/50 backdrop-blur-xl flex flex-col justify-center items-center text-center p-6">
                <Shirt className="h-8 w-8 text-[#FA7B21] mb-2" />
                <p className="text-zinc-500 text-xs uppercase font-bold">Tallas</p>
                <p className="text-white font-medium">Uniforme: {data["Talla uniforme"]}</p>
                <p className="text-white font-medium">Polo: {data["Talla Polo"]}</p>
             </Card>
             <Card className="flex-1 border-zinc-800 bg-zinc-900/50 backdrop-blur-xl flex flex-col justify-center items-center text-center p-6">
                <Calendar className="h-8 w-8 text-blue-500 mb-2" />
                <p className="text-zinc-500 text-xs uppercase font-bold">Días</p>
                <p className="text-white font-medium text-sm">{data["Días tentativos"]}</p>
             </Card>
          </div>
        </div>

        {/* --- PESTAÑAS (FUNCIONALIDAD MEJORADA) --- */}
        <Tabs defaultValue="avisos" className="w-full">
          <TabsList className="w-full bg-zinc-900 border border-zinc-800 p-1 mb-6 rounded-lg h-auto grid grid-cols-3">
            <TabsTrigger value="avisos" className="py-3 text-zinc-400 data-[state=active]:bg-[#FA7B21] data-[state=active]:text-white rounded-md transition-all">
              <Megaphone className="h-4 w-4 mr-2" /> Avisos
            </TabsTrigger>
            <TabsTrigger value="info" className="py-3 text-zinc-400 data-[state=active]:bg-[#FA7B21] data-[state=active]:text-white rounded-md transition-all">
              <User className="h-4 w-4 mr-2" /> Datos
            </TabsTrigger>
            <TabsTrigger value="pagos" className="py-3 text-zinc-400 data-[state=active]:bg-[#FA7B21] data-[state=active]:text-white rounded-md transition-all">
              <CreditCard className="h-4 w-4 mr-2" /> Pagos
            </TabsTrigger>
          </TabsList>

          {/* 1. PESTAÑA AVISOS (Mensaje + Fecha) */}
          <TabsContent value="avisos" className="animate-in fade-in zoom-in-95 duration-300">
            <Card className="border-[#FA7B21]/30 bg-gradient-to-br from-[#FA7B21]/10 to-transparent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#FA7B21] flex items-center gap-2">
                    <Sparkles className="h-5 w-5" /> Novedades
                  </CardTitle>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                    {data["Fecha"]}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {data["Mensaje"] ? (
                   <div className="bg-zinc-950/50 p-6 rounded-xl border border-white/5">
                      <p className="text-zinc-100 whitespace-pre-wrap leading-relaxed">
                        {data["Mensaje"]}
                      </p>
                      {estado !== 'Activo' && (
                        <Button className="w-full mt-6 bg-[#FA7B21] hover:bg-orange-600 text-white font-bold">
                          Renovar Membresía Ahora
                        </Button>
                      )}
                   </div>
                ) : (
                  <p className="text-center text-zinc-500 py-10">No hay avisos nuevos</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. PESTAÑA DATOS (Padre y Alumno) */}
          <TabsContent value="info" className="animate-in fade-in zoom-in-95 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader><CardTitle className="text-base text-zinc-400">Alumno</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500 text-sm">DNI</span>
                    <span className="text-white">{data["DNI del alumno"]}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500 text-sm">Nacimiento</span>
                    <span className="text-white">{data["Fecha de nacimiento alumno"]}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500 text-sm">Contraseña Web</span>
                    <span className="text-[#FA7B21] font-mono">{data["Contraseña"]}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader><CardTitle className="text-base text-zinc-400">Padre / Tutor</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500 text-sm">Nombre</span>
                    <span className="text-white text-right">{data["Nombre del padre"]}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500 text-sm">DNI</span>
                    <span className="text-white">{data["DNI del padre"]}</span>
                  </div>
                  <div className="flex flex-col gap-1 pt-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Mail className="h-3 w-3" /> {data["Correo"]}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <MapPin className="h-3 w-3" /> {data["Dirección"]}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 3. PESTAÑA PAGOS (Nuevo estilo financiero) */}
          <TabsContent value="pagos" className="animate-in fade-in zoom-in-95 duration-300">
             <Card className="bg-zinc-900/50 border-zinc-800">
               <CardContent className="p-6">
                 <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 w-full space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Costo del Programa</span>
                        <span className="text-white font-mono">S/ {data["Precio del programa"]}</span>
                      </div>
                      <div className="flex justify-between items-center text-green-400">
                        <span>Descuento</span>
                        <span className="font-mono">- S/ {data["Descuento"]}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                         <span className="text-zinc-500">Cupón aplicado</span>
                         <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                           {data["Código promocional"]}
                         </Badge>
                      </div>
                    </div>

                    <div className="w-full md:w-auto bg-black p-6 rounded-xl border border-zinc-800 text-center min-w-[200px]">
                       <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Total a Pagar</p>
                       <p className="text-3xl font-bold text-white mb-2">S/ {data["Precio a pagar"]}</p>
                       <Badge className={colorEstado[estado]}>
                         {estado === 'Activo' ? 'PAGADO' : 'PENDIENTE'}
                       </Badge>
                    </div>
                 </div>
                 <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
                    <p className="text-[10px] text-zinc-600 font-mono uppercase">
                      Contrato ID: {data["Contrato"] || "N/A"} • Documento válido para control interno
                    </p>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
