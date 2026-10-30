import { FormularioMatricula } from './FormularioMatricula';

interface RegistroMensualPageProps {
  onNavigateHome: () => void;
  onSuccess: (total: number) => void;
}

// /registro-mensual: precio, clases, título y beneficios salen del catálogo del API.
export function RegistroMensualPage({ onNavigateHome, onSuccess }: RegistroMensualPageProps) {
  return (
    <FormularioMatricula
      programa="1mes"
      onVolver={onNavigateHome}
      onSuccess={onSuccess}
      portada={{ etiqueta: 'Matrícula', tituloRespaldo: 'Programa Mensual' }}
    />
  );
}
