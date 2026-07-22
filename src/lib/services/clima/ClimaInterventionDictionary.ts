// src/lib/services/clima/ClimaInterventionDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima Gate 5A — Diccionario de intervenciones sugeridas.
//
// 8 dimensiones REALES (taxonomía Gate 1A) × 4 niveles de severidad (RiskZone:
// verde/amarilla/naranja/roja) = 32 celdas. Cada celda: narrative + steps +
// suggestedProduct. Lo consume ClimaActionPlanBuilder para poblar cada
// ClimaDecisionItem.intervention.
//
// ⚠️ CONTENIDO PROVISIONAL — Principio 4 del MAESTRO ("Narrativas las escribe
//    Victor o Studio IA. Code las copia EXACTO."). Code SÓLO scaffoldea la
//    ESTRUCTURA (8×4, dónde va cada slot). El copy final NO está escrito: cada
//    narrativa arranca con "PROVISIONAL: " para que sea imposible mostrarla a
//    cliente por accidente. No asumir que el diccionario está listo.
//
// Patrón: `Record<categoria, Record<RiskZone, …>>` — mismo molde zone-keyed que
// PORTADA_BY_ZONE en ClimaNarrativeDictionary. Fuente única de la taxonomía de
// drivers para el gate.
// ════════════════════════════════════════════════════════════════════════════

import type { RiskZone } from '@/lib/services/clima/climaThresholds';
import type {
  ClimaInterventionCell,
  ClimaInterventionVariantCell,
  ClimaSystemicCell,
  ReactiveContextEntry,
} from '@/types/clima-planes';

/** Estado del contenido — guard explícito contra "esto ya está listo". */
export const DICTIONARY_CONTENT_STATUS = 'PROVISIONAL' as const;

/** Las 8 dimensiones reales del banco de clima (Gate 1A). Fuente única del gate. */
export const CLIMA_DRIVER_CATEGORIES = [
  'satisfaccion',
  'liderazgo',
  'autonomia',
  'desarrollo',
  'crecimiento',
  'comunicacion',
  'reconocimiento',
  'compensaciones',
] as const;

export type ClimaDriverCategory = (typeof CLIMA_DRIVER_CATEGORIES)[number];

const P = 'PROVISIONAL: '; // prefijo obligatorio de toda narrativa scaffold (sin em-dash: regla de texto visible)

// ════════════════════════════════════════════════════════════════════════════
// 32 celdas (8 × 4). Contenido de relleno estructural — Studio IA lo reemplaza.
// ════════════════════════════════════════════════════════════════════════════

export const CLIMA_INTERVENTION_DICTIONARY: Record<
  ClimaDriverCategory,
  Record<RiskZone, ClimaInterventionCell>
> = {
  satisfaccion: {
    verde: { narrative: `${P}Satisfacción sana: sostener las prácticas que la sostienen.`, steps: ['Reforzar rituales de equipo que ya funcionan', 'Documentar qué está funcionando para replicar'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Satisfacción bajo el objetivo: observar y reforzar de forma ligera.`, steps: ['Conversación 1:1 del jefe con el equipo', 'Identificar 1 fricción concreta a resolver'], suggestedProduct: 'PDI (desarrollo suave)' },
    naranja: { narrative: `${P}Satisfacción en riesgo: intervención dirigida del área.`, steps: ['Diagnóstico de causa raíz con el equipo', 'Plan de acción de área con responsable y plazo'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Satisfacción crítica: intervención urgente y escalamiento.`, steps: ['Escalar a CEO/HRBP en 2 semanas', 'Plan de recuperación con hito de seguimiento'], suggestedProduct: 'Meta dura + Programa dirigido' },
  },
  liderazgo: {
    verde: { narrative: `${P}Liderazgo sólido: sostener y transferir la práctica a otras áreas.`, steps: ['Reconocer al líder del área', 'Usar al área como referencia interna'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Liderazgo bajo el objetivo: refuerzo de habilidades de gestión.`, steps: ['PDI de liderazgo para el jefe', 'Feedback 360° dirigido'], suggestedProduct: 'PDI (liderazgo)' },
    naranja: { narrative: `${P}Liderazgo en riesgo: acompañamiento dirigido del líder.`, steps: ['Coaching/mentoría al jefe de área', 'Meta de mejora de liderazgo con métrica'], suggestedProduct: 'Programa de Liderazgo' },
    roja: { narrative: `${P}Liderazgo crítico: intervención urgente sobre la conducción del área.`, steps: ['Escalar a CEO/HRBP en 2 semanas', 'Plan de acción con validación en el próximo seguimiento'], suggestedProduct: 'Meta dura + Programa de Liderazgo' },
  },
  autonomia: {
    verde: { narrative: `${P}Autonomía sana: sostener el margen de decisión del equipo.`, steps: ['Mantener delegación efectiva', 'Documentar buenas prácticas de empoderamiento'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Autonomía bajo el objetivo: revisar micromanagement y cargas.`, steps: ['Revisar espacios de decisión del equipo', 'Ajustar 1 proceso que quite autonomía'], suggestedProduct: 'PDI (desarrollo suave)' },
    naranja: { narrative: `${P}Autonomía en riesgo: rediseño dirigido de la delegación.`, steps: ['Diagnóstico de cuellos de decisión', 'Meta de área para ampliar autonomía'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Autonomía crítica: intervención urgente sobre el modelo de control.`, steps: ['Escalar a HRBP en 2 semanas', 'Plan de rediseño con hito de seguimiento'], suggestedProduct: 'Meta dura + Programa dirigido' },
  },
  desarrollo: {
    verde: { narrative: `${P}Desarrollo sano: sostener las oportunidades de crecimiento profesional.`, steps: ['Mantener rutas de aprendizaje activas', 'Reconocer avances de desarrollo'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Desarrollo bajo el objetivo: reforzar plan formativo individual.`, steps: ['Activar PDI por persona', 'Conversación de carrera con el jefe'], suggestedProduct: 'PDI (desarrollo)' },
    naranja: { narrative: `${P}Desarrollo en riesgo: plan formativo dirigido del área.`, steps: ['Mapear brechas de competencia del equipo', 'Meta de desarrollo con métrica'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Desarrollo crítico: intervención urgente sobre estancamiento.`, steps: ['Escalar a HRBP en 2 semanas', 'Plan de desarrollo con validación en seguimiento'], suggestedProduct: 'Meta dura + Programa formativo' },
  },
  crecimiento: {
    verde: { narrative: `${P}Crecimiento sano: sostener las oportunidades de progresión.`, steps: ['Mantener claridad de rutas de progresión', 'Reconocer promociones internas'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Crecimiento bajo el objetivo: clarificar rutas de progresión.`, steps: ['Explicitar criterios de progresión', 'PDI orientado a la siguiente etapa'], suggestedProduct: 'PDI (desarrollo suave)' },
    naranja: { narrative: `${P}Crecimiento en riesgo: plan dirigido de progresión.`, steps: ['Revisar oportunidades internas del área', 'Meta de crecimiento con métrica'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Crecimiento crítico: intervención urgente sobre techo de carrera.`, steps: ['Escalar a HRBP en 2 semanas', 'Plan de retención de talento con seguimiento'], suggestedProduct: 'Meta dura + Programa dirigido' },
  },
  comunicacion: {
    verde: { narrative: `${P}Comunicación sana: sostener los canales que ya funcionan.`, steps: ['Mantener rituales de comunicación', 'Documentar prácticas efectivas'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Comunicación bajo el objetivo: reforzar claridad y frecuencia.`, steps: ['Revisar cadencia de reuniones de equipo', 'Ajustar 1 canal de información clave'], suggestedProduct: 'PDI (desarrollo suave)' },
    naranja: { narrative: `${P}Comunicación en riesgo: rediseño dirigido de los flujos.`, steps: ['Diagnóstico de puntos ciegos de información', 'Meta de área para mejorar comunicación'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Comunicación crítica: intervención urgente sobre desinformación.`, steps: ['Escalar a HRBP en 2 semanas', 'Plan de comunicación con hito de seguimiento'], suggestedProduct: 'Meta dura + Programa dirigido' },
  },
  reconocimiento: {
    verde: { narrative: `${P}Reconocimiento sano: sostener las prácticas de valoración.`, steps: ['Mantener rituales de reconocimiento', 'Replicar buenas prácticas a otras áreas'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Reconocimiento bajo el objetivo: instalar hábito de valoración.`, steps: ['Reconocer logros en reuniones de equipo', 'Feedback positivo específico y frecuente'], suggestedProduct: 'PDI (desarrollo suave)' },
    naranja: { narrative: `${P}Reconocimiento en riesgo: sistema dirigido de reconocimiento.`, steps: ['Diseñar mecánica de reconocimiento del área', 'Meta de área con métrica de valoración'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Reconocimiento crítico: intervención urgente sobre desmotivación.`, steps: ['Escalar a HRBP en 2 semanas', 'Plan de reconocimiento con seguimiento'], suggestedProduct: 'Meta dura + Programa dirigido' },
  },
  compensaciones: {
    verde: { narrative: `${P}Compensaciones sanas: sostener la percepción de equidad.`, steps: ['Mantener transparencia del modelo', 'Comunicar criterios de compensación'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Compensaciones bajo el objetivo: revisar percepción de equidad.`, steps: ['Explicitar criterios de compensación al equipo', 'Detectar 1 fuente de inequidad percibida'], suggestedProduct: 'Revisión de equidad' },
    naranja: { narrative: `${P}Compensaciones en riesgo: revisión dirigida de la estructura.`, steps: ['Análisis de bandas del área con RRHH', 'Meta de corrección con plazo'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Compensaciones críticas: intervención urgente sobre inequidad.`, steps: ['Escalar a CEO/HRBP en 2 semanas', 'Plan de corrección con validación en seguimiento'], suggestedProduct: 'Meta dura + Revisión de compensaciones' },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// CAPA 2 — variantes por REACTIVO × zona (celda × reactivo-palanca).
//
// Capa ADITIVA sobre las 32 celdas base: cuando el reactivo de mayor priorityMean
// dentro de la dimensión CAMBIA MATERIALMENTE la acción recomendada, se escribe una
// variante acá (shape rico ClimaInterventionVariantCell); si no existe, getIntervention
// cae a la celda base (default, shape string). Escalera de severidad → naturaleza:
// amarilla → PDI_CLIMA (hábito blando), naranja → META_AREA (medible de área),
// roja → META_DURA (resolver la barrera de fondo, no "más de lo mismo").
//
// Fuente de contenido: CLIMA_INTERVENTION_VARIANTS_capa2_v1.md — 31 reactivos × 3
// zonas = 93 celdas, COPIADAS EXACTO (narrativa/steps/esfuerzo/efectividad/evidencia).
// Reactivos con advertencia de auditoría (efectividad/mejora/seguridad/autonomia/
// energia/doble-barril) quedan con su copy + nota intacta hasta que el banco los
// resuelva. Prefijo `PROVISIONAL: ` se mantiene. El doc está organizado
// dimensión→reactivo→zona (revisión humana); acá se TRANSPONE a zona→reactivo.
//
// La muestra v3.18 `liderazgo.roja.carga_trabajo` se MIGRÓ al shape rico (decisión
// Victor) → mapa uniforme; convive con `satisfaccion.roja.carga_trabajo` (otro
// reactivo bajo otra dimensión, sin colisión).
// ════════════════════════════════════════════════════════════════════════════

export const CLIMA_INTERVENTION_VARIANTS: Partial<
  Record<ClimaDriverCategory, Partial<Record<RiskZone, Record<string, ClimaInterventionVariantCell>>>>
> = {
  liderazgo: {
    amarilla: {
      desarrollo: {
        narrative: `${P}El equipo entrega pero no crece: la conversación de desarrollo no está ocurriendo.`,
        steps: [
          'Dedicar un 1:1 al mes solo a desarrollo, sin hablar de tareas',
          'Acordar una habilidad concreta a trabajar en el trimestre',
        ],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO',
        efectividad: 'MEDIA_ALTA',
        evidencia:
          'Q12 ("alguien en el trabajo estimula mi desarrollo"); Project Oxygen ubica el apoyo al desarrollo de carrera entre los comportamientos top de gerentes efectivos.',
      },
      expectativas: {
        narrative: `${P}Se avanza en el día a día pero las prioridades de fondo no están claras: instalar un norte simple y visible.`,
        steps: ['Escribir el top 3 de prioridades del rol y dejarlo a la vista', 'Confirmarlas en un 1:1 corto y frecuente'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'ALTA',
        evidencia: 'Item fundacional #1 del Gallup Q12 ("sé lo que se espera de mí"), de los predictores más replicados.',
      },
      reconocimiento: {
        narrative: `${P}El trabajo se entrega pero pasa sin valoración: instalar el hábito de reconocer lo concreto.`,
        steps: ['Reconocer un logro puntual por semana nombrando el impacto que tuvo', 'Evitar el elogio genérico: decir qué hizo y por qué importó'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'ALTA',
        evidencia: 'Q12 ("reconocimiento en los últimos 7 días"); reconocimiento semanal ~23% más satisfacción que mensual (Gallup). Estructura SBI.',
      },
      participacion: {
        narrative: `${P}Las decisiones bajan cerradas: abrir espacio para que el equipo aporte antes de decidir.`,
        steps: ['Pedir temas al equipo antes de cada 1:1 y reunión', 'Dejar que propongan cómo resolver al menos un tema propio'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Project Oxygen (Google): valorar la perspectiva del equipo aunque difiera es de los comportamientos top de gerentes efectivos.',
      },
      confianza: {
        narrative: `${P}La confianza se construye pidiendo feedback sobre el propio desempeño del jefe.`,
        steps: ['Preguntar qué instrucción del jefe hizo perder tiempo esta semana', 'Agradecer y ajustar, sin justificarse'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Pilar de seguridad psicológica (Project Aristotle); marco 4A de retroalimentación inversa.',
      },
      efectividad: {
        narrative: `${P}Las reuniones cunden poco: arreglar el formato de la que ya existe.`,
        steps: ['Co-crear la agenda antes de cada reunión', 'Cerrar con próximos pasos y un dueño por cada uno'],
        suggestedProduct: { label: 'Ajustar tus reuniones', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Consenso de práctica (Lattice, Culture Amp): sin agenda ni seguimiento de acuerdos es la causa más citada de reunión improductiva.',
      },
      resolucion: {
        narrative: `${P}Instalar el hábito de dar feedback sobre la conducta, no sobre la persona.`,
        steps: ['Describir el hecho observable, no el rasgo de carácter', 'Escuchar a las partes antes de resolver'],
        suggestedProduct: { label: 'Ajustar tu estilo de feedback', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Project Oxygen liga la resolución de conflictos a comportamientos de gerentes efectivos.',
      },
      cuidado: {
        narrative: `${P}Sumar un check-in personal, no solo de tarea, al 1:1 que ya existe.`,
        steps: ['Abrir el 1:1 con cómo está la persona antes de la tarea', 'Recordar y retomar un tema personal entre reuniones'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'ALTA',
        evidencia: 'Item fundacional Q12 ("mi supervisor se preocupa por mí como persona"), correlación fuerte con engagement.',
      },
    },
    naranja: {
      expectativas: {
        narrative: `${P}El equipo ejecuta objetivos cruzados: falta un norte compartido y medible del área.`,
        steps: ['Acordar por escrito las prioridades del área', 'Revisar avance contra ellas de forma quincenal'],
        suggestedProduct: { label: 'Meta de claridad del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Q12 #1 aplicado a nivel equipo; documentar y seguir cierra la brecha de interpretación.',
      },
      reconocimiento: {
        narrative: `${P}Quienes sostienen la operación no sienten validación: montar un sistema de reconocimiento del área.`,
        steps: ['Acordar un ritual breve de reconocimiento del equipo', 'Vigilar que nadie quede invisible durante un mes'],
        suggestedProduct: { label: 'Meta de reconocimiento del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Formalizar la cadencia evita que el reconocimiento dependa del ánimo del jefe.',
      },
      participacion: {
        narrative: `${P}Involucrar al equipo en decisiones reales del área, con seguimiento de qué se implementa.`,
        steps: ['Someter una decisión concreta del área a co-diseño', 'Medir cuántas propuestas del equipo terminan aplicándose'],
        suggestedProduct: { label: 'Meta de participación del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'La participación se vuelve real cuando se mide su efecto, no cuando solo se declara.',
      },
      confianza: {
        narrative: `${P}Hacer visible la coherencia entre lo que el líder promete y lo que cumple.`,
        steps: ['Hacer públicos los compromisos del líder y su cumplimiento', 'Cerrar de forma visible la brecha entre lo dicho y lo hecho'],
        suggestedProduct: { label: 'Meta de consistencia del líder', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'La confianza sigue al cumplimiento consistente y verificable, no al discurso.',
      },
      efectividad: {
        narrative: `${P}Proteger la cadencia y hacer medible el cierre de acuerdos entre reuniones.`,
        steps: ['No cancelar reuniones sin reagendar', 'Medir el porcentaje de acuerdos cerrados entre una reunión y la siguiente'],
        suggestedProduct: { label: 'Meta de reuniones útiles', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'El seguimiento de action items es lo que separa una reunión útil de una ceremonia.',
      },
      resolucion: {
        narrative: `${P}Dar al área un protocolo claro de cómo se plantean y resuelven los desacuerdos.`,
        steps: ['Acordar cómo se escalan y resuelven los conflictos del equipo', 'Medir el tiempo que toma resolverlos'],
        suggestedProduct: { label: 'Meta de convivencia del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Un protocolo acordado reduce la arbitrariedad percibida en cómo se manejan los roces.',
      },
      cuidado: {
        narrative: `${P}Detectar y actuar sobre las señales de desgaste del área antes de que escalen.`,
        steps: ['Mapear quién del equipo está más sobrecargado', 'Ajustar su carga antes de que tenga que pedir ayuda'],
        suggestedProduct: { label: 'Meta de bienestar del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'El cuidado se vuelve creíble cuando anticipa el desgaste en vez de reaccionar a él.',
      },
    },
    roja: {
      expectativas: {
        narrative: `${P}La falta de claridad no es de comunicación, es de norte: las prioridades cambian sin aviso o el propio jefe no las tiene fijas. Sin un norte estable, documentar más no ordena nada.`,
        steps: ['El jefe fija con su propia jefatura las 3 prioridades inamovibles del período', 'Recién con eso fijo, comprometer las metas individuales'],
        suggestedProduct: { label: 'Meta dura de rol', target: 'META_DURA', qualifier: 'Alineación de prioridades' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera de fondo = norte móvil; se resuelve alineando hacia arriba antes de bajar metas.',
      },
      reconocimiento: {
        narrative: `${P}El silencio ya se leyó como indiferencia y la desmotivación está instalada: un elogio tardío no revierte meses de nada, y el talento clave puede estar por irse.`,
        steps: ['Conversación directa de valoración y futuro con quienes sostienen la operación', 'Comprometer visibilidad real de su aporte ante la jefatura'],
        suggestedProduct: { label: 'Meta dura de retención', target: 'META_DURA', qualifier: 'Retención de clave' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Barrera = desmotivación/fuga ya en curso; la acción apunta a retener, no a reconocer tarde.',
      },
      participacion: {
        narrative: `${P}El equipo dejó de opinar porque aprendió que da lo mismo: no es que no participen, es que se rindieron de participar.`,
        steps: ['Reconocer de frente decisiones pasadas tomadas sin ellos', 'Devolver una decisión concreta a sus manos y respetar el resultado'],
        suggestedProduct: { label: 'Meta dura de decisión compartida', target: 'META_DURA', qualifier: 'Recuperar voz del equipo' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Barrera = impotencia aprendida; se rompe devolviendo una decisión real y honrándola.',
      },
      confianza: {
        narrative: `${P}El ambiente ya está roto: pedir feedback sin seguridad solo genera silencio o resentimiento. Primero seguridad, después feedback.`,
        steps: ['Conversación explícita fijando reglas: se critica el proceso, nunca a la persona', 'El líder admite primero un error propio antes de pedir nada'],
        suggestedProduct: { label: 'Meta dura de seguridad psicológica', target: 'META_DURA', qualifier: 'Seguridad psicológica' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Ejemplo validado del principio de severidad: en roja hay que instalar seguridad antes que cualquier técnica.',
      },
      efectividad: {
        narrative: `${P}La reunión se volvió control o teatro y nadie la cree útil: el problema es de legitimidad, no de agenda.`,
        steps: ['Preguntar al equipo qué reunión eliminarían y por qué', 'Rediseñar o suprimir la que no aporta, en vez de sumar estructura'],
        suggestedProduct: { label: 'Meta dura de rediseño de reuniones', target: 'META_DURA', qualifier: 'Rediseño de reuniones' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Barrera = las reuniones perdieron sentido; más formato no recupera credibilidad.',
      },
      resolucion: {
        narrative: `${P}El conflicto ya tiene historia y hay bandos formados: una técnica de feedback no desarma algo enquistado.`,
        steps: ['Mediar cara a cara a los involucrados con el líder presente', 'Acordar reglas de convivencia con consecuencias claras'],
        suggestedProduct: { label: 'Meta dura de mediación', target: 'META_DURA', qualifier: 'Mediación de conflicto' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Barrera = conflicto crónico; requiere mediación directa, no mejor comunicación.',
      },
      cuidado: {
        narrative: `${P}El vínculo está quebrado o hay agotamiento real: preguntar "cómo estás" suena vacío si el ritmo no cambia. El cuidado se demuestra aliviando, no preguntando.`,
        steps: ['Identificar la causa concreta del desgaste de los perfiles críticos', 'Quitar una exigencia real en vez de ofrecer una conversación'],
        suggestedProduct: { label: 'Meta dura de alivio de carga', target: 'META_DURA', qualifier: 'Alivio de carga' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = agotamiento/vínculo roto; se resuelve cambiando el ritmo, no con más preguntas.',
      },
      // MUESTRA v3.18 migrada al shape rico (Capa 2): palanca = carga sobre el jefe
      // (distinto de un conflicto de equipo) → la acción apunta al jefe. Convive con
      // satisfaccion.roja.carga_trabajo (mismo reactivo, otra dimensión, sin colisión).
      carga_trabajo: {
        narrative: `${P}Liderazgo crítico por sobrecarga del jefe: aliviar la carga antes que exigir más gestión.`,
        steps: ['Revisar el span de control y las tareas del jefe', 'Redistribuir carga o reforzar el equipo antes de escalar'],
        suggestedProduct: { label: 'Meta dura + Rediseño de carga', target: 'META_DURA' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
      },
    },
  },
  desarrollo: {
    amarilla: {
      planificacion: {
        narrative: `${P}El desarrollo queda pisado por lo operativo: separar una conversación de carrera aparte.`,
        steps: ['Agendar una charla de carrera separada del 1:1 operativo', 'Anotar al menos una meta de desarrollo concreta'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Gallup: la falta de desarrollo/crecimiento es la razón #1 de renuncia.',
      },
      acceso: {
        narrative: `${P}Hacer visible lo que ya existe y proteger algo de tiempo para usarlo.`,
        steps: ['Compartir el catálogo de capacitación disponible', 'Bloquear tiempo de aprendizaje en vez de dejarlo para "si sobra"'],
        suggestedProduct: { label: 'Ajustar acceso a formación', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Consenso de práctica (Culture Amp, Lattice); sin cifra aislada del componente de acceso.',
      },
      relevancia: {
        narrative: `${P}Personalizar la formación según lo que la persona necesita y hace bien.`,
        steps: ['Preguntar qué formación le serviría de verdad', 'Elegir capacitación conectada a su rol, no genérica'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA',
        evidencia: 'Guía de Culture Amp sobre conversaciones de desarrollo: personalizar, evitar el catálogo genérico. Consenso, sin cifra.',
      },
      aplicacion: {
        narrative: `${P}Dar un encargo real para practicar la habilidad recién aprendida.`,
        steps: ['Asignar una tarea que use la habilidad nueva', 'Revisar juntos cómo le fue al aplicarla'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Los encargos desafiantes son el mecanismo estándar de aplicación en programas de movilidad interna.',
      },
      ascenso: {
        narrative: `${P}Transparentar qué se necesita para llegar al próximo nivel.`,
        steps: ['Explicar los requisitos concretos del siguiente nivel', 'Mapear el interés de carrera de la persona'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'LinkedIn: 53% de las organizaciones que priorizan movilidad interna reportan permanencia más larga. (Esfuerzo medio → rara vez lote.)',
      },
    },
    naranja: {
      planificacion: {
        narrative: `${P}Cada persona con un plan de desarrollo escrito y con seguimiento del área.`,
        steps: ['Documentar un plan de desarrollo por persona', 'Revisar su avance cada trimestre'],
        suggestedProduct: { label: 'Meta de desarrollo del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'El plan documentado y revisado convierte la intención en compromiso trazable.',
      },
      acceso: {
        narrative: `${P}Tiempo de aprendizaje asignado y medible, no discrecional.`,
        steps: ['Asignar horas de formación por persona', 'Medir el uso real de esas horas'],
        suggestedProduct: { label: 'Meta de formación del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'El acceso real se mide en horas efectivamente usadas, no en oferta disponible.',
      },
      relevancia: {
        narrative: `${P}Alinear el plan de formación a las brechas reales del área.`,
        steps: ['Mapear las brechas de habilidad concretas del equipo', 'Alinear el catálogo de formación a esas brechas'],
        suggestedProduct: { label: 'Meta de formación relevante', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA',
        evidencia: 'La relevancia sube cuando la formación responde a brechas medidas, no a oferta estándar.',
      },
      aplicacion: {
        narrative: `${P}Cada capacitación con un proyecto de aplicación asociado y seguido.`,
        steps: ['Asociar a cada formación un proyecto donde se aplique', 'Medir qué se puso realmente en práctica'],
        suggestedProduct: { label: 'Meta de aplicación del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Sin un proyecto donde aplicarla, la formación se olvida antes de rendir.',
      },
      ascenso: {
        narrative: `${P}Criterios de ascenso públicos y vacantes internas primero.`,
        steps: ['Publicar los criterios de elegibilidad para ascender', 'Abrir vacantes internas antes que externas'],
        suggestedProduct: { label: 'Meta de movilidad interna', target: 'META_AREA' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'La transparencia de criterios reduce la percepción de que el ascenso es arbitrario.',
      },
    },
    roja: {
      planificacion: {
        narrative: `${P}Las personas dejaron de creer que el desarrollo va a pasar por promesas incumplidas: no falta plan, falta la prueba de que se cumple.`,
        steps: ['Cerrar de forma visible un compromiso de desarrollo pendiente antes de pedir planes nuevos', 'Comprometer un hito real con fecha propia de la persona'],
        suggestedProduct: { label: 'Meta dura de desarrollo', target: 'META_DURA', qualifier: 'Plan con hito real' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = credibilidad rota por promesas incumplidas; se recupera cumpliendo una antes de prometer otra.',
      },
      acceso: {
        narrative: `${P}No hay recursos reales o el acceso está bloqueado por presupuesto o permiso: no es visibilidad, es que no hay a qué acceder.`,
        steps: ['Escalar la falta concreta de recursos a quien controla el presupuesto', 'Conseguir al menos una vía de formación real y disponible'],
        suggestedProduct: { label: 'Meta dura de recursos de formación', target: 'META_DURA', qualifier: 'Recursos de formación' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Barrera = ausencia real de recursos; requiere presupuesto, no mejor comunicación.',
      },
      relevancia: {
        narrative: `${P}La formación se percibe como pérdida de tiempo impuesta: capacitar sin relevancia gasta tiempo y credibilidad.`,
        steps: ['Suspender la formación genérica que nadie aplica', 'Co-diseñar con el equipo qué formación sí necesitan'],
        suggestedProduct: { label: 'Meta dura de formación útil', target: 'META_DURA', qualifier: 'Rediseño de formación' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA',
        evidencia: 'Barrera = formación impuesta sin valor; se corta y se co-diseña, no se intensifica.',
      },
      aplicacion: {
        narrative: `${P}La operación no deja espacio para aplicar: se capacita y se vuelve a lo mismo. Sin espacio para practicar, la formación se evapora.`,
        steps: ['Liberar carga concreta para que la habilidad nueva se use', 'Proteger ese espacio de la urgencia diaria'],
        suggestedProduct: { label: 'Meta dura de aplicación', target: 'META_DURA', qualifier: 'Espacio de aplicación' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Barrera = operación sin holgura; hay que liberar carga, no capacitar más.',
      },
      ascenso: {
        narrative: `${P}Hay techo real y estructura plana, con fuga inminente: el talento real siempre buscará afuera el espacio que se le niega adentro.`,
        steps: ['Construir un caso de negocio para crear la posición o el ascenso', 'Conectar a la persona con un patrocinador ejecutivo'],
        suggestedProduct: { label: 'Meta dura de ruta de ascenso', target: 'META_DURA', qualifier: 'Ruta de ascenso' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = techo estructural; requiere crear espacio real, no clarificar uno inexistente. Casi siempre individual.',
      },
    },
  },
  crecimiento: {
    amarilla: {
      inversion: {
        narrative: `${P}Hacer visible la inversión en desarrollo que ya ocurre pero no se percibe.`,
        steps: ['Mostrar el tiempo y recursos ya dedicados a su desarrollo', 'Nombrar lo invisible: lo que la empresa ya pone'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA',
        evidencia: 'Mismo patrón que el "sueldo oculto": el valor invertido no se percibe si no se comunica.',
      },
      mentoria: {
        narrative: `${P}Conectar a la persona con un referente interno para que no crezca sola.`,
        steps: ['Emparejarla con alguien más senior en un tema concreto', 'Acordar encuentros breves y regulares'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'ALTA',
        evidencia: 'La mentoría es uno de los pilares citados consistentemente como predictor de retención y desarrollo.',
      },
      nuevas_habilidades: {
        narrative: `${P}Exponer a la persona a algo fuera de su rutina para que aprenda.`,
        steps: ['Sumarla a un proyecto corto fuera de su rol habitual', 'Que se lleve una habilidad nueva aplicable'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Consenso fuerte en literatura de movilidad interna (mercado interno de proyectos).',
      },
      desafios: {
        narrative: `${P}Dar un desafío alineado a lo que a la persona le interesa probar.`,
        steps: ['Preguntar qué le gustaría probar', 'Asignar un reto conectado a ese interés'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'El desafío alineado al interés propio es lo que distingue un reto motivador de una sobrecarga.',
      },
    },
    naranja: {
      inversion: {
        narrative: `${P}Comunicar de forma regular cuánto se invierte en el desarrollo del área.`,
        steps: ['Reportar por período qué se invirtió por persona', 'Medir cómo cambia la percepción de inversión'],
        suggestedProduct: { label: 'Meta de visibilidad de inversión', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA',
        evidencia: 'La percepción de inversión sigue a su comunicación explícita y sostenida.',
      },
      mentoria: {
        narrative: `${P}Estructurar la mentoría del área con seguimiento de continuidad.`,
        steps: ['Formar duplas de mentoría estables', 'Medir su continuidad y utilidad percibida'],
        suggestedProduct: { label: 'Meta de mentoría del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'La mentoría informal se sostiene cuando hay estructura y tiempo protegido.',
      },
      nuevas_habilidades: {
        narrative: `${P}Abrir un mercado interno de proyectos del área para quien quiera crecer.`,
        steps: ['Publicar proyectos cross a los que el equipo pueda sumarse', 'Medir la participación real'],
        suggestedProduct: { label: 'Meta de nuevas habilidades', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'La exposición a habilidades nuevas escala cuando hay un canal abierto, no invitaciones sueltas.',
      },
      desafios: {
        narrative: `${P}Repartir desafíos de forma deliberada según los intereses declarados.`,
        steps: ['Asignar retos según los intereses que cada uno expresó', 'Seguir el avance de cada desafío'],
        suggestedProduct: { label: 'Meta de desafíos del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'La asignación deliberada supera al reparto al azar en efecto sobre desarrollo.',
      },
    },
    roja: {
      inversion: {
        narrative: `${P}La inversión de verdad no existe: no se puede comunicar algo que no ocurre.`,
        steps: ['Comprometer un presupuesto real de desarrollo, aunque sea mínimo', 'Escalarlo si no está en manos del jefe'],
        suggestedProduct: { label: 'Meta dura de inversión', target: 'META_DURA', qualifier: 'Inversión en desarrollo' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA',
        evidencia: 'Barrera = ausencia real de inversión; requiere presupuesto, no relato.',
      },
      mentoria: {
        narrative: `${P}Hay aislamiento real, nadie a quien seguir: sin referentes, el crecimiento queda librado al azar y el talento se va.`,
        steps: ['Asignar formalmente un mentor con tiempo protegido', 'Incluir mentoría inversa para que el valor corra en ambos sentidos'],
        suggestedProduct: { label: 'Meta dura de mentoría formal', target: 'META_DURA', qualifier: 'Mentoría formal' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Barrera = aislamiento; requiere asignación formal, no un emparejamiento casual.',
      },
      nuevas_habilidades: {
        narrative: `${P}El puesto está estancado y no hay nada nuevo que aprender ahí: un rol sin horizonte convierte al talento en talento de salida.`,
        steps: ['Rediseñar el rol para incorporar responsabilidades nuevas', 'O abrir un movimiento lateral real hacia otra área'],
        suggestedProduct: { label: 'Meta dura de ampliación de rol', target: 'META_DURA', qualifier: 'Ampliación de rol' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Barrera = rol estancado; se abre horizonte rediseñando o moviendo, no con proyectos puntuales.',
      },
      desafios: {
        narrative: `${P}El talento sobrecalificado se aburre y se va: sin desafío, el mejor talento es el primero en irse.`,
        steps: ['Comprometer un proyecto de mayor alcance con visibilidad', 'Alinearlo al interés declarado de la persona'],
        suggestedProduct: { label: 'Meta dura de desafío', target: 'META_DURA', qualifier: 'Desafío de alto alcance' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Barrera = estancamiento del sobrecalificado; requiere un reto real de alcance, no más de lo mismo.',
      },
    },
  },
  comunicacion: {
    amarilla: {
      comunicacion_interna: {
        narrative: `${P}Abrir un canal regular para informar y responder dudas del equipo.`,
        steps: ['Instalar un espacio corto y periódico para informar y responder', 'Recoger las preguntas antes del encuentro'],
        suggestedProduct: { label: 'Ajustar tu comunicación', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Caso LinkedIn: reuniones abiertas mensuales con acceso a liderazgo subieron engagement >30% en un año.',
      },
      colaboracion_interdepartamental: {
        narrative: `${P}Acercar a las dos áreas que más friccionan y acordar un primer gesto.`,
        steps: ['Sentar a ambas partes a nombrar el punto de roce', 'Acordar un primer gesto concreto de colaboración'],
        suggestedProduct: { label: 'Facilitar entre áreas', target: 'PDI_CLIMA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'El fondo del reactivo es estructural (esfuerzo alto); rara vez es un candidato limpio de lote.',
      },
      expresion_libre: {
        narrative: `${P}El líder normaliza el error y el "no sé" para que hablar sea seguro.`,
        steps: ['Admitir en público un error propio', 'Agradecer a quien plantea un problema incómodo'],
        suggestedProduct: { label: 'Ajustar tu liderazgo', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'ALTA',
        evidencia: 'Pilar de seguridad psicológica (Edmondson / Project Aristotle), de los predictores más replicados de desempeño de equipo.',
      },
    },
    naranja: {
      comunicacion_interna: {
        narrative: `${P}Reunión abierta con preguntas en vivo y seguimiento de que las dudas se resuelvan.`,
        steps: ['Reunión abierta con todo el equipo y preguntas anónimas', 'Medir si las dudas planteadas efectivamente se responden'],
        suggestedProduct: { label: 'Meta de comunicación del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'La comunicación se vuelve efectiva cuando se mide la resolución de dudas, no solo la emisión.',
      },
      colaboracion_interdepartamental: {
        narrative: `${P}Definir un objetivo cruzado y medible entre las áreas, no solo más reuniones.`,
        steps: ['Definir una meta compartida entre las 2 áreas', 'Medir el resultado conjunto, no el de cada área por separado'],
        suggestedProduct: { label: 'Meta cruzada entre áreas', target: 'META_AREA' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'La métrica cruzada es lo que cambia el comportamiento; sin ella, romper silos no dura.',
      },
      expresion_libre: {
        narrative: `${P}Habilitar canales seguros para plantear ideas y disenso, y actuar sobre ellos.`,
        steps: ['Abrir una vía para plantear temas sin exponerse', 'Actuar de forma visible sobre lo que llega por ahí'],
        suggestedProduct: { label: 'Meta de voz del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'El canal seguro solo funciona si el equipo ve que plantear un problema tiene efecto.',
      },
    },
    roja: {
      comunicacion_interna: {
        narrative: `${P}Se comunica pero nadie lo cree, o falta transparencia real: cuando falta transparencia, más comunicados generan más sospecha.`,
        steps: ['Nombrar de frente lo que antes se ocultó o se comunicó tarde', 'Abrir las decisiones difíciles, no solo las buenas noticias'],
        suggestedProduct: { label: 'Meta dura de transparencia', target: 'META_DURA', qualifier: 'Transparencia real' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Barrera = desconfianza en el mensaje; se rompe con transparencia sobre lo incómodo. (Reactivo doble-barril, revisar.)',
      },
      colaboracion_interdepartamental: {
        narrative: `${P}Los incentivos premian el silo: ningún esfuerzo de colaboración sobrevive si cada área se evalúa por separado.`,
        steps: ['Rediseñar metas e incentivos para que compartan resultado', 'Hacer que el éxito de un área dependa del de la otra'],
        suggestedProduct: { label: 'Meta dura cruzada', target: 'META_DURA', qualifier: 'Incentivos compartidos' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = incentivos que premian el silo; se corrige rediseñando metas, no agendando reuniones. Casi siempre individual.',
      },
      expresion_libre: {
        narrative: `${P}Hay miedo real a represalias y ya existe historia de castigo al que habla: donde hablar tuvo costo, el silencio es la respuesta racional.`,
        steps: ['Reconocer de frente el episodio que instaló el miedo', 'Demostrar con hechos que plantear problemas no tiene consecuencias'],
        suggestedProduct: { label: 'Meta dura de seguridad para hablar', target: 'META_DURA', qualifier: 'Seguridad para hablar' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = miedo con historia real; se desarma reconociendo el episodio y probando que ya no hay castigo.',
      },
    },
  },
  autonomia: {
    amarilla: {
      colaboracion: {
        narrative: `${P}El trabajo cruza equipos pero cada uno resuelve por su lado: falta un punto de contacto fijo.`,
        steps: [
          'Nombrar un referente por equipo para los temas que cruzan',
          'Cerrar cada entrega cruzada con quién sigue y para cuándo',
        ],
        suggestedProduct: { label: 'Ajustar rituales de equipo', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO',
        efectividad: 'ALTA',
        evidencia:
          'Q12 ("mis compañeros están comprometidos con hacer un trabajo de calidad"); la claridad de interfaz entre equipos es el predictor más citado de fricción interdepartamental.',
      },
      autonomia: {
        narrative: `${P}Dar el "qué" y soltar el "cómo": empezar a delegar sin controlar el método.`,
        steps: ['Definir el resultado esperado, no el método', 'Delegar una decisión sin pedir revisión previa'],
        suggestedProduct: { label: 'Ajustar tu delegación', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'ALTA',
        evidencia: '"Empodera, no microgestiona" es de los comportamientos top de gerentes efectivos en Project Oxygen.',
      },
      ambiente_fisico: {
        narrative: `${P}Resolver rápido y barato lo que molesta del espacio.`,
        steps: ['Preguntar qué incomoda del espacio (luz, ruido, silla)', 'Resolver de inmediato lo que sea barato'],
        suggestedProduct: { label: 'Arreglos rápidos del espacio', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA',
        evidencia: 'Parte del tier de recursos del Q12; consenso de práctica, sin cifra aislada del componente físico.',
      },
      herramientas: {
        narrative: `${P}Levantar y desbloquear lo básico que frena el día a día.`,
        steps: ['Listar los bloqueos técnicos del día a día', 'Habilitar los accesos que faltan'],
        suggestedProduct: { label: 'Desbloquear herramientas', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'ALTA',
        evidencia: 'Item fundacional #2 del Gallup Q12 ("tengo los materiales y equipo que necesito"), de validación predictiva robusta.',
      },
      cohesion_equipo: {
        narrative: `${P}Crear instancias de equipo con un propósito concreto, no genéricas.`,
        steps: ['Hacer una actividad breve orientada a un objetivo real del equipo', 'Evitar el team-building genérico sin foco'],
        suggestedProduct: { label: 'Ajustar rituales de equipo', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'El proxy de cohesión del Q12 correlaciona con equipos más comprometidos (Gallup).',
      },
      flexibilidad: {
        narrative: `${P}Dar flexibilidad puntual, enfocando en el resultado y no en la hora.`,
        steps: ['Enfocar en el resultado, no en la hora de conexión', 'Permitir ajustes puntuales de horario'],
        suggestedProduct: { label: 'Ajustar la flexibilidad', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'ALTA',
        evidencia: 'Casos documentados: Dell reportó ~15% menos rotación con modelo flexible; HBS, +30% en satisfacción/productividad reportada.',
      },
    },
    naranja: {
      autonomia: {
        narrative: `${P}Marco claro de qué se decide solo y qué se consulta, con seguimiento.`,
        steps: ['Acordar qué requiere permiso y qué solo aviso', 'Medir cuántas decisiones se delegan de verdad'],
        suggestedProduct: { label: 'Meta de autonomía del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'La autonomía real se ve en decisiones delegadas, no en el discurso de confianza.',
      },
      ambiente_fisico: {
        narrative: `${P}Un plan de mejoras del espacio con presupuesto acotado y responsable.`,
        steps: ['Priorizar las mejoras por impacto', 'Asignar presupuesto y un responsable'],
        suggestedProduct: { label: 'Meta de mejora del espacio', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA',
        evidencia: 'Un plan priorizado con dueño evita que las mejoras físicas queden en buenas intenciones.',
      },
      herramientas: {
        narrative: `${P}Resolver bloqueos de forma seguida y con métrica de tiempo.`,
        steps: ['Abrir un canal para reportar herramientas faltantes', 'Medir el tiempo de resolución'],
        suggestedProduct: { label: 'Meta de herramientas del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Lo que se mide (tiempo de desbloqueo) es lo que deja de acumularse como fricción.',
      },
      cohesion_equipo: {
        narrative: `${P}Instalar rituales de equipo sostenidos y medir la pertenencia.`,
        steps: ['Instalar rituales regulares de colaboración', 'Medir si el equipo se siente parte'],
        suggestedProduct: { label: 'Meta de cohesión del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'La cohesión se sostiene con rituales repetidos, no con un evento único.',
      },
      flexibilidad: {
        narrative: `${P}Definir horas núcleo de colaboración y dejar el resto flexible y medible.`,
        steps: ['Definir horas de colaboración protegidas', 'Dejar el resto flexible sobre la base de resultados'],
        suggestedProduct: { label: 'Meta de flexibilidad del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'El modelo de horas núcleo + resto flexible es el estándar que sostiene flexibilidad sin perder coordinación.',
      },
    },
    roja: {
      autonomia: {
        narrative: `${P}Microgestión estructural o desconfianza: el experto opera como novato. Ahogar el criterio propio garantiza la salida de quienes sí rinden.`,
        steps: ['El líder se retira de la ejecución diaria de los perfiles capaces', 'Entregar autonomía total sobre el "cómo" y sostenerla aunque haya un error'],
        suggestedProduct: { label: 'Meta dura de descentralización', target: 'META_DURA', qualifier: 'Descentralizar decisiones' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = microgestión/desconfianza estructural. (Reactivo quizá pertenece a Liderazgo — auditoría §3.)',
      },
      ambiente_fisico: {
        narrative: `${P}Hay condiciones físicas deficientes reales que afectan salud o seguridad: un espacio que daña no se gestiona con encuestas, se corrige.`,
        steps: ['Escalar la deficiencia física concreta a quien puede invertir', 'Corregir primero lo que afecta salud o seguridad'],
        suggestedProduct: { label: 'Meta dura de corrección del espacio', target: 'META_DURA', qualifier: 'Corrección del espacio' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA',
        evidencia: 'Barrera = condición física real; requiere inversión y corrección, no diagnóstico.',
      },
      herramientas: {
        narrative: `${P}Falta inversión real y se compensa con esfuerzo humano que no escala: pedir resultados con herramientas que frenan es financiar el desgaste.`,
        steps: ['Escalar la compra de la herramienta bloqueante a quien controla el presupuesto', 'Suspender las metas que dependen de esa capacidad hasta resolverla'],
        suggestedProduct: { label: 'Meta dura de inversión en herramientas', target: 'META_DURA', qualifier: 'Inversión en herramientas' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = falta de inversión; se resuelve comprando la capacidad, no exigiendo más esfuerzo.',
      },
      cohesion_equipo: {
        narrative: `${P}Hay quiebre o subgrupos enfrentados: un equipo roto no se une con una actividad, se repara con una conversación.`,
        steps: ['Nombrar y mediar el quiebre entre las partes', 'Reconstruir acuerdos mínimos de convivencia'],
        suggestedProduct: { label: 'Meta dura de reparación', target: 'META_DURA', qualifier: 'Reparar el equipo' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Barrera = fractura del equipo; requiere mediación, no actividades. (Reactivo doble-barril, revisar.)',
      },
      flexibilidad: {
        narrative: `${P}Rigidez estructural o desconfianza: se exige presencia sin razón y la gente se agota o se va. Exigir presencia sin sentido cuesta talento, no lo protege.`,
        steps: ['Eliminar la exigencia de horario que no aporta al resultado', 'Formalizar por escrito el modelo flexible'],
        suggestedProduct: { label: 'Meta dura de modelo flexible', target: 'META_DURA', qualifier: 'Modelo flexible formal' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Barrera = rigidez/desconfianza; se corrige quitando la exigencia sin sentido y formalizando el modelo.',
      },
    },
  },
  satisfaccion: {
    amarilla: {
      carga_trabajo: {
        narrative: `${P}Mirar la carga antes de que reviente y aliviar los picos.`,
        steps: ['Revisar quién está más cargado', 'Redistribuir un pico puntual de trabajo'],
        suggestedProduct: { label: 'Ajustar la carga', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'ALTA',
        evidencia: 'Pilar de los marcos de prevención de burnout (Demandas-Recursos); consenso robusto multi-fuente.',
      },
      seguridad: {
        narrative: `${P}Comunicar temprano la situación del negocio, antes de que corran rumores.`,
        steps: ['Informar el estado real antes de que surjan rumores', 'Responder dudas sobre estabilidad de frente'],
        suggestedProduct: { label: 'Ajustar tu comunicación', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Evidencia consistente: la comunicación transparente reduce la inseguridad laboral percibida.',
      },
      preocupacion_empresa: {
        narrative: `${P}Mostrar la preocupación en un gesto concreto del jefe, no en un discurso.`,
        steps: ['Actuar sobre una necesidad real de bienestar del equipo', 'Evitar quedarse en la declaración de intenciones'],
        suggestedProduct: { label: 'Ajustar tu gestión', target: 'PDI_CLIMA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'El "nos importas" se vuelve creíble en hechos concretos, no en comunicados.',
      },
      energia: {
        narrative: `${P}Proteger algo de recuperación real y alinear tareas a lo que cada uno hace mejor.`,
        steps: ['Cuidar tiempo sin reuniones ni interrupciones', 'Alinear tareas con las fortalezas de cada persona'],
        suggestedProduct: { label: 'Ajustar el ritmo del equipo', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Recuperación protegida + trabajar desde las fortalezas, respaldado por marcos de prevención de burnout.',
      },
      estres: {
        narrative: `${P}Instalar límites básicos de desconexión, modelados primero por el jefe.`,
        steps: ['Respetar el horario de desconexión, empezando por el líder', 'Revisar los picos de carga del equipo'],
        suggestedProduct: { label: 'Ajustar límites del equipo', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'El estrés crónico responde a límites y rediseño de carga, no a bienestar aislado.',
      },
    },
    naranja: {
      carga_trabajo: {
        narrative: `${P}Visibilidad continua de la carga del área y freno a los plazos irreales.`,
        steps: ['Seguir la carga del equipo con regularidad', 'Cuestionar plazos poco realistas antes de aceptarlos'],
        suggestedProduct: { label: 'Meta de carga del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Sin visibilidad continua, la sobrecarga se detecta recién cuando ya causó daño.',
      },
      seguridad: {
        narrative: `${P}Comunicación regular y transparente sobre el rumbo, con lectura de percepción.`,
        steps: ['Fijar una cadencia de información sobre el negocio', 'Medir la percepción de estabilidad'],
        suggestedProduct: { label: 'Meta de transparencia del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'La sensación de seguridad sigue a la información oportuna y sostenida sobre el negocio.',
      },
      preocupacion_empresa: {
        narrative: `${P}Involucrar a las personas en las decisiones que las afectan, no solo comunicarlas después.`,
        steps: ['Consultar antes de decidir cambios que los tocan', 'Mostrar cómo su opinión influyó en la decisión'],
        suggestedProduct: { label: 'Meta de bienestar del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Las intervenciones participativas en cambios organizacionales dan mejores resultados de bienestar que la comunicación unidireccional.',
      },
      energia: {
        narrative: `${P}Normas de equipo sobre recuperación y foco, con seguimiento del ritmo.`,
        steps: ['Acordar límites de disponibilidad fuera de horario', 'Medir la sostenibilidad del ritmo de trabajo'],
        suggestedProduct: { label: 'Meta de energía del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'La energía se sostiene con normas de equipo explícitas, no con buena intención individual.',
      },
      estres: {
        narrative: `${P}Límites explícitos de disponibilidad del área, con medición de carga.`,
        steps: ['Acordar reglas de disponibilidad fuera de horario', 'Medir la carga y el respeto de esos límites'],
        suggestedProduct: { label: 'Meta de carga del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Los límites acordados y medidos sostienen la baja de estrés mejor que las buenas intenciones.',
      },
    },
    roja: {
      carga_trabajo: {
        narrative: `${P}La sobrecarga es estructural y real, no percepción: cuando la carga es real, la única salida es sacar trabajo, no organizarlo mejor.`,
        steps: ['Recortar o repriorizar entregables de forma explícita', 'Reforzar el equipo o frenar demanda antes de exigir más'],
        suggestedProduct: { label: 'Meta dura de rediseño de carga', target: 'META_DURA', qualifier: 'Rediseño de carga' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = sobrecarga estructural; se resuelve sacando trabajo, no gestionándolo mejor. (Doble-barril, revisar.)',
      },
      seguridad: {
        narrative: `${P}Hay miedo real y el miedo no se calma con silencio: se calma con verdad y con protección concreta.`,
        steps: ['Enfrentar de frente la fuente del miedo (situación del negocio o riesgo del ambiente)', 'Comprometer y demostrar una protección concreta'],
        suggestedProduct: { label: 'Meta dura de seguridad del entorno', target: 'META_DURA', qualifier: 'Seguridad del entorno' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = miedo real. OJO: reactivo ambiguo (laboral vs físico) — confirmar cuál mide antes de mostrar; la acción cambia según la lectura.',
      },
      preocupacion_empresa: {
        narrative: `${P}El cinismo está instalado y ya nadie cree en el discurso de bienestar: cuando el "nos importas" perdió credibilidad, solo los hechos la recuperan.`,
        steps: ['Reparar de forma visible un caso concreto donde la empresa falló al bienestar', 'Involucrar de verdad al equipo en la solución'],
        suggestedProduct: { label: 'Meta dura de bienestar', target: 'META_DURA', qualifier: 'Bienestar con hechos' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = cinismo por incumplimiento; se revierte reparando un caso real, no repitiendo el mensaje.',
      },
      energia: {
        narrative: `${P}Hay desgaste profundo instalado y riesgo de fuga o burnout: la energía agotada no se recarga con una pausa, exige cambiar el ritmo de fondo.`,
        steps: ['Frenar la fuente real del desgaste, no ofrecer un respiro cosmético', 'Redistribuir para bajar la exigencia sostenida'],
        suggestedProduct: { label: 'Meta dura de recuperación', target: 'META_DURA', qualifier: 'Recuperación real' },
        esfuerzo: 'ALTO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Barrera = desgaste profundo. OJO: doble-barril + candidato a exclusión circular — puede no disparar card propia si se excluye.',
      },
      estres: {
        narrative: `${P}Hay estrés crónico de fondo: un programa de bienestar aislado no revierte sobrecarga estructural. El estrés crónico responde a menos carga, no a más talleres.`,
        steps: ['Intervenir la causa estructural: carga, plazos, dotación', 'Frenar de inmediato lo que empuja fuera de horario'],
        suggestedProduct: { label: 'Meta dura de rediseño de carga', target: 'META_DURA', qualifier: 'Rediseño de carga' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = estrés crónico estructural; se ataca la carga/plazos, no con talleres de bienestar.',
      },
    },
  },
  reconocimiento: {
    amarilla: {
      mejora: {
        narrative: `${P}Dar feedback concreto y hacia adelante, no un elogio genérico ni un reproche.`,
        steps: ['En vez de señalar el error pasado, indicar el próximo paso a mejorar', 'Dar feedback específico, no genérico'],
        suggestedProduct: { label: 'Ajustar tu 1:1', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'ALTA',
        evidencia: '"Ser buen coach" es el comportamiento #1 de gerentes efectivos en Project Oxygen (2008 y 2018). Técnica Feedforward.',
      },
    },
    naranja: {
      mejora: {
        narrative: `${P}Coaching 1:1 con cadencia y seguimiento de la mejora en el tiempo.`,
        steps: ['Sostener un coaching quincenal con preguntas abiertas', 'Seguir la mejora concreta a lo largo del tiempo'],
        suggestedProduct: { label: 'Meta de coaching del área', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'El coaching sostenido con cadencia supera al feedback esporádico en efecto sobre desempeño.',
      },
    },
    roja: {
      mejora: {
        narrative: `${P}El feedback se vive como reproche y la persona se cierra: donde el feedback dolió, se recibe como ataque, no como ayuda.`,
        steps: ['Cambiar el foco del error pasado al próximo ciclo: qué hacer, no qué falló', 'Reconstruir la confianza antes de corregir'],
        suggestedProduct: { label: 'Meta dura de coaching', target: 'META_DURA', qualifier: 'Coaching de desarrollo' },
        esfuerzo: 'MEDIO', efectividad: 'ALTA',
        evidencia: 'Barrera = feedback vivido como ataque; primero confianza, después corrección. (Mide coaching, no elogio.)',
      },
    },
  },
  compensaciones: {
    amarilla: {
      beneficios: {
        narrative: `${P}Hacer visible el valor real de beneficios que hoy no se perciben.`,
        steps: ['Mostrar el valor monetario de beneficios hoy invisibles', 'Explicar lo que no se ve en el líquido'],
        suggestedProduct: { label: 'Comunicar compensación total', target: 'PDI_CLIMA' },
        esfuerzo: 'BAJO', efectividad: 'MEDIA_ALTA',
        evidencia: 'Hallazgo del "sueldo oculto": las personas subestiman sus beneficios cuando no se comunican; el problema suele ser de comunicación, no de paquete.',
      },
    },
    naranja: {
      beneficios: {
        narrative: `${P}Comunicación estructurada de la compensación total, con lectura de satisfacción.`,
        steps: ['Entregar un resumen de compensación total por persona', 'Medir la satisfacción con la comunicación, no solo con el paquete'],
        suggestedProduct: { label: 'Meta de compensación total', target: 'META_AREA' },
        esfuerzo: 'MEDIO', efectividad: 'MEDIA_ALTA',
        evidencia: 'La satisfacción con beneficios sube al comunicar su valor total, no solo el sueldo.',
      },
    },
    roja: {
      beneficios: {
        narrative: `${P}El paquete real es insuficiente o se percibe inequitativo: ninguna comunicación arregla un beneficio que de verdad no alcanza.`,
        steps: ['Revisar la equidad real del paquete frente al mercado', 'Escalar la corrección a quien define las compensaciones'],
        suggestedProduct: { label: 'Meta dura de revisión de compensaciones', target: 'META_DURA', qualifier: 'Revisión de compensaciones' },
        esfuerzo: 'ALTO', efectividad: 'ALTA',
        evidencia: 'Barrera = paquete real insuficiente/inequitativo; requiere revisar el paquete, no solo comunicarlo.',
      },
    },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// Lookup — selecciona la celda (dimensión × zona × reactivo-palanca). null si la
// categoría no es una de las 8 dimensiones del banco (el builder decide; no revienta).
// ════════════════════════════════════════════════════════════════════════════

export interface InterventionSelection {
  /**
   * Celda elegida. `ClimaInterventionVariantCell` (shape rico, con `target`) si hubo
   * variante Capa 2 para el reactivo-palanca; `ClimaInterventionCell` (base 32, string)
   * en el default. El caller (builder) ramifica por shape al empacar.
   */
  cell: ClimaInterventionCell | ClimaInterventionVariantCell;
  /** Reactivo-palanca elegido (null = sin contexto → celda por defecto). */
  selectedReactive: string | null;
}

export function isClimaDriverCategory(
  category: string
): category is ClimaDriverCategory {
  return (CLIMA_DRIVER_CATEGORIES as readonly string[]).includes(category);
}

/**
 * ⚠️ LEGACY FAV-BASED — usa el gap de FAVORABILIDAD (r.gap = fav − 75), NO el mean.
 * Reactivo-palanca = mayor |impact|×|gap-fav| (mismo priority que buildDriverAnalysis).
 *
 * NO usar en callers nuevos. La capa de acción decide por MEAN (priorityMean =
 * |impact|×|gapMean|, ver ClimaActionPlanBuilder). Todo caller nuevo DEBE pasar
 * `leverOverride` a getIntervention con el reactivo mean-based ya elegido — si no lo
 * pasa, getIntervention cae acá y el reactivo que se NARRA puede diferir del que
 * DISPARÓ (fav vs mean), reintroduciendo exactamente la divergencia que este gate
 * (Severidad reactivo+mean, 2026-07-12) resolvió. Se conserva solo por retrocompatibilidad.
 */
function pickLeverReactive(reactiveContext: ReactiveContextEntry[]): string | null {
  let best: string | null = null;
  let bestPriority = -1;
  for (const r of reactiveContext) {
    if (r.impact === null || r.gap === null) continue;
    const priority = Math.abs(r.impact) * Math.abs(r.gap);
    if (priority > bestPriority) {
      bestPriority = priority;
      best = r.reactive;
    }
  }
  return best;
}

export function getIntervention(
  category: string,
  zone: RiskZone,
  reactiveContext?: ReactiveContextEntry[],
  /**
   * Reactivo-palanca pre-elegido por el caller (Cluster A lo elige por priorityMean =
   * |impact|×|gapMean|). Si se pasa (aunque sea null) tiene precedencia sobre el
   * `pickLeverReactive` fav-based interno → así la severidad que dispara y la variante
   * narrativa hablan del MISMO reactivo. Ausente (undefined) = comportamiento legacy
   * (elige por fav) — retrocompatible.
   */
  leverOverride?: string | null
): InterventionSelection | null {
  if (!isClimaDriverCategory(category)) return null;
  const base = CLIMA_INTERVENTION_DICTIONARY[category][zone];
  const selectedReactive =
    leverOverride !== undefined
      ? leverOverride
      : reactiveContext && reactiveContext.length > 0
        ? pickLeverReactive(reactiveContext)
        : null;
  const variant =
    selectedReactive !== null
      ? CLIMA_INTERVENTION_VARIANTS[category]?.[zone]?.[selectedReactive]
      : undefined;
  return { cell: variant ?? base, selectedReactive };
}

// ════════════════════════════════════════════════════════════════════════════
// Escalamiento sistémico — cuando ≥REACTIVE_SYSTEMIC_RATIO de los reactivos de una
// dimensión caen bajo su tier, el problema deja de ser puntual.
//
// 8 narrativas ESPECÍFICAS por dimensión (el sistema ya sabe cuál disparó: `category`
// llega como parámetro) + FALLBACK genérico obligatorio. El fallback no es cosmético:
// garantiza que nunca falte narrativa cuando `category` no matchea ninguna de las 8
// —hoy no puede pasar, pero un refactor del banco que renombre/divida/agregue una
// dimensión lo haría posible sin tocar este archivo—.
//
// `target: 'SIN_CTA'` en las 9: no existe todavía un mecanismo real de "activar
// conversación con Personas", así que no se pinta un CTA que no lleva a ninguna parte.
// Mismo criterio que el resto de los casos sin mecanismo activable.
//
// Contenido PROVISIONAL (prefijo `P`) — mismo régimen que el resto del diccionario.
// ════════════════════════════════════════════════════════════════════════════

/** Placeholders de la narrativa sistémica: `{n}` → nBelow, `{total}` → totalMeasured. */
const SYSTEMIC_INTERVENTIONS: Record<ClimaDriverCategory, ClimaSystemicCell> = {
  liderazgo: {
    narrative: `${P}Fallaron {n} de las {total} preguntas sobre la jefatura directa. Una charla aislada no funciona acá; la caída en confianza debilita al equipo y requiere armar un trabajo de fondo con tu equipo de Personas.`,
    steps: [
      'Diseño de un programa de coaching para el líder, con seguimiento en el tiempo.',
      'Revisión de expectativas de trabajo conjunto, dejando de lado las soluciones de un clic.',
    ],
    suggestedProduct: { label: 'Programa de coaching continuo', target: 'SIN_CTA' },
  },

  // "Crecimiento Profesional / Proyección"
  desarrollo: {
    narrative: `${P}Hay {n} de {total} preguntas mal evaluadas sobre el futuro del equipo. La gente se queda casi el doble de tiempo si tiene un avance real; retenerlos requiere armar un plan medible con tu equipo de Personas, no un curso suelto.`,
    steps: [
      'Creación de un sistema de desarrollo con hitos medibles.',
      'Definición de un camino de ascenso claro y tangible junto a la jefatura.',
    ],
    suggestedProduct: { label: 'Sistema de desarrollo medible', target: 'SIN_CTA' },
  },

  // "Aprender Cosas Nuevas"
  crecimiento: {
    narrative: `${P}El equipo evaluó mal {n} de {total} preguntas sobre sus oportunidades de aprendizaje. Como pasa con la proyección, la retención cae a la mitad sin evolución real; esto pide definir desafíos nuevos aplicables, más allá de asignar una capacitación rápida.`,
    steps: [
      'Estructuración de desafíos reales dentro del puesto actual.',
      'Integración de mentores o metas de aprendizaje en la rutina de trabajo.',
    ],
    suggestedProduct: { label: 'Plan de desafíos reales', target: 'SIN_CTA' },
  },

  comunicacion: {
    narrative: `${P}Cayeron {n} de las {total} preguntas sobre cómo se colabora. Pedirles que 'se comuniquen mejor' casi nunca funciona; la fricción suele nacer porque cada área compite por metas distintas, lo que requiere definir un norte común.`,
    steps: [
      'Análisis de los indicadores actuales para detectar si los equipos compiten entre sí.',
      'Creación de una meta compartida y medible entre las áreas con fricción.',
    ],
    suggestedProduct: { label: 'Meta compartida entre áreas', target: 'SIN_CTA' },
  },

  autonomia: {
    narrative: `${P}Se evaluaron mal {n} de {total} preguntas sobre la autonomía del equipo. Cuando hay tanto exceso de control, rara vez es solo estilo personal; o hay presión desde arriba por metas rígidas, o la estructura empuja a todos a controlar de más. Destrabarlo requiere revisar la jerarquía de fondo.`,
    steps: [
      'Revisión de las metas estrictas que empujan el exceso de control diario.',
      'Conversación para devolver capacidad de decisión al equipo, revisando la presión superior.',
    ],
    suggestedProduct: { label: 'Revisión de metas y autonomía', target: 'SIN_CTA' },
  },

  // "Bienestar General"
  satisfaccion: {
    narrative: `${P}El desgaste es general: {n} de {total} preguntas sobre carga y estrés están mal. La evidencia demuestra que intentar aliviar a una sola persona tiene muy poco impacto real; frenar el agotamiento pide un cambio a nivel de todo el equipo junto a tu equipo de Personas.`,
    steps: [
      'Análisis de la carga de trabajo y el desgaste a nivel de grupo, no individual.',
      'Ajuste estructural en las rutinas de trabajo para el equipo completo.',
    ],
    suggestedProduct: { label: 'Cambio de rutina a nivel equipo', target: 'SIN_CTA' },
  },

  // Hoy inalcanzable: 1 solo reactivo (`mejora`), no llega al piso de 3 medidos.
  // Se deja escrito para no repetir el trabajo cuando el banco se rediseñe.
  reconocimiento: {
    narrative: `${P}Hay {n} de {total} preguntas mal evaluadas sobre cómo se valora el trabajo. Cuando esto falla de forma amplia, rara vez es por mala intención; pasa porque depende del hábito de cada jefe, generando diferencias. Nivelar esta percepción pide estructurar un sistema con criterios claros junto a tu equipo de Personas, no solo pedir que feliciten más seguido.`,
    steps: [
      'Definición de criterios transparentes y consistentes para valorar el buen desempeño.',
      'Creación de un sistema de reconocimiento oficial, evitando el uso de rankings públicos que puedan generar fricción.',
    ],
    suggestedProduct: { label: 'Sistema de reconocimiento estructurado', target: 'SIN_CTA' },
  },

  // Hoy inalcanzable: 1 solo reactivo (`beneficios`), no llega al piso de 3 medidos.
  // Se deja escrito para no repetir el trabajo cuando el banco se rediseñe.
  compensaciones: {
    narrative: `${P}El equipo evaluó mal {n} de las {total} preguntas sobre su sueldo. La evidencia confirma que explicar claramente cómo se define el pago impacta tanto o más en la satisfacción que el monto mismo; mejorar esto requiere transparentar las políticas con tu equipo de Personas, no prometer aumentos inmediatos.`,
    steps: [
      'Revisión y consolidación de las bandas salariales y los criterios de compensación actuales.',
      'Comunicación clara al equipo sobre cómo y bajo qué políticas se toman las decisiones de sueldo.',
    ],
    suggestedProduct: { label: 'Transparencia en política salarial', target: 'SIN_CTA' },
  },
};

/**
 * Red de seguridad: `category` fuera de las 8 (renombre/split/alta futura del banco).
 * Conserva TAL CUAL el texto genérico que servía a todas las dimensiones antes de este
 * gate — no se borra, se degrada a último recurso.
 */
function getSystemicFallback(
  category: string,
  nBelow: number,
  totalMeasured: number
): ClimaSystemicCell {
  return {
    narrative: `${P}${nBelow} de ${totalMeasured} reactivos de ${category} están bajo el umbral en tu equipo. Este no es un problema puntual. Es un patrón que cruza varios frentes a la vez. Conversación recomendada: revisar con RRHH antes de actuar solo.`,
    steps: [
      'Revisar el patrón completo de la dimensión con RRHH antes de actuar reactivo por reactivo',
      'Definir una intervención a nivel de dimensión, no parche por parche',
    ],
    suggestedProduct: { label: 'Revisar con RRHH', target: 'SIN_CTA' },
  };
}

/** Interpola los placeholders de la narrativa sistémica. */
function interpolateSystemic(
  narrative: string,
  nBelow: number,
  totalMeasured: number
): string {
  return narrative
    .replace(/\{n\}/g, String(nBelow))
    .replace(/\{total\}/g, String(totalMeasured));
}

/**
 * Celda del caso sistémico. `category` de las 8 → narrativa específica; cualquier otra
 * → fallback genérico. NUNCA retorna undefined ni lanza.
 */
export function getSystemicIntervention(
  category: string,
  nBelow: number,
  totalMeasured: number
): ClimaSystemicCell {
  if (!isClimaDriverCategory(category)) {
    return getSystemicFallback(category, nBelow, totalMeasured);
  }
  const cell = SYSTEMIC_INTERVENTIONS[category];
  return {
    ...cell,
    narrative: interpolateSystemic(cell.narrative, nBelow, totalMeasured),
  };
}
