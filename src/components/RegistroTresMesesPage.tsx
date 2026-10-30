import { FormularioMatricula } from './FormularioMatricula';

interface RegistroTresMesesPageProps {
  onNavigateHome: () => void;
  onSuccess: (total: number) => void;
}

// /registro-3-meses: precio, clases, título y beneficios salen del catálogo del API.
export function RegistroTresMesesPage({ onNavigateHome, onSuccess }: RegistroTresMesesPageProps) {
  return (
    <FormularioMatricula
      programa="full"
      onVolver={onNavigateHome}
      onSuccess={onSuccess}
      portada={{ etiqueta: 'Matrícula', tituloRespaldo: 'Programa Full 3 Meses' }}
    />
  );
}
