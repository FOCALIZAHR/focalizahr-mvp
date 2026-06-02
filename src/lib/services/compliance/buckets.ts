// src/lib/services/compliance/buckets.ts
// ════════════════════════════════════════════════════════════════════════════
// Lógica canónica del estado de un depto frente al análisis de Ambiente Sano.
// Dos funciones puras complementarias:
//
//   - `deriveAnalyzed(status, invited, responded)` → `CoverageAnalyzedStatus` (4-way)
//     Decide en qué cuadrante cae un depto desde sus inputs crudos.
//
//   - `bucketFromAnalyzed(analyzed)` → `DepartmentRiskBucket` (3-way)
//     Mapea el 4-way al bucket con el que el sistema clasifica para riesgo
//     y narrativa.
//
// Fuente ÚNICA — importada por:
//   - CoverageAnalysisService.ts      (computeCoverageAnalysis: derivación per dept)
//   - ComplianceAlertService.ts       (sexta: deriva analyzed cuando coverage
//                                       no está en scope — orchestrator background)
//   - DepartmentRiskScoreService.ts   (bucket dentro del DepartmentRiskScore)
//   - detectSilencioConVozExterna.ts  (motor SEXTA + OTRO MUNDO)
//
// Util puro: sin DB, sin side-effects. Si la lógica canónica cambia, cambia
// acá y se propaga a todos los consumidores en una sola edición.
// ════════════════════════════════════════════════════════════════════════════

import type { CoverageAnalyzedStatus } from '@/lib/services/compliance/CoverageAnalysisService';
import type { DepartmentRiskBucket } from '@/types/compliance';

/** Deriva el `analyzed` 4-way de un depto a partir de sus inputs crudos:
 *
 *   - `status === 'COMPLETED'` → `completed` (entró al motor, tiene ISA visible)
 *   - `invited === 0`          → `not_invited` (no participó del universo de la campaña)
 *   - `responded === 0`        → `no_response` (invitado, nadie respondió)
 *   - resto                    → `skipped_privacy` (invitado, alguien respondió pero
 *                                                    n<5 o el análisis no completó)
 *
 *  El orden de las ramas es significativo: `completed` precede a todo (un dept
 *  con análisis cerrado siempre cuenta como tal); `not_invited` precede a
 *  `no_response` (un dept sin invitaciones no puede ser "no respondió"). */
export function deriveAnalyzed(input: {
  /** `ComplianceAnalysis.status` per dept (COMPLETED|FAILED|PENDING|RUNNING)
   *  o `null|undefined` si no hay row para ese dept. */
  status: string | null | undefined;
  invited: number;
  responded: number;
}): CoverageAnalyzedStatus {
  if (input.status === 'COMPLETED') return 'completed';
  if (input.invited === 0) return 'not_invited';
  if (input.responded === 0) return 'no_response';
  return 'skipped_privacy';
}

/** Mapea `CoverageDeptItem.analyzed` (4-way exhaustivo) al `bucket` (3-way)
 *  con el que el sistema clasifica al depto para riesgo y narrativa:
 *   - `completed`                       → `con_isa`
 *   - `not_invited`                     → `no_invitado`
 *   - `skipped_privacy` | `no_response` → `sub_threshold` */
export function bucketFromAnalyzed(
  analyzed: CoverageAnalyzedStatus,
): DepartmentRiskBucket {
  if (analyzed === 'completed') return 'con_isa';
  if (analyzed === 'not_invited') return 'no_invitado';
  return 'sub_threshold';
}
