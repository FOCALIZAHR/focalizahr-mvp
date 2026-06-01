// src/lib/services/compliance/buckets.ts
// ════════════════════════════════════════════════════════════════════════════
// Mapeo canónico `analyzed` (4-way) → `bucket` (3-way) del módulo Ambiente Sano.
//
// Fuente ÚNICA — importada por:
//   - DepartmentRiskScoreService.ts   (bucket dentro del DepartmentRiskScore)
//   - detectSilencioConVozExterna.ts  (motor SEXTA + OTRO MUNDO)
//   - cualquier consumidor futuro que necesite la misma clasificación
//
// Util puro: sin DB, sin side-effects. Si el mapeo canónico cambia, cambia
// acá y se propaga a todos los consumidores en una sola edición.
// ════════════════════════════════════════════════════════════════════════════

import type { CoverageAnalyzedStatus } from '@/lib/services/compliance/CoverageAnalysisService';
import type { DepartmentRiskBucket } from '@/types/compliance';

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
