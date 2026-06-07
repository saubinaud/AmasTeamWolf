import { useMemo, useState } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  User, Phone, CheckCircle2, Clock, Award, Shield, Zap,
  Pencil, Save, X, Mail, MapPin, Gift, Copy, Users, Package
} from 'lucide-react';
import { CalendarCheck, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../ui/utils';
import { formatDate, toTitleCase, getApiUrl } from '../utils';

interface DashboardTabProps {
  user: any;
  isMobile: boolean;
  onNavigate: (page: string) => void;
  onSectionChange: (section: string) => void;
  onRefresh: () => Promise<void>;
}

export function DashboardTab({ user, isMobile, onNavigate: _onNavigate, onSectionChange, onRefresh }: DashboardTabProps) {
  // Apoderado edit state
  const [isEditingApoderado, setIsEditingApoderado] = useState(false);
  const [apoderadoForm, setApoderadoForm] = useState({
    nombre_apoderado: '',
    dni_apoderado: '',
    correo: '',
    telefono: '',
    direccion: '',
  });
  const [isSavingApoderado, setIsSavingApoderado] = useState(false);

  const totalAsistencias = user?.matricula?.clasesAsistidas || user?.asistencias?.filter((a: any) => a.estado === 'asistio').length || 0;

  const diasRestantes = useMemo(() => {
    if (!user?.matricula?.fechaFin) return 0;
    const hoy = new Date();
    const fin = new Date(user.matricula.fechaFin);
    return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }, [user?.matricula?.fechaFin]);

  const estaVencido = diasRestantes < 0;
  const diasVencido = estaVencido ? Math.abs(diasRestantes) : 0;
  const estaPorVencer = diasRestantes >= 0 && diasRestantes <= (isMobile ? 7 : 15);
  const progress = useMemo(() => {
    const total = user?.matricula?.clasesTotales || 0;
    if (total === 0) return 0;
    const asistidas = user?.matricula?.clasesAsistidas || 0;
    return Math.min(Math.round((asistidas / total) * 100), 100);
  }, [user?.matricula?.clasesTotales, user?.matricula?.clasesAsistidas]);

  // Desktop also uses time-based progress
  const progressTime = useMemo(() => {
    if (!user?.matricula?.fechaInicio || !user?.matricula?.fechaFin) return 0;
    const start = new Date(user.matricula.fechaInicio).getTime();
    const end = new Date(user.matricula.fechaFin).getTime();
    return Math.min(Math.max(((Date.now() - start) / (end - start)) * 100, 0), 100);
  }, [user?.matricula?.fechaInicio, user?.matricula?.fechaFin]);

  const startEditApoderado = () => {
    setApoderadoForm({
      nombre_apoderado: user?.familia?.nombreFamilia || '',
      dni_apoderado: user?.familia?.dniFamilia || '',
      correo: user?.familia?.email || '',
      telefono: user?.familia?.telefono || '',
      direccion: user?.familia?.direccion || '',
    });
    setIsEditingApoderado(true);
  };

  const cancelEditApoderado = () => {
    setIsEditingApoderado(false);
  };

  const saveApoderado = async () => {
    setIsSavingApoderado(true);
    try {
      const token = localStorage.getItem('amasToken');
      const res = await fetch(getApiUrl('/auth/perfil'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(apoderadoForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Datos actualizados');
        setIsEditingApoderado(false);
        await onRefresh();
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setIsSavingApoderado(false);
    }
  };

  if (isMobile) {
    return (
      <div key="home" className="space-y-6 animate-fade-in-up">
        {/* Progress Card */}
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 rounded-3xl p-6 border border-white/5">
          <div className="flex flex-col items-center gap-6">
            {/* Progress Ring */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="none" className="text-zinc-800/50" />
                <circle
                  cx="56" cy="56" r="48"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 3.02} 302`}
                  style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FA7B21" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn("font-bold", estaVencido ? "text-red-400" : "text-white")}
                  style={{ fontSize: '1.75rem' }}
                >
                  {user?.matricula?.clasesRestantes ?? Math.abs(diasRestantes)}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                  {estaVencido ? 'Vencido' : 'Clases'}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4 text-center w-full">
              <div>
                <p className="text-xs text-zinc-500 mb-1">{totalAsistencias} de {user?.matricula?.clasesTotales || '-'} clases</p>
                <p className="text-2xl font-bold">{Math.round(progress)}%</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-[9px] text-zinc-600 uppercase">Inicio</p>
                  <p className="text-sm text-zinc-300">{formatDate(user.matricula?.fechaInicio)}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-[9px] text-zinc-600 uppercase">Fin</p>
                  <p className="text-sm text-zinc-300">{formatDate(user.matricula?.fechaFin)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Program Eligibility Badges */}
        {(user.elegibleLeadership || user.elegibleFighter) && (
          <div className="space-y-3">
            {user.elegibleLeadership && (
              <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-300">Leadership Wolf</p>
                  <p className="text-xs text-amber-400/70">Ya puedes inscribirte al programa Leadership Wolf</p>
                </div>
              </div>
            )}
            {user.elegibleFighter && (
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-300">Fighter Wolf</p>
                  <p className="text-xs text-red-400/70">Ya puedes acceder al programa Fighter Wolf</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onSectionChange('calendar')}
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-left transition-all duration-200 hover:bg-emerald-500/15 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-400/80">Asistencias</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{user.matricula?.clasesAsistidas || totalAsistencias}</p>
            <p className="text-[10px] text-zinc-500">de {user.matricula?.clasesTotales || '-'}</p>
          </button>

          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 text-left">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] text-sky-400/80">Restantes</span>
            </div>
            <p className="text-2xl font-bold text-sky-400">{user.matricula?.clasesRestantes ?? '-'}</p>
            <p className="text-[10px] text-zinc-500">clases</p>
          </div>

          <button
            onClick={() => onSectionChange('plan')}
            className="bg-[#FA7B21]/10 border border-[#FA7B21]/20 rounded-2xl p-4 text-left transition-all duration-200 hover:bg-[#FA7B21]/15 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="w-3.5 h-3.5 text-[#FA7B21]" />
              <span className="text-[10px] text-[#FA7B21]/80">Membresia</span>
            </div>
            <p className="text-xs font-semibold text-orange-300 truncate">{user.matricula?.programa}</p>
            <p className="text-[10px] text-zinc-500">{user.matricula?.clasesTotales} clases</p>
          </button>
        </div>

        {/* Info Cards */}
        <div className="space-y-4">
          <h3 className="text-xs text-zinc-500 font-medium uppercase tracking-wider px-1">Informacion</h3>

          <div className="bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
            {[
              { icon: User, label: 'Alumno', value: user.estudiante?.nombre, extra: `DNI: ${user.estudiante?.dni}` },
              { icon: Shield, label: 'Edad', value: `${user.estudiante?.edad} anos`, tallas: true },
            ].map((item, i) => (
              <div key={i} className={cn(
                "p-4 flex items-center gap-4 transition-colors hover:bg-white/[0.02]",
                i > 0 && "border-t border-white/5"
              )}>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-medium truncate">{item.value}</p>
                </div>
                {item.extra && <span className="text-[10px] text-zinc-600 bg-white/5 px-2 py-1 rounded-lg">{item.extra}</span>}
                {item.tallas && (
                  <div className="flex gap-2">
                    <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded">U: {user.estudiante?.tallaUniforme}</span>
                    <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded">P: {user.estudiante?.tallaPolo}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Apoderado section (mobile) */}
          <div className="bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Mi informacion</h4>
              {!isEditingApoderado ? (
                <button onClick={startEditApoderado} className="flex items-center gap-1 text-[#FA7B21] text-xs font-medium hover:text-[#FCA929] transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={cancelEditApoderado} className="flex items-center gap-1 text-zinc-400 text-xs font-medium hover:text-zinc-300 transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                  <button onClick={saveApoderado} disabled={isSavingApoderado} className="flex items-center gap-1 text-emerald-400 text-xs font-medium hover:text-emerald-300 transition-colors disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" /> {isSavingApoderado ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>
            {isEditingApoderado ? (
              <div className="p-4 space-y-3">
                {[
                  { icon: User, label: 'Nombre', key: 'nombre_apoderado' as const },
                  { icon: Shield, label: 'DNI Apoderado', key: 'dni_apoderado' as const },
                  { icon: Mail, label: 'Correo', key: 'correo' as const },
                  { icon: Phone, label: 'Telefono', key: 'telefono' as const },
                  { icon: MapPin, label: 'Direccion', key: 'direccion' as const },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1">{item.label}</label>
                      <input
                        type={item.key === 'correo' ? 'email' : 'text'}
                        value={apoderadoForm[item.key]}
                        onChange={(e) => setApoderadoForm(prev => ({ ...prev, [item.key]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FA7B21]/50"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {[
                  { icon: User, label: 'Apoderado', value: user.familia?.nombreFamilia },
                  { icon: Shield, label: 'DNI', value: user.familia?.dniFamilia },
                  { icon: Mail, label: 'Email', value: user.familia?.email },
                  { icon: Phone, label: 'Telefono', value: user.familia?.telefono },
                  { icon: MapPin, label: 'Direccion', value: user.familia?.direccion },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "p-4 flex items-center gap-4 transition-colors hover:bg-white/[0.02]",
                    "border-t border-white/5"
                  )}>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-medium truncate">{item.value || '-'}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Referido Card */}
          {user?.codigoReferido && (
            <div className="bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FA7B21]/15 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-[#FA7B21]" />
                  </div>
                  <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Tu codigo de referido</h4>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-bold text-white tracking-widest bg-white/5 px-4 py-2 rounded-xl flex-1 text-center select-all">
                    {user.codigoReferido}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.codigoReferido || '');
                      toast.success('Codigo copiado');
                    }}
                    className="w-10 h-10 rounded-xl bg-[#FA7B21]/15 flex items-center justify-center hover:bg-[#FA7B21]/25 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-[#FA7B21]" />
                  </button>
                </div>
                <p className="text-xs text-zinc-400">Comparte este codigo y gana S/60 por cada amigo que se inscriba</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Bonos acumulados</span>
                  <span className="text-sm font-bold text-emerald-400">S/ {user.saldoBonos || 0}</span>
                </div>
                {user.referidos && user.referidos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Amigos referidos</span>
                    </div>
                    <div className="space-y-1.5">
                      {user.referidos.map((r: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-white/[0.02] rounded-lg px-3 py-2">
                          <span className="text-zinc-300">{r.nombre}</span>
                          <span className="text-zinc-600">{r.fecha ? formatDate(r.fecha) : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progreso de clases */}
          <div className="bg-zinc-900/40 rounded-2xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Progreso de clases</h4>
              <span className="text-sm font-bold text-[#FA7B21]">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ background: 'linear-gradient(to right, #FA7B21, #FCA929)', width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">
              {user?.matricula?.clasesAsistidas || 0} de {user?.matricula?.clasesTotales || 0} clases asistidas
            </p>
          </div>
        </div>

        {/* Mis Implementos */}
        <div className="bg-zinc-900/40 rounded-2xl border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Package className="w-4 h-4 text-violet-400" />
            </div>
            <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Mis implementos</h4>
          </div>
          {user?.implementos && user.implementos.length > 0 ? (
            <div className="space-y-2">
              {user.implementos.map((imp: any) => (
                <div key={imp.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-zinc-300 truncate">{imp.tipo || '-'}</span>
                    {imp.talla && <span className="text-[10px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0">T: {imp.talla}</span>}
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                    {imp.fechaAdquisicion
                      ? new Date(imp.fechaAdquisicion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', timeZone: 'America/Lima' })
                      : '-'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-zinc-500 text-sm">Aun no tienes implementos registrados</p>
              <p className="text-zinc-600 text-xs mt-1">Consulta con tu academia para adquirir uniformes, protectores y mas</p>
            </div>
          )}
        </div>

        <div>
          <Button
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-medium text-base transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
            onClick={() => window.open('https://wa.me/51989717412', '_blank')}
          >
            <Phone className="w-5 h-5 mr-2" /> Soporte WhatsApp
          </Button>
        </div>
      </div>
    );
  }

  // ── Desktop Dashboard ──
  return (
    <div
      key="home"
      className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up"
    >
      {/* Stats Cards */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 transition-all duration-200 hover:border-[#FA7B21]/30 hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#FA7B21]/20 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6 text-[#FCA929]" />
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-none">Activo</Badge>
        </div>
        <p className="text-white/60 text-sm mb-1">Asistencias</p>
        <p className="text-4xl font-bold text-white">{totalAsistencias}</p>
        <p className="text-white/40 text-xs mt-2">clases asistidas</p>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 transition-all duration-200 hover:border-[#FA7B21]/30 hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#FA7B21]/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-[#FCA929]" />
          </div>
          <Badge className={cn(
            "border-none",
            estaVencido ? "bg-red-500/20 text-red-400" :
              estaPorVencer ? "bg-amber-500/20 text-amber-400" :
                "bg-[#FA7B21]/20 text-[#FCA929]"
          )}>
            {estaVencido ? 'Vencido' : estaPorVencer ? 'Por vencer' : 'Vigente'}
          </Badge>
        </div>
        <p className="text-white/60 text-sm mb-1">Dias restantes</p>
        <p className={cn(
          "text-4xl font-bold",
          estaVencido ? "text-red-400" : estaPorVencer ? "text-amber-400" : "text-white"
        )}>
          {estaVencido ? diasVencido : diasRestantes}
        </p>
        <p className="text-white/40 text-xs mt-2">
          hasta {formatDate(user?.matricula?.fechaFin)}
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 transition-all duration-200 hover:border-[#FA7B21]/30 hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#FA7B21]/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-[#FCA929]" />
          </div>
          <Badge className="bg-[#FA7B21]/20 text-[#FCA929] border-none">
            {Math.round(progressTime)}%
          </Badge>
        </div>
        <p className="text-white/60 text-sm mb-1">Progreso</p>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressTime}%` }}
          />
        </div>
        <p className="text-white/40 text-xs mt-2">del programa completado</p>
      </div>

      {/* Info Section */}
      <div className="col-span-2 lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 transition-colors hover:border-[#FA7B21]/20">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-[#FCA929]" />
          Informacion del Estudiante
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-white/40 text-sm">Nombre completo</p>
              <p className="text-white text-lg">{toTitleCase(user?.estudiante?.nombre || '-')}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm">DNI</p>
              <p className="text-white text-lg">{user?.estudiante?.dni || '-'}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm">Edad</p>
              <p className="text-white text-lg">{user?.estudiante?.edad ? `${user.estudiante.edad} anos` : '-'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-white/40 text-sm">Fecha de Inicio</p>
              <p className="text-white text-lg">{formatDate(user?.matricula?.fechaInicio) || '-'}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm">Horario</p>
              <p className="text-white text-lg">{user?.clases?.[0]?.horario || '-'}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm">Talla Uniforme</p>
              <p className="text-white text-lg">{user?.estudiante?.tallaUniforme || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mi informacion (Apoderado) - Desktop */}
      <div className="col-span-2 lg:col-span-3 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 transition-colors hover:border-[#FA7B21]/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#FCA929]" />
            Mi informacion
          </h3>
          {!isEditingApoderado ? (
            <button onClick={startEditApoderado} className="flex items-center gap-1.5 text-[#FA7B21] text-sm font-medium hover:text-[#FCA929] transition-colors">
              <Pencil className="w-4 h-4" /> Editar
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={cancelEditApoderado} className="flex items-center gap-1.5 text-zinc-400 text-sm font-medium hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={saveApoderado} disabled={isSavingApoderado} className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" /> {isSavingApoderado ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
        {isEditingApoderado ? (
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: User, label: 'Nombre', key: 'nombre_apoderado' as const },
              { icon: Shield, label: 'DNI Apoderado', key: 'dni_apoderado' as const },
              { icon: Mail, label: 'Correo', key: 'correo' as const },
              { icon: Phone, label: 'Telefono', key: 'telefono' as const },
              { icon: MapPin, label: 'Direccion', key: 'direccion' as const, colSpan: true },
            ].map((item) => (
              <div key={item.key} className={item.colSpan ? 'col-span-2' : ''}>
                <label className="text-white/40 text-sm block mb-1">{item.label}</label>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <item.icon className="w-4 h-4 text-[#FCA929] flex-shrink-0" />
                  <input
                    type={item.key === 'correo' ? 'email' : 'text'}
                    value={apoderadoForm[item.key]}
                    onChange={(e) => setApoderadoForm(prev => ({ ...prev, [item.key]: e.target.value }))}
                    className="flex-1 bg-transparent border-none text-white text-sm placeholder-zinc-600 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-white/40 text-sm">Nombre</p>
                <p className="text-white text-lg">{toTitleCase(user?.familia?.nombreFamilia || '-')}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm">DNI</p>
                <p className="text-white text-lg">{user?.familia?.dniFamilia || '-'}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm">Correo</p>
                <p className="text-white text-lg truncate">{user?.familia?.email || '-'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-white/40 text-sm">Telefono</p>
                <p className="text-white text-lg">{user?.familia?.telefono || '-'}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm">Direccion</p>
                <p className="text-white text-lg">{user?.familia?.direccion || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progreso de clases */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white/60">Progreso de clases</h4>
            <span className="text-sm font-bold text-[#FA7B21]">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ background: 'linear-gradient(to right, #FA7B21, #FCA929)', width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-white/40">
            {user?.matricula?.clasesAsistidas || 0} de {user?.matricula?.clasesTotales || 0} clases asistidas
          </p>
        </div>
      </div>
    </div>
  );
}
