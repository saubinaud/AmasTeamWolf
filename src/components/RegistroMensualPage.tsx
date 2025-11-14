import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Loader2, Upload, File, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';

interface RegistroMensualPageProps {
  onNavigateHome: () => void;
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

export function RegistroMensualPage({ onNavigateHome, onSuccess }: RegistroMensualPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [polosOption, setPolosOption] = useState<'0' | '1' | '2' | '3'>('0');
  const [includeUniform, setIncludeUniform] = useState(false);
  const [tallasPolos, setTallasPolos] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Scroll to top when component mounts
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const precioBase = 330;
  const preciosPolos = { '0': 0, '1': 60, '2': 110, '3': 150 };
  const precioUniforme = includeUniform ? 220 : 0;
  const total = precioBase + preciosPolos[polosOption] + precioUniforme;

  const needsUniformSize = includeUniform;
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
        programa: '1 Mes',
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
        uniformeAdicional: includeUniform ? 'Sí' : 'No',
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

      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/mensual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (response.ok || response.status === 200) {
        toast.success('¡Datos enviados correctamente! Ahora proceda con el pago.');
        
        // Limpiar formulario
        setFormData(INITIAL_FORM_STATE);
        setPolosOption('0');
        setIncludeUniform(false);
        setTallasPolos([]);
        setUploadedFile(null);
        setFileBase64('');
        
        // Abrir popup de pago
        onSuccess(total);
        
        // NO navegar automáticamente, dejar que el usuario cierre el popup
      } else {
        throw new Error('Error en el servidor');
      }
    } catch (error) {
      console.error('Error al enviar:', error);
      toast.error('Error al enviar los datos. Por favor intente nuevamente.');
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
            Formulario de Matrícula - Programa Mensual
          </h1>
          <p className="text-white/60">
            Complete los siguientes datos para inscribirse en el programa mensual
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 border border-[#FA7B21]/30 rounded-lg p-6 sm:p-8">
          {/* Datos del Alumno */}
          <div className="space-y-4">
            <h3 className="text-[#FA7B21]">Datos del Alumno</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombreAlumno" className="text-white mb-2 block">
                  Nombre Completo *
                </Label>
                <Input
                  id="nombreAlumno"
                  value={formData.nombreAlumno}
                  onChange={(e) => handleInputChange('nombreAlumno', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="dniAlumno" className="text-white mb-2 block">
                  DNI *
                </Label>
                <Input
                  id="dniAlumno"
                  value={formData.dniAlumno}
                  onChange={(e) => handleInputChange('dniAlumno', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  maxLength={8}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fechaNacimiento" className="text-white mb-2 block">
                Fecha de Nacimiento
              </Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          {/* Uniforme Opcional */}
          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="text-[#FA7B21]">Uniforme (Opcional)</h3>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeUniform"
                checked={includeUniform}
                onChange={(e) => setIncludeUniform(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#FA7B21] focus:ring-[#FA7B21]"
              />
              <Label htmlFor="includeUniform" className="text-white cursor-pointer">
                Agregar uniforme (+S/ 220)
              </Label>
            </div>

            {includeUniform && (
              <div>
                <Label htmlFor="tallaUniforme" className="text-white mb-2 block">
                  Talla de Uniforme *
                </Label>
                <select
                  id="tallaUniforme"
                  value={formData.tallaUniforme}
                  onChange={(e) => handleInputChange('tallaUniforme', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2"
                  required
                >
                  <option value="">Seleccione una talla</option>
                  <option value="2">2</option>
                  <option value="4">4</option>
                  <option value="6">6</option>
                  <option value="8">8</option>
                  <option value="10">10</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>
            )}
          </div>

          {/* Polos Adicionales */}
          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="text-[#FA7B21]">Polos Adicionales (Opcional)</h3>
            
            <div>
              <Label className="text-white mb-2 block">¿Desea agregar polos adicionales?</Label>
              <select
                value={polosOption}
                onChange={(e) => handlePolosChange(e.target.value as '0' | '1' | '2' | '3')}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2"
              >
                <option value="0">No, gracias</option>
                <option value="1">1 Polo (+S/ 60)</option>
                <option value="2">2 Polos (+S/ 110)</option>
                <option value="3">3 Polos (+S/ 150)</option>
              </select>
            </div>

            {needsPoloSize && tallasPolos.map((talla, index) => (
              <div key={index}>
                <Label className="text-white mb-2 block">Talla Polo {index + 1}</Label>
                <select
                  value={talla}
                  onChange={(e) => handleTallaPoloChange(index, e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2"
                  required
                >
                  <option value="">Seleccione una talla</option>
                  <option value="2">2</option>
                  <option value="4">4</option>
                  <option value="6">6</option>
                  <option value="8">8</option>
                  <option value="10">10</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>
            ))}
          </div>

          {/* Datos del Padre/Tutor */}
          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="text-[#FA7B21]">Datos del Padre/Tutor</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombrePadre" className="text-white mb-2 block">
                  Nombre Completo *
                </Label>
                <Input
                  id="nombrePadre"
                  value={formData.nombrePadre}
                  onChange={(e) => handleInputChange('nombrePadre', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="dniPadre" className="text-white mb-2 block">
                  DNI *
                </Label>
                <Input
                  id="dniPadre"
                  value={formData.dniPadre}
                  onChange={(e) => handleInputChange('dniPadre', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  maxLength={8}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="direccion" className="text-white mb-2 block">
                Dirección
              </Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-white mb-2 block">
                Correo Electrónico *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="text-[#FA7B21]">Información del Programa</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaInicio" className="text-white mb-2 block">
                  Fecha de Inicio *
                </Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="fechaFin" className="text-white mb-2 block">
                  Fecha de Fin (opcional)
                </Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Upload del Contrato */}
          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="text-[#FA7B21]">Contrato Firmado</h3>
            
            <div>
              <Label className="text-white mb-2 block">
                Suba el contrato firmado (PDF, imagen o documento Word, máx. 5MB)
              </Label>
              
              {!uploadedFile ? (
                <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-white/60" />
                    <p className="text-sm text-white/60">Click para subir archivo</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                </label>
              ) : (
                <div className="mt-2 flex items-center gap-3 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                  <File className="w-6 h-6 text-[#FA7B21]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-white/60">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de Costos */}
          <div className="border-t border-white/10 pt-6">
            <div className="bg-zinc-800/50 rounded-lg p-6 space-y-3">
              <h3 className="text-[#FA7B21] mb-4">Resumen de Costos</h3>
              
              <div className="flex justify-between text-white/80">
                <span>Programa Mensual:</span>
                <span>S/ {precioBase}</span>
              </div>
              
              {includeUniform && (
                <div className="flex justify-between text-white/80">
                  <span>Uniforme:</span>
                  <span>S/ {precioUniforme}</span>
                </div>
              )}
              
              {polosOption !== '0' && (
                <div className="flex justify-between text-white/80">
                  <span>Polos adicionales ({polosOption}):</span>
                  <span>S/ {preciosPolos[polosOption]}</span>
                </div>
              )}
              
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between text-white">
                  <span>Total:</span>
                  <span>S/ {total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Envío */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FA7B21] hover:bg-[#FA7B21]/90 text-white py-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Matrícula'
              )}
            </Button>
          </div>

          <p className="text-xs text-white/60 text-center">
            * Campos obligatorios. Sus datos serán procesados de forma segura.
          </p>
        </form>
      </div>
    </div>
  );
}