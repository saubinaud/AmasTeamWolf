import React from 'react';
import { 
  ChevronLeft, 
  ShieldCheck, 
  CreditCard, 
  Cloud, 
  Copyright, 
  FileLock, 
  UserX, 
  Gavel,
  ScrollText,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILITIES ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- INTERFACES ---
interface TerminosPageProps {
  onNavigate: (page: string) => void;
}

interface SectionProps {
  title: string;
  content: React.ReactNode;
  icon: React.ReactNode;
  delay: number;
  isWarning?: boolean;
}

// --- COMPONENTES UI (In-line para evitar dependencias externas) ---
const Card = ({ children, className, isWarning = false }: { children: React.ReactNode; className?: string; isWarning?: boolean }) => (
  <div className={cn(
    "relative overflow-hidden rounded-xl border bg-zinc-900/50 p-6 backdrop-blur-md transition-all hover:bg-zinc-900/80",
    isWarning 
      ? "border-orange-500/30 shadow-[0_0_15px_rgba(250,123,33,0.1)]" 
      : "border-white/10 hover:border-white/20",
    className
  )}>
    {children}
  </div>
);

const SectionItem = ({ title, content, icon, delay, isWarning }: SectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    <Card isWarning={isWarning} className="h-full">
      <div className="flex items-start gap-4">
        <div className={cn(
          "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
          isWarning 
            ? "border-orange-500/50 bg-orange-500/10 text-[#FA7B21]" 
            : "border-white/10 bg-white/5 text-white/70"
        )}>
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className={cn("font-semibold text-lg", isWarning ? "text-[#FA7B21]" : "text-white")}>
            {title}
          </h3>
          <div className="text-sm leading-relaxed text-neutral-400">
            {content}
          </div>
        </div>
      </div>
    </Card>
  </motion.div>
);

// --- COMPONENTE PRINCIPAL ---
export default function TerminosPage({ onNavigate }: TerminosPageProps) {
  
  // Si no se pasa onNavigate (ej. preview), usamos una función dummy
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('login'); // O 'home' dependiendo de tu flujo
    } else {
      console.log("Navegar atrás");
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col relative font-sans overflow-x-hidden">
      
      {/* --- BACKGROUND EFFECTS (Idéntico al Login) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div 
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[150%] h-[40vh] opacity-20 blur-[80px]"
          style={{ background: 'radial-gradient(circle, #FA7B21 0%, transparent 70%)' }}
        />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* --- HEADER --- */}
      <div className="relative z-50 w-full px-4 py-6 flex justify-between items-center max-w-5xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/70 hover:text-[#FA7B21] transition-colors py-2 px-1 active:scale-95 group"
        >
          <ChevronLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
          <span className="text-base font-medium">Volver</span>
        </button>
        <div className="hidden sm:block text-xs text-white/30 uppercase tracking-widest">
            Academia AMAS
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-20">
        
        {/* Title Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#FA7B21]/20 to-transparent border border-[#FA7B21]/30 mb-2">
            <ScrollText className="h-8 w-8 text-[#FA7B21]" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Términos y <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FA7B21] to-[#E65C0F]">Condiciones</span>
          </h1>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Por favor, lee detenidamente las normas que rigen el uso de nuestro portal y servicios digitales en la Academia de Artes Marciales AMAS.
          </p>
        </motion.div>

        {/* Grid de Contenido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. Objeto */}
            <SectionItem 
                delay={0.1}
                title="1. Objeto y Aceptación"
                icon={<ShieldCheck className="h-5 w-5" />}
                content={
                    <p>
                        Este documento regula el acceso y uso del sitio web de AMAS. Al navegar, el usuario (padre, madre o tutor) 
                        acepta estos términos. Si no estás de acuerdo, debes abstenerte de usar el portal.
                    </p>
                }
            />

            {/* 2. Registro */}
            <SectionItem 
                delay={0.2}
                title="2. Registro y Datos"
                icon={<UserX className="h-5 w-5" />}
                content={
                    <ul className="list-disc list-inside space-y-1 text-neutral-400">
                        <li><strong className="text-neutral-300">Menores:</strong> Registro exclusivo por tutores legales.</li>
                        <li><strong className="text-neutral-300">Veracidad:</strong> El tutor garantiza que los datos (DNI, salud, etc.) son reales.</li>
                        <li><strong className="text-neutral-300">Seguridad:</strong> Eres responsable de tus claves de acceso.</li>
                    </ul>
                }
            />

            {/* 3. Pagos y Reembolsos (WARNING STYLE) */}
            <SectionItem 
                delay={0.3}
                title="3. Servicios y Pagos"
                icon={<CreditCard className="h-5 w-5" />}
                isWarning={true}
                content={
                    <div className="space-y-3">
                        <p>Todos los pagos están sujetos a verificación. Nos reservamos el derecho de modificar precios de promociones futuras.</p>
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex gap-2">
                            <AlertCircle className="h-4 w-4 text-[#FA7B21] shrink-0 mt-0.5" />
                            <p className="text-xs text-[#FA7B21] font-medium">
                                POLÍTICA ESTRICTA: No se realizarán reembolsos ni devoluciones de dinero por pagos efectuados vía web bajo ningún concepto.
                            </p>
                        </div>
                    </div>
                }
            />

            {/* 4. Infraestructura Cloudflare */}
            <SectionItem 
                delay={0.4}
                title="4. Infraestructura y Seguridad"
                icon={<Cloud className="h-5 w-5" />}
                content={
                    <p>
                        Utilizamos <strong className="text-white">Cloudflare</strong> para proteger tu navegación. El tráfico es monitoreado para prevenir ataques DDoS y garantizar la integridad de los datos. 
                        No nos hacemos responsables por fallos técnicos ajenos a nuestro control.
                    </p>
                }
            />

            {/* 5. Propiedad Intelectual */}
            <SectionItem 
                delay={0.5}
                title="5. Propiedad Intelectual"
                icon={<Copyright className="h-5 w-5" />}
                content={
                    <p>
                        Todo el contenido (logos AMAS, fotos de alumnos, metodologías y videos) es propiedad exclusiva de la Academia. 
                        Queda prohibida su copia o distribución sin autorización expresa.
                    </p>
                }
            />

            {/* 6. Protección de Datos */}
            <SectionItem 
                delay={0.6}
                title="6. Protección de Datos (Ley 29733)"
                icon={<FileLock className="h-5 w-5" />}
                content={
                    <p>
                        Tus datos gestionan la matrícula y envíos informativos. Al registrar al menor, aceptas la política de imagen del convenio.
                        Puedes ejercer tus derechos ARCO contactando a la administración.
                    </p>
                }
            />

            {/* 7. Conducta */}
            <SectionItem 
                delay={0.7}
                title="7. Conducta Digital"
                icon={<UserX className="h-5 w-5" />}
                content={
                    <p>
                        Nos reservamos el derecho de bloquear usuarios que proporcionen datos falsos, realicen comentarios injuriosos 
                        o intenten vulnerar la seguridad del sitio.
                    </p>
                }
            />

            {/* 8. Ley Aplicable */}
            <SectionItem 
                delay={0.8}
                title="8. Ley Aplicable"
                icon={<Gavel className="h-5 w-5" />}
                content={
                    <p>
                        Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia se resolverá 
                        en los tribunales del distrito judicial de Lima.
                    </p>
                }
            />

        </div>

        {/* Footer Note */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center border-t border-white/10 pt-8"
        >
            <p className="text-xs text-neutral-500">
                Última actualización: Diciembre 2025 · Academia AMAS
            </p>
        </motion.div>

      </div>
    </div>
  );
}