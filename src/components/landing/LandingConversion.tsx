import { useState, useEffect } from 'react';
import { HeaderMain } from '../HeaderMain';
import { FooterMain } from '../FooterMain';
import { trackEvent } from '../../utils/pixel';

import { HeroSection } from './HeroSection';
import { ProblemasSection } from './ProblemasSection';
import { MetodologiaSection } from './MetodologiaSection';
import { TestimoniosSection } from './TestimoniosSection';
import { GaleriaSection } from './GaleriaSection';
import { TrustSignalsSection } from './TrustSignalsSection';
import { ComparativaSection } from './ComparativaSection';
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

export function LandingConversion({ onNavigate, onOpenMatricula, onCartClick, cartItemsCount }: LandingConversionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openTrialModal = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('ViewContent', {
      content_name: 'LandingPage',
      content_category: 'Landing'
    });
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <HeaderMain
        onNavigate={onNavigate}
        onOpenMatricula={onOpenMatricula}
        onCartClick={onCartClick}
        cartItemsCount={cartItemsCount}
      />

      <HeroSection onOpenTrialModal={openTrialModal} onScrollToSection={scrollToSection} />
      <ProblemasSection />
      <MetodologiaSection onOpenTrialModal={openTrialModal} />
      <TestimoniosSection />
      <GaleriaSection />
      <TrustSignalsSection />
      <ComparativaSection />
      <ProcesoSection onOpenTrialModal={openTrialModal} />
      <FAQSection />

      <FormularioModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />

      <CTAFinalSection onOpenTrialModal={openTrialModal} />
      <WhatsAppButton onClick={openTrialModal} />

      <FooterMain
        onNavigate={onNavigate}
        onOpenMatricula={onOpenMatricula}
      />
    </div>
  );
}
