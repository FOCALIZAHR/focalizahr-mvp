// src/lib/services/compliance/detectSilencioConVozExterna.ts
// ════════════════════════════════════════════════════════════════════════════
// Motor puro de detección — SEXTA (silencio con voz externa) + OTRO MUNDO
// (punto ciego: no invitados con señal externa).
//
// Diseño (spec §2-A):
//   - Recibe candidatos YA armados (depto + analyzed + alertas con pesoEfectivo)
//     + bucketTarget + umbralPeso.
//   - NO carga datos. NO consulta DB. NO sabe de ventana ni de fechas.
//   - La carga / ventana temporal vive en el CALLER (`computeOtroMundo` para d,
//     `createSilencioConVozExternaAlerts` para a). El motor es pura lógica de
//     filtrado y se testea con inputs sintéticos.
//
// Dos invocaciones, dos colecciones — NO fusionar salidas:
//   - bucketTarget = 'sub_threshold' → SEXTA (dentro del estudio, A o B)
//   - bucketTarget = 'no_invitado'   → OTRO MUNDO (fuera del estudio)
//
// La narrativa final (paso c) decide copy; este motor sólo emite estructura.
// ════════════════════════════════════════════════════════════════════════════

import type { CoverageAnalyzedStatus } from '@/lib/services/compliance/CoverageAnalysisService';
import type { DepartmentRiskAlertItem } from '@/types/compliance';
import { bucketFromAnalyzed } from './buckets';
import { ALERTAS_CRITICAS } from '@/config/compliance/convergenciaWeights';

/** Universo target del motor. `con_isa` está siempre excluido (ya entra al
 *  análisis normal vía riskScores con score y banda). */
export type SilencioBucketTarget = 'sub_threshold' | 'no_invitado';

/** Entrada del motor — un depto candidato a ser SEXTA u OTRO MUNDO.
 *  Las alertas vienen YA cargadas con `pesoEfectivo` por el caller. */
export interface SilencioCandidate {
  departmentId: string;
  departmentName: string;
  /** 4-way exhaustivo del coverage. */
  analyzed: CoverageAnalyzedStatus;
  /** Alertas externas activas del depto (ya filtradas por ventana en el caller). */
  alertas: DepartmentRiskAlertItem[];
}

/** Salida del motor — un depto detectado con voz externa de peso suficiente. */
export interface SilencioDetected {
  departmentId: string;
  departmentName: string;
  analyzed: CoverageAnalyzedStatus;
  /** Sub-sabor anclado a `analyzed`, NO a participación (spec §4):
   *   - 'A' = skipped_privacy (ISA suprimido por privacy, n<5 respondieron)
   *   - 'B' = no_response (cero respuestas)
   *   - null = not_invited (no aplica sub-sabor en OTRO MUNDO) */
  saborSub: 'A' | 'B' | null;
  /** Cantidad de alertas externas con `pesoEfectivo ≥ umbralPeso`. */
  signalsCount: number;
  /** Mayor `pesoEfectivo` entre las señales que pasaron el umbral. */
  pesoMaximo: number;
  /** Señal externa dominante entre las que pasaron el umbral — el dato
   *  específico que el colapso a conteo había perdido (Nivel 2). Pick: Ley
   *  Karin con `pesoEfectivo > 0` gana primero, si no el de mayor `pesoEfectivo`
   *  (espejo de `resolveDepartmentRiskNarrative` 2a). Estructuralmente
   *  compatible con `AmplificadorSenal` (cascada AS). `undefined` solo si no
   *  hubo señales válidas (defensive — el item solo se emite con ≥1). */
  senalDominante?: {
    producto: 'exit' | 'onboarding';
    /** alertType canónico (`ley_karin`, `DESENGANCHE_CULTURAL`, …). Dato, no copy. */
    alertType: string;
    /** `pesoEfectivo` del dominante (proxy de severidad). */
    severidad: number;
    /** `alertType ∈ ALERTAS_CRITICAS`. */
    esCritica: boolean;
  };
}

/** Mapea `analyzed` (4-way) al sub-sabor de la SEXTA.
 *  Sólo aplica si el depto pertenece al bucket 'sub_threshold'. */
function saborSubFromAnalyzed(
  analyzed: CoverageAnalyzedStatus,
): 'A' | 'B' | null {
  if (analyzed === 'skipped_privacy') return 'A';
  if (analyzed === 'no_response') return 'B';
  return null;
}

/**
 * Filtra los candidatos del `bucketTarget` que tengan ≥1 alerta externa con
 * `pesoEfectivo ≥ umbralPeso`. Para cada uno emite un item con sub-sabor y
 * conteo de señales que superaron el umbral.
 *
 * Determinístico y testeable: una entrada → una salida. La clasificación
 * `analyzed → bucket` usa `bucketFromAnalyzed` (fuente única del módulo) —
 * si el mapeo canónico cambia, el motor lo sigue automáticamente.
 */
export function detectSilencioConVozExterna(
  candidatos: SilencioCandidate[],
  bucketTarget: SilencioBucketTarget,
  umbralPeso: number,
): SilencioDetected[] {
  const out: SilencioDetected[] = [];

  for (const candidato of candidatos) {
    if (bucketFromAnalyzed(candidato.analyzed) !== bucketTarget) continue;

    const senalesValidas = candidato.alertas.filter(
      (a) => a.pesoEfectivo >= umbralPeso,
    );
    if (senalesValidas.length === 0) continue;

    const pesoMaximo = senalesValidas.reduce(
      (max, a) => (a.pesoEfectivo > max ? a.pesoEfectivo : max),
      0,
    );

    // Dominante: Ley Karin con peso > 0 primero, si no el de mayor pesoEfectivo.
    const dom =
      senalesValidas.find(
        (a) => a.alertType === 'ley_karin' && a.pesoEfectivo > 0,
      ) ??
      senalesValidas.reduce((best, a) =>
        a.pesoEfectivo > best.pesoEfectivo ? a : best,
      );

    out.push({
      departmentId: candidato.departmentId,
      departmentName: candidato.departmentName,
      analyzed: candidato.analyzed,
      saborSub:
        bucketTarget === 'sub_threshold'
          ? saborSubFromAnalyzed(candidato.analyzed)
          : null,
      signalsCount: senalesValidas.length,
      pesoMaximo,
      senalDominante: {
        producto: dom.producto,
        alertType: dom.alertType,
        severidad: dom.pesoEfectivo,
        esCritica: ALERTAS_CRITICAS.includes(dom.alertType),
      },
    });
  }

  return out;
}
