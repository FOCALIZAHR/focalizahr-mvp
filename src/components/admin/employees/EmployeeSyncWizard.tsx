'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, UserPlus, RefreshCw, UserMinus,
         CheckCircle, AlertTriangle, X, Download, Users,
         XCircle, Clock, RotateCcw, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PrimaryButton,
  GhostButton,
  DangerButton,
  SuccessButton,
  ButtonGroup
} from '@/components/ui/PremiumButton'

type WizardStep = 'dropzone' | 'analyzing' | 'preview' | 'threshold' | 'success' | 'error'

interface ImportResult {
  status: 'COMPLETED' | 'AWAITING_CONFIRMATION' | 'FAILED'
  importId: string
  created: number
  updated: number
  rehired: number
  pendingReview: number
  errors: number
  thresholdExceeded?: boolean
  missingPercent?: number
}

interface EmployeeSyncWizardProps {
  accountId?: string  // Opcional: si viene, se envia al API (para FOCALIZAHR_ADMIN)
  onComplete: () => void
  onCancel: () => void
}

export default function EmployeeSyncWizard({ accountId, onComplete, onCancel }: EmployeeSyncWizardProps) {
  const [step, setStep] = useState<WizardStep>('dropzone')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Auto-deactivate state
  const [autoDeactivateMissing, setAutoDeactivateMissing] = useState(false)
  const [showDeactivateConfirmModal, setShowDeactivateConfirmModal] = useState(false)
  const [pendingDeactivateCount, setPendingDeactivateCount] = useState(0)
  const [parsedEmployees, setParsedEmployees] = useState<any[]>([])
  const [isDeactivating, setIsDeactivating] = useState(false)

  // Robust CSV line parser that handles quoted values
  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''))
    return result
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0]
    if (!csvFile) return

    setFile(csvFile)
    setStep('analyzing')

    try {
      // Parse CSV with robust handling
      let text = await csvFile.text()

      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1)
      }

      // Normalize line endings and split
      const lines = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .filter(line => line.trim() !== '')

      console.log('[CSV] Lines:', lines.length)
      console.log('[CSV] First line:', lines[0])

      if (lines.length < 2) {
        throw new Error('El archivo debe tener al menos una fila de headers y una de datos')
      }

      // Detect delimiter (comma or semicolon)
      const firstLine = lines[0]
      const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ','
      console.log('[CSV] Delimiter:', delimiter)

      // Parse headers
      const headers = parseCSVLine(lines[0], delimiter).map(h =>
        h.toLowerCase().replace(/[^a-z0-9]/g, '')
      )
      console.log('[CSV] Headers:', headers)

      // Parse data rows
      const employees = lines.slice(1).map((line) => {
        const values = parseCSVLine(line, delimiter)
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => {
          obj[h] = values[i] || ''
        })

        // Determine isActive - EXPLICIT, not inferred
        const isActiveRaw = (obj.isactive || obj.activo || obj.estado || 'true').toLowerCase().trim()
        const isActive = !['false', '0', 'no', 'inactivo', 'inactive'].includes(isActiveRaw)

        return {
          // OBLIGATORIOS
          nationalId: obj.nationalid || obj.rut || obj.run || obj.nationalid || '',
          fullName: obj.fullname || obj.nombre || obj.nombrecompleto || '',
          departmentName: obj.departmentname || obj.departamento || obj.department || obj.area || obj.gerencia || '',
          hireDate: obj.hiredate || obj.fechaingreso || obj.ingreso || obj.fechacontratacion || '',
          isActive,

          // OPCIONALES
          email: obj.email || obj.correo || obj.mail || undefined,
          phoneNumber: obj.phonenumber || obj.celular || obj.telefono || obj.phone || undefined,
          managerRut: obj.managerrut || obj.jefe || obj.manager || obj.rutjefe || obj.supervisor || undefined,
          position: obj.position || obj.cargo || obj.puesto || undefined,
          jobTitle: obj.jobtitle || obj.titulo || obj.titulocargo || undefined,
          seniorityLevel: obj.senioritylevel || obj.nivel || obj.nivelsenioridad || obj.seniority || undefined
        }
      }).filter(e => e.nationalId && e.fullName && e.departmentName)

      console.log('[CSV] Parsed employees:', employees.length)
      if (employees.length > 0) {
        console.log('[CSV] First employee:', employees[0])
      }

      // Validate before sending
      if (!employees || employees.length === 0) {
        throw new Error('No se pudieron parsear empleados del CSV. Verifica que tenga columnas nationalId/rut y fullName/nombre.')
      }

      // Guardar para posible re-envío con autoDeactivate
      setParsedEmployees(employees)

      // Enviar a API
      setIsUploading(true)
      const token = localStorage.getItem('focalizahr_token')
      console.log('[API] Sending:', { employees: employees.length, accountId })

      const response = await fetch('/api/admin/employees/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employees,
          ...(accountId && { accountId })  // Solo incluir si viene de admin
        })
      })

      const data = await response.json()
      setIsUploading(false)

      console.log('[API] Response:', data)

      if (!data.success) {
        throw new Error(data.error || 'Error al procesar archivo')
      }

      setResult(data)

      if (data.status === 'AWAITING_CONFIRMATION') {
        setStep('threshold')
      } else {
        setStep('preview')
      }

    } catch (err: unknown) {
      setIsUploading(false)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('[CSV] Error:', errorMessage)
      setError(errorMessage)
      setStep('error')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  })

  const handleConfirm = async () => {
    if (result?.status === 'AWAITING_CONFIRMATION' && confirmText !== 'CONFIRMAR') return

    // Si autoDeactivate activo, mostrar modal de confirmación
    if (autoDeactivateMissing && result && result.pendingReview > 0) {
      setPendingDeactivateCount(result.pendingReview)
      setShowDeactivateConfirmModal(true)
      return
    }

    setStep('success')
  }

  // Ejecutar sync con autoDeactivateMissing
  const executeSync = async () => {
    setIsDeactivating(true)
    try {
      const token = localStorage.getItem('focalizahr_token')
      const response = await fetch('/api/admin/employees/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employees: parsedEmployees,
          config: { autoDeactivateMissing: true },
          ...(accountId && { accountId })
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error en sincronizacion')
      }

      setResult(data)
      setShowDeactivateConfirmModal(false)
      setStep('success')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setShowDeactivateConfirmModal(false)
      setError(errorMessage)
      setStep('error')
    } finally {
      setIsDeactivating(false)
    }
  }

  const downloadTemplate = () => {
    const template = `nationalId,fullName,email,phoneNumber,departmentName,managerRut,position,jobTitle,seniorityLevel,hireDate,isActive
12345678-9,Juan Perez,juan@empresa.cl,+56912345678,Gerencia General,,CEO,Chief Executive Officer,executive,2020-01-01,true
11111111-1,Maria Garcia,maria@empresa.cl,+56987654321,Comercial,12345678-9,Gerente Comercial,Sales Manager,lead,2021-03-01,true
22222222-2,Pedro Lopez,pedro@empresa.cl,,Ventas,11111111-1,Vendedor Senior,Sales Representative,senior,2022-06-15,true
33333333-3,Ana Martinez,ana@empresa.cl,+56955555555,Administracion,,Ex-Asistente,Administrative Assistant,junior,2023-01-10,false`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_empleados.csv'
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-slate-800">
          <div className="fhr-top-line" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-light text-slate-200">Cargar Colaboradores</h2>
            <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* DROPZONE */}
            {step === 'dropzone' && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                    transition-all duration-300
                    ${isDragActive
                      ? 'border-cyan-500 bg-cyan-500/5'
                      : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'}
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                  <p className="text-slate-300 font-medium mb-1">
                    {isDragActive ? 'Suelta el archivo aqui' : 'Arrastra tu archivo CSV'}
                  </p>
                  <p className="text-sm text-slate-500">o haz click para seleccionar</p>
                </div>

                <GhostButton
                  icon={Download}
                  fullWidth
                  onClick={downloadTemplate}
                >
                  Descargar template CSV
                </GhostButton>
              </motion.div>
            )}

            {/* ANALYZING */}
            {step === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center"
              >
                <div className="fhr-spinner fhr-spinner-lg mx-auto mb-4" />
                <p className="text-slate-300">Analizando archivo...</p>
                <p className="text-sm text-slate-500 mt-1">{file?.name}</p>
              </motion.div>
            )}

            {/* PREVIEW */}
            {step === 'preview' && result && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <h3 className="text-center text-slate-400 font-light">Impacto de la Carga</h3>

                <div className="grid grid-cols-3 gap-4">
                  {/* Nuevos */}
                  <div className="fhr-card-metric text-center">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    <p className="text-3xl font-light text-emerald-400">{result.created}</p>
                    <p className="text-sm text-slate-500">Nuevos</p>
                  </div>

                  {/* Actualizados */}
                  <div className="fhr-card-metric text-center">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                    <p className="text-3xl font-light text-cyan-400">{result.updated + result.rehired}</p>
                    <p className="text-sm text-slate-500">Actualizados</p>
                  </div>

                  {/* Pendientes */}
                  <div className={`fhr-card-metric text-center ${result.pendingReview > 0 ? 'fhr-card-metric-warning' : ''}`}>
                    <UserMinus className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                    <p className="text-3xl font-light text-amber-400">{result.pendingReview}</p>
                    <p className="text-sm text-slate-500">Revision</p>
                  </div>
                </div>

                {result.errors > 0 && (
                  <p className="text-center text-sm text-rose-400">
                    {result.errors} registros con errores (omitidos)
                  </p>
                )}

                {/* Opción avanzada: desactivar empleados no incluidos */}
                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center h-6">
                      <input
                        type="checkbox"
                        id="autoDeactivateMissing"
                        checked={autoDeactivateMissing}
                        onChange={(e) => setAutoDeactivateMissing(e.target.checked)}
                        className="w-4 h-4 text-cyan-500 border-slate-600 rounded
                                   focus:ring-cyan-500 focus:ring-offset-slate-900
                                   bg-slate-800 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="autoDeactivateMissing"
                        className="font-medium text-slate-200 cursor-pointer"
                      >
                        Desactivar empleados no incluidos en el archivo
                      </label>
                      <p className="text-sm text-slate-400 mt-1">
                        Los empleados activos que no aparezcan en este archivo seran
                        marcados como INACTIVE automaticamente.
                      </p>

                      {autoDeactivateMissing && (
                        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <span className="text-sm text-amber-400">
                              Esta opcion desactivara empleados que no esten en el CSV.
                              Se solicitara confirmacion antes de proceder.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <ButtonGroup spacing={12} fullWidth>
                  <GhostButton fullWidth onClick={onCancel}>
                    Cancelar
                  </GhostButton>
                  <PrimaryButton
                    fullWidth
                    icon={CheckCircle}
                    onClick={handleConfirm}
                  >
                    Aceptar
                  </PrimaryButton>
                </ButtonGroup>
              </motion.div>
            )}

            {/* THRESHOLD WARNING */}
            {step === 'threshold' && result && (
              <motion.div
                key="threshold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-400" />
                  <h3 className="text-xl font-light text-slate-200 mb-2">Atencion Requerida</h3>
                  <p className="text-slate-400">
                    Se detecto un {((result.missingPercent || 0) * 100).toFixed(1)}% de empleados ausentes.
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    El umbral de seguridad es 10%.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-400">
                    Escribe <span className="font-mono text-cyan-400">CONFIRMAR</span> para continuar:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="CONFIRMAR"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg
                               text-center font-mono text-slate-200 placeholder-slate-600
                               focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <ButtonGroup spacing={12} fullWidth>
                  <GhostButton fullWidth onClick={onCancel}>
                    Cancelar
                  </GhostButton>
                  <DangerButton
                    fullWidth
                    disabled={confirmText !== 'CONFIRMAR'}
                    onClick={handleConfirm}
                  >
                    Confirmar Carga
                  </DangerButton>
                </ButtonGroup>
              </motion.div>
            )}

            {/* SUCCESS */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <CheckCircle className="w-20 h-20 mx-auto mb-4 text-emerald-400" />
                </motion.div>
                <h3 className="text-xl font-light text-slate-200 mb-2">Carga Completada</h3>
                <p className="text-slate-400">
                  {result?.created} creados, {(result?.updated || 0) + (result?.rehired || 0)} actualizados
                </p>
                <div className="mt-6">
                  <SuccessButton
                    icon={Users}
                    size="lg"
                    onClick={() => {
                      console.log('[Wizard] Ver Colaboradores clicked, calling onComplete')
                      onComplete()
                    }}
                  >
                    Ver Colaboradores
                  </SuccessButton>
                </div>
              </motion.div>
            )}

            {/* ERROR */}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <X className="w-20 h-20 mx-auto mb-4 text-rose-400" />
                <h3 className="text-xl font-light text-slate-200 mb-2">Error en la Carga</h3>
                <p className="text-slate-400">{error}</p>
                <div className="mt-6">
                  <GhostButton
                    icon={RefreshCw}
                    onClick={() => setStep('dropzone')}
                  >
                    Reintentar
                  </GhostButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* MODAL CONFIRMACIÓN DESACTIVACIÓN MASIVA */}
      {showDeactivateConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl
                          max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-red-500/10 border-b border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-400">
                  Confirmar Desactivacion Masiva
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-300 mb-4">
                Se desactivaran <span className="font-bold text-red-400">
                  {pendingDeactivateCount} empleados
                </span> que no estan incluidos en el archivo cargado.
              </p>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  Esta accion:
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Cambiara su estado a INACTIVE
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Quedara registrada en el historial
                  </li>
                  <li className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-cyan-500" />
                    Puede revertirse en futuros imports
                  </li>
                </ul>
              </div>

              <p className="text-sm text-slate-400">
                Desea continuar con la sincronizacion?
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-800/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeactivateConfirmModal(false)
                  setAutoDeactivateMissing(false)
                }}
                disabled={isDeactivating}
                className="px-4 py-2 text-slate-300 hover:text-white
                           hover:bg-slate-700 rounded-lg transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  executeSync()
                }}
                disabled={isDeactivating}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white
                           rounded-lg transition-colors font-medium
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  'Si, Desactivar y Continuar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
