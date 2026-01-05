// src/lib/constants/onboarding-narratives.ts
// FocalizaHR - Narrativas 4C para Onboarding Intelligence
// Versión: 1.0.0 | Fecha: 4 Enero 2026

// ============================================================================
// NARRATIVAS POR DIMENSIÓN 4C
// ============================================================================

export const DIMENSION_NARRATIVES = {
  compliance: {
    humanName: 'Primera Impresión',
    technicalName: 'Compliance',
    day: 1,
    
    headline: (deptName: string) => 
      `${deptName} está fallando en el primer día de sus nuevos colaboradores.`,
    
    whatItMeasures: 
      'Si la persona tuvo todo listo para empezar: alguien que la recibiera, ' +
      'escritorio preparado, equipo funcionando, accesos listos y claridad ' +
      'sobre qué hacer el día 1.',
    
    whyItMatters: 
      'Un mal primer día predice 75% de probabilidad de salida en los ' +
      'primeros 6 meses. La primera impresión es difícil de revertir.',
    
    actionPrompt: 
      'Revisa las alertas del sistema. Tienes un plan de acción sugerido ' +
      'para mejorar la bienvenida de los próximos ingresos.',
    
    source: 'Modelo 4C Bauer · Investigación en 1,000+ empresas'
  },
  
  clarification: {
    humanName: 'Claridad del Rol',
    technicalName: 'Clarificación',
    day: 7,
    
    headline: (deptName: string) => 
      `${deptName} tiene personas que no entienden bien qué se espera de ellas.`,
    
    whatItMeasures: 
      'Si después de una semana el colaborador sabe exactamente qué debe hacer, ' +
      'cómo será evaluado, tiene las herramientas necesarias y sabe a quién acudir.',
    
    whyItMatters: 
      'La confusión de rol en la primera semana reduce la productividad un 45% ' +
      'durante los primeros 90 días. Es el predictor #1 de retención temprana.',
    
    actionPrompt: 
      'Agenda una conversación de expectativas con cada persona nueva. ' +
      'El sistema detectó personas sin claridad suficiente.',
    
    source: 'Modelo 4C Bauer + Gallup State of Workplace 2024'
  },
  
  culture: {
    humanName: 'Conexión con el Equipo',
    technicalName: 'Cultura',
    day: 30,
    
    headline: (deptName: string) => 
      `${deptName} tiene personas que no se sienten parte del equipo.`,
    
    whatItMeasures: 
      'Si después de un mes la persona siente que pertenece, conoce a sus ' +
      'compañeros, entiende cómo funciona el equipo y se identifica con los valores.',
    
    whyItMatters: 
      'El desajuste cultural causa 3x más rotación en el primer año. ' +
      'Las personas que no conectan en 30 días rara vez lo hacen después.',
    
    actionPrompt: 
      'Considera asignar un "buddy" o mentor. El sistema identificó ' +
      'personas que reportan sentirse aisladas.',
    
    source: 'McKinsey Organization Health Index'
  },
  
  connection: {
    humanName: 'Visión de Futuro',
    technicalName: 'Conexión',
    day: 90,
    
    headline: (deptName: string) => 
      `${deptName} tiene personas que no ven un futuro aquí.`,
    
    whatItMeasures: 
      'Si después de 3 meses la persona ve oportunidades de crecimiento, ' +
      'se siente valorada, tiene relaciones significativas y quiere quedarse.',
    
    whyItMatters: 
      'La respuesta "me veo trabajando aquí en un año" tiene 85% de accuracy ' +
      'predictiva. Score <60 = 78% probabilidad de renuncia en 6 meses.',
    
    actionPrompt: 
      'Agenda conversaciones de desarrollo y carrera. Esta es tu última ' +
      'ventana para retenerlos.',
    
    source: 'Modelo 4C Bauer · EXO Score validation'
  }
};

// ============================================================================
// MAPEO DE NOMBRES TÉCNICOS A KEYS
// ============================================================================

export const DIMENSION_KEY_MAP: Record<string, keyof typeof DIMENSION_NARRATIVES> = {
  'Compliance': 'compliance',
  'Clarificación': 'clarification', 
  'Cultura': 'culture',
  'Conexión': 'connection'
};

// ============================================================================
// NARRATIVAS NPS (Marca Empleadora)
// ============================================================================

export const getNPSNarrative = (npsScore: number | null, focusScore: number): {
  message: string;
  severity: 'critical' | 'warning' | 'opportunity' | 'success';
} | null => {
  if (npsScore === null) return null;
  
  const isDetractor = npsScore < 0;
  const isPromoter = npsScore >= 30;
  const isCritical = focusScore < 50;
  
  if (isCritical && isDetractor) {
    return {
      message: 'Y ya se nota afuera: tus nuevos empleados son detractores de la marca empleadora. Están compartiendo su mala experiencia de ingreso.',
      severity: 'critical'
    };
  }
  
  if (isCritical && !isDetractor) {
    return {
      message: 'Aún no han perdido la fe (NPS positivo). Tienes una ventana de oportunidad antes de que esto impacte tu reputación externa.',
      severity: 'opportunity'
    };
  }
  
  if (!isCritical && isDetractor) {
    return {
      message: 'El proceso onboarding está bien, pero algo más los hace detractores. Vale la pena investigar qué los está afectando.',
      severity: 'warning'
    };
  }
  
  if (isPromoter) {
    return {
      message: 'Excelente: tus nuevos empleados son embajadores de tu marca. Están recomendando trabajar aquí.',
      severity: 'success'
    };
  }
  
  return null;
};

// ============================================================================
// HELPER: Posición (Ranking vs Percentil adaptativo)
// ============================================================================

export const getPositionLabel = (rank: number, total: number): { 
  label: string; 
  color: string;
  percentile: number;
} => {
  const percentile = Math.round(((total - rank + 1) / total) * 100);
  
  // Con pocas unidades (< 8) → Ranking simple (más claro)
  if (total < 8) {
    const isTop = rank <= Math.ceil(total / 3);
    const isBottom = rank > total - Math.ceil(total / 3);
    return {
      label: `#${rank} de ${total}`,
      color: isTop ? 'text-emerald-400' : isBottom ? 'text-red-400' : 'text-amber-400',
      percentile
    };
  }
  
  // Con muchas unidades (≥ 8) → Percentil
  if (percentile >= 75) return { label: 'Top 25%', color: 'text-emerald-400', percentile };
  if (percentile >= 50) return { label: 'Sobre promedio', color: 'text-cyan-400', percentile };
  if (percentile >= 25) return { label: 'Bajo promedio', color: 'text-amber-400', percentile };
  return { label: 'Cuartil inferior', color: 'text-red-400', percentile };
};

// ============================================================================
// HELPERS: Colores por Score
// ============================================================================

export const getScoreColor = (score: number): string => {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 70) return 'bg-emerald-500/20';
  if (score >= 50) return 'bg-amber-500/20';
  return 'bg-red-500/20';
};

export const getNPSColor = (nps: number): string => {
  if (nps >= 30) return 'text-emerald-400';
  if (nps >= 0) return 'text-cyan-400';
  if (nps >= -20) return 'text-amber-400';
  return 'text-red-400';
};

export const getNPSLabel = (nps: number): string => {
  if (nps >= 30) return 'Promotores';
  if (nps >= 0) return 'Pasivos';
  return 'Detractores';
};