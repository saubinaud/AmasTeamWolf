import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { trackEvent } from '../../utils/pixel';

interface FormularioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormularioModal({ isOpen, onOpenChange }: FormularioModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombrePadre: '',
    nombreAlumno: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
    objetivo: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombrePadre || !formData.nombreAlumno || !formData.telefono || !formData.email || !formData.fechaNacimiento) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Enviar a Webhook
      const { API_BASE } = await import('../../config/api');
      const response = await fetch(`${API_BASE}/leads/showroom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_padre: formData.nombrePadre,
          nombre_alumno: formData.nombreAlumno,
          telefono: formData.telefono,
          email: formData.email,
          fecha_nacimiento: formData.fechaNacimiento,
          objetivo: formData.objetivo,
          source: 'landing_clase_prueba',
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        toast.success('¡Registro enviado con éxito! Redirigiendo a WhatsApp...');

        // 2. Abrir WhatsApp
        const message = encodeURIComponent(
          `Hola, soy ${formData.nombrePadre}. Acabo de registrarme para la clase de prueba de mi hijo/a ${formData.nombreAlumno}.`
        );

        // Track Lead Event
        trackEvent('Lead', {
          content_name: 'LandingForm',
          content_category: 'TrialClass',
          value: 0.00,
          currency: 'PEN'
        });

        window.open(`https://wa.me/51989717412?text=${message}`, '_blank');

        onOpenChange(false);
        setFormData({
          nombrePadre: '',
          nombreAlumno: '',
          telefono: '',
          email: '',
          fechaNacimiento: '',
          objetivo: ''
        });
      } else {
        throw new Error('Error en el servidor');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar el registro. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border border-[#FA7B21]/30 text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">
            Agendar Clase de Prueba
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Completa tus datos para coordinar tu visita.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="nombrePadre">Nombre del Padre/Madre *</Label>
            <Input
              id="nombrePadre"
              value={formData.nombrePadre}
              onChange={(e) => handleInputChange('nombrePadre', e.target.value)}
              placeholder="Tu nombre completo"
              required
              className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">WhatsApp *</Label>
            <Input
              id="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              placeholder="999 999 999"
              required
              className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombreAlumno">Nombre del Alumno/a *</Label>
            <Input
              id="nombreAlumno"
              value={formData.nombreAlumno}
              onChange={(e) => handleInputChange('nombreAlumno', e.target.value)}
              placeholder="Nombre de tu hijo/a"
              required
              className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de Nacimiento del Alumno/a *</Label>
            <Input
              id="fechaNacimiento"
              type="date"
              value={formData.fechaNacimiento}
              onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
              required
              className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="tu@email.com"
              required
              className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo Principal (Opcional)</Label>
            <Textarea
              id="objetivo"
              value={formData.objetivo}
              onChange={(e) => handleInputChange('objetivo', e.target.value)}
              placeholder="Ej: Mejorar disciplina, confianza, defensa personal..."
              className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-bold py-6 mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Confirmar Clase de Prueba'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
