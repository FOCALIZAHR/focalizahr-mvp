# TASK 13: WIZARD CREAR SESIÓN DE CALIBRACIÓN (v2 CORREGIDA)

> **Versión:** 2.0 Corregida | **Cambios:** Compatibilidad con TASK_12 v2 (roles + campo name)

## 🎯 OBJETIVO
Crear interfaz wizard (paso a paso) para configurar una nueva sesión de calibración.

## 🔄 CAMBIOS v2.0 (Compatibilidad TASK_12)

```yaml
✅ CORRECCIÓN 1: Roles actualizados
   Antes: 'FACILITATOR' | 'PARTICIPANT'
   Ahora: 'FACILITATOR' | 'REVIEWER' | 'OBSERVER'
   
✅ CORRECCIÓN 2: Campo name agregado
   Participant: { email: string; name: string; role: CalibrationRole }
   UI: Campo "Nombre completo" en formulario
```

## 🎨 FILOSOFÍA WIZARD LINEAR FOCALIZAHR

> **IMPORTANTE:** Este NO es Cinema Mode (Patrón F). Es un Wizard Linear con progressive disclosure.

```
┌─────────────────────────────────────────────────────────────────┐
│  WIZARD = GUÍA, NO FORMULARIO                                   │
│                                                                 │
│  • Cada paso tiene UN propósito                                 │
│  • Progreso visible (stepper)                                   │
│  • Validación inline, no al final                               │
│  • Preview antes de confirmar                                   │
│                                                                 │
│  PATRÓN: Stripe Checkout + Notion Onboarding + Linear Issues    │
│  FILOSOFÍA: Mandamientos 1, 2, 3, 5, 6, 7                       │
└─────────────────────────────────────────────────────────────────┘
```

## 🚫 ANTI-PATRONES

```typescript
// ❌ NUNCA: Formulario gigante en una sola pantalla
<form>
  {/* 15 campos seguidos */}
</form>

// ❌ NUNCA: Validar todo al final
onSubmit={() => validateAll()}

// ❌ NUNCA: Modal pequeño para wizard
<Modal className="w-96">

// ✅ CORRECTO: Full-screen takeover con glassmorphism
<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl">
```

## 📁 ARCHIVOS A CREAR

```
src/app/dashboard/performance/calibration/new/page.tsx
src/components/calibration/CalibrationWizard.tsx
src/components/calibration/steps/
├── StepSelectCycle.tsx
├── StepConfigureScope.tsx
├── StepInviteParticipants.tsx
├── StepReviewCreate.tsx
```

## ⚠️ DEPENDENCIAS

- TASK_12 completada (APIs de calibración)
- Framer Motion para transiciones
- **Premium Buttons:** `/src/components/ui/PremiumButton.tsx`

## 📋 INSTRUCCIONES

### PASO 1: Crear componente StepSelectCycle

**Crear:** `src/components/calibration/steps/StepSelectCycle.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// STEP 1: Seleccionar Ciclo de Evaluación
// src/components/calibration/steps/StepSelectCycle.tsx
// ════════════════════════════════════════════════════════════════════════════
// CAMBIOS v2.0:
//  ✅ Copy mejorado (primera persona + beneficio)
//  ✅ Cards usan .fhr-card
//  ✅ Motion timing consistente (50ms stagger)
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Calendar, CheckCircle, Users, AlertCircle } from 'lucide-react'

interface Cycle {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  _count?: {
    ratings: number
  }
}

interface StepSelectCycleProps {
  selectedCycleId: string | null
  onSelect: (cycleId: string, cycle: Cycle) => void
}

export default memo(function StepSelectCycle({
  selectedCycleId,
  onSelect
}: StepSelectCycleProps) {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/performance-cycles?status=COMPLETED')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCycles(json.data || [])
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const completedCycles = cycles.filter(c => c.status === 'COMPLETED')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Selecciona el ciclo que calibrarás
        </h2>
        <p className="text-sm text-slate-400">
          Solo puedes calibrar ciclos completados. Elige el que quieras revisar.
        </p>
      </div>

      {/* Cycles Grid */}
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="fhr-spinner" />
          <p className="text-sm text-slate-400 mt-3">Cargando ciclos...</p>
        </div>
      ) : completedCycles.length === 0 ? (
        <div className="fhr-empty-state">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <p className="text-slate-400">No hay ciclos completados disponibles</p>
          <p className="text-sm text-slate-500 mt-1">
            Completa un ciclo de evaluación primero para calibrar resultados.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {completedCycles.map((cycle, index) => {
            const isSelected = selectedCycleId === cycle.id
            const ratingsCount = cycle._count?.ratings || 0
            
            return (
              <motion.button
                key={cycle.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1]
                }}
                onClick={() => onSelect(cycle.id, cycle)}
                className={cn(
                  'fhr-card w-full p-4 text-left transition-all duration-200',
                  'border-2 group cursor-pointer',
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/50 ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20'
                    : 'border-slate-700/30 hover:border-slate-600/50 hover:scale-[1.01] hover:shadow-xl'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Check indicator */}
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'border-slate-600 group-hover:border-slate-500'
                    )}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>

                    {/* Cycle info */}
                    <div>
                      <div className="font-medium text-white">{cycle.name}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(cycle.endDate).toLocaleDateString('es-CL')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {ratingsCount} evaluaciones
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className="fhr-badge fhr-badge-success">
                    Completado
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
})
```

### PASO 2: Crear componente StepConfigureScope

**Crear:** `src/components/calibration/steps/StepConfigureScope.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// STEP 2: Configurar alcance de la calibración
// src/components/calibration/steps/StepConfigureScope.tsx
// ════════════════════════════════════════════════════════════════════════════
// CAMBIOS v2.0:
//  ✅ Copy mejorado (específico + beneficio)
//  ✅ Inputs usan .fhr-input, .fhr-textarea
//  ✅ Validación inline visible
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Building2, Users, Check, Globe, Calendar } from 'lucide-react'

interface Department {
  id: string
  displayName: string
  _count?: {
    employees: number
  }
}

interface StepConfigureScopeProps {
  sessionName: string
  onNameChange: (name: string) => void
  description: string
  onDescriptionChange: (desc: string) => void
  selectedDepartments: string[]
  onDepartmentsChange: (ids: string[]) => void
  scheduledAt: string
  onScheduledAtChange: (date: string) => void
}

export default memo(function StepConfigureScope({
  sessionName,
  onNameChange,
  description,
  onDescriptionChange,
  selectedDepartments,
  onDepartmentsChange,
  scheduledAt,
  onScheduledAtChange
}: StepConfigureScopeProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [scopeType, setScopeType] = useState<'all' | 'specific'>(
    selectedDepartments.length === 0 ? 'all' : 'specific'
  )

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setDepartments(json.data || [])
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleScopeChange = (type: 'all' | 'specific') => {
    setScopeType(type)
    if (type === 'all') {
      onDepartmentsChange([])
    }
  }

  const toggleDepartment = (deptId: string) => {
    if (selectedDepartments.includes(deptId)) {
      onDepartmentsChange(selectedDepartments.filter(id => id !== deptId))
    } else {
      onDepartmentsChange([...selectedDepartments, deptId])
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Configura tu sesión de calibración
        </h2>
        <p className="text-sm text-slate-400">
          Define nombre, descripción y alcance para organizar mejor los resultados.
        </p>
      </div>

      {/* Nombre */}
      <div>
        <label className="fhr-label">
          Nombre de la sesión
        </label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Calibración Q4 2025 - Comercial"
          className="fhr-input"
        />
        <p className="text-xs text-slate-500 mt-1">
          Usa un nombre descriptivo que identifique el periodo y área.
        </p>
      </div>

      {/* Descripción */}
      <div>
        <label className="fhr-label">
          Descripción (opcional)
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Ej: Sesión para calibrar evaluaciones del equipo comercial, zona centro..."
          rows={3}
          className="fhr-textarea"
        />
      </div>

      {/* Fecha programada */}
      <div>
        <label className="fhr-label">
          Fecha de la sesión
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => onScheduledAtChange(e.target.value)}
            className="fhr-input pl-10"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Los participantes recibirán notificación antes de la reunión.
        </p>
      </div>

      {/* Alcance */}
      <div>
        <label className="fhr-label mb-3">
          Alcance de la calibración
        </label>

        {/* Opciones */}
        <div className="grid gap-3 mb-4">
          <button
            onClick={() => handleScopeChange('all')}
            className={cn(
              'fhr-card p-4 text-left transition-all duration-200',
              'border-2 cursor-pointer',
              scopeType === 'all'
                ? 'bg-cyan-500/10 border-cyan-500/50 ring-2 ring-cyan-500'
                : 'border-slate-700/30 hover:border-slate-600/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                scopeType === 'all' ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'
              )}>
                {scopeType === 'all' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="font-medium text-white">Toda la empresa</div>
                  <div className="text-xs text-slate-500">
                    Calibrar evaluaciones de todos los departamentos
                  </div>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleScopeChange('specific')}
            className={cn(
              'fhr-card p-4 text-left transition-all duration-200',
              'border-2 cursor-pointer',
              scopeType === 'specific'
                ? 'bg-cyan-500/10 border-cyan-500/50 ring-2 ring-cyan-500'
                : 'border-slate-700/30 hover:border-slate-600/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                scopeType === 'specific' ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'
              )}>
                {scopeType === 'specific' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-medium text-white">Departamentos específicos</div>
                  <div className="text-xs text-slate-500">
                    Selecciona qué equipos quieres incluir
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Departamentos (si specific) */}
        {scopeType === 'specific' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <p className="text-xs text-slate-500 mb-2">
              Selecciona uno o más departamentos:
            </p>
            
            {isLoading ? (
              <div className="py-4 text-center">
                <div className="fhr-spinner mx-auto" />
              </div>
            ) : (
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {departments.map((dept) => {
                  const isSelected = selectedDepartments.includes(dept.id)
                  const employeeCount = dept._count?.employees || 0
                  
                  return (
                    <button
                      key={dept.id}
                      onClick={() => toggleDepartment(dept.id)}
                      className={cn(
                        'fhr-card p-3 text-left transition-all duration-200',
                        'border cursor-pointer',
                        isSelected
                          ? 'bg-purple-500/10 border-purple-500/50'
                          : 'border-slate-700/30 hover:border-slate-600/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-4 h-4 rounded border-2',
                            isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-600'
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm text-white">{dept.displayName}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {employeeCount} personas
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
})
```

### PASO 3: Crear componente StepInviteParticipants

**Crear:** `src/components/calibration/steps/StepInviteParticipants.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// STEP 3: Invitar Participantes
// src/components/calibration/steps/StepInviteParticipants.tsx
// ════════════════════════════════════════════════════════════════════════════
// CAMBIOS v2.1 (TASK_12 Compatibility):
//  ✅ Roles: FACILITATOR | REVIEWER | OBSERVER (3 opciones)
//  ✅ Campo name agregado (requerido por API)
//  ✅ Descripción de roles actualizada
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { UserPlus, X, Mail, Shield, Users, Eye, User } from 'lucide-react'

interface Participant {
  email: string
  name: string
  role: 'FACILITATOR' | 'REVIEWER' | 'OBSERVER'
}

interface StepInviteParticipantsProps {
  participants: Participant[]
  onParticipantsChange: (participants: Participant[]) => void
  currentUserEmail?: string
}

export default memo(function StepInviteParticipants({
  participants,
  onParticipantsChange,
  currentUserEmail
}: StepInviteParticipantsProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'FACILITATOR' | 'REVIEWER' | 'OBSERVER'>('REVIEWER')
  const [error, setError] = useState('')

  const handleAdd = () => {
    setError('')
    
    // Validaciones
    if (!email.trim()) {
      setError('Ingresa un email')
      return
    }
    
    if (!name.trim()) {
      setError('Ingresa el nombre completo')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Email inválido')
      return
    }
    
    if (participants.some(p => p.email === email)) {
      setError('Este email ya fue agregado')
      return
    }
    
    if (email === currentUserEmail) {
      setError('No puedes agregarte a ti mismo')
      return
    }
    
    // Agregar
    onParticipantsChange([...participants, { email, name, role }])
    setEmail('')
    setName('')
    setRole('REVIEWER')
  }

  const handleRemove = (emailToRemove: string) => {
    onParticipantsChange(participants.filter(p => p.email !== emailToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'FACILITATOR':
        return <span className="fhr-badge fhr-badge-active text-xs">Facilitador</span>
      case 'REVIEWER':
        return <span className="fhr-badge fhr-badge-success text-xs">Revisor</span>
      case 'OBSERVER':
        return <span className="fhr-badge text-xs bg-slate-700 text-slate-300">Observador</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Invita a los managers que calibrarán
        </h2>
        <p className="text-sm text-slate-400">
          Agrega participantes y asigna su rol en la sesión de calibración.
        </p>
      </div>

      {/* Agregar participante */}
      <div className="fhr-card p-4 space-y-4">
        <div className="grid gap-4">
          {/* Nombre */}
          <div>
            <label className="fhr-label">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Juan Pérez"
                className="fhr-input pl-10"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="fhr-label">
                Email corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="juan.perez@empresa.com"
                  className="fhr-input pl-10"
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="fhr-label">
                Rol en la sesión
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'FACILITATOR' | 'REVIEWER' | 'OBSERVER')}
                className="fhr-select"
              >
                <option value="REVIEWER">Revisor (puede ajustar)</option>
                <option value="FACILITATOR">Facilitador (conduce + ajusta + cierra)</option>
                <option value="OBSERVER">Observador (solo visualiza)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Botón agregar */}
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Agregar Participante
        </button>
      </div>

      {/* Descripción de roles */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="fhr-card p-3 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Facilitador</span>
          </div>
          <p className="text-xs text-slate-500">
            Conduce la sesión, puede ajustar ratings y cerrarla.
          </p>
        </div>
        
        <div className="fhr-card p-3 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Revisor</span>
          </div>
          <p className="text-xs text-slate-500">
            Puede ver evaluaciones y hacer ajustes con justificación.
          </p>
        </div>

        <div className="fhr-card p-3 border border-slate-600/20">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-400">Observador</span>
          </div>
          <p className="text-xs text-slate-500">
            Solo puede ver la sesión, no puede hacer ajustes.
          </p>
        </div>
      </div>

      {/* Lista de participantes */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">
          Participantes agregados ({participants.length})
        </h3>
        
        {participants.length === 0 ? (
          <div className="fhr-empty-state py-6">
            <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">
              Aún no has agregado participantes
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Agrega al menos un facilitador para continuar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {participants.map((participant, index) => (
                <motion.div
                  key={participant.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="fhr-card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{participant.name}</div>
                      <div className="text-xs text-slate-500">{participant.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getRoleBadge(participant.role)}
                    <button
                      onClick={() => handleRemove(participant.email)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
})
```

### PASO 4: Crear componente StepReviewCreate

**Crear:** `src/components/calibration/steps/StepReviewCreate.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// STEP 4: Revisar y Crear
// src/components/calibration/steps/StepReviewCreate.tsx
// ════════════════════════════════════════════════════════════════════════════
// CAMBIOS v2.0:
//  ✅ Copy mejorado (accionable)
//  ✅ Card review premium con dividers
//  ✅ Grid de métricas con .fhr-card-metric
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, Calendar, Building2, Users, FileText, Clock } from 'lucide-react'

interface StepReviewCreateProps {
  cycleName: string
  sessionName: string
  description: string
  scheduledAt: string
  selectedDepartments: string[]
  departmentNames?: string[]
  participants: Array<{ email: string; name: string; role: string }>
}

export default memo(function StepReviewCreate({
  cycleName,
  sessionName,
  description,
  scheduledAt,
  selectedDepartments,
  departmentNames = [],
  participants
}: StepReviewCreateProps) {
  const facilitators = participants.filter(p => p.role === 'FACILITATOR')
  const reviewers = participants.filter(p => p.role === 'REVIEWER')
  const observers = participants.filter(p => p.role === 'OBSERVER')
  
  const scopeLabel = selectedDepartments.length === 0
    ? 'Toda la empresa'
    : `${selectedDepartments.length} departamento(s)`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="fhr-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Listo para crear</h2>
            <p className="text-sm text-slate-400">
              Revisa la configuración antes de confirmar la sesión.
            </p>
          </div>
        </div>

        {/* Divider decorativo */}
        <div className="fhr-divider my-4" />

        {/* Nombre sesión */}
        <div className="mb-6">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
            Sesión de calibración
          </div>
          <h3 className="text-2xl font-semibold text-white">{sessionName}</h3>
        </div>

        {/* Métricas */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="fhr-card-metric">
            <Calendar className="w-5 h-5 text-cyan-400 mb-2" />
            <div className="text-xs text-slate-500">Ciclo</div>
            <div className="text-sm font-medium text-white">{cycleName}</div>
          </div>
          
          <div className="fhr-card-metric">
            <Clock className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-xs text-slate-500">Programada</div>
            <div className="text-sm font-medium text-white">
              {new Date(scheduledAt).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          
          <div className="fhr-card-metric">
            <Building2 className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-xs text-slate-500">Alcance</div>
            <div className="text-sm font-medium text-white">{scopeLabel}</div>
          </div>
        </div>
      </div>

      {/* Descripción */}
      {description && (
        <div className="fhr-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Descripción</span>
          </div>
          <p className="text-sm text-slate-300">{description}</p>
        </div>
      )}

      {/* Departamentos específicos */}
      {selectedDepartments.length > 0 && departmentNames.length > 0 && (
        <div className="fhr-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-slate-400">
              Departamentos incluidos
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {departmentNames.map((name, index) => (
              <span
                key={index}
                className="fhr-badge fhr-badge-active"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Participantes */}
      <div className="fhr-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-400">
            Participantes ({participants.length})
          </span>
        </div>

        {/* Facilitadores */}
        {facilitators.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-cyan-400 mb-2">
              Facilitadores ({facilitators.length})
            </div>
            <div className="space-y-1">
              {facilitators.map((p) => (
                <div key={p.email} className="text-sm text-slate-300">
                  • {p.name} <span className="text-slate-500">({p.email})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revisores */}
        {reviewers.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-emerald-400 mb-2">
              Revisores ({reviewers.length})
            </div>
            <div className="space-y-1">
              {reviewers.map((p) => (
                <div key={p.email} className="text-sm text-slate-300">
                  • {p.name} <span className="text-slate-500">({p.email})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observadores */}
        {observers.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-400 mb-2">
              Observadores ({observers.length})
            </div>
            <div className="space-y-1">
              {observers.map((p) => (
                <div key={p.email} className="text-sm text-slate-300">
                  • {p.name} <span className="text-slate-500">({p.email})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmación */}
      <div className="fhr-card p-4 bg-emerald-500/5 border-emerald-500/20">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-white mb-1">
              Todo listo para crear
            </div>
            <p className="text-xs text-slate-400">
              Los participantes recibirán un email de invitación con acceso a la sesión.
              Podrás editar la configuración después de crearla.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
```

### PASO 5: Crear CalibrationWizard (Orquestador)

**Crear:** `src/components/calibration/CalibrationWizard.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION WIZARD - Orquestador Principal
// src/components/calibration/CalibrationWizard.tsx
// ════════════════════════════════════════════════════════════════════════════
// CAMBIOS v2.0:
//  ✅ Header con glassmorphism + línea Tesla dinámica
//  ✅ Premium Buttons (PrimaryButton, GhostButton)
//  ✅ Motion timing consistente (200ms, 400ms)
//  ✅ Stepper mejorado con ring effects
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, Check, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'

import StepSelectCycle from './steps/StepSelectCycle'
import StepConfigureScope from './steps/StepConfigureScope'
import StepInviteParticipants from './steps/StepInviteParticipants'
import StepReviewCreate from './steps/StepReviewCreate'

const STEPS = [
  { id: 1, name: 'Ciclo' },
  { id: 2, name: 'Configuración' },
  { id: 3, name: 'Participantes' },
  { id: 4, name: 'Revisar' }
]

interface WizardData {
  cycleId: string
  cycleName: string
  sessionName: string
  description: string
  scheduledAt: string
  selectedDepartments: string[]
  departmentNames: string[]
  participants: Array<{ email: string; name: string; role: 'FACILITATOR' | 'REVIEWER' | 'OBSERVER' }>
}

export default function CalibrationWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentUserEmail] = useState('user@empresa.com') // TODO: Get from auth

  const [data, setData] = useState<WizardData>({
    cycleId: '',
    cycleName: '',
    sessionName: '',
    description: '',
    scheduledAt: '',
    selectedDepartments: [],
    departmentNames: [],
    participants: []
  })

  // Validación por paso
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return !!data.cycleId
      case 2:
        return !!data.sessionName.trim() && !!data.scheduledAt
      case 3:
        return data.participants.some(p => p.role === 'FACILITATOR')
      case 4:
        return true
      default:
        return false
    }
  }, [currentStep, data])

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setError('')
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setError('')
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    
    try {
      const res = await fetch('/api/calibration/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: data.cycleId,
          name: data.sessionName,
          description: data.description,
          scheduledAt: data.scheduledAt,
          departmentIds: data.selectedDepartments.length > 0 ? data.selectedDepartments : undefined,
          participants: data.participants
        })
      })
      
      const json = await res.json()
      
      if (!json.success) {
        throw new Error(json.error || 'Error creando sesión')
      }
      
      router.push(`/dashboard/performance/calibration/${json.data.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Color dinámico de línea Tesla
  const teslaLineColor = useMemo(() => {
    if (currentStep === 4) return '#10B981' // Verde success
    return '#22D3EE' // Cyan default
  }, [currentStep])

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
      {/* Header con glassmorphism + línea Tesla */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
        {/* Línea Tesla dinámica */}
        <div 
          className="absolute top-0 left-0 right-0 h-[1px] transition-all duration-400"
          style={{
            background: `linear-gradient(90deg, transparent, ${teslaLineColor}, transparent)`,
            boxShadow: `0 0 15px ${teslaLineColor}`
          }}
        />

        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Título */}
          <div>
            <h1 className="text-lg font-semibold text-white">Nueva Sesión de Calibración</h1>
            <p className="text-xs text-slate-500">
              Paso {currentStep} de {STEPS.length}
            </p>
          </div>

          {/* Stepper (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200',
                  currentStep > step.id && 'bg-cyan-500 text-white',
                  currentStep === step.id && 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500',
                  currentStep < step.id && 'bg-slate-800 text-slate-500'
                )}>
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    'w-8 h-[2px] mx-1 transition-all duration-200',
                    currentStep > step.id ? 'bg-cyan-500' : 'bg-slate-700'
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Cerrar */}
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentStep === 1 && (
              <StepSelectCycle
                selectedCycleId={data.cycleId}
                onSelect={(cycleId, cycle) => setData(prev => ({
                  ...prev,
                  cycleId,
                  cycleName: cycle.name,
                  sessionName: prev.sessionName || `Calibración - ${cycle.name}`
                }))}
              />
            )}

            {currentStep === 2 && (
              <StepConfigureScope
                sessionName={data.sessionName}
                onNameChange={(name) => setData(prev => ({ ...prev, sessionName: name }))}
                description={data.description}
                onDescriptionChange={(desc) => setData(prev => ({ ...prev, description: desc }))}
                selectedDepartments={data.selectedDepartments}
                onDepartmentsChange={(ids) => setData(prev => ({ ...prev, selectedDepartments: ids }))}
                scheduledAt={data.scheduledAt}
                onScheduledAtChange={(date) => setData(prev => ({ ...prev, scheduledAt: date }))}
              />
            )}

            {currentStep === 3 && (
              <StepInviteParticipants
                participants={data.participants}
                onParticipantsChange={(p) => setData(prev => ({ ...prev, participants: p }))}
                currentUserEmail={currentUserEmail}
              />
            )}

            {currentStep === 4 && (
              <StepReviewCreate
                cycleName={data.cycleName}
                sessionName={data.sessionName}
                description={data.description}
                scheduledAt={data.scheduledAt}
                selectedDepartments={data.selectedDepartments}
                departmentNames={data.departmentNames}
                participants={data.participants}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
          <GhostButton
            icon={ArrowLeft}
            onClick={handleBack}
            disabled={currentStep === 1}
            size="md"
          >
            Anterior
          </GhostButton>

          {currentStep < 4 ? (
            <PrimaryButton
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleNext}
              disabled={!canProceed()}
              size="md"
            >
              Siguiente
            </PrimaryButton>
          ) : (
            <PrimaryButton
              icon={isSubmitting ? Loader2 : Check}
              onClick={handleSubmit}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              size="md"
              glow={true}
            >
              {isSubmitting ? 'Creando...' : 'Crear Sesión'}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  )
}
```

### PASO 6: Crear página

**Crear:** `src/app/dashboard/performance/calibration/new/page.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// NEW CALIBRATION PAGE
// src/app/dashboard/performance/calibration/new/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import CalibrationWizard from '@/components/calibration/CalibrationWizard'

export const metadata = {
  title: 'Nueva Calibración | FocalizaHR'
}

export default function NewCalibrationPage() {
  return <CalibrationWizard />
}
```

## ✅ CHECKLIST

### Funcionalidad Base
- [ ] Step 1: Ciclos completados se listan, selección funciona
- [ ] Step 2: Nombre, descripción, fecha, alcance configurables
- [ ] Step 3: Agregar/quitar participantes, roles asignables
- [ ] Step 4: Resumen muestra todos los datos correctamente
- [ ] Stepper visual indica progreso con línea Tesla dinámica
- [ ] Validación por paso (no avanza sin completar)
- [ ] Submit crea sesión via API
- [ ] Redirect a sesión creada

### Compatibilidad TASK_12 v2 ✅
- [ ] **Roles correctos:** FACILITATOR | REVIEWER | OBSERVER (no PARTICIPANT)
- [ ] **Campo name capturado** en formulario de participantes
- [ ] **API recibe:** `participants: [{ email, name, role }]`
- [ ] **Validación:** Al menos 1 FACILITATOR requerido
- [ ] **Preview muestra:** name + email por participante
- [ ] **3 secciones en preview:** Facilitadores, Revisores, Observadores

### Diseño & UX
- [ ] **Premium Buttons implementados** ✅
- [ ] **Motion timing consistente (200ms/400ms)** ✅
- [ ] **Copy mejorado (primera persona + beneficio)** ✅
- [ ] **Clases .fhr-* aplicadas** ✅

## 🎯 RESULTADO VISUAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ═══════════════════════════════════════════════════════════════════════│ ← Línea Tesla
│                                                                         │
│  [X] Nueva Sesión de Calibración              [●]──[○]──[○]──[○]       │
│      Paso 1 de 4                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Selecciona el ciclo que calibrarás                                    │
│  Solo puedes calibrar ciclos completados. Elige el que quieras revisar.│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✓  Evaluación 360° Q4 2025            [Completado]             │   │
│  │    📅 31/12/2025  •  👥 45 evaluaciones                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ○  Performance Review 2025            [Completado]             │   │
│  │    📅 15/12/2025  •  👥 32 evaluaciones                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  [← Anterior]                                          [Siguiente →]    │
│  (GhostButton)                                        (PrimaryButton)   │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🆕 MEJORAS v2.0 IMPLEMENTADAS

### 🎨 Diseño

| Mejora | Antes | Después |
|--------|-------|---------|
| **Header** | Básico | Glassmorphism + línea Tesla dinámica (verde en paso 4) |
| **Cards** | Custom classes | .fhr-card, .fhr-card-metric |
| **Inputs** | Generic | .fhr-input, .fhr-textarea, .fhr-select |
| **Badges** | Custom | .fhr-badge, .fhr-badge-success, .fhr-badge-active |
| **Empty states** | Custom | .fhr-empty-state |

### 📝 Copywriting

| Elemento | Antes | Después |
|----------|-------|---------|
| **Step 1 título** | "Selecciona el ciclo a calibrar" | "Selecciona el ciclo que calibrarás" |
| **Step 1 desc** | "Solo puedes calibrar ciclos de evaluación completados." | "Solo puedes calibrar ciclos completados. Elige el que quieras revisar." |
| **Step 2 título** | "Configurar alcance de la calibración" | "Configura tu sesión de calibración" |
| **Step 2 desc** | Generic | "Define nombre, descripción y alcance para organizar mejor los resultados." |
| **Step 3 título** | "Agregar participantes" | "Invita a los managers que calibrarán" |
| **Empty state** | "No hay datos" | "Aún no has agregado participantes" + acción siguiente |

### 🎬 Motion

| Elemento | Antes | Después |
|----------|-------|---------|
| **List stagger** | 0.05s | 0.05s (50ms) ✅ |
| **Step transition** | 0.2s generic | 0.2s + ease [0.16, 1, 0.3, 1] (ease-out) |
| **Línea Tesla** | N/A | duration: 400ms |
| **Error aparecer** | N/A | duration: 200ms |

### 🎯 Botones

| Elemento | Antes | Después |
|----------|-------|---------|
| **Siguiente** | Custom bg-cyan-600 | `<PrimaryButton icon={ArrowRight} iconPosition="right">` |
| **Anterior** | Custom text-slate | `<GhostButton icon={ArrowLeft}>` |
| **Crear Sesión** | Custom gradient | `<PrimaryButton glow={true} isLoading={...}>` |

## ➡️ SIGUIENTE TAREA (BLOQUE B)
`TASK_14_CALIBRATION_VIEW.md` - Vista de calibración grupal
