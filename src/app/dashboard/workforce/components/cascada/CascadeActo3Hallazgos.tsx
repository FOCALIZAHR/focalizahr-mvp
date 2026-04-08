'use client'

// ════════════════════════════════════════════════════════════════════════════
// CASCADE ACTO 3 — "Los Hallazgos" — 5 hallazgos con nombres
// Narrativas exactas del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo3Hallazgos.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import FindingCard from '../shared/FindingCard'
import { formatCurrency } from '../../utils/format'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import type { ComputedCascadeValues } from '../../hooks/useWorkforceCascade'

interface CascadeActo3Props {
  data: WorkforceDiagnosticData
  computed: ComputedCascadeValues
  onContinue: () => void
  onBack: () => void
}

export default function CascadeActo3Hallazgos({
  data,
  computed,
  onContinue,
}: CascadeActo3Props) {
  const { cantidadHallazgos } = computed
  let findingNumber = 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      {/* Hero */}
      <div className="text-center mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Acto 3</p>
        <p className="text-4xl md:text-5xl font-extralight text-white">
          {cantidadHallazgos}
        </p>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">
          situaciones que requieren decision
        </p>
      </div>

      {/* Narrativa apertura — del script */}
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-lg mx-auto text-center mb-8">
        El sistema cruzo exposicion a IA con datos de performance, compromiso, clima y estructura organizacional. El resultado: <span className="text-purple-400">{cantidadHallazgos}</span> situaciones donde la inaccion tiene consecuencias medibles.
      </p>

      {/* Hallazgos — condicionales */}
      <div className="space-y-4 mb-8">

        {/* 1. Talento Zombie */}
        {data.zombies.count > 0 && (
          <FindingCard
            number={++findingNumber}
            headline="Talento Zombie — Personas que dominan cargos que la IA va a absorber"
            narrative={`${data.zombies.count} personas dominan su cargo actual por encima del 75%. Son buenos. Entregan resultados. Pero sus cargos tienen alta exposicion a IA y su capacidad de adaptacion esta por debajo del umbral critico.`}
            consequence="El costo de reconvertirlos hoy es significativamente menor que el de desvincularlos mañana."
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="text-left text-slate-500 pb-1.5">Nombre</th>
                  <th className="text-left text-slate-500 pb-1.5">Cargo</th>
                  <th className="text-right text-slate-500 pb-1.5">Exposicion</th>
                  <th className="text-right text-slate-500 pb-1.5">Impacto</th>
                </tr>
              </thead>
              <tbody>
                {data.zombies.persons.slice(0, 5).map(p => (
                  <tr key={p.employeeId} className="border-b border-slate-800/20">
                    <td className="py-1.5 text-cyan-400">{p.employeeName}</td>
                    <td className="py-1.5 text-slate-400">{p.position}</td>
                    <td className="py-1.5 text-right text-slate-300">{Math.round(p.observedExposure * 100)}%</td>
                    <td className="py-1.5 text-right text-purple-400">{formatCurrency(p.financialImpact)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FindingCard>
        )}

        {/* 2. Fuga Aumentada */}
        {data.flightRisk.count > 0 && (
          <FindingCard
            number={++findingNumber}
            headline="Fuga Aumentada — Talento que el mercado va a cazar"
            narrative={`${data.flightRisk.count} personas tienen alta augmentacion en sus cargos, compromiso elevado, y aspiracion de crecer. Saben usar IA para multiplicar su productividad. Si no ven oportunidad de crecimiento aqui, la veran afuera.`}
            consequence="La conversacion de visibilidad tiene que ocurrir antes de que llegue la oferta externa."
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="text-left text-slate-500 pb-1.5">Nombre</th>
                  <th className="text-left text-slate-500 pb-1.5">Cargo</th>
                  <th className="text-right text-slate-500 pb-1.5">Exposicion</th>
                  <th className="text-right text-slate-500 pb-1.5">Costo reemplazo</th>
                </tr>
              </thead>
              <tbody>
                {data.flightRisk.persons.slice(0, 5).map(p => (
                  <tr key={p.employeeId} className="border-b border-slate-800/20">
                    <td className="py-1.5 text-cyan-400">{p.employeeName}</td>
                    <td className="py-1.5 text-slate-400">{p.position}</td>
                    <td className="py-1.5 text-right text-slate-300">{Math.round(p.observedExposure * 100)}%</td>
                    <td className="py-1.5 text-right text-purple-400">{formatCurrency(p.replacementCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FindingCard>
        )}

        {/* 3. Cargos Fantasma */}
        {data.redundancy.pairs.length > 0 && (
          <FindingCard
            number={++findingNumber}
            headline="Cargos Fantasma — Dos cargos haciendo el mismo trabajo"
            narrative={`El analisis de tareas detecto ${data.redundancy.pairs.length} pares de cargos con mas del 70% de overlap en responsabilidades dentro del mismo departamento. Redundancia estructural que existe por historia organizacional, no por necesidad operativa.`}
            consequence="Consolidar captura el ahorro. Postergar lo normaliza."
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="text-left text-slate-500 pb-1.5">Cargo A</th>
                  <th className="text-left text-slate-500 pb-1.5">Cargo B</th>
                  <th className="text-right text-slate-500 pb-1.5">Overlap</th>
                  <th className="text-left text-slate-500 pb-1.5">Depto</th>
                </tr>
              </thead>
              <tbody>
                {data.redundancy.pairs.slice(0, 5).map((pair, i) => (
                  <tr key={i} className="border-b border-slate-800/20">
                    <td className="py-1.5 text-slate-300">{pair.titleA}</td>
                    <td className="py-1.5 text-slate-300">{pair.titleB}</td>
                    <td className="py-1.5 text-right text-amber-400">{pair.overlapPercent}%</td>
                    <td className="py-1.5 text-slate-400">{pair.departmentName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FindingCard>
        )}

        {/* 4. No-Adopcion por Clima */}
        {data.adoptionRisk.departments.length > 0 && (
          <FindingCard
            number={++findingNumber}
            headline="No-Adopcion por Clima — Areas donde la inversion en IA esta destinada al fracaso"
            narrative={`${data.adoptionRisk.departments.length} departamentos tienen alta exposicion a IA pero compromiso por debajo del umbral critico. Cualquier inversion tecnologica en estas areas sera desperdiciada. La tecnologia no soluciona la falta de liderazgo — la amplifica.`}
            consequence="Primero el liderazgo, despues la tecnologia. El orden inverso es tirar dinero."
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="text-left text-slate-500 pb-1.5">Departamento</th>
                  <th className="text-right text-slate-500 pb-1.5">Exposicion</th>
                  <th className="text-right text-slate-500 pb-1.5">Compromiso</th>
                  <th className="text-right text-slate-500 pb-1.5">Headcount</th>
                </tr>
              </thead>
              <tbody>
                {data.adoptionRisk.departments.map(dept => (
                  <tr key={dept.departmentId} className="border-b border-slate-800/20">
                    <td className="py-1.5 text-cyan-400">{dept.departmentName}</td>
                    <td className="py-1.5 text-right text-slate-300">{Math.round(dept.avgExposure * 100)}%</td>
                    <td className="py-1.5 text-right text-amber-400">{dept.avgEngagement.toFixed(1)}</td>
                    <td className="py-1.5 text-right text-slate-400">{dept.headcount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FindingCard>
        )}

        {/* 5. Compresion de Seniority */}
        {data.seniorityCompression.opportunities.length > 0 && (
          <FindingCard
            number={++findingNumber}
            headline="Compresion de Seniority — Juniors que con IA pueden rendir como Seniors"
            narrative={`${data.seniorityCompression.opportunities.length} personas en roles de nivel intermedio tienen alta capacidad de adaptacion y estan en cargos con augmentacion superior al 60%. Con las herramientas correctas, pueden entregar al nivel del siguiente cargo.`}
            consequence="Promover capturando augmentacion es mas barato que contratar."
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="text-left text-slate-500 pb-1.5">Cargo</th>
                  <th className="text-left text-slate-500 pb-1.5">Depto</th>
                  <th className="text-right text-slate-500 pb-1.5">Ahorro anual</th>
                </tr>
              </thead>
              <tbody>
                {data.seniorityCompression.opportunities.slice(0, 5).map((opp, i) => (
                  <tr key={i} className="border-b border-slate-800/20">
                    <td className="py-1.5 text-slate-300">{opp.position}</td>
                    <td className="py-1.5 text-slate-400">{opp.departmentName}</td>
                    <td className="py-1.5 text-right text-purple-400">{formatCurrency(opp.annualSavings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FindingCard>
        )}
      </div>

      {/* Coaching tip — del script */}
      <p className="text-xs text-slate-500 font-light text-center mb-6">
        ● Cada hallazgo tiene nombre, cargo y monto. La decision de actuar o postergar tambien tiene consecuencias con nombre y monto.
      </p>

      {/* Transicion — del script */}
      <div className="text-center mb-6">
        <p className="text-sm text-slate-300 font-light italic">
          Los hallazgos estan sobre la mesa. Ahora veamos que pasa si no haces nada durante los proximos 12 meses.
        </p>
      </div>

      <div className="flex justify-center">
        <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onContinue}>
          Continuar
        </PrimaryButton>
      </div>
    </motion.div>
  )
}
