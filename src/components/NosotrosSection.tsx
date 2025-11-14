import { Award, Users, Target, Heart } from 'lucide-react';

export function NosotrosSection() {
  const values = [
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Disciplina',
      description: 'Formamos hábitos que transforman vidas'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Respeto',
      description: 'Cultivamos valores fundamentales'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Excelencia',
      description: 'Buscamos la mejora continua'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Comunidad',
      description: 'Creamos familia y pertenencia'
    }
  ];

  return (
    <section id="nosotros" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-zinc-950 to-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(252, 169, 41, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(252, 169, 41, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#FA7B21]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FCA929]/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-[#431C28]/30 border border-[#FA7B21]/30 rounded-full px-6 py-2 mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 bg-[#FCA929] rounded-full" />
            <span className="text-[#FCA929] text-xs sm:text-sm uppercase tracking-wider">Nuestra Filosofía</span>
          </div>
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 px-4"
            style={{
              background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 50%, #FA7B21 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Nosotros
          </h2>
          <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-3xl mx-auto px-4 leading-relaxed">
            En <span className="text-[#FCA929] font-semibold">AMAS Team Wolf</span> creemos que el taekwondo va más allá del deporte:
            Es una herramienta para forjar carácter, disciplina y propósito.
            Cada entrenamiento es una oportunidad para aprender a superarse,
            liderar con el ejemplo y crecer como persona dentro y fuera del tatami.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-[#FA7B21]/30 rounded-2xl p-6 sm:p-8 md:p-10">
            <div className="flex items-start gap-4">
              <div>
                <h3 className="text-white text-xl sm:text-2xl mb-3">
                  Nuestra Misión
                </h3>
                <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                  Formamos líderes capaces de inspirar a otros a través del taekwondo.
                  Nuestro propósito es guiar a cada alumno en un proceso de desarrollo físico, mental y emocional,
                  cultivando valores de respeto, perseverancia y confianza.
                  En cada clase, promovemos la excelencia, el compromiso y el trabajo en equipo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 hover:border-[#FA7B21]/30 transition-all duration-300"
            >
              <div className="text-[#FCA929] mb-4">
                {value.icon}
              </div>
              <h4 className="text-white text-lg mb-2">
                {value.title}
              </h4>
              <p className="text-white/70 text-sm">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
          {[
            { number: '300+', label: 'Estudiantes' },
            { number: '1', label: 'Sede' },
            { number: '3', label: 'Años' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-[#FCA929] text-3xl sm:text-4xl md:text-5xl mb-2">
                {stat.number}
              </div>
              <div className="text-white/70 text-sm sm:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
