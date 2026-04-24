'use client';

// src/app/dashboard/compliance/components/ComplianceStage.tsx
// Router simple sobre activeSection → renderiza la sección correspondiente.

import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';
import SectionSintesis from './sections/SectionSintesis';
import SectionAncla from './sections/SectionAncla';
import SectionHeatmap from './sections/SectionHeatmap';
import SectionDimensiones from './sections/SectionDimensiones';
import SectionPatrones from './sections/SectionPatrones';
import SectionConvergencia from './sections/SectionConvergencia';
import SectionSimulador from './sections/SectionSimulador';
import SectionAlertas from './sections/SectionAlertas';
import SectionCierre from './sections/SectionCierre';

interface ComplianceStageProps {
  hook: UseComplianceDataReturn;
}

export default function ComplianceStage({ hook }: ComplianceStageProps) {
  switch (hook.activeSection) {
    case 'sintesis':
      return <SectionSintesis hook={hook} />;
    case 'ancla':
      return <SectionAncla hook={hook} />;
    case 'heatmap':
      return <SectionHeatmap hook={hook} />;
    case 'dimensiones':
      return <SectionDimensiones hook={hook} />;
    case 'patrones':
      return <SectionPatrones hook={hook} />;
    case 'convergencia':
      return <SectionConvergencia hook={hook} />;
    case 'simulador':
      return <SectionSimulador hook={hook} />;
    case 'alertas':
      return <SectionAlertas hook={hook} />;
    case 'cierre':
      return <SectionCierre hook={hook} />;
    default:
      return <SectionSintesis hook={hook} />;
  }
}
