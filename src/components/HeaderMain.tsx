import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, ShoppingCart, User } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';

interface HeaderMainProps {
  // Usamos la nueva firma que soporta secciones
  onNavigate: (page: string, sectionId?: string) => void;
  onOpenMatricula: () => void;
  onCartClick: () => void;
  cartItemsCount: number;
}

export function HeaderMain({ onNavigate, onOpenMatricula, onCartClick, cartItemsCount }: HeaderMainProps) {
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProgramasOpen, setIsProgramasOpen] = useState(false);
  const [isProgramasDesktopOpen, setIsProgramasDesktopOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  const handleMouseEnterProgramas = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setIsProgramasDesktopOpen(true);
  };

  const handleMouseLeaveProgramas = () => {
    const timeout = setTimeout(() => {
      setIsProgramasDesktopOpen(false);
    }, 200);
    setCloseTimeout(timeout);
  };

  // --- LÓGICA DE NAVEGACIÓN UNIFICADA ---
  const handleNavigateToSection = (sectionId: string) => {
    // 1. Cerrar menús visualmente primero (UX más rápida)
    setIsMobileMenuOpen(false);
    setIsProgramasOpen(false);
    setIsProgramasDesktopOpen(false);

    // 2. Ejecutar la navegación
    onNavigate('home', sectionId);
  };

  // Estilos comunes para links (para asegurar consistencia visual)
  const linkStyles = "text-white/80 hover:text-[#FCA929] transition-colors text-sm lg:text-base";

  return (
    <header 
      className="fixed top-0 left-0 right-0 transition-all duration-500 backdrop-blur-xl"
      style={{
        zIndex: 9999,
        background: isScrolled 
          ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.80))'
          : 'linear-gradient(to bottom, rgba(250, 123, 33, 0.12), rgba(252, 169, 41, 0.08), rgba(0, 0, 0, 0.25))',
        boxShadow: isScrolled 
          ? '0 10px 40px rgba(250, 123, 33, 0.25), 0 0 80px rgba(250, 123, 33, 0.1)'
          : '0 8px 32px rgba(250, 123, 33, 0.15), 0 0 60px rgba(250, 123, 33, 0.05)',
        borderBottom: isScrolled
          ? '1px solid rgba(250, 123, 33, 0.3)'
          : '1px solid rgba(250, 123, 33, 0.15)'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 sm:gap-3 group"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="flex flex-col">
              <span 
                className="text-base sm:text-lg transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                AMAS Team Wolf
              </span>
            </div>
          </button>

          {/* ========================================== */}
          {/* DESKTOP NAVIGATION               */}
          {/* ========================================== */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            
            {/* 1. Programas (Dropdown) */}
            <div
              className="relative programas-dropdown"
              onMouseEnter={handleMouseEnterProgramas}
              onMouseLeave={handleMouseLeaveProgramas}
            >
              <button className={`flex items-center gap-1 ${linkStyles}`}>
                Programas
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProgramasDesktopOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isProgramasDesktopOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-black/95 backdrop-blur-xl rounded-lg border border-[#FA7B21]/30 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-2">
                    <button
                      onClick={() => handleNavigateToSection('programas')}
                      className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-[#FCA929] hover:bg-[#FA7B21]/10 transition-colors"
                    >
                      Basic Program
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('leadership');
                        setIsProgramasDesktopOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-[#FCA929] hover:bg-[#FA7B21]/10 transition-colors"
                    >
                      Leadership Wolf
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* 2. Tienda */}
            <button onClick={() => handleNavigateToSection('tienda')} className={linkStyles}>
              Tienda
            </button>

            {/* 3. Nosotros */}
            <button onClick={() => handleNavigateToSection('nosotros')} className={linkStyles}>
              Nosotros
            </button>

            {/* 4. Graduaciones */}
            <button onClick={() => onNavigate('graduacion')} className={linkStyles}>
              Graduaciones
            </button>
          </nav>

          {/* Desktop CTA Buttons (Carrito, Perfil, Matricular) */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCartClick(); }}
              variant="ghost"
              size="icon"
              className="relative text-white hover:text-[#FCA929] hover:bg-[#FA7B21]/10"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#FA7B21] text-white text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            <Button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate(isAuthenticated ? 'perfil' : 'inicio-sesion'); }}
              variant="ghost"
              className={`${linkStyles} flex items-center`}
            >
              <User className="h-5 w-5 mr-2" />
              {isAuthenticated ? 'Mi Perfil' : 'Acceso'}
            </Button>

            <Button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenMatricula(); }}
              className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300 text-sm lg:text-base active:scale-95"
            >
              Matricular
            </Button>
          </div>

          {/* ========================================== */}
          {/* MOBILE MENU BUTTONS              */}
          {/* ========================================== */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCartClick(); }}
              variant="ghost"
              size="icon"
              className="relative text-white hover:text-[#FCA929] hover:bg-[#FA7B21]/10"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#FA7B21] text-white text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
            
            <Button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
              variant="ghost"
              size="icon"
              className="text-white hover:text-[#FCA929] hover:bg-[#FA7B21]/10"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MOBILE MENU CONTENT              */}
      {/* ========================================== */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden backdrop-blur-xl border-t border-[#FA7B21]/30 animate-in slide-in-from-top-4 duration-300"
          style={{
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.98))',
            boxShadow: '0 20px 50px rgba(250, 123, 33, 0.2), inset 0 1px 0 rgba(250, 123, 33, 0.1)'
          }}
        >
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            
            {/* 1. Programas (Dropdown Mobile) */}
            <div>
              <button
                onClick={() => setIsProgramasOpen(!isProgramasOpen)}
                className="flex items-center justify-between w-full text-white/80 hover:text-[#FCA929] transition-colors text-left py-2 text-base"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                Programas
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProgramasOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isProgramasOpen && (
                <div className="pl-4 mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => handleNavigateToSection('programas')}
                    className="block w-full text-left text-white/70 hover:text-[#FCA929] transition-colors py-2 text-sm"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  >
                    {/* CORREGIDO: Ahora coincide con Desktop */}
                    Basic Program
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('leadership');
                      setIsMobileMenuOpen(false);
                      setIsProgramasOpen(false);
                    }}
                    className="block w-full text-left text-white/70 hover:text-[#FCA929] transition-colors py-2 text-sm"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  >
                    Leadership Wolf
                  </button>
                </div>
              )}
            </div>
            
            {/* 2. Tienda */}
            <button
              onClick={() => handleNavigateToSection('tienda')}
              className="text-white/80 hover:text-[#FCA929] transition-colors text-left py-2 text-base"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              Tienda
            </button>

            {/* 3. Nosotros */}
            <button
              onClick={() => handleNavigateToSection('nosotros')}
              className="text-white/80 hover:text-[#FCA929] transition-colors text-left py-2 text-base"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              Nosotros
            </button>

            {/* 4. Graduaciones */}
            <button
              onClick={() => {
                onNavigate('graduacion');
                setIsMobileMenuOpen(false);
              }}
              className="text-white/80 hover:text-[#FCA929] transition-colors text-left py-2 text-base"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              Graduaciones
            </button>

            {/* Botón de perfil/login móvil */}
            <button
              onClick={() => {
                onNavigate(isAuthenticated ? 'perfil' : 'inicio-sesion');
                setIsMobileMenuOpen(false);
              }}
              className="text-white/80 hover:text-[#FCA929] transition-colors text-left py-2 text-base flex items-center gap-2"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <User className="h-5 w-5" />
              {isAuthenticated ? 'Mi Perfil' : 'Acceso'}
            </button>

            <div className="pt-4 border-t border-white/10">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenMatricula();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300 py-3 active:scale-95"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                Matricular ahora
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
