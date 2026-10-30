import { FormularioMatricula } from './FormularioMatricula';

interface RegistroSeisMesesPageProps {
  onNavigateHome: () => void;
  onSuccess: (total: number) => void;
}

// /registro-6-meses: precio, clases, título y beneficios salen del catálogo del API.
export function RegistroSeisMesesPage({ onNavigateHome, onSuccess }: RegistroSeisMesesPageProps) {
  return (
    <FormularioMatricula
      programa="6meses"
      onVolver={onNavigateHome}
      onSuccess={onSuccess}
      portada={{ etiqueta: 'Matrícula', tituloRespaldo: 'Programa 6 Meses' }}
    />
  );
}
