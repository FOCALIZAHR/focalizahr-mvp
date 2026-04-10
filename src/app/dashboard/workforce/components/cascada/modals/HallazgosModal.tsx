'use client'

// ════════════════════════════════════════════════════════════════════════════
// HALLAZGOS MODAL — Detalle del Acto 3 (Hallazgos)
// 5 FindingCards condicionales con tablas de personas/cargos
// Portal a document.body, z-[9999], Tesla line amber (findings = warning)
// src/app/dashboard/workforce/components/cascada/modals/HallazgosModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import FindingCard from '../../shared/FindingCard'
import { formatCurrency } from '../../../utils/format'
import type { WorkforceDiagnosticData } from '../../../types/workforce.types'

interface HallazgosModalProps {
  data: WorkforceDiagnosticData
  cantidadHallazgos: number
  onClose: () => void
}

export default function HallazgosModal({ data, cantidadHallazgos, onClose }: HallazgosModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  let findingNumber = 0

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Tesla line amber */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
            boxShadow: '0 0 20px #F59E0B',
          }}
        />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>

          {/* Header */}
          <div className="p-6 pt-8 border-b border-slate-800/50 flex-shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              Diagnostico cruzado
            </p>
            <h2 className="text-xl font-light text-white">
              {cantidadHallazgos} situaciones que requieren decision
            </h2>
            <p className="text-xs text-slate-400 font-light mt-2">
              Cada hallazgo cruza exposicion IA con performance, compromiso, clima y estructura.
            </p>
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">

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
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
