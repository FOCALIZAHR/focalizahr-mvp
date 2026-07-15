// ════════════════════════════════════════════════════════════════════════════
// CREATE GOAL WIZARD - Orquestador principal del wizard de metas
// src/components/goals/wizard/CreateGoalWizard.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, X, Target, HelpCircle } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { formatDisplayName } from '@/lib/utils/formatName'
import { getCurrentUser } from '@/lib/auth'
// Gate C — misma hasPermission que el servidor (módulo puro client-safe, post-split c3ca32d)
import { hasPermission } from '@/lib/auth/permissions'

import { goalDatesWithinCycleError } from '@/lib/utils/goalCycleDates'
import { WizardProgress } from './WizardProgress'
import StepChooseFlow from './StepChooseFlow'
import StepSelectLevel from './StepSelectLevel'
import StepDefineGoal from './StepDefineGoal'
import StepConfigureMetric from './StepConfigureMetric'
import StepSetDates from './StepSetDates'
import StepLinkParent from './StepLinkParent'
import StepAssignWeight from './StepAssignWeight'
import StepConfirm from './StepConfirm'
import GoalStepCover from './GoalStepCover'
import GoalBankScreen from '../bank/GoalBankScreen'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// RECORRIDOS (Gate C)
// ────────────────────────────────────────────────────────────────────────────
// Los `id` son IDENTIDAD DE PANTALLA (estables), NO orden. El orden lo define la
// posición dentro del array de la rama activa.
//
// ⚠️ REGLA: toda comparación de avance va por ÍNDICE (stepIndex), NUNCA contra el id
// crudo. Con recorridos no contiguos, `currentStep < 6` fallaría apenas aparezca un
// paso con id mayor (el de Peso, id 7, llega en el resto del gate).
// ════════════════════════════════════════════════════════════════════════════
const STEP_FLOW = { id: 1, name: 'Tipo' } // bifurcación Meta Libre / Meta Definida
const STEP_SCOPE = { id: 9, name: 'Alcance' } // nivel + destinatario (StepSelectLevel)
const STEP_WEIGHT = { id: 7, name: 'Peso' } // slider hero, SOLO metas individuales

/**
 * Inserta el paso de Peso (7, slider hero) ANTES de Confirmar (6), solo si la meta
 * es INDIVIDUAL. Una meta COMPANY/AREA tiene weight inerte (no cuenta para el 100% de
 * nadie, hallazgo Gate B) → no le corresponde un paso de peso.
 */
function withWeightStep(base: { id: number; name: string }[], isIndividual: boolean) {
  if (!isIndividual) return base
  const i = base.findIndex((s) => s.id === 6)
  if (i === -1) return base
  return [...base.slice(0, i), STEP_WEIGHT, ...base.slice(i)]
}

// ────────────────────────────────────────────────────────────────────────────
// RECORRIDO CONDICIONAL POR ROL (Gate C — arquitectura interina, ver PROGRESS).
// El recorrido lo decide el ROL, no una elección del usuario:
//
//   ESTRATEGA (goals:create:strategic) → Alcance directo (crea COMPANY/AREA/
//     INDIVIDUAL heredables). SIN bifurcación: no le corresponde asignar del banco.
//
//   JEFE COMÚN (no-Estratega) → bifurcación Meta Libre / Meta Definida. Su meta es
//     siempre INDIVIDUAL. Meta Libre pasa por Alcance, que para él colapsa a "elegí
//     al colaborador" (una sola opción, auto-seleccionada en StepSelectLevel) → NO se
//     ve como una repetición de la bifurcación. Meta Definida → banco (paso 8, pendiente).
//
// Así se resuelve de raíz el defecto reportado (bifurcación + Alcance percibidas como
// la misma pantalla): ningún rol ve las dos pantallas de "tarjetas" seguidas.
// ────────────────────────────────────────────────────────────────────────────

// Estratega: Alcance → resto. Sin bifurcación.
const STEPS_ESTRATEGA = [
  STEP_SCOPE,
  { id: 2, name: 'Definición' },
  { id: 3, name: 'Medición' },
  { id: 4, name: 'Tiempo' },
  { id: 5, name: 'Alineación' },
  { id: 6, name: 'Confirmar' },
]

// Jefe común, Meta Libre: bifurcación → Alcance (solo picker de empleado) → resto.
const STEPS_JEFE_LIBRE = [
  STEP_FLOW,
  STEP_SCOPE,
  { id: 2, name: 'Definición' },
  { id: 3, name: 'Medición' },
  { id: 4, name: 'Tiempo' },
  { id: 5, name: 'Alineación' },
  { id: 6, name: 'Confirmar' },
]

// Jefe común, Meta Definida: bifurcación → banco (paso 8, llega en el resto de Gate C).
const STEPS_JEFE_DEFINIDA = [STEP_FLOW, { id: 8, name: 'Banco' }]

// Entrada directa con employeeId (desde la ficha): sin bifurcación ni alcance —
// ya se sabe para quién es. Aplica a cualquier rol.
const STEPS_INDIVIDUAL = [
  { id: 2, name: 'Definición' },
  { id: 3, name: 'Medición' },
  { id: 4, name: 'Tiempo' },
  { id: 5, name: 'Alineación' },
  { id: 6, name: 'Confirmar' },
]

// El "Paso N de M" YA NO se escribe a mano acá: se deriva del array de la rama activa
// (antes decía "de 6" en cada portada, y con Meta Definida —2 pasos— mentiría).
const STEP_COVERS: Record<number, {
  title: string
  subtitle: string
  cta: string
  smartTip: string
}> = {
  1: {
    title: '¿Cómo querés crear esta meta?',
    subtitle: 'Escribí una meta propia, o asigná una que el equipo estratégico ya definió.',
    cta: 'Elegir',
    smartTip: 'Las metas definidas traen su indicador consolidado: solo elegís el peso.'
  },
  9: {
    title: '¿Dónde impacta esta meta?',
    subtitle: 'Define el alcance: ¿es para toda la empresa, un área, o una persona específica?',
    cta: 'Definir Alcance',
    smartTip: 'SMART: Empieza definiendo a quién aplica.'
  },
  2: {
    title: 'Define el objetivo',
    subtitle: 'Tu misión: describir qué debe lograr. Sé claro y específico.',
    cta: 'Comenzar',
    smartTip: 'S: Específica. Evita "mejorar". Di exactamente qué.'
  },
  3: {
    title: 'Define la medición',
    subtitle: 'Tu misión: establecer cómo sabrás que se logró. Sin número, no hay meta.',
    cta: 'Continuar',
    smartTip: 'M: Medible. Ejemplo: "Aumentar ventas 20%".'
  },
  4: {
    title: 'Define el plazo',
    subtitle: 'Tu misión: establecer inicio y cierre. Sin fecha, las metas se postergan.',
    cta: 'Continuar',
    smartTip: 'T: Temporal. Una meta sin fecha no se cumple.'
  },
  5: {
    title: 'Conecta con la estrategia',
    subtitle: 'Tu misión: vincular a un objetivo mayor. Una meta conectada tiene más impacto.',
    cta: 'Continuar',
    smartTip: 'R: Relevante. ¿Aporta a los objetivos del negocio?'
  },
  7: {
    title: 'Define el peso',
    subtitle: 'Cuánto pesa esta meta en la evaluación del colaborador. El máximo es su peso libre en el ciclo.',
    cta: 'Continuar',
    smartTip: 'El total de metas de una persona no puede superar el 100%.'
  },
  6: {
    title: 'Confirma y activa',
    subtitle: 'Revisa los datos. Al guardar, el colaborador será notificado.',
    cta: 'Crear Meta',
    smartTip: 'A: Alcanzable. ¿Tiene los recursos para lograrlo?'
  },
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface GoalWizardData {
  // Paso 1 (Gate C): bifurcación Meta Libre / Meta Definida.
  // `flow` decide el recorrido del JEFE COMÚN (ver STEPS_JEFE_LIBRE / STEPS_JEFE_DEFINIDA).
  // `bankLevel` solo aplica si flow === 'DEFINIDA'.
  flow?: 'LIBRE' | 'DEFINIDA'
  bankLevel?: 'COMPANY' | 'AREA'

  // Paso 1: Tipo/Nivel
  level: 'COMPANY' | 'AREA' | 'INDIVIDUAL' | ''
  employeeId?: string
  departmentId?: string

  // Paso 2: Definicion
  title: string
  description: string
  type: 'KPI' | 'OBJECTIVE' | 'KEY_RESULT' | 'PROJECT'

  // Categoría (Gate C / B). family = enum GoalFamily; subfamily = String validado.
  family?: 'NEGOCIO_E_INGRESOS' | 'CLIENTES_Y_USUARIOS' | 'OPERACION_Y_EFICIENCIA' | 'CULTURA_Y_PERSONAS'
  subfamily?: string

  // Paso 3: Medicion
  metricType: 'PERCENTAGE' | 'CURRENCY' | 'NUMBER' | 'BINARY'
  startValue: number
  targetValue: number
  unit: string

  // Paso 4: Tiempo
  startDate: string
  dueDate: string
  periodYear: number
  periodQuarter?: number

  // Paso 5: Cascada
  parentId?: string
  parentTitle?: string
  weight: number

  // Meta Líder
  isLeaderGoal: boolean
}

interface EmployeeData {
  id: string
  fullName: string
  assignmentStatus: {
    totalWeight: number
    goalCount: number
    maxGoals: number
    status: 'EMPTY' | 'INCOMPLETE' | 'READY' | 'EXCEEDED'
    isComplete: boolean
  }
}

type WizardPhase = 'cover' | 'steps'

const initialData: GoalWizardData = {
  level: '',
  title: '',
  description: '',
  type: 'KPI',
  metricType: 'PERCENTAGE',
  startValue: 0,
  targetValue: 100,
  unit: '%',
  startDate: '',
  dueDate: '',
  periodYear: new Date().getFullYear(),
  weight: 0,
  isLeaderGoal: false,
}

// ════════════════════════════════════════════════════════════════════════════
// ANIMACIONES
// ════════════════════════════════════════════════════════════════════════════

const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

const stepTransition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

interface CreateGoalWizardProps {
  employeeId?: string
  context?: string
}

export default function CreateGoalWizard({ employeeId: initialEmployeeId, context }: CreateGoalWizardProps) {
  const router = useRouter()

  // ── Rol del usuario (client-side) para decidir el recorrido ──
  // isEstratega usa la MISMA hasPermission que el servidor (post-split): sin espejo.
  const currentUser = getCurrentUser()
  const currentRole = (currentUser as any)?.userRole || currentUser?.role || null
  const isEstratega = hasPermission(currentRole, 'goals:create:strategic')

  // Paso inicial = primer paso del recorrido de la rama activa:
  //   con employeeId → 2 (Definición) · Estratega → 9 (Alcance) · jefe común → 1 (bifurcación)
  const initialStepId = initialEmployeeId ? 2 : isEstratega ? 9 : 1
  const [currentStep, setCurrentStep] = useState(initialStepId)
  const [data, setData] = useState<GoalWizardData>(() => {
    if (initialEmployeeId) {
      return { ...initialData, level: 'INDIVIDUAL', employeeId: initialEmployeeId }
    }
    return initialData
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Per-step cover/form phase
  const [stepPhase, setStepPhase] = useState<'cover' | 'form'>('cover')

  // Cinema Mode: wizard-level phase y datos del empleado
  const [phase, setPhase] = useState<WizardPhase>(
    initialEmployeeId ? 'cover' : 'steps'
  )
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(!!initialEmployeeId)

  // Ciclo heredado (Gate D.6, Decisión #4): la meta hereda el ciclo ACTIVE y
  // periodYear se deriva de su year — el usuario no elige año. Las ventanas
  // (Gate D.7b) acotan startDate/dueDate de la meta al rango del ciclo.
  const [activeCycle, setActiveCycle] = useState<{
    id: string
    name: string
    year: number
    assignmentWindow: string
    closureWindow: string
  } | null>(null)
  const [loadingCycle, setLoadingCycle] = useState(true)

  // Peso disponible REAL del colaborador (post-Gate A). FAIL-CLOSED: null si aún no
  // hay dato — StepAssignWeight muestra error, NUNCA asume 100 (mismo criterio Gate A).
  const availableWeight: number | null = employeeData
    ? 100 - employeeData.assignmentStatus.totalWeight
    : null

  // Steps dinámicos
  // ── Recorrido de la RAMA ACTIVA: fuente de verdad de toda la navegación ──
  const steps = useMemo(() => {
    // ficha y jefe común crean SIEMPRE metas individuales → tienen paso de Peso.
    if (initialEmployeeId) return withWeightStep(STEPS_INDIVIDUAL, true)
    if (isEstratega) {
      // el Estratega tiene Peso solo si eligió nivel INDIVIDUAL (COMPANY/AREA = peso inerte)
      return withWeightStep(STEPS_ESTRATEGA, data.level === 'INDIVIDUAL')
    }
    // jefe común: la bifurcación decide Meta Libre vs Definida
    if (data.flow === 'DEFINIDA') return STEPS_JEFE_DEFINIDA // banco maneja su propio peso
    return withWeightStep(STEPS_JEFE_LIBRE, true) // Meta Libre → individual → con Peso
  }, [initialEmployeeId, isEstratega, data.flow, data.level])

  // Índice del paso actual DENTRO de la rama. TODO se compara contra esto, nunca
  // contra el id crudo (los ids son identidad de pantalla, no orden).
  const stepIndex = useMemo(() => {
    const i = steps.findIndex((s) => s.id === currentStep)
    return i === -1 ? 0 : i
  }, [steps, currentStep])

  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1

  // Empleado destino: ficha (initialEmployeeId) o el que el jefe elige en Alcance.
  const targetEmployeeId = data.employeeId || initialEmployeeId

  // Cargar datos del empleado
  useEffect(() => {
    if (!targetEmployeeId) return

    setIsLoadingEmployee(true)
    const token = localStorage.getItem('focalizahr_token')

    fetch('/api/goals/team', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          const employee = res.data.find((e: any) => e.id === targetEmployeeId)
          if (employee) {
            setEmployeeData({
              id: employee.id,
              fullName: employee.fullName,
              assignmentStatus: employee.assignmentStatus,
            })
          }
        }
      })
      .catch(err => console.error('Error loading employee:', err))
      .finally(() => setIsLoadingEmployee(false))
    // targetEmployeeId cubre las 2 entradas: ficha (initialEmployeeId) y Meta Libre
    // (el jefe elige al colaborador en Alcance → data.employeeId). Así el slider hero
    // recibe el peso disponible REAL en ambas.
  }, [targetEmployeeId])

  // Actualizar datos
  const updateData = useCallback((updates: Partial<GoalWizardData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  // Cargar el ciclo ACTIVE heredado (Gate D.6) — mismo patrón de fetch del wizard.
  // Al resolver: si hay ciclo, periodYear se deriva de su year; si no, queda en
  // currentYear (default de initialData) y el step muestra "sin ciclo activo".
  useEffect(() => {
    const token = localStorage.getItem('focalizahr_token')
    setLoadingCycle(true)
    fetch('/api/goals/cycles/active', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setActiveCycle(res.data)
          updateData({ periodYear: res.data.year })
        } else {
          setActiveCycle(null)
        }
      })
      .catch((err) => console.error('Error loading active cycle:', err))
      .finally(() => setLoadingCycle(false))
  }, [updateData])

  // Validacion por paso
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        // Bifurcación (Gate C). Meta Definida exige además elegir el banco (Corp/Área).
        if (!data.flow) return false
        if (data.flow === 'DEFINIDA' && !data.bankLevel) return false
        return true
      case 9:
        // Alcance (el antiguo paso 1): nivel + destinatario. Lógica intacta.
        if (!data.level) return false
        if (data.level === 'INDIVIDUAL' && !data.employeeId) return false
        if (data.level === 'AREA' && !data.departmentId) return false
        return true
      case 2:
        // Título + categoría (Gate C): la Familia es obligatoria (de ella sale el
        // ejemplo del paso 3 y la meta debe ser visible en reportes agregados).
        return data.title.trim().length >= 3 && !!data.family && !!data.subfamily
      case 3:
        // Medición + "¿Cómo se mide?" obligatorio: NO vacío, sin piso de longitud
        // (espejo del servidor, Punto 2). Los ejemplos por Familia×metricType guían.
        return (
          (data.targetValue > data.startValue || data.metricType === 'BINARY') &&
          data.description.trim().length > 0
        )
      case 4:
        // Gate E: sin ciclo activo (ya resuelto) la creación se bloquea.
        if (!loadingCycle && !activeCycle) return false
        if (!data.startDate || !data.dueDate) return false
        if (new Date(data.dueDate) <= new Date(data.startDate)) return false
        // Gate D.7b: si hay ciclo heredado, las fechas deben caber en su rango.
        if (
          activeCycle &&
          goalDatesWithinCycleError(activeCycle, data.startDate, data.dueDate) !== null
        ) {
          return false
        }
        return true
      case 5:
        return true // Alineación: opcional
      case 7:
        // Peso: el slider ya topea en availableWeight; esto es el cinturón. Fail-closed
        // si no hay dato de disponibilidad (no se puede asignar a ciegas).
        return availableWeight !== null && data.weight <= availableWeight
      case 6:
        return true
      default:
        return false
    }
  }, [currentStep, data, activeCycle, loadingCycle, availableWeight])

  // ── Navegación con cover/form — SIEMPRE por índice, nunca por id crudo ──
  const goNext = useCallback(() => {
    // Fase 1 → 2 del MISMO paso: portada → formulario
    if (stepPhase === 'cover') {
      setStepPhase('form')
      return
    }
    if (!canProceed) return
    // El último paso NO avanza: su CTA es "Crear Meta" (handleSubmit), no "Continuar"
    if (isLastStep) return

    // Cuando el paso 1 setea data.flow, `steps` se recalcula y el siguiente índice ya
    // apunta al recorrido correcto (Banco o Alcance) — la bifurcación no necesita
    // ningún caso especial.
    const next = steps[stepIndex + 1]
    setCurrentStep(next.id)
    // El banco (paso 8) es autocontenido (su propia portada/header y botones): se
    // entra directo al form, sin la portada del wizard.
    setStepPhase(next.id === 8 ? 'form' : 'cover')
  }, [stepPhase, canProceed, isLastStep, steps, stepIndex])

  const goBack = useCallback(() => {
    // Formulario → portada del mismo paso (comportamiento original, se preserva)
    if (stepPhase === 'form') {
      setStepPhase('cover')
      return
    }
    if (isFirstStep) return

    const prev = steps[stepIndex - 1]
    setCurrentStep(prev.id)
    setStepPhase('form') // al volver se entra directo al formulario: la portada ya la vio
  }, [stepPhase, isFirstStep, steps, stepIndex])

  // Entrar al wizard desde GoalStepCover (opción A: skip step cover)
  const handleEnterWizard = useCallback(() => {
    setPhase('steps')
    setStepPhase('form')
  }, [])

  // Enviar
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('focalizahr_token')

      const payload = {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        level: data.level,
        employeeId: data.employeeId || undefined,
        departmentId: data.departmentId || undefined,
        metricType: data.metricType,
        startValue: data.startValue,
        targetValue: data.targetValue,
        unit: data.unit || undefined,
        startDate: data.startDate,
        dueDate: data.dueDate,
        periodYear: data.periodYear,
        periodQuarter: data.periodQuarter || undefined,
        parentId: data.parentId || undefined,
        weight: data.weight,
        isLeaderGoal: data.isLeaderGoal || false,
        // Camino D (Meta Libre): el jefe ESCRIBE su propio KPI → OWN, aun cuando se
        // ALINEE a un padre de referencia (que igual manda parentId → cascadeGoal).
        kpiSource: 'OWN' as const,
        // Camino D: la categoría la ELIGE el jefe (FamilySubfamilyPicker), no se hereda.
        family: data.family || undefined,
        subfamily: data.subfamily || undefined,
      }

      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error creando meta')
      }

      const result = await res.json()
      router.push(`/dashboard/metas/${result.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }, [data, router])

  // Renderizar cover de un paso
  const renderStepCover = useCallback(() => {
    const cover = STEP_COVERS[currentStep]
    if (!cover) return null

    return (
      <div className="flex flex-col items-center justify-center text-center px-8 py-12">
        {/* Indicador paso */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-semibold text-cyan-400 tracking-widest uppercase mb-4"
        >
          {/* Derivado, no hardcodeado: el último paso dice "Último paso". */}
          {isLastStep ? 'Último paso' : `Paso ${stepIndex + 1} de ${steps.length}`}
        </motion.span>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl font-light text-white mb-4"
        >
          {cover.title}
        </motion.h1>

        {/* Subtítulo coach */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-400 mb-8 max-w-md"
        >
          {cover.subtitle}
        </motion.p>

        {/* Smart Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 text-slate-500 text-sm mb-10"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="italic">{cover.smartTip}</span>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={goNext}
          className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base transition-all"
          style={{
            background: 'linear-gradient(135deg, #22D3EE, #22D3EEDD)',
            color: '#0F172A',
            boxShadow: '0 8px 24px -6px rgba(34, 211, 238, 0.4)'
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{cover.cta}</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    )
  }, [currentStep, goNext])

  // Nombres de paso para header del form
  // (stepNames eliminado: el nombre del paso ahora sale del array de la rama activa —
  //  una sola fuente de verdad, en vez de un diccionario paralelo que podía divergir.)

  // Renderizar formulario del paso actual
  const renderStepForm = useCallback(() => {
    const props = { data, updateData }
    const cover = STEP_COVERS[currentStep]

    const stepContent = (() => {
      switch (currentStep) {
        case 1:
          return <StepChooseFlow {...props} /> // Gate C: bifurcación
        case 9:
          return <StepSelectLevel {...props} /> // el antiguo paso 1, intacto
        case 2:
          return <StepDefineGoal {...props} />
        case 3:
          return <StepConfigureMetric {...props} />
        case 4:
          return <StepSetDates {...props} activeCycle={activeCycle} loadingCycle={loadingCycle} />
        case 5:
          // Alineación: solo el vínculo al padre (el peso se mudó al paso 7).
          return <StepLinkParent {...props} />
        case 7:
          return <StepAssignWeight {...props} availableWeight={availableWeight} />
        case 6:
          return <StepConfirm {...props} />
        case 8:
          // Banco de metas definidas (Camino B/C). Pantalla autocontenida con su
          // propio submit (crea 1..N metas individuales) y sus propios botones.
          return (
            <GoalBankScreen
              bankLevel={data.bankLevel!}
              onDone={() => router.push('/dashboard/metas/equipo')}
            />
          )
        default:
          return null
      }
    })()

    return (
      <div className="flex flex-col">
        {/* Header minimalista del form */}
        <div className="flex items-center justify-between mb-6 px-2">
          {/* Derivado de la rama activa: antes era "de 6" hardcodeado. */}
          <span className="text-sm font-semibold text-cyan-400">
            Paso {stepIndex + 1} de {steps.length} · {steps[stepIndex]?.name}
          </span>

          {/* Tooltip SMART */}
          {cover?.smartTip && (
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-slate-500 hover:text-cyan-400 cursor-help transition-colors" />

              {/* Tooltip content */}
              <div className="absolute right-0 top-6 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {cover.smartTip}
              </div>
            </div>
          )}
        </div>

        {/* Contenido del step */}
        {stepContent}
      </div>
    )
  }, [currentStep, data, updateData, availableWeight, activeCycle, loadingCycle])

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  // Loading state
  if (isLoadingEmployee) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando información...</p>
        </div>
      </div>
    )
  }

  // Cover phase (solo si viene con employeeId)
  if (phase === 'cover' && employeeData) {
    return (
      <div className="fhr-bg-main min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex justify-end mb-8">
            <button
              onClick={handleCancel}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <GoalStepCover
            employeeName={employeeData.fullName}
            assignmentStatus={employeeData.assignmentStatus}
            onEnter={handleEnterWizard}
          />
        </div>
      </div>
    )
  }

  // Steps phase
  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="text-sm">Cancelar</span>
          </button>

          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-medium">
              {employeeData
                ? `Meta para ${formatDisplayName(employeeData.fullName, 'short').split(' ')[0]}`
                : 'Nueva Meta'}
            </span>
          </div>

          <div className="w-20" />
        </div>

        {/* Progress */}
        <WizardProgress steps={steps} currentStep={currentStep} />

        {/* Step content with animation */}
        <div className="fhr-card p-6 md:p-8 overflow-visible">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentStep}-${stepPhase}`}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
            >
              {stepPhase === 'cover' ? renderStepCover() : renderStepForm()}
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Navigation - solo en form. El banco (8) trae sus propios botones. */}
          {stepPhase === 'form' && currentStep !== 8 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
              <GhostButton
                icon={ArrowLeft}
                onClick={goBack}
                disabled={isFirstStep && stepPhase === 'form'}
              >
                Atrás
              </GhostButton>

              {!isLastStep ? (
                <PrimaryButton
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={goNext}
                  disabled={!canProceed}
                >
                  Continuar
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  icon={Target}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Meta'}
                </PrimaryButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
