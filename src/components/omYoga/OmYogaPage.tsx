import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ArrowDown } from 'lucide-react';
import { HeaderMain } from '../HeaderMain';
import { FooterMain } from '../FooterMain';
import { useLayoutContext } from '../../layouts/MainLayout';
import { CuentaRegresiva } from './CuentaRegresiva';
import { FormularioOmYoga } from './FormularioOmYoga';
import { PaseClase } from './PaseClase';
import { OM_YOGA, useCuentaRegresiva } from './datos';

const SOL = 'radial-gradient(circle at 35% 35%, #FFE08A 0%, #FCA929 38%, #FA7B21 70%, #C2410C 100%)';
const LUNA = 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #E4E4E7 40%, #A1A1AA 85%, #71717A 100%)';

const irAlFormulario = () =>
  document.getElementById('inscripcion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Video del hero: arranca sin sonido (trae subtítulos) y con un toque se escucha desde el inicio. */
function VideoOmYoga() {
  const ref = useRef<HTMLVideoElement>(null);
  const [mudo, setMudo] = useState(true);

  const alternarSonido = () => {
    const v = ref.current;
    if (!v) return;
    if (mudo) {
      v.currentTime = 0;
      v.muted = false;
      v.loop = false;
      void v.play();
    } else {
      v.muted = true;
    }
    setMudo(!mudo);
  };

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-[#FA7B21]/20 blur-3xl pointer-events-none" />
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/60">
        <video
          ref={ref}
          className="block aspect-video w-full object-cover"
          src={OM_YOGA.video}
          poster={OM_YOGA.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onEnded={() => { if (ref.current) { ref.current.muted = true; ref.current.loop = true; void ref.current.play(); setMudo(true); } }}
          aria-label="Celeste, instructora principal, presenta el programa OM Yoga"
        />
        <button
          type="button"
          onClick={alternarSonido}
          className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2.5 text-sm text-white backdrop-blur-md transition hover:bg-black/75 active:scale-95"
        >
          {mudo ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {mudo ? 'Ver con sonido' : 'Silenciar'}
        </button>
      </div>
    </div>
  );
}

/** Barra fija en el celular mientras el formulario no está a la vista. */
function BarraMovil({ oculta }: { oculta: boolean }) {
  const { terminado } = useCuentaRegresiva(OM_YOGA.cierre);
  if (terminado) return null;
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 px-4 pt-3 backdrop-blur-xl transition-transform duration-300 md:hidden ${oculta ? 'translate-y-full' : ''}`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Cierra en</p>
          <CuentaRegresiva compacta />
        </div>
        <button onClick={irAlFormulario}
          className="rounded-xl bg-gradient-to-r from-[#FA7B21] to-[#FCA929] px-5 py-3 text-sm font-semibold text-white active:scale-95">
          Reservar gratis
        </button>
      </div>
    </div>
  );
}

export function OmYogaPage() {
  const { onNavigate, onOpenMatricula, onCartClick, cartItemsCount } = useLayoutContext();
  const formRef = useRef<HTMLElement>(null);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);


  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0705] text-white">
      {/* Fondo: sol cálido arriba, luna fría abajo */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full opacity-25 blur-3xl" style={{ background: SOL }} />
        <div className="absolute -bottom-48 -right-40 h-[30rem] w-[30rem] rounded-full opacity-[0.08] blur-3xl" style={{ background: LUNA }} />
      </div>

      <div className="relative z-10">
        <HeaderMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick}
          cartItemsCount={cartItemsCount} currentPage="om-yoga" />

        {/* HERO */}
        <section className="container mx-auto px-4 pt-28 pb-16 sm:pt-32 md:pb-24 lg:pt-36">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-x-16 lg:gap-y-0">
            <div className="lg:col-start-1 lg:self-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FA7B21]/30 bg-[#FA7B21]/10 px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FCA929] animate-pulse" />
                <span className="text-xs uppercase tracking-[0.18em] text-[#FCA929]">Nuevo programa · Hatha Yoga</span>
              </div>

              <h1 className="mt-6 text-6xl font-bold leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
                OM<br />
                <span className="bg-gradient-to-r from-[#FA7B21] via-[#FCA929] to-[#FFE08A] bg-clip-text text-transparent">Yoga</span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/70 sm:text-xl">
                Equilibra la energía que te activa y la que te deja descansar.
                Tu primera clase es <strong className="font-semibold text-white">totalmente gratis</strong>.
              </p>
            </div>

            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
              <VideoOmYoga />
            </div>

            <div className="lg:col-start-1 lg:self-start lg:pt-6">

              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-white/80">{OM_YOGA.fechaClase}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-white/80">San Borja</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-white/80">Adultos</span>
              </div>

              <div className="mt-9">
                <p className="mb-3 text-sm text-white/55">Inscripciones abiertas hasta el martes 17, 11:59 p. m.</p>
                <CuentaRegresiva />
              </div>

              <button onClick={irAlFormulario}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FA7B21] to-[#FCA929] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#FA7B21]/30 transition hover:shadow-[#FA7B21]/50 active:scale-[0.98] sm:w-auto">
                Reservar mi clase gratis <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* HA + THA */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FCA929]">Qué es Hatha Yoga</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">Dos energías, un mismo cuerpo</h2>
            <p className="mt-5 text-white/60 sm:text-lg">
              El Hatha Yoga busca equilibrar las dos energías del organismo, en paralelo a cómo funciona tu sistema nervioso.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <article className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#FA7B21]/[0.12] to-white/[0.02] p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 rounded-full shadow-[0_0_48px_rgba(250,123,33,0.55)]" style={{ background: SOL }} />
                <div>
                  <h3 className="text-3xl font-bold leading-none tracking-tight">HA</h3>
                  <p className="mt-1.5 text-sm uppercase tracking-[0.16em] text-[#FCA929]">Energía solar</p>
                </div>
              </div>
              <p className="mt-5 text-white/65 leading-relaxed">Los momentos de activación y de movimiento: fuerza, calor y presencia en cada postura.</p>
            </article>
            <div className="hidden items-center justify-center text-3xl font-light text-white/30 md:flex">+</div>
            <article className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 rounded-full shadow-[0_0_48px_rgba(228,228,231,0.25)]" style={{ background: LUNA }} />
                <div>
                  <h3 className="text-3xl font-bold leading-none tracking-tight">THA</h3>
                  <p className="mt-1.5 text-sm uppercase tracking-[0.16em] text-zinc-300">Energía lunar</p>
                </div>
              </div>
              <p className="mt-5 text-white/65 leading-relaxed">El descanso que lleva a la relajación profunda: respiración, calma y recuperación.</p>
            </article>
          </div>
        </section>

        {/* INSTRUCTORA */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
            <figure className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 md:max-w-none">
              <img src={OM_YOGA.fotoInstructora} alt="Celeste, instructora principal de OM Yoga, con los ojos cerrados" loading="lazy"
                width={640} height={800} className="aspect-[4/5] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-2xl font-semibold text-white">Celeste</p>
                <p className="text-sm text-white/70">Instructora principal · Hatha Yoga</p>
              </figcaption>
            </figure>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FCA929]">Tu instructora</p>
              <blockquote className="mt-6 text-2xl font-medium leading-snug text-white sm:text-3xl">
                <span className="text-[#FA7B21]">«</span>Quiero invitarte a practicar con nosotros en nuestro programa, en San Luis, San Borja. Te esperamos.<span className="text-[#FA7B21]">»</span>
              </blockquote>
              <button onClick={irAlFormulario}
                className="mt-8 inline-flex items-center gap-2 text-[#FCA929] transition-colors duration-150 hover:text-white">
                Reservar mi clase con Celeste <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* RESERVA: el pase de la clase y el formulario */}
        <section id="inscripcion" ref={formRef} className="container mx-auto scroll-mt-24 px-4 pt-16 pb-28 md:py-24">
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Reserva tu{' '}
              <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">lugar</span>
            </h2>
            <p className="mt-4 text-white/60 sm:text-lg">Inscríbete ahora para poder entrar a la primera clase. Toma menos de un minuto.</p>
          </div>

          <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
            <PaseClase />

            <div className="relative">
              <div className="pointer-events-none absolute -inset-px rounded-[28px] bg-gradient-to-b from-[#FA7B21]/50 via-white/10 to-white/5" />
              <div className="relative rounded-[27px] bg-zinc-950 p-6 sm:p-8">
                <div className="mb-7 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-6">
                  <p className="font-semibold text-white">Tus datos</p>
                  <p className="flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-sm text-white/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FA7B21] animate-pulse" />
                    Cierra en <CuentaRegresiva compacta />
                  </p>
                </div>
                <FormularioOmYoga />
              </div>
            </div>
          </div>
        </section>

        <FooterMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} />
      </div>

      <BarraMovil oculta={formVisible} />
    </div>
  );
}
