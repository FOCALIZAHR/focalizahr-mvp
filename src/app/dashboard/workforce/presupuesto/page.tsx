'use client'

// Shell del Wizard de Presupuesto Inteligente de Dotacion.
// Pagina unica con useState en padre — patron CalibrationWizard.
// Steps se renderizan condicionalmente. Estado no persiste entre refresh
// (por diseño — v1.1 agregara BudgetScenario persistente).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import ScenarioSelector from '@/components/workforce/presupuesto/ScenarioSelector'
import ChangeBanner from '@/components/workforce/presupuesto/ChangeBanner'
import SaveScenarioModal from '@/components/workforce/presupuesto/SaveScenarioModal'
import WizardStepNav from '@/components/workforce/presupuesto/WizardStepNav'
import DotacionBaseTable from '@/components/workforce/presupuesto/DotacionBaseTable'
import FamiliaCargoSelector from '@/components/workforce/presupuesto/FamiliaCargoSelector'
import MovimientosTable from '@/components/workforce/presupuesto/MovimientosTable'
import SupuestosMacroForm from '@/components/workforce/presupuesto/SupuestosMacroForm'
import ProvisionesTable from '@/components/workforce/presupuesto/ProvisionesTable'
import ResultadoMensual from '@/components/workforce/presupuesto/ResultadoMensual'
import {
  SUPUESTOS_DEFAULT,
  type DotacionBaseResponse,
  type Movimiento,
  type MovimientosResponse,
  type PasoWizard,
  type ProvisionesResponse,
  type ResultadoResponse,
  type SupuestosMacro,
} from '@/components/workforce/presupuesto/types'

let movId = 0
const nextId = () => `mov-${++movId}-${Date.now()}`

export default function PresupuestoWizardPage() {
  const router = useRouter()

  // ── Estado del wizard (patron CalibrationWizard, NO Context) ────────
  const [pasoActual, setPasoActual] = useState<PasoWizard>(1)
  const [pasosCompletados, setPasosCompletados] = useState<PasoWizard[]>([])

  // Año presupuestario — no persiste en Entrega A, vive solo en estado local.
  // Default: proximo año (presupuestos se arman por adelantado).
  const [anoPresupuestario, setAnoPresupuestario] = useState<number>(
    new Date().getFullYear() + 1,
  )
  const [dotacionBase, setDotacionBase] = useState<DotacionBaseResponse | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [movimientosAgregado, setMovimientosAgregado] = useState<MovimientosResponse | null>(null)
  const [supuestos, setSupuestos] = useState<SupuestosMacro>(SUPUESTOS_DEFAULT)
  const [provisionesData, setProvisionesData] = useState<ProvisionesResponse | null>(null)
  const [provisionesSeleccionadas, setProvisionesSeleccionadas] = useState<string[]>([])
  // Mes de salida override por persona (Paso 4). Si no esta, se usa supuestos.mesSalidas.
  const [mesesSalidaPorPersona, setMesesSalidaPorPersona] = useState<Record<string, number>>({})
  // IDs de listaRoja recibidos de /provisiones — se reenvian opacos a /resultado
  // para que el backend calcule aniversarios evitables sin recalcular el ranking.
  const [prescindiblesIds, setPrescindiblesIds] = useState<string[]>([])
  // Overrides por movimiento: key = movimientoKey (acotadoGroup::cargo),
  // value = employeeIds que el CEO decidio incluir en lugar del ranking default.
  const [salidasOverrides, setSalidasOverrides] = useState<Record<string, string[]>>({})
  const [resultado, setResultado] = useState<ResultadoResponse | null>(null)

  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingProvisiones, setLoadingProvisiones] = useState(false)
  const [loadingResultado, setLoadingResultado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Persistencia escenarios (Entrega B) ─────────────────────────────
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [scenarioLoaded, setScenarioLoaded] = useState<{
    id: string; name: string; createdAt: string
  } | null>(null)
  const [cambiosDetectados, setCambiosDetectados] = useState<{
    hayCambios: boolean
    personasSalieron: string[]
    prescindiblesSalieron: string[]
    deltaHeadcount: number
    deltaMasaSalarial: number
    headcountActual: number
    headcountAlGuardar: number
  } | null>(null)
  const [showSelector, setShowSelector] = useState(true)

  // ── Carga inicial del Paso 1 ────────────────────────────────────────
  useEffect(() => {
    let active = true
    const loadBase = async () => {
      try {
        setLoadingBase(true)
        const res = await fetch('/api/workforce/presupuesto/base', {
          credentials: 'include',
        })
        const json = await res.json()
        if (!active) return
        if (!json.success) {
          setError(json.error ?? 'No se pudo cargar la organizacion')
          return
        }
        setDotacionBase(json.data)
      } catch (e) {
        if (!active) return
        setError(e instanceof Error ? e.message : 'Error de red')
      } finally {
        if (active) setLoadingBase(false)
      }
    }
    loadBase()
    return () => {
      active = false
    }
  }, [])

  const marcarCompletado = useCallback((paso: PasoWizard) => {
    setPasosCompletados(prev => (prev.includes(paso) ? prev : [...prev, paso]))
  }, [])

  // ── Paso 1 → Paso 2 ─────────────────────────────────────────────────
  const handleConfirmBase = () => {
    marcarCompletado(1)
    setPasoActual(2)

    // Sembrar rotacion historica en supuestos si es la primera vez
    if (dotacionBase && supuestos.rotacionEsperada === SUPUESTOS_DEFAULT.rotacionEsperada) {
      setSupuestos(prev => ({ ...prev, rotacionEsperada: dotacionBase.rotacionHistorica }))
    }
  }

  // ── Paso 2: movimientos ─────────────────────────────────────────────
  const recalcularMovimientos = useCallback(
    async (lista: Movimiento[]) => {
      if (lista.length === 0) {
        setMovimientosAgregado(null)
        return
      }
      try {
        const res = await fetch('/api/workforce/presupuesto/movimientos', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            movimientos: lista.map(m => ({
              acotadoGroup: m.acotadoGroup,
              cargo: m.cargo,
              delta: m.delta,
              mesInicio: m.mesInicio,
            })),
          }),
        })
        const json = await res.json()
        if (!json.success) {
          setError(json.error ?? 'Error calculando movimientos')
          return
        }
        const resp: MovimientosResponse = json.data
        setMovimientosAgregado(resp)
        setMovimientos(prev =>
          prev.map((m, idx) => {
            const proc = resp.movimientosProcesados[idx]
            if (!proc) return m
            return {
              ...m,
              impactoMensual: proc.impactoMensual,
              impactoAnual: proc.impactoAnual,
              bloqueado: proc.bloqueado,
              motivo: proc.motivo,
              warningIntocables: proc.warningIntocables,
            }
          }),
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error de red')
      }
    },
    [],
  )

  const handleAgregarMovimiento = (entry: {
    acotadoGroup: string
    cargo: string
    delta: number
  }) => {
    const nuevo: Movimiento = {
      id: nextId(),
      acotadoGroup: entry.acotadoGroup,
      cargo: entry.cargo,
      delta: entry.delta,
      mesInicio: 1,
      impactoMensual: 0,
      impactoAnual: 0,
    }
    const lista = [...movimientos, nuevo]
    setMovimientos(lista)
    recalcularMovimientos(lista)
  }

  const handleEliminarMovimiento = (id: string) => {
    const lista = movimientos.filter(m => m.id !== id)
    setMovimientos(lista)
    recalcularMovimientos(lista)
  }

  const handleContinueMovimientos = () => {
    marcarCompletado(2)
    setPasoActual(3)
  }

  // ── Paso 3 → Paso 4: carga lista roja con supuestos del wizard ──────
  // Acepta overrides explicitos para permitir swap sincrono despues de un
  // setState (evita usar state stale).
  const cargarProvisiones = useCallback(
    async (overridesArg?: Record<string, string[]>) => {
      const overrides = overridesArg ?? salidasOverrides
      try {
        setLoadingProvisiones(true)
        const res = await fetch('/api/workforce/presupuesto/provisiones', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ipcPorcentaje: supuestos.ipcPorcentaje,
            factorAmplificacion: supuestos.factorAmplificacion,
            movimientos: movimientos
              .filter(m => m.delta < 0 && !m.bloqueado)
              .map(m => ({
                acotadoGroup: m.acotadoGroup,
                cargo: m.cargo,
                delta: m.delta,
              })),
            salidasOverrides: overrides,
          }),
        })
        const json = await res.json()
        if (!json.success) {
          setError(json.error ?? 'No se pudo cargar la lista de salidas')
          return
        }
        const data = json.data as ProvisionesResponse
        setProvisionesData(data)
        setPrescindiblesIds(data.listaRoja.map(r => r.employeeId))
        // Pre-seleccionar: todas las salidas planificadas + prescindibles auto.
        // Solo primera carga.
        const yaCargado = provisionesSeleccionadas.length > 0
        if (!yaCargado) {
          const preSel = [
            ...data.salidasPlanificadas.map(r => r.employeeId),
            ...data.listaRoja.filter(r => !r.bloqueado).map(r => r.employeeId),
          ]
          setProvisionesSeleccionadas(preSel)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error de red')
      } finally {
        setLoadingProvisiones(false)
      }
    },
    [
      supuestos.ipcPorcentaje,
      supuestos.factorAmplificacion,
      movimientos,
      salidasOverrides,
      provisionesSeleccionadas.length,
    ],
  )

  const handleContinueSupuestos = () => {
    marcarCompletado(3)
    setPasoActual(4)
    cargarProvisiones()
  }

  // ── Paso 4: toggle seleccion ────────────────────────────────────────
  const handleToggleProvision = (employeeId: string) => {
    setProvisionesSeleccionadas(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId],
    )
  }

  const handleMesSalidaChange = (employeeId: string, mes: number) => {
    setMesesSalidaPorPersona(prev => ({ ...prev, [employeeId]: mes }))
  }

  // Swap de persona dentro de un movimiento: reemplaza quien esta en
  // salidasPlanificadas por otro del mismo cargo. Provoca re-fetch
  // de /provisiones con el nuevo override (pasado directo, sin esperar state).
  const handleSwapProvision = (movimientoKey: string, fromId: string, toId: string) => {
    const currentIds =
      salidasOverrides[movimientoKey] ??
      (provisionesData?.salidasPlanificadas
        .filter(s => s.movimientoKey === movimientoKey)
        .map(s => s.employeeId) ??
        [])
    const nextForKey = currentIds.filter(id => id !== fromId).concat(toId)
    const newOverrides = { ...salidasOverrides, [movimientoKey]: nextForKey }
    setSalidasOverrides(newOverrides)
    setProvisionesSeleccionadas(prev => {
      const sin = prev.filter(id => id !== fromId)
      return sin.includes(toId) ? sin : [...sin, toId]
    })
    cargarProvisiones(newOverrides)
  }

  const handleContinueProvisiones = () => {
    marcarCompletado(4)
    setPasoActual(5)
    cargarResultado()
  }

  // ── Paso 5: recalcular resultado cuando cambian los inputs ──────────
  const cargarResultado = useCallback(async () => {
    try {
      setLoadingResultado(true)
      setResultado(null)
      const res = await fetch('/api/workforce/presupuesto/resultado', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supuestos,
          movimientos: movimientos.map(m => ({
            acotadoGroup: m.acotadoGroup,
            cargo: m.cargo,
            delta: m.delta,
            mesInicio: m.mesInicio,
          })),
          provisionesSeleccionadas,
          mesesSalidaPorPersona,
          prescindiblesIds,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error ?? 'No se pudo calcular el presupuesto')
        return
      }
      setResultado(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red')
    } finally {
      setLoadingResultado(false)
    }
  }, [supuestos, movimientos, provisionesSeleccionadas, mesesSalidaPorPersona])

  const deltaHeadcount = movimientosAgregado?.deltaHeadcount ?? 0
  const deltaMasa = movimientosAgregado?.deltaMasaSalarial ?? 0
  const deltaCosto = movimientosAgregado?.deltaCostoEmpresa ?? 0

  const cargosDisponibles = useMemo(
    () => dotacionBase?.cargosDisponibles ?? [],
    [dotacionBase],
  )

  // ── Navegacion entre pasos completados ──────────────────────────────
  const handleStepClick = (paso: PasoWizard) => {
    if (pasosCompletados.includes(paso) || paso === pasoActual) {
      setPasoActual(paso)
    }
  }

  // ── Volver al diagnostico workforce ─────────────────────────────────
  const handleBackToWorkforce = () => {
    router.push('/dashboard/workforce')
  }

  // ── Guardar escenario ─────────────────────────────────────────────
  const handleSaveScenario = async (name: string) => {
    const res = await fetch('/api/workforce/presupuesto/scenarios', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        wizardState: {
          supuestos,
          movimientos: movimientos.map(m => ({
            acotadoGroup: m.acotadoGroup,
            cargo: m.cargo,
            delta: m.delta,
            mesInicio: m.mesInicio,
          })),
          provisionesSeleccionadas,
          mesesSalidaPorPersona,
          prescindiblesIds,
        },
      }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error ?? 'Error al guardar')
    setScenarioLoaded({ id: json.data.id, name: json.data.name, createdAt: json.data.createdAt })
  }

  // ── Cargar escenario guardado ─────────────────────────────────────
  const handleLoadScenario = async (id: string) => {
    try {
      setLoadingBase(true)
      const res = await fetch(`/api/workforce/presupuesto/scenarios/${id}`, { credentials: 'include' })
      const json = await res.json()
      if (!json.success) {
        setError(json.error ?? 'No se pudo cargar el escenario')
        setLoadingBase(false)
        return
      }
      const { scenario, cambiosDetectados: cambios } = json.data

      setSupuestos(scenario.supuestos)
      if (scenario.supuestos?.anioPresupuesto) {
        setAnoPresupuestario(scenario.supuestos.anioPresupuesto)
      }
      setMovimientos(
        (scenario.movimientos as Array<{ acotadoGroup: string; cargo: string; delta: number; mesInicio: number }>).map(
          (m, i) => ({ id: `loaded-${i}`, ...m, impactoMensual: 0, impactoAnual: 0 }),
        ),
      )
      setProvisionesSeleccionadas(scenario.provisionesSeleccionadas)
      setMesesSalidaPorPersona(scenario.mesesSalidaPorPersona as Record<string, number>)
      setPrescindiblesIds(scenario.prescindiblesIds)
      setScenarioLoaded({ id: scenario.id, name: scenario.name, createdAt: scenario.createdAt })
      setCambiosDetectados(cambios)
      setShowSelector(false)
      setPasoActual(1)
      setPasosCompletados([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red')
    } finally {
      setLoadingBase(false)
    }
  }

  // ── Estados de carga y error ────────────────────────────────────────
  if (loadingBase) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
            Leyendo la organizacion
          </p>
        </div>
      </div>
    )
  }

  if (error || !dotacionBase) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-extralight text-white">
            No pudimos cargar la foto de tu{' '}
            <span className="fhr-title-gradient">organizacion.</span>
          </h2>
          <p className="text-sm text-slate-400 font-light">
            {error ?? 'Sin datos de dotacion activa.'}
          </p>
          <button
            type="button"
            onClick={handleBackToWorkforce}
            className="fhr-btn fhr-btn-secondary"
          >
            Volver al diagnostico
          </button>
        </div>
      </div>
    )
  }

  // ── Render principal ────────────────────────────────────────────────
  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-2xl md:max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-10">
        {/* Vuelve al workforce */}
        <button
          type="button"
          onClick={handleBackToWorkforce}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-light transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Diagnostico Fuerza de Trabajo
        </button>

        {/* Titulo del modulo */}
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
            Presupuesto de Dotacion
          </span>
          <h1 className="text-xl md:text-2xl font-extralight text-white mt-1 leading-tight">
            Tu presupuesto del{' '}
            <span className="fhr-title-gradient">proximo ciclo</span>
          </h1>
        </div>

        {/* Selector de escenarios guardados */}
        {showSelector && pasoActual === 1 && (
          <div className="mb-6">
            <ScenarioSelector
              onNew={() => setShowSelector(false)}
              onLoad={handleLoadScenario}
            />
          </div>
        )}

        {/* Banner de cambios detectados al reabrir escenario */}
        {cambiosDetectados?.hayCambios && scenarioLoaded && (
          <div className="mb-6">
            <ChangeBanner
              scenarioName={scenarioLoaded.name}
              createdAt={scenarioLoaded.createdAt}
              cambios={cambiosDetectados}
              onRecalcular={() => {
                setCambiosDetectados(null)
                if (pasoActual === 5) cargarResultado()
              }}
              onDismiss={() => setCambiosDetectados(null)}
            />
          </div>
        )}

        {/* Step nav */}
        <WizardStepNav
          pasoActual={pasoActual}
          pasosCompletados={pasosCompletados}
          onStepClick={handleStepClick}
        />

        {/* Contenedor unico — Tesla line + glassmorphism */}
        <div className="relative fhr-card-glass p-6 md:p-8 overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
              boxShadow: '0 0 20px #22D3EE',
            }}
          />

          <AnimatePresence mode="wait">
            {pasoActual === 1 && (
              <motion.div
                key="paso-1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <DotacionBaseTable
                  data={dotacionBase}
                  ano={anoPresupuestario}
                  onAnoChange={setAnoPresupuestario}
                  onContinue={handleConfirmBase}
                />
              </motion.div>
            )}

            {pasoActual === 2 && (
              <motion.div
                key="paso-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <MovimientosTable
                  movimientos={movimientos}
                  onEliminar={handleEliminarMovimiento}
                  deltaHeadcount={deltaHeadcount}
                  deltaMasaSalarial={deltaMasa}
                  deltaCostoEmpresa={deltaCosto}
                  onContinue={handleContinueMovimientos}
                  onBack={() => setPasoActual(1)}
                >
                  <FamiliaCargoSelector
                    cargosDisponibles={cargosDisponibles}
                    onAgregar={handleAgregarMovimiento}
                  />
                </MovimientosTable>
              </motion.div>
            )}

            {pasoActual === 3 && (
              <motion.div
                key="paso-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <SupuestosMacroForm
                  supuestos={supuestos}
                  setSupuestos={setSupuestos}
                  costoBaseMensual={dotacionBase.costoEmpresa + deltaCosto}
                  rotacionHistorica={dotacionBase.rotacionHistorica}
                  onContinue={handleContinueSupuestos}
                  onBack={() => setPasoActual(2)}
                />
              </motion.div>
            )}

            {pasoActual === 4 && (
              <motion.div
                key="paso-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {loadingProvisiones && (
                  <div className="py-16 flex flex-col items-center gap-3">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                      Analizando zona prescindible
                    </p>
                  </div>
                )}
                {!loadingProvisiones && provisionesData && (
                  <ProvisionesTable
                    data={provisionesData}
                    seleccionadas={provisionesSeleccionadas}
                    mesesSalida={mesesSalidaPorPersona}
                    mesSalidaDefault={supuestos.mesSalidas}
                    onToggle={handleToggleProvision}
                    onMesSalidaChange={handleMesSalidaChange}
                    onSwap={handleSwapProvision}
                    onContinue={handleContinueProvisiones}
                    onBack={() => setPasoActual(3)}
                  />
                )}
              </motion.div>
            )}

            {pasoActual === 5 && (
              <motion.div
                key="paso-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {loadingResultado && (
                  <div className="py-16 flex flex-col items-center gap-3">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                      Proyectando el ciclo completo
                    </p>
                  </div>
                )}
                {!loadingResultado && resultado && (
                  <ResultadoMensual
                    data={resultado}
                    onBack={() => setPasoActual(4)}
                    onVolverDiagnostico={handleBackToWorkforce}
                    onSave={() => setShowSaveModal(true)}
                  />
                )}
                {!loadingResultado && !resultado && (
                  <div className="py-12 text-center space-y-3">
                    <p className="text-sm text-slate-400 font-light">
                      No se pudo generar el presupuesto.
                    </p>
                    <button
                      type="button"
                      onClick={cargarResultado}
                      className="fhr-btn fhr-btn-secondary"
                    >
                      Reintentar
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Marcas no invasivas: supuestos usados, para no olvidarlos */}
        {pasoActual === 1 && (
          <div className="mt-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-light">
              Factor amplificacion {dotacionBase.factorAmplificacion} · Rotacion historica{' '}
              {dotacionBase.rotacionHistorica}%
            </p>
          </div>
        )}
      </div>

      {/* Modal guardar escenario */}
      {showSaveModal && (
        <SaveScenarioModal
          year={supuestos.anioPresupuesto}
          onSave={handleSaveScenario}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  )
}
