import { FormularioMatricula } from './FormularioMatricula';

interface RegistroSeisMesesPageProps {
  onNavigateHome: () => void;
  onSuccess: (total: number) => void;
}

// /registro-6-meses: el precio y las clases salen del catálogo del API.
export function RegistroSeisMesesPage({ onNavigateHome, onSuccess }: RegistroSeisMesesPageProps) {
  return (
    <FormularioMatricula
      programa="6meses"
      onVolver={onNavigateHome}
      onSuccess={onSuccess}
      portada={{
        etiqueta: 'Matrícula',
        titulo: 'Programa 6 Meses',
        bajada: 'Seis meses de clases, dos veces por semana, con uniforme incluido.',
        notaPrecio: 'uniforme incluido',
        incluye: [
          'Uniforme completo incluido (dobok y cinturón)',
          'Clases recuperables',
          '1 congelamiento por inasistencia o viaje',
          'Cartilla de deberes y seguimiento del progreso',
          '2 graduaciones con nuevo cinturón y certificado',
          'Implemento de regalo',
        ],
      }}
    />
  );
}
