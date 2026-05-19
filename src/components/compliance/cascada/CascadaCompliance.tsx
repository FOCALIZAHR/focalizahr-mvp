'use client';

// src/components/compliance/cascada/CascadaCompliance.tsx
// Orquestador de la Cascada Ejecutiva (Ambiente Sano).
// Stacker en scroll vertical — molde: GoalsCascada.tsx.
// Acto Ancla (card) + 5 actos (bare). Cada acto trae su propio ActSeparator.

import { useRef } from 'react';
import AnclaISA from './AnclaISA';
import ActoAmbiente from './ActoAmbiente';
import ActoVoz from './ActoVoz';
import ActoSenales from './ActoSenales';
import ActoAlertas from './ActoAlertas';
import ActoSintesis from './ActoSintesis';
import type { ComplianceReportResponse, ComplianceSectionId } from '@/types/compliance';

interface CascadaComplianceProps {
  data: ComplianceReportResponse;
  /** Enruta los SubtleLink / CTA a la sección de destino del Rail. */
  onNavigate: (section: ComplianceSectionId) => void;
}

export default function CascadaCompliance({ data, onNavigate }: CascadaComplianceProps) {
  const actosRef = useRef<HTMLDivElement>(null);

  // Sin narrativas de cascada (campaña sin ISA / AREA_MANAGER) → no se renderiza.
  if (!data.narratives.cascada) return null;

  const scrollToActos = () =>
    actosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="space-y-24 pb-12">
      {/* Acto Ancla — card contenida */}
      <AnclaISA data={data} onContinue={scrollToActos} />

      {/* Cascada — 5 actos bare en scroll */}
      <div ref={actosRef} className="space-y-24">
        <ActoAmbiente data={data} onVerDetalle={() => onNavigate('dimensiones')} />
        <ActoVoz data={data} onVerDetalle={() => onNavigate('patrones')} />
        <ActoSenales data={data} onVerDetalle={() => onNavigate('convergencia')} />
        <ActoAlertas data={data} onVerDetalle={() => onNavigate('alertas')} />
        <ActoSintesis data={data} onIrAlPlan={() => onNavigate('simulador')} />
      </div>
    </div>
  );
}
