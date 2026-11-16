import React, { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';
import { trackEvent } from '../../utils/pixel';
import { enlaceWhatsApp } from '../../config/contacto';
import { API_BASE } from '../../config/api';
import { ui, claseOpcion } from '../../styles/marca';

interface FormularioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Campos {
  nombrePadre: string;
  telefono: string;
  nombreAlumno: string;
  nacimiento: string; // DD/MM/AAAA tal como se escribe
  email: string;
  dia: string; // ISO del día preferido ('' = sin preferencia)
  objetivo: string;
}

const VACIO: Campos = { nombrePadre: '', telefono: '', nombreAlumno: '', nacimiento: '', email: '', dia: '', objetivo: '' };

/** Próximos días con clases (lunes a sábado), desde mañana. */
function proximosDias(cuantos = 6) {
  const dias: { iso: string; corto: string; numero: number; largo: string }[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (dias.length < cuantos) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) continue; // domingo no hay clases
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dias.push({
      iso,
      corto: d.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''),
      numero: d.getDate(),
      largo: d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }),
    });
  }
  return dias;
}

/** "120319" → "12/03/19": barras automáticas mientras se escribe. */
function enmascarar(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 8);
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4, 8)].filter(Boolean).join('/');
}

/** DD/MM/AAAA válido y en el pasado → AAAA-MM-DD; si no, null. */
function aIso(v: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return null;
  const [, dd, mm, aaaa] = m;
  const f = new Date(Number(aaaa), Number(mm) - 1, Number(dd));
  if (f.getFullYear() !== Number(aaaa) || f.getMonth() !== Number(mm) - 1 || f.getDate() !== Number(dd)) return null;
  if (f > new Date() || Number(aaaa) < 1990) return null;
  return `${aaaa}-${mm}-${dd}`;
}

export function FormularioModal({ isOpen, onOpenChange }: FormularioModalProps) {
  const [enviando, setEnviando] = useState(false);
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof Campos, string>>>({});
  const dias = useMemo(() => proximosDias(), [isOpen]);

  const cambiar = (k: keyof Campos, v: string) => {
    setCampos((c) => ({ ...c, [k]: v }));
    if (errores[k]) setErrores((e) => ({ ...e, [k]: undefined }));
  };

  const validar = () => {
    const e: typeof errores = {};
    if (campos.nombrePadre.trim().length < 3) e.nombrePadre = 'Escribe tu nombre y apellido';
    if (campos.telefono.replace(/\D/g, '').length < 9) e.telefono = 'Escribe un número de 9 dígitos';
    if (campos.nombreAlumno.trim().length < 2) e.nombreAlumno = 'Escribe el nombre de tu hijo o hija';
    if (!aIso(campos.nacimiento)) e.nacimiento = campos.nacimiento ? 'Revisa la fecha (día/mes/año)' : 'Escribe su fecha de nacimiento';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email.trim())) e.email = campos.email.trim() ? 'Revisa el correo' : 'Escribe tu correo';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validar()) return;
    setEnviando(true);
    const dia = dias.find((d) => d.iso === campos.dia);
    try {
      const r = await fetch(`${API_BASE}/leads/showroom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_padre: campos.nombrePadre.trim(),
          nombre_alumno: campos.nombreAlumno.trim(),
          telefono: campos.telefono.trim(),
          email: campos.email.trim(),
          fecha_nacimiento: aIso(campos.nacimiento),
          objetivo: campos.objetivo.trim(),
          horario: dia ? `Prefiere ${dia.largo}` : '',
          source: 'landing_clase_prueba',
          timestamp: new Date().toISOString(),
        }),
      });
      if (!r.ok) throw new Error('Error en el servidor');

      toast.success('Listo. Te llevamos a WhatsApp para confirmar.');
      trackEvent('Lead', { content_name: 'LandingForm', content_category: 'TrialClass', value: 0.0, currency: 'PEN' });
      const mensaje =
        `Hola, soy ${campos.nombrePadre.trim()}. Acabo de registrarme para la clase de prueba de ${campos.nombreAlumno.trim()}.` +
        (dia ? ` Preferimos el ${dia.largo}.` : '');
      window.open(enlaceWhatsApp(mensaje), '_blank');
      onOpenChange(false);
      setCampos(VACIO);
    } catch {
      toast.error('No se pudo enviar. Inténtalo otra vez o escríbenos por WhatsApp.');
    } finally {
      setEnviando(false);
    }
  };

  const err = (k: keyof Campos) => (errores[k] ? <p className={ui.error}>{errores[k]}</p> : null);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border border-white/10 bg-zinc-950 p-6 text-white sm:max-w-lg sm:p-8">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-bold tracking-tight text-white">Agendar clase de prueba</DialogTitle>
          <DialogDescription className="text-white/60">
            Déjanos tus datos y te escribimos por WhatsApp para confirmar el día y la hora.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} noValidate className="mt-2 space-y-5">
          <div>
            <label htmlFor="cp-padre" className={ui.label}>Tu nombre</label>
            <input id="cp-padre" className={ui.input} autoComplete="name" placeholder="Nombre y apellido"
              value={campos.nombrePadre} onChange={(e) => cambiar('nombrePadre', e.target.value)} />
            {err('nombrePadre')}
          </div>

          <div>
            <label htmlFor="cp-tel" className={ui.label}>WhatsApp</label>
            <input id="cp-tel" className={ui.input} type="tel" inputMode="tel" autoComplete="tel" placeholder="9XX XXX XXX"
              value={campos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} />
            {err('telefono')}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="cp-alumno" className={ui.label}>Nombre de tu hijo o hija</label>
              <input id="cp-alumno" className={ui.input} placeholder="Nombre"
                value={campos.nombreAlumno} onChange={(e) => cambiar('nombreAlumno', e.target.value)} />
              {err('nombreAlumno')}
            </div>
            <div>
              <label htmlFor="cp-nac" className={ui.label}>Fecha de nacimiento</label>
              <input id="cp-nac" className={`${ui.input} tabular-nums`} inputMode="numeric" autoComplete="off" placeholder="DD/MM/AAAA"
                value={campos.nacimiento} onChange={(e) => cambiar('nacimiento', enmascarar(e.target.value))} />
              {err('nacimiento')}
            </div>
          </div>

          <div>
            <label htmlFor="cp-correo" className={ui.label}>Correo</label>
            <input id="cp-correo" className={ui.input} type="email" inputMode="email" autoComplete="email" placeholder="tu@correo.com"
              value={campos.email} onChange={(e) => cambiar('email', e.target.value)} />
            {err('email')}
          </div>

          <fieldset>
            <legend className={ui.label}>¿Qué día prefieres venir? <span className="font-normal text-white/40">(opcional)</span></legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {dias.map((d) => {
                const activo = campos.dia === d.iso;
                return (
                  <button key={d.iso} type="button" aria-pressed={activo} aria-label={d.largo}
                    onClick={() => cambiar('dia', activo ? '' : d.iso)}
                    className={`${claseOpcion(activo)} flex-col py-2`}>
                    <span className="text-xs capitalize text-white/55">{d.corto}</span>
                    <span className="text-lg font-semibold tabular-nums">{d.numero}</span>
                  </button>
                );
              })}
            </div>
            <p className={ui.ayuda}>Te confirmamos la hora por WhatsApp.</p>
          </fieldset>

          <div>
            <label htmlFor="cp-obj" className={ui.label}>¿Qué te gustaría que mejore? <span className="font-normal text-white/40">(opcional)</span></label>
            <textarea id="cp-obj" rows={3} className={`${ui.input} resize-none`} placeholder="Ej. disciplina, confianza, concentración"
              value={campos.objetivo} onChange={(e) => cambiar('objetivo', e.target.value)} />
          </div>

          <button type="submit" disabled={enviando} className={`w-full ${ui.btnPrimary}`}>
            {enviando && <Loader2 className="h-5 w-5 animate-spin" />}
            {enviando ? 'Enviando…' : 'Agendar mi clase de prueba'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
