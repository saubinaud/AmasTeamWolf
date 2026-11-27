// Toda promoción que ve una familia se dice "promoción" y lleva a los Términos y
// Condiciones (Ley 29571, art. 14: las condiciones de una promoción tienen que
// estar a la vista). Un solo componente para la web: renovación, matrícula,
// resumen del pedido, Leadership y OmYoga.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const dia = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]}` : iso;
};

/** La píldora "Promoción" que va arriba de la oferta. */
export function EtiquetaPromocion({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-[#FA7B21] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white ${className}`}>
      Promoción
    </span>
  );
}

/**
 * "Promoción válida hasta el 18 de diciembre. Sujeta a sus condiciones y a los
 * Términos y Condiciones." El enlace abre en otra pestaña: no se pierde el formulario.
 */
export function NotaPromocion({ hasta, condiciones, className = '' }: { hasta?: string | null; condiciones?: string | null; className?: string }) {
  return (
    <p className={`text-[13px] leading-snug text-white/60 ${className}`}>
      {condiciones ? `${condiciones.replace(/\.?\s*$/, '.')} ` : ''}
      Promoción{hasta ? ` válida hasta el ${dia(hasta)}` : ''}, sujeta a sus condiciones y a los{' '}
      <a href="/terminos" target="_blank" rel="noopener" className="font-bold text-white/80 underline underline-offset-2 hover:text-white">
        Términos y Condiciones
      </a>.
    </p>
  );
}
