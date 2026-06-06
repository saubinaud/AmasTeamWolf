// ========== CÓDIGOS PROMOCIONALES ==========

/** Tipos de promoción disponibles */
export type TipoPromocion =
  | 'descuento_dinero'
  | 'descuento_porcentaje'
  | 'clases_extra'
  | 'mes_gratis'
  | 'polo_gratis'
  | 'uniforme_gratis'
  | 'desbloquear_1mes';

/** Estructura de un código promocional */
export interface CodigoPromocional {
  tipo: TipoPromocion;
  valor: number;
  descripcion: string;
  programasAplicables: string[];
  activo: boolean;
}

/**
 * Códigos promocionales disponibles.
 * Fuente: FormularioRenovacion.tsx (versión más reciente) + códigos adicionales de FormularioMatricula.tsx
 */
export const CODIGOS_PROMOCIONALES: Record<string, CodigoPromocional> = {
  // ========== CÓDIGO ESPECIAL PARA DESBLOQUEAR 1 MES ==========
  "RENOVAR1MES": {
    tipo: "desbloquear_1mes",
    valor: 0,
    descripcion: "Desbloquea el programa de 1 mes",
    programasAplicables: ["1mes"],
    activo: true
  },

  // ========== DESCUENTOS EN DINERO ==========
  "AMAS-DESC10": {
    tipo: "descuento_dinero",
    valor: 10,
    descripcion: "Descuento de S/ 10",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },
  "AMAS-DESC20": {
    tipo: "descuento_dinero",
    valor: 20,
    descripcion: "Descuento de S/ 20",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },
  "AMAS-DESC50": {
    tipo: "descuento_dinero",
    valor: 50,
    descripcion: "Descuento de S/ 50",
    programasAplicables: ["1mes", "full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  },
  "AMAS-DESC100": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "Descuento de S/ 100",
    programasAplicables: ["1mes", "full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  },
  "AMAS-DESC150": {
    tipo: "descuento_dinero",
    valor: 150,
    descripcion: "Descuento de S/ 150",
    programasAplicables: ["full", "6meses"],
    activo: true
  },
  "AMAS-DESC200": {
    tipo: "descuento_dinero",
    valor: 200,
    descripcion: "Descuento de S/ 200",
    programasAplicables: ["full", "6meses"],
    activo: true
  },
  "PRIMAVEZ": {
    tipo: "descuento_dinero",
    valor: 80,
    descripcion: "Descuento de S/ 80 para nuevos alumnos",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },

  // ========== DESCUENTOS PORCENTUALES ==========
  "AMAS10OFF": {
    tipo: "descuento_porcentaje",
    valor: 10,
    descripcion: "10% de descuento",
    programasAplicables: ["1mes", "full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  },
  "AMAS15OFF": {
    tipo: "descuento_porcentaje",
    valor: 15,
    descripcion: "15% de descuento",
    programasAplicables: ["full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  },
  "AMAS20OFF": {
    tipo: "descuento_porcentaje",
    valor: 20,
    descripcion: "20% de descuento",
    programasAplicables: ["full", "6meses"],
    activo: true
  },
  "BLACKFRIDAY": {
    tipo: "descuento_porcentaje",
    valor: 25,
    descripcion: "25% de descuento Black Friday",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },

  // ========== CLASES EXTRA ==========
  "AMAS-4CLASES": {
    tipo: "clases_extra",
    valor: 4,
    descripcion: "+4 clases gratis",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "AMAS-8CLASES": {
    tipo: "clases_extra",
    valor: 8,
    descripcion: "+8 clases gratis",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "AMAS-12CLASES": {
    tipo: "clases_extra",
    valor: 12,
    descripcion: "+12 clases gratis",
    programasAplicables: ["full"],
    activo: true
  },

  // ========== MES GRATIS ==========
  "MESGRATIS": {
    tipo: "mes_gratis",
    valor: 8,
    descripcion: "+1 mes gratis (8 clases)",
    programasAplicables: ["full"],
    activo: true
  },
  "2X1FINAL": {
    tipo: "mes_gratis",
    valor: 16,
    descripcion: "+2 meses gratis (16 clases)",
    programasAplicables: ["full"],
    activo: true
  },

  // ========== POLOS Y UNIFORMES ==========
  "POLO1GRATIS": {
    tipo: "polo_gratis",
    valor: 1,
    descripcion: "+1 polo oficial gratis (S/ 60)",
    programasAplicables: ["1mes", "full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  },
  "POLO2GRATIS": {
    tipo: "polo_gratis",
    valor: 2,
    descripcion: "+2 polos oficiales gratis (S/ 110)",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "UNIFORMEGRATIS": {
    tipo: "uniforme_gratis",
    valor: 220,
    descripcion: "Uniforme completo gratis (S/ 220)",
    programasAplicables: ["1mes"],
    activo: true
  },

  // ========== DESCUENTOS FAMILIARES ==========
  "HERMANOS10": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "100 soles de descuento por 1 hermano",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "HERMANOS15": {
    tipo: "descuento_dinero",
    valor: 150,
    descripcion: "150 soles de descuento por inscribir 2+ hermanos",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "FAMILIAR20": {
    tipo: "descuento_porcentaje",
    valor: 20,
    descripcion: "20% descuento familiar (3+ miembros)",
    programasAplicables: ["1mes", "full"],
    activo: true
  },

  // ========== REFERIDOS ==========
  "AMIGO50": {
    tipo: "descuento_dinero",
    valor: 50,
    descripcion: "S/ 50 descuento por referir a un amigo",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "AMIGO100": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "S/ 100 descuento por referir 2+ amigos",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "REFIERE3X": {
    tipo: "descuento_dinero",
    valor: 150,
    descripcion: "S/ 150 descuento por referir 3+ amigos",
    programasAplicables: ["full"],
    activo: true
  },

  // ========== ESPECIALES ==========
  "CUMPLEAÑOS": {
    tipo: "descuento_dinero",
    valor: 80,
    descripcion: "S/ 80 descuento + 1 polo gratis (mes cumpleaños)",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "BIENVENIDA": {
    tipo: "descuento_dinero",
    valor: 60,
    descripcion: "S/ 60 descuento + 2 clases extra",
    programasAplicables: ["1mes"],
    activo: true
  },
  "NAVIDAD": {
    tipo: "descuento_porcentaje",
    valor: 15,
    descripcion: "15% descuento + 4 clases extra (Navidad)",
    programasAplicables: ["1mes", "full"],
    activo: true
  },

  // ========== FIDELIDAD ==========
  "VUELVE100": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "S/ 100 descuento para ex-alumnos",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "VUELVE150": {
    tipo: "descuento_dinero",
    valor: 150,
    descripcion: "S/ 150 descuento + 1 polo (ex-alumnos)",
    programasAplicables: ["full"],
    activo: true
  },

  // ========== PROMOCIONES FLASH ==========
  "FLASH24H": {
    tipo: "descuento_porcentaje",
    valor: 20,
    descripcion: "20% descuento válido 24 horas",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "EARLYBIRD": {
    tipo: "descuento_dinero",
    valor: 120,
    descripcion: "S/ 120 descuento por inscripción anticipada",
    programasAplicables: ["full"],
    activo: true
  },

  // ========== RENOVACIONES ==========
  "RENUEVA100": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "S/ 100 descuento por renovación anticipada",
    programasAplicables: ["full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  }
};
