# 🎨 TAREA: DÍA 6 - UX Módulo Admin Employees

## OBJETIVO
Crear la interfaz de administración de empleados con diseño premium FocalizaHR.

## PREREQUISITOS
✅ Días 1-5 completados (backend funcionando)
✅ APIs Employee disponibles

---

## REFERENCIAS OBLIGATORIAS (LEER PRIMERO)

Antes de escribir código, LEE estos archivos del proyecto:

1. **Design System:** Buscar `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md`
2. **Filosofía:** Buscar `FILOSOFIA_DISENO_FOCALIZAHR_v1.md`
3. **CSS:** `src/styles/focalizahr-unified.css`

---

## FILOSOFÍA DE DISEÑO (OBLIGATORIO)

```yaml
Estética: Tesla/Apple - Minimalismo premium, NO CRUD genérico
Fondo: fhr-bg-main con blobs cyan/purple sutiles
Tipografía: font-light para títulos, breathing room generoso
Firma Visual: .fhr-top-line (línea de luz Tesla) en cards principales
Mantra: "¿Parece Apple? ¿Se siente FocalizaHR? ¿Funciona en móvil?"
```

---

## ENTREGABLES

```
□ src/components/admin/employees/EmployeeDataTable.tsx
□ src/components/admin/employees/EmployeeSyncWizard.tsx
□ src/components/admin/employees/EmployeeProfile.tsx
□ src/app/admin/employees/page.tsx
□ npx tsc --noEmit sin errores
□ Funcional en localhost:3000/admin/employees
```

---

## COMPONENTE 1: EmployeeDataTable.tsx

**Ruta:** `src/components/admin/employees/EmployeeDataTable.tsx`

### Estructura Visual

```
┌─────────────────────────────────────────────────────────────┐
│  Colaboradores                    [🔍 Buscar...] [+ Cargar] │
├─────────────────────────────────────────────────────────────┤
│  Persona            │ Departamento │ Manager  │ Estado │ ⋮ │
├─────────────────────────────────────────────────────────────┤
│  🔵 Juan Pérez      │ ┌─────────┐  │ 🔵 Ana   │ ● Act  │ ⋮ │
│     juan@empresa.cl │ │Comercial│  │          │        │   │
│                     │ └─────────┘  │          │        │   │
├─────────────────────────────────────────────────────────────┤
│  🔵 María García    │ ┌─────────┐  │ 🔵 Juan  │ ● Act  │ ⋮ │
│     maria@empresa.cl│ │ Ventas  │  │          │        │   │
└─────────────────────────────────────────────────────────────┘
```

### Implementación

```tsx
'use client'

import { useState, useMemo } from 'react'
import { Search, Upload, MoreHorizontal, UserPlus, Edit, UserMinus } from 'lucide-react'

interface Employee {
  id: string
  fullName: string
  email: string | null
  position: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'PENDING_REVIEW'
  department: { id: string; displayName: string } | null
  manager: { id: string; fullName: string } | null
  _count?: { directReports: number }
}

interface EmployeeDataTableProps {
  employees: Employee[]
  isLoading: boolean
  onUploadClick: () => void
  onViewEmployee: (id: string) => void
  onEditEmployee: (id: string) => void
  onTerminateEmployee: (id: string) => void
}

export default function EmployeeDataTable({
  employees,
  isLoading,
  onUploadClick,
  onViewEmployee,
  onEditEmployee,
  onTerminateEmployee
}: EmployeeDataTableProps) {
  const [search, setSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search) return employees
    const q = search.toLowerCase()
    return employees.filter(e => 
      e.fullName.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.department?.displayName.toLowerCase().includes(q)
    )
  }, [employees, search])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500'
      case 'INACTIVE': return 'bg-rose-500'
      case 'ON_LEAVE': return 'bg-amber-500'
      default: return 'bg-slate-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo'
      case 'INACTIVE': return 'Inactivo'
      case 'ON_LEAVE': return 'Licencia'
      case 'PENDING_REVIEW': return 'Revisión'
      default: return status
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="fhr-card p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="fhr-skeleton w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="fhr-skeleton h-4 w-1/3" />
                <div className="fhr-skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (employees.length === 0) {
    return (
      <div className="fhr-card">
        <div className="fhr-empty-state py-16">
          <UserPlus className="fhr-empty-state-icon" />
          <h3 className="fhr-empty-state-title">Sin colaboradores</h3>
          <p className="fhr-empty-state-text">
            Carga tu nómina para comenzar a gestionar colaboradores
          </p>
          <button onClick={onUploadClick} className="fhr-btn fhr-btn-primary mt-6">
            <Upload className="w-4 h-4 mr-2" />
            Cargar CSV
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fhr-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar colaborador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg
                       text-sm text-slate-200 placeholder-slate-500
                       focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
                       transition-all duration-200"
          />
        </div>
        
        {/* Actions */}
        <button onClick={onUploadClick} className="fhr-btn fhr-btn-primary">
          <Upload className="w-4 h-4 mr-2" />
          Cargar CSV
        </button>
      </div>

      {/* Table */}
      <div className="fhr-table-container">
        <table className="fhr-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Departamento</th>
              <th>Manager</th>
              <th>Estado</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(employee => (
              <tr 
                key={employee.id}
                onClick={() => onViewEmployee(employee.id)}
                className="cursor-pointer hover:bg-slate-800/30 transition-colors"
              >
                {/* Persona */}
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 
                                    flex items-center justify-center text-white text-sm font-medium">
                      {getInitials(employee.fullName)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{employee.fullName}</p>
                      <p className="text-sm text-slate-500">{employee.email || '—'}</p>
                    </div>
                  </div>
                </td>

                {/* Departamento */}
                <td>
                  {employee.department ? (
                    <span className="fhr-badge fhr-badge-active">
                      {employee.department.displayName}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                {/* Manager */}
                <td>
                  {employee.manager ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center 
                                      text-xs text-slate-300">
                        {getInitials(employee.manager.fullName)}
                      </div>
                      <span className="text-sm text-slate-400">{employee.manager.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                {/* Estado */}
                <td>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(employee.status)}`} />
                    <span className="text-sm text-slate-400">{getStatusText(employee.status)}</span>
                  </div>
                </td>

                {/* Acciones */}
                <td onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === employee.id ? null : employee.id)}
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-slate-500" />
                    </button>
                    
                    {openDropdown === employee.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenDropdown(null)} 
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1 
                                        bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
                          <button
                            onClick={() => { onEditEmployee(employee.id); setOpenDropdown(null) }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-300 
                                       hover:bg-slate-700/50 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          {employee.status === 'ACTIVE' && (
                            <button
                              onClick={() => { onTerminateEmployee(employee.id); setOpenDropdown(null) }}
                              className="w-full px-4 py-2 text-left text-sm text-rose-400 
                                         hover:bg-slate-700/50 flex items-center gap-2"
                            >
                              <UserMinus className="w-4 h-4" /> Desvincular
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/50 text-sm text-slate-500">
        {filtered.length} de {employees.length} colaboradores
      </div>
    </div>
  )
}
```

---

## COMPONENTE 2: EmployeeSyncWizard.tsx

**Ruta:** `src/components/admin/employees/EmployeeSyncWizard.tsx`

### Estados del Wizard

```
1. DROPZONE → 2. ANALYZING → 3. PREVIEW → 4. THRESHOLD_WARNING → 5. SUCCESS
```

### Estructura Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐                      │
│                    │   📤 Arrastra   │                      │
│                    │   tu CSV aquí   │                      │
│                    │                 │                      │
│                    │ o haz click     │                      │
│                    └ ─ ─ ─ ─ ─ ─ ─ ─ ┘                      │
│                                                             │
│                    📥 Descargar template                    │
└─────────────────────────────────────────────────────────────┘

                    ↓ Después de cargar

┌─────────────────────────────────────────────────────────────┐
│                 Impacto de la Carga                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   NUEVOS    │  │ ACTUALIZADOS│  │   BAJAS     │         │
│  │     12      │  │      5      │  │      2      │         │
│  │   👤+       │  │     🔄      │  │     👤-     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│           [Cancelar]            [Confirmar Carga]           │
└─────────────────────────────────────────────────────────────┘
```

### Implementación

```tsx
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, UserPlus, RefreshCw, UserMinus, 
         CheckCircle, AlertTriangle, X, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  onComplete: () => void
  onCancel: () => void
}

export default function EmployeeSyncWizard({ onComplete, onCancel }: EmployeeSyncWizardProps) {
  const [step, setStep] = useState<WizardStep>('dropzone')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0]
    if (!csvFile) return

    setFile(csvFile)
    setStep('analyzing')

    try {
      // Parse CSV
      const text = await csvFile.text()
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const employees = lines.slice(1).map(line => {
        const values = line.split(',')
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => {
          obj[h] = values[i]?.trim() || ''
        })
        return {
          nationalId: obj.nationalid || obj.rut,
          fullName: obj.fullname || obj.nombre,
          email: obj.email || obj.correo,
          departmentName: obj.departmentname || obj.departamento,
          managerRut: obj.managerrut || obj.jefe,
          position: obj.position || obj.cargo,
          hireDate: obj.hiredate || obj.fechaingreso,
          isActive: obj.isactive !== 'false' && obj.isactive !== '0'
        }
      }).filter(e => e.nationalId && e.fullName)

      // Enviar a API
      setIsUploading(true)
      const response = await fetch('/api/admin/employees/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employees,
          config: { mode: 'INCREMENTAL' }
        })
      })

      const data = await response.json()
      setIsUploading(false)

      if (!data.success) {
        throw new Error(data.error || 'Error al procesar archivo')
      }

      setResult(data)

      if (data.status === 'AWAITING_CONFIRMATION') {
        setStep('threshold')
      } else {
        setStep('preview')
      }

    } catch (err: any) {
      setIsUploading(false)
      setError(err.message)
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
    setStep('success')
  }

  const downloadTemplate = () => {
    const template = `nationalId,fullName,email,departmentName,managerRut,position,hireDate,isActive
12345678-9,Juan Pérez,juan@empresa.cl,Gerencia General,,CEO,2020-01-01,true
11111111-1,María García,maria@empresa.cl,Comercial,12345678-9,Gerente Comercial,2021-03-01,true`
    
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
                    {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo CSV'}
                  </p>
                  <p className="text-sm text-slate-500">o haz click para seleccionar</p>
                </div>

                <button onClick={downloadTemplate} className="fhr-btn fhr-btn-ghost w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar template CSV
                </button>
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
                    <p className="text-sm text-slate-500">Revisión</p>
                  </div>
                </div>

                {result.errors > 0 && (
                  <p className="text-center text-sm text-rose-400">
                    ⚠️ {result.errors} registros con errores (omitidos)
                  </p>
                )}

                <div className="flex gap-3 pt-4">
                  <button onClick={onCancel} className="fhr-btn fhr-btn-ghost flex-1">
                    Cancelar
                  </button>
                  <button onClick={handleConfirm} className="fhr-btn fhr-btn-primary flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceptar
                  </button>
                </div>
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
                  <h3 className="text-xl font-light text-slate-200 mb-2">Atención Requerida</h3>
                  <p className="text-slate-400">
                    Se detectó un {((result.missingPercent || 0) * 100).toFixed(1)}% de empleados ausentes.
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

                <div className="flex gap-3 pt-4">
                  <button onClick={onCancel} className="fhr-btn fhr-btn-ghost flex-1">
                    Cancelar
                  </button>
                  <button 
                    onClick={handleConfirm}
                    disabled={confirmText !== 'CONFIRMAR'}
                    className="fhr-btn fhr-btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar Carga
                  </button>
                </div>
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
                <h3 className="text-xl font-light text-slate-200 mb-2">¡Carga Completada!</h3>
                <p className="text-slate-400">
                  {result?.created} creados, {(result?.updated || 0) + (result?.rehired || 0)} actualizados
                </p>
                <button onClick={onComplete} className="fhr-btn fhr-btn-primary mt-6">
                  Ver Colaboradores
                </button>
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
                <button onClick={() => setStep('dropzone')} className="fhr-btn fhr-btn-ghost mt-6">
                  Reintentar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
```

---

## COMPONENTE 3: EmployeeProfile.tsx

**Ruta:** `src/components/admin/employees/EmployeeProfile.tsx`

### Estructura Visual

```
┌─────────────────────────────────────────────────────────────┐
│ ═══════════════════════════════════════════════════════════ │ ← fhr-top-line
│                                                      [✕]    │
│  ┌────┐                                                     │
│  │ JM │  Juan Martínez                                      │
│  └────┘  Gerente Comercial                                  │
│          ┌──────────┐ ┌────────┐                            │
│          │Comercial │ │● Activo│                            │
│          └──────────┘ └────────┘                            │
│                                                             │
│  ┌─────────┬───────────┬─────────────┐                      │
│  │ General │ Historial │ Evaluaciones│                      │
│  └─────────┴───────────┴─────────────┘                      │
│                                                             │
│  ┌─ Tab Content ──────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  Email: juan@empresa.cl                                │ │
│  │  RUT: 12.345.678-9                                     │ │
│  │  Fecha ingreso: 15 Ene 2021                            │ │
│  │                                                        │ │
│  │  Manager:                                              │ │
│  │  ┌──────────────────────┐                              │ │
│  │  │ 🔵 Ana López (CEO)   │                              │ │
│  │  └──────────────────────┘                              │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Implementación

```tsx
'use client'

import { useState } from 'react'
import { X, Mail, Phone, Calendar, Building, UserPlus, ArrowRight, 
         TrendingUp, UserMinus, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'

interface EmployeeHistory {
  id: string
  changeType: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  effectiveDate: string
  changeReason: string | null
}

interface Employee {
  id: string
  nationalId: string
  fullName: string
  email: string | null
  phoneNumber: string | null
  position: string | null
  status: string
  hireDate: string
  department: { id: string; displayName: string } | null
  manager: { id: string; fullName: string; position: string | null } | null
  directReports: { id: string; fullName: string; position: string | null }[]
  history: EmployeeHistory[]
}

interface EmployeeProfileProps {
  employee: Employee
  onClose: () => void
  onEdit: () => void
}

export default function EmployeeProfile({ employee, onClose, onEdit }: EmployeeProfileProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'history' | 'evaluations'>('general')

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'HIRE': return <UserPlus className="w-4 h-4 text-emerald-400" />
      case 'TRANSFER': return <ArrowRight className="w-4 h-4 text-cyan-400" />
      case 'PROMOTION': return <TrendingUp className="w-4 h-4 text-purple-400" />
      case 'TERMINATE': return <UserMinus className="w-4 h-4 text-rose-400" />
      case 'REHIRE': return <UserPlus className="w-4 h-4 text-emerald-400" />
      default: return <Briefcase className="w-4 h-4 text-slate-400" />
    }
  }

  const getChangeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'HIRE': 'Contratación',
      'TRANSFER': 'Transferencia',
      'PROMOTION': 'Promoción',
      'TERMINATE': 'Desvinculación',
      'REHIRE': 'Recontratación',
      'UPDATE': 'Actualización',
      'MANAGER_CHANGE': 'Cambio de jefe'
    }
    return labels[type] || type
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative px-6 py-6 border-b border-slate-800">
          <div className="fhr-top-line" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 
                            flex items-center justify-center text-white text-xl font-medium">
              {getInitials(employee.fullName)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-light text-slate-200">{employee.fullName}</h2>
              <p className="text-slate-500">{employee.position || 'Sin cargo'}</p>
              <div className="flex gap-2 mt-2">
                {employee.department && (
                  <span className="fhr-badge fhr-badge-active">{employee.department.displayName}</span>
                )}
                <span className={`fhr-badge ${employee.status === 'ACTIVE' ? 'fhr-badge-success' : 'fhr-badge-error'}`}>
                  {employee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {(['general', 'history', 'evaluations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === tab 
                  ? 'text-cyan-400 border-b-2 border-cyan-400 -mb-px' 
                  : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab === 'general' && 'General'}
              {tab === 'history' && 'Historial'}
              {tab === 'evaluations' && 'Evaluaciones'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB: General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-slate-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    {employee.email || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Teléfono</p>
                  <p className="text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    {employee.phoneNumber || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">RUT</p>
                  <p className="text-slate-300">{employee.nationalId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Fecha Ingreso</p>
                  <p className="text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {formatDate(employee.hireDate)}
                  </p>
                </div>
              </div>

              {/* Manager */}
              {employee.manager && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Manager</p>
                  <div className="fhr-card-metric p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                      {getInitials(employee.manager.fullName)}
                    </div>
                    <div>
                      <p className="text-slate-200">{employee.manager.fullName}</p>
                      <p className="text-sm text-slate-500">{employee.manager.position || 'Sin cargo'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reportes directos */}
              {employee.directReports.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Reportes Directos ({employee.directReports.length})
                  </p>
                  <div className="space-y-2">
                    {employee.directReports.map(report => (
                      <div key={report.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                          {getInitials(report.fullName)}
                        </div>
                        <div>
                          <p className="text-sm text-slate-300">{report.fullName}</p>
                          <p className="text-xs text-slate-500">{report.position || 'Sin cargo'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Historial */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {employee.history.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Sin historial registrado</p>
              ) : (
                <div className="relative pl-6 border-l border-slate-800">
                  {employee.history.map((item, index) => (
                    <div key={item.id} className="relative pb-6 last:pb-0">
                      {/* Nodo */}
                      <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                        {getChangeIcon(item.changeType)}
                      </div>
                      
                      {/* Contenido */}
                      <div className="ml-4">
                        <p className="text-sm text-slate-400">{formatDate(item.effectiveDate)}</p>
                        <p className="text-slate-200 font-medium">{getChangeLabel(item.changeType)}</p>
                        {item.fieldName && (
                          <p className="text-sm text-slate-500">
                            {item.fieldName}: {item.oldValue || '(vacío)'} → {item.newValue || '(vacío)'}
                          </p>
                        )}
                        {item.changeReason && (
                          <p className="text-xs text-slate-600 mt-1">{item.changeReason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Evaluaciones */}
          {activeTab === 'evaluations' && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto mb-4 text-slate-700" />
              <p className="text-slate-500">Próximamente</p>
              <p className="text-sm text-slate-600">Las evaluaciones de desempeño aparecerán aquí</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="fhr-btn fhr-btn-ghost">
            Cerrar
          </button>
          <button onClick={onEdit} className="fhr-btn fhr-btn-secondary">
            Editar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
```

---

## PÁGINA: /admin/employees/page.tsx

**Ruta:** `src/app/admin/employees/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import EmployeeDataTable from '@/components/admin/employees/EmployeeDataTable'
import EmployeeSyncWizard from '@/components/admin/employees/EmployeeSyncWizard'
import EmployeeProfile from '@/components/admin/employees/EmployeeProfile'

interface Employee {
  id: string
  nationalId: string
  fullName: string
  email: string | null
  phoneNumber: string | null
  position: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'PENDING_REVIEW'
  hireDate: string
  department: { id: string; displayName: string } | null
  manager: { id: string; fullName: string; position: string | null } | null
  directReports: { id: string; fullName: string; position: string | null }[]
  history: any[]
  _count?: { directReports: number }
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/employees?limit=100')
      const data = await res.json()
      if (data.success) {
        setEmployees(data.data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleViewEmployee = async (id: string) => {
    setIsLoadingProfile(true)
    try {
      const res = await fetch(`/api/admin/employees/${id}`)
      const data = await res.json()
      if (data.success) {
        setSelectedEmployee(data.data)
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleTerminate = async (id: string) => {
    if (!confirm('¿Estás seguro de desvincular a este colaborador?')) return
    
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'terminate', reason: 'Desvinculación manual' })
      })
      if (res.ok) {
        fetchEmployees()
      }
    } catch (error) {
      console.error('Error terminating employee:', error)
    }
  }

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="fhr-content py-8">
        {/* Hero */}
        <div className="fhr-hero mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-cyan-400" />
            <h1 className="fhr-hero-title">
              Gestión de <span className="fhr-title-gradient">Colaboradores</span>
            </h1>
          </div>
          <p className="text-slate-400">
            Administra tu nómina de empleados y estructura organizacional
          </p>
        </div>

        {/* Divider */}
        <div className="fhr-divider mb-8" />

        {/* Table */}
        <EmployeeDataTable
          employees={employees}
          isLoading={isLoading}
          onUploadClick={() => setShowWizard(true)}
          onViewEmployee={handleViewEmployee}
          onEditEmployee={(id) => console.log('Edit:', id)}
          onTerminateEmployee={handleTerminate}
        />

        {/* Wizard Modal */}
        {showWizard && (
          <EmployeeSyncWizard
            onComplete={() => {
              setShowWizard(false)
              fetchEmployees()
            }}
            onCancel={() => setShowWizard(false)}
          />
        )}

        {/* Profile Modal */}
        {selectedEmployee && (
          <EmployeeProfile
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            onEdit={() => console.log('Edit employee')}
          />
        )}
      </div>
    </div>
  )
}
```

---

## DEPENDENCIAS REQUERIDAS

Si no están instaladas:

```bash
npm install react-dropzone framer-motion
```

---

## VALIDACIÓN FINAL

```bash
# Verificar TypeScript
npx tsc --noEmit

# Probar en navegador
# http://localhost:3000/admin/employees
```

---

## REGLAS

1. USAR clases .fhr-* del design system existente
2. Lucide React para íconos (NO heroicons, NO fontawesome)
3. Framer Motion para animaciones
4. Mobile-first responsive
5. TypeScript estricto
6. Si algo del design system no existe, PREGUNTA antes de inventar
