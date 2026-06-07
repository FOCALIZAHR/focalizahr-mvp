'use client';

// src/components/compliance/cascada/CascadaCompliance.tsx
// Orquestador de la Cascada Ejecutiva (Ambiente Sano).
// Stacker en scroll vertical — molde: GoalsCascada.tsx.
//
// Secuencia post-Gate 6 (2026-06-07):
//   Ancla → Beat 1 (Apertura) → Beat 2 (Triage) → Beat 3 (Anatomía)
//        → Beat 4 (Voz legacy/patrones hasta Gate 7) → Beat 5 (Nombre)
//        → Beat 6 (Síntesis/Francotirador, legacy hasta Gate 4)
//
// Removidos del render (huérfanos hasta Gate 8 borre los archivos):
//   - ActoCobertura / ActoCoberturaModal  (Beat 0 legacy descartado por MAPA)
//   - ActoSenales                          (convergencia legacy, contenido al Triage + Nombre)
//   - ActoAlertas                          (alertas legacy — Karin → ortogonal Beat 1; sexta → Beat 2)
//
// AREA_MANAGER: el endpoint envía `cascada=undefined` y `criticalByManagerNarrativa=undefined`,
// por lo que el guard `!data.narratives.cascada` oculta la cascada entera. Beat 5
// (ActoNombre) tiene su propio guard sobre la narrativa para defensa en profundidad.

import { useRef } from 'react';
import AnclaISA from './AnclaISA';
import ActoAmbiente from './ActoAmbiente';
import ActoTriage from './ActoTriage';
import ActoAnatomia from './ActoAnatomia';
import ActoVoz from './ActoVoz';
import ActoNombre from './ActoNombre';
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
      {/* Acto Ancla — portada (gauge + nodos composición) */}
      <AnclaISA data={data} onContinue={scrollToActos} />

      {/* Cascada — 6 beats bare en scroll */}
      <div ref={actosRef} className="space-y-24">
        {/* Beat 1 — La Apertura */}
        <ActoAmbiente data={data} />
        {/* Beat 2 — El Triage (Gate 6) */}
        <ActoTriage data={data} />
        {/* Beat 3 — La Anatomía (Gate 6) */}
        <ActoAnatomia data={data} />
        {/* Beat 4 — La Voz (legacy patrones LLM hasta Gate 7 → citas + género) */}
        <ActoVoz data={data} onVerDetalle={() => onNavigate('patrones')} />
        {/* Beat 5 — El Nombre (Gate 6, oculto para AREA_MANAGER) */}
        <ActoNombre data={data} />
        {/* Beat 6 — La Decisión (legacy buildCierreFrancotirador hasta Gate 4) */}
        <ActoSintesis data={data} onIrAlPlan={() => onNavigate('simulador')} />
      </div>
    </div>
  );
}
