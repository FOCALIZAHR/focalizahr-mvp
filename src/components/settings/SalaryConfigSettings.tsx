'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  Info,
  Save,
  RefreshCw,
  Building2,
  Users,
  TrendingUp,
  AlertCircle,
  Layers,
  BarChart3,
  Check
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-system'

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

interface SalaryByJobLevel {
  alta_gerencia: number
  mandos_medios: number
  profesionales: number
  base_operativa: number
}

interface HeadcountDistribution {
  alta_gerencia: number
  mandos_medios: number
  profesionales: number
  base_operativa: number
}

interface SalaryConfigData {
  hasCustomConfig: boolean
  averageMonthlySalary: number | null
  salaryByJobLevel: SalaryByJobLevel | null
  headcountDistribution: HeadcountDistribution | null
  turnoverBaselineRate: number | null
  headcount: number | null
  newHiresPerYear: number | null
  effectiveSalary: number
  source: string
  defaults: SalaryByJobLevel & { promedio_general: number }
  distribution: HeadcountDistribution
}

/** Snapshot of editable fields for dirty comparison */
interface ConfigSnapshot {
  useDetailedLevels: boolean
  averageSalary: number | null
  salaryByLevel: SalaryByJobLevel | null
  headcount: number | null
  newHiresPerYear: number | null
  turnoverRate: number | null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

interface SalaryConfigSettingsProps {
  /** Si se pasa accountId, se usa como query param en la API (modo admin).
   *  Si no se pasa, la API usa el JWT del usuario autenticado. */
  accountId?: string
}

export default function SalaryConfigSettings({ accountId }: SalaryConfigSettingsProps) {
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Configuración
  const [useDetailedLevels, setUseDetailedLevels] = useState(false)
  const [averageSalary, setAverageSalary] = useState<number | null>(null)
  const [salaryByLevel, setSalaryByLevel] = useState<SalaryByJobLevel | null>(null)
  const [headcount, setHeadcount] = useState<number | null>(null)
  const [newHiresPerYear, setNewHiresPerYear] = useState<number | null>(null)
  const [turnoverRate, setTurnoverRate] = useState<number | null>(null)

  // Defaults
  const [defaults, setDefaults] = useState<SalaryByJobLevel & { promedio_general: number } | null>(null)

  // Dirty state: snapshot of last saved/loaded config
  const [savedSnapshot, setSavedSnapshot] = useState<ConfigSnapshot | null>(null)

  const currentSnapshot = useMemo<ConfigSnapshot>(() => ({
    useDetailedLevels,
    averageSalary,
    salaryByLevel,
    headcount,
    newHiresPerYear,
    turnoverRate
  }), [useDetailedLevels, averageSalary, salaryByLevel, headcount, newHiresPerYear, turnoverRate])

  const hasChanges = savedSnapshot !== null &&
    JSON.stringify(currentSnapshot) !== JSON.stringify(savedSnapshot)

  // ══════════════════════════════════════════════════════════════════════════
  // CARGA INICIAL
  // ══════════════════════════════════════════════════════════════════════════

  const apiUrl = accountId
    ? `/api/settings/salary-config?accountId=${accountId}`
    : '/api/settings/salary-config'

  // Ref to avoid toast dependency triggering re-fetches
  const toastRef = useRef(toast)
  toastRef.current = toast

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.success) throw new Error(json.error)

      const data = json.data as SalaryConfigData

      setDefaults(data.defaults)
      setAverageSalary(data.averageMonthlySalary)
      setHeadcount(data.headcount || null)
      setNewHiresPerYear(data.newHiresPerYear || null)

      const loadedTurnoverRate = data.turnoverBaselineRate ? data.turnoverBaselineRate * 100 : null
      setTurnoverRate(loadedTurnoverRate)

      const loadedDetailedLevels = !!data.salaryByJobLevel
      setUseDetailedLevels(loadedDetailedLevels)
      setSalaryByLevel(data.salaryByJobLevel || null)

      // Save snapshot for dirty comparison
      setSavedSnapshot({
        useDetailedLevels: loadedDetailedLevels,
        averageSalary: data.averageMonthlySalary,
        salaryByLevel: data.salaryByJobLevel || null,
        headcount: data.headcount || null,
        newHiresPerYear: data.newHiresPerYear || null,
        turnoverRate: loadedTurnoverRate
      })
    } catch (error) {
      console.error('Error loading salary config:', error)
      toastRef.current.error('No se pudo cargar la configuración salarial')
    }
    setLoading(false)
  }, [apiUrl])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // ══════════════════════════════════════════════════════════════════════════
  // GUARDAR
  // ══════════════════════════════════════════════════════════════════════════

  const handleSave = async () => {
    if (!hasChanges) return

    setSaving(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          averageMonthlySalary: useDetailedLevels ? null : averageSalary,
          salaryByJobLevel: useDetailedLevels ? salaryByLevel : null,
          headcount,
          newHiresPerYear,
          turnoverBaselineRate: turnoverRate ? turnoverRate / 100 : null
        })
      })

      const json = await res.json()

      if (!json.success) throw new Error(json.error)

      // Update saved snapshot to current values (no re-fetch needed)
      setSavedSnapshot({ ...currentSnapshot })

      toast.success('Configuración salarial actualizada correctamente')
    } catch (error) {
      console.error('Error saving salary config:', error)
      toast.error('No se pudo guardar la configuración')
    }
    setSaving(false)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/\D/g, '')) || 0
  }

  const handleLevelChange = (level: keyof SalaryByJobLevel, value: string) => {
    const numValue = parseCurrency(value)
    setSalaryByLevel(prev => ({
      alta_gerencia: prev?.alta_gerencia || defaults?.alta_gerencia || 0,
      mandos_medios: prev?.mandos_medios || defaults?.mandos_medios || 0,
      profesionales: prev?.profesionales || defaults?.profesionales || 0,
      base_operativa: prev?.base_operativa || defaults?.base_operativa || 0,
      [level]: numValue
    }))
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <Card className="fhr-card">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="ml-2 text-slate-400">Cargando configuración...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="fhr-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-cyan-400" />
          <span className="fhr-title-gradient">Configuración Salarial</span>
        </CardTitle>
        <p className="text-sm text-slate-400">
          Define los sueldos de tu empresa para cálculos de ROI más precisos
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Toggle: Modo simple vs detallado */}
        <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => {
              const next = !useDetailedLevels
              setUseDetailedLevels(next)
              if (next && !salaryByLevel && defaults) {
                setSalaryByLevel({
                  alta_gerencia: defaults.alta_gerencia,
                  mandos_medios: defaults.mandos_medios,
                  profesionales: defaults.profesionales,
                  base_operativa: defaults.base_operativa
                })
              }
            }}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${useDetailedLevels ? 'bg-cyan-600' : 'bg-slate-600'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${useDetailedLevels ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
          <div className="flex-1">
            <Label className="text-white font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Configuración detallada por nivel
            </Label>
            <p className="text-xs text-slate-400 mt-1">
              Activa para definir sueldos por nivel jerárquico (más preciso)
            </p>
          </div>
        </div>

        {/* Modo Simple: Solo promedio general */}
        {!useDetailedLevels && (
          <div className="space-y-2">
            <Label htmlFor="avgSalary" className="text-slate-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              Sueldo promedio mensual (CLP)
            </Label>
            <Input
              id="avgSalary"
              type="text"
              value={averageSalary?.toLocaleString('es-CL') || ''}
              onChange={(e) => setAverageSalary(parseCurrency(e.target.value) || null)}
              placeholder={defaults ? `Ej: ${defaults.promedio_general.toLocaleString('es-CL')}` : ''}
              className="bg-slate-900 border-slate-700 focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500">
              Si no lo defines, usaremos el promedio Chile: {defaults && formatCurrency(defaults.promedio_general)}
            </p>
          </div>
        )}

        {/* Modo Detallado: 4 niveles */}
        {useDetailedLevels && salaryByLevel && defaults && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alta Gerencia */}
            <div className="space-y-2 p-4 bg-slate-800/30 rounded-lg border border-cyan-900/30">
              <Label className="text-cyan-400 font-medium">Alta Gerencia</Label>
              <p className="text-xs text-slate-500">Gerentes, Directores, C-Level</p>
              <Input
                type="text"
                value={salaryByLevel.alta_gerencia?.toLocaleString('es-CL') || ''}
                onChange={(e) => handleLevelChange('alta_gerencia', e.target.value)}
                placeholder={defaults.alta_gerencia.toLocaleString('es-CL')}
                className="bg-slate-900 border-slate-700 focus:border-cyan-500"
              />
            </div>

            {/* Mandos Medios */}
            <div className="space-y-2 p-4 bg-slate-800/30 rounded-lg border border-purple-900/30">
              <Label className="text-purple-400 font-medium">Mandos Medios</Label>
              <p className="text-xs text-slate-500">Jefes, Supervisores, Coordinadores</p>
              <Input
                type="text"
                value={salaryByLevel.mandos_medios?.toLocaleString('es-CL') || ''}
                onChange={(e) => handleLevelChange('mandos_medios', e.target.value)}
                placeholder={defaults.mandos_medios.toLocaleString('es-CL')}
                className="bg-slate-900 border-slate-700 focus:border-purple-500"
              />
            </div>

            {/* Profesionales */}
            <div className="space-y-2 p-4 bg-slate-800/30 rounded-lg border border-emerald-900/30">
              <Label className="text-emerald-400 font-medium">Profesionales</Label>
              <p className="text-xs text-slate-500">Analistas, Especialistas, Ingenieros</p>
              <Input
                type="text"
                value={salaryByLevel.profesionales?.toLocaleString('es-CL') || ''}
                onChange={(e) => handleLevelChange('profesionales', e.target.value)}
                placeholder={defaults.profesionales.toLocaleString('es-CL')}
                className="bg-slate-900 border-slate-700 focus:border-emerald-500"
              />
            </div>

            {/* Base Operativa */}
            <div className="space-y-2 p-4 bg-slate-800/30 rounded-lg border border-amber-900/30">
              <Label className="text-amber-400 font-medium">Base Operativa</Label>
              <p className="text-xs text-slate-500">Operarios, Auxiliares, Asistentes</p>
              <Input
                type="text"
                value={salaryByLevel.base_operativa?.toLocaleString('es-CL') || ''}
                onChange={(e) => handleLevelChange('base_operativa', e.target.value)}
                placeholder={defaults.base_operativa.toLocaleString('es-CL')}
                className="bg-slate-900 border-slate-700 focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* Datos adicionales empresa */}
        <div className="border-t border-slate-700 pt-4 mt-4">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            Datos adicionales (opcional)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headcount" className="flex items-center gap-1 text-slate-300">
                <Users className="h-3 w-3" />
                Total empleados
              </Label>
              <Input
                id="headcount"
                type="number"
                value={headcount || ''}
                onChange={(e) => setHeadcount(parseInt(e.target.value) || null)}
                placeholder="Ej: 250"
                className="bg-slate-900 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newHires" className="flex items-center gap-1 text-slate-300">
                <TrendingUp className="h-3 w-3" />
                Contrataciones/año
              </Label>
              <Input
                id="newHires"
                type="number"
                value={newHiresPerYear || ''}
                onChange={(e) => setNewHiresPerYear(parseInt(e.target.value) || null)}
                placeholder="Ej: 50"
                className="bg-slate-900 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="turnover" className="flex items-center gap-1 text-slate-300">
                <AlertCircle className="h-3 w-3" />
                Tasa rotación (%)
              </Label>
              <Input
                id="turnover"
                type="number"
                min="0"
                max="100"
                value={turnoverRate || ''}
                onChange={(e) => setTurnoverRate(parseFloat(e.target.value) || null)}
                placeholder="Ej: 18"
                className="bg-slate-900 border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-cyan-300 mb-1">¿Por qué es importante?</p>
              <p className="text-cyan-400/80">
                Con sueldos reales de tu empresa, los casos de negocio (ROI de retención,
                costo de rotación, impacto financiero) reflejarán TU realidad,
                no promedios genéricos de mercado.
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-between pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={loadConfig}
            disabled={loading || saving}
            className="border-slate-600 hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Restaurar
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || loading || !hasChanges}
            className={
              hasChanges
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : hasChanges ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Sin cambios
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
