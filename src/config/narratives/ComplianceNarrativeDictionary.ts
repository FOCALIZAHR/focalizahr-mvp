// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO DE NARRATIVAS — AMBIENTE SANO (COMPLIANCE)
// src/config/narratives/ComplianceNarrativeDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// Tono: McKinsey + Apple — una idea por oración. Sin jerga HR ni académica.
// Auditadas contra las 6 Reglas de Oro de skill focalizahr-narrativas.
// Fuente: Deep Research "Inteligencia por Dimensión para Ambiente Sano"
// (riesgo psicosocial, Ley Karin, SUSESO).
// Consumidor: ComplianceNarrativeEngine.buildDimensiones() →
//   /api/compliance/report → narratives.artefacto1_dimensiones[].narrativa
// ════════════════════════════════════════════════════════════════════════════

import type {
  OrigenOrganizacional,
  PatronNombre,
} from '@/lib/services/compliance/complianceTypes';

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

/** 6 dimensiones del producto Ambiente Sano (alineado con DepartmentSafetyScore). */
export type ComplianceDimensionKey =
  | 'P2_seguridad'
  | 'P3_disenso'
  | 'P4_microagresiones'
  | 'P5_equidad'
  | 'P7_liderazgo'
  | 'P8_agotamiento';

/**
 * 4 niveles internos del diccionario (granularidad del PDF).
 * El frontend consume 3 niveles (DimensionNarrative.nivel) — el helper
 * `toUiLevel` colapsa 'critico' en 'riesgo' para preservar el contrato.
 */
export type ComplianceDimensionLevel = 'sano' | 'atencion' | 'riesgo' | 'critico';

/** Nivel expuesto al frontend (DimensionNarrative.nivel). */
export type ComplianceDimensionUiLevel = 'sano' | 'atencion' | 'riesgo';

export interface ComplianceDimensionNarrative {
  /** Headline tono CEO — máximo 8 palabras, frase con punto. */
  headline: string;
  /** Cuerpo de 2-4 oraciones — contradicción → "O" causas → consecuencia. */
  body: string;
  /** Recomendación ejecutiva con marco de práctica de élite (texto informativo). */
  recomendacion: string;
  /** Plan de acción sugerido pre-llenado para el textarea del CEO. */
  planSugerido: string;
}

// ────────────────────────────────────────────────────────────────────────────
// DICCIONARIO — 6 dimensiones × 4 niveles
// ────────────────────────────────────────────────────────────────────────────

export const COMPLIANCE_DIMENSION_DICTIONARY: Record<
  ComplianceDimensionKey,
  Record<ComplianceDimensionLevel, ComplianceDimensionNarrative>
> = {
  // ════════════════════════════════════════════════════════════════════════
  // P2 — Seguridad psicológica · Clima de confianza para reportar
  // ════════════════════════════════════════════════════════════════════════
  P2_seguridad: {
    sano: {
      headline: 'El equipo dice lo que pasa antes de que pase.',
      body:
        'Los problemas suben cuando aún se pueden corregir. ' +
        'Si el promedio se sostiene sobre 4.8, vale revisar si hay piloto automático — la cohesión excesiva se ve igual que la confianza desde la encuesta. ' +
        'Esa diferencia se nota cuando aparece el primer riesgo real externo.',
      recomendacion:
        "Equipos con niveles máximos de confianza pueden desarrollar 'ceguera de taller' por exceso de cohesión. Empresas de alto rendimiento como Google (Project Aristotle) reconocen que mantener esta ventaja exige someter las decisiones a fricción externa controlada sin quebrar la confianza.",
      planSugerido:
        "Implementar simulaciones de 'Red Teaming' operativo donde especialistas de otras áreas busquen vulnerabilidades técnicas en los planes del equipo.",
    },
    atencion: {
      headline: 'El equipo calcula antes de hablar.',
      body:
        'Los temas técnicos fluyen. Los conductuales se silencian. ' +
        'O el costo político de decir la verdad pesa más que el costo de callar. ' +
        'O cada quien protege su carrera por sobre el resultado colectivo. ' +
        'La organización ya está perdiendo visibilidad sobre su primera línea.',
      recomendacion:
        'El talento comienza a calcular el riesgo político antes de escalar un problema. Consultoras élite como McKinsey advierten que esta conformidad calculada ralentiza la velocidad de respuesta del negocio frente a crisis inminentes.',
      planSugerido:
        "Institucionalizar el rol de 'Abogado del Diablo' con rotación obligatoria en comités clave para forzar la crítica y despersonalizar el conflicto.",
    },
    riesgo: {
      headline: 'El silencio no es paz. Es fricción acumulada.',
      body:
        'El equipo aprendió que el costo de hablar supera el costo de que el error ocurra. ' +
        'La operación pierde su sensor más temprano: la voz de quien ve los problemas primero. ' +
        'Cuando la falla finalmente aparezca, ya no habrá tiempo de corregir el camino.',
      recomendacion:
        'La autocensura defensiva se ha normalizado, provocando que la gerencia opere ciega ante los riesgos de primera línea. Culturas de innovación tecnológica estructuran mecanismos para desestigmatizar la falla antes de que escale a pérdida financiera.',
      planSugerido:
        "Ejecutar dinámicas de 'Pre-Mortem' obligatorias antes de lanzar proyectos importantes, forzando al equipo a listar las razones técnicas por las que la iniciativa va a fracasar.",
    },
    critico: {
      headline: 'Hablar se siente como inmolarse.',
      body:
        'Esto no es bajo desempeño cultural. Es la antesala de denuncias formales que llegan sin aviso a la gerencia. ' +
        'O hay represalias activas hacia quien cuestiona. O hay aislamiento progresivo de quien levanta la mano. ' +
        'La distancia con un escándalo público se mide en semanas, no en ciclos.',
      recomendacion:
        'El miedo endémico paraliza la organización y predice una fuga acelerada del capital humano crítico. Modelos de liderazgo en firmas de élite abordan este quiebre saltándose la cadena de mando tóxica para recuperar la visibilidad de las operaciones.',
      planSugerido:
        "Desplegar reuniones 'Skip-Level' directas con la alta dirección para extraer la verdad operativa sin filtros y remover a los mandos medios que actúan como bloqueadores.",
    },
  },

  // ════════════════════════════════════════════════════════════════════════
  // P3 — Tolerancia al disenso · Espacio para el desacuerdo
  // ════════════════════════════════════════════════════════════════════════
  P3_disenso: {
    sano: {
      headline: 'El conflicto de ideas no es personal.',
      body:
        'Las ideas débiles mueren antes de consumir presupuesto. ' +
        'La gerencia separa su identidad de sus propuestas. ' +
        'Si el acuerdo con la línea oficial supera el 90%, el riesgo es piloto automático — las culturas que escalan mantienen un 20% de fricción permanente.',
      recomendacion:
        'El debate riguroso asegura el control de calidad y evita el desperdicio de capital. Amazon promueve esta fricción constructiva para asegurar que las iniciativas defectuosas mueran en fases tempranas de diseño.',
      planSugerido:
        'Asignar presupuestos descentralizados de experimentación para que la primera línea valide sus hipótesis en el mercado sin requerir consenso gerencial.',
    },
    atencion: {
      headline: 'El desacuerdo solo lo dicen los de arriba.',
      body:
        'El equipo subalterno no desafía el status quo de manera directa. ' +
        'Los proyectos mediocres sobreviven porque nadie los detiene a tiempo. ' +
        'O el costo social de discrepar es demasiado alto. O el cargo de quien discrepa pesa más que el contenido de la crítica. ' +
        'La innovación se ralentiza sin que nadie lo declare.',
      recomendacion:
        'El desacuerdo se asimila solo cuando viene con extrema deferencia política, lo que garantiza la supervivencia de proyectos mediocres. Las organizaciones ágiles determinan el rumbo basándose en tracción real, no en la opinión de la persona mejor pagada en la sala.',
      planSugerido:
        "Implantar un marco de 'Datos sobre Opiniones' que exija el uso de pruebas A/B o prototipos mínimos viables para dirimir cualquier impase estratégico.",
    },
    riesgo: {
      headline: 'Discrepar se castiga como insubordinación.',
      body:
        'Los errores evidentes de la dirección no son interceptados por los mandos medios. ' +
        'O la cultura premió la obediencia ciega sobre la calidad técnica. ' +
        'O el equipo concluyó que opinar no cambia nada. ' +
        'El talento intelectual se desconecta del resultado del negocio mucho antes de renunciar.',
      recomendacion:
        'Penalizar el criterio técnico disidente asegura que los errores de la dirección lleguen intactos al mercado. Las metodologías de manufactura esbelta como Toyota establecen vías independientes para mitigar riesgos críticos antes de que colapsen el sistema.',
      planSugerido:
        "Habilitar canales de 'Escalada Rápida' que otorguen autoridad formal a los colaboradores técnicos para detener un lanzamiento riesgoso sin temor a represalias.",
    },
    critico: {
      headline: 'Discrepar se paga con el cargo.',
      body:
        'El castigo al disenso es activo: aislamiento, degradación de responsabilidades, salida. ' +
        'Este nivel predice fallos catastróficos que el mercado verá antes que el directorio. ' +
        'La fuga del talento de alto desempeño antecede el colapso por 90 a 120 días.',
      recomendacion:
        'El aislamiento punitivo a los disidentes crea cámaras de eco que anteceden fallos empresariales severos. Bridgewater Associates anula el ego gerencial mediante una meritocracia de ideas radical, donde las decisiones se toman por el peso de la evidencia y no por jerarquía.',
      planSugerido:
        "Imponer el protocolo 'Disagree and Commit', obligando a documentar todas las objeciones formales (shadow memos) y penalizando estructuralmente a los líderes que exijan sumisión intelectual.",
    },
  },

  // ════════════════════════════════════════════════════════════════════════
  // P4 — Microagresiones · Respeto en las interacciones diarias
  // (Escala inversa: alto = ausencia)
  // ════════════════════════════════════════════════════════════════════════
  P4_microagresiones: {
    sano: {
      headline: 'Los conflictos son técnicos, no personales.',
      body:
        'Nadie destina energía a defender su identidad en la oficina. ' +
        'La tensión que existe es la del trabajo bien hecho — la sana. ' +
        'El equipo opera con todo su ancho de banda disponible para el negocio.',
      recomendacion:
        'La ausencia de hostilidad permite que la totalidad del ancho de banda cognitivo del equipo se enfoque en el negocio. Investigaciones de BCG demuestran que estos ecosistemas retienen al talento altamente especializado frente a las ofertas de la competencia.',
      planSugerido:
        "Ejecutar rutinas de 'Mentoría Inversa' donde el talento de nuevas generaciones calibre al liderazgo senior sobre las dinámicas de integración y sesgos inconscientes emergentes.",
    },
    atencion: {
      headline: 'El sarcasmo se está volviendo lenguaje.',
      body:
        'Las "bromas" empiezan a tener un destinatario. El cinismo gana terreno frente al compromiso institucional. ' +
        'O la cultura está normalizando el menosprecio pasivo. O la presión externa empezó a buscar válvulas internas. ' +
        'El desgaste sobre los grupos minoritarios ya está en marcha — y la rotación los seguirá.',
      recomendacion:
        'El sarcasmo y las interrupciones selectivas desplazan gradualmente la agilidad y el compromiso de los equipos. Para evitar puntos ciegos, las empresas tecnológicas auditan los patrones de interacción diarios en el diseño de soluciones.',
      planSugerido:
        'Integrar analítica de participación en las herramientas de trabajo colaborativo para identificar y corregir asimetrías crónicas en los tiempos de habla de perfiles específicos.',
    },
    riesgo: {
      headline: 'La microagresión es el idioma del equipo.',
      body:
        'Existen jerarquías informales de dominación y bullying velado. ' +
        'Casi la mitad del equipo afectado reduce intencionalmente la calidad de su trabajo. Uno de cada cinco termina pidiendo licencia. ' +
        'La salida del talento minoritario corre 25% más rápido que en cualquier otro entorno.',
      recomendacion:
        'La agresividad pasiva fragmenta la colaboración cruzada y eleva las licencias por desgaste mental. Compañías de alto rendimiento sustituyen la hostilidad encubierta por la confrontación objetiva, cuidando la precisión del feedback y la integridad del profesional.',
      planSugerido:
        "Normalizar el marco operativo de 'Radical Candor', exigiendo que las correcciones de desempeño sean directas, frontales y respaldadas estrictamente por métricas, prohibiendo el uso del humor despectivo.",
    },
    critico: {
      headline: 'El trato cruzó el umbral del trauma.',
      body:
        'Esto ya no es clima organizacional. Es un punto de quiebre operativo con exposición a demandas laborales. ' +
        'La fiscalización por incumplimiento normativo deja de ser un escenario lejano — es lo que sigue cuando entre la primera denuncia formal. ' +
        'Cada semana que el indicador permanece aquí amplía el pasivo legal del directorio.',
      recomendacion:
        "La toxicidad sistémica destruye la viabilidad operativa y expone a la empresa a graves litigios reputacionales. Netflix resuelve esto eliminando de raíz a los perfiles que destruyen el tejido social, dado que su costo cultural anula cualquier aporte técnico.",
      planSugerido:
        "Aplicar el 'Keeper Test', ejecutando la desvinculación inmediata de los ofensores crónicos o 'Brilliant Jerks' sin importar su nivel de cumplimiento de metas individuales.",
    },
  },

  // ════════════════════════════════════════════════════════════════════════
  // P5 — Equidad · Equidad en la asignación de recursos
  // ════════════════════════════════════════════════════════════════════════
  P5_equidad: {
    sano: {
      headline: 'Las reglas del juego son las mismas para todos.',
      body:
        'El equipo confía en cómo se reparten promociones, bonos y oportunidades. ' +
        'Cuando esa confianza existe, las personas dan más de lo que el contrato exige. ' +
        'Esa entrega no se recupera con bonos cuando se pierde — se recupera reconstruyendo.',
      recomendacion:
        'Una meritocracia predecible garantiza que los colaboradores entreguen su máximo esfuerzo discrecional. Las estructuras de élite aseguran que las reglas de avance profesional sean inalterables y estén justificadas por el rendimiento comprobable.',
      planSugerido:
        'Transparentar las bandas salariales y fijar matrices públicas de competencias técnicas como único requisito para las promociones.',
    },
    atencion: {
      headline: 'Las reglas cambian según quién esté pidiendo.',
      body:
        'Las decisiones clave sobre asignaciones y bonos ya no se logran justificar ante el equipo. ' +
        'O los criterios cambian con la coyuntura. O la afinidad con la gerencia pesa más que los datos. ' +
        'La duda sobre la meritocracia interna se está instalando — y una vez instalada no se desinstala con un comunicado.',
      recomendacion:
        'La variabilidad opaca en las asignaciones de trabajo fomenta el escepticismo sobre el valor de la productividad real. La gestión moderna de recursos humanos mapea activamente cómo se reparte el trabajo invisible o administrativo para evitar sobrecargas sesgadas.',
      planSugerido:
        'Automatizar la distribución rotativa de aquellas cargas operativas no promovibles para que no recaigan de forma sistemática en los mismos colaboradores.',
    },
    riesgo: {
      headline: 'El esfuerzo y la recompensa se desconectaron.',
      body:
        'Las normas se aplican con rigor a unos y con laxitud a otros. ' +
        'El talento concluyó que trabajar duro es inútil — y migra al cumplimiento mínimo o a la búsqueda activa de empleo. ' +
        'La cuenta de la fuga se factura un trimestre después, cuando ya no hay rebobinar.',
      recomendacion:
        "El favoritismo estructural desconecta el esfuerzo de la recompensa y acelera el 'quiet quitting' generalizado. Modelos como el de Google bloquean este sesgo retirando el poder unilateral de la jefatura directa sobre la carrera de un individuo.",
      planSugerido:
        "Instaurar comités de promoción 'Peer-Reviewed', donde el avance de carrera y ajustes salariales sean debatidos y aprobados por un panel cruzado e independiente.",
    },
    critico: {
      headline: 'El resentimiento se volvió orgánico.',
      body:
        'La organización ya no enfrenta solo rotación. Enfrenta riesgo de fraude interno, filtración de datos, sabotaje y paralizaciones. ' +
        'La hemorragia del talento no alineado con la camarilla gerencial es irreversible al ritmo actual. ' +
        'La pérdida no se recupera contratando — se recupera reconstruyendo el contrato social interno.',
      recomendacion:
        'Un esquema de evaluación amañado genera resentimiento orgánico, fuga de cerebros y sabotaje de procesos. Apple aborda la falta de responsabilidad extirpando la ambigüedad que permite a ciertos gerentes apropiarse del éxito ajeno.',
      planSugerido:
        'Implementar el esquema DRI (Directly Responsible Individual), asignando en registro público la autoría total y el crédito de cada métrica a su ejecutor directo, sin filtros jerárquicos.',
    },
  },

  // ════════════════════════════════════════════════════════════════════════
  // P7 — Liderazgo · Calidad del liderazgo directo
  // ════════════════════════════════════════════════════════════════════════
  P7_liderazgo: {
    sano: {
      headline: 'El líder administra desempeño futuro, no tareas pasadas.',
      body:
        'La retroalimentación es semanal y específica. Las expectativas son cristalinas. ' +
        'El equipo opera con agilidad bajo presión porque no hay cuellos de botella jerárquicos. ' +
        'Esta es la base de un negocio que escala sin destruir su gente en el camino.',
      recomendacion:
        'El líder que actúa como habilitador operativo destraba cuellos de botella y acelera la innovación. El enfoque de Netflix impulsa un contexto estratégico denso, cediendo todo el control de la ejecución al talento experto contratado.',
      planSugerido:
        "Adoptar el paradigma 'High Context, Low Control', limitando la intervención gerencial a la provisión de objetivos de negocio y herramientas, delegando el 'cómo' a la base técnica.",
    },
    atencion: {
      headline: 'El gestor solo aparece cuando algo se cae.',
      body:
        'La retroalimentación llega como un trámite punitivo de fin de año, no como un acelerador. ' +
        'La motivación del equipo migró de intrínseca a estrictamente extrínseca — depende del salario, no del propósito. ' +
        'O el líder no tiene formación en gestión de personas. O el sistema no le exige hacerla. ' +
        'En ambos casos el talento empieza a buscar el motor que aquí no encuentra.',
      recomendacion:
        'Un liderazgo transaccional que utiliza el feedback exclusivamente como trámite anual ahoga la velocidad comercial de la empresa. La calibración ágil exige ciclos de interacción cortos enfocados en resultados futuros, no en reproches pasados.',
      planSugerido:
        "Erradicar las revisiones anuales de desempeño y sustituirlas por micro-sesiones '1-on-1' semanales estructuradas para eliminar obstáculos operativos inmediatos.",
    },
    riesgo: {
      headline: 'El líder es el cuello de botella.',
      body:
        'La confianza es nula. Cada acción operativa exige aprobación minuciosa. ' +
        'El equipo desarrolla "incompetencia aprendida" — espera la decisión que nunca delegan. ' +
        'La ansiedad somatizada y la pérdida de agilidad son dos caras del mismo problema. ' +
        'La señal precede la fuga del talento de alto desempeño por 90 a 120 días.',
      recomendacion:
        'La microgestión paraliza la toma de decisiones, induce incompetencia aprendida en los equipos y seca la resiliencia organizativa. Escalar la operación exige cambiar el monitoreo de actividades por un sistema de medición enfocado enteramente en el impacto.',
      planSugerido:
        'Desplegar un modelo de OKRs (Objectives and Key Results) radicalmente transparente para forzar al mando medio a medir la entrega de valor en lugar de vigilar las horas frente al monitor.',
    },
    critico: {
      headline: 'El jefe es la principal amenaza para su equipo.',
      body:
        'Críticas públicas humillantes. Información retenida como herramienta de poder. ' +
        'Este nivel cumple los criterios de vulneración de derechos fundamentales en cualquier marco laboral moderno — riesgo crítico de incumplimiento normativo. ' +
        'La denuncia no es un riesgo abstracto — es la consecuencia esperada de mantener al líder en el cargo.',
      recomendacion:
        'La gerencia destructiva humilla y retiene información crítica para sostener su estatus, generando costos millonarios en retención. La consultoría estratégica reestructura drásticamente los incentivos para alinear los intereses financieros del líder con la supervivencia de su equipo.',
      planSugerido:
        'Modificar el esquema de compensación variable del líder, vinculando al menos el 50% de su bono a las métricas duras de retención de talento clave y encuestas de pulso del clima de su departamento.',
    },
  },

  // ════════════════════════════════════════════════════════════════════════
  // P8 — Agotamiento relacional · Sostenibilidad del equipo
  // (Escala inversa: alto = ausencia de agotamiento)
  // ════════════════════════════════════════════════════════════════════════
  P8_agotamiento: {
    sano: {
      headline: 'El equipo es refugio, no costo.',
      body:
        'Las interacciones intra-equipo dan energía en lugar de extraerla. ' +
        'La alta confianza blinda al empleado contra el burnout incluso en periodos de sobrecarga técnica. ' +
        'Esto no es un beneficio — es la última línea de defensa contra el desgaste.',
      recomendacion:
        'Interacciones cohesionadas reducen drásticamente los costos de transacción política y blindan al talento durante las crisis de carga técnica. El análisis avanzado permite a las corporaciones identificar y cuidar a los individuos que actúan como motores de esta red social.',
      planSugerido:
        'Utilizar la Analítica de Redes Organizacionales (ONA) para mapear a los conectores clave del ecosistema e incentivar formalmente su rol como habilitadores de resiliencia comunitaria.',
    },
    atencion: {
      headline: 'Coordinar cuesta más que ejecutar.',
      body:
        'Cada reunión inter-departamental deja al empleado medianamente agotado. ' +
        'O los procesos están sobre-burocratizados. O los roles operativos no están definidos. ' +
        'Es la señal clásica de una organización que invierte energía en alinearse en lugar de avanzar.',
      recomendacion:
        'Una fricción burocrática excesiva cobra un peaje cognitivo alto por lograr alineamientos simples. Para proteger el ancho de banda mental, empresas como Amazon priorizan la asincronía y limitan rigurosamente las reuniones de validación.',
      planSugerido:
        "Imponer un formato de comunicación 'Async-First' combinando bloques de trabajo profundo (Deep Work) sin interrupciones y el uso de memorandos narrativos en lugar de comités informativos.",
    },
    riesgo: {
      headline: 'Colaborar es más estresante que trabajar.',
      body:
        'El clima social pasó de soporte a lastre operativo. ' +
        'El empleado termina la jornada sin capacidad ejecutiva restante — y no se recupera en su tiempo personal. ' +
        'O el menosprecio pasivo se normalizó. O el liderazgo seca las reservas emocionales del equipo. ' +
        'La desconexión y el ausentismo prolongado son la consecuencia, no la sorpresa.',
      recomendacion:
        'Sobrevivir a la política interna consume más energía que la resolución de problemas de mercado, indicando un diseño organizacional deficiente. La ingeniería de alto desempeño opta por simplificar radicalmente las jerarquías para devolver agilidad y bajar el estrés.',
      planSugerido:
        'Des-matricializar la estructura de procesos críticos, reduciendo al mínimo indispensable la cantidad de firmas y aprobaciones cruzadas necesarias para ejecutar una iniciativa.',
    },
    critico: {
      headline: 'El equipo evita activamente al equipo.',
      body:
        'Este es el umbral que precede al quiebre psiquiátrico individual. ' +
        'La evasión activa de las interacciones grupales no es introversión — es trauma. ' +
        'Las licencias prolongadas y la solicitud de atención psicológica de urgencia son el siguiente paso documentado. ' +
        'El costo del entorno tóxico ya cruzó el balance.',
      recomendacion:
        'El colapso relacional transforma la organización en un entorno hostil que aniquila la capacidad productiva. Resolver este escenario terminal no admite terapias de bienestar, sino el aislamiento táctico de los flujos de trabajo dañados.',
      planSugerido:
        "Encapsular a los equipos más saturados en 'Células Ágiles' autónomas, otorgándoles control end-to-end sobre sus tareas para erradicar temporalmente su dependencia de áreas políticamente tóxicas.",
    },
  },
};

// ────────────────────────────────────────────────────────────────────────────
// CLASIFICADORES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Score 0–5 → nivel granular del diccionario (4 niveles del PDF).
 * Umbrales:
 *   ≥ 4.0  → sano       (Alto)
 *   3.0–3.9 → atencion  (Medio)
 *   2.0–2.9 → riesgo    (Bajo)
 *   < 2.0  → critico    (Crítico)
 *
 * Nota: el umbral 'sano' del frontend actual es ≥ 3.5 (classifyDimension del
 * engine). Aquí se mantiene 4.0 para fidelidad con el PDF — el helper
 * `toUiLevel` reconcilia con el contrato del frontend al colapsar 'critico'.
 * El engine es quien decide qué clasificador usar al construir DimensionNarrative.
 */
export function classifyDimensionLevel(score: number): ComplianceDimensionLevel {
  if (score >= 4.0) return 'sano';
  if (score >= 3.0) return 'atencion';
  if (score >= 2.0) return 'riesgo';
  return 'critico';
}

/** Colapsa nivel granular (4) → nivel UI (3) preservando el contrato del tipo. */
export function toUiLevel(level: ComplianceDimensionLevel): ComplianceDimensionUiLevel {
  return level === 'critico' ? 'riesgo' : level;
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

/** Devuelve la narrativa cruda (headline + body separados) por dim × nivel. */
export function getDimensionNarrative(
  dimKey: ComplianceDimensionKey,
  level: ComplianceDimensionLevel,
): ComplianceDimensionNarrative {
  return COMPLIANCE_DIMENSION_DICTIONARY[dimKey][level];
}

/**
 * Resuelve narrativa lista para consumo del engine: dado un score org promedio
 * para una dimensión, devuelve `{ uiLevel, narrativa }` ya concatenada.
 *
 * `uiLevel` se mapea al contrato existente DimensionNarrative.nivel (3 niveles).
 * `narrativa` es `${headline} ${body}` — una sola string lista para renderizar.
 */
export function resolveDimensionNarrative(
  dimKey: ComplianceDimensionKey,
  score: number,
): { uiLevel: ComplianceDimensionUiLevel; narrativa: string } {
  const level = classifyDimensionLevel(score);
  const { headline, body } = COMPLIANCE_DIMENSION_DICTIONARY[dimKey][level];
  return {
    uiLevel: toUiLevel(level),
    narrativa: `${headline} ${body}`,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// PATRONES_LLM — Narrativas ejecutivas para SectionPatrones ("La Voz")
// ════════════════════════════════════════════════════════════════════════════
// Fuente única de copy para los 5 patrones culturales detectables por el motor
// LLM (`PatronesLLMService.ts` + agregación en `MetaAnalisisLLMService.ts`).
// Auditadas contra las 6 Reglas de Oro de skill focalizahr-narrativas.
//
// Estructura:
//   - titulares       → palabra-blanca + <em>palabra-purple</em> por patrón
//   - bloquesCentrales → narrativa principal por patrón (3-4 oraciones)
//   - bloquesOrigen   → bloque "03 · Origen" por OrigenOrganizacional
//   - cierres         → frase de cierre según es_problema_cultural
//
// Política de patrones especiales:
//   - 'ninguno' (org) / 'ambiente_sano' (depto) / 'datos_insuficientes' (depto)
//     NO tienen entradas — esos casos en SectionPatrones llevan a `return null`
//     o a modos especiales (caso amber con sólo alertaGénero).
//
// Política de origen:
//   - 'mixto' e 'indeterminado' deliberadamente omitidos en `bloquesOrigen`.
//     `getOrgOrigenLabel` (helpers.ts de SectionDimensiones) ya devuelve null
//     para esos valores; el bloque de origen entero se omite en la UI.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Subset de `PatronNombre` correspondiente a los 5 patrones renderables.
 * Hoy coincide 1:1 con `PatronNombre` (el backend solo emite estos 5 + casos
 * especiales no-renderables). El alias existe para clarificar intención en
 * consumidores: "este parámetro espera un patrón con narrativa, no `ninguno`".
 */
export type PatronCultural = PatronNombre;

export interface PatronEditorialTitle {
  /** Palabra/frase en blanco — sustantivo o sujeto. */
  primera: string;
  /** Palabra/frase en purple via <em> — verbo o consecuencia. */
  segunda: string;
}

export const PATRONES_LLM: {
  titulares: Record<PatronCultural, PatronEditorialTitle>;
  bloquesCentrales: Record<PatronCultural, string>;
  /**
   * Partial — 'mixto' e 'indeterminado' no tienen entrada (UI los omite).
   * El consumidor debe leer con `?? null` y skipear el bloque "03 · Origen"
   * cuando sea undefined.
   */
  bloquesOrigen: Partial<Record<OrigenOrganizacional, string>>;
  cierres: { cultural: string; localizado: string };
} = {
  titulares: {
    silencio_organizacional: {
      primera: 'Lo que el equipo sabe',
      segunda: 'nadie lo dice en voz alta.',
    },
    hostilidad_normalizada: {
      primera: 'El conflicto dejó de ser un error',
      segunda: 'ahora es el estándar oficial.',
    },
    favoritismo_implicito: {
      primera: 'El talento dejó de competir',
      segunda: 'porque el mérito no decide.',
    },
    resignacion_aprendida: {
      primera: 'El equipo todavía responde',
      segunda: 'pero ya dejó de esperar.',
    },
    miedo_represalias: {
      primera: 'El silencio actual no es paz',
      segunda: 'es cálculo, no lealtad.',
    },
  },

  bloquesCentrales: {
    silencio_organizacional:
      'El equipo aprendió que levantar la mano tiene un costo mayor que dejar que el error ocurra. La información crítica dejó de fluir por los canales oficiales. Los problemas reales se discuten en los pasillos, no en las reuniones. La operación avanza a ciegas hacia su próximo incidente.',
    hostilidad_normalizada:
      'Lo que el equipo describe como trato habitual, un externo lo llamaría maltrato institucionalizado. La fricción constante dejó de ser un evento para convertirse en el clima. La línea que separa la exigencia del hostigamiento se mueve todos los días. Y nadie la está deteniendo.',
    favoritismo_implicito:
      'La organización percibe que las decisiones clave no responden al desempeño. El esfuerzo extra pierde sentido cuando las reglas no aplican igual para todos. El talento de alto rendimiento nota esta asimetría primero. Y los mejores siempre tienen otras opciones.',
    resignacion_aprendida:
      'La frustración inicial ya dio paso a la apatía. El equipo asume que el reporte no produce ningún cambio real. Las encuestas se perciben como un trámite. El sistema dejó de intentar.',
    miedo_represalias:
      'El equipo opera bajo la certeza de que habrá consecuencias personales si se expone una verdad incómoda. Los conflictos ya escalaron lo suficiente como para que callar sea la única jugada segura. La lealtad observada no se basa en el compromiso. Se sostiene en el riesgo.',
  },

  bloquesOrigen: {
    vertical_descendente:
      'La señal no viene del entorno, baja directamente desde el liderazgo. Es un cuello de botella de autoridad que define el tono de toda el área.',
    horizontal_pares:
      'La fricción no sube ni baja, ocurre exclusivamente en la primera línea. Es una dinámica de pares que se autoprotege y regula a sus propios miembros.',
    sistemico_procesos:
      'El problema no apunta a personas. Está anclado en la arquitectura. Las metas, cargas o procesos actuales fracturan al equipo desde adentro.',
    // 'mixto' e 'indeterminado' deliberadamente omitidos — la UI los suprime.
  },

  cierres: {
    cultural:
      'La gerencia está tomando decisiones con información filtrada por toda la estructura. Cada decisión construida sobre datos incompletos tiene un costo oculto en el balance — hasta que una crisis lo hace visible.',
    localizado:
      'Los focos localizados tienen una ventaja sobre los problemas culturales: tienen dirección y límites claros. El problema es que también tienen tiempo — y el tiempo siempre los consolida.',
  },
};

// ════════════════════════════════════════════════════════════════════════════
// PATRONES_SIN_DATOS — Narrativas para el branch "sin patrones detectados"
// ════════════════════════════════════════════════════════════════════════════
// Se usa en `SectionPatrones.Nivel1Card` cuando
// `narratives.artefacto2_patrones.length === 0`. Diferencia dos casos antes
// ambiguos en una sola pantalla:
//
//   ESCENARIO_A: alta participación + texto suficiente + cero patrones
//                → ambiente sano confirmado por evidencia.
//   ESCENARIO_B: baja participación o textos monosilábicos
//                → silencio estructural, no se puede analizar.
//
// La selección entre A y B la hace el frontend cruzando los nuevos campos
// org-level (`totalTextResponses`, `totalRespondents`) con el bucketing
// existente de `bucketDepartments()`. Este diccionario solo provee copy.
// ════════════════════════════════════════════════════════════════════════════

export type PatronesSinDatosEscenario = 'ESCENARIO_A' | 'ESCENARIO_B';

export interface PatronesSinDatosNarrative {
  titular: PatronEditorialTitle;
  veredicto: string;
  lego: string;
  cierre: string;
}

export const PATRONES_SIN_DATOS: Record<PatronesSinDatosEscenario, PatronesSinDatosNarrative> = {
  ESCENARIO_A: {
    titular: {
      primera: 'El análisis de vulnerabilidad',
      segunda: 'no encontró nada.',
    },
    veredicto:
      'El motor de inteligencia procesó el volumen de respuestas y no detectó marcadores de hostilidad, sesgo ni silencio táctico.',
    lego:
      'No encontrar patrones sistémicos en texto libre anónimo no es un error del radar. Es un logro de gestión directiva. Los equipos utilizaron la plataforma para validar el estado de la operación, no para exponer fricciones ocultas. Los conflictos se resuelven antes de que el sistema tenga que registrarlos.',
    cierre:
      'En este ciclo, la ausencia de quejas no es producto del miedo, sino el reflejo de una estructura estable que le permite a la compañía acelerar sin riesgo interno.',
  },

  ESCENARIO_B: {
    titular: {
      primera: 'El sistema no registra texto.',
      segunda: 'El silencio también es un dato.',
    },
    veredicto:
      'El volumen de texto libre no superó el umbral mínimo. El análisis no puede ejecutarse sobre lo que no se escribió.',
    lego:
      'En evaluaciones corporativas anónimas, una página en blanco rara vez significa que el desempeño es perfecto. La ausencia masiva de comentarios indica una postura de evasión preventiva. La primera línea de la empresa seleccionada activamente no dejará ningún rastro escrito. Esta dinámica de repliegue colectivo siempre antecede a sorpresas operativas.',
    cierre:
      'Este nivel de silencio estructural corta el flujo de información temprana y transfiere todo el riesgo de cumplimiento directamente a la gerencia.',
  },
};
