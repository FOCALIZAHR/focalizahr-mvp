// ═══════════════════════════════════════════════════════════════════
// buildElNombre — Beat 5 (El Nombre) · GATE 5
// src/lib/services/compliance/buildElNombre.ts
// ═══════════════════════════════════════════════════════════════════
// Pure function — el beat de la concentración estructural: el deterioro
// converge en una RAMA del organigrama. El informe NO nombra personas; el
// nombre que se repite es una rama (unidad organizacional), no un individuo.
//
// Selección con múltiples ramas — regla "TRES LLAVES" (determinista, decisión
// Victor): protagonista = la rama que gane en orden
//   (1) señal legal en 12m dentro de la rama (denuncia > indicio > sin señal)
//   (2) tamaño del patrón (n de áreas bajo la línea)
//   (3) profundidad (peor ISA promedio del grupo)
//   desempate: managerId estable.
// El motor solo ordena por minIsa → se RE-ORDENA acá (la regla manda; el motor
// no se toca). Señal legal NO viene en el grupo → se CRUZA contra riskScores[].
//
// Narrativa del protagonista = `buildCriticalByManagerNarrative` VERBATIM
// (CASO 1, nombra sub-departamentos). Ramas secundarias = factorización +
// modal, nombradas como GERENCIA (displayName del Department padre — sello de
// privacy actualizado Gate 5).
// ═══════════════════════════════════════════════════════════════════

import {
  buildCriticalByManagerNarrative,
} from './ComplianceNarrativeEngine';
import type { CriticalByManagerGroup } from './ConvergenciaEngine';
import { LEY_KARIN_ALERT_TYPES } from '@/config/compliance/convergenciaWeights';
import { formatDepartmentName } from '@/lib/utils/formatName';
import type {
  ComplianceReportResponse,
  DepartmentRiskScore,
} from '@/types/compliance';

const LEY_KARIN_SET = new Set(LEY_KARIN_ALERT_TYPES);

// ── Copy verbatim (§2.4 postura · §6 cierre) ──
const POSTURA =
  'Este informe no nombra personas: señala la estructura. El dato dice dónde converge el problema. Quién ocupa esa rama hoy, y desde cuándo, es la conversación que sigue.';

const NUM_ES = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'] as const;
function numEs(n: number): string {
  return NUM_ES[n] ?? String(n);
}
function cap(s: string): string {
  return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface ElNombreModalBlock {
  /** Gerencia (displayName del Department padre) — fallback a sub-deptos. */
  gerencia: string;
  /** Sub-departamentos de la rama (ya con formatDepartmentName). */
  deptNames: string[];
}

export interface ElNombreFactorizacion {
  /** "Y otra(s) {n} línea(s) de mando muestra(n) el mismo patrón: {gerencias}". */
  texto: string;
  link: string;
  modal: ElNombreModalBlock[];
}

export interface ElNombreActo {
  /** Hero — # áreas de la rama protagonista. */
  n: number;
  /** Narrativa CASO 1 verbatim, con el fragmento destacado (peso 400) aislado. */
  narrativa: { destacado: string; resto: string };
  /** §2.4 postura editorial. */
  postura: string;
  /** Factorización + modal — null si una sola rama. */
  factorizacion: ElNombreFactorizacion | null;
  /** §6 cierre (número en letras). */
  cierre: string;
}

// ════════════════════════════════════════════════════════════════════════════
// INTERNAL — grupo enriquecido para la regla tres llaves
// ════════════════════════════════════════════════════════════════════════════

interface EnrichedGroup {
  group: CriticalByManagerGroup;
  /** Sub-deptos resueltos a nombre (formatDepartmentName), en orden. */
  deptNames: string[];
  /** 2=denuncia · 1=indicio · 0=sin señal (cruce con riskScores). */
  legalRank: 0 | 1 | 2;
  /** # áreas (resueltas). */
  size: number;
  /** ISA promedio del grupo (de departments[].isaScore). Infinity si sin ISA. */
  avgIsa: number;
  /** Gerencia (rama padre) — displayName, o null si no resoluble. */
  ramaName: string | null;
}

/** Señal legal de la rama: cruce con riskScores[] por departmentId. */
function legalRankOf(
  departmentIds: string[],
  rsById: Map<string, DepartmentRiskScore>,
): 0 | 1 | 2 {
  let hasDenuncia = false;
  let hasIndicio = false;
  for (const id of departmentIds) {
    const rs = rsById.get(id);
    if (!rs) continue;
    const d = rs.inputs.denuncias_12m;
    if (d !== null && d >= 1) hasDenuncia = true;
    if (rs.alertas.some((a) => a.producto === 'exit' && LEY_KARIN_SET.has(a.alertType))) {
      hasIndicio = true;
    }
  }
  return hasDenuncia ? 2 : hasIndicio ? 1 : 0;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

export function buildElNombre(data: ComplianceReportResponse): ElNombreActo | null {
  const groups = (data.data.convergencia?.criticalByManager ?? []) as CriticalByManagerGroup[];
  if (groups.length === 0) return null;

  const departments = data.data.departments ?? [];
  const riskScores = data.data.riskScores ?? [];
  const rsById = new Map<string, DepartmentRiskScore>(riskScores.map((rs) => [rs.departmentId, rs]));
  // Nombre crudo por dept (para resolver sub-deptos).
  const nameById = new Map<string, string>();
  const isaById = new Map<string, number>();
  for (const d of departments) {
    nameById.set(d.departmentId, d.departmentName);
    if (typeof d.isaScore === 'number') isaById.set(d.departmentId, d.isaScore);
  }
  // Gerencia (rama padre) por parentGerenciaId — mismo cruce que el Triage.
  const gerenciaNameById = new Map<string, string>();
  for (const rs of riskScores) {
    if (rs.parentGerenciaId && rs.parentGerenciaName) {
      gerenciaNameById.set(rs.parentGerenciaId, rs.parentGerenciaName);
    }
  }

  // ── Enriquecer cada grupo ──
  const enriched: EnrichedGroup[] = [];
  for (const group of groups) {
    const deptNames = group.departmentIds
      .map((id) => nameById.get(id))
      .filter((n): n is string => typeof n === 'string')
      .map((n) => formatDepartmentName(n));
    if (deptNames.length < 2) continue; // espejo del filtro del motor.
    const isas = group.departmentIds
      .map((id) => isaById.get(id))
      .filter((v): v is number => typeof v === 'number');
    const avgIsa = isas.length > 0 ? isas.reduce((s, v) => s + v, 0) / isas.length : Infinity;
    enriched.push({
      group,
      deptNames,
      legalRank: legalRankOf(group.departmentIds, rsById),
      size: deptNames.length,
      avgIsa,
      ramaName: gerenciaNameById.get(group.managerId) ?? null,
    });
  }
  if (enriched.length === 0) return null;

  // ── Tres llaves: legal desc → tamaño desc → ISA promedio asc → managerId. ──
  enriched.sort((a, b) => {
    if (b.legalRank !== a.legalRank) return b.legalRank - a.legalRank;
    if (b.size !== a.size) return b.size - a.size;
    if (a.avgIsa !== b.avgIsa) return a.avgIsa - b.avgIsa;
    return a.group.managerId.localeCompare(b.group.managerId);
  });

  const protagonista = enriched[0];
  const otras = enriched.slice(1);

  // ── Narrativa CASO 1 verbatim del motor (deptNames ya formateados) ──
  const deptNamesByIdFmt = new Map<string, string>();
  for (const id of protagonista.group.departmentIds) {
    const raw = nameById.get(id);
    if (raw) deptNamesByIdFmt.set(id, formatDepartmentName(raw));
  }
  const motorString = buildCriticalByManagerNarrative([protagonista.group], deptNamesByIdFmt);
  if (!motorString) return null;
  // Aislar el destacado (primera oración, hasta los deptNames) del resto.
  const splitIdx = motorString.indexOf('. ');
  const destacado = splitIdx >= 0 ? motorString.slice(0, splitIdx) : motorString;
  const resto = splitIdx >= 0 ? motorString.slice(splitIdx + 2) : '';

  const n = protagonista.size;

  // ── Factorización (solo con ≥1 rama secundaria) ──
  let factorizacion: ElNombreFactorizacion | null = null;
  if (otras.length > 0) {
    const gerencias = otras.map((g) => g.ramaName ?? g.deptNames.join(', '));
    const texto =
      otras.length === 1
        ? `Y otra línea de mando muestra el mismo patrón: ${gerencias[0]}`
        : `Y otras ${numEs(otras.length)} líneas de mando muestran el mismo patrón: ${gerencias.join(', ')}`;
    factorizacion = {
      texto,
      link: 'Ver el detalle →',
      modal: otras.map((g) => ({
        gerencia: g.ramaName ?? g.deptNames.join(', '),
        deptNames: g.deptNames,
      })),
    };
  }

  return {
    n,
    narrativa: { destacado, resto },
    postura: POSTURA,
    factorizacion,
    cierre: `${cap(numEs(n))} equipos distintos no inventan el mismo problema por separado.`,
  };
}
