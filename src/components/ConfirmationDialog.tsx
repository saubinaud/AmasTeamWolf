import { useState, useCallback, memo, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { programImplements } from '../data/implements';
import { Separator } from './ui/separator';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const BASE_PRICE = 1499;

const INITIAL_FORM_STATE = {
  nombrePadre: '',
  nombreAlumno: '',
  correo: ''
};

export const ConfirmationDialog = memo(function ConfirmationDialog({ 
  isOpen, 
  onClose
}: ConfirmationDialogProps) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [ownedImplements, setOwnedImplements] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM_STATE);
      setOwnedImplements([]);
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

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

  // Calcular descuento basado en implementos que ya tiene (excluir membresía)
  const implementsForDiscount = programImplements.filter(impl => impl.id !== 'membership');
  const ownedImplementsTotal = implementsForDiscount
    .filter(impl => ownedImplements.includes(impl.id))
    .reduce((sum, impl) => sum + impl.price, 0);

  const finalPrice = BASE_PRICE - ownedImplementsTotal;

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
        setIsSuccess(true);
        toast.success('¡Inscripción confirmada!');
        
        // Resetear después de 2 segundos
        setTimeout(() => {
          setIsSuccess(false);
          setFormData(INITIAL_FORM_STATE);
          setOwnedImplements([]);
          onClose();
        }, 2500);
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

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(INITIAL_FORM_STATE);
      setOwnedImplements([]);
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        showCloseButton={false}
        className="bg-zinc-900 text-white border-2 border-[#FA7B21]/30 w-[calc(100%-1rem)] sm:w-full max-w-[95vw] sm:max-w-3xl p-4 sm:p-6"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex items-start justify-between mb-4 sm:mb-6 sticky top-0 bg-zinc-900 z-10 pb-3 sm:pb-4 border-b border-white/10 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex-1 pr-8">
            <DialogTitle className="text-white text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2">
              Inscripción - Programa Leadership Wolf 🐺
            </DialogTitle>
            <DialogDescription className="text-white/70 text-xs sm:text-sm md:text-base">
              Completa tus datos y selecciona los implementos que ya posees
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button 
              className="text-white/60 hover:text-white transition-colors flex-shrink-0 -mr-1 sm:mr-0 mt-1"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </DialogClose>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Datos básicos */}
            <div>
              <h3 className="text-white text-base sm:text-lg mb-4 border-b border-white/10 pb-2">
                Datos de Inscripción
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nombrePadre" className="text-white mb-2">
                    Nombre del Padre/Tutor *
                  </Label>
                  <Input
                    id="nombrePadre"
                    value={formData.nombrePadre}
                    onChange={(e) => handleInputChange('nombrePadre', e.target.value)}
                    placeholder="Nombre completo del padre/tutor"
                    className="bg-zinc-800 border-white/20 text-white"
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label htmlFor="nombreAlumno" className="text-white mb-2">
                    Nombre del Alumno *
                  </Label>
                  <Input
                    id="nombreAlumno"
                    value={formData.nombreAlumno}
                    onChange={(e) => handleInputChange('nombreAlumno', e.target.value)}
                    placeholder="Nombre completo del alumno"
                    className="bg-zinc-800 border-white/20 text-white"
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label htmlFor="correo" className="text-white mb-2">
                    Correo electrónico del responsable *
                  </Label>
                  <Input
                    id="correo"
                    type="email"
                    value={formData.correo}
                    onChange={(e) => handleInputChange('correo', e.target.value)}
                    placeholder="tu@email.com"
                    className="bg-zinc-800 border-white/20 text-white"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Selección de implementos que ya tiene */}
            <div>
              <h3 className="text-white text-base sm:text-lg mb-4 border-b border-white/10 pb-2">
                ¿Qué implementos ya posee?
              </h3>
              <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-white/10">
                <p className="text-white/60 text-xs sm:text-sm mb-4">
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

            {/* Resumen de implementos incluidos */}
            <div>
              <h3 className="text-white text-base sm:text-lg mb-4 border-b border-white/10 pb-2">
                📦 Resumen de tu pedido
              </h3>
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

            {/* Submit Button - sticky */}
            <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-zinc-900 border-t border-white/10">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-5 sm:py-6 text-sm sm:text-base md:text-lg shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
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
        ) : (
          <div className="py-8 sm:py-12 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
            <h3 className="text-white text-xl sm:text-2xl mb-2">¡Inscripción Exitosa! 🎉</h3>
            <p className="text-white/70 text-sm sm:text-base mb-2">
              Recibirás un correo con los detalles de tu inscripción
            </p>
            <p className="text-green-400 text-lg sm:text-xl">
              Total: S/ {finalPrice}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

export default ConfirmationDialog;
