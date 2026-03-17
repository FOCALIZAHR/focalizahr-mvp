// ─────────────────────────────────────────────────────────────────────────────
// PERSONAS — Derechos Digitales 2026
// Datos estructurales: bandas, salarios, targets, niveles
// Las narrativas viven en narrativas.ts (separadas para facilitar edición anual)
// ─────────────────────────────────────────────────────────────────────────────

export type Banda = "B1" | "B2" | "B3" | "B4";
export type Nivel = "Junior" | "Pleno" | "Senior";
export type Accion = "bajo_minimo" | "bajo_target" | "en_posicion" | "circulo_rojo";
export type PerfilB2 = "Estratégico" | "Operativo" | null;

export interface Persona {
  id: string;
  nombre: string;
  cargo: string;
  pais: string;
  banda: Banda;
  nivel: Nivel;
  antiguedad: number;       // años en el cargo
  salario: number;          // USD/mes actual
  midpoint: number;         // referencia de mercado de la banda
  minBanda: number;
  maxBanda: number;
  targetCR: number;         // objetivo de compa-ratio propio
  pctBase: number;          // ajuste base este ciclo (0 en 2026)
  pctMerito: number;        // ajuste mérito este ciclo
  accion: Accion;
  perfilB2: PerfilB2;
  nota: string | null;
}

// ── Escala salarial 2026 ─────────────────────────────────────────────────────
export const ESCALA: Record<Banda, { min: number; mid: number; max: number; label: string }> = {
  B1: { min: 4580, mid: 5725, max: 7100, label: "Dirección Ejecutiva" },
  B2: { min: 2670, mid: 3470, max: 4270, label: "Direcciones / Liderazgo" },
  B3: { min: 1830, mid: 2240, max: 2650, label: "Coordinaciones" },
  B4: { min: 1330, mid: 1600, max: 1870, label: "Analistas / Encargados" },
};

// ── Colores por banda ────────────────────────────────────────────────────────
export const BANDA_COLORS: Record<Banda, string> = {
  B1: "#f59e0b",
  B2: "#8b5cf6",
  B3: "#00c9b1",
  B4: "#10b981",
};

// ── Configuración visual por acción ─────────────────────────────────────────
export const ACCION_CONFIG: Record<Accion, { color: string; icon: string; label: string; sub: string }> = {
  bajo_minimo: {
    color: "#ef4444",
    icon: "⬆",
    label: "Tu sueldo está bajo el mínimo del rango — trabajando en corregirlo",
    sub: "Este año recibe el ajuste más alto disponible",
  },
  bajo_target: {
    color: "#f59e0b",
    icon: "→",
    label: "Tu sueldo está avanzando hacia su referencia de mercado",
    sub: "Este año recibe ajuste por desarrollo y posición",
  },
  en_posicion: {
    color: "#10b981",
    icon: "✓",
    label: "Tu sueldo está bien posicionado en la referencia de mercado",
    sub: "Este año recibe ajuste por posición relativa",
  },
  circulo_rojo: {
    color: "#6366f1",
    icon: "◉",
    label: "Tu sueldo está sobre la referencia — está protegido",
    sub: "No hay reducción · El sueldo se mantiene donde está",
  },
};

// ── Matriz de mérito 2026 ────────────────────────────────────────────────────
// [CR<0.80, CR0.80-0.90, CR0.90-1.00, CR1.00-1.10, CR>1.10]
export const MATRIZ_MERITO: Record<Nivel, number[]> = {
  Junior: [0.08, 0.05, 0.04, 0.02, 0.00],
  Pleno:  [0.10, 0.08, 0.05, 0.03, 0.00],
  Senior: [0.12, 0.10, 0.05, 0.03, 0.00],
};

// ── Helper: calcular CR real vs target propio ────────────────────────────────
export function calcularCR(persona: Persona): number {
  const targetUSD = persona.midpoint * persona.targetCR;
  return persona.salario / targetUSD;
}

export function calcularTargetUSD(persona: Persona): number {
  return persona.midpoint * persona.targetCR;
}

export function calcularSalarioNuevo(persona: Persona): number {
  const pctTotal = persona.pctBase + persona.pctMerito;
  return persona.salario * (1 + pctTotal / 100);
}

// ── Personas ─────────────────────────────────────────────────────────────────
export const PERSONAS: Persona[] = [
  // B1 — Dirección Ejecutiva
  {
    id: "jc",
    nombre: "Juan Carlos Lara",
    cargo: "Co-Director Ejecutivo",
    pais: "Chile",
    banda: "B1",
    nivel: "Senior",
    antiguedad: 13.0,
    salario: 3492,
    midpoint: 5725,
    minBanda: 4580,
    maxBanda: 7100,
    targetCR: 1.00,
    pctBase: 0,
    pctMerito: 12.0,
    accion: "bajo_minimo",
    perfilB2: null,
    nota: "Banda Directiva — situación requiere conversación separada con el Directorio.",
  },
  {
    id: "jamila",
    nombre: "Jamila Venturini",
    cargo: "Co-Directora Ejecutiva",
    pais: "Brasil",
    banda: "B1",
    nivel: "Senior",
    antiguedad: 6.75,
    salario: 4471,
    midpoint: 5725,
    minBanda: 4580,
    maxBanda: 7100,
    targetCR: 1.00,
    pctBase: 0,
    pctMerito: 12.0,
    accion: "bajo_minimo",
    perfilB2: null,
    nota: "Banda Directiva — situación requiere conversación separada con el Directorio.",
  },

  // B2 — Direcciones
  {
    id: "camila",
    nombre: "Camila Lobato",
    cargo: "Dir. Operaciones/Finanzas",
    pais: "Chile",
    banda: "B2",
    nivel: "Senior",
    antiguedad: 6.0,
    salario: 2811,
    midpoint: 3470,
    minBanda: 2670,
    maxBanda: 4270,
    targetCR: 0.90,
    pctBase: 0,
    pctMerito: 5.0,
    accion: "bajo_target",
    perfilB2: "Operativo",
    nota: null,
  },
  {
    id: "catalia",
    nombre: "Catalia Balla",
    cargo: "Dir. Comunicaciones",
    pais: "Chile",
    banda: "B2",
    nivel: "Pleno",
    antiguedad: 2.0,
    salario: 2709,
    midpoint: 3470,
    minBanda: 2670,
    maxBanda: 4270,
    targetCR: 1.10,
    pctBase: 0,
    pctMerito: 10.0,
    accion: "bajo_target",
    perfilB2: "Estratégico",
    nota: "Brecha significativa — plan de convergencia a 3 años.",
  },
  {
    id: "miguel",
    nombre: "Miguel Flores",
    cargo: "Dir. Tecnologías",
    pais: "Chile",
    banda: "B2",
    nivel: "Senior",
    antiguedad: 6.5,
    salario: 2811,
    midpoint: 3470,
    minBanda: 2670,
    maxBanda: 4270,
    targetCR: 0.90,
    pctBase: 0,
    pctMerito: 5.0,
    accion: "bajo_target",
    perfilB2: "Operativo",
    nota: null,
  },
  {
    id: "paloma",
    nombre: "Paloma Lara Castro",
    cargo: "Dir. Políticas Públicas",
    pais: "Paraguay",
    banda: "B2",
    nivel: "Pleno",
    antiguedad: 3.0,
    salario: 3599,
    midpoint: 3470,
    minBanda: 2670,
    maxBanda: 4270,
    targetCR: 1.10,
    pctBase: 0,
    pctMerito: 5.0,
    accion: "bajo_target",
    perfilB2: "Estratégico",
    nota: null,
  },
  {
    id: "rafael",
    nombre: "Rafael Bonifaz",
    cargo: "Liderazgo LARRED",
    pais: "Ecuador",
    banda: "B2",
    nivel: "Senior",
    antiguedad: 4.75,
    salario: 3382,
    midpoint: 3470,
    minBanda: 2670,
    maxBanda: 4270,
    targetCR: 1.10,
    pctBase: 0,
    pctMerito: 10.0,
    accion: "bajo_target",
    perfilB2: "Estratégico",
    nota: null,
  },

  // B3 — Coordinaciones
  {
    id: "debora",
    nombre: "Débora Calderón",
    cargo: "Coord. Incidencia Regional",
    pais: "Argentina",
    banda: "B3",
    nivel: "Senior",
    antiguedad: 4.25,
    salario: 2730,
    midpoint: 2240,
    minBanda: 1830,
    maxBanda: 2650,
    targetCR: 1.00,
    pctBase: 0,
    pctMerito: 0,
    accion: "circulo_rojo",
    perfilB2: null,
    nota: "Sueldo sobre la referencia — protegido sin reducción.",
  },
  {
    id: "marina",
    nombre: "Marina Meira",
    cargo: "Coordinadora PP",
    pais: "Brasil",
    banda: "B3",
    nivel: "Junior",
    antiguedad: 1.0,
    salario: 2530,
    midpoint: 2240,
    minBanda: 1830,
    maxBanda: 2650,
    targetCR: 1.00,
    pctBase: 0,
    pctMerito: 0,
    accion: "circulo_rojo",
    perfilB2: null,
    nota: "Sueldo sobre la referencia. Nivel Junior con ingreso negociado sobre referencia.",
  },
  {
    id: "lucia",
    nombre: "Lucía Camacho",
    cargo: "Coordinadora PP",
    pais: "Colombia",
    banda: "B3",
    nivel: "Pleno",
    antiguedad: 3.0,
    salario: 2625,
    midpoint: 2240,
    minBanda: 1830,
    maxBanda: 2650,
    targetCR: 1.00,
    pctBase: 0,
    pctMerito: 0,
    accion: "circulo_rojo",
    perfilB2: null,
    nota: "Sueldo sobre la referencia — protegido sin reducción.",
  },
  {
    id: "paula",
    nombre: "Paula Jaramillo",
    cargo: "Coordinadora Legal",
    pais: "Chile",
    banda: "B3",
    nivel: "Senior",
    antiguedad: 12.0,
    salario: 2132,
    midpoint: 2240,
    minBanda: 1830,
    maxBanda: 2650,
    targetCR: 1.15,
    pctBase: 0,
    pctMerito: 10.0,
    accion: "bajo_target",
    perfilB2: null,
    nota: "Caso especial: 12 años, staff directivo. Referencia más alta que el promedio del nivel.",
  },

  // B4 — Analistas / Encargados
  {
    id: "gaston",
    nombre: "Gastón Wahnish",
    cargo: "Enc. Comunicaciones",
    pais: "Argentina",
    banda: "B4",
    nivel: "Pleno",
    antiguedad: 2.5,
    salario: 1800,
    midpoint: 1600,
    minBanda: 1330,
    maxBanda: 1870,
    targetCR: 1.00,
    pctBase: 0,
    pctMerito: 0,
    accion: "circulo_rojo",
    perfilB2: null,
    nota: "Sueldo sobre la referencia — protegido sin reducción.",
  },
  {
    id: "nicole",
    nombre: "Nicole Solano",
    cargo: "Enc. Comunicaciones",
    pais: "Costa Rica",
    banda: "B4",
    nivel: "Pleno",
    antiguedad: 2.5,
    salario: 1800,
    midpoint: 1600,
    minBanda: 1330,
    maxBanda: 1870,
    targetCR: 1.00,
    pctBase: 0,
    pctMerito: 0,
    accion: "circulo_rojo",
    perfilB2: null,
    nota: "Sueldo sobre la referencia — protegido sin reducción.",
  },
  {
    id: "laura",
    nombre: "Laura Mantilla",
    cargo: "Analista PP",
    pais: "Colombia",
    banda: "B4",
    nivel: "Pleno",
    antiguedad: 2.5,
    salario: 1800,
    midpoint: 1600,
    minBanda: 1330,
    maxBanda: 1870,
    targetCR: 1.00,
    pctBase: 0,
    pctMerito: 0,
    accion: "circulo_rojo",
    perfilB2: null,
    nota: "Sueldo sobre la referencia — protegido sin reducción.",
  },
  {
    id: "maria",
    nombre: "María Encalada",
    cargo: "Analista Tecnologías",
    pais: "Ecuador",
    banda: "B4",
    nivel: "Senior",
    antiguedad: 4.25,
    salario: 1973,
    midpoint: 1600,
    minBanda: 1330,
    maxBanda: 1870,
    targetCR: 1.00,
    pctBase: 0,
    pctMerito: 0,
    accion: "circulo_rojo",
    perfilB2: null,
    nota: "Sueldo sobre la referencia — sobre el máximo de la banda. Caso prioritario Fase B para progresión a B3.",
  },
];
