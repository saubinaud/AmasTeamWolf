import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../config/api';

// --- Types ---

interface Bloque {
  id: string;
  tipo: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'date' | 'textarea' | 'number' | 'heading' | 'paragraph' | 'image' | 'divider' | 'map';
  etiqueta?: string;
  placeholder?: string;
  requerido?: boolean;
  contenido?: string;
  opciones?: string[];
}

interface Formulario {
  titulo: string;
  descripcion?: string;
  color_tema?: string;
  mensaje_exito?: string;
  publicado?: boolean;
  imagen_portada?: string;
}

interface FormData {
  formulario: Formulario;
  bloques: Bloque[];
}

// --- Helpers ---

const INPUT_TYPES: Bloque['tipo'][] = ['text', 'email', 'phone', 'select', 'checkbox', 'date', 'textarea', 'number'];
function isInputBlock(tipo: Bloque['tipo']): boolean {
  return INPUT_TYPES.includes(tipo);
}

// --- Component ---

export default function FormularioPublicoPage() {
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<Formulario | null>(null);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [datos, setDatos] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch form data
  useEffect(() => {
    if (!slug) {
      setError('Formulario no encontrado');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchForm() {
      try {
        const res = await fetch(`${API_BASE}/formularios/${slug}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Formulario no encontrado' : 'Error al cargar el formulario');
        }
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error('Formulario no disponible');
        }

        const { formulario, bloques: bloquesData } = json.data as FormData;

        if (!formulario.publicado) {
          throw new Error('Este formulario no está disponible');
        }

        if (!cancelled) {
          setFormConfig(formulario);
          setBloques(bloquesData);

          // Initialize form state for input blocks
          const initial: Record<string, string> = {};
          for (const b of bloquesData) {
            if (isInputBlock(b.tipo)) {
              initial[b.id] = b.tipo === 'checkbox' ? 'false' : '';
            }
          }
          setDatos(initial);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
          setLoading(false);
        }
      }
    }

    fetchForm();
    return () => { cancelled = true; };
  }, [slug]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle input change
  function handleChange(blockId: string, value: string) {
    setDatos(prev => ({ ...prev, [blockId]: value }));
    if (validationErrors[blockId]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[blockId];
        return next;
      });
    }
  }

  // Validate
  function validate(): boolean {
    const errors: Record<string, string> = {};

    for (const b of bloques) {
      if (!isInputBlock(b.tipo)) continue;

      const val = (datos[b.id] || '').trim();

      if (b.requerido && (!val || (b.tipo === 'checkbox' && val !== 'true'))) {
        errors[b.id] = 'Este campo es obligatorio';
        continue;
      }

      if (val && b.tipo === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors[b.id] = 'Correo electrónico inválido';
        }
      }

      if (val && b.tipo === 'phone') {
        if (!/^[0-9\s\-+()]{7,15}$/.test(val)) {
          errors[b.id] = 'Número de teléfono inválido';
        }
      }
    }

    setValidationErrors(errors);

    // Scroll to first error
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const el = document.getElementById(`field-${errorKeys[0]}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return errorKeys.length === 0;
  }

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      // Only send input block data
      const payload: Record<string, string> = {};
      for (const b of bloques) {
        if (isInputBlock(b.tipo) && datos[b.id] !== undefined) {
          payload[b.id] = datos[b.id];
        }
      }

      const res = await fetch(`${API_BASE}/formularios/${slug}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos: payload }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Error al enviar el formulario');
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setValidationErrors({
        _form: err instanceof Error ? err.message : 'Error al enviar. Intenta nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Accent color from form config
  const accent = formConfig?.color_tema || '#FA7B21';

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-[#FA7B21] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm font-medium">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Formulario no disponible</h2>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white font-semibold rounded-xl active:scale-95 transition-all"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // --- SUCCESS STATE ---
  if (submitted && formConfig) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-lg w-full formulario-success-enter">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden">
            {/* Celebration particles */}
            <div className="formulario-confetti" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="formulario-confetti-piece" style={{
                  left: `${8 + (i * 7.5)}%`,
                  animationDelay: `${i * 0.1}s`,
                  backgroundColor: i % 3 === 0 ? accent : i % 3 === 1 ? '#FCA929' : '#ffffff',
                }} />
              ))}
            </div>

            <div className="relative z-10">
              {/* Checkmark */}
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center formulario-check-bounce"
                style={{ background: `linear-gradient(135deg, ${accent}, #FCA929)` }}
              >
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="formulario-check-draw" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                {formConfig.mensaje_exito || 'Respuesta enviada con \u00e9xito'}
              </h2>
              <p className="text-white/60 text-sm mb-6">Gracias por completar el formulario.</p>

              <a
                href="/"
                className="inline-block px-6 py-3 text-white font-semibold rounded-xl active:scale-95 transition-all"
                style={{ background: `linear-gradient(to right, ${accent}, #FCA929)` }}
              >
                Volver al inicio
              </a>
            </div>
          </div>
        </div>

        <style>{`
          .formulario-success-enter {
            animation: formulario-fade-up 0.5s ease-out;
          }
          @keyframes formulario-fade-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .formulario-check-bounce {
            animation: formulario-bounce 0.6s ease-out 0.2s both;
          }
          @keyframes formulario-bounce {
            0% { transform: scale(0); }
            60% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          .formulario-check-draw {
            stroke-dasharray: 24;
            stroke-dashoffset: 24;
            animation: formulario-draw 0.4s ease-out 0.5s forwards;
          }
          @keyframes formulario-draw {
            to { stroke-dashoffset: 0; }
          }
          .formulario-confetti {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
          }
          .formulario-confetti-piece {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 2px;
            top: -10px;
            animation: formulario-confetti-fall 1.5s ease-out forwards;
          }
          @keyframes formulario-confetti-fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // --- FORM STATE ---
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header bar with accent */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${accent}, #FCA929)` }} />

      <div className="max-w-lg mx-auto px-4 py-8 pb-16">
        {/* Form header */}
        <div className="mb-8">
          {formConfig?.imagen_portada && (
            <img
              src={formConfig.imagen_portada}
              alt=""
              className="w-full h-48 object-cover rounded-2xl mb-6"
              loading="lazy"
            />
          )}
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: accent }}
          >
            {formConfig?.titulo}
          </h1>
          {formConfig?.descripcion && (
            <p className="text-white/60 text-sm">{formConfig.descripcion}</p>
          )}
        </div>

        {/* Global form error */}
        {validationErrors._form && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{validationErrors._form}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            {bloques.map((bloque) => (
              <BlockRenderer
                key={bloque.id}
                bloque={bloque}
                value={datos[bloque.id] || ''}
                onChange={(val) => handleChange(bloque.id, val)}
                error={validationErrors[bloque.id]}
                accent={accent}
              />
            ))}
          </div>

          {/* Submit button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 text-white font-bold text-base rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, ${accent}, #FCA929)`,
                fontSize: '16px',
                minHeight: '48px',
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enviando...
                </span>
              ) : (
                'Enviar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Block Renderer ---

interface BlockRendererProps {
  bloque: Bloque;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  accent: string;
}

function BlockRenderer({ bloque, value, onChange, error, accent }: BlockRendererProps) {
  const { tipo, etiqueta, placeholder, requerido, contenido, opciones } = bloque;

  // --- Content blocks ---

  if (tipo === 'heading') {
    return (
      <h2
        className="text-xl font-bold pt-2"
        style={{
          backgroundImage: `linear-gradient(to right, ${accent}, #FCA929)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {contenido}
      </h2>
    );
  }

  if (tipo === 'paragraph') {
    return <p className="text-white/70 text-sm leading-relaxed">{contenido}</p>;
  }

  if (tipo === 'image') {
    return (
      <img
        src={contenido}
        alt=""
        className="w-full rounded-xl object-cover max-h-80"
        loading="lazy"
      />
    );
  }

  if (tipo === 'divider') {
    return (
      <div className="py-2">
        <hr className="border-0 h-px bg-white/10" />
      </div>
    );
  }

  if (tipo === 'map') {
    return (
      <div className="rounded-xl overflow-hidden border border-white/10">
        <iframe
          src={contenido}
          className="w-full h-56 border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ubicación"
        />
      </div>
    );
  }

  // --- Input blocks ---

  const inputBaseClass = `w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 transition-all duration-200 ${
    error
      ? 'border-red-400 focus:ring-red-400/30'
      : 'border-white/20 focus:border-transparent'
  }`;

  const inputStyle = {
    fontSize: '16px',
    minHeight: '48px',
    ...(!error ? { '--tw-ring-color': `${accent}40` } as React.CSSProperties : {}),
  };

  const labelEl = etiqueta ? (
    <label htmlFor={`field-${bloque.id}`} className="block text-white/80 text-sm font-medium mb-1.5">
      {etiqueta}
      {requerido && <span className="text-[#FA7B21] ml-1">*</span>}
    </label>
  ) : null;

  const errorEl = error ? (
    <p className="text-red-400 text-xs mt-1">{error}</p>
  ) : null;

  if (tipo === 'checkbox') {
    return (
      <div id={`field-${bloque.id}`} className="flex items-start gap-3 py-1">
        <input
          type="checkbox"
          id={`input-${bloque.id}`}
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="mt-0.5 w-5 h-5 rounded border-white/20 bg-zinc-800 accent-[#FA7B21] cursor-pointer flex-shrink-0"
          style={{ accentColor: accent }}
        />
        <label htmlFor={`input-${bloque.id}`} className="text-white/80 text-sm cursor-pointer select-none">
          {etiqueta}
          {requerido && <span className="text-[#FA7B21] ml-1">*</span>}
        </label>
        {errorEl}
      </div>
    );
  }

  if (tipo === 'select') {
    return (
      <div id={`field-${bloque.id}`}>
        {labelEl}
        <select
          id={`input-${bloque.id}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputBaseClass}
          style={inputStyle}
        >
          <option value="" className="bg-zinc-800 text-white">{placeholder || 'Seleccionar...'}</option>
          {(opciones || []).map((opt) => (
            <option key={opt} value={opt} className="bg-zinc-800 text-white">{opt}</option>
          ))}
        </select>
        {errorEl}
      </div>
    );
  }

  if (tipo === 'textarea') {
    return (
      <div id={`field-${bloque.id}`}>
        {labelEl}
        <textarea
          id={`input-${bloque.id}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={inputBaseClass + ' resize-y'}
          style={{ fontSize: '16px', minHeight: '100px' }}
        />
        {errorEl}
      </div>
    );
  }

  // text, email, phone, number, date
  const typeMap: Record<string, string> = {
    text: 'text',
    email: 'email',
    phone: 'tel',
    number: 'number',
    date: 'date',
  };

  return (
    <div id={`field-${bloque.id}`}>
      {labelEl}
      <input
        id={`input-${bloque.id}`}
        type={typeMap[tipo] || 'text'}
        inputMode={tipo === 'phone' ? 'tel' : tipo === 'number' ? 'numeric' : tipo === 'email' ? 'email' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={tipo === 'phone' ? (placeholder || '999 999 999') : placeholder}
        className={inputBaseClass}
        style={inputStyle}
      />
      {errorEl}
    </div>
  );
}
