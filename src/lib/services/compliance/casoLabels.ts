// ════════════════════════════════════════════════════════════════════════════
// CASO_LABELS — etiquetas legibles per caso forense Motor A (A1-A5)
// ════════════════════════════════════════════════════════════════════════════
// Single source of truth para los nombres de los 5 casos del Motor A.
// Consumido por:
//   - Backend: ComplianceNarrativeEngine.buildConvergencia → narratives
//     (frases org-digest tipo "Caso registrado: Doble confirmación.")
//   - Frontend: SectionConvergencia/_shared/SELLOS_FORENSES_LABELS.ts
//     (chip labels en BandaDepartamento). Importa desde acá.
//
// Política: cualquier cambio de copy en estos labels se hace acá UNA vez.
// ════════════════════════════════════════════════════════════════════════════

import type { CasoMotorA } from './ConvergenciaEngine';

export const CASO_LABELS: Record<CasoMotorA, string> = {
  A1: 'Doble confirmación',
  A2: 'Teatro detectado',
  A3: 'Sesgo de género',
  A4: 'Variable de liderazgo',
  A5: 'Silencio bajo promedio alto',
};
