// Pinta los bloques del texto legal (contrato y Términos y Condiciones) tal como
// los manda el API. El texto vive en amas-api/src/services/contratoTexto.js.
import type { Bloque } from '../../hooks/useTextoContrato';
import { soles } from '../../utils/catalogo';

const monto = (n: number) => (n < 0 ? `- ${soles(-n)}` : soles(n));

export function BloquesLegales({ bloques, compacto = false }: { bloques: Bloque[]; compacto?: boolean }) {
  const texto = compacto ? 'text-[15px] text-white/75' : 'text-white/80';
  return (
    <div className={`space-y-3 leading-relaxed ${texto}`}>
      {bloques.map((b, i) => {
        if (b.tipo === 'lista') {
          return (
            <ul key={i} className="space-y-2.5">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47B20]" />
                  <span>{it.etiqueta && <strong className="text-white">{it.etiqueta}: </strong>}{it.texto}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.tipo === 'formula') {
          return (
            <p key={i} className="rounded-lg border border-[#F47B20]/25 bg-[#F47B20]/10 px-4 py-3 text-[15px] font-semibold text-white">
              {b.texto}
            </p>
          );
        }
        if (b.tipo === 'ejemplo') {
          return (
            <div key={i} className="overflow-hidden rounded-lg border border-white/10">
              <p className="px-4 pt-3 text-[12px] font-bold uppercase tracking-wider text-[#FCA929]">{b.titulo}</p>
              <table className="w-full text-[14px]">
                <tbody>
                  {b.filas.map((f, j) => (
                    <tr key={j} className={f.total ? 'bg-white/[0.06] font-bold text-white' : 'border-b border-white/5'}>
                      <td className="px-4 py-2 align-top">
                        {f.concepto}
                        {f.detalle && <span className="block text-[13px] font-normal text-white/50">{f.detalle}</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right align-top tabular-nums">{monto(f.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {b.nota && <p className="px-4 py-2.5 text-[13px] italic text-white/45">{b.nota}</p>}
            </div>
          );
        }
        return <p key={i}>{b.texto}</p>;
      })}
    </div>
  );
}
