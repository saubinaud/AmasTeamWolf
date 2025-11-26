import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Loader2, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { programImplements } from '../data/implements';
import { Separator } from './ui/separator';

interface RegistroLeadershipPageProps {
  onNavigateHome: () => void;
  onSuccess: (total: number) => void;
}

const BASE_PRICE = 1299;

// Códigos promocionales solo de descuentos monetarios para Leadership
interface CodigoPromocional {
  valor: number;
  descripcion: string;
  activo: boolean;
}

const CODIGOS_PROMOCIONALES_LEADERSHIP: Record<string, CodigoPromocional> = {
  "AMAS-DESC50": {
    valor: 50,
    descripcion: "Descuento de S/ 50",
    activo: true
  },
  "AMAS-DESC100": {
    valor: 100,
    descripcion: "Descuento de S/ 100",
    activo: true
  },
  "AMAS-DESC150": {
    valor: 150,
    descripcion: "Descuento de S/ 150",
    activo: true
  },
  "AMAS-DESC200": {
    valor: 200,
    descripcion: "Descuento de S/ 200",
    activo: true
  },
  "PRIMAVEZ": {
    valor: 80,
    descripcion: "Descuento de S/ 80 para nuevos alumnos",
    activo: true
  },
  "AMIGO50": {
    valor: 50,
    descripcion: "S/ 50 descuento por referir a un amigo",
    activo: true
  },
  "AMIGO100": {
    valor: 100,
    descripcion: "S/ 100 descuento por referir 2+ amigos",
    activo: true
  },
  "REFIERE3X": {
    valor: 150,
    descripcion: "S/ 150 descuento por referir 3+ amigos",
    activo: true
  },
  "CUMPLEAÑOS": {
    valor: 80,
    descripcion: "S/ 80 descuento (mes cumpleaños)",
    activo: true
  },
  "BIENVENIDA": {
    valor: 60,
    descripcion: "S/ 60 descuento de bienvenida",
    activo: true
  },
  "VUELVE100": {
    valor: 100,
    descripcion: "S/ 100 descuento para ex-alumnos",
    activo: true
  },
  "VUELVE150": {
    valor: 150,
    descripcion: "S/ 150 descuento para ex-alumnos",
    activo: true
  },
  "EARLYBIRD": {
    valor: 120,
    descripcion: "S/ 120 descuento por inscripción anticipada",
    activo: true
  },
  "RENUEVA100": {
    valor: 100,
    descripcion: "S/ 100 descuento por renovación anticipada",
    activo: true
  }
};

interface CodigoAplicado {
  valido: boolean;
  valor?: number;
  descripcion?: string;
  codigo?: string;
  mensaje?: string;
}

const INITIAL_FORM_STATE = {
  nombrePadre: '',
  nombreAlumno: '',
  correo: ''
};

export function RegistroLeadershipPage({ onNavigateHome, onSuccess }: RegistroLeadershipPageProps) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [ownedImplements, setOwnedImplements] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codigoPromocional, setCodigoPromocional] = useState<string>('');
  const [codigoAplicado, setCodigoAplicado] = useState<CodigoAplicado | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleToggleImplement = useCallback((implementId: string) => {
    setOwnedImplements(prev =>
      prev.includes(implementId)
        ? prev.filter(id => id !== implementId)
        : [...prev, implementId]
    );
  }, []);

  // Validar código promocional
  const handleAplicarCodigo = useCallback(() => {
    const codigoUpper = codigoPromocional.toUpperCase().trim();

    if (!codigoUpper) {
      toast.error('Por favor ingresa un código promocional');
      return;
    }

    const promo = CODIGOS_PROMOCIONALES_LEADERSHIP[codigoUpper];

    if (!promo) {
      setCodigoAplicado({ valido: false, mensaje: "❌ Código no válido" });
      toast.error("Código no válido");
      return;
    }

    if (!promo.activo) {
      setCodigoAplicado({ valido: false, mensaje: "❌ Código inactivo" });
      toast.error("Código inactivo");
      return;
    }

    setCodigoAplicado({
      valido: true,
      valor: promo.valor,
      descripcion: promo.descripcion,
      codigo: codigoUpper
    });

    toast.success(`✅ Código "${codigoUpper}" aplicado exitosamente`);
  }, [codigoPromocional]);

  // Quitar código promocional
  const handleQuitarCodigo = useCallback(() => {
    setCodigoPromocional('');
    setCodigoAplicado(null);
    toast.info('Código promocional removido');
  }, []);

  // Calcular descuento basado en implementos que ya tiene (excluir membresía)
  const implementsForDiscount = programImplements.filter(impl => impl.id !== 'membership');
  const ownedImplementsTotal = implementsForDiscount
    .filter(impl => ownedImplements.includes(impl.id))
    .reduce((sum, impl) => sum + impl.price, 0);

  // Calcular descuento de código promocional
  const descuentoCodigo = codigoAplicado?.valido && codigoAplicado.valor ? codigoAplicado.valor : 0;

  const finalPrice = Math.max(0, BASE_PRICE - ownedImplementsTotal - descuentoCodigo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombrePadre || !formData.nombreAlumno || !formData.correo) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);

    // Obtener lista de implementos que se incluirán (los que NO tiene)
    const implementosIncluidos = implementsForDiscount
      .filter(impl => !ownedImplements.includes(impl.id))
      .map(impl => `${impl.icon} ${impl.name}`);

    // Obtener lista de implementos que ya tiene
    const implementosQueTiene = implementsForDiscount
      .filter(impl => ownedImplements.includes(impl.id))
      .map(impl => `${impl.icon} ${impl.name}`);

    // Preparar datos para el webhook
    const webhookData = {
      nombre_padre: formData.nombrePadre,
      nombre_alumno: formData.nombreAlumno,
      correo: formData.correo,
      programa: 'Leadership Wolf',
      precio_base: BASE_PRICE,
      descuento_por_implementos: ownedImplementsTotal,
      codigo_promocional: codigoAplicado?.codigo || 'No aplicado',
      descuento_codigo: descuentoCodigo,
      total_a_pagar: finalPrice,
      implementos_incluidos: implementosIncluidos,
      implementos_que_ya_tiene: implementosQueTiene,
      fecha_inscripcion: new Date().toISOString()
    };

    try {
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/lidership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
        mode: 'cors'
      });

      if (response.ok || response.status === 200) {
        toast.success('¡Inscripción confirmada! Ahora proceda con el pago.');
        
        // Limpiar formulario
        setFormData(INITIAL_FORM_STATE);
        setOwnedImplements([]);
        setCodigoPromocional('');
        setCodigoAplicado(null);

        // Abrir popup de pago
        onSuccess(finalPrice);
        
        // NO navegar automáticamente, dejar que el usuario cierre el popup
      } else {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error completo:', error);
      toast.error('Error al procesar la inscripción. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header 
        className="border-b border-white/10 bg-black/95 backdrop-blur-sm sticky top-0"
        style={{ zIndex: 9999 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-white/80 hover:text-[#FA7B21] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al inicio</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-white mb-2">
            Inscripción - Programa Leadership Wolf 🐺
          </h1>
          <p className="text-white/60">
            Completa tus datos y selecciona los implementos que ya posees
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 border border-[#FA7B21]/30 rounded-lg p-6 sm:p-8">
          {/* Datos básicos */}
          <div className="space-y-4">
            <h3 className="text-[#FA7B21]">Datos de Inscripción</h3>
            
            <div>
              <Label htmlFor="nombrePadre" className="text-white">
                Nombre del Padre/Tutor *
              </Label>
              <Input
                id="nombrePadre"
                value={formData.nombrePadre}
                onChange={(e) => handleInputChange('nombrePadre', e.target.value)}
                placeholder="Nombre completo del padre/tutor"
                className="bg-zinc-800 border-zinc-700 text-white"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <Label htmlFor="nombreAlumno" className="text-white">
                Nombre del Alumno *
              </Label>
              <Input
                id="nombreAlumno"
                value={formData.nombreAlumno}
                onChange={(e) => handleInputChange('nombreAlumno', e.target.value)}
                placeholder="Nombre completo del alumno"
                className="bg-zinc-800 border-zinc-700 text-white"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <Label htmlFor="correo" className="text-white">
                Correo electrónico del responsable *
              </Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => handleInputChange('correo', e.target.value)}
                placeholder="tu@email.com"
                className="bg-zinc-800 border-zinc-700 text-white"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Selección de implementos que ya tiene */}
          <div className="space-y-4">
            <h3 className="text-[#FA7B21]">¿Qué implementos ya posee?</h3>
            
            <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-white/10">
              <p className="text-white/60 text-sm mb-4">
                Marca los implementos que ya tiene. El precio se ajustará automáticamente.
              </p>
              
              <div className="space-y-3">
                {implementsForDiscount.map((implement) => (
                  <div key={implement.id} className="flex items-center justify-between bg-zinc-900/50 rounded-lg p-3 sm:p-4 border border-white/10">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Checkbox
                        id={implement.id}
                        checked={ownedImplements.includes(implement.id)}
                        onCheckedChange={() => handleToggleImplement(implement.id)}
                        className="border-white/30 data-[state=checked]:bg-[#FA7B21] data-[state=checked]:border-[#FA7B21] flex-shrink-0"
                      />
                      <Label
                        htmlFor={implement.id}
                        className="text-white cursor-pointer flex items-center gap-2 flex-1 min-w-0"
                      >
                        <span className="text-lg sm:text-xl flex-shrink-0">{implement.icon}</span>
                        <span className="text-sm sm:text-base truncate">{implement.name}</span>
                      </Label>
                    </div>
                    <span className="text-white/70 text-xs sm:text-sm ml-2 flex-shrink-0">S/ {implement.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Código Promocional */}
          <div className="space-y-4">
            <h3 className="text-[#FA7B21]">🎟️ Código Promocional (Opcional)</h3>

            <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-white/10">
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Ingresa tu código"
                  value={codigoPromocional}
                  onChange={(e) => setCodigoPromocional(e.target.value.toUpperCase())}
                  className="flex-1 bg-zinc-800 border-white/20 text-white uppercase"
                  disabled={codigoAplicado?.valido}
                />
                <Button
                  type="button"
                  onClick={handleAplicarCodigo}
                  disabled={codigoAplicado?.valido}
                  className="bg-[#FA7B21] hover:bg-[#F36A15] text-white px-6"
                >
                  Aplicar
                </Button>
              </div>

              {/* Mensaje de código aplicado */}
              {codigoAplicado?.valido && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-green-400 font-semibold mb-2">
                        ✅ Código "{codigoAplicado.codigo}" aplicado
                      </p>
                      <p className="text-green-300 text-sm mb-1">
                        🎁 {codigoAplicado.descripcion}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuitarCodigo}
                      className="text-green-300 hover:text-green-100 transition-colors ml-4"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mensaje de código inválido */}
              {codigoAplicado && !codigoAplicado.valido && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">
                    {codigoAplicado.mensaje}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de implementos incluidos */}
          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="text-[#FA7B21]">📦 Resumen de tu pedido</h3>
            
            <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-white/10">
              <h4 className="text-white mb-3 text-sm sm:text-base">Implementos que recibirá:</h4>
              
              {implementsForDiscount.filter(impl => !ownedImplements.includes(impl.id)).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
                  {implementsForDiscount
                    .filter(impl => !ownedImplements.includes(impl.id))
                    .map((implement) => (
                      <div key={implement.id} className="flex items-center gap-2 text-xs sm:text-sm text-white/80">
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                        <span className="truncate">{implement.icon} {implement.name}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-white/60 text-xs sm:text-sm mb-4">
                  Ya posee todos los implementos. Acceso completo al programa.
                </div>
              )}

              <Separator className="bg-white/10 mb-4" />

              {/* Cálculo del precio */}
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex justify-between text-white/70">
                  <span>Precio del programa:</span>
                  <span>S/ {BASE_PRICE}</span>
                </div>
                {ownedImplementsTotal > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Descuento (implementos):</span>
                    <span>- S/ {ownedImplementsTotal}</span>
                  </div>
                )}
                {descuentoCodigo > 0 && (
                  <div className="flex justify-between text-green-400 font-semibold">
                    <span>Descuento código promo:</span>
                    <span>- S/ {descuentoCodigo}</span>
                  </div>
                )}
                <Separator className="bg-white/10" />
                <div className="bg-gradient-to-br from-[#FA7B21]/20 to-[#FCA929]/10 border-2 border-[#FA7B21]/30 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Total a pagar:</span>
                    <span className="text-[#FCA929] text-2xl sm:text-3xl">S/ {finalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Envío */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-6 shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Procesando inscripción...
                </>
              ) : (
                '🐺 Confirmar Inscripción al Programa'
              )}
            </Button>

            <p className="text-white/50 text-xs text-center mt-3">
              Al inscribirte, aceptas los términos y condiciones del programa Leadership Wolf
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
