'use client';

// src/components/compliance/cascada/AnclaISA.tsx
// Acto Ancla de la Cascada Ejecutiva (Ambiente Sano).
// Wrapper sobre AnclaInteligente (componente canónico) — NO clona, importa directo.
// Construye los nodos desde data.isaComponents (desglose org-level del ISA).

import AnclaInteligente, {
  type AnclaComponent,
} from '@/components/executive/AnclaInteligente';
import {
  buildNodoDimensionesNarrativa,
  buildNodoAnalisisNarrativa,
  buildNodoConvergenciaNarrativa,
  buildWeightNote,
  CONVERGENCIA_TOOLTIP,
  PREDICTOR_TOOLTIP,
} from '@/lib/services/compliance/CascadaNarrativeDictionary';
import { getISARiskLevel, type ISARiskLevel } from '@/lib/services/compliance/ISAService';
import type { ComplianceReportResponse } from '@/types/compliance';

interface AnclaISAProps {
  data: ComplianceReportResponse;
  onContinue: () => void;
}

/** Color del arco del gauge según el tier de riesgo del ISA. */
const ISA_GAUGE_HEX: Record<ISARiskLevel, string> = {
  saludable: '#22D3EE',
  observacion: '#F59E0B',
  riesgo: '#F59E0B',
  critico: '#A78BFA',
};

export default function AnclaISA({ data, onContinue }: AnclaISAProps) {
  const orgISA = data.data.orgISA;
  const comp = data.data.isaComponents;

  // Sin ISA o sin desglose (campañas legacy) → no hay Acto Ancla.
  if (orgISA === null || comp === null) return null;

  const nodes: AnclaComponent[] = [
    {
      value: comp.vozEstructurada,
      label: 'DIMENSIONES',
      narrative: buildNodoDimensionesNarrativa(comp.vozEstructurada),
    },
  ];

  if (comp.vozLibre !== null) {
    nodes.push({
      value: comp.vozLibre,
      label: 'ANÁLISIS IA',
      narrative: buildNodoAnalisisNarrativa(comp.vozLibre),
    });
  }

  if (comp.convergencia !== null) {
    nodes.push({
      value: comp.convergencia,
      label: 'CONVERGENCIA',
      narrative: buildNodoConvergenciaNarrativa(comp.convergencia),
      tooltip: CONVERGENCIA_TOOLTIP,
    });
  }

  // Ancla científica — último nodo, estático (sin micro-barra proporcional).
  nodes.push({
    value: 10,
    suffix: 'x',
    label: 'PREDICTOR #1 DE ROTACIÓN',
    narrative: 'La cultura tóxica predice la salida antes que el sueldo.',
    tooltip: PREDICTOR_TOOLTIP,
    isStatic: true,
  });

  return (
    <AnclaInteligente
      score={orgISA}
      scoreLabel="ÍNDICE DE AMBIENTE"
      scoreSuffix=""
      gaugeColor={ISA_GAUGE_HEX[getISARiskLevel(orgISA)]}
      components={nodes}
      weightNote={buildWeightNote(comp.pesos)}
      ctaLabel="Ver diagnóstico completo"
      onContinue={onContinue}
    />
  );
}
