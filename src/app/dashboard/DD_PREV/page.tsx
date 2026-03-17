'use client'

import { useState, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Pregunta {
  q: string
  a: string
}

interface Persona {
  id: string
  nombre: string
  cargo: string
  pais: string
  banda: 'B1' | 'B2' | 'B3' | 'B4'
  nivel: 'Junior' | 'Pleno' | 'Senior'
  ant: number
  sal: number
  mid: number
  min: number
  max: number
  tcr: number
  base: number
  merit: number
  accion: 'bajo_minimo' | 'bajo_target' | 'en_posicion' | 'circulo_rojo'
  nota: string | null
  nl: string
  nc: string
  preg: Pregunta[]
}

type ViewMode = 'lider' | 'colab'
type BandaFilter = 'all' | 'B1' | 'B2' | 'B3' | 'B4'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS - Colores FocalizaHR
// ════════════════════════════════════════════════════════════════════════════

const BANDA_COLORS: Record<string, string> = {
  B1: '#F59E0B', // Amber
  B2: '#A78BFA', // Purple FocalizaHR
  B3: '#22D3EE', // Cyan FocalizaHR
  B4: '#10B981', // Emerald
}

const ACCION_CONFIG = {
  bajo_minimo: {
    color: '#EF4444',
    bgClass: 'bg-red-500/10 border-red-500/30',
    textClass: 'text-red-400',
    icon: '🔴',
    label: 'Bajo mínimo de banda',
    sub: 'Prioridad alta — requiere plan de convergencia explícito',
  },
  bajo_target: {
    color: '#F59E0B',
    bgClass: 'bg-amber-500/10 border-amber-500/30',
    textClass: 'text-amber-400',
    icon: '🟡',
    label: 'Bajo target — convergencia activa',
    sub: 'Ajuste base + mérito aplicado este año',
  },
  en_posicion: {
    color: '#10B981',
    bgClass: 'bg-emerald-500/10 border-emerald-500/30',
    textClass: 'text-emerald-400',
    icon: '🟢',
    label: 'En posición — bien ubicado/a',
    sub: 'Solo ajuste base — CR saludable',
  },
  circulo_rojo: {
    color: '#6366F1',
    bgClass: 'bg-indigo-500/10 border-indigo-500/30',
    textClass: 'text-indigo-400',
    icon: '🔵',
    label: 'Círculo rojo — sobre midpoint',
    sub: 'No se reduce · Solo ajuste base preservación',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// DATA
// ════════════════════════════════════════════════════════════════════════════

const PERSONAS: Persona[] = [
  {
    id: 'jc',
    nombre: 'Juan Carlos Lara',
    cargo: 'Co-Director Ejecutivo',
    pais: 'Chile',
    banda: 'B1',
    nivel: 'Senior',
    ant: 13.0,
    sal: 3492,
    mid: 5725,
    min: 4580,
    max: 7100,
    tcr: 1.0,
    base: 2.5,
    merit: 7.0,
    accion: 'bajo_minimo',
    nota: 'B1 PRELIMINAR — objetivo de mercado a 2-3 años. Requiere aprobación del Directorio para ajuste completo.',
    nl: 'Juan Carlos está significativamente bajo el mínimo de su banda, con CR 0.61. Es la brecha más importante del equipo y requiere una conversación honesta sobre el horizonte de convergencia.\n\nEl ajuste de hoy (2.5% base + 7% mérito = 9.5%) es una señal de dirección, no una corrección completa. La conversación debe establecer que el objetivo B1 es un horizonte de 2-3 años, condicionado al financiamiento y a la aprobación del Directorio.\n\nRecomendación: idealmente tener esta conversación después de la reunión de Directorio donde se presente el memo técnico B1.',
    nc: 'Juan Carlos, quiero mostrarte dónde estás en la nueva estructura de compensaciones y ser muy transparente sobre lo que esto implica.\n\nTu rol está en la Banda 1 — Dirección Ejecutiva. El punto de referencia de mercado para este nivel en organizaciones comparables es $5,725 mensuales. Tu remuneración actual está por debajo del mínimo de esta banda.\n\nEsto no es una crítica — es el resultado de años de ajustes sin un sistema formal. La buena noticia es que ahora tenemos un marco claro y una dirección definida. El ajuste de este año es un primer paso concreto en ese camino.',
    preg: [
      { q: '¿Por qué no se corrige todo ahora?', a: 'El ajuste completo de B1 requiere aprobación del Directorio y está condicionado al financiamiento. No es una decisión operativa — es de gobernanza. Estamos preparando el memo técnico para presentárselo al Directorio.' },
      { q: '¿Cuándo llegaré al midpoint?', a: 'Con el modelo actual el horizonte estimado es 2-3 años: Año 1 CR ~0.67, Año 2 ~0.78, Año 3 ~0.89. El objetivo completo depende de aprobación anual.' },
      { q: '¿Los demás están en la misma situación?', a: 'B1 tiene una situación particular que se trata con el Directorio de forma separada. Los datos individuales son confidenciales.' },
    ],
  },
  {
    id: 'jamila',
    nombre: 'Jamila Venturini',
    cargo: 'Co-Directora Ejecutiva',
    pais: 'Brasil',
    banda: 'B1',
    nivel: 'Senior',
    ant: 6.75,
    sal: 4471,
    mid: 5725,
    min: 4580,
    max: 7100,
    tcr: 1.0,
    base: 2.5,
    merit: 7.0,
    accion: 'bajo_minimo',
    nota: 'B1 PRELIMINAR — objetivo de mercado a 2-3 años. Requiere aprobación del Directorio.',
    nl: 'Jamila está bajo el mínimo con CR 0.78 — la situación más cercana al mínimo dentro de B1, lo que facilita la conversación de convergencia.\n\nEl ajuste 9.5% total es una señal, no una corrección completa. Enmarcar dentro del proceso de aprobación del Directorio.',
    nc: 'Jamila, en la nueva estructura tu rol está en la Banda 1 — Dirección Ejecutiva. El punto de referencia de mercado es $5,725. Hoy estás en $4,471, que es el punto de partida de una convergencia planificada.\n\nEste año aplicamos un ajuste de 9.5% que te acerca al mínimo de la banda. El camino completo requiere que el Directorio apruebe el plan de convergencia B1, que presentaremos en las próximas semanas.',
    preg: [
      { q: '¿Por qué el ajuste es parcial?', a: 'La corrección completa de B1 es una decisión del Directorio, no operativa. Estamos preparando el memo técnico con el fundamento completo.' },
      { q: '¿Cuándo converjo al midpoint?', a: 'Con el modelo actual el horizonte estimado es Año 3 — CR ~1.02.' },
    ],
  },
  {
    id: 'camila',
    nombre: 'Camila Lobato',
    cargo: 'Dir. Operaciones/Finanzas',
    pais: 'Chile',
    banda: 'B2',
    nivel: 'Senior',
    ant: 6.0,
    sal: 2811,
    mid: 3470,
    min: 2670,
    max: 4270,
    tcr: 0.9,
    base: 2.5,
    merit: 6.0,
    accion: 'bajo_target',
    nota: null,
    nl: 'Camila tiene perfil Operativo-Interno. Target CR 0.90 → $3,123. CR actual 0.81. El ajuste 8.5% la mueve a ~$3,050, acercándola al target.\n\nLa conversación debe explicar el concepto de perfil funcional con claridad — sin que suene a que su rol vale menos.',
    nc: 'Camila, en el nuevo sistema tu rol está en la Banda 2 con perfil de gestión operativa-interna. Dentro de B2, el sistema diferencia entre roles de alta exposición externa y roles de gestión interna como el tuyo. Eso no implica menor importancia — refleja cómo el mercado valora estas funciones de forma diferente.\n\nTu punto de referencia objetivo es $3,123. El ajuste de este año (8.5%) te acerca de forma sustantiva a ese target.',
    preg: [
      { q: '¿Por qué mi target es menor que otros en B2?', a: 'El sistema reconoce dos perfiles: estratégico-externo y operativo-interno. El tuyo es operativo — los roles de gestión interna en ONG comparables se ubican en ese rango de mercado. No es jerarquía de importancia, es calibración de mercado.' },
      { q: '¿Puedo cambiar de perfil?', a: 'Los perfiles se revisan en Fase B cuando se completen los descriptores de cargo formales.' },
    ],
  },
  {
    id: 'catalia',
    nombre: 'Catalia Balla',
    cargo: 'Dir. Comunicaciones',
    pais: 'Chile',
    banda: 'B2',
    nivel: 'Pleno',
    ant: 2.0,
    sal: 2709,
    mid: 3470,
    min: 2670,
    max: 4270,
    tcr: 1.1,
    base: 2.5,
    merit: 6.0,
    accion: 'bajo_target',
    nota: 'Brecha significativa — plan de convergencia a 3 años.',
    nl: 'Catalia tiene la brecha más importante de B2 estratégico: CR 0.78 con target 1.10. El ajuste 8.5% la mueve a ~$2,939 — sigue significativamente bajo el target.\n\nLa conversación debe reconocer la brecha honestamente y enmarcarla en el plan de convergencia a 3 años.',
    nc: 'Catalia, tu rol de Comunicaciones está en Banda 2 con perfil estratégico-externo — uno de los roles donde el mercado paga más dentro de B2, porque hay alta demanda y poca oferta de perfiles con expertise en derechos digitales.\n\nQuiero ser honesto contigo: hay una brecha entre donde estás hoy y donde debería estar tu remuneración. El plan de convergencia lleva 3 años, y el ajuste de este año es el primero de ese camino.',
    preg: [
      { q: '¿Por qué la brecha es tan grande?', a: 'Refleja que DD no tuvo un sistema formal de compensaciones y que el mercado de comunicaciones estratégicas digitales creció más rápido que los ajustes internos. El sistema ahora lo visibiliza y tiene un plan para corregirlo.' },
      { q: '¿3 años es mucho tiempo?', a: 'La convergencia progresiva es la única opción financieramente sostenible para una ONG. Un ajuste completo de golpe comprometería otros proyectos. El modelo garantiza avance cada año condicionado al financiamiento.' },
    ],
  },
  {
    id: 'miguel',
    nombre: 'Miguel Flores',
    cargo: 'Dir. Tecnologías',
    pais: 'Chile',
    banda: 'B2',
    nivel: 'Senior',
    ant: 6.5,
    sal: 2811,
    mid: 3470,
    min: 2670,
    max: 4270,
    tcr: 0.9,
    base: 2.5,
    merit: 6.0,
    accion: 'bajo_target',
    nota: null,
    nl: 'Misma situación que Camila Lobato — perfil Operativo, target 0.90, ajuste 8.5%. Importante ser consistente en el mensaje de perfil funcional.',
    nc: 'Miguel, tu rol en Tecnologías está en Banda 2 con perfil operativo-interno. El punto de referencia objetivo es $3,123. El ajuste de este año (8.5%) te mueve de $2,811 a aproximadamente $3,050 — acercándote sustantivamente al target.',
    preg: [
      { q: '¿Por qué tecnología es operativo y no estratégico?', a: 'El criterio es el grado de representación externa sistemática. El rol de tecnologías en DD es de gestión interna de sistemas. Si el rol evoluciona hacia advisory externo, se revisaría en Fase B.' },
    ],
  },
  {
    id: 'paloma',
    nombre: 'Paloma Lara Castro',
    cargo: 'Dir. Políticas Públicas',
    pais: 'Paraguay',
    banda: 'B2',
    nivel: 'Pleno',
    ant: 3.0,
    sal: 3599,
    mid: 3470,
    min: 2670,
    max: 4270,
    tcr: 1.1,
    base: 2.5,
    merit: 0,
    accion: 'en_posicion',
    nota: null,
    nl: 'Paloma está prácticamente en posición — CR 1.04 con target 1.10. Solo recibe base 2.5% porque CR > 1.0.\n\nImportante explicar que no recibir mérito no es negativo — significa que ya está bien posicionada.',
    nc: 'Paloma, tu situación en el nuevo sistema es una de las más sólidas del equipo. Tu remuneración actual está prácticamente en el target para tu rol — un compa-ratio de 1.04 significa que estás 4% sobre el punto de referencia de mercado.\n\nEl ajuste de este año es el 2.5% base que aplica a todo el equipo. No hay ajuste de mérito adicional porque ya estás bien posicionada — eso es una señal positiva, no negativa.',
    preg: [
      { q: '¿Por qué no recibo ajuste de mérito?', a: 'El ajuste de mérito está diseñado para acelerar la convergencia de quienes están más lejos de su target. Tú ya estás en posición, así que el sistema funciona correctamente — te mantiene ahí con el ajuste base.' },
    ],
  },
  {
    id: 'rafael',
    nombre: 'Rafael Bonifaz',
    cargo: 'Liderazgo LARRED',
    pais: 'Ecuador',
    banda: 'B2',
    nivel: 'Senior',
    ant: 4.75,
    sal: 3382,
    mid: 3470,
    min: 2670,
    max: 4270,
    tcr: 1.1,
    base: 2.5,
    merit: 5.0,
    accion: 'bajo_target',
    nota: null,
    nl: 'Rafael está cerca del midpoint (CR 0.97) pero su target es 1.10 por perfil estratégico. El ajuste 7.5% lo lleva a ~$3,636, cruzando el midpoint. Conversación positiva.',
    nc: 'Rafael, en el nuevo sistema tu rol de liderazgo LARRED está en Banda 2 con perfil estratégico-externo. Tu CR actual de 0.97 está muy cerca del midpoint, y el ajuste de este año (7.5%) te lleva a $3,636 — cruzando el midpoint y acercándote al target de $3,817.',
    preg: [
      { q: '¿Cuándo alcanzo el target completo?', a: 'Con el ajuste de este año cruzas el midpoint. El target completo (CR 1.10 = $3,817) se estima alcanzar en el Año 2 con continuidad del modelo.' },
    ],
  },
  {
    id: 'debora',
    nombre: 'Débora Calderón',
    cargo: 'Coord. Incidencia Regional',
    pais: 'Argentina',
    banda: 'B3',
    nivel: 'Senior',
    ant: 4.25,
    sal: 2730,
    mid: 2240,
    min: 1830,
    max: 2650,
    tcr: 1.0,
    base: 2.5,
    merit: 0,
    accion: 'circulo_rojo',
    nota: 'Círculo rojo — CR 1.22. No se reduce. Solo ajuste base 2.5%.',
    nl: 'Débora es el círculo rojo más significativo de B3 con CR 1.22. Política clara: no se reduce, solo base 2.5%.\n\nLa conversación debe ser honesta — no es penalización, sino que su remuneración superó históricamente el punto de referencia. El camino es que la escala crezca hacia ella.',
    nc: 'Débora, en el nuevo sistema tu remuneración de $2,730 está por sobre el punto de referencia de tu banda — el midpoint de B3 es $2,240. Eso se llama círculo rojo: significa que históricamente tu compensación creció más rápido que el mercado de referencia.\n\nLa política es clara: no hay reducción. Tu sueldo se mantiene y recibe el ajuste base de 2.5%. Con el tiempo, la escala irá convergiendo hacia tu nivel actual.',
    preg: [
      { q: '¿Significa que gano demasiado?', a: 'No. Significa que en relación al mercado ONG LATAM tu remuneración está sobre el punto medio. Puede ser completamente justificado por tu experiencia. El sistema no reduce — solo establece un techo para futuros incrementos hasta que la banda alcance tu nivel.' },
      { q: '¿Cuándo vuelvo a la zona verde?', a: 'Con ajustes de 2-3% anuales a la escala, en 3-4 años el midpoint podría alcanzar tu nivel actual.' },
    ],
  },
  {
    id: 'marina',
    nombre: 'Marina Meira',
    cargo: 'Coordinadora PP',
    pais: 'Brasil',
    banda: 'B3',
    nivel: 'Junior',
    ant: 1.0,
    sal: 2530,
    mid: 2240,
    min: 1830,
    max: 2650,
    tcr: 1.0,
    base: 2.5,
    merit: 0,
    accion: 'circulo_rojo',
    nota: 'Círculo rojo — CR 1.13 con nivel Junior. Situación a monitorear en Fase B.',
    nl: 'Marina es Junior con CR 1.13 — la combinación más llamativa del equipo. Solo 1 año y ya sobre el midpoint. Sugiere que entró con salario negociado por sobre la referencia.\n\nSin acción correctiva ahora. En Fase B vale revisar política de ingreso para roles nuevos.',
    nc: 'Marina, llevas un año en el equipo y tu remuneración está por sobre el punto de referencia de la banda. Eso es positivo — significa que entraste bien compensada. El sistema reconoce eso con el círculo rojo: no hay reducción, solo el ajuste base que aplica a todos.',
    preg: [
      { q: '¿Afecta esto a mis posibilidades de crecimiento?', a: 'No afecta tu desarrollo de carrera. Sí significa que los ajustes salariales futuros serán más graduales hasta que la banda alcance tu nivel actual.' },
    ],
  },
  {
    id: 'lucia',
    nombre: 'Lucía Camacho',
    cargo: 'Coordinadora PP',
    pais: 'Colombia',
    banda: 'B3',
    nivel: 'Pleno',
    ant: 3.0,
    sal: 2625,
    mid: 2240,
    min: 1830,
    max: 2650,
    tcr: 1.0,
    base: 2.5,
    merit: 0,
    accion: 'circulo_rojo',
    nota: 'Círculo rojo — CR 1.17.',
    nl: 'Lucía tiene CR 1.17 con nivel Pleno. Conversación similar a Débora — círculo rojo, sin reducción, solo base.',
    nc: 'Lucía, tu remuneración de $2,625 está sobre el midpoint de referencia de B3. Eres círculo rojo: el sistema no reduce, recibes el 2.5% base junto a todos, y la escala irá acercándose a tu nivel con los ajustes anuales.',
    preg: [
      { q: '¿Gano más que mis pares en B3?', a: 'Los datos individuales son confidenciales. Tu posición en la banda es sólida y está protegida por la política de círculo rojo.' },
    ],
  },
  {
    id: 'paula',
    nombre: 'Paula Jaramillo',
    cargo: 'Coordinadora Legal',
    pais: 'Chile',
    banda: 'B3',
    nivel: 'Senior',
    ant: 12.0,
    sal: 2132,
    mid: 2240,
    min: 1830,
    max: 2650,
    tcr: 1.15,
    base: 2.5,
    merit: 5.0,
    accion: 'bajo_target',
    nota: '⭐ Staff directivo — target CR 1.15 (Q4 de banda). 12 años de antigüedad. Caso especial.',
    nl: 'Paula es el caso más especial de B3. Con 12 años y rol de apoyo directo a co-directores, tiene target CR 1.15 (Q4), no el midpoint. CR actual 0.95 — bajo target pero sobre midpoint.\n\nEl ajuste 7.5% la lleva a ~$2,292, cruzando el midpoint. La conversación debe reconocer explícitamente su trayectoria y posición única.',
    nc: 'Paula, quiero tener una conversación especial contigo porque tu situación refleja algo que es importante reconocer: 12 años de trayectoria en DD, con un rol que va mucho más allá de la coordinación estándar.\n\nTu target en el sistema no es el midpoint de B3 — es el cuartil 4, un 15% sobre el punto de referencia, reconociendo tu posición de staff directivo. El ajuste de este año (7.5%) te lleva a $2,292, cruzando el midpoint. El objetivo completo de $2,576 se alcanza en el plan de convergencia a 3 años.',
    preg: [
      { q: '¿Por qué sigo en B3 si apoyo directamente a los co-directores?', a: 'Tu clasificación en B3 refleja la naturaleza de coordinación de tu rol. Lo que reconocemos con el target CR 1.15 es que dentro de B3 tu posición es la más senior, justificando estar en el cuartil 4. Si el rol evoluciona formalmente hacia funciones de dirección, se revisaría en Fase B.' },
      { q: '¿12 años no merecen más reconocimiento?', a: 'La antigüedad es exactamente lo que justifica el target Q4. Dentro de B3, tu posición objetivo es la más alta del grupo. El sistema reconoce la trayectoria a través del positioning en la banda.' },
    ],
  },
  {
    id: 'gaston',
    nombre: 'Gastón Wahnish',
    cargo: 'Enc. Comunicaciones',
    pais: 'Argentina',
    banda: 'B4',
    nivel: 'Pleno',
    ant: 2.5,
    sal: 1800,
    mid: 1600,
    min: 1330,
    max: 1870,
    tcr: 1.0,
    base: 2.5,
    merit: 0,
    accion: 'circulo_rojo',
    nota: 'Círculo rojo — CR 1.13.',
    nl: 'Gastón, Nicole y Laura tienen exactamente la misma situación — B4 Pleno CR 1.13. Todos reciben solo 2.5% base. La conversación es idéntica en estructura.',
    nc: 'Gastón, tu remuneración de $1,800 está sobre el midpoint de referencia de B4 ($1,600). Eres círculo rojo: el sistema protege tu sueldo actual sin reducción. Recibes el ajuste base del 2.5% como todos.',
    preg: [
      { q: '¿Puedo crecer a B3 en el futuro?', a: 'La progresión entre bandas se diseña en Fase B, con criterios claros. El camino existe y se formalizará en los próximos meses.' },
    ],
  },
  {
    id: 'nicole',
    nombre: 'Nicole Solano',
    cargo: 'Enc. Comunicaciones',
    pais: 'Costa Rica',
    banda: 'B4',
    nivel: 'Pleno',
    ant: 2.5,
    sal: 1800,
    mid: 1600,
    min: 1330,
    max: 1870,
    tcr: 1.0,
    base: 2.5,
    merit: 0,
    accion: 'circulo_rojo',
    nota: 'Círculo rojo — CR 1.13.',
    nl: 'Misma situación que Gastón y Laura. Solo base 2.5%.',
    nc: 'Nicole, tu remuneración está sobre el midpoint de referencia de B4. Eres círculo rojo: el sistema mantiene tu sueldo sin reducción y aplica el ajuste base del 2.5%.',
    preg: [
      { q: '¿Hay diferencia entre Costa Rica y Argentina en el sistema?', a: 'El sistema usa USD como moneda base y aplica escala única por nivel. En Fase B se evaluará si se justifica algún ajuste por costo de vida local.' },
    ],
  },
  {
    id: 'laura',
    nombre: 'Laura Mantilla',
    cargo: 'Analista PP',
    pais: 'Colombia',
    banda: 'B4',
    nivel: 'Pleno',
    ant: 2.5,
    sal: 1800,
    mid: 1600,
    min: 1330,
    max: 1870,
    tcr: 1.0,
    base: 2.5,
    merit: 0,
    accion: 'circulo_rojo',
    nota: 'Círculo rojo — CR 1.13.',
    nl: 'Misma situación que Gastón y Nicole.',
    nc: 'Laura, tu remuneración está sobre el midpoint de referencia de B4. Eres círculo rojo: el sistema mantiene tu sueldo sin reducción y aplica el ajuste base del 2.5%.',
    preg: [
      { q: '¿Analista PP puede llegar a B3?', a: 'La progresión entre bandas se define en Fase B. El camino natural de Analista hacia Coordinadora existe y se formalizará con criterios claros.' },
    ],
  },
  {
    id: 'maria',
    nombre: 'María Encalada',
    cargo: 'Analista Tecnologías',
    pais: 'Ecuador',
    banda: 'B4',
    nivel: 'Senior',
    ant: 4.25,
    sal: 1973,
    mid: 1600,
    min: 1330,
    max: 1870,
    tcr: 1.0,
    base: 2.5,
    merit: 0,
    accion: 'circulo_rojo',
    nota: 'Círculo rojo — CR 1.23. Está sobre el máximo de la banda. Senior en B4.',
    nl: 'María tiene CR 1.23 y está sobre el máximo de B4 ($1,870). Con 4.25 años es la más senior de B4.\n\nConversación especialmente cuidadosa. No hay reducción. Vale reconocer que es la persona con más trayectoria en B4 y que la progresión a B3 es el camino natural.',
    nc: 'María, llevas 4 años en el equipo y eres la persona con más trayectoria dentro de B4. Tu remuneración refleja eso — estás en el tramo alto de la banda, lo que el sistema reconoce como círculo rojo.\n\nNo hay reducción. Recibes el ajuste base del 2.5% como todos. Tu expertise y antigüedad son reconocidos — y la progresión hacia B3 es el camino natural que definiremos en Fase B.',
    preg: [
      { q: '¿Estoy atrapada en B4?', a: 'No. Significa que dentro de B4 ya estás en el techo. El camino natural es la progresión a B3 cuando se formalicen los criterios en Fase B. Tu caso es prioritario en esa conversación.' },
      { q: '¿Cuándo se define la progresión a B3?', a: 'En Fase B (abril-mayo) se diseñan los criterios de promoción entre bandas. Tu antigüedad y nivel Senior son los insumos principales.' },
    ],
  },
]

// ════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

const pctPos = (v: number, mn: number, mx: number): number => {
  return Math.max(2, Math.min(97, ((v - mn) / (mx - mn)) * 100))
}

const getCRColor = (cr: number, tcr: number): string => {
  if (cr >= 1.0) return 'text-indigo-400'
  if (cr < 0.8) return 'text-red-400'
  if (cr < tcr) return 'text-amber-400'
  return 'text-emerald-400'
}

const formatUSD = (n: number): string => {
  return n.toLocaleString('en-US')
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

const PersonCard = memo(function PersonCard({
  persona,
  isActive,
  onClick,
}: {
  persona: Persona
  isActive: boolean
  onClick: () => void
}) {
  const cr = (persona.sal / persona.mid).toFixed(2)
  const accion = ACCION_CONFIG[persona.accion]
  const bandaColor = BANDA_COLORS[persona.banda]

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      className={`
        relative p-3.5 rounded-xl border cursor-pointer transition-all duration-200
        ${isActive
          ? 'border-cyan-400/60 bg-cyan-500/5'
          : 'border-slate-700/50 bg-slate-800/50 hover:border-cyan-400/30'
        }
      `}
    >
      {/* Action dot */}
      <div
        className="absolute top-3 right-3 w-2 h-2 rounded-full"
        style={{ backgroundColor: accion.color }}
      />

      <div className="text-sm font-semibold text-slate-100 mb-1">{persona.nombre}</div>
      <div className="text-xs text-slate-400 leading-relaxed">
        {persona.cargo} · {persona.pais}
      </div>

      <div className="flex gap-1.5 mt-2">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: `${bandaColor}22`, color: bandaColor }}
        >
          {persona.banda}
        </span>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-slate-400">
          {persona.nivel}
        </span>
      </div>

      <div className="text-xs text-slate-500 mt-2">CR {cr}x</div>
    </motion.div>
  )
})

const FichaDetalle = memo(function FichaDetalle({
  persona,
  viewMode,
}: {
  persona: Persona
  viewMode: ViewMode
}) {
  const cr = persona.sal / persona.mid
  const pctTotal = persona.base + persona.merit
  const salNuevo = persona.sal * (1 + pctTotal / 100)
  const crNuevo = salNuevo / persona.mid
  const tgtUsd = persona.mid * persona.tcr
  const bandaColor = BANDA_COLORS[persona.banda]
  const accion = ACCION_CONFIG[persona.accion]

  const midPct = pctPos(persona.mid, persona.min, persona.max)
  const actPct = pctPos(persona.sal, persona.min, persona.max)
  const newPct = pctPos(salNuevo, persona.min, persona.max)

  const isLider = viewMode === 'lider'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-serif"
          style={{
            backgroundColor: `${bandaColor}15`,
            border: `1px solid ${bandaColor}40`,
            color: bandaColor,
          }}
        >
          {persona.banda}
        </div>
        <div>
          <h2 className="text-xl font-serif text-slate-100">{persona.nombre}</h2>
          <p className="text-xs text-slate-400">
            {persona.cargo} · {persona.pais} · Nivel {persona.nivel} · {persona.ant} años
          </p>
        </div>
      </div>

      {/* Nota especial */}
      {persona.nota && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-2.5 text-sm text-amber-400">
          ⚑ {persona.nota}
        </div>
      )}

      {/* Accion bar */}
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${accion.bgClass}`}>
        <span className="text-xl">{accion.icon}</span>
        <div>
          <div className={`text-sm font-semibold ${accion.textClass}`}>{accion.label}</div>
          <div className={`text-xs opacity-75 ${accion.textClass}`}>{accion.sub}</div>
        </div>
      </div>

      {/* KPIs */}
      <div className={`grid gap-3 ${isLider ? 'grid-cols-4' : 'grid-cols-2'}`}>
        <div className="fhr-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Salario Actual</div>
          <div className="text-2xl font-serif text-slate-400">${formatUSD(persona.sal)}</div>
          <div className="text-xs text-slate-500 mt-1">USD mensuales</div>
        </div>

        {isLider && (
          <>
            <div className="fhr-card p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Salario Propuesto</div>
              <div className="text-2xl font-serif text-cyan-400">${formatUSD(Math.round(salNuevo))}</div>
              <div className="text-xs text-slate-500 mt-1">+{pctTotal.toFixed(1)}% total</div>
            </div>

            <div className="fhr-card p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Target USD</div>
              <div className="text-2xl font-serif" style={{ color: bandaColor }}>
                ${formatUSD(Math.round(tgtUsd))}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                CR target {persona.tcr.toFixed(2)}x · Mid ${formatUSD(persona.mid)}
              </div>
            </div>
          </>
        )}

        <div className="fhr-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Compa-Ratio</div>
          <div className={`text-2xl font-serif ${getCRColor(cr, persona.tcr)}`}>{cr.toFixed(2)}x</div>
          <div className="text-xs text-slate-500 mt-1">Posición vs midpoint</div>
        </div>
      </div>

      {/* Band visualization */}
      <div className="fhr-card p-5">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-4">
          Posición en Banda {persona.banda} — {formatUSD(persona.min)} · {formatUSD(persona.mid)} · {formatUSD(persona.max)} USD
        </div>

        <div className="relative mb-2">
          <div className="h-3.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/20 relative">
            {/* Midpoint line */}
            <div
              className="absolute -top-1.5 -bottom-1.5 w-px bg-white/15"
              style={{ left: `${midPct}%` }}
            >
              <span className="absolute -top-5 text-[9px] text-slate-500 -translate-x-1/2 whitespace-nowrap">
                Midpoint
              </span>
            </div>

            {/* Current marker */}
            <div
              className="absolute -top-1 w-6 h-6 rounded-full bg-slate-500 border-[3px] border-slate-900 -translate-x-1/2 shadow-lg cursor-help"
              style={{ left: `${actPct}%` }}
              title={`Actual: $${formatUSD(persona.sal)}`}
            />

            {/* New marker (only for lider) */}
            {isLider && (
              <div
                className="absolute -top-1 w-6 h-6 rounded-full bg-cyan-400 border-[3px] border-slate-900 -translate-x-1/2 shadow-lg cursor-help"
                style={{ left: `${newPct}%` }}
                title={`Propuesto: $${formatUSD(Math.round(salNuevo))}`}
              />
            )}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 mt-2">
            <span>Mín ${formatUSD(persona.min)}</span>
            <span>Máx ${formatUSD(persona.max)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <span
            className={`text-base font-bold px-3 py-1 rounded-lg ${getCRColor(cr, persona.tcr)} bg-current/10`}
          >
            CR {cr.toFixed(2)}x actual
          </span>

          {isLider && (
            <>
              <span className="text-cyan-400">→</span>
              <span className="text-sm font-semibold px-3 py-1 rounded-lg bg-cyan-400/10 text-cyan-400">
                CR {crNuevo.toFixed(2)}x año 1
              </span>
              <span className="text-xs text-slate-500">después del ajuste propuesto</span>
            </>
          )}
        </div>
      </div>

      {/* Ajustes (lider only) */}
      {isLider && (
        <div className="grid grid-cols-3 gap-3">
          <div className="fhr-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Ajuste Base</div>
            <div className="text-3xl font-serif text-slate-400">{persona.base.toFixed(1)}%</div>
            <div className="text-sm font-semibold text-slate-300 mt-1">
              + ${formatUSD(Math.round(persona.sal * persona.base / 100))} / mes
            </div>
            <div className="text-xs text-slate-500 mt-2 leading-relaxed">
              CPI USA 2025 · Aplica a todos · Sobre salario actual
            </div>
          </div>

          <div className="fhr-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Ajuste Mérito</div>
            <div className={`text-3xl font-serif ${persona.merit > 0 ? 'text-purple-400' : 'text-slate-500'}`}>
              {persona.merit.toFixed(1)}%
            </div>
            <div className="text-sm font-semibold text-slate-300 mt-1">
              + ${formatUSD(Math.round(persona.sal * persona.merit / 100))} / mes
            </div>
            <div className="text-xs text-slate-500 mt-2 leading-relaxed">
              {persona.merit > 0 ? `Matriz J/P/S × CR · Nivel ${persona.nivel}` : 'CR ≥ 1.0 · Solo ajuste base'}
            </div>
          </div>

          <div className="fhr-card p-4 border-cyan-400/30 bg-cyan-500/5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Total</div>
            <div className="text-3xl font-serif text-cyan-400">{pctTotal.toFixed(1)}%</div>
            <div className="text-base font-semibold text-slate-200 mt-1">
              ${formatUSD(Math.round(salNuevo))} / mes
            </div>
            <div className="text-xs text-slate-500 mt-2 leading-relaxed">
              Incremento anual: ${formatUSD(Math.round((salNuevo - persona.sal) * 12))} USD
            </div>
          </div>
        </div>
      )}

      {/* Narrativas */}
      <div className={`grid gap-3 ${isLider ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {isLider && (
          <div className="fhr-card p-5 border-t-[3px] border-purple-400">
            <div className="text-[10px] uppercase tracking-wider text-purple-400 mb-3">
              ◈ Guía para el Líder — No mostrar al colaborador/a
            </div>
            <div
              className="text-sm text-slate-400 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: persona.nl.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>') }}
            />
          </div>
        )}

        <div className="fhr-card p-5 border-t-[3px] border-cyan-400">
          <div className="text-[10px] uppercase tracking-wider text-cyan-400 mb-3">
            ◇ Mensaje para {persona.nombre.split(' ')[0]}
          </div>
          <div
            className="text-sm text-slate-400 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: persona.nc.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>') }}
          />
        </div>
      </div>

      {/* Preguntas difíciles (lider only) */}
      {isLider && persona.preg.length > 0 && (
        <div className="fhr-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-amber-400 mb-4">
            ⚠ Preguntas difíciles anticipadas — respuestas sugeridas
          </div>

          <div className="space-y-4">
            {persona.preg.map((p, i) => (
              <div key={i}>
                <div className="flex items-start gap-2 text-sm font-semibold text-slate-200 mb-1.5">
                  <span className="text-amber-400 flex-shrink-0">?</span>
                  {p.q}
                </div>
                <div className="text-sm text-slate-400 leading-relaxed pl-5">{p.a}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function FichasCompensacionesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bandaFilter, setBandaFilter] = useState<BandaFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('lider')

  const filteredPersonas = useMemo(() => {
    if (bandaFilter === 'all') return PERSONAS
    return PERSONAS.filter((p) => p.banda === bandaFilter)
  }, [bandaFilter])

  const selectedPersona = useMemo(() => {
    return PERSONAS.find((p) => p.id === selectedId)
  }, [selectedId])

  const bandaTabs: { key: BandaFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'B1', label: 'B1 · Dir. Ejecutiva' },
    { key: 'B2', label: 'B2 · Direcciones' },
    { key: 'B3', label: 'B3 · Coordinaciones' },
    { key: 'B4', label: 'B4 · Analistas/Enc.' },
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-5 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-white font-serif text-base">
              F
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">FocalizaHR · Derechos Digitales</div>
              <div className="text-xs text-slate-500">Sistema de Compensaciones 2026 · Fichas 1:1</div>
            </div>
          </div>

          <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 border border-cyan-400/30 px-3 py-1.5 rounded-full">
            Fase A · Uso Interno
          </span>
        </div>
      </header>

      {/* Selector section */}
      <div className="px-6 pt-7 max-w-6xl mx-auto">
        <h1 className="fhr-title-gradient text-2xl font-serif mb-1">Fichas de Conversación Individual</h1>
        <p className="text-sm text-slate-400 mb-5">
          Selecciona una persona para ver su ficha ·{' '}
          <span className="text-cyan-400">15 colaboradores · 4 bandas</span>
        </p>

        {/* Band tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {bandaTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBandaFilter(tab.key)}
              className={`
                px-4 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all
                ${bandaFilter === tab.key
                  ? 'bg-cyan-400 border-cyan-400 text-slate-900'
                  : 'border-slate-700 text-slate-400 hover:border-cyan-400/50 hover:text-cyan-400'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Person grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 mb-7">
          {filteredPersonas.map((p) => (
            <PersonCard
              key={p.id}
              persona={p}
              isActive={selectedId === p.id}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 pb-16 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {selectedPersona ? (
            <div key={selectedPersona.id}>
              {/* View controls */}
              <div className="flex items-center gap-2 mb-5">
                <button
                  onClick={() => setViewMode('lider')}
                  className={`
                    px-4 py-2 rounded-lg border text-xs font-semibold tracking-wide transition-all
                    ${viewMode === 'lider'
                      ? 'bg-slate-800 border-cyan-400 text-cyan-400'
                      : 'border-slate-700 text-slate-400 hover:border-cyan-400/50'
                    }
                  `}
                >
                  Vista Líder
                </button>
                <button
                  onClick={() => setViewMode('colab')}
                  className={`
                    px-4 py-2 rounded-lg border text-xs font-semibold tracking-wide transition-all
                    ${viewMode === 'colab'
                      ? 'bg-slate-800 border-cyan-400 text-cyan-400'
                      : 'border-slate-700 text-slate-400 hover:border-cyan-400/50'
                    }
                  `}
                >
                  Vista Colaborador/a
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:border-cyan-400/50 hover:text-cyan-400 transition-all"
                >
                  ⎙
                </button>
              </div>

              <FichaDetalle persona={selectedPersona} viewMode={viewMode} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 text-slate-500"
            >
              <div className="text-5xl mb-4 opacity-30">◎</div>
              Selecciona una persona para ver su ficha de conversación
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}