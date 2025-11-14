import { useState, useCallback, memo, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { X, Loader2, Upload, File, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';

interface FormularioMatriculaProps {
  isOpen: boolean;
  onClose: () => void;
  programa: 'full' | '1mes';
  onSuccess: (total: number) => void;
}

const INITIAL_FORM_STATE = {
  nombreAlumno: '',
  dniAlumno: '',
  fechaNacimiento: '',
  tallaUniforme: '',
  nombrePadre: '',
  dniPadre: '',
  direccion: '',
  email: '',
  fechaInicio: '',
  fechaFin: ''
};

export const FormularioMatricula = memo(function FormularioMatricula({ isOpen, onClose, programa, onSuccess }: FormularioMatriculaProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [polosOption, setPolosOption] = useState<'0' | '1' | '2' | '3'>('0');
  const [includeUniform, setIncludeUniform] = useState(false);
  const [tallasPolos, setTallasPolos] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all form state
      setFormData(INITIAL_FORM_STATE);
      setPolosOption('0');
      setIncludeUniform(false);
      setTallasPolos([]);
      setUploadedFile(null);
      setFileBase64('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const precioBase = programa === 'full' ? 869 : 330;
  const preciosPolos = { '0': 0, '1': 60, '2': 110, '3': 150 };
  const precioUniforme = programa === '1mes' && includeUniform ? 220 : 0;
  const total = precioBase + preciosPolos[polosOption] + precioUniforme;

  const needsUniformSize = programa === 'full' || (programa === '1mes' && includeUniform);
  const needsPoloSize = polosOption !== '0';

  const handlePolosChange = useCallback((value: '0' | '1' | '2' | '3') => {
    setPolosOption(value);
    const numPolos = parseInt(value);
    setTallasPolos(new Array(numPolos).fill(''));
  }, []);

  const handleTallaPoloChange = useCallback((index: number, talla: string) => {
    setTallasPolos(prev => {
      const newTallas = [...prev];
      newTallas[index] = talla;
      return newTallas;
    });
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de archivo no válido. Use PDF, imagen o documento Word.');
      return;
    }

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setFileBase64(base64String);
      toast.success('Archivo cargado correctamente');
    };
    reader.onerror = () => {
      toast.error('Error al leer el archivo');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setFileBase64('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombreAlumno || !formData.dniAlumno || !formData.nombrePadre || !formData.dniPadre || !formData.email || !formData.fechaInicio) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    if (needsUniformSize && !formData.tallaUniforme) {
      toast.error('Por favor seleccione la talla de uniforme');
      return;
    }

    if (needsPoloSize && tallasPolos.some(talla => !talla)) {
      toast.error('Por favor seleccione todas las tallas de los polos');
      return;
    }

    if (!uploadedFile) {
      const confirm = window.confirm('No ha subido el contrato firmado. ¿Desea continuar de todas formas?');
      if (!confirm) return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        programa: programa === 'full' ? '3 Meses Full' : '1 Mes',
        nombreAlumno: formData.nombreAlumno,
        dniAlumno: formData.dniAlumno,
        fechaNacimiento: formData.fechaNacimiento,
        tallaUniforme: needsUniformSize ? formData.tallaUniforme : 'No aplica',
        tallasPolos: needsPoloSize ? tallasPolos : [],
        nombrePadre: formData.nombrePadre,
        dniPadre: formData.dniPadre,
        direccion: formData.direccion,
        email: formData.email,
        polos: polosOption === '0' ? 'No' : `${polosOption} polo(s)`,
        precioPolos: preciosPolos[polosOption],
        uniformeAdicional: programa === '1mes' ? (includeUniform ? 'Sí' : 'No') : 'Incluido',
        precioUniforme: precioUniforme,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin || 'No especificada',
        precioPrograma: precioBase,
        total: total,
        contratoFirmado: uploadedFile ? {
          nombre: uploadedFile.name,
          tipo: uploadedFile.type,
          tamaño: uploadedFile.size,
          base64: fileBase64
        } : null,
        fechaRegistro: new Date().toISOString()
      };

      const webhookUrl = programa === 'full' 
        ? 'https://pallium-n8n.s6hx3x.easypanel.host/webhook/programa3meses'
        : 'https://pallium-n8n.s6hx3x.easypanel.host/webhook/mensual';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (response.ok || response.status === 200) {
        toast.success('¡Datos enviados correctamente! La fecha de vencimiento se enviará por correo.');
        onSuccess(total);
        onClose();
        
        // Reset form
        setFormData({
          nombreAlumno: '',
          dniAlumno: '',
          fechaNacimiento: '',
          tallaUniforme: '',
          nombrePadre: '',
          dniPadre: '',
          direccion: '',
          email: '',
          fechaInicio: '',
          fechaFin: ''
        });
        setPolosOption('0');
        setTallasPolos([]);
        setIncludeUniform(false);
        setUploadedFile(null);
        setFileBase64('');
      } else {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error completo:', error);
      toast.error('Hubo un error al enviar los datos. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tallasOptions = ['2', '4', '6', '8', '10', '12', '14', 'S', 'M', 'L', 'XL'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false}
        className="bg-zinc-900 border-2 border-[#FA7B21]/30 w-[calc(100%-1rem)] sm:w-full max-w-[95vw] sm:max-w-3xl p-4 sm:p-6"
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
              Datos de Matrícula
            </DialogTitle>
            <DialogDescription className="text-white/70 text-xs sm:text-sm md:text-base">
              Programa: <span className="text-[#FCA929]">
                {programa === 'full' ? '3 Meses Full' : '1 Mes'}
              </span>
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

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Datos del Alumno */}
          <div>
            <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
              Datos del Alumno
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombreAlumno" className="text-white mb-2">
                  Nombre completo *
                </Label>
                <Input
                  id="nombreAlumno"
                  value={formData.nombreAlumno}
                  onChange={(e) => handleInputChange('nombreAlumno', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="dniAlumno" className="text-white mb-2">
                  DNI *
                </Label>
                <Input
                  id="dniAlumno"
                  value={formData.dniAlumno}
                  onChange={(e) => handleInputChange('dniAlumno', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
                  maxLength={8}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fechaNacimiento" className="text-white mb-2">
                  Fecha de nacimiento
                </Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
                />
              </div>
            </div>
          </div>

          {/* Datos del Padre */}
          <div>
            <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
              Datos del Padre de Familia
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombrePadre" className="text-white mb-2">
                  Nombre completo *
                </Label>
                <Input
                  id="nombrePadre"
                  value={formData.nombrePadre}
                  onChange={(e) => handleInputChange('nombrePadre', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="dniPadre" className="text-white mb-2">
                  DNI *
                </Label>
                <Input
                  id="dniPadre"
                  value={formData.dniPadre}
                  onChange={(e) => handleInputChange('dniPadre', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
                  maxLength={8}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-white mb-2">
                  Correo electrónico *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="direccion" className="text-white mb-2">
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
                  autoComplete="street-address"
                />
              </div>
            </div>
          </div>

          {/* Uniforme adicional para programa 1 mes */}
          {programa === '1mes' && (
            <div>
              <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
                Uniforme (Adicional)
              </h3>
              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 rounded-lg border-2 border-white/10 hover:border-[#FA7B21]/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeUniform}
                    onChange={(e) => setIncludeUniform(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-white/20 bg-zinc-800 text-[#FA7B21] focus:ring-[#FA7B21] focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <div className="text-white text-base mb-1">
                      Añadir Uniforme Completo - S/ 220
                    </div>
                    <p className="text-sm text-white/60">
                      El uniforme no está incluido en el programa de 1 mes
                    </p>
                  </div>
                </label>
                
                {includeUniform && (
                  <div>
                    <Label htmlFor="tallaUniforme" className="text-white mb-2">
                      Talla de uniforme *
                    </Label>
                    <select
                      id="tallaUniforme"
                      value={formData.tallaUniforme}
                      onChange={(e) => handleInputChange('tallaUniforme', e.target.value)}
                      className="w-full bg-zinc-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FA7B21] focus:border-transparent"
                      required={includeUniform}
                    >
                      <option value="">Seleccione talla</option>
                      {tallasOptions.map(talla => (
                        <option key={talla} value={talla}>Talla {talla}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Talla de uniforme para programa 3 meses */}
          {programa === 'full' && (
            <div>
              <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
                Talla de Uniforme
              </h3>
              <div>
                <Label htmlFor="tallaUniforme" className="text-white mb-2">
                  Talla de uniforme (incluido) *
                </Label>
                <select
                  id="tallaUniforme"
                  value={formData.tallaUniforme}
                  onChange={(e) => handleInputChange('tallaUniforme', e.target.value)}
                  className="w-full bg-zinc-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FA7B21] focus:border-transparent"
                  required
                >
                  <option value="">Seleccione talla</option>
                  {tallasOptions.map(talla => (
                    <option key={talla} value={talla}>Talla {talla}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Polos Adicionales */}
          <div>
            <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
              Adicionales (Opcional)
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-3 block">
                  ¿Desea añadir polos?
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: '0', label: 'Ninguno', price: '' },
                    { value: '1', label: '1', price: 'S/ 60' },
                    { value: '2', label: '2', price: 'S/ 110' },
                    { value: '3', label: '3', price: 'S/ 150' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        polosOption === option.value ? 'border-[#FA7B21] bg-[#FA7B21]/10' : 'border-white/20 hover:border-white/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="polos"
                        value={option.value}
                        checked={polosOption === option.value}
                        onChange={(e) => handlePolosChange(e.target.value as '0' | '1' | '2' | '3')}
                        className="w-4 h-4 text-[#FA7B21] focus:ring-[#FA7B21] focus:ring-offset-0 bg-zinc-800 border-white/20"
                      />
                      <div className="text-white text-sm sm:text-base flex-1">
                        {option.label === 'Ninguno' ? option.label : `${option.label} × ${option.price}`}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {needsPoloSize && (
                <div className="space-y-3">
                  <Label className="text-white">Tallas de polos *</Label>
                  {Array.from({ length: parseInt(polosOption) }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Label className="text-white/70 min-w-[100px]">
                        Polo {index + 1}:
                      </Label>
                      <select
                        value={tallasPolos[index] || ''}
                        onChange={(e) => handleTallaPoloChange(index, e.target.value)}
                        className="flex-1 bg-zinc-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FA7B21] focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar talla</option>
                        {tallasOptions.map(talla => (
                          <option key={talla} value={talla}>Talla {talla}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fecha de Inicio y Fin */}
          <div>
            <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
              Fechas del Programa
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaInicio" className="text-white mb-2">
                  Fecha de inicio *
                </Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="fechaFin" className="text-white mb-2">
                  Fecha de fin (opcional)
                </Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
                />
              </div>
            </div>
            <div className="bg-[#FA7B21]/10 border border-[#FA7B21]/30 rounded-lg p-4 mt-4">
              <p className="text-white/80 text-sm">
                ℹ️ Todos los datos serán enviados por correo
              </p>
            </div>
          </div>

          {/* File Upload Section - Simplified */}
          <div>
            <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
              Contrato Firmado (Opcional)
            </h3>
            {!uploadedFile ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-[#FA7B21]/50 transition-colors bg-zinc-800/30">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-white/40" />
                  <p className="mb-2 text-sm text-white/60">
                    <span className="font-semibold">Click para subir</span> o arrastra aquí
                  </p>
                  <p className="text-xs text-white/40">PDF, JPG, PNG (MAX. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-[#FA7B21]/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-8 h-8 text-[#FCA929]" />
                  <div>
                    <p className="text-white text-sm">{uploadedFile.name}</p>
                    <p className="text-white/40 text-xs">
                      {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-white/60 hover:text-red-500 transition-colors p-2"
                  style={{
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-[#FA7B21]/20 to-[#FCA929]/10 border-2 border-[#FA7B21]/30 rounded-lg p-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white text-lg">Total a pagar:</span>
              <span className="text-[#FCA929] text-3xl">S/ {total}</span>
            </div>
            {(polosOption !== '0' || precioUniforme > 0) && (
              <div className="text-white/60 text-sm space-y-1 pt-3 border-t border-white/10">
                <p>Programa: S/ {precioBase}</p>
                {programa === '1mes' && includeUniform && <p>Uniforme: S/ {precioUniforme}</p>}
                {polosOption !== '0' && <p>Polos: S/ {preciosPolos[polosOption]}</p>}
              </div>
            )}
          </div>

          {/* Submit Button */}
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
                  Enviando datos...
                </>
              ) : (
                'Enviar datos'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});