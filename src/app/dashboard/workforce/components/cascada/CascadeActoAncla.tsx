'use client'

// ════════════════════════════════════════════════════════════════════════════
// CASCADE ACTO ANCLA — Composicion del % con AnclaInteligente
// Narrativas exactas del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeActoAncla.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import AnclaInteligente from '@/components/executive/AnclaInteligente'
import type { AnclaComponent } from '@/components/executive/AnclaInteligente'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import type { ComputedCascadeValues } from '../../hooks/useWorkforceCascade'

interface CascadeActoAnclaProps {
  data: WorkforceDiagnosticData
  computed: ComputedCascadeValues
  onContinue: () => void
  onBack: () => void
}

export default function CascadeActoAncla({
  data,
  computed,
  onContinue,
}: CascadeActoAnclaProps) {
  const exposureScore = Math.round(data.exposure.avgExposure * 100)
  const autoOrg = Math.round(data.orgAutomationShare * 100)
  const augOrg = Math.round(data.orgAugmentationShare * 100)
  const expGerencia = Math.round(computed.gerenciaMas.avgExposure * 100)

  const components: AnclaComponent[] = [
    {
      value: autoOrg,
      label: 'Automatizacion vs Augmentacion',
      narrative: `${autoOrg}% corresponde a tareas que la IA puede ejecutar sin intervencion humana. El ${augOrg}% restante son tareas donde la IA potencia la productividad pero no reemplaza a la persona.`,
      suffix: '%',
    },
    {
      value: expGerencia,
      label: computed.gerenciaMas.name,
      narrative: `La gerencia mas expuesta con ${expGerencia}% de exposicion y ${computed.gerenciaMas.headcount} personas.`,
      suffix: '%',
    },
    {
      value: Math.round(data.liberatedFTEs.totalFTEs),
      label: 'FTE Atrapados',
      narrative: 'Capacidad equivalente que la IA puede absorber hoy.',
      suffix: '',
    },
    {
      value: data.zonaCriticaCount,
      label: 'Zona Critica',
      narrative: `${data.zonaCriticaCount} personas con mas del 70% de exposicion y baja capacidad de adaptacion.`,
      suffix: ' personas',
      tooltip: 'Personas con >70% de exposicion a IA y baja capacidad de adaptacion = riesgo inminente',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      <AnclaInteligente
        score={exposureScore}
        scoreLabel="Exposicion Organizacional"
        components={components}
        onContinue={onContinue}
        ctaLabel="Ver diagnostico completo"
      />
    </motion.div>
  )
}
