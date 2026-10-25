import { FormularioRenovacion } from '../components/FormularioRenovacion';

interface RenovacionPageProps {
  onNavigateHome: () => void;
  onNavigate: (page: string, sectionId?: string) => void;
  onOpenMatricula: () => void;
  onCartClick: () => void;
  cartItemsCount: number;
  /** Abre el popup de pago con el total que registró el servidor */
  onSuccess?: (total: number) => void;
}

// /renovacion: página propia con la cabecera JMA y la barra de total fija
// (la abren las familias desde WhatsApp, casi siempre en el celular).
export function RenovacionPage(props: RenovacionPageProps) {
  return (
    <FormularioRenovacion
      onVolver={props.onNavigateHome}
      onSuccess={(total) => props.onSuccess?.(total)}
    />
  );
}
