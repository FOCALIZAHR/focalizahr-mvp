// src/lib/services/clima/ClimaNarrativeDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// ClimaNarrativeDictionary — copy VERBATIM de CASCADA_CLIMA_CONTENIDO.md (doc 2).
//
// Copy EXACTO (Principio 4). La estructura (narrativePre/Post, slots de
// enriquecimiento, dónde va cada placeholder) la define Code; las palabras, no.
//
// INTERPOLACIÓN: placeholders ASCII resueltos por interpolate(). El regex \w+
//   soporta cualquier clave (incl. las nuevas del enriquecimiento Nota G).
//
// ENRIQUECIMIENTO "momento de revelación" (Nota G): nombre + cifra + comparación
//   al revelar. Cada Acto trae narrativePre + enrichment (opcional) + narrativePost.
//   El motor decide qué variante del enriquecimiento incluir (named/magnitude por
//   guard n≥5; contrast en MOMENTUM; 2 flags independientes en DRIVER).
//
// CROSS-SIGNAL: `CROSS_SIGNAL_CLAUSES` (§7 del doc 2) — ÚNICA fuente. `convergence`
//   va a la narrativa; `hypotheses` REEMPLAZA el "O" base SOLO si no está vacío
//   (onboardingParejo de OBSERVACION agrega convergencia pero conserva su "O" base).
// ════════════════════════════════════════════════════════════════════════════

import type { ClimaDiagnosticType, ActColor } from '@/types/clima-cascada';
import type { RiskZone } from '@/lib/services/clima/climaThresholds';

// ════════════════════════════════════════════════════════════════════════════
// §0.1 — PORTADA (el gancho). 4 variantes por zona. {n}=orgFav, {gap}=75−orgFav.
// ════════════════════════════════════════════════════════════════════════════

export const PORTADA_BY_ZONE: Record<RiskZone, string> = {
  roja:
    'Tu organización opera al {n}%. No es solo un número. Es lo que tu gente está viviendo hoy.',
  naranja:
    'Tu organización opera al {n}%, bajo el estándar. No es solo un número. Es lo que tu gente está viviendo hoy.',
  amarilla:
    'Tu organización opera al {n}%, a {gap} puntos de tu objetivo. No es solo un número. Es lo que tu gente está viviendo hoy.',
  verde:
    'Tu organización opera al {n}%. No es solo un número. Es lo que tu gente está viviendo hoy.',
};

export const PORTADA_CTA = 'Ver evidencia →';

// ════════════════════════════════════════════════════════════════════════════
// §0.2 — ACTO ANCLA (Tipo 2, Masa y Gravedad). 4 nodos, narrativa por rango.
// Magnitud pura (anti-robo-de-trueno). Nodo 4 = Ancla Científica (tooltip).
// ════════════════════════════════════════════════════════════════════════════

/** Nodo 1 — Distribución de zonas. */
export function anclaNode1Narrative(nBelow: number, total: number): string {
  if (nBelow === 0) return 'Ninguna gerencia está bajo el estándar.';
  const pct = total > 0 ? (nBelow / total) * 100 : 0;
  if (pct <= 20) return 'Una parte pequeña de tus gerencias está bajo el estándar.';
  if (pct <= 50) {
    const ratio = nBelow > 0 ? Math.round(total / nBelow) : total;
    return `Una de cada ${ratio} gerencias está bajo el estándar.`;
  }
  return 'Más de la mitad de tus gerencias está bajo el estándar.';
}

/** Nodo 2 — Concentración. */
export function anclaNode2Narrative(pct: number): string {
  if (pct < 20) return 'El riesgo está repartido, sin un punto que concentre más que el resto.';
  if (pct < 50) return 'Una parte relevante del riesgo vive en un solo lugar.';
  return 'La mayoría del riesgo vive en un solo lugar.';
}

/** Nodo 3 — Volatilidad. */
export function anclaNode3Narrative(nFalling: number, total: number): string {
  if (nFalling === 0) return 'Ninguna gerencia viene cayendo respecto al ciclo anterior.';
  const pct = total > 0 ? (nFalling / total) * 100 : 0;
  if (pct <= 20) return 'Un grupo pequeño viene cayendo respecto al ciclo anterior.';
  if (pct <= 50) return 'Una parte relevante viene cayendo respecto al ciclo anterior.';
  return 'Más de la mitad viene cayendo respecto al ciclo anterior.';
}

/** Nodo 4 — Confiabilidad (Ancla Científica). */
export function anclaNode4Narrative(nTheatre: number): string {
  return nTheatre === 0
    ? 'No hay contradicción entre lo que el cumplimiento declara y lo que el clima real muestra.'
    : 'En algún punto de la organización, lo que el cumplimiento declara y lo que el clima real muestra no coinciden.';
}

export const ANCLA_NODE_LABELS = {
  distribucion: 'Distribución de zonas',
  concentracion: 'Concentración',
  volatilidad: 'Volatilidad',
  confiabilidad: 'Confiabilidad',
} as const;

/** Tooltip del Nodo 4 (Ancla Científica) — verbatim §0.2 (incl. umbral ≥2, Nota F). */
export const ANCLA_CONFIABILIDAD_TOOLTIP =
  'Se detecta cuando el cumplimiento formal de una gerencia se marca como en regla, ' +
  'mientras su clima real cae por debajo del estándar esperado en el mismo período. ' +
  'No mide mala fe — mide que dos fuentes que, en condiciones normales, deberían contar ' +
  'la misma historia, dejaron de hacerlo. Cuando aparece en 2 o más gerencias a la vez, ' +
  'la discrepancia deja de ser un caso aislado y se vuelve un patrón que hay que resolver ' +
  'antes de confiar en cualquier otro número.';

export const ANCLA_SCORE_LABEL = 'Favorabilidad';

// ════════════════════════════════════════════════════════════════════════════
// ACT_DICTIONARY — copy por tipo (Actos §1-6 + §5.5 + Síntesis).
// ════════════════════════════════════════════════════════════════════════════

export interface ClimaActCopy {
  actSeparator: { label: string; color: ActColor };
  heroColor: ActColor;
  anchor: { value: string; caption: string };
  /** Párrafos antes del enriquecimiento. */
  narrativePre: string[];
  /** Enriquecimiento "momento de revelación" (Nota G). El motor elige la variante. */
  enrichment?: {
    /** [SI n≥5] — nombra la gerencia + cifra. */
    named?: string;
    /** [SI n<5] — solo magnitud (solo MOMENTUM lo alcanza en la práctica). */
    magnitude?: string;
    /** MOMENTUM — contraste con la gerencia que mejoró (si existe, n≥5). */
    contrast?: string;
    /** DRIVER — fragmentos compuestos por 2 flags independientes (impact / fall). */
    driver?: {
      prefix: string;
      impact: string;
      fall: string;
      joinAnd: string;
      closingBoth: string;
      closingSingle: string;
    };
  };
  /** Párrafos después del enriquecimiento, antes del cruce cross-signal. */
  narrativePost: string[];
  /** "O" base del Acto. '' para SALUDABLE. */
  hypotheses: string;
  coachingTip: string;
  ctaLabel: string;
  synthesis: {
    classification: string;
    implication: string;
    path: string;
    accountability: string;
  };
}

export const ACT_DICTIONARY: Record<ClimaDiagnosticType, ClimaActCopy> = {
  // ─── §1 TEATRO_GENERALIZADO (sin enriquecimiento — decisión Nota G) ───────
  TEATRO_GENERALIZADO: {
    actSeparator: { label: 'Confiabilidad', color: 'purple' },
    heroColor: 'purple',
    anchor: {
      value: '{n} gerencias',
      caption: 'con el papel y la gente diciendo cosas distintas',
    },
    narrativePre: [
      'En {n} gerencias, el sistema de cumplimiento dice que todo está en orden. Las personas que trabajan ahí dicen otra cosa.',
      'No es que una fuente esté equivocada y la otra en lo correcto. Es que dos fuentes independientes — el proceso formal y la voz real de la gente — dejaron de contar la misma historia. Y cuando eso pasa, ningún número de esas gerencias es confiable hasta que se resuelva por qué.',
    ],
    narrativePost: [],
    hypotheses:
      'O el proceso de cumplimiento está midiendo que se siguieron los pasos, no que la gente está bien. O la gente no se siente segura respondiendo con honestidad cuando sabe que la respuesta pasa por el mismo canal formal.',
    coachingTip:
      'Antes de intervenir el clima de esas gerencias, hay que entender por qué la gente no está hablando con libertad ahí. Esa pregunta, sola, ya es más importante que el número.',
    ctaLabel: 'Ver las {n} gerencias →',
    synthesis: {
      classification:
        'Este no es un problema de clima. Es un problema de qué tan seguro se puede confiar en lo que el sistema dice que está bien.',
      implication:
        'Mientras el cumplimiento declare tranquilidad y la gente diga lo contrario, cada decisión que se tome sobre esos datos parte de una base que no se sostiene. Actuar sobre un número que no es confiable puede ser peor que no actuar todavía.',
      path:
        'Resolver la contradicción antes de resolver el clima. Empezar por entender por qué esas gerencias no están hablando con la misma voz en los dos canales.',
      accountability:
        'El próximo ciclo confirmará si la contradicción se cerró o si se repite.',
    },
  },

  // ─── §2 HOTSPOT_CONCENTRADO ──────────────────────────────────────────────
  HOTSPOT_CONCENTRADO: {
    actSeparator: { label: 'Concentración', color: 'amber' },
    heroColor: 'amber',
    anchor: {
      value: '{favorability}',
      caption: '{gerencia}, muy por debajo del resto',
    },
    narrativePre: [
      '{gerencia} está sola, y está lejos. Mientras el resto de la organización se mueve dentro de un rango razonable, esta gerencia quedó muy por debajo — no es la cola de una tendencia general, es un caso aislado.',
    ],
    enrichment: {
      named:
        '{gerencia} está en {favorabilidadGerencia}%, {gapVsPromedio} puntos bajo el promedio de la organización. La brecha entre esta gerencia y la mejor de la empresa es de {spreadVsMejor} puntos — no es una diferencia menor, es buena parte del ancho completo de la escala de riesgo.',
      magnitude:
        'Una gerencia está {gapVsPromedio} puntos bajo el promedio de la organización — con un volumen de personas insuficiente para nombrarla con precisión, pero la brecha es real.',
    },
    narrativePost: [],
    hypotheses:
      'O el liderazgo actual de {gerencia} está generando algo que el resto de la empresa no tiene. O {gerencia} heredó una condición — de carga, de reestructuración, de rotación reciente — que todavía no se resolvió.',
    coachingTip:
      'Un incendio localizado no se combate con una política transversal. Una conversación directa con quien lidera {gerencia} vale más que un programa para toda la empresa — acá el problema tiene nombre y dirección.',
    ctaLabel: 'Ver evidencia de {gerencia} →',
    synthesis: {
      classification:
        'Este no es un problema cultural de la empresa. Es un problema con responsable identificado.',
      implication:
        '{gerencia} concentra un déficit que el resto de la organización no tiene. Cuando el clima de una sola gerencia colapsa así, arrastra a quienes dependen de ese liderazgo y a quienes trabajan codo a codo con ese equipo.',
      path:
        'Una conversación directa con el liderazgo de {gerencia}. No un programa transversal — el problema tiene origen identificado.',
      accountability:
        'El próximo ciclo confirmará si esa gerencia se acercó al resto o si el patrón se repite.',
    },
  },

  // ─── §3 DRIVER_SISTEMICO (enriquecimiento = 2 flags independientes) ───────
  DRIVER_SISTEMICO: {
    actSeparator: { label: 'Patrón organizacional', color: 'purple' },
    heroColor: 'purple',
    anchor: {
      value: '{n} gerencias',
      caption: 'comparten el mismo problema de {dimension}',
    },
    narrativePre: [
      '{dimension} no falla en una gerencia. Falla en {n}, sin relación jerárquica entre ellas — no reportan al mismo líder, no comparten equipo, no tienen nada en común más que el mismo síntoma.',
      'Cuando el mismo problema aparece en lugares que no se tocan entre sí, no es casualidad. Es sistema.',
    ],
    enrichment: {
      // Fragmentos verbatim §3. El motor compone según flags impact/fall.
      driver: {
        prefix: 'Y no es cualquier problema: {dimension} es, hoy, ',
        impact: 'el driver que más pesa en tu resultado general',
        fall:
          'el que más cayó respecto al ciclo anterior, con una variación de {deltaDimension} puntos',
        joinAnd: ' — y también ',
        closingBoth:
          '. Cuando el factor más influyente es también el que más se está moviendo, la urgencia no es solo de patrón, es de magnitud.',
        closingSingle: '.',
      },
    },
    narrativePost: [],
    hypotheses:
      'O la forma en que se selecciona y forma a quienes lideran no está preparando a nadie para sostener {dimension}. O hay una política o un proceso que toca a toda la organización por igual, y el efecto se nota en {dimension} antes que en cualquier otro lado.',
    coachingTip:
      'Reemplazar a los {n} líderes no resuelve un patrón que el sistema sigue produciendo. La pregunta no es quién falla — es qué está formando a quienes fallan de la misma manera.',
    ctaLabel: 'Ver las {n} gerencias →',
    synthesis: {
      classification:
        'Este no es un problema de {n} líderes distintos. Es un problema de cómo el sistema los está formando.',
      implication:
        '{dimension} se repite igual en gerencias que no tienen relación entre sí. Intervenir persona por persona corrige el síntoma, no la causa.',
      path:
        'Revisar cómo se selecciona, forma y acompaña a quienes lideran, antes de intervenir gerencia por gerencia.',
      accountability:
        'El próximo ciclo confirmará si el patrón se rompió o si aparece en una gerencia más.',
    },
  },

  // ─── §4 MOMENTUM_NEGATIVO (named/magnitude + contrast) ────────────────────
  MOMENTUM_NEGATIVO: {
    actSeparator: { label: 'Tendencia', color: 'amber' },
    heroColor: 'amber',
    anchor: {
      value: '{n} gerencias',
      caption: 'cayendo respecto a la medición anterior',
    },
    narrativePre: [
      'El nivel de hoy todavía no es crítico. La dirección, sí. {n} de tus gerencias no están en la misma posición que en la medición anterior — están más abajo.',
      'Un número que cae y todavía se ve bien es la señal más barata de leer y la más fácil de ignorar. Nadie declara una crisis por una caída que parte de un buen lugar.',
    ],
    enrichment: {
      named:
        '{GerenciaBaja} cayó {deltaBaja} puntos respecto al ciclo anterior — la caída más pronunciada de toda la organización.',
      magnitude:
        'La caída más pronunciada de la organización fue de {deltaBaja} puntos, en una gerencia con volumen insuficiente para nombrarla con precisión.',
      contrast:
        'Y en el mismo período, {GerenciaSube} subió {deltaSube} puntos. La dirección no es uniforme: hay lugares moviéndose en sentidos opuestos al mismo tiempo, dentro de la misma organización.',
    },
    narrativePost: [],
    hypotheses:
      'O algo cambió en la organización que todavía no se ha nombrado en voz alta. O una señal temprana ya se había visto antes y no se actuó sobre ella — y esta caída es la continuación de esa misma historia.',
    coachingTip:
      'La ventana más barata para intervenir es antes de que el nivel absoluto obligue a hacerlo. Después de zona crítica, la misma conversación cuesta más — en tiempo, en confianza, en gente.',
    ctaLabel: 'Ver la tendencia completa →',
    synthesis: {
      classification: 'Este no es un problema de nivel. Es un problema de dirección.',
      implication:
        'El número de hoy todavía se sostiene. La tendencia de los últimos ciclos dice otra cosa. Actuar antes de la zona crítica siempre cuesta menos que actuar después.',
      path:
        'Identificar qué cambió antes de que el nivel absoluto obligue a actuar de todas formas.',
      accountability: 'El próximo ciclo confirmará si la tendencia se revirtió.',
    },
  },

  // ─── §5 BIEN_CON_FOCOS (named/magnitude; enriquecimiento entre p2 y p3) ────
  BIEN_CON_FOCOS: {
    actSeparator: { label: 'Focos de atención', color: 'cyan' },
    heroColor: 'cyan',
    anchor: {
      value: '{n} de {total}',
      caption: 'gerencias fuera del buen resultado general',
    },
    narrativePre: [
      'La organización está sobre el estándar. Eso es real, y vale la pena decirlo primero: el resultado general es bueno.',
      'Pero un promedio sano puede esconder a quien no lo vive así. {n} gerencias no acompañan ese resultado — y para las personas que trabajan ahí, el promedio de la empresa no cambia nada de lo que sienten todos los días.',
    ],
    enrichment: {
      named:
        '{gerencia}, en {favorabilidadGerencia}%, es la excepción — {gapVsPromedioOrg} puntos bajo el resto de la organización.',
      magnitude:
        'Una gerencia queda fuera del estándar, con un volumen insuficiente para nombrarla con precisión, pero con una brecha de {gapVsPromedioOrg} puntos respecto al resto.',
    },
    narrativePost: [
      'Un buen número general no es evidencia de que no haya nadie sufriendo un mal clima. Es evidencia de que la mayoría está bien — que no es lo mismo.',
    ],
    hypotheses:
      'O son casos puntuales — un cambio de liderazgo reciente, una reestructuración, algo con fecha de inicio identificable. O son la primera señal de algo que el promedio todavía no alcanza a mostrar, porque el resto de la organización es lo suficientemente grande para diluirlo.',
    coachingTip:
      'No hace falta una alarma para mirar de cerca lo que un buen promedio esconde. El cuidado más barato es el que se da antes de que el número obligue a prestar atención.',
    ctaLabel: 'Ver gerencias fuera del estándar →',
    synthesis: {
      classification:
        'El promedio de tu organización está sano. No toda tu organización lo está viviendo así.',
      implication:
        '{n} gerencias no acompañan el resultado general. Un promedio bueno no es garantía para quienes trabajan en las que quedan fuera de él.',
      path:
        'Sostener lo que funciona en el resto de la organización, y mirar de cerca a las gerencias que no acompañan el promedio — antes de que dejen de ser la excepción.',
      accountability:
        'El próximo ciclo confirmará si esas gerencias se acercaron al resto o si el foco se amplió.',
    },
  },

  // ─── §5.5 OBSERVACION_SIN_FOCO (7º tipo — final, doc 2 §5.5) ───────────────
  OBSERVACION_SIN_FOCO: {
    actSeparator: { label: 'Panorama general', color: 'amber' },
    heroColor: 'amber',
    anchor: {
      value: '{orgFavorability}',
      caption: 'bajo el objetivo, sin un punto que concentre el problema',
    },
    narrativePre: [
      'El resultado general está bajo el objetivo — no en una gerencia, no en un driver puntual, no en una tendencia que caiga. Está bajo en todos lados, de manera pareja.',
      'Esto no es un caso aislado que se pueda señalar y resolver con una conversación. Es un nivel general que todavía no alcanza el estándar, sin que ningún lugar concentre la explicación más que el resto.',
    ],
    enrichment: {
      named:
        '{GerenciaMasBaja}, en {favorabilidadMasBaja}%, es la que está más lejos del objetivo — pero incluso ella no está sola: el resto de la organización tampoco llega, solo que un poco menos lejos.',
      magnitude:
        'Incluso la gerencia más lejos del objetivo tiene un volumen insuficiente para nombrarla con precisión — y de todas formas no está sola: el resto de la organización tampoco llega.',
    },
    narrativePost: [],
    hypotheses:
      'O el estándar de {CLIMA_TARGET_FAVORABILITY} está fuera de alcance con las condiciones actuales de la organización. O hay una condición transversal — de carga, de momento de la empresa, de expectativas que cambiaron — que afecta a todos por igual y todavía no tiene nombre.',
    coachingTip:
      'Cuando nadie destaca por estar peor, la tentación es no actuar sobre nadie en particular. Pero un nivel general bajo el estándar, sin foco, sigue siendo un nivel general bajo el estándar — merece la misma atención que si tuviera un responsable identificado. Solo que la intervención no es local, es de conjunto.',
    ctaLabel: 'Ver el panorama completo →',
    synthesis: {
      classification:
        'Este no es un problema con responsable identificado. Es un piso general que todavía no alcanza el estándar.',
      implication:
        'Ninguna gerencia concentra el problema más que las demás — lo que significa que corregir una sola no va a mover el resultado general. El desafío no es de foco, es de conjunto.',
      path:
        'Revisar qué condición transversal explica un nivel parejo bajo el estándar, en vez de buscar un responsable puntual que no existe.',
      accountability:
        'El próximo ciclo confirmará si el nivel general se acercó al estándar o si la brecha se mantiene pareja.',
    },
  },

  // ─── §6 SALUDABLE (enriquecimiento = spread, siempre; entre p1 y p2) ──────
  SALUDABLE: {
    actSeparator: { label: 'Lo que sostiene el resultado', color: 'cyan' },
    heroColor: 'cyan',
    anchor: {
      value: '{orgFavorability}',
      caption: 'sin gerencias en riesgo, sin señales de caída',
    },
    narrativePre: [
      'Ninguna gerencia está en zona de riesgo. No hay señales de que el buen resultado sea reciente ni frágil. Eso no es casualidad — algo se está haciendo bien, y se sostiene en el tiempo.',
    ],
    enrichment: {
      named:
        'La brecha entre tu mejor y tu peor gerencia es de solo {spreadTotal} puntos. No es solo el promedio lo que sostiene este resultado — es que casi nadie se queda atrás.',
    },
    narrativePost: [
      'Un buen resultado sin explicación es más frágil que uno que se entiende. Cuando el clima está sano y nadie sabe bien por qué, alcanza con que una condición cambie para que el resultado se vaya con ella.',
      '{dimensionFuerte} es, hoy, lo que más sostiene este resultado — y es también lo primero que hay que proteger cuando algo en la organización cambie.',
      'La señal más temprana de que esto empieza a moverse no va a aparecer primero en el promedio general — el promedio es lento para mostrar grietas. Va a aparecer primero en cómo se siente quien recién llega. El abandono temprano de la gente nueva es, hoy, el número más barato de vigilar antes que cualquier otro.',
    ],
    hypotheses: '',
    coachingTip:
      'El desafío de un buen resultado no es mejorarlo — es no asumir que se mantiene solo. Lo que hoy sostiene el clima merece la misma atención que un problema, solo que en sentido contrario: protegerlo, no repararlo.',
    ctaLabel: 'Ver qué sostiene el resultado →',
    synthesis: {
      classification:
        'El clima de tu organización sostiene el resultado, no solo lo declara.',
      implication:
        'Ninguna gerencia en riesgo, sin señales de deterioro. Eso no es casualidad — refleja condiciones que se sostienen en el tiempo, no un buen momento aislado.',
      path:
        'El desafío ahora no es corregir. Es sostener las condiciones que produjeron este resultado, y no asumir que se mantienen solas.',
      accountability:
        'El próximo ciclo confirmará si esta condición se sostiene o se erosiona.',
    },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// CROSS_SIGNAL_CLAUSES — §7 del doc 2 (Diccionario del "O"). ÚNICA fuente.
// `convergence` → narrativa; `hypotheses` REEMPLAZA el "O" base SOLO si != ''.
// bias* / evaluadorProtege quedan DIFERIDOS (el motor no los selecciona en 4.5a).
// onboardingParejo (OBSERVACION §5.5): agrega convergencia, conserva su "O" base.
// ════════════════════════════════════════════════════════════════════════════

export interface CrossSignalClause {
  convergence: string;
  /** "O" enriquecido §7. '' = no reemplaza el "O" base del Acto. */
  hypotheses: string;
}

export type CrossSignalKey =
  | 'exit'
  | 'onboarding'
  | 'onboardingParejo'
  | 'biasLeniency'
  | 'biasSeverity'
  | 'evaluadorProtege';

export const CROSS_SIGNAL_CLAUSES: Record<CrossSignalKey, CrossSignalClause> = {
  // ─── 7.3 · Liderazgo × motivos de salida (Exit) — CABLEADO ───────────────
  exit: {
    convergence:
      'Y esta no es la primera vez que aparece esta señal: entre quienes dejaron {gerencia} en los últimos meses, el motivo más mencionado al salir fue su jefe directo. El clima de hoy y las salidas de ayer están señalando lo mismo.',
    hypotheses:
      'O el liderazgo actual heredó un problema que ya venía de antes y todavía no logra revertir. O es un patrón que se repite con cada persona nueva que pasa por ese equipo, más allá de quién ocupe el cargo hoy. O el clima bajo de hoy es la continuación exacta de la razón por la que la gente ya se estaba yendo.',
  },

  // ─── 7.4 · Cualquier dimensión × abandono temprano en onboarding — CABLEADO ─
  onboarding: {
    convergence:
      'Y hay una tercera fuente que coincide: quienes recién entran a {gerencia} se están yendo antes de asentarse, en una proporción mayor que el resto de la organización. Lo que describe el clima de quienes ya están, lo confirma también quien recién llegó y no se quedó.',
    hypotheses:
      'O lo que golpea a los nuevos es la misma condición que golpea a quienes ya están — solo que a los nuevos los golpea más rápido, porque todavía no tienen nada que los sostenga. O el proceso de bienvenida no está preparando a nadie para lo que realmente se va a encontrar en ese equipo. O ambas señales, clima y abandono temprano, están describiendo la misma condición desde ángulos distintos.',
  },

  // ─── OBSERVACION §5.5 · abandono onboarding parejo (no reemplaza el "O") ──
  onboardingParejo: {
    convergence:
      'Y hay una segunda señal pareja: la gente que recién entra tampoco se está asentando mejor en un lugar que en otro. La condición no distingue entre quien lleva años y quien acaba de llegar.',
    hypotheses: '',
  },

  // ─── 7.1 · Liderazgo × sesgo del evaluador (LENIENCY) — DIFERIDO ──────────
  biasLeniency: {
    convergence:
      'Y no es solo lo que la gente marcó en la encuesta: la forma en que ese liderazgo evalúa a su equipo muestra el mismo patrón — calificaciones parejas, sin diferenciar a quien rinde de quien no. Dos fuentes distintas, la misma gerencia, al mismo tiempo.',
    hypotheses:
      'O el líder no está viendo a su equipo con la misma vara que el resto de la organización. O la forma de evaluar y el clima del equipo son dos caras del mismo problema, no una la causa de la otra. O ambas señales responden a una condición del cargo — o una carga reciente — que todavía no se ha nombrado.',
  },

  // ─── 7.1 · Liderazgo × sesgo del evaluador (SEVERITY) — DIFERIDO ──────────
  biasSeverity: {
    convergence:
      'Y no es solo lo que la gente marcó en la encuesta: la forma en que ese liderazgo evalúa a su equipo también se aparta del resto de la organización — calificaciones sistemáticamente más duras que en gerencias comparables. Dos fuentes distintas, la misma gerencia, al mismo tiempo.',
    hypotheses:
      'O el líder no está viendo a su equipo con la misma vara que el resto de la organización. O la forma de evaluar y el clima del equipo son dos caras del mismo problema, no una la causa de la otra. O ambas señales responden a una condición del cargo — o una carga reciente — que todavía no se ha nombrado.',
  },

  // ─── 7.2 · Liderazgo × "¿el evaluador los protege?" — DIFERIDO ────────────
  evaluadorProtege: {
    convergence:
      'Y hay una segunda coincidencia: en esa misma gerencia, las metas del equipo se aprueban con una holgura que no se repite en el resto de la organización — el sistema la marca como un patrón de protección del evaluador hacia su gente. El clima bajo y esa holgura aparecen en el mismo lugar, al mismo tiempo.',
    hypotheses:
      'O el líder está protegiendo a su equipo de una presión que siente que ya es suficiente. O esa protección es, en sí misma, parte del problema — sin exigencia real tampoco hay desarrollo real. O ninguna de las dos explica todo por sí sola, y conviene mirar ambas señales juntas antes de sacar una conclusión.',
  },
};

// ════════════════════════════════════════════════════════════════════════════
// interpolate — reemplaza `{key}` por context[key]. Llaves desconocidas intactas.
// ════════════════════════════════════════════════════════════════════════════

export function interpolate(
  template: string,
  context: Record<string, string>,
): string {
  if (!template) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in context ? context[key] : match,
  );
}
