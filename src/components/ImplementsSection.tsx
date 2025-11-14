import { motion } from 'motion/react';
import { programImplements } from '../data/implements';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export function ImplementsSection() {
  return (
    <section id="implementos" className="py-12 sm:py-16 md:py-20 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-white mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl">Implementos del Programa Leadership Wolf</h2>
          <p className="text-white/70 text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-4">
            Equipamiento específico con características técnicas precisas
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5 max-w-7xl mx-auto">
          {programImplements.map((implement, index) => (
            <motion.div
              key={implement.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -10, scale: 1.03 }}
              className="w-full"
            >
              <Card className="bg-[#222222] border border-white/5 overflow-hidden h-full hover:border-[#FA7B21]/40 transition-all duration-300 shadow-lg hover:shadow-[#FA7B21]/10">
                <div className="aspect-square overflow-hidden relative">
                  <motion.img
                    src={implement.image}
                    alt={implement.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#222222] via-transparent to-transparent opacity-60" />
                </div>
                <CardContent className="p-3 sm:p-4 space-y-2">
                  <div className="text-2xl sm:text-3xl">{implement.icon}</div>
                  <h3 className="text-white text-xs sm:text-sm md:text-base line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">{implement.name}</h3>
                  {implement.description && (
                    <p className="text-white/40 text-[10px] sm:text-xs line-clamp-1">
                      {implement.description}
                    </p>
                  )}
                  <div className="pt-1">
                    <Badge variant="outline" className="border-[#FA7B21]/60 text-[#FCA929] text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
                      S/ {implement.price}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ImplementsSection;
