// ════════════════════════════════════════════════════════════════════════════
// SECTION DIMENSIONES — encoding/decoding del triggerRef + upgrade legacy
// _shared/triggerRef.ts
// ════════════════════════════════════════════════════════════════════════════
// El triggerRef es la KEY canónica de cada decisión en `ActionPlan.decisiones`.
// Codifica scope para que el cart Map dedupe correctamente cuando hay múltiples
// scopes de la misma dimensión (ej. ORG + DEPT_TI + DEPT_Médicos).
//
// Formatos:
//   `dim:${dimensionKey}:org`               → plan organizacional
//   `dim:${dimensionKey}:dept:${deptId}`    → plan departamental
//   `dim:${dimensionKey}` (LEGACY, pre-rediseño) → tratar como org y upgrade
//
// La lógica de UI lee `targetType` / `targetId` del decision item para
// renderizar/filtrar — no parsea el triggerRef. Este archivo es la frontera.
// ════════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export type DecisionTargetType = 'organization' | 'department';

export type DecisionScope =
  | { targetType: 'organization'; targetId: null }
  | { targetType: 'department'; targetId: string };

export interface DecodedTriggerRef {
  dimensionKey: string;
  targetType: DecisionTargetType;
  /** null cuando targetType === 'organization' */
  targetId: string | null;
  /** True si el triggerRef estaba en formato legacy y se infirió 'organization'. */
  wasLegacy: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// ENCODE
// ────────────────────────────────────────────────────────────────────────────

/** Construye el triggerRef canónico desde dim + scope. */
export function encodeTriggerRef(
  dimensionKey: string,
  scope: DecisionScope
): string {
  if (scope.targetType === 'organization') {
    return `dim:${dimensionKey}:org`;
  }
  return `dim:${dimensionKey}:dept:${scope.targetId}`;
}

// ────────────────────────────────────────────────────────────────────────────
// DECODE — tolera 3 formatos: legacy, ORG y DEPT
// ────────────────────────────────────────────────────────────────────────────

/**
 * Parsea un triggerRef. Devuelve null si no es de tipo dimensión (ej. patron, alert).
 *
 * Acepta:
 *   - `dim:KEY`               → wasLegacy=true,  targetType='organization', targetId=null
 *   - `dim:KEY:org`           → wasLegacy=false, targetType='organization', targetId=null
 *   - `dim:KEY:dept:DEPTID`   → wasLegacy=false, targetType='department',   targetId=DEPTID
 *
 * Defensive parsing: si el deptId contiene ":" (raro pero posible con IDs externos),
 * se preserva como string completo via slice+join.
 */
export function decodeTriggerRef(triggerRef: string): DecodedTriggerRef | null {
  const parts = triggerRef.split(':');
  if (parts.length < 2 || parts[0] !== 'dim') return null;

  const dimensionKey = parts[1];
  if (!dimensionKey) return null;

  // Legacy (pre-rediseño): dim:KEY — sin scope explícito → org
  if (parts.length === 2) {
    return {
      dimensionKey,
      targetType: 'organization',
      targetId: null,
      wasLegacy: true,
    };
  }

  // Modern ORG: dim:KEY:org
  if (parts.length === 3 && parts[2] === 'org') {
    return {
      dimensionKey,
      targetType: 'organization',
      targetId: null,
      wasLegacy: false,
    };
  }

  // Modern DEPT: dim:KEY:dept:DEPTID (deptId puede contener `:`)
  if (parts.length >= 4 && parts[2] === 'dept') {
    const targetId = parts.slice(3).join(':');
    if (!targetId) return null;
    return {
      dimensionKey,
      targetType: 'department',
      targetId,
      wasLegacy: false,
    };
  }

  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// UPGRADE — normaliza decisiones legacy en memoria
// ────────────────────────────────────────────────────────────────────────────

/**
 * Forma mínima que debe cumplir un decision item para poder ser upgradeado.
 * Coincide con un subset de `ComplianceDecisionItem` del hook — usar generic
 * para no acoplar este archivo a la definición canónica del tipo.
 */
interface UpgradeableItem {
  triggerRef: string;
  targetType?: DecisionTargetType;
  targetId?: string | null;
}

/**
 * Aplica upgrade a UN item. Si era legacy, normaliza triggerRef a `dim:KEY:org`
 * y completa `targetType: 'organization', targetId: null`. Si ya estaba en
 * formato moderno, garantiza que `targetType`/`targetId` estén presentes.
 *
 * No-op idempotente: aplicar dos veces no rompe nada.
 */
export function upgradeDecisionItem<T extends UpgradeableItem>(
  item: T
): T & { targetType: DecisionTargetType; targetId: string | null } {
  const decoded = decodeTriggerRef(item.triggerRef);

  if (!decoded) {
    // No es un triggerRef de dimensión (ej. patron:X o alert:X) — devolver tal cual
    // pero asegurando los campos de scope con defaults seguros.
    return {
      ...item,
      targetType: item.targetType ?? 'organization',
      targetId: item.targetId ?? null,
    };
  }

  if (decoded.wasLegacy) {
    return {
      ...item,
      triggerRef: encodeTriggerRef(decoded.dimensionKey, {
        targetType: 'organization',
        targetId: null,
      }),
      targetType: 'organization',
      targetId: null,
    };
  }

  // Modern format — preservar los campos del item si están, completar desde decode si no.
  return {
    ...item,
    targetType: item.targetType ?? decoded.targetType,
    targetId: item.targetId ?? decoded.targetId,
  };
}

/**
 * Aplica upgrade a un array completo. Devuelve los items normalizados +
 * un flag `anyUpgraded` que el hook usa para gatillar un autosave inmediato
 * (persistir el formato nuevo en BD para que el próximo load no lo vea legacy).
 */
export function upgradeDecisions<T extends UpgradeableItem>(
  items: T[]
): {
  items: Array<T & { targetType: DecisionTargetType; targetId: string | null }>;
  anyUpgraded: boolean;
} {
  let anyUpgraded = false;
  const upgraded = items.map((item) => {
    const decoded = decodeTriggerRef(item.triggerRef);
    if (decoded?.wasLegacy) anyUpgraded = true;
    return upgradeDecisionItem(item);
  });
  return { items: upgraded, anyUpgraded };
}
