import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EnlaceInterno } from './EnlaceInterno';
import { rutaDe, clicInterno } from '../hooks/useAppNavigate';
import { ui } from '../styles/marca';

interface HeaderMainProps {
  onNavigate: (page: string, sectionId?: string) => void;
  onOpenMatricula: () => void;
  onCartClick: () => void;
  cartItemsCount: number;
  currentPage?: string;
}

/** Programas del menú: todos con URL real. */
const PROGRAMAS: { page: string; section?: string; texto: string; nuevo?: boolean }[] = [
  { page: 'home', section: 'programas', texto: 'Taekwondo para niños' },
  { page: 'leadership', texto: 'Leadership Wolf' },
  { page: 'clase-prueba', texto: 'Clase de prueba' },
  { page: 'om-yoga', texto: 'OmYoga', nuevo: true },
];

const PAGINAS_PROGRAMAS = ['home', 'leadership', 'om-yoga', 'clase-prueba'];

const insigniaNuevo = 'rounded-full bg-[#FA7B21] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white';
const enlaceEscritorio = (activo: boolean) =>
  `inline-flex min-h-[44px] items-center gap-1 px-1 text-sm lg:text-base transition-colors duration-150 ${
    activo ? 'font-semibold text-[#FCA929]' : 'text-white/80 hover:text-white'
  }`;
const enlaceMovil = (activo: boolean) =>
  `flex min-h-[48px] w-full items-center gap-2 text-left text-base transition-colors duration-150 ${
    activo ? 'font-semibold text-[#FCA929]' : 'text-white/85 hover:text-white'
  }`;
const botonIcono =
  'relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition-colors duration-150 hover:bg-white/[0.06] hover:text-[#FCA929]';

function Contador({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FA7B21] px-1 text-[11px] font-semibold text-white">
      {n}
    </span>
  );
}

export function HeaderMain({ onNavigate, onOpenMatricula, onCartClick, cartItemsCount, currentPage }: HeaderMainProps) {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuMovil, setMenuMovil] = useState(false);
  const [programasMovil, setProgramasMovil] = useState(false);
  const [programasEscritorio, setProgramasEscritorio] = useState(false);
  const cierre = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const alDesplazar = () => setIsScrolled(window.scrollY > 20);
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  useEffect(() => () => { if (cierre.current) clearTimeout(cierre.current); }, []);

  const abrirProgramas = () => {
    if (cierre.current) clearTimeout(cierre.current);
    setProgramasEscritorio(true);
  };
  const cerrarProgramas = () => {
    cierre.current = setTimeout(() => setProgramasEscritorio(false), 200);
  };
  const cerrarTodo = () => {
    setMenuMovil(false);
    setProgramasMovil(false);
    setProgramasEscritorio(false);
  };

  const enProgramas = PAGINAS_PROGRAMAS.includes(currentPage ?? '');
  const cuenta = isAuthenticated ? 'perfil' : 'inicio-sesion';
  const textoCuenta = isAuthenticated ? 'Mi perfil' : 'Acceso';

  return (
    <header
      className={`fixed inset-x-0 top-0 border-b transition-colors duration-300 ${
        isScrolled || menuMovil ? 'border-white/10 bg-black/90 backdrop-blur-xl' : 'border-transparent bg-gradient-to-b from-black/70 to-transparent'
      }`}
      style={{ zIndex: 9999 }}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <a
            href="/"
            onClick={(e) => clicInterno(e, () => { cerrarTodo(); onNavigate('home'); })}
            className="flex min-h-[44px] items-center"
            aria-label="Team Wolf × JMA, inicio"
          >
            <img
              src="/marca/logo-completo-oscuro-800.png"
              alt="Team Wolf, centro de entrenamiento × JMA"
              width={800}
              height={258}
              className="h-9 w-auto sm:h-11"
            />
          </a>

          {/* Escritorio */}
          <nav className="hidden items-center gap-4 md:flex lg:gap-6" aria-label="Principal">
            <div className="relative" onMouseEnter={abrirProgramas} onMouseLeave={cerrarProgramas}>
              <button
                type="button"
                onClick={() => setProgramasEscritorio((v) => !v)}
                aria-expanded={programasEscritorio}
                className={enlaceEscritorio(enProgramas)}
              >
                Programas
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${programasEscritorio ? 'rotate-180' : ''}`} />
              </button>

              {programasEscritorio && (
                <div className="absolute left-0 top-full mt-1 w-60 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 py-2 shadow-xl shadow-black/50 backdrop-blur-xl">
                  {PROGRAMAS.map((p) => (
                    <EnlaceInterno
                      key={p.texto}
                      page={p.page}
                      section={p.section}
                      onNavigate={onNavigate}
                      alNavegar={cerrarTodo}
                      className="flex min-h-[44px] items-center justify-between px-4 text-sm text-white/80 transition-colors duration-150 hover:bg-white/[0.05] hover:text-white"
                    >
                      {p.texto}
                      {p.nuevo && <span className={insigniaNuevo}>Nuevo</span>}
                    </EnlaceInterno>
                  ))}
                </div>
              )}
            </div>

            <EnlaceInterno page="tienda" onNavigate={onNavigate} alNavegar={cerrarTodo} className={enlaceEscritorio(currentPage === 'tienda')}>
              Tienda
            </EnlaceInterno>
            <EnlaceInterno page="home" section="nosotros" onNavigate={onNavigate} alNavegar={cerrarTodo} className={enlaceEscritorio(false)}>
              Nosotros
            </EnlaceInterno>
            <EnlaceInterno page="graduacion" onNavigate={onNavigate} alNavegar={cerrarTodo} className={enlaceEscritorio(currentPage === 'graduacion')}>
              Graduaciones
            </EnlaceInterno>
          </nav>

          <div className="hidden items-center gap-2 md:flex lg:gap-3">
            <button type="button" onClick={onCartClick} aria-label="Carrito de compras" className={botonIcono}>
              <ShoppingCart className="h-5 w-5" />
              <Contador n={cartItemsCount} />
            </button>
            <EnlaceInterno page={cuenta} onNavigate={onNavigate} className={enlaceEscritorio(currentPage === 'perfil')}>
              <User className="mr-1 h-5 w-5" />
              {textoCuenta}
            </EnlaceInterno>
            <button type="button" onClick={() => onOpenMatricula()} className={ui.btnPrimarySm}>
              Matricular
            </button>
          </div>

          {/* Celular */}
          <div className="flex items-center gap-1 md:hidden">
            <button type="button" onClick={onCartClick} aria-label="Carrito de compras" className={botonIcono}>
              <ShoppingCart className="h-5 w-5" />
              <Contador n={cartItemsCount} />
            </button>
            <button
              type="button"
              onClick={() => setMenuMovil((v) => !v)}
              aria-label={menuMovil ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuMovil}
              className={botonIcono}
            >
              {menuMovil ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {menuMovil && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-black/95 md:hidden">
          <nav className="container mx-auto flex flex-col px-4 py-4" aria-label="Principal">
            <button
              type="button"
              onClick={() => setProgramasMovil((v) => !v)}
              aria-expanded={programasMovil}
              className={`${enlaceMovil(enProgramas)} justify-between`}
            >
              Programas
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${programasMovil ? 'rotate-180' : ''}`} />
            </button>
            {programasMovil && (
              <div className="mb-2 border-l border-white/10 pl-4">
                {PROGRAMAS.map((p) => (
                  <EnlaceInterno
                    key={p.texto}
                    page={p.page}
                    section={p.section}
                    onNavigate={onNavigate}
                    alNavegar={cerrarTodo}
                    className="flex min-h-[44px] items-center gap-2 text-[15px] text-white/70 transition-colors duration-150 hover:text-white"
                  >
                    {p.texto}
                    {p.nuevo && <span className={insigniaNuevo}>Nuevo</span>}
                  </EnlaceInterno>
                ))}
              </div>
            )}
            <EnlaceInterno page="tienda" onNavigate={onNavigate} alNavegar={cerrarTodo} className={enlaceMovil(currentPage === 'tienda')}>
              Tienda
            </EnlaceInterno>
            <EnlaceInterno page="home" section="nosotros" onNavigate={onNavigate} alNavegar={cerrarTodo} className={enlaceMovil(false)}>
              Nosotros
            </EnlaceInterno>
            <EnlaceInterno page="graduacion" onNavigate={onNavigate} alNavegar={cerrarTodo} className={enlaceMovil(currentPage === 'graduacion')}>
              Graduaciones
            </EnlaceInterno>
            <EnlaceInterno page={cuenta} onNavigate={onNavigate} alNavegar={cerrarTodo} className={enlaceMovil(currentPage === 'perfil')}>
              <User className="h-5 w-5" />
              {textoCuenta}
            </EnlaceInterno>

            <div className="mt-3 grid gap-2 border-t border-white/10 pt-4">
              <a
                href={rutaDe('clase-prueba')}
                onClick={(e) => clicInterno(e, () => { cerrarTodo(); onNavigate('clase-prueba'); })}
                className={ui.btnPrimary}
              >
                Agendar clase de prueba
              </a>
              <button type="button" onClick={() => { cerrarTodo(); onOpenMatricula(); }} className={ui.btnSecondary}>
                Matricular
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
