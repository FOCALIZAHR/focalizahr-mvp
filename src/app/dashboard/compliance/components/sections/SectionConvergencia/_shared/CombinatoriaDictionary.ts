// ════════════════════════════════════════════════════════════════════════════
// COMBINATORIA DICTIONARY — narrativa per-banda C3 "Las Señales"
// ════════════════════════════════════════════════════════════════════════════
//
// Frase canónica por departamento según la combinatoria de fuentes que se
// gatilla. La función evalúa las 8 reglas en orden estricto y retorna la
// PRIMERA que aplique. El orden importa: las reglas más graves o más
// específicas van primero.
//
// Strings literales — auditados contra las 6 Reglas de Oro de
// `focalizahr-narrativas`. NO modificar el copy sin re-auditoría.
//
// Consumidor: cada banda en SectionConvergencia. Si la función retorna null,
// la banda renderiza solo los chips estándar sin frase de combinatoria.
// ════════════════════════════════════════════════════════════════════════════

import type { MergedDept } from './helpers';

/**
 * Evalúa la combinatoria de fuentes del departamento y retorna la frase
 * narrativa correspondiente. Orden de evaluación estricto — la primera regla
 * que matchea gana, las posteriores no se evalúan.
 *
 * Retorna `null` si ninguna combinatoria aplica (banda sin frase).
 */
export function getCombinatoriaNarrative(dept: MergedDept): string | null {
  const isa = dept.isaScore;
  const eis = dept.convergenciaExterna.eisSignal;
  const exo = dept.convergenciaExterna.exoSignal;
  const casos = dept.convergenciaInterna.casosActivos;

  // Regla 1 — Huella del gerente
  if (dept.convergenciaInterna.enCriticalByManagerGroup) {
    return 'El mismo liderazgo aparece como responsable en múltiples áreas críticas. El problema no respeta los límites del departamento. Viaja con quien lo dirige.';
  }

  // Regla 2 — Teatro detectado
  if ((casos.includes('A2') || casos.includes('A5')) && eis >= 1) {
    return 'Ambiente Sano registra un área sin señales. Las encuestas de quienes se fueron dicen lo contrario. Alguien no está diciendo lo que realmente ocurre — o aprendió que no conviene hacerlo.';
  }

  // Regla 3 — Acumulación tres fuentes
  if (isa !== null && isa < 50 && eis >= 1 && exo >= 1) {
    return 'Ambiente dice riesgo. Exit confirma salidas. Onboarding muestra que los nuevos lo detectan rápido. Esto no es un problema de percepción. Es un problema estructural confirmado por tres fuentes independientes.';
  }

  // Regla 4 — Señal ignorada
  if (dept.senalIgnorada) {
    return 'Esto fue detectado hace meses. Se cerró el caso en el sistema pero la situación se deterioró. El costo de no actuar ya se materializó.';
  }

  // Regla 5 — Ambiente + Exit
  if (isa !== null && isa < 50 && eis >= 1) {
    return 'Ambiente Sano detectó riesgo. Las personas que se fueron lo nombraron como razón. Cuando los que se quedan y los que se van dicen lo mismo, no es coincidencia — es confirmación.';
  }

  // Regla 6 — Ambiente + Onboarding
  if (isa !== null && isa < 50 && exo >= 1) {
    return 'Ambiente Sano detectó señales de riesgo. Los nuevos talentos lo confirman antes de cumplir 30 días. El problema es visible desde afuera.';
  }

  // Regla 7 — Resignación aprendida (ambiente crítico sin alertas externas).
  // Subvariantes por caso A (P1b mayo 2026): el insight de "resignación" es
  // invariante, pero la evidencia concreta del ambiente bajo cambia según
  // el caso forense. Prioridad: A3 > A1 > default (severidad subjetiva — A3
  // implica exposición legal explícita por sesgo de género).
  // A2 deliberadamente NO tiene subvariante propia — cae al default.
  // A4 (criticalByManager) y A5 (ISA alto) no pueden coexistir con esta regla.
  //
  // Nota: orden de prioridad por severidad ≠ orden de Motor 1 (lexicográfico
  // en `describeCasos`). Inconsistencia conocida pero diferida — solo se hace
  // visible en deptos con casos múltiples, ausente en QA actual. Ver memoria
  // `project_motor1_motor6_orden_casos_inconsistencia.md`.
  if (isa !== null && isa < 50 && eis === 0 && exo === 0) {
    if (casos.includes('A3')) {
      return 'Hay sesgo de género visible en este departamento, y aun así nadie se va. La gente afectada aprendió a mimetizarse en lugar de irse — porque irse no garantiza llegar a otro lugar mejor. La resignación no se distribuye igual entre todos.';
    }
    if (casos.includes('A1')) {
      return 'El equipo confirma con números y con lo que escribió que el ambiente está deteriorado, y aun así nadie se va. Cuando hablar y quedarse conviven en el mismo silencio, el equipo ya internalizó que reportar no cambia nada.';
    }
    return 'Ambiente Sano registra condiciones críticas, pero nadie se va. Que nadie renuncie en un ambiente hostil no es lealtad — es resignación aprendida o falta de opciones.';
  }

  // Regla 8 — Deterioro sostenido
  if (dept.deterioroPulso) {
    return 'Ambiente Sano registra una caída sostenida en este departamento por tercer período consecutivo. No es una mala foto — es una película, y va en una sola dirección.';
  }

  return null;
}
