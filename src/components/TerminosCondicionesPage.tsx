import { ArrowLeft } from 'lucide-react';

interface TerminosCondicionesPageProps {
    onNavigate: (page: string) => void;
}

export function TerminosCondicionesPage({ onNavigate }: TerminosCondicionesPageProps) {
    return (
        <div className="min-h-screen bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-[#FA7B21]/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#FCA929]/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-4xl mx-auto">
                {/* Back button */}
                <button
                    onClick={() => onNavigate('home')}
                    className="flex items-center text-white/60 hover:text-[#FCA929] transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al Inicio
                </button>

                {/* Content Card */}
                <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-10 pb-8 border-b border-white/10">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FA7B21]/30">
                            <span className="text-3xl">📜</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                            Términos y Condiciones
                        </h1>
                        <p className="text-white/60">
                            Academia de Artes Marciales AMAS
                        </p>
                    </div>

                    {/* Terms Content */}
                    <div className="prose prose-invert max-w-none space-y-8">

                        {/* Section 1 */}
                        <section>
                            <h2 className="text-xl font-bold text-[#FCA929] mb-4">1. OBJETO Y ACEPTACIÓN</h2>
                            <p className="text-white/80 leading-relaxed">
                                El presente documento establece las condiciones que regulan el acceso y uso del sitio web de la Academia de Artes Marciales AMAS. Al navegar o utilizar nuestros servicios digitales, el usuario (padre, madre o tutor) acepta estos términos en su totalidad. Si no está de acuerdo con alguna cláusula, deberá abstenerse de utilizar el portal.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2 className="text-xl font-bold text-[#FCA929] mb-4">2. REGISTRO Y RESPONSABILIDAD DE DATOS</h2>
                            <ul className="space-y-3 text-white/80">
                                <li>
                                    <strong className="text-white">Menores de Edad:</strong> El registro de alumnos menores de 18 años debe ser realizado exclusivamente por su padre, madre o tutor legal.
                                </li>
                                <li>
                                    <strong className="text-white">Veracidad:</strong> El tutor garantiza que toda la información proporcionada (nombres, DNI, fecha de nacimiento y estado de salud) es veraz y actual.
                                </li>
                                <li>
                                    <strong className="text-white">Uso de Cuenta:</strong> El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.
                                </li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2 className="text-xl font-bold text-[#FCA929] mb-4">3. SERVICIOS Y PAGOS ELECTRÓNICOS</h2>
                            <ul className="space-y-3 text-white/80">
                                <li>
                                    <strong className="text-white">Pasarela de Pagos:</strong> Todos los pagos realizados a través de la web por conceptos de membresía, programas o implementos están sujetos a verificación.
                                </li>
                                <li>
                                    <strong className="text-white">Política de No Reembolso:</strong> Siguiendo la política estricta de la academia, no se realizarán devoluciones de dinero por pagos efectuados a través de la plataforma web bajo ningún concepto.
                                </li>
                                <li>
                                    <strong className="text-white">Precios:</strong> La academia se reserva el derecho de modificar los precios de los programas y promociones sin previo aviso, respetando los montos ya pagados por membresías activas.
                                </li>
                            </ul>
                        </section>

                        {/* Section 4 */}
                        <section>
                            <h2 className="text-xl font-bold text-[#FCA929] mb-4">4. INFRAESTRUCTURA Y SEGURIDAD (CLOUDFLARE)</h2>
                            <p className="text-white/80 leading-relaxed mb-3">
                                Para garantizar una experiencia de navegación rápida y segura, nuestro sitio web utiliza los servicios de Cloudflare.
                            </p>
                            <ul className="space-y-3 text-white/80">
                                <li>
                                    <strong className="text-white">Seguridad:</strong> El usuario acepta que el tráfico hacia el sitio web sea monitoreado para detectar amenazas, ataques de denegación de servicio (DDoS) y garantizar la integridad de los datos transaccionales.
                                </li>
                                <li>
                                    <strong className="text-white">Disponibilidad:</strong> Aunque nos esforzamos por mantener el sitio activo 24/7, la academia no se hace responsable por interrupciones técnicas ajenas a nuestro control o por periodos de mantenimiento.
                                </li>
                            </ul>
                        </section>

                        {/* Section 5 */}
                        <section>
                            <h2 className="text-xl font-bold text-[#FCA929] mb-4">5. PROPIEDAD INTELECTUAL</h2>
                            <p className="text-white/80 leading-relaxed">
                                Todo el contenido del sitio web (logotipos de AMAS, fotografías de alumnos, videos de entrenamiento, textos y metodologías) es propiedad exclusiva de la Academia AMAS o cuenta con las autorizaciones correspondientes. Queda prohibida su reproducción, copia o distribución sin autorización expresa.
                            </p>
                        </section>

                        {/* Section 6 */}
                        <section>
                            <h2 className="text-xl font-bold text-[#FCA929] mb-4">6. PROTECCIÓN DE DATOS PERSONALES (LEY 29733)</h2>
                            <p className="text-white/80 leading-relaxed mb-3">
                                De acuerdo con la legislación peruana, los datos personales recolectados a través de formularios web serán tratados con la finalidad de gestionar la matrícula del alumno y enviar información comercial relevante.
                            </p>
                            <ul className="space-y-3 text-white/80">
                                <li>
                                    <strong className="text-white">Consentimiento de Imagen:</strong> Al registrar al menor en actividades que se transmitan o promocionen vía web, el tutor acepta la política de uso de imagen detallada en el convenio de membresía.
                                </li>
                                <li>
                                    <strong className="text-white">Derechos ARCO:</strong> El usuario puede solicitar el acceso, rectificación o cancelación de sus datos enviando un correo a la administración de la academia.
                                </li>
                            </ul>
                        </section>

                        {/* Section 7 */}
                        <section>
                            <h2 className="text-xl font-bold text-[#FCA929] mb-4">7. CONDUCTA EN EL ENTORNO DIGITAL</h2>
                            <p className="text-white/80 leading-relaxed mb-3">
                                La academia se reserva el derecho de admisión y el derecho de bloquear el acceso a cualquier usuario que:
                            </p>
                            <ul className="space-y-2 text-white/80 list-disc list-inside">
                                <li>Proporcione información falsa o fraudulenta.</li>
                                <li>Realice comentarios injuriosos en blogs o secciones interactivas que dañen la imagen de la institución o su staff.</li>
                                <li>Intente vulnerar la seguridad del sitio web.</li>
                            </ul>
                        </section>

                        {/* Section 8 */}
                        <section>
                            <h2 className="text-xl font-bold text-[#FCA929] mb-4">8. LEY APLICABLE Y JURISDICCIÓN</h2>
                            <p className="text-white/80 leading-relaxed">
                                Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia será resuelta ante los jueces y tribunales del distrito judicial de Lima.
                            </p>
                        </section>

                    </div>

                    {/* Footer */}
                    <div className="mt-10 pt-8 border-t border-white/10 text-center">
                        <p className="text-white/40 text-sm">
                            Última actualización: Enero 2026
                        </p>
                        <button
                            onClick={() => onNavigate('home')}
                            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white rounded-lg hover:from-[#F36A15] hover:to-[#FA7B21] transition-all"
                        >
                            Aceptar y Volver
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
