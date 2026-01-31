'use client'

// ════════════════════════════════════════════════════════════════════════════
// ADMIN SETTINGS - Configuración de Reportes
// src/app/dashboard/admin/settings/reports/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Link2,
  ToggleLeft,
  ToggleRight,
  FileText,
  Home,
  ChevronRight,
  Info
} from 'lucide-react'
import AccountSelector from '@/components/admin/AccountSelector'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface ReportSettings {
  accountId: string
  companyName: string
  reportDeliveryDelayDays: number
  reportLinkExpirationDays: number
  enableEmployeeReports: boolean
}

function getToken(): string | null {
  if (typeof window !== 'undefined') return localStorage.getItem('focalizahr_token')
  return null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function ReportSettingsPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)

  const [settings, setSettings] = useState<ReportSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form state
  const [deliveryDelay, setDeliveryDelay] = useState(7)
  const [linkExpiration, setLinkExpiration] = useState(30)
  const [enableReports, setEnableReports] = useState(true)

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!selectedAccountId) return
    try {
      setIsLoading(true)
      setError(null)
      const token = getToken()
      const res = await fetch(`/api/admin/accounts/settings?accountId=${selectedAccountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Error cargando configuracion')
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
        setDeliveryDelay(data.settings.reportDeliveryDelayDays)
        setLinkExpiration(data.settings.reportLinkExpirationDays)
        setEnableReports(data.settings.enableEmployeeReports)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedAccountId])

  useEffect(() => { loadSettings() }, [loadSettings])

  // Save settings
  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveSuccess(false)
      setError(null)
      const token = getToken()
      const res = await fetch('/api/admin/accounts/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          reportDeliveryDelayDays: deliveryDelay,
          reportLinkExpirationDays: linkExpiration,
          enableEmployeeReports: enableReports
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error guardando')
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = settings && (
    deliveryDelay !== settings.reportDeliveryDelayDays ||
    linkExpiration !== settings.reportLinkExpirationDays ||
    enableReports !== settings.enableEmployeeReports
  )

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <span className="flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          Admin
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="flex items-center gap-1">
          <Settings className="w-3.5 h-3.5" />
          Settings
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-200">Reportes</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-slate-200 flex items-center gap-3">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span className="fhr-title-gradient">Configuracion Reportes</span>
          </h1>
          <p className="text-slate-400 mt-1">Controla la entrega de reportes individuales</p>
        </div>
        <AccountSelector
          value={selectedAccountId}
          onChange={(id: string) => setSelectedAccountId(id)}
          onOpenChange={setIsSelectorOpen}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* No Account */}
      {!selectedAccountId && !isLoading && (
        <div className="fhr-card p-12 text-center">
          <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Selecciona una empresa para configurar</p>
        </div>
      )}

      {/* Settings Form */}
      {settings && !isLoading && (
        <div className="space-y-6">
          {/* Delivery Delay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fhr-card p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-slate-200">Delay de Entrega</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Dias despues de cerrar el ciclo antes de enviar reportes a empleados
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-2xl font-bold text-cyan-400">{deliveryDelay}</span>
                <span className="text-sm text-slate-400 ml-1">dias</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={deliveryDelay}
              onChange={e => setDeliveryDelay(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1 dia</span>
              <span>15 dias</span>
              <span>30 dias</span>
            </div>
          </motion.div>

          {/* Link Expiration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="fhr-card p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Link2 className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-slate-200">Expiracion de Enlace</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Dias que el enlace del reporte permanece activo despues del envio
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-2xl font-bold text-purple-400">{linkExpiration}</span>
                <span className="text-sm text-slate-400 ml-1">dias</span>
              </div>
            </div>
            <input
              type="range"
              min={7}
              max={90}
              value={linkExpiration}
              onChange={e => setLinkExpiration(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>7 dias</span>
              <span>45 dias</span>
              <span>90 dias</span>
            </div>
          </motion.div>

          {/* Enable/Disable Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="fhr-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-slate-200">Reportes Individuales</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Enviar reportes de resultados directamente a cada empleado evaluado
                </p>
              </div>
              <button
                onClick={() => setEnableReports(!enableReports)}
                className="flex-shrink-0"
              >
                {enableReports ? (
                  <ToggleRight className="w-10 h-10 text-green-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-500" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Preview Impact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="fhr-card p-4 border-blue-500/20"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-400">
                <p className="font-medium text-blue-300 mb-1">Vista Previa Configuracion</p>
                {enableReports ? (
                  <p>
                    Los reportes se enviaran <strong className="text-slate-200">{deliveryDelay} dias</strong> despues de cerrar cada ciclo.
                    Los empleados tendran <strong className="text-slate-200">{linkExpiration} dias</strong> para acceder al enlace.
                  </p>
                ) : (
                  <p className="text-amber-400">
                    Los reportes individuales estan desactivados. Los empleados no recibiran sus resultados.
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <div className="fhr-card p-4 border-red-500/30 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" />
                Guardado exitosamente
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="fhr-btn fhr-btn-primary flex items-center gap-2 disabled:opacity-40"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar Cambios
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
