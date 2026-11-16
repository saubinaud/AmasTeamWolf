import { useState, useEffect } from 'react';
import { HeaderMain } from '../HeaderMain';
import { FooterMain } from '../FooterMain';
import { trackEvent } from '../../utils/pixel';
import { ui } from '../../styles/marca';

import { HeroSection } from './HeroSection';
import { ProblemasSection } from './ProblemasSection';
import { MetodologiaSection } from './MetodologiaSection';
import { IncluyeSection } from './IncluyeSection';
import { GaleriaSection } from './GaleriaSection';
import { ProcesoSection } from './ProcesoSection';
import { FAQSection } from './FAQSection';
import { FormularioModal } from './FormularioModal';
import { CTAFinalSection } from './CTAFinalSection';
import { WhatsAppButton } from './WhatsAppButton';

interface LandingConversionProps {
  onNavigate: (page: string, sectionId?: string) => void;
  onOpenMatricula: () => void;
  onCartClick: () => void;
  cartItemsCount: number;
}

/** /clase-prueba: todo lleva a agendar la clase. */
export function LandingConversion({ onNavigate, onOpenMatricula, onCartClick, cartItemsCount }: LandingConversionProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const abrir = () => setModalAbierto(true);
  const irA = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('ViewContent', { content_name: 'LandingPage', content_category: 'Landing' });
  }, []);

  return (
    <div className={`relative overflow-hidden ${ui.pagina}`}>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#FA7B21]/15 blur-3xl" />
      </div>

      <div className="relative z-10">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={onOpenMatricula}
          onCartClick={onCartClick}
          cartItemsCount={cartItemsCount}
          currentPage="clase-prueba"
        />

        <HeroSection onOpenTrialModal={abrir} onScrollToSection={irA} />
        <ProblemasSection />
        <MetodologiaSection onOpenTrialModal={abrir} />
        <IncluyeSection onOpenTrialModal={abrir} />
        <GaleriaSection />
        <ProcesoSection onOpenTrialModal={abrir} />
        <FAQSection />
        <CTAFinalSection onOpenTrialModal={abrir} />

        <FooterMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} accion="ninguna" />
      </div>

      <FormularioModal isOpen={modalAbierto} onOpenChange={setModalAbierto} />
      <WhatsAppButton />
    </div>
  );
}
