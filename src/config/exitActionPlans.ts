// src/config/exitActionPlans.ts
// ═══════════════════════════════════════════════════════════════════════════════
// EXIT ACTION PLANS - Configuración de planes de acción por tipo de alerta
// ═══════════════════════════════════════════════════════════════════════════════
// Archivo: /src/config/exitActionPlans.ts
// Propósito: Planes de acción y quick picks para ResolutionPanel
// Separación: exitAlertConfig.ts define CÓMO SE VE, este archivo define QUÉ HACER
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Estos planes se muestran en ResolutionPanel cuando un usuario
 * gestiona una alerta Exit. Incluyen:
 * - Pasos sugeridos (guía para el gerente)
 * - Quick picks (opciones rápidas de resolución)
 * - Contexto explicativo
 * - SLA y días de seguimiento
 * 
 * @version 1.0
 * @date Diciembre 2025
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ActionStep {
  paso: number;
  titulo: string;
  accion: string;
  responsable: string;
  validacion: string;
  deadline?: string;              // Tiempo sugerido para completar el paso
  suggestedProduct?: string;      // Key de producto FocalizaHR (ambiente_sano, pulso_express, isd)
}

export interface ExitActionPlan {
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  slaHours: number;
  context: string;
  philosophy?: string;            // Frase guía para el gerente
  steps: ActionStep[];
  quickPicks: string[];
  followUpDays: number;
  escalationCriteria?: string[];  // Cuándo escalar
  successMetrics?: string[];      // Cómo medir éxito
}

export type ExitAlertType = 
  | 'ley_karin'
  | 'toxic_exit'
  | 'nps_critico'
  | 'liderazgo_concentracion'
  | 'department_pattern'
  | 'onboarding_correlation';

// ═══════════════════════════════════════════════════════════════════════════════
// PLANES DE ACCIÓN POR TIPO DE ALERTA
// ═══════════════════════════════════════════════════════════════════════════════

export const EXIT_ACTION_PLANS: Record<ExitAlertType, ExitActionPlan> = {
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 🔴 LEY KARIN (P6 < 2.5) - CRITICAL
  // ─────────────────────────────────────────────────────────────────────────────
  ley_karin: {
    title: 'Señal de Ambiente (Trato/Seguridad)',
    severity: 'CRITICAL',
    slaHours: 24,
    context: `Una persona indicó que no percibió un ambiente seguro.
Esto es un INDICIO, no una acusación. Tu rol es VERIFICAR
si hay algo más, no juzgar ni actuar precipitadamente.`,
    philosophy: 'No estamos juzgando. Estamos verificando para proteger.',
    steps: [
      {
        paso: 1,
        titulo: 'REVISAR DATOS DEL SISTEMA',
        accion: 'Antes de salir a terreno, revisa en FocalizaHR: ¿Hay otros Exit con P6 bajo en este departamento? ¿El EXO del área está bajo? ¿Hay alertas onboarding sin gestionar?',
        responsable: 'Tú (Gerente)',
        validacion: 'Tengo claridad si es señal aislada o patrón',
        deadline: 'Mismo día'
      },
      {
        paso: 2,
        titulo: 'OBSERVACIÓN DISCRETA',
        accion: 'Si hay más señales, pasa tiempo con el equipo. Observa sin alarmar: ¿Hay tensión? ¿Silencios? ¿Alguien evita a alguien?',
        responsable: 'Tú (Gerente)',
        validacion: 'Observé el ambiente sin generar ruido',
        deadline: '1-2 días'
      },
      {
        paso: 3,
        titulo: 'CONVERSACIÓN DE CONFIANZA',
        accion: "Habla informalmente con 1-2 personas de confianza del equipo. Pregunta abierto: '¿Cómo sientes el ambiente últimamente?'",
        responsable: 'Tú (Gerente)',
        validacion: 'Tengo perspectiva adicional del clima',
        deadline: '2-3 días'
      },
      {
        paso: 4,
        titulo: 'ESCALAR SI HAY PATRÓN',
        accion: 'Si confirmas que hay algo, solicita a Gerencia de Personas desplegar Ambiente Sano o ISD Departamental. Si no hay nada más, registra y monitorea.',
        responsable: 'Gerencia de Personas',
        validacion: 'Decisión tomada: escalar o monitorear',
        deadline: 'Antes del SLA (24h)',
        suggestedProduct: 'ambiente_sano'
      }
    ],
    quickPicks: [
      'Revisé datos en FocalizaHR y no hay más señales → Registro y monitoreo',
      'Revisé datos y SÍ hay patrón → Observé el ambiente en terreno',
      'Tuve conversaciones informales para validar el clima',
      'Solicité a Personas desplegar Ambiente Sano',
      'Solicité ISD Departamental para diagnóstico profundo'
    ],
    followUpDays: 10,
    escalationCriteria: [
      'Ambiente Sano confirma scores críticos (<2.0)',
      'Surge denuncia formal durante la investigación',
      'Nuevas salidas mencionan mismos factores'
    ],
    successMetrics: [
      'Score seguridad psicológica sube a >3.5',
      'Cero denuncias formales en 6 meses',
      'Rotación del área controlada'
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 🟠 TOXIC EXIT (EIS < 25) - HIGH
  // ─────────────────────────────────────────────────────────────────────────────
  toxic_exit: {
    title: 'Experiencia de Salida Negativa',
    severity: 'HIGH',
    slaHours: 48,
    context: `El EIS acumulado indica experiencias de salida muy negativas.
Esto NO significa que el equipo actual esté mal, pero
es una señal para verificar y prevenir.`,
    philosophy: 'Esta salida ya ocurrió. Pero podemos evitar las siguientes.',
    steps: [
      {
        paso: 1,
        titulo: 'ANALIZAR LOS FACTORES',
        accion: 'Revisa en FocalizaHR qué factores mencionaron (Liderazgo, Desarrollo, Compensación, etc.). ¿Hay un factor repetido?',
        responsable: 'Tú (Gerente)',
        validacion: 'Identifico qué factores son recurrentes',
        deadline: '1-2 días'
      },
      {
        paso: 2,
        titulo: 'CHEQUEAR AL EQUIPO ACTUAL',
        accion: "Conversa con 2-3 personas clave del equipo. No menciones los exits, pregunta: '¿Cómo están? ¿Qué les preocupa?'",
        responsable: 'Tú (Gerente)',
        validacion: 'Tengo pulso informal del equipo actual',
        deadline: '3-5 días'
      },
      {
        paso: 3,
        titulo: 'PROTEGER TALENTO CLAVE',
        accion: 'Identifica a tus top performers. Asegúrate de que estén bien. Una salida tóxica puede contagiar a los buenos.',
        responsable: 'Tú (Gerente)',
        validacion: 'Talento clave está contenido',
        deadline: '1 semana'
      },
      {
        paso: 4,
        titulo: 'SOLICITAR DIAGNÓSTICO SI HAY DUDA',
        accion: 'Si el equipo muestra señales de desgaste, solicita a Personas un Pulso Express para tener mapa claro.',
        responsable: 'Gerencia de Personas',
        validacion: 'Diagnóstico solicitado o situación estable',
        deadline: 'Antes del SLA (48h)',
        suggestedProduct: 'pulso_express'
      }
    ],
    quickPicks: [
      'Analicé factores de salida → No hay patrón, solo casos aislados',
      'Analicé factores → Hay patrón en [factor específico]',
      'Conversé con el equipo y están bien → Monitoreo',
      'Conversé con el equipo y hay desgaste → Solicité Pulso Express',
      'Blindé a talento clave con conversaciones individuales'
    ],
    followUpDays: 14,
    escalationCriteria: [
      'Más de 1 renuncia adicional en 30 días',
      'Aparecen reviews negativos públicos (Glassdoor/LinkedIn)',
      'Top performers piden referencias'
    ],
    successMetrics: [
      'Cero salidas adicionales en 90 días',
      'Engagement del área mejora >10 puntos',
      'Top performers comprometidos y retenidos'
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 🟠 NPS CRÍTICO (eNPS < 3) - HIGH
  // ─────────────────────────────────────────────────────────────────────────────
  nps_critico: {
    title: 'Detractores en Salida',
    severity: 'HIGH',
    slaHours: 48,
    context: `Colaboradores salientes no nos recomiendan. Hay una brecha
entre expectativas y realidad. El riesgo es reputacional
(reviews negativos) y de atracción futura.`,
    philosophy: 'Convertir detractores en pasivos es más barato que reemplazarlos.',
    steps: [
      {
        paso: 1,
        titulo: 'ENTENDER LA BRECHA',
        accion: 'Revisa en FocalizaHR qué dijeron. ¿La decepción es por sueldo? ¿Por promesas incumplidas? ¿Por el jefe?',
        responsable: 'Tú (Gerente)',
        validacion: 'Identifico la causa raíz de la decepción',
        deadline: '1-2 días'
      },
      {
        paso: 2,
        titulo: 'VALIDAR CON EQUIPO ACTUAL',
        accion: "Pregunta a tu equipo actual: '¿Lo que les prometimos cuando entraron se cumplió?'. Busca la misma brecha.",
        responsable: 'Tú (Gerente)',
        validacion: 'Sé si la brecha también afecta a los actuales',
        deadline: '1 semana'
      },
      {
        paso: 3,
        titulo: 'SINCERAR O CORREGIR',
        accion: 'Si hay brecha real: corrige lo que puedas (carga, expectativas, desarrollo). Si es percepción: trabaja comunicación.',
        responsable: 'Tú (Gerente) + RRHH si aplica',
        validacion: 'Acción correctiva definida',
        deadline: '2 semanas'
      },
      {
        paso: 4,
        titulo: 'FEEDBACK A ATRACCIÓN',
        accion: "Si el problema viene desde la selección, habla con Personas: 'Estamos sobrevendiendo el cargo'.",
        responsable: 'Gerencia de Personas',
        validacion: 'Personas tiene el feedback para ajustar',
        deadline: 'Antes del SLA (48h)'
      }
    ],
    quickPicks: [
      'Identifiqué la brecha → Es tema de compensación, escalé a Personas',
      'Identifiqué la brecha → Es tema de expectativas, las sinceré con el equipo',
      'Validé con equipo actual y no hay brecha → Casos aislados',
      'Di feedback a Personas sobre el perfil de búsqueda',
      'Realicé actividad de reconocimiento para reforzar pertenencia'
    ],
    followUpDays: 30,
    escalationCriteria: [
      'NPS no mejora después de acciones',
      'Aparecen reviews negativos públicos',
      'Rotación del área supera 20%'
    ],
    successMetrics: [
      'eNPS del área sube a >0 en 90 días',
      'Cero reviews negativos nuevos',
      'Rotación controlada (<15%)'
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 🟡 PATRÓN LIDERAZGO (3+ salidas mismo factor) - MEDIUM
  // ─────────────────────────────────────────────────────────────────────────────
  liderazgo_concentracion: {
    title: 'Patrón en Liderazgo',
    severity: 'MEDIUM',
    slaHours: 72,
    context: `Tres o más personas mencionaron Liderazgo como factor de salida.
Esto YA es un patrón confirmado. Hay un estilo de dirección
que está generando rotación.`,
    philosophy: 'Un patrón identificado es una oportunidad. Ignorarlo es una decisión.',
    steps: [
      {
        paso: 1,
        titulo: 'VALIDAR EL PATRÓN',
        accion: 'Revisa los 3+ casos en FocalizaHR. ¿Es el mismo líder? ¿El mismo tipo de queja? Confirma que no es coincidencia.',
        responsable: 'Tú (Gerente de área o BP)',
        validacion: 'Patrón confirmado con evidencia',
        deadline: '1-2 días'
      },
      {
        paso: 2,
        titulo: 'FEEDBACK DIRECTO AL LÍDER',
        accion: "Siéntate con el líder. Muéstrale los datos sin juzgar: 'Tenemos 3 salidas que mencionan tu gestión. Quiero entender qué está pasando.'",
        responsable: 'Tú (Gerente o BP)',
        validacion: 'Líder tiene claridad del problema',
        deadline: '1 semana'
      },
      {
        paso: 3,
        titulo: 'PLAN DE CAMBIO CONCRETO',
        accion: "Acuerda 2 cambios de conducta específicos y medibles. Ejemplo: 'No interrumpir', 'Dar feedback en privado'. Monitorea.",
        responsable: 'Líder + Tú',
        validacion: 'Compromisos acordados y en seguimiento',
        deadline: '2 semanas'
      },
      {
        paso: 4,
        titulo: 'APOYO PROFESIONAL SI NO MEJORA',
        accion: 'Si en 30 días no hay cambio, solicita a Personas apoyo de Coach o evaluación 360° (ISD Departamental).',
        responsable: 'Gerencia de Personas',
        validacion: 'Intervención profesional activada',
        deadline: '30 días',
        suggestedProduct: 'isd'
      }
    ],
    quickPicks: [
      'Validé el patrón → Es real, involucra al mismo líder',
      'Di feedback directo al líder con los datos',
      'Acordamos cambios de conducta específicos',
      'Solicité a Personas apoyo de Coaching/360°',
      'El líder no tiene herramientas → Solicité ISD Departamental'
    ],
    followUpDays: 45,
    escalationCriteria: [
      'Líder no reconoce problema después de ver datos',
      'No implementa cambios después de coaching',
      'Rotación continúa o acelera'
    ],
    successMetrics: [
      'Cero salidas por liderazgo en próximos 6 meses',
      'Score de liderazgo del área sube a >3.5',
      'Equipo reporta mejora en clima'
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 🟡 PATRÓN DEPARTAMENTAL (Concentración anormal) - MEDIUM
  // ─────────────────────────────────────────────────────────────────────────────
  department_pattern: {
    title: 'Foco de Rotación Departamental',
    severity: 'MEDIUM',
    slaHours: 72,
    context: `Tu área tiene rotación anormalmente alta. Algo estructural
(condiciones, recursos, carga, clima) está fallando.
Necesitas diagnosticar antes de actuar.`,
    philosophy: 'Un área con rotación alta es un síntoma. Tu trabajo es encontrar la enfermedad.',
    steps: [
      {
        paso: 1,
        titulo: 'DIAGNOSTICAR CON DATOS',
        accion: 'Revisa en FocalizaHR: EIS del área, factores mencionados, EXO si hay, alertas históricas. Busca el patrón.',
        responsable: 'Tú (Gerente)',
        validacion: 'Tengo hipótesis de causa raíz',
        deadline: '1-2 días'
      },
      {
        paso: 2,
        titulo: 'ESCUCHA DIRECTA',
        accion: "Junta al equipo (sin mandos medios si es necesario). Pregunta: '¿Qué es lo más difícil de trabajar aquí hoy?'",
        responsable: 'Tú (Gerente)',
        validacion: 'Escuché sin filtro del equipo',
        deadline: '1 semana'
      },
      {
        paso: 3,
        titulo: 'QUICK WINS',
        accion: 'Identifica 1-2 cosas que puedas resolver rápido (recursos, condiciones, burocracia). Hazlas esta semana.',
        responsable: 'Tú (Gerente)',
        validacion: 'Quick win ejecutado y comunicado',
        deadline: '1 semana'
      },
      {
        paso: 4,
        titulo: 'DIAGNÓSTICO PROFUNDO SI PERSISTE',
        accion: 'Si el problema es estructural, solicita a Personas aplicar ISD (Inteligencia Departamental) para análisis completo.',
        responsable: 'Gerencia de Personas',
        validacion: 'ISD solicitado o problema resuelto',
        deadline: '2-3 semanas',
        suggestedProduct: 'isd'
      }
    ],
    quickPicks: [
      'Diagnostiqué con datos → Problema es de recursos/condiciones',
      'Diagnostiqué con datos → Problema es de liderazgo/clima',
      'Realicé sesión de escucha con el equipo',
      'Ejecuté quick wins (mejoras inmediatas)',
      'Solicité a Personas aplicar ISD Departamental'
    ],
    followUpDays: 30,
    escalationCriteria: [
      'Rotación continúa después de quick wins',
      'Diagnóstico revela problema estructural mayor',
      'Top performers solicitan referencias'
    ],
    successMetrics: [
      'Rotación del área baja a promedio empresa',
      'EIS del área mejora >15 puntos',
      'Equipo reporta mejoras concretas'
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 🟡 CORRELACIÓN ONBOARDING (Alertas ignoradas → Salida) - MEDIUM
  // ─────────────────────────────────────────────────────────────────────────────
  onboarding_correlation: {
    title: 'Oportunidad de Aprendizaje',
    severity: 'MEDIUM',
    slaHours: 72,
    context: `Esta salida PUDO HABERSE EVITADO. El sistema alertó durante
el onboarding y no actuamos. El objetivo no es buscar culpables,
es asegurar que no nos pase con los nuevos actuales.`,
    philosophy: 'No tiene sentido tener un sistema de alertas si nadie las gestiona.',
    steps: [
      {
        paso: 1,
        titulo: 'ENTENDER QUÉ FALLÓ',
        accion: '¿Por qué no se gestionaron las alertas? ¿Falta de tiempo? ¿No se vieron? Revisa las alertas que se ignoraron.',
        responsable: 'Tú + Buddy/Jefe del colaborador',
        validacion: 'Identifico el gap de proceso',
        deadline: '1-2 días'
      },
      {
        paso: 2,
        titulo: 'RESCATAR A LOS NUEVOS ACTUALES',
        accion: 'Revisa HOY quiénes entraron hace poco al área. ¿Tienen alertas activas? Gestiónalas AHORA.',
        responsable: 'Tú (Gerente)',
        validacion: 'Nuevos ingresos revisados y alertas gestionadas',
        deadline: 'Mismo día'
      },
      {
        paso: 3,
        titulo: 'AJUSTAR PROCESO',
        accion: 'Si el buddy/jefe no está gestionando alertas, habla con ellos. Aclara que es su responsabilidad.',
        responsable: 'Tú (Gerente)',
        validacion: 'Responsabilidades clarificadas',
        deadline: '1 semana'
      },
      {
        paso: 4,
        titulo: 'SOLICITAR APOYO SI HAY MUCHOS JOURNEYS',
        accion: 'Si tienes muchos ingresos y no das abasto, pide a Personas apoyo para monitorear Journeys críticos.',
        responsable: 'Gerencia de Personas',
        validacion: 'Apoyo solicitado o situación manejable',
        deadline: '2 semanas'
      }
    ],
    quickPicks: [
      'Identifiqué por qué no se gestionaron las alertas',
      'Revisé y gestioné alertas de los nuevos ingresos actuales',
      'Tuve conversación de accountability con el responsable',
      'Corregí el proceso de seguimiento de onboarding',
      'Solicité a Personas apoyo en Journeys críticos'
    ],
    followUpDays: 45,
    escalationCriteria: [
      'Tasa de alertas ignoradas no baja de 50%',
      'Gerentes argumentan que "no tienen tiempo"',
      'Nuevas salidas correlacionan con alertas ignoradas'
    ],
    successMetrics: [
      '% alertas gestionadas en SLA: >90%',
      'Correlación alertas ignoradas → exits: <30%',
      'Rotación primeros 90 días: -30%'
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Mapa de aliases para normalizar tipos de alerta
 * Keys: valores que pueden venir de la BD
 * Values: key normalizada en EXIT_ACTION_PLANS
 */
const ALERT_TYPE_ALIASES: Record<string, ExitAlertType> = {
  // Ley Karin
  'ley_karin': 'ley_karin',
  'ley_karin_indicios': 'ley_karin',
  
  // Toxic Exit
  'toxic_exit': 'toxic_exit',
  'toxic_exit_detected': 'toxic_exit',
  
  // NPS Crítico
  'nps_critico': 'nps_critico',
  'nps_critical': 'nps_critico',
  
  // Liderazgo/Factor concentrado
  'liderazgo_concentracion': 'liderazgo_concentracion',
  'concentrated_factor': 'liderazgo_concentracion',
  
  // Patrón departamental
  'department_pattern': 'department_pattern',
  'department_exit_pattern': 'department_pattern',
  
  // Correlación onboarding
  'onboarding_correlation': 'onboarding_correlation',
  'onboarding_exit_correlation': 'onboarding_correlation'
};

/**
 * Normaliza tipo de alerta a key canónica
 */
function normalizeAlertType(alertType: string): ExitAlertType | null {
  return ALERT_TYPE_ALIASES[alertType] || null;
}

/**
 * Obtener plan de acción por tipo de alerta
 * @param alertType - Tipo de alerta (puede ser key de BD o alias)
 * @returns Plan de acción o null si no existe
 */
export function getActionPlan(alertType: string): ExitActionPlan | null {
  const normalizedType = normalizeAlertType(alertType);
  if (!normalizedType) return null;
  return EXIT_ACTION_PLANS[normalizedType];
}

/**
 * Obtener quick picks por tipo de alerta
 * @param alertType - Tipo de alerta (puede ser key de BD o alias)
 * @returns Array de quick picks o array vacío
 */
export function getQuickPicks(alertType: string): string[] {
  const plan = getActionPlan(alertType);
  return plan?.quickPicks || [];
}

/**
 * Obtener días de seguimiento por tipo de alerta
 * @param alertType - Tipo de alerta
 * @returns Días de seguimiento (default: 30)
 */
export function getFollowUpDays(alertType: string): number {
  const plan = getActionPlan(alertType);
  return plan?.followUpDays || 30;
}

/**
 * Obtener SLA en horas por tipo de alerta
 * @param alertType - Tipo de alerta
 * @returns SLA en horas (default: 72)
 */
export function getSLAHours(alertType: string): number {
  const plan = getActionPlan(alertType);
  return plan?.slaHours || 72;
}

/**
 * Obtener contexto explicativo por tipo de alerta
 * @param alertType - Tipo de alerta
 * @returns Contexto o string vacío
 */
export function getActionContext(alertType: string): string {
  const plan = getActionPlan(alertType);
  return plan?.context || '';
}

/**
 * Obtener pasos del plan de acción
 * @param alertType - Tipo de alerta
 * @returns Array de pasos o array vacío
 */
export function getActionSteps(alertType: string): ActionStep[] {
  const plan = getActionPlan(alertType);
  return plan?.steps || [];
}

/**
 * Verificar si un tipo de alerta tiene plan configurado
 * @param alertType - Tipo de alerta
 * @returns true si tiene plan
 */
export function hasActionPlan(alertType: string): boolean {
  return getActionPlan(alertType) !== null;
}

/**
 * Obtener todos los tipos de alerta con planes configurados
 * @returns Array de tipos
 */
export function getConfiguredAlertTypes(): ExitAlertType[] {
  return Object.keys(EXIT_ACTION_PLANS) as ExitAlertType[];
}