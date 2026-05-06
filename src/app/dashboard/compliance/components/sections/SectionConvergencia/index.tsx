'use client';

// SectionConvergencia (C3 "Las Señales") — state machine top-level.
//
// 3 sub-vistas según `classifyConvergencia(report)`:
//   - una_sola_fuente → <VisionParcial />        (1 fuente activa)
//   - parciales       → <SenalesParciales />     (2+ fuentes, sin convergencia crítica)
//   - confirmada      → <ConvergenciaConfirmada /> (convergente/critico O criticalByManager poblado)
//
// Tokens canónicos compliance: chrome propio por sub-vista (sin SectionShell),
// igual al patrón de C2 SectionPatrones.
//
// Consumer: ComplianceStage.tsx pasa `hook` — mantenido como prop público para
// compat con el switch del orchestrator. El componente extrae `report` y
// despacha al sub-componente correspondiente.

import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';
import VisionParcial from './VisionParcial';
import SenalesParciales from './SenalesParciales';
import ConvergenciaConfirmada from './ConvergenciaConfirmada';
import { classifyConvergencia } from './_shared/helpers';

interface Props {
  hook: UseComplianceDataReturn;
}

export default function SectionConvergencia({ hook }: Props) {
  const report = hook.report;

  // Defensive: report null o departments vacío → la sección no aplica.
  // (El Rail puede rutear acá pero sin data no hay nada que mostrar.)
  if (!report) return null;
  if (report.data.convergencia.departments.length === 0) return null;

  const condicion = classifyConvergencia(report);

  switch (condicion) {
    case 'una_sola_fuente':
      return <VisionParcial report={report} />;
    case 'parciales':
      return <SenalesParciales report={report} />;
    case 'confirmada':
      return <ConvergenciaConfirmada report={report} />;
  }
}
