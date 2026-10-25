import { FormularioMatricula } from './FormularioMatricula';

interface RegistroMensualPageProps {
  onNavigateHome: () => void;
  onSuccess: (total: number) => void;
}

// /registro-mensual: el precio y las clases salen del catálogo del API.
export function RegistroMensualPage({ onNavigateHome, onSuccess }: RegistroMensualPageProps) {
  return (
    <FormularioMatricula
      programa="1mes"
      onVolver={onNavigateHome}
      onSuccess={onSuccess}
      portada={{
        etiqueta: 'Matrícula',
        titulo: 'Programa Mensual',
        bajada: 'Un mes de clases para empezar, con el horario según la edad del alumno.',
        notaPrecio: 'uniforme aparte',
        incluye: [
          'Horario según la edad del alumno',
          'Puedes agregar el uniforme al inscribirte',
          'Polos oficiales opcionales',
        ],
      }}
    />
  );
}
