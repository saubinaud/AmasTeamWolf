import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  BookOpen,
  Bell,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Check,
  Clock,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

interface PerfilPageProps {
  onNavigate: (page: string) => void;
}

export function PerfilPage({ onNavigate }: PerfilPageProps) {
  const { user, logout, refreshUserData, isAuthenticated } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('inicio-sesion');
    }
  }, [isAuthenticated, onNavigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    toast.success('Información actualizada');
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    onNavigate('home');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FA7B21] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/50 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  const unreadNotifications = user.notificaciones?.filter(n => !n.leido).length || 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(250, 123, 33, 0.15) 0%, transparent 50%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 80% 50%, rgba(252, 169, 41, 0.2) 0%, transparent 60%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen p-4 sm:p-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => onNavigate('home')}
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-[#FCA929] hover:bg-[#FA7B21]/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  style={{
                    background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Mi Perfil
                </h1>
                <p className="text-white/60">Panel de familia</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="icon"
                className="border-white/20 text-white hover:text-[#FCA929] hover:bg-[#FA7B21]/10 hover:border-[#FA7B21]"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-white/20 text-white hover:text-red-400 hover:bg-red-500/10 hover:border-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto">
          {/* Info Card */}
          <Card className="bg-black/60 backdrop-blur-xl border-[#FA7B21]/30 shadow-2xl shadow-[#FA7B21]/10 mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <GraduationCap className="h-6 w-6 text-[#FA7B21]" />
                    {user.familia.nombreFamilia}
                  </CardTitle>
                  <CardDescription className="text-white/60 mt-2">
                    Estudiante: {user.familia.estudiante}
                  </CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white">
                  {user.matricula.estado === 'activa' ? 'Activo' : user.matricula.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-white/80">
                  <Mail className="h-5 w-5 text-[#FA7B21]" />
                  <span>{user.familia.email}</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Phone className="h-5 w-5 text-[#FA7B21]" />
                  <span>{user.familia.telefono}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="matricula" className="w-full">
            <TabsList className="w-full bg-black/40 backdrop-blur-xl border border-white/10 p-1">
              <TabsTrigger
                value="matricula"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FA7B21] data-[state=active]:to-[#FCA929] data-[state=active]:text-white text-white/60"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Matrícula
              </TabsTrigger>
              <TabsTrigger
                value="clases"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FA7B21] data-[state=active]:to-[#FCA929] data-[state=active]:text-white text-white/60"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Clases
              </TabsTrigger>
              <TabsTrigger
                value="pagos"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FA7B21] data-[state=active]:to-[#FCA929] data-[state=active]:text-white text-white/60"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pagos
              </TabsTrigger>
              <TabsTrigger
                value="notificaciones"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FA7B21] data-[state=active]:to-[#FCA929] data-[state=active]:text-white text-white/60 relative"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
                {unreadNotifications > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white px-1.5 py-0 text-xs h-5 min-w-5">
                    {unreadNotifications}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Matrícula Tab */}
            <TabsContent value="matricula" className="mt-6">
              <Card className="bg-black/60 backdrop-blur-xl border-[#FA7B21]/30">
                <CardHeader>
                  <CardTitle className="text-white">Información de Matrícula</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Programa</p>
                      <p className="text-white text-lg font-semibold">{user.matricula.programa}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Estado</p>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        {user.matricula.estado}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Fecha de inicio</p>
                      <p className="text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#FA7B21]" />
                        {new Date(user.matricula.fechaInicio).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Fecha de fin</p>
                      <p className="text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#FA7B21]" />
                        {new Date(user.matricula.fechaFin).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clases Tab */}
            <TabsContent value="clases" className="mt-6">
              <Card className="bg-black/60 backdrop-blur-xl border-[#FA7B21]/30">
                <CardHeader>
                  <CardTitle className="text-white">Horarios de Clases</CardTitle>
                  <CardDescription className="text-white/60">
                    Tus horarios asignados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.clases && user.clases.length > 0 ? (
                    <div className="space-y-3">
                      {user.clases.map((clase, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#FA7B21]/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-[#FA7B21]" />
                            <p className="text-white font-medium">{clase.horario}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-center py-8">No hay horarios asignados</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pagos Tab */}
            <TabsContent value="pagos" className="mt-6">
              <div className="space-y-4">
                {/* Próximo Pago */}
                {user.pagos.proximoPago && (
                  <Card className="bg-black/60 backdrop-blur-xl border-[#FA7B21]/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        Próximo Pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-white/60 text-sm">Fecha de vencimiento</p>
                          <p className="text-white text-lg font-semibold">
                            {new Date(user.pagos.proximoPago.fecha).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60 text-sm mb-1">Monto</p>
                          <p className="text-3xl font-bold text-[#FA7B21]">
                            S/ {user.pagos.proximoPago.monto}
                          </p>
                          <Badge className="mt-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                            {user.pagos.proximoPago.estado}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Último Pago */}
                {user.pagos.ultimoPago && (
                  <Card className="bg-black/60 backdrop-blur-xl border-[#FA7B21]/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        Último Pago Realizado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-white/60 text-sm">Fecha de pago</p>
                          <p className="text-white text-lg font-semibold">
                            {new Date(user.pagos.ultimoPago.fecha).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60 text-sm mb-1">Monto pagado</p>
                          <p className="text-3xl font-bold text-green-500">
                            S/ {user.pagos.ultimoPago.monto}
                          </p>
                          <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/50">
                            {user.pagos.ultimoPago.estado}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Notificaciones Tab */}
            <TabsContent value="notificaciones" className="mt-6">
              <Card className="bg-black/60 backdrop-blur-xl border-[#FA7B21]/30">
                <CardHeader>
                  <CardTitle className="text-white">Notificaciones</CardTitle>
                  <CardDescription className="text-white/60">
                    Mantente al día con tus avisos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.notificaciones && user.notificaciones.length > 0 ? (
                    <div className="space-y-3">
                      {user.notificaciones.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            notif.leido
                              ? 'bg-white/5 border-white/10'
                              : 'bg-[#FA7B21]/10 border-[#FA7B21]/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={
                                  notif.tipo === 'pago'
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                }>
                                  {notif.tipo}
                                </Badge>
                                {!notif.leido && (
                                  <span className="w-2 h-2 bg-[#FA7B21] rounded-full"></span>
                                )}
                              </div>
                              <p className="text-white font-medium mb-1">{notif.mensaje}</p>
                              <p className="text-white/40 text-sm">
                                {new Date(notif.fecha).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-center py-8">No hay notificaciones</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
