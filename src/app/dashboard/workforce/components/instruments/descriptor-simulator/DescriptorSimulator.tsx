'use client'

// ════════════════════════════════════════════════════════════════════════════
// SIMULADOR DE CARGOS IA — motor 6 estados (Patrón G)
// DescriptorSimulator.tsx
// ════════════════════════════════════════════════════════════════════════════
// CONTENEDOR APP (Patrón G — Single Viewport):
//   max-w-4xl · h-[700px] · overflow-hidden · rounded-2xl · border · shadow-2xl
//   Cero scroll de página. Cada paso REEMPLAZA al anterior (no scroll entre).
//
// MOTOR 6 PASOS:
//   1. Revelación   — gap exposición empresa (agregado fijo)
//   2. Dolor        — inercia CLP empresa (agregado fijo)
//   3. Transición   — puente narrativo
//   4. Selección    — gerencia + cargo
//   5. Dashboard    — vista del cargo elegido (30/70 con cascada de mensaje)
//   6. Simulador    — operar tareas (30/70 con filtro por categoría)
//
// Pasos 1-2 son AGREGADO EMPRESA fijo (data prop). Los demás operan sobre
// el cargo elegido (payload cargado al confirmar selección).
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Revelacion from './pasos/Revelacion'
import Dolor from './pasos/Dolor'
import Transicion, { type TransicionVariant } from './pasos/Transicion'
import Seleccion from './pasos/Seleccion'
import Dashboard from './pasos/Dashboard'
import Workspace from './Workspace'
import ScenarioExportModal from './ScenarioExportModal'
import {
  computeLiveSimulation,
  type BetaCategory,
  type LiveSimulation,
} from './descriptor-simulator-utils'
import type { SimulatorPayload } from '@/app/api/descriptors/[id]/simulator/route'
import type {
  SimulatorDescriptorListItem,
  SimulatorListCoverage,
} from '@/app/api/descriptors/simulator-list/route'
import type { WorkforceDiagnosticData } from '../../../types/workforce.types'

type Step = 1 | 2 | 3 | 4 | 5 | 6

interface DescriptorSimulatorProps {
  /** Agregado empresa proveniente de useWorkforceData (Pasos 1-2). */
  data: WorkforceDiagnosticData
}

function buildSimulatorUrl(item: SimulatorDescriptorListItem): string | null {
  if (item.kind === 'verified' && item.descriptorId) {
    return `/api/descriptors/${item.descriptorId}/simulator`
  }
  if (item.kind === 'proposed' && item.socCode) {
    const params = new URLSearchParams({
      soc: item.socCode,
      position: item.jobTitle,
    })
    return `/api/descriptors/proposed/simulator?${params.toString()}`
  }
  return null
}

export default function DescriptorSimulator({ data }: DescriptorSimulatorProps) {
  // ── Motor 6 estados ──────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1)

  // Lista de cargos
  const [descriptorList, setDescriptorList] = useState<SimulatorDescriptorListItem[]>([])
  const [coverage, setCoverage] = useState<SimulatorListCoverage | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // Selección de cargo (sólo se carga payload al confirmar en P4)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // Payload del cargo seleccionado
  const [payload, setPayload] = useState<SimulatorPayload | null>(null)
  const [payloadLoading, setPayloadLoading] = useState(false)
  const [payloadError, setPayloadError] = useState<string | null>(null)

  // Filtro inicial para P6 (auto-seleccionado en P5 según cascada)
  const [initialFilter, setInitialFilter] = useState<BetaCategory>('rescate')

  // Export modal
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportSnapshot, setExportSnapshot] = useState<LiveSimulation | null>(null)

  // ── Cargar lista al montar ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setListLoading(true)
    setListError(null)
    fetch('/api/descriptors/simulator-list')
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (!json.success) {
          setListError(json.error || 'Error al cargar cargos')
          return
        }
        setDescriptorList(json.data as SimulatorDescriptorListItem[])
        setCoverage(json.coverage ?? null)
      })
      .catch(e => {
        if (cancelled) return
        setListError(e.message || 'Error de red')
      })
      .finally(() => {
        if (cancelled) return
        setListLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ── Cargar payload al cambiar selección ──────────────────────────────
  useEffect(() => {
    if (!selectedKey) return
    const item = descriptorList.find(d => d.key === selectedKey)
    if (!item) return
    const url = buildSimulatorUrl(item)
    if (!url) {
      setPayloadError('Cargo sin clasificación O*NET')
      setPayload(null)
      return
    }
    let cancelled = false
    setPayloadLoading(true)
    setPayloadError(null)
    setPayload(null)
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (!json.success) {
          setPayloadError(json.error || 'Error al cargar el cargo')
          return
        }
        setPayload(json.data as SimulatorPayload)
      })
      .catch(e => {
        if (cancelled) return
        setPayloadError(e.message || 'Error de red')
      })
      .finally(() => {
        if (cancelled) return
        setPayloadLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedKey, descriptorList])

  // ─────────────────────────────────────────────────────────────────────
  // AGREGADO EMPRESA — datos FIJOS para Pasos 1 y 2
  // ─────────────────────────────────────────────────────────────────────

  const revelacionData = useMemo(() => {
    let sumW = 0
    let sumWX = 0
    for (const item of descriptorList) {
      if (item.occupationFocalizaScore !== null && item.employeeCount > 0) {
        sumWX += item.employeeCount * item.occupationFocalizaScore
        sumW += item.employeeCount
      }
    }
    const benchmarkMercado = sumW > 0 ? (sumWX / sumW) * 100 : 0
    const tuEmpresa = data.exposure.avgExposure * 100
    const gap = Math.abs(benchmarkMercado - tuEmpresa)
    return { benchmarkMercado, tuEmpresa, gap }
  }, [descriptorList, data.exposure.avgExposure])

  const dolorData = useMemo(
    () => ({
      inerciaMensual: data.inertiaCost.totalMonthly,
      headcount: data.totalEmployees,
      horasMensuales: Math.round(data.liberatedFTEs.totalFTEs * 160),
    }),
    [data.inertiaCost.totalMonthly, data.totalEmployees, data.liberatedFTEs.totalFTEs],
  )

  // ─────────────────────────────────────────────────────────────────────
  // P3 — Variante de copy según exposición empresa + cargos clasificados
  // CASO D (sin datos): no hay cargos clasificados (verified+proposed=0)
  // CASO A (alta):  avgExposure >= 0.50 — hay zona de rescate dominante
  // CASO B (media): 0.30 <= avgExposure < 0.50 — solo aumentado
  // CASO C (baja):  avgExposure < 0.30 — mayoría soberanía humana
  // ─────────────────────────────────────────────────────────────────────
  const transicionVariant = useMemo<TransicionVariant>(() => {
    const cargosClasificados = descriptorList.filter(
      d => d.kind === 'verified' || d.kind === 'proposed',
    ).length
    if (cargosClasificados === 0) return 'D'
    const avg = data.exposure.avgExposure
    if (avg >= 0.5) return 'A'
    if (avg >= 0.3) return 'B'
    return 'C'
  }, [descriptorList, data.exposure.avgExposure])

  // ── Handlers ─────────────────────────────────────────────────────────
  const goStep = useCallback((s: Step) => setStep(s), [])

  const handleConfirmCargo = useCallback((key: string) => {
    setSelectedKey(key)
    setStep(5)
  }, [])

  const handleContinueToSimulador = useCallback((cat: BetaCategory) => {
    setInitialFilter(cat)
    setStep(6)
  }, [])

  const handleExport = useCallback((simulation: LiveSimulation) => {
    setExportSnapshot(simulation)
    setShowExportModal(true)
  }, [])

  const handleCloseModal = useCallback(() => setShowExportModal(false), [])

  // ─────────────────────────────────────────────────────────────────────
  // RENDER — Patrón G: container fijo h-[700px]
  // ─────────────────────────────────────────────────────────────────────

  const showAggregateLoading = listLoading
  const showAggregateError = !listLoading && listError
  const aggregateReady = !showAggregateLoading && !showAggregateError && descriptorList.length > 0

  // Pasos 5 y 6 requieren payload listo
  const detailLoading = (step === 5 || step === 6) && payloadLoading
  const detailError = (step === 5 || step === 6) && !!payloadError && !payloadLoading
  const detailEmpty = (step === 5 || step === 6) && payload !== null && payload.tasks.length === 0
  const detailReady = (step === 5 || step === 6) && payload !== null && !payloadError && !payloadLoading && payload.tasks.length > 0

  return (
    <div className="w-full min-h-screen px-4 md:px-6 lg:px-8 py-1 md:py-2 flex items-center justify-center">
      {/* CONTENEDOR APP — Patrón G · altura responsive (-35% acumulado)
          - h-[calc(100vh-160px)]: más headroom vertical
          - min-h-[500px]: piso pantallas chicas
          - max-h-[580px]: techo pantallas grandes */}
      <div className="w-full max-w-4xl mx-auto h-[calc(100vh-160px)] min-h-[500px] max-h-[580px] bg-[#0F172A] rounded-2xl border border-slate-800/50 overflow-hidden relative shadow-2xl shadow-black/20">
        {/* Loading bloqueante de la lista */}
        {showAggregateLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <Loader2 className="w-5 h-5 text-cyan-400/60 animate-spin" />
          </div>
        )}

        {/* Error bloqueante */}
        {showAggregateError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6 z-50">
            <AlertTriangle className="w-6 h-6 text-amber-400/60" />
            <p className="text-sm font-light text-slate-300 max-w-sm">
              {listError}
            </p>
          </div>
        )}

        {/* Motor 6 estados */}
        {aggregateReady && (
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="p1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <Revelacion data={revelacionData} onNext={() => goStep(2)} />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="p2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <Dolor
                  data={dolorData}
                  onNext={() => goStep(3)}
                  onBack={() => goStep(1)}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="p3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <Transicion
                  variant={transicionVariant}
                  onNext={() => goStep(4)}
                  onBack={() => goStep(2)}
                />
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="p4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <Seleccion
                  descriptors={descriptorList}
                  onConfirm={handleConfirmCargo}
                  onBack={() => goStep(3)}
                />
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="p5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                {detailLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-40">
                    <Loader2 className="w-5 h-5 text-cyan-400/60 animate-spin" />
                  </div>
                )}
                {detailError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6 z-40">
                    <AlertTriangle className="w-6 h-6 text-amber-400/60" />
                    <p className="text-sm font-light text-slate-300 max-w-sm">
                      {payloadError}
                    </p>
                  </div>
                )}
                {detailEmpty && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-40">
                    <p className="text-sm font-light text-slate-400 max-w-sm">
                      Este cargo no tiene tareas activas. Selecciona otro cargo.
                    </p>
                  </div>
                )}
                {detailReady && payload && (
                  <Dashboard
                    payload={payload}
                    onContinue={handleContinueToSimulador}
                    onBack={() => goStep(4)}
                  />
                )}
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="p6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                {detailReady && payload && (
                  <Workspace
                    payload={payload}
                    initialCategory={initialFilter}
                    descriptors={descriptorList}
                    selectedKey={selectedKey}
                    onDescriptorChange={setSelectedKey}
                    onBack={() => goStep(5)}
                    onExport={handleExport}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Modal export — fuera del contenedor app (portal) */}
      {payload && exportSnapshot && (
        <ScenarioExportModal
          isOpen={showExportModal}
          onClose={handleCloseModal}
          jobTitle={payload.jobTitle}
          baselineExposurePct={(payload.rollupClientExposure ?? 0) * 100}
          simulation={{
            capacidadLiberada: exportSnapshot.hoursLiberated,
            rescateMensual: exportSnapshot.rescateCLPTotal,
            nuevaExposicionPct: exportSnapshot.newExposurePct,
            totalAutomated: 0,
            totalAugmented: 0,
            totalHuman: payload.tasks.length,
            valorHora: payload.costPerHour,
          }}
        />
      )}
    </div>
  )
}
