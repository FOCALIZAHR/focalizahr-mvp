// ════════════════════════════════════════════════════════════════════════════
// LENTE TYPES — tipos compartidos entre los componentes de lente
// src/components/efficiency/lentes/_LentePlaceholder.tsx
// ════════════════════════════════════════════════════════════════════════════
// (El archivo conserva este nombre por compatibilidad con los imports ya
// establecidos en L1..L9 y EfficiencyHub. Su contenido actual es únicamente
// tipos — el componente placeholder fue eliminado cuando todos los lentes
// reales quedaron implementados.)
// ════════════════════════════════════════════════════════════════════════════

import type { LenteAPI } from '@/hooks/useEfficiencyWorkspace'
import type { DecisionItem } from '@/lib/services/efficiency/EfficiencyCalculator'
import type { LenteId } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

/**
 * Interfaz canónica que recibe cada componente de lente (L1..L9).
 *
 * · `lente`                 → datos pre-procesados del endpoint.
 * · `decisionesActuales`    → filtradas por el hook para este lente.
 * · `onUpsert` / `onRemove` → callbacks del carrito (dedup por `${tipo}:${id}`).
 * · `onClearLente`          → vaciar todas las decisiones del lente.
 * · `gerenciasExcluidas`    → filtrar listas locales (L3 guardarraíl).
 * · `allLentes`             → mapa completo — usado por L7+L8 que es fusión.
 * · `onNextLente`           → navegar al siguiente lente de la familia.
 *                             Usado por LenteLayout para el CTA "Siguiente →"
 *                             del Acto 3 (quirófano), condicional a interacción.
 * · `proximoLenteTitulo`    → título del siguiente lente en la familia, para
 *                             el label del CTA ("Siguiente: {titulo} →").
 */
export interface LenteComponentProps {
  lente: LenteAPI
  decisionesActuales: DecisionItem[]
  onUpsert: (item: DecisionItem) => void
  onRemove: (key: string) => void
  onClearLente: () => void
  gerenciasExcluidas: Set<string>
  allLentes?: Record<LenteId, LenteAPI>
  onNextLente?: () => void
  proximoLenteTitulo?: string
}
