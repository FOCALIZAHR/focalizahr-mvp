// Tipos compartidos del Wizard de Presupuesto de Dotacion.
// Coinciden con las respuestas de /api/workforce/presupuesto/*.

export interface GerenciaBase {
  gerenciaId: string
  gerenciaNombre: string
  standardCategory: string | null
  headcount: number
  masaSalarial: number
  costoEmpresa: number
  exposicionIA: number
}

export interface DotacionBaseResponse {
  totalHeadcount: number
  masaSalarialBruta: number
  costoEmpresa: number
  factorAmplificacion: number
  exposicionIAPromedio: number
  rotacionHistorica: number
  porGerencia: GerenciaBase[]
  intocablesCount: number
  cargosDisponibles: Array<{
    cargo: string
    acotadoGroup: string
    headcount: number
  }>
}

export interface Movimiento {
  id: string
  acotadoGroup: string
  cargo: string
  delta: number
  mesInicio: number
  impactoMensual: number
  impactoAnual: number
  bloqueado?: boolean
  motivo?: string
  warningIntocables?: number
}

export interface MovimientosResponse {
  nuevoHeadcount: number
  deltaHeadcount: number
  deltaMasaSalarial: number
  deltaCostoEmpresa: number
  movimientosProcesados: Array<{
    acotadoGroup: string
    cargo: string
    delta: number
    mesInicio: number
    impactoMensual: number
    impactoAnual: number
    bloqueado: boolean
    motivo?: string
    warningIntocables: number
  }>
}

export type FrecuenciaReajuste = 'anual' | 'semestral' | 'trimestral'

export interface SupuestosMacro {
  ipcPorcentaje: number
  meritoPorcentaje: number
  factorAmplificacion: number
  ausentismoPorcentaje: number
  rotacionEsperada: number
  // Periodo del presupuesto
  anioPresupuesto: number
  mesInicio: number           // 1-12 (mes calendario donde arranca el ciclo)
  // Salidas — default que se propaga a cada persona en Paso 4
  mesSalidas: number          // 1-12
  // Reajuste salarial por IPC
  frecuenciaReajuste: FrecuenciaReajuste
  mesReajusteIPC: number      // 1-12 (primer reajuste; los siguientes se derivan de la frecuencia)
  // Merito — evento anual independiente del IPC
  mesMerito: number           // 1-12
}

const mesActualIndex = new Date().getMonth() + 1
const mesSalidasDefault = ((mesActualIndex - 1 + 3) % 12) + 1
const anioActual = new Date().getFullYear()

export const SUPUESTOS_DEFAULT: SupuestosMacro = {
  ipcPorcentaje: 4.5,
  meritoPorcentaje: 2.0,
  factorAmplificacion: 1.35,
  ausentismoPorcentaje: 3.0,
  rotacionEsperada: 12,
  anioPresupuesto: anioActual,
  mesInicio: 1,
  mesSalidas: mesSalidasDefault,
  frecuenciaReajuste: 'anual',
  mesReajusteIPC: 7,
  mesMerito: 7,
}

export interface AlternativaEntry {
  employeeId: string
  employeeName: string
  position: string
  retentionScore: number
  tier: string
}

export interface ScoreBreakdown {
  goalsNorm: number
  roleFitNorm: number
  adaptNorm: number
  multiplierCritical: number
  multiplierSuccessor: number
  multiplierExposure: number
  hasCompleteData: boolean
}

export interface ProvisionEntry {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  retentionScore: number
  roleFitScore: number
  tenureMonths: number
  salary: number
  tier: 'intocable' | 'valioso' | 'neutro' | 'prescindible'
  finiquitoHoy: number
  finiquitoQ2: number
  finiquitoQ4: number
  costoEspera: number
  mesAniversario: number
  alzaSiEspera: number
  impactoTotalEspera: number
  timingAlert: string | null
  timingSeverity: 'warning' | 'critical' | null
  bloqueado: boolean
  bloqueadoRazon: string | null
  riskQuadrant: string | null
  origen: 'sistema' | 'planificado'
  cargoOrigen?: string
  movimientoKey?: string
  scoreAltoWarning: boolean
  alternativas: AlternativaEntry[]
  scoreBreakdown: ScoreBreakdown
}

export interface ListaVerdeEntry {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  roleFitScore: number
  tier: string
  bloqueado: boolean
  bloqueadoRazon: string
}

export interface AniversarioAgregado {
  mes: number
  mesNombre: string
  personasCount: number
  costoAdicional: number
}

export interface ProvisionesResponse {
  listaRoja: ProvisionEntry[]
  salidasPlanificadas: ProvisionEntry[]
  listaVerde: ListaVerdeEntry[]
  prescindiblesConAniversario: AniversarioAgregado[]
  resumen: {
    finiquitosTotal: number
    personasCount: number
    ahorroMensualPostSalida: number
    paybackMeses: number
  }
  contexto: {
    ufValueCLP: number
    factorAmplificacion: number
    ipcPorcentaje: number
    mesActual: number
    excluidosSinSalario: number
    thresholdsEscalados: boolean
    fallbackRelativo: boolean
    avgExposicionIA: number
  }
}

export interface FiniquitoEntry {
  nombre: string
  monto: number
}

export interface MesPresupuesto {
  mes: number
  mesNombre: string
  costoEmpresa: number
  // Segmentos individuales (para stacked bar chart)
  costoBaseMes: number         // masa salarial base del mes + delta por movimientos
  reajusteIPCMes: number       // incremento acumulado por IPC (sin merito)
  meritoMes: number            // incremento anual por merito (evento puntual)
  finiquitosMes: number        // pago de finiquitos de ese mes
  ahorroPostSalida: number     // ahorro acumulado de personas ya desvinculadas
  // Detalle narrativo
  costoAniversariosEvitables: number
  finiquitosDetalle: FiniquitoEntry[]  // nombres + montos de los finiquitos del mes
  // Proyeccion de inercia: que pasaria mes a mes si el CEO no hace nada.
  sinAccionesMes: number
  // FTE al cierre de este mes (headcount acumulado post movimientos y salidas).
  fteMes: number
  color: 'neutral' | 'warning' | 'critical' | 'success'
  tooltip: string
}

export interface ResultadoResponse {
  meses: MesPresupuesto[]
  narrativaEjecutiva: string
  costoBaseOriginal: number
  fteInicial: number
  resumenAnual: {
    costoTotalAnual: number
    costoBaseAnual: number
    variacionVsBase: number
    finiquitos: number
    ahorroNeto: number
    paybackMeses: number
  }
}

export type PasoWizard = 1 | 2 | 3 | 4 | 5

export interface WizardStepProps {
  dotacionBase: DotacionBaseResponse | null
  movimientos: Movimiento[]
  supuestos: SupuestosMacro
  provisionesData: ProvisionesResponse | null
  provisionesSeleccionadas: string[]
  resultado: ResultadoResponse | null
}
