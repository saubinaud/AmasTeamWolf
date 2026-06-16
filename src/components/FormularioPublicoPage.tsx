import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../config/api';
import {
  Mail, Phone, Type, Hash, Calendar, FileText, ChevronDown,
  Upload, MapPin, Star, Play, Minus, CheckCircle2, Lock, Zap,
  AlertCircle, Loader2, ArrowLeft, ChevronRight
} from 'lucide-react';

// --- Types ---

type BloqueType =
  | 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'date' | 'textarea' | 'number'
  | 'heading' | 'paragraph' | 'image' | 'divider' | 'map' | 'rating' | 'file' | 'spacer' | 'video'
  | 'hero' | 'cards_grid' | 'testimonial' | 'faq' | 'cta' | 'stats' | 'gallery';

interface Bloque {
  id: string;
  tipo: BloqueType;
  etiqueta?: string;
  placeholder?: string;
  requerido?: boolean;
  contenido?: string;
  opciones?: string[];
  config?: Record<string, any>;
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

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : url;
}

const INPUT_TYPES: BloqueType[] = ['text', 'email', 'phone', 'select', 'checkbox', 'date', 'textarea', 'number', 'rating', 'file'];
const RICH_TYPES: BloqueType[] = ['hero', 'cards_grid', 'testimonial', 'faq', 'cta', 'stats', 'gallery'];
function isInputBlock(tipo: BloqueType): boolean {
  return INPUT_TYPES.includes(tipo);
}
function isRichBlock(tipo: BloqueType): boolean {
  return RICH_TYPES.includes(tipo);
}

const DEFAULT_BG = 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1920/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg';

// --- CSS Animations ---
const FORM_STYLES = `
  @keyframes fp-fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fp-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fp-bounce-in {
    0% { transform: scale(0); }
    60% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
  @keyframes fp-draw-check {
    to { stroke-dashoffset: 0; }
  }
  @keyframes fp-confetti {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(350px) rotate(720deg); opacity: 0; }
  }
  @keyframes fp-glow-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  @keyframes fp-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fp-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .fp-animate-up {
    animation: fp-fade-up 0.6s ease-out both;
  }
  .fp-animate-up-1 { animation-delay: 0.1s; }
  .fp-animate-up-2 { animation-delay: 0.2s; }
  .fp-animate-up-3 { animation-delay: 0.3s; }
  .fp-animate-up-4 { animation-delay: 0.4s; }
  .fp-animate-fade {
    animation: fp-fade-in 0.5s ease-out both;
  }
  .fp-star-hover:hover {
    transform: scale(1.2);
  }
  .fp-star-hover:active {
    transform: scale(0.9);
  }
  .fp-input-focus:focus {
    border-color: var(--fp-accent, #FA7B21) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--fp-accent, #FA7B21) 20%, transparent);
  }
  .fp-input-error {
    border-color: #f87171 !important;
    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15);
  }
  .fp-file-drop {
    transition: all 0.2s ease;
  }
  .fp-file-drop:hover {
    border-color: var(--fp-accent, #FA7B21);
    background: rgba(250, 123, 33, 0.05);
  }
`;

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const el = document.getElementById(`field-${errorKeys[0]}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return errorKeys.length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
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

  const accent = formConfig?.color_tema || '#FA7B21';
  const bgImage = formConfig?.imagen_portada || DEFAULT_BG;
  const hasPhoneBlock = bloques.some(b => b.tipo === 'phone');

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <style>{FORM_STYLES}</style>
        <div className="flex flex-col items-center gap-4 fp-animate-fade">
          <div className="relative">
            <div className="w-16 h-16 rounded-full" style={{
              border: `3px solid ${accent}20`,
              borderTopColor: accent,
              animation: 'fp-spin 0.8s linear infinite',
            }} />
            <div className="absolute inset-0 rounded-full" style={{
              background: `radial-gradient(circle, ${accent}10, transparent)`,
              animation: 'fp-glow-pulse 2s ease-in-out infinite',
            }} />
          </div>
          <p className="text-white/50 text-sm font-medium tracking-wide">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <style>{FORM_STYLES}</style>
        {/* Background texture */}
        <div className="fixed inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #FA7B21 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        <div className="text-center max-w-md relative z-10 fp-animate-up">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-zinc-900/80 backdrop-blur border border-white/10 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">Formulario no disponible</h2>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${accent}, #FCA929)` }}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // --- SUCCESS STATE ---
  if (submitted && formConfig) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <style>{FORM_STYLES}</style>

        {/* Background */}
        <div className="fixed inset-0" style={{
          backgroundImage: `url('${bgImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div className="fixed inset-0 bg-black/85" />
        <div className="fixed inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, #FA7B21 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />

        <div className="max-w-lg w-full relative z-10" style={{ animation: 'fp-fade-up 0.5s ease-out' }}>
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">

            {/* Glow behind card */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{
              background: `radial-gradient(circle, ${accent}, transparent)`,
            }} />

            {/* Confetti */}
            <div className="absolute top-0 left-0 right-0 h-full pointer-events-none overflow-hidden" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="absolute w-2 h-2 rounded-sm -top-2" style={{
                  left: `${5 + (i * 5.2)}%`,
                  animationDelay: `${i * 0.08}s`,
                  backgroundColor: i % 4 === 0 ? accent : i % 4 === 1 ? '#FCA929' : i % 4 === 2 ? '#ffffff' : '#FFD700',
                  animation: 'fp-confetti 1.8s ease-out forwards',
                }} />
              ))}
            </div>

            <div className="relative z-10">
              {/* Check circle */}
              <div
                className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accent}, #FCA929)`,
                  boxShadow: `0 0 60px ${accent}40`,
                  animation: 'fp-bounce-in 0.6s ease-out 0.2s both',
                }}
              >
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{
                    strokeDasharray: 24,
                    strokeDashoffset: 24,
                    animation: 'fp-draw-check 0.4s ease-out 0.5s forwards',
                  }} />
                </svg>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {formConfig.mensaje_exito || 'Respuesta enviada con \u00e9xito'}
              </h2>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">
                Gracias por completar el formulario. Tu respuesta ha sido registrada.
              </p>

              <a
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${accent}, #FCA929)`,
                  boxShadow: `0 4px 20px ${accent}30`,
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </a>
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex justify-center mt-6">
            <span className="text-white/30 text-xs flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Formulario seguro por AMAS
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- FORM STATE ---
  return (
    <div className="min-h-screen bg-black" style={{ '--fp-accent': accent } as React.CSSProperties}>
      <style>{FORM_STYLES}</style>

      {/* ======= HERO SECTION ======= */}
      <section className="relative min-h-[50vh] md:min-h-[45vh] flex items-end overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url('${bgImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(circle, #FA7B21 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-15" style={{
          background: `radial-gradient(circle, ${accent}, transparent 70%)`,
        }} />

        {/* Hero content */}
        <div className="relative z-10 w-full px-4 pb-16 pt-20 max-w-3xl mx-auto px-5 md:px-20 lg:px-[100px] text-center">
          {/* Badge */}
          <div className="fp-animate-up fp-animate-up-1 mb-6">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white px-5 py-2 rounded-full text-xs md:text-sm font-semibold">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
              Formulario abierto
            </span>
          </div>

          {/* Title */}
          <h1 className="fp-animate-up fp-animate-up-2 text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight px-2" style={{
            backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${accent} 50%, #FCA929 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {formConfig?.titulo}
          </h1>

          {/* Description */}
          {formConfig?.descripcion && (
            <p className="fp-animate-up fp-animate-up-3 text-white/50 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              {formConfig.descripcion}
            </p>
          )}
        </div>
      </section>

      {/* ======= CONTENT SECTIONS ======= */}
      <section className="relative pb-16">
        {/* Subtle background texture */}
        <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #FA7B21 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />

        <form onSubmit={handleSubmit} noValidate>
          {(() => {
            // Group bloques: consecutive non-rich blocks go into a "form-card" group,
            // each rich block is its own group
            const groups: { type: 'card' | 'rich'; bloques: Bloque[] }[] = [];
            let currentCard: Bloque[] = [];

            for (const b of bloques) {
              if (isRichBlock(b.tipo)) {
                if (currentCard.length > 0) {
                  groups.push({ type: 'card', bloques: currentCard });
                  currentCard = [];
                }
                groups.push({ type: 'rich', bloques: [b] });
              } else {
                currentCard.push(b);
              }
            }
            if (currentCard.length > 0) {
              groups.push({ type: 'card', bloques: currentCard });
            }

            // If there are no form-card groups at all (only rich blocks), add an empty one for the submit button
            const hasFormCard = groups.some(g => g.type === 'card');

            return (
              <div className="space-y-0">
                {groups.map((group, gIdx) => {
                  if (group.type === 'rich') {
                    const bloque = group.bloques[0];
                    return (
                      <div key={`rich-${bloque.id}`} className="fp-animate-up" style={{ animationDelay: `${0.3 + gIdx * 0.08}s` }}>
                        <RichBlockRenderer bloque={bloque} accent={accent} />
                      </div>
                    );
                  }

                  // Form card group
                  const isLastCardGroup = !groups.slice(gIdx + 1).some(g => g.type === 'card');
                  return (
                    <div key={`card-${gIdx}`} className="px-4 py-4">
                      <div className="max-w-3xl mx-auto px-5 md:px-20 lg:px-[100px] relative z-10">
                        <div
                          className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 fp-animate-up"
                          style={{ boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 80px ${accent}08`, animationDelay: `${0.3 + gIdx * 0.08}s` }}
                        >
                          {/* Global form error on first card */}
                          {gIdx === 0 && validationErrors._form && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                              <p className="text-red-400 text-sm">{validationErrors._form}</p>
                            </div>
                          )}

                          <div className="space-y-6">
                            {group.bloques.map((bloque, idx) => (
                              <div key={bloque.id} style={{ animationDelay: `${0.4 + idx * 0.04}s` }} className="fp-animate-up">
                                <BlockRenderer
                                  bloque={bloque}
                                  value={datos[bloque.id] || ''}
                                  onChange={(val) => handleChange(bloque.id, val)}
                                  error={validationErrors[bloque.id]}
                                  accent={accent}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Submit button on last card group */}
                          {isLastCardGroup && (
                            <div className="mt-10">
                              <button
                                type="submit"
                                disabled={submitting}
                                className="group w-full relative py-4 px-6 text-white font-bold text-base rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                                style={{
                                  background: `linear-gradient(135deg, ${accent}, #FCA929)`,
                                  fontSize: '16px',
                                  minHeight: '52px',
                                  boxShadow: `0 4px 20px ${accent}30`,
                                }}
                              >
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                                  backgroundSize: '200% 100%',
                                  animation: 'fp-shimmer 2s linear infinite',
                                }} />
                                <span className="relative z-10">
                                  {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      Enviando...
                                    </span>
                                  ) : (
                                    'Enviar respuesta'
                                  )}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Submit button if there are no card groups */}
                {!hasFormCard && bloques.some(b => isInputBlock(b.tipo)) && (
                  <div className="px-4 py-4">
                    <div className="max-w-3xl mx-auto px-5 md:px-20 lg:px-[100px]">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="group w-full relative py-4 px-6 text-white font-bold text-base rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${accent}, #FCA929)`,
                          fontSize: '16px',
                          minHeight: '52px',
                          boxShadow: `0 4px 20px ${accent}30`,
                        }}
                      >
                        <span className="relative z-10">
                          {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Enviando...
                            </span>
                          ) : (
                            'Enviar respuesta'
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </form>

        {/* Trust signals */}
        <div className="max-w-3xl mx-auto px-5 md:px-20 lg:px-[100px]">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-6 fp-animate-up" style={{ animationDelay: '0.6s' }}>
            <span className="flex items-center gap-2 text-white/30 text-xs">
              <Lock className="w-3.5 h-3.5" />
              Informaci&oacute;n segura
            </span>
            <span className="flex items-center gap-2 text-white/30 text-xs">
              <Zap className="w-3.5 h-3.5" />
              Respuesta inmediata
            </span>
          </div>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-white/20 text-xs tracking-wide">
          <span className="font-bold" style={{
            backgroundImage: `linear-gradient(135deg, ${accent}, #FCA929)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>AMAS</span>
          {' '}&copy; {new Date().getFullYear()}. Todos los derechos reservados.
        </p>
      </footer>

      {/* ======= WHATSAPP FAB ======= */}
      {hasPhoneBlock && (
        <a
          href="https://wa.me/51999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            background: '#25D366',
            boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
          }}
          aria-label="Contactar por WhatsApp"
        >
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
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
        className="text-xl md:text-2xl font-bold pt-3 pb-1"
        style={{
          backgroundImage: `linear-gradient(135deg, ${accent}, #FCA929)`,
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
    return (
      <p className="text-white/60 text-sm md:text-base leading-relaxed">
        {contenido}
      </p>
    );
  }

  if (tipo === 'image') {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/10" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <img
          src={contenido}
          alt=""
          className="w-full object-cover max-h-80"
          loading="lazy"
        />
      </div>
    );
  }

  if (tipo === 'divider') {
    return (
      <div className="py-3">
        <div className="h-px" style={{
          background: `linear-gradient(to right, transparent, ${accent}30, transparent)`,
        }} />
      </div>
    );
  }

  if (tipo === 'map') {
    const address = contenido || '';
    const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
    return (
      <div>
        <div className="rounded-2xl overflow-hidden border border-white/10" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <iframe
            src={mapSrc}
            className="w-full border-0"
            style={{ height: '250px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación"
          />
        </div>
        {address && (
          <div className="flex items-center gap-2 mt-2 px-1">
            <MapPin className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <span className="text-white/40 text-xs">{address}</span>
          </div>
        )}
      </div>
    );
  }

  if (tipo === 'spacer') {
    return <div style={{ height: parseInt(bloque.config?.height || '40', 10) }} />;
  }

  if (tipo === 'video') {
    const videoId = contenido ? extractYouTubeId(contenido) : '';
    if (!videoId) return null;
    return (
      <div className="rounded-2xl overflow-hidden border border-white/10 relative group" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          className="w-full aspect-video border-0"
          allowFullScreen
          loading="lazy"
          title="Video"
        />
      </div>
    );
  }

  // --- Input blocks ---

  const inputBaseClass = [
    'w-full bg-zinc-800/50 border rounded-xl px-4 py-3 text-white placeholder:text-white/30',
    'outline-none transition-all duration-200 fp-input-focus',
    error ? 'fp-input-error border-red-400' : 'border-white/10 hover:border-white/20',
  ].join(' ');

  const inputStyle: React.CSSProperties = {
    fontSize: '16px',
    minHeight: '48px',
  };

  const iconMap: Record<string, React.ReactNode> = {
    text: <Type className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    phone: <Phone className="w-4 h-4" />,
    number: <Hash className="w-4 h-4" />,
    date: <Calendar className="w-4 h-4" />,
  };

  const labelEl = etiqueta ? (
    <label htmlFor={`field-${bloque.id}`} className="flex items-center gap-2 text-white/70 text-sm font-medium mb-2">
      {iconMap[tipo] && <span className="text-white/30">{iconMap[tipo]}</span>}
      <span>{etiqueta}</span>
      {requerido && <span style={{ color: accent }}>*</span>}
    </label>
  ) : null;

  const errorEl = error ? (
    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {error}
    </p>
  ) : null;

  if (tipo === 'checkbox') {
    const isChecked = value === 'true';
    return (
      <div id={`field-${bloque.id}`}>
        <label
          htmlFor={`input-${bloque.id}`}
          className="flex items-start gap-3 py-1 cursor-pointer group"
        >
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              id={`input-${bloque.id}`}
              checked={isChecked}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              className="sr-only"
            />
            <div
              className="w-5 h-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center"
              style={{
                borderColor: isChecked ? accent : 'rgba(255,255,255,0.2)',
                backgroundColor: isChecked ? accent : 'transparent',
              }}
            >
              {isChecked && (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              )}
            </div>
          </div>
          <span className="text-white/70 text-sm select-none group-hover:text-white/90 transition-colors">
            {etiqueta}
            {requerido && <span className="ml-1" style={{ color: accent }}>*</span>}
          </span>
        </label>
        {errorEl}
      </div>
    );
  }

  if (tipo === 'select') {
    return (
      <div id={`field-${bloque.id}`}>
        {labelEl}
        <div className="relative">
          <select
            id={`input-${bloque.id}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputBaseClass + ' appearance-none pr-10'}
            style={inputStyle}
          >
            <option value="" className="bg-zinc-900 text-white/40">{placeholder || 'Seleccionar...'}</option>
            {(opciones || []).map((opt) => (
              <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>
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
          style={{ fontSize: '16px', minHeight: '120px' }}
        />
        {errorEl}
      </div>
    );
  }

  if (tipo === 'rating') {
    const currentRating = parseInt(value) || 0;
    const [hoverRating, setHoverRating] = useState(0);
    const displayRating = hoverRating || currentRating;
    return (
      <div id={`field-${bloque.id}`}>
        {labelEl}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(String(star))}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1.5 transition-all duration-150 fp-star-hover rounded-lg hover:bg-white/5"
              style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Star
                className="w-7 h-7 transition-colors duration-150"
                fill={star <= displayRating ? '#FBBF24' : 'none'}
                color={star <= displayRating ? '#FBBF24' : 'rgba(255,255,255,0.15)'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        {errorEl}
      </div>
    );
  }

  if (tipo === 'file') {
    return (
      <div id={`field-${bloque.id}`}>
        {labelEl}
        <label
          htmlFor={`input-${bloque.id}`}
          className="fp-file-drop flex flex-col items-center gap-3 w-full bg-zinc-800/30 border-2 border-dashed border-white/10 rounded-2xl px-6 py-8 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
            <Upload className="w-5 h-5 text-white/40" />
          </div>
          <div className="text-center">
            <p className="text-white/50 text-sm">
              {value ? (
                <span className="text-white/80 font-medium">{value}</span>
              ) : (
                <>
                  <span className="font-medium" style={{ color: accent }}>Subir archivo</span>
                  <span className="text-white/30"> o arrastra aqu&iacute;</span>
                </>
              )}
            </p>
          </div>
          <input
            id={`input-${bloque.id}`}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              onChange(file ? file.name : '');
            }}
            className="sr-only"
          />
        </label>
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

// --- Rich Block Renderer ---

interface RichBlockRendererProps {
  bloque: Bloque;
  accent: string;
}

function RichBlockRenderer({ bloque, accent }: RichBlockRendererProps) {
  const { tipo, contenido, config } = bloque;

  if (tipo === 'hero') {
    const bgUrl = config?.background_url || '';
    return (
      <section className="relative min-h-[40vh] md:min-h-[50vh] flex items-center overflow-hidden">
        {bgUrl && (
          <div className="absolute inset-0" style={{
            backgroundImage: `url('${bgUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, #FA7B21 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-15" style={{
          background: `radial-gradient(circle, ${accent}, transparent 70%)`,
        }} />
        <div className="relative z-10 w-full px-4 py-16 max-w-3xl mx-auto px-5 md:px-20 lg:px-[100px] text-center">
          {config?.badge && (
            <div className="mb-5 fp-animate-up fp-animate-up-1">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white px-5 py-2 rounded-full text-xs md:text-sm font-semibold">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
                {config.badge}
              </span>
            </div>
          )}
          {contenido && (
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight fp-animate-up fp-animate-up-2" style={{
              backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${accent} 50%, #FCA929 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {contenido}
            </h2>
          )}
          {config?.subtitle && (
            <p className="text-white/50 text-sm md:text-lg max-w-xl mx-auto leading-relaxed mb-6 fp-animate-up fp-animate-up-3">
              {config.subtitle}
            </p>
          )}
          {config?.cta_text && (
            <div className="fp-animate-up" style={{ animationDelay: '0.4s' }}>
              <button
                type="button"
                onClick={() => {
                  const formEl = document.querySelector('form');
                  const firstInput = formEl?.querySelector('input, select, textarea');
                  if (firstInput) (firstInput as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${accent}, #FCA929)`,
                  boxShadow: `0 4px 25px ${accent}40`,
                }}
              >
                {config.cta_text}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (tipo === 'cards_grid') {
    const cards = (config?.cards as any[]) || [];
    return (
      <section className="px-5 md:px-20 lg:px-[100px] py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-orange-500/40 hover:scale-[1.03] hover:bg-white/[0.07] group"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <span className="text-3xl block mb-3">{card.emoji || ''}</span>
                <h3 className="text-white font-bold text-base mb-2 group-hover:text-orange-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tipo === 'testimonial') {
    return (
      <section className="px-5 md:px-20 lg:px-[100px] py-10 md:py-14">
        <div className="max-w-3xl mx-auto px-5 md:px-20 lg:px-[100px]">
          <div
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-10 relative overflow-hidden"
            style={{ boxShadow: `0 4px 30px rgba(0,0,0,0.3)` }}
          >
            {/* Decorative quote mark */}
            <span className="absolute top-4 left-6 text-6xl md:text-8xl font-serif leading-none opacity-10" style={{ color: accent }}>
              &ldquo;
            </span>
            <div className="relative z-10">
              <p className="text-white/80 text-base md:text-lg italic leading-relaxed mb-6 pl-4 border-l-2" style={{ borderColor: `${accent}40` }}>
                {contenido}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{
                  background: `linear-gradient(135deg, ${accent}, #FCA929)`,
                }}>
                  {(config?.name || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{config?.name}</p>
                  {config?.role && <p className="text-white/40 text-xs">{config.role}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (tipo === 'faq') {
    return <FaqBlock contenido={contenido} config={config} accent={accent} />;
  }

  if (tipo === 'cta') {
    return (
      <section className="px-5 md:px-20 lg:px-[100px] py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
              border: `1px solid ${accent}25`,
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-3xl" style={{
              background: `radial-gradient(circle, ${accent}, transparent)`,
            }} />
            <div className="relative z-10">
              <h3 className="text-white text-2xl md:text-3xl font-bold mb-3">{contenido}</h3>
              {config?.subtitle && (
                <p className="text-white/50 text-sm md:text-base max-w-lg mx-auto mb-6 leading-relaxed">
                  {config.subtitle}
                </p>
              )}
              {config?.button_text && (
                <a
                  href={config?.button_url || '#'}
                  target={config?.button_url?.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, #FCA929)`,
                    boxShadow: `0 4px 25px ${accent}40`,
                  }}
                >
                  {config.button_text}
                  <ChevronRight className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (tipo === 'stats') {
    const items = (config?.items as any[]) || [];
    return (
      <section className="px-5 md:px-20 lg:px-[100px] py-10 md:py-14">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              background: `linear-gradient(135deg, ${accent}15, ${accent}05)`,
              border: `1px solid ${accent}20`,
            }}
          >
            <div className={`grid gap-6 ${items.length <= 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
              {items.map((item: any, idx: number) => (
                <div key={idx} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold mb-1" style={{
                    backgroundImage: `linear-gradient(135deg, ${accent}, #FCA929)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {item.number}
                  </p>
                  <p className="text-white/50 text-xs md:text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (tipo === 'gallery') {
    const images = (config?.images as string[]) || [];
    return (
      <section className="px-5 md:px-20 lg:px-[100px] py-10 md:py-14">
        <div className="max-w-4xl mx-auto">
          <div className={`grid gap-3 ${images.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
            {images.map((src: string, idx: number) => (
              <div
                key={idx}
                className="relative rounded-2xl overflow-hidden border border-white/10 group"
                style={{ aspectRatio: '4/3' }}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
}

// --- FAQ Accordion Block ---

function FaqBlock({ contenido, config, accent }: { contenido?: string; config?: Record<string, any>; accent: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="px-5 md:px-20 lg:px-[100px] py-2">
      <div className="max-w-3xl mx-auto px-5 md:px-20 lg:px-[100px]">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between bg-white/5 backdrop-blur-sm border rounded-2xl px-6 py-5 text-left transition-all duration-200 hover:bg-white/[0.07]"
          style={{ borderColor: open ? `${accent}40` : 'rgba(255,255,255,0.1)' }}
        >
          <span className="text-white font-semibold text-sm md:text-base pr-4">{contenido}</span>
          <ChevronDown
            className="w-5 h-5 flex-shrink-0 transition-transform duration-300"
            style={{ color: open ? accent : 'rgba(255,255,255,0.3)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
        {open && (
          <div className="px-6 py-4 text-white/60 text-sm leading-relaxed" style={{ animation: 'fp-fade-up 0.3s ease-out' }}>
            {config?.answer}
          </div>
        )}
      </div>
    </section>
  );
}
