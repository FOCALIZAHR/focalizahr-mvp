'use client';

// src/app/dashboard/compliance/components/ComplianceStage.tsx
// Child del AnimatePresence del Orchestrator. Motion wrapper + switch
// sobre activeSection → renderiza la sección correspondiente.
// El key externo vive en el Orchestrator (key={`section-${activeSection}`}).

import { motion } from 'framer-motion';
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

function renderSection(hook: UseComplianceDataReturn) {
  switch (hook.activeSection) {
    case 'sintesis':     return <SectionSintesis     hook={hook} />;
    case 'ancla':        return <SectionAncla        hook={hook} />;
    case 'heatmap':      return <SectionHeatmap      hook={hook} />;
    case 'dimensiones':  return <SectionDimensiones  hook={hook} />;
    case 'patrones':     return <SectionPatrones     hook={hook} />;
    case 'convergencia': return <SectionConvergencia hook={hook} />;
    case 'simulador':    return <SectionSimulador    hook={hook} />;
    case 'alertas':      return <SectionAlertas      hook={hook} />;
    case 'cierre':       return <SectionCierre       hook={hook} />;
    default:             return <SectionSintesis     hook={hook} />;
  }
}

export default function ComplianceStage({ hook }: ComplianceStageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 220, damping: 30 },
      }}
      exit={{
        opacity: 0,
        scale: 0.97,
        y: -12,
        transition: { duration: 0.15 },
      }}
      className="w-full max-w-5xl"
    >
      {renderSection(hook)}
    </motion.div>
  );
}
