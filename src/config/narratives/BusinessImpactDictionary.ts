// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO DE IMPACTOS POR GERENCIA
// src/config/narratives/BusinessImpactDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// Fuente: DICCIONARIO_IMPACTOS_GERENCIA_v3.1.md
// Tono: CONDICIONAL DE RIESGO — "podría", "exposición a", "alta probabilidad"
// Key: standardCategory de DepartmentAdapter (8 categorías)
// ════════════════════════════════════════════════════════════════════════════

export interface BusinessRisk {
  icon: string
  label: string
  narrative: string
}

export interface GerenciaImpact {
  category: string
  meta: string
  metaDescription: string
  introNarrative: string
  risks: BusinessRisk[]
}

export const BUSINESS_IMPACT_DICTIONARY: Record<string, GerenciaImpact> = {

  // ──────────────────────────────────────────────────────────────────────────
  // 1. COMERCIAL / VENTAS
  // ──────────────────────────────────────────────────────────────────────────
  comercial: {
    category: 'comercial',
    meta: 'CRECER',
    metaDescription: 'Más ingresos, más clientes, cerrar negocios',
    introNarrative: 'Operar con esta brecha de capacidades no solo genera pérdida en nómina, sino que podría frenar directamente el crecimiento:',
    risks: [
      {
        icon: '📉',
        label: 'Riesgo de Ingresos Perdidos',
        narrative: 'Alta probabilidad de "quemar" prospectos calificados por mal manejo. Cada prospecto perdido es un cliente que fue a la competencia.',
      },
      {
        icon: '💰',
        label: 'Vulnerabilidad de Costos',
        narrative: 'Exposición a inflar el Costo de Adquisición de Clientes. Si se necesitan más prospectos para cerrar los mismos negocios, el costo de vender sube.',
      },
      {
        icon: '⏱️',
        label: 'Fricción de Cierre',
        narrative: 'Peligro de ciclos de venta eternos. La falta de capacidad para manejar objeciones tranca los negocios y hunde la tasa de cierre.',
      },
      {
        icon: '📊',
        label: 'Riesgo de Visibilidad',
        narrative: 'Cuando el equipo comercial no tiene capacidad para gestionar su cartera de oportunidades, el pronóstico de ventas se vuelve ficción. Las decisiones de contratación, inversión y expansión se toman sobre arena movediza. Proyectos no concretados que ya se habían dado por hechos.',
      },
      {
        icon: '⚠️',
        label: 'Riesgo de Talento',
        narrative: 'Los vendedores de alto rendimiento tienden a irse cuando sienten que cargan con el peso del equipo. Perder a un vendedor estrella cuesta meses de oportunidades en desarrollo.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. FINANZAS
  // ──────────────────────────────────────────────────────────────────────────
  finanzas: {
    category: 'finanzas',
    meta: 'ORDEN + FLUJO DE CAJA',
    metaDescription: 'Cobranza a tiempo, cierres contables, visibilidad para decisiones',
    introNarrative: 'Mantener esta brecha de capacidades podría destruir la visibilidad del Directorio y tensar la caja:',
    risks: [
      {
        icon: '💸',
        label: 'Riesgo de Caja',
        narrative: 'Peligro de aumento en los días de cobranza. Plata que debería estar en la cuenta sigue en la calle, forzando costos de financiamiento.',
      },
      {
        icon: '📉',
        label: 'Deterioro de Cartera',
        narrative: 'Exposición a clientes que simplemente no van a pagar. No es que la plata llegue tarde — es que no llega. Sin capacidad para gestionar la cobranza de manera proactiva, la cartera se deteriora hasta que hay que castigarla. Plata que se daba por segura desaparece del balance.',
      },
      {
        icon: '🙈',
        label: 'Vulnerabilidad de Visibilidad',
        narrative: 'Exposición a cierres contables tardíos o con errores. El Directorio opera a ciegas, sin ver las fugas de rentabilidad a tiempo.',
      },
      {
        icon: '📊',
        label: 'Riesgo de Margen',
        narrative: 'Alta probabilidad de errores en la fijación de precios que dejan plata en la mesa. Presupuestos desconectados de la realidad.',
      },
      {
        icon: '⚖️',
        label: 'Fricción de Control',
        narrative: 'Cuando Finanzas no tiene capacidad, los controles se relajan. Las sorpresas aparecen cuando ya es tarde para corregirlas.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. TECNOLOGÍA
  // ──────────────────────────────────────────────────────────────────────────
  tecnologia: {
    category: 'tecnologia',
    meta: 'HABILITAR EL NEGOCIO',
    metaDescription: 'Sistemas que funcionan, respuesta rápida a cambios, seguridad',
    introNarrative: 'Con esta brecha de capacidades, Tecnología ya no está habilitando el negocio, lo está frenando:',
    risks: [
      {
        icon: '🐌',
        label: 'Riesgo de Velocidad',
        narrative: 'El negocio pide un cambio y Tecnología no puede responder a tiempo. Lo que la competencia hace en semanas, aquí toma meses.',
      },
      {
        icon: '🔥',
        label: 'Vulnerabilidad de Continuidad',
        narrative: 'Exposición a caídas de sistemas que paran la operación. Cada hora de sistemas caídos tiene costo directo en ventas, producción o servicio.',
      },
      {
        icon: '🔒',
        label: 'Riesgo de Seguridad',
        narrative: 'Peligro de brechas e incidentes de seguridad. Un ataque exitoso puede costar millones en recuperación, multas y reputación.',
      },
      {
        icon: '🚪',
        label: 'Fuga de Talento Técnico',
        narrative: 'Los desarrolladores de alto nivel tienden a irse cuando el equipo no está a la altura. Reemplazarlos es caro, lento, y mientras tanto el negocio espera.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PERSONAS / RRHH
  // ──────────────────────────────────────────────────────────────────────────
  personas: {
    category: 'personas',
    meta: 'TALENTO + CLIMA',
    metaDescription: 'Atraer, desarrollar y retener al talento correcto, en un ambiente que impulse resultados',
    introNarrative: 'Mantener esta brecha de capacidades podría convertir al área en una fábrica de costos ocultos y decisiones postergadas:',
    risks: [
      {
        icon: '🎯',
        label: 'Riesgo en Adquisición de Talento',
        narrative: 'Exposición a tiempos altos para cubrir vacantes críticas. O peor: acelerar el proceso y terminar contratando perfiles que no dan el ancho. Las malas contrataciones se multiplican porque nadie quiere admitir el error. El problema de una gerencia se reproduce en las demás.',
      },
      {
        icon: '🔄',
        label: 'Riesgo de Sucesión',
        narrative: 'Cuando alguien clave se va — un gerente, un especialista crítico — no hay nadie listo adentro. Se termina buscando afuera lo que se pudo desarrollar internamente. Los equipos se sobrecargan tapando huecos. Cuando urge, se contrata al primero que aparece — no al mejor. La curva de aprendizaje del externo puede tomar 6-12 meses.',
      },
      {
        icon: '💸',
        label: 'Pasivo de Indecisión',
        narrative: 'Peligro de acumular personas de bajo desempeño porque nadie toma la decisión de desvincular a tiempo. Cada mes que pasa, el finiquito crece — es una cuenta de ahorro involuntaria para quien debió salir hace meses. Se evitan las conversaciones difíciles "castigando con el bono", pero la persona sigue ahí, sobrepagada respecto a su aporte real. El costo no aparece en ningún reporte, pero está ahí.',
      },
      {
        icon: '📊',
        label: 'Gestión Reactiva',
        narrative: 'Exposición a operar sin visibilidad real de lo que pasa con el talento. Se invierten recursos en planes de desarrollo genéricos sin medir si el cambio ocurrió. El área termina haciendo autopsias organizacionales: cuenta quién se fue, reporta si la rotación subió o bajó — pero no investiga las causas ni predice quién está en riesgo. Va siempre detrás de los hechos, nunca adelante.',
      },
      {
        icon: '🌡️',
        label: 'Vulnerabilidad de Clima',
        narrative: 'Peligro de deterioro del ambiente laboral sin detectarlo a tiempo. Cuando el clima se enferma, la productividad cae y la rotación sube — en silencio. Y cuando el bajo desempeño se tolera públicamente, los colaboradores de alto rendimiento sacan cuentas: "Si a ese no le pasa nada, ¿para qué me esfuerzo?" Los mejores no quieren cargar con el peso de los que no rinden. Se van primero — y se llevan el conocimiento.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. OPERACIONES
  // ──────────────────────────────────────────────────────────────────────────
  operaciones: {
    category: 'operaciones',
    meta: 'EFICIENCIA',
    metaDescription: 'Cumplir entregas, minimizar costos, cero reprocesos',
    introNarrative: 'Operar con esta brecha de capacidades podría comprometer la promesa de entrega y la estructura de costos:',
    risks: [
      {
        icon: '📦',
        label: 'Riesgo de Cumplimiento',
        narrative: 'Alta probabilidad de no entregar a tiempo y completo. Los clientes no reciben lo que pidieron, cuando lo pidieron. La confianza se erosiona.',
      },
      {
        icon: '💰',
        label: 'Vulnerabilidad de Costos',
        narrative: 'Exposición a ineficiencias que inflan el costo unitario: reprocesos, desperdicios, horas extra no planificadas. El margen se come desde adentro.',
      },
      {
        icon: '🔧',
        label: 'Riesgo de Calidad',
        narrative: 'Exposición a productos o servicios que salen defectuosos. Cada falla de calidad que llega al cliente tiene costo triple: el reproceso, la compensación, y el daño a la reputación. En industrias reguladas, puede significar retiro de productos del mercado.',
      },
      {
        icon: '🔍',
        label: 'Ineficiencias Ocultas',
        narrative: 'Dado el tamaño e impacto del área, las ineficiencias pueden esconderse en los grandes números de costos y gastos — subsidiadas silenciosamente por áreas o productos más eficientes. El margen de un producto estrella termina tapando el desperdicio de otro. Hasta que alguien desagrega los números, nadie sabe que hay un agujero que se come la rentabilidad.',
      },
      {
        icon: '🔄',
        label: 'Fricción de Cadena',
        narrative: 'Peligro de quiebres de inventario o sobreinventario por mala planificación. Plata parada en bodega o ventas perdidas por falta de stock.',
      },
      {
        icon: '😤',
        label: 'Riesgo Cascada',
        narrative: 'Cuando Operaciones falla, el área de Servicio se satura de reclamos. El problema de una gerencia se convierte en crisis de otra.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. MARKETING
  // ──────────────────────────────────────────────────────────────────────────
  marketing: {
    category: 'marketing',
    meta: 'GENERAR DEMANDA + POSICIONAR',
    metaDescription: 'Prospectos calificados para Ventas, marca visible',
    introNarrative: 'Mantener esta brecha de capacidades podría secar el flujo de oportunidades y diluir la marca:',
    risks: [
      {
        icon: '🎯',
        label: 'Riesgo de Demanda',
        narrative: 'Alta probabilidad de no generar suficientes prospectos calificados. Ventas se queda sin oportunidades que trabajar y el crecimiento se frena.',
      },
      {
        icon: '⚡',
        label: 'Fricción con Ventas',
        narrative: 'Peligro de entregar prospectos de baja calidad. Comercial los rechaza, la tensión entre áreas crece, y se pierde tiempo en oportunidades que nunca iban a cerrar.',
      },
      {
        icon: '📊',
        label: 'Vulnerabilidad de Medición',
        narrative: 'Exposición a gastar presupuesto sin saber qué funciona. Sin datos claros, las decisiones se toman a ciegas.',
      },
      {
        icon: '🏷️',
        label: 'Riesgo de Marca',
        narrative: 'Peligro de mensajes inconsistentes que confunden al mercado. La marca pierde relevancia mientras la competencia se posiciona mejor.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. SERVICIO AL CLIENTE
  // ──────────────────────────────────────────────────────────────────────────
  servicio: {
    category: 'servicio',
    meta: 'SATISFACCIÓN + RETENCIÓN',
    metaDescription: 'Clientes contentos que no se van y compran más',
    introNarrative: 'Operar con esta brecha de capacidades podría destruir la relación con clientes existentes:',
    risks: [
      {
        icon: '😠',
        label: 'Riesgo de Satisfacción',
        narrative: 'Alta probabilidad de caída en la recomendación (NPS) y aumento de reclamos. Los clientes insatisfechos hablan — y hablan fuerte, especialmente en redes.',
      },
      {
        icon: '🔄',
        label: 'Vulnerabilidad de Retención',
        narrative: 'Exposición a fuga de clientes evitable. Se van no por el producto, sino por cómo los trataron. Retener cuesta 5 veces menos que adquirir.',
      },
      {
        icon: '⏱️',
        label: 'Fricción de Resolución',
        narrative: 'Peligro de tiempos de respuesta que frustran. Cada hora de espera es un cliente considerando alternativas.',
      },
      {
        icon: '📉',
        label: 'Riesgo de Expansión',
        narrative: 'Cuando el cliente está molesto, no hay espacio para venderle más. Se pierde el ingreso de venta adicional y renovaciones.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. LEGAL
  // ──────────────────────────────────────────────────────────────────────────
  legal: {
    category: 'legal',
    meta: 'PROTEGER + HABILITAR',
    metaDescription: 'Evitar litigios, revisar contratos rápido, cumplir normativas',
    introNarrative: 'Mantener esta brecha de capacidades podría exponer a la empresa Y frenar los negocios:',
    risks: [
      {
        icon: '⚖️',
        label: 'Riesgo de Litigio',
        narrative: 'Alta probabilidad de demandas laborales, comerciales o regulatorias que podrían haberse evitado con asesoría oportuna. Una demanda grande puede comprometer el patrimonio.',
      },
      {
        icon: '📝',
        label: 'Vulnerabilidad Contractual',
        narrative: 'Exposición a contratos mal redactados que dejan vacíos explotables. Lo que no está escrito, no existe — y se paga caro después.',
      },
      {
        icon: '🚨',
        label: 'Riesgo Regulatorio',
        narrative: 'Peligro de multas y sanciones por incumplimiento normativo. En industrias reguladas, esto puede ser existencial.',
      },
      {
        icon: '⏰',
        label: 'Fricción de Negocios',
        narrative: 'Cuando Legal no responde a tiempo, los negocios se trancan. El cliente está listo para firmar, pero el contrato lleva semanas en revisión. El costo de oportunidad es real.',
      },
    ],
  },
}
