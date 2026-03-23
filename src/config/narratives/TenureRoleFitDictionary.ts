// ════════════════════════════════════════════════════════════════════════════
// MOTOR ROLE FIT × ANTIGÜEDAD
// src/config/narratives/TenureRoleFitDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// 3 tramos × 2 niveles de fit = 6 narrativas
// A1 (<12mo) Validación | A2 (12-36mo) Verdad | A3 (>36mo) Decisión
// Sincronizado con TalentActionService.classifyTenure() umbrales 12/36
// Fuente: DICCIONARIO_IMPACTOS_GERENCIA_v3.1.md — Motor Role Fit × Antigüedad
// ════════════════════════════════════════════════════════════════════════════

export type TenureTrend = 'A1' | 'A2' | 'A3'
export type FitLevel = 'low' | 'high'

export interface TenureRoleFitNarrative {
  diagnosis: string
  narrativeNormal: string
  narrativeShort: string
  prevention: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER — Calcular tramo desde meses de antigüedad
// Sincronizado con classifyTenure() en TalentActionService
// ════════════════════════════════════════════════════════════════════════════

export function getTenureTrend(tenureMonths: number): TenureTrend {
  if (tenureMonths < 12) return 'A1'
  if (tenureMonths <= 36) return 'A2'
  return 'A3'
}

export function getFitLevel(roleFitScore: number): FitLevel {
  return roleFitScore >= 75 ? 'high' : 'low'
}

// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO
// ════════════════════════════════════════════════════════════════════════════

export const TENURE_ROLEFIT_DICTIONARY: Record<TenureTrend, Record<FitLevel, TenureRoleFitNarrative>> = {

  // ──────────────────────────────────────────────────────────────────────────
  // A1: < 12 meses — Zona de Validación de Selección
  // ──────────────────────────────────────────────────────────────────────────
  A1: {
    low: {
      diagnosis: 'SEÑAL TEMPRANA',
      narrativeNormal: 'Señal temprana, no sentencia. Los nuevos ingresos no estarían cerrando brechas existentes. Esto podría indicar una falla de perfil (se definió mal lo que el rol necesita), una falla de selección (el proceso no identifica el talento correcto), o una falla de integración (el jefe directo no está acompañando bien). Si el patrón se concentra en una gerencia específica, probablemente el problema esté en el jefe directo, no en las personas.',
      narrativeShort: 'Aún en integración. Si el patrón se repite, ajustar perfil o proceso antes de la próxima contratación.',
      prevention: 'Revisar si el perfil definido corresponde a lo que el rol realmente necesita. Validar que el proceso de selección identifica las competencias críticas. Confirmar que el jefe directo tiene un plan de integración estructurado.',
    },
    high: {
      diagnosis: 'SELECCIÓN VALIDADA',
      narrativeNormal: 'Selección validada. El recambio está funcionando. Los perfiles seleccionados responden rápido a la expectativa del rol. Si vienen de la competencia, tu propuesta de valor como empleador estaría atrayendo talento probado. Mantener el estándar.',
      narrativeShort: 'Integración exitosa. Mantener estándar de selección.',
      prevention: null,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // A2: 12-36 meses — Zona de Verdad
  // ──────────────────────────────────────────────────────────────────────────
  A2: {
    low: {
      diagnosis: 'INVERSIÓN SIN RETORNO',
      narrativeNormal: 'Inversión sin retorno. Esta persona ya pasó la curva de aprendizaje. Si no alcanza el estándar, probablemente el problema sea estructural: selección errada, promoción prematura, o planes de desarrollo que fallaron — ya sea porque no se generaron, no respondían a un diagnóstico claro, no hubo involucramiento del líder, no se dio seguimiento, o simplemente no fueron útiles. Cada mes adicional podría representar recurso desperdiciado. Postergar la conversación tiene costo.',
      narrativeShort: 'Plan de desarrollo probablemente falló, no existió nunca, o no es foco y lo ven como un trámite.',
      prevention: 'Los próximos planes de acción deben tener: diagnóstico específico de la brecha, acciones concretas (no genéricas), responsable asignado, y seguimiento trimestral documentado. Si el líder no se involucra, el plan no existe.',
    },
    high: {
      diagnosis: 'MADUREZ OPERACIONAL',
      narrativeNormal: 'Tu activo más valioso hoy. Personas que ya pasaron la curva de aprendizaje, conocen la cultura, y entregan. Aseguran continuidad operacional y son tu cantera natural de sucesores. ¿Cuántos tienen aspiración alta? Esos son tus sucesores naturales — dales ruta. ¿Cuántos tienen aspiración baja? Son expertos ancla — documenta su conocimiento antes que sea tarde.',
      narrativeShort: 'Productividad confirmada. Validar aspiración y documentación de conocimiento.',
      prevention: null,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // A3: > 36 meses — Zona de Decisiones Acumuladas
  // ──────────────────────────────────────────────────────────────────────────
  A3: {
    low: {
      diagnosis: 'DEUDA ORGANIZACIONAL',
      narrativeNormal: 'Deuda organizacional acumulada. Cada persona aquí probablemente representa años de decisiones postergadas. El costo real no es solo su salario — podría incluir sobrepago acumulado vs. mercado, días de vacaciones que no consumen y acumulan como pasivo, finiquito que crece cada mes, y un mensaje cultural a los nuevos: \'aquí se puede estar años sin rendir y no pasa nada\'. Muchos construyen un escudo de indispensabilidad — procesos que solo ellos conocen y no traspasan. Eso no es conocimiento especializado, es dependencia no gestionada. Cada mes sin decisión es un mes más de finiquito que acumulas. La pregunta no es si actuar, es cuánto te está costando no hacerlo.',
      narrativeShort: 'Decisión postergada. Definir salida. Establecer corte de 24 meses para futuros casos — no dejar acumular.',
      prevention: 'Establecer revisión obligatoria a los 24 meses de bajo desempeño. Si a los 24 meses no hay mejora demostrable, activar proceso de salida. No permitir que lleguen a 36+ meses sin decisión. El costo de postergar siempre supera el costo de actuar.',
    },
    high: {
      diagnosis: 'ACTIVO ESTRATÉGICO',
      narrativeNormal: 'Gran activo, pero frágil. ¿Tienen sucesores identificados y en desarrollo? Si no, son bomba de tiempo — el día que se vayan (renuncia, enfermedad, retiro) la empresa pierde años de conocimiento. ¿Están documentando? ¿Están formando a otros? Los que tienen alto fit y forman = multiplicadores del conocimiento. Los que tienen alto fit y no forman = concentradores de conocimiento. Ambos son valiosos hoy, pero solo los primeros reducen tu riesgo a futuro.',
      narrativeShort: 'Veterano valioso. Verificar sucesor y transferencia de conocimiento.',
      prevention: null,
    },
  },
}
