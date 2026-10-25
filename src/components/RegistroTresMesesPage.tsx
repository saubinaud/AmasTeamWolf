import { FormularioMatricula } from './FormularioMatricula';

interface RegistroTresMesesPageProps {
  onNavigateHome: () => void;
  onSuccess: (total: number) => void;
}

// /registro-3-meses: el precio y las clases salen del catálogo del API.
export function RegistroTresMesesPage({ onNavigateHome, onSuccess }: RegistroTresMesesPageProps) {
  return (
    <FormularioMatricula
      programa="full"
      onVolver={onNavigateHome}
      onSuccess={onSuccess}
      portada={{
        etiqueta: 'Matrícula',
        titulo: 'Programa Full 3 Meses',
        bajada: 'Tres meses de clases, dos veces por semana, con uniforme incluido.',
        notaPrecio: 'uniforme incluido',
        incluye: [
          'Uniforme completo incluido (dobok y cinturón)',
          'Horario según la edad del alumno',
          'Clases recuperables',
          'Certificado oficial y posibilidad de graduación',
        ],
      }}
    />
  );
}
