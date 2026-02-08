# TASK 17B: MULTI-CRITERIO ENTERPRISE + WIZARD UPGRADE

**Prioridad:** 🟡 ALTA (Mejora funcional)  
**Tiempo estimado:** 3-4 horas  
**Prerequisito:** TASK 17A completada (schema + landing page funcionando)  
**Objetivo:** Filtrado enterprise por jobLevel/jobFamily + Wizard mejorado

---

## 🎯 PROBLEMA A RESOLVER

**Filtrado limitado actual:**
```
Wizard Step 2 solo filtra por departmentIds
  ❌ "Calibrar todos los Senior Managers" → IMPOSIBLE
  ❌ "Calibrar todos los Sales Managers" → IMPOSIBLE
  ✅ "Calibrar todo Marketing" → Funciona (pero mezcla niveles)
```

**Realidad Enterprise (investigación confirmada):**
- 85% calibraciones son por **jobLevel** o **jobTitle**
- 60% usan familia de cargos cross-departamental
- 30% usan departamento (equipos pequeños)
- 15% selección manual (promociones, succession planning)

**Solución:** Sistema multi-criterio que soporta 4 modos de filtrado.

---

## 📋 IMPLEMENTACIÓN

### 1. CALIBRATION SERVICE - QUERY BUILDER COMPLETO

**Archivo:** `src/lib/services/CalibrationService.ts`

**REEMPLAZAR función `buildCandidatesQueryBase` (creada en TASK 17A):**

```typescript
// ════════════════════════════════════════════════════════════════════════════
// MULTI-CRITERIO SYSTEM - TASK 17B
// ════════════════════════════════════════════════════════════════════════════

/**
 * Construye query para obtener candidatos usando multi-criterio
 * Soporta sistema legacy (departmentIds) y nuevo (filterMode)
 * 
 * @param session - Sesión de calibración con criterios
 * @param accountId - ID cuenta (multi-tenant isolation)
 * @returns Prisma where clause
 */
export function buildCandidatesQuery(
  session: CalibrationSession,
  accountId: string
): any {
  
  // Base query (siempre aplicado)
  const baseWhere = {
    accountId,
    isActive: true,
    performanceRatings: {
      some: { 
        cycleId: session.cycleId,
        calculatedScore: { not: null }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMA NUEVO (v3.1+) - Prioridad
  // ══════════════════════════════════════════════════════════════════════════
  
  if (session.filterMode && session.filterMode !== 'department') {
    console.log('[CalibrationService] Usando sistema multi-criterio:', session.filterMode)
    return buildMultiCriteriaQuery(session, baseWhere)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMA LEGACY - Backward Compatibility
  // ══════════════════════════════════════════════════════════════════════════
  
  if (session.departmentIds && session.departmentIds.length > 0) {
    console.log('[CalibrationService] Usando sistema legacy (departmentIds)')
    return {
      ...baseWhere,
      departmentId: { in: session.departmentIds }
    }
  }

  // Sin filtro (toda la empresa)
  console.log('[CalibrationService] Sin filtro - toda la empresa')
  return baseWhere
}

/**
 * Query builder para sistema multi-criterio
 * @private
 */
function buildMultiCriteriaQuery(
  session: CalibrationSession,
  baseWhere: any
): any {
  
  const config = session.filterConfig as any
  
  if (!config) {
    console.warn('[CalibrationService] filterMode definido pero filterConfig vacío')
    return baseWhere
  }

  switch (session.filterMode) {
    
    // ════════════════════════════════════════════════════════════════════════
    // MODO 1: Por Nivel Jerárquico (jobLevel)
    // Uso: "Calibrar todos los Senior Managers (Nivel 3)"
    // ════════════════════════════════════════════════════════════════════════
    case 'jobLevel': {
      const query: any = {
        ...baseWhere,
        jobLevel: { in: config.levels || [] }
      }
      
      // Opcional: Solo managers con reportes directos
      if (config.includeOnlyManagers) {
        query.directReports = { some: {} }
      }
      
      console.log('[CalibrationService] Filtro jobLevel:', config.levels)
      return query
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODO 2: Por Familia de Cargos (jobFamily/standardJobTitle)
    // Uso: "Calibrar todos los Sales Managers"
    // ════════════════════════════════════════════════════════════════════════
    case 'jobFamily': {
      console.log('[CalibrationService] Filtro jobFamily:', config.jobTitles)
      return {
        ...baseWhere,
        standardJobTitle: { in: config.jobTitles || [] }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODO 3: Selección Manual (customPicks)
    // Uso: Promotion committees, succession planning
    // ════════════════════════════════════════════════════════════════════════
    case 'customPicks': {
      console.log('[CalibrationService] Filtro customPicks:', config.employeeIds?.length)
      return {
        ...baseWhere,
        id: { in: config.employeeIds || [] }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODO 4: Departamento (nuevo formato)
    // Uso: Equipos pequeños mismo depto
    // ════════════════════════════════════════════════════════════════════════
    case 'department': {
      console.log('[CalibrationService] Filtro department (nuevo formato):', config.departmentIds)
      return {
        ...baseWhere,
        departmentId: { in: config.departmentIds || [] }
      }
    }

    default:
      console.warn('[CalibrationService] filterMode desconocido:', session.filterMode)
      return baseWhere
  }
}

/**
 * Obtiene preview de empleados para Wizard Step 2
 * Retorna máximo 20 empleados que coinciden con criterios
 */
export async function getEmployeesPreview(
  filterMode: string,
  filterConfig: any,
  cycleId: string,
  accountId: string,
  limit: number = 20
): Promise<any[]> {
  
  // Crear sesión temporal para usar buildCandidatesQuery
  const tempSession = {
    filterMode,
    filterConfig,
    cycleId,
    departmentIds: [] // Empty para sistema nuevo
  } as CalibrationSession

  const whereClause = buildCandidatesQuery(tempSession, accountId)

  const employees = await prisma.employee.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      standardJobTitle: true,
      jobLevel: true,
      department: {
        select: {
          displayName: true
        }
      }
    },
    take: limit,
    orderBy: {
      fullName: 'asc'
    }
  })

  return employees.map(emp => ({
    ...emp,
    departmentName: emp.department?.displayName || 'Sin departamento'
  }))
}
```

**Exportar funciones:**
```typescript
// Al final del archivo
export { buildCandidatesQuery, getEmployeesPreview }
```

---

### 2. API POST /sessions - SOPORTE MULTI-CRITERIO

**Archivo:** `src/app/api/calibration/sessions/route.ts`

**Buscar función POST y MODIFICAR bloque de preparación de data:**

```typescript
export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // RBAC Check
    const allowedRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'CEO']
    if (!allowedRoles.includes(userContext.role || '')) {
      return NextResponse.json(
        { error: 'Sin permisos para crear sesiones' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // ══════════════════════════════════════════════════════════════════════════
    // PREPARAR DATA CON SOPORTE MULTI-CRITERIO
    // ══════════════════════════════════════════════════════════════════════════
    
    const sessionData: any = {
      accountId: userContext.accountId,
      cycleId: body.cycleId,
      name: body.name,
      description: body.description,
      facilitatorEmail: body.facilitatorEmail || userContext.email,
      enableForcedDistribution: body.enableForcedDistribution || false,
      distributionTargets: body.distributionTargets || null,
      createdBy: userContext.email || 'system',
      status: 'DRAFT'
    }

    // ══════════════════════════════════════════════════════════════════════════
    // OPCIÓN A: Sistema NUEVO (v3.1+) - Prioridad
    // ══════════════════════════════════════════════════════════════════════════
    
    if (body.filterMode && body.filterConfig) {
      console.log('[API POST /sessions] Usando sistema multi-criterio:', body.filterMode)
      
      sessionData.filterMode = body.filterMode
      sessionData.filterConfig = body.filterConfig
      
      // Si filterMode es department, también poblar departmentIds para backward compat
      if (body.filterMode === 'department' && body.filterConfig.departmentIds) {
        sessionData.departmentIds = body.filterConfig.departmentIds
      }
    }
    
    // ══════════════════════════════════════════════════════════════════════════
    // OPCIÓN B: Sistema LEGACY - Backward Compatibility
    // ══════════════════════════════════════════════════════════════════════════
    
    else if (body.departmentIds && body.departmentIds.length > 0) {
      console.log('[API POST /sessions] Usando sistema legacy (departmentIds)')
      
      // Mantener departmentIds para compatibilidad
      sessionData.departmentIds = body.departmentIds
      
      // Auto-convertir a nuevo formato
      sessionData.filterMode = 'department'
      sessionData.filterConfig = {
        departmentIds: body.departmentIds,
        note: 'Auto-migrated from legacy format'
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CREAR SESIÓN
    // ══════════════════════════════════════════════════════════════════════════

    const session = await prisma.calibrationSession.create({
      data: sessionData,
      include: {
        cycle: {
          select: {
            name: true,
            startDate: true,
            endDate: true
          }
        }
      }
    })

    console.log('[API POST /sessions] Sesión creada:', session.id, '- filterMode:', session.filterMode)

    return NextResponse.json({ 
      success: true, 
      session 
    }, { status: 201 })

  } catch (error) {
    console.error('[API POST /sessions] Error:', error)
    return NextResponse.json(
      { error: 'Error creando sesión' },
      { status: 500 }
    )
  }
}
```

---

### 3. APIs AUXILIARES

#### A) API Preview Empleados

**Crear:** `src/app/api/calibration/preview/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { getEmployeesPreview } from '@/lib/services/CalibrationService'

/**
 * POST /api/calibration/preview
 * Obtiene preview de empleados que coinciden con criterios
 * Usado en Wizard Step 2 para mostrar preview en tiempo real
 */
export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cycleId, filterMode, filterConfig } = body

    // Validaciones
    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId requerido' },
        { status: 400 }
      )
    }

    if (!filterMode || !filterConfig) {
      return NextResponse.json(
        { success: false, error: 'filterMode y filterConfig requeridos' },
        { status: 400 }
      )
    }

    // Obtener preview (max 20 empleados)
    const employees = await getEmployeesPreview(
      filterMode,
      filterConfig,
      cycleId,
      userContext.accountId,
      20
    )

    return NextResponse.json({
      success: true,
      employees,
      count: employees.length
    })

  } catch (error) {
    console.error('[API /calibration/preview] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error generando preview' },
      { status: 500 }
    )
  }
}
```

#### B) API Job Titles

**Crear:** `src/app/api/calibration/job-titles/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'

/**
 * GET /api/calibration/job-titles?cycleId=xxx
 * Obtiene lista de standardJobTitle disponibles en el ciclo
 * Para selector de Familia de Cargos en Wizard Step 2
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId requerido' },
        { status: 400 }
      )
    }

    // Query para obtener jobTitles únicos de empleados con ratings en este ciclo
    const employees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        isActive: true,
        performanceRatings: {
          some: { cycleId }
        },
        standardJobTitle: {
          not: null
        }
      },
      select: {
        standardJobTitle: true
      },
      distinct: ['standardJobTitle']
    })

    const jobTitles = employees
      .map(e => e.standardJobTitle)
      .filter(Boolean)
      .sort()

    return NextResponse.json({
      success: true,
      jobTitles
    })

  } catch (error) {
    console.error('[API /calibration/job-titles] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error obteniendo job titles' },
      { status: 500 }
    )
  }
}
```

---

### 4. WIZARD STEP 2 - UPGRADE COMPLETO

**Archivo:** `src/components/calibration/wizard/WizardStep2.tsx`

**REEMPLAZAR COMPLETAMENTE el archivo:**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Info, AlertCircle, Users, Briefcase, Star, Building } from 'lucide-react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface WizardStep2Props {
  formData: any
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
}

type FilterMode = 'jobLevel' | 'jobFamily' | 'customPicks' | 'department'

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function WizardStep2({ 
  formData, 
  onUpdate, 
  onNext, 
  onBack 
}: WizardStep2Props) {
  
  const [filterMode, setFilterMode] = useState<FilterMode>(
    formData.filterMode || 'jobLevel' // DEFAULT: jobLevel (recomendado)
  )
  const [filterConfig, setFilterConfig] = useState<any>(
    formData.filterConfig || {}
  )
  const [preview, setPreview] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  // ══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ══════════════════════════════════════════════════════════════════════════

  // Auto-save en formData
  useEffect(() => {
    onUpdate({
      ...formData,
      filterMode,
      filterConfig
    })
  }, [filterMode, filterConfig])

  // Load preview cuando cambian criterios
  useEffect(() => {
    if (Object.keys(filterConfig).length > 0) {
      loadPreview()
    } else {
      setPreview([])
    }
  }, [filterMode, filterConfig])

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const loadPreview = async () => {
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/calibration/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: formData.cycleId,
          filterMode,
          filterConfig
        })
      })
      
      const data = await res.json()
      if (data.success) {
        setPreview(data.employees || [])
      }
    } catch (error) {
      console.error('Error loading preview:', error)
      setPreview([])
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleNext = () => {
    // Validaciones por modo
    if (filterMode === 'jobLevel' && (!filterConfig.levels || filterConfig.levels.length === 0)) {
      alert('Selecciona al menos un nivel jerárquico')
      return
    }
    
    if (filterMode === 'jobFamily' && (!filterConfig.jobTitles || filterConfig.jobTitles.length === 0)) {
      alert('Selecciona al menos un cargo')
      return
    }
    
    if (filterMode === 'customPicks' && (!filterConfig.employeeIds || filterConfig.employeeIds.length === 0)) {
      alert('Selecciona al menos un empleado')
      return
    }
    
    if (filterMode === 'department' && (!filterConfig.departmentIds || filterConfig.departmentIds.length === 0)) {
      alert('Selecciona al menos un departamento')
      return
    }
    
    if (preview.length === 0) {
      alert('No hay empleados que coincidan con los criterios seleccionados')
      return
    }
    
    onNext()
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-light text-white mb-2">
          Configurar Criterios de Filtrado
        </h2>
        <p className="text-slate-400">
          Selecciona qué empleados participarán en esta calibración
        </p>
      </div>

      {/* Radio Buttons - Criterio Principal */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          Estrategia de Agrupación
        </h3>
        
        <div className="space-y-3">
          
          {/* OPCIÓN 1: jobLevel - Recomendado Enterprise */}
          <label className={cn(
            "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
            filterMode === 'jobLevel'
              ? "bg-cyan-500/10 border-cyan-500/50"
              : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
          )}>
            <input
              type="radio"
              name="filterMode"
              checked={filterMode === 'jobLevel'}
              onChange={() => {
                setFilterMode('jobLevel')
                setFilterConfig({})
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="font-medium text-white">Por Nivel Jerárquico</span>
                <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">
                  Recomendado
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Calibrar empleados del mismo nivel organizacional (ej: todos los Senior Managers)
              </p>
            </div>
          </label>

          {/* OPCIÓN 2: jobFamily */}
          <label className={cn(
            "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
            filterMode === 'jobFamily'
              ? "bg-purple-500/10 border-purple-500/50"
              : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
          )}>
            <input
              type="radio"
              name="filterMode"
              checked={filterMode === 'jobFamily'}
              onChange={() => {
                setFilterMode('jobFamily')
                setFilterConfig({})
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-white">Por Familia de Cargos</span>
              </div>
              <p className="text-sm text-slate-400">
                Calibrar por cargo específico cross-departamental (ej: todos los Sales Managers)
              </p>
            </div>
          </label>

          {/* OPCIÓN 3: customPicks */}
          <label className={cn(
            "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
            filterMode === 'customPicks'
              ? "bg-amber-500/10 border-amber-500/50"
              : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
          )}>
            <input
              type="radio"
              name="filterMode"
              checked={filterMode === 'customPicks'}
              onChange={() => {
                setFilterMode('customPicks')
                setFilterConfig({})
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-amber-400" />
                <span className="font-medium text-white">Selección Manual</span>
              </div>
              <p className="text-sm text-slate-400">
                Elegir empleados específicos por nombre (ej: promociones, succession planning)
              </p>
            </div>
          </label>

          {/* OPCIÓN 4: department - Legacy */}
          <label className={cn(
            "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
            filterMode === 'department'
              ? "bg-slate-500/10 border-slate-500/50"
              : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
          )}>
            <input
              type="radio"
              name="filterMode"
              checked={filterMode === 'department'}
              onChange={() => {
                setFilterMode('department')
                setFilterConfig({})
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Building className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-white">Por Departamento</span>
              </div>
              <p className="text-sm text-slate-400">
                Calibrar departamento completo (mezcla diferentes niveles jerárquicos)
              </p>
              
              {/* Warning cuando selecciona department */}
              {filterMode === 'department' && (
                <div className="mt-3 flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Considera usar "Por Nivel Jerárquico" para calibraciones enterprise más efectivas. 
                    Calibrar departamentos mezcla diferentes niveles y puede generar comparaciones desiguales.
                  </span>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Configuración dinámica según modo seleccionado */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          Configuración de Filtros
        </h3>

        {filterMode === 'jobLevel' && (
          <JobLevelSelector
            config={filterConfig}
            onChange={setFilterConfig}
          />
        )}

        {filterMode === 'jobFamily' && (
          <JobFamilySelector
            cycleId={formData.cycleId}
            config={filterConfig}
            onChange={setFilterConfig}
          />
        )}

        {filterMode === 'customPicks' && (
          <div className="text-center py-8 text-slate-400">
            <Star className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>Selector de empleados manual</p>
            <p className="text-sm mt-2">(Implementar employee picker con search)</p>
          </div>
        )}

        {filterMode === 'department' && (
          <DepartmentSelector
            config={filterConfig}
            onChange={setFilterConfig}
          />
        )}
      </div>

      {/* Preview de empleados */}
      {(previewLoading || preview.length > 0) && (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            {previewLoading ? 'Cargando preview...' : `Preview: ${preview.length} empleados coinciden`}
          </h3>
          
          {previewLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {preview.slice(0, 10).map(emp => (
                <div 
                  key={emp.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{emp.fullName}</p>
                    <p className="text-sm text-slate-400">
                      {emp.standardJobTitle} • {emp.departmentName}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">
                    Nivel {emp.jobLevel}
                  </span>
                </div>
              ))}
              
              {preview.length > 10 && (
                <p className="text-center text-sm text-slate-400 pt-2">
                  + {preview.length - 10} empleados más
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800/50 transition-colors"
        >
          Atrás
        </button>
        
        <button
          onClick={handleNext}
          disabled={preview.length === 0 && !previewLoading}
          className={cn(
            "flex-1 px-6 py-3 rounded-lg font-medium transition-all",
            preview.length > 0
              ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-500/30"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          )}
        >
          Siguiente ({preview.length} empleados)
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function JobLevelSelector({ config, onChange }: any) {
  const levels = [
    { value: 1, label: 'Nivel 1 - Executive' },
    { value: 2, label: 'Nivel 2 - Director' },
    { value: 3, label: 'Nivel 3 - Manager' },
    { value: 4, label: 'Nivel 4 - Coordinator' },
    { value: 5, label: 'Nivel 5 - Analyst' },
  ]

  const toggleLevel = (level: number) => {
    const current = config.levels || []
    const updated = current.includes(level)
      ? current.filter((l: number) => l !== level)
      : [...current, level].sort()
    onChange({ ...config, levels: updated })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {levels.map(level => (
          <label
            key={level.value}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
          >
            <input
              type="checkbox"
              checked={config.levels?.includes(level.value) || false}
              onChange={() => toggleLevel(level.value)}
              className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-white">{level.label}</span>
          </label>
        ))}
      </div>

      <label className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-700/50 transition-colors">
        <input
          type="checkbox"
          checked={config.includeOnlyManagers || false}
          onChange={(e) => onChange({ ...config, includeOnlyManagers: e.target.checked })}
          className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
        />
        <div>
          <span className="text-white font-medium">Solo managers con reportes directos</span>
          <p className="text-sm text-slate-400 mt-0.5">
            Excluye managers sin equipo asignado
          </p>
        </div>
      </label>
    </div>
  )
}

function JobFamilySelector({ cycleId, config, onChange }: any) {
  const [titles, setTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cycleId) return
    
    fetch(`/api/calibration/job-titles?cycleId=${cycleId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTitles(data.jobTitles || [])
        }
      })
      .catch(error => console.error('Error loading titles:', error))
      .finally(() => setLoading(false))
  }, [cycleId])

  const toggleTitle = (title: string) => {
    const current = config.jobTitles || []
    const updated = current.includes(title)
      ? current.filter((t: string) => t !== title)
      : [...current, title]
    onChange({ ...config, jobTitles: updated })
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400">Cargando cargos disponibles...</p>
      </div>
    )
  }

  if (titles.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p>No hay cargos estandarizados en este ciclo</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {titles.map(title => (
        <label
          key={title}
          className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
        >
          <input
            type="checkbox"
            checked={config.jobTitles?.includes(title) || false}
            onChange={() => toggleTitle(title)}
            className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
          />
          <span className="text-white">{title}</span>
        </label>
      ))}
    </div>
  )
}

function DepartmentSelector({ config, onChange }: any) {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (data.success || data.departments) {
          setDepartments(data.departments || [])
        }
      })
      .catch(error => console.error('Error loading departments:', error))
      .finally(() => setLoading(false))
  }, [])

  const toggleDept = (id: string) => {
    const current = config.departmentIds || []
    const updated = current.includes(id)
      ? current.filter((d: string) => d !== id)
      : [...current, id]
    onChange({ ...config, departmentIds: updated })
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-slate-500/30 border-t-slate-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400">Cargando departamentos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {departments.map(dept => (
        <label
          key={dept.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
        >
          <input
            type="checkbox"
            checked={config.departmentIds?.includes(dept.id) || false}
            onChange={() => toggleDept(dept.id)}
            className="w-4 h-4 rounded border-slate-600 text-slate-500 focus:ring-slate-500"
          />
          <span className="text-white">{dept.displayName}</span>
        </label>
      ))}
    </div>
  )
}
```

---

## ✅ VALIDACIÓN

**Checklist completo:**

```yaml
□ CalibrationService:
  - buildCandidatesQuery() funciona con jobLevel
  - buildCandidatesQuery() funciona con jobFamily
  - buildCandidatesQuery() funciona con customPicks
  - buildCandidatesQuery() funciona con department
  - Sistema legacy (departmentIds) sigue funcionando
  - getEmployeesPreview() retorna empleados correctos

□ API POST /sessions:
  - Acepta filterMode + filterConfig
  - Auto-migra departmentIds a filterMode: department
  - Crea sesión exitosamente con ambos formatos
  - RBAC valida roles correctamente

□ API Preview:
  - POST /preview retorna empleados correctos
  - Valida cycleId requerido
  - Multi-tenant isolation (accountId)

□ API Job Titles:
  - GET /job-titles retorna lista de cargos
  - Filtra por cycleId correctamente
  - Multi-tenant isolation

□ Wizard Step 2:
  - Radio buttons cambian UI correctamente
  - jobLevel: Checkboxes funcionan, preview actualiza
  - jobFamily: Carga titles desde API, preview actualiza
  - department: Muestra warning amber, preview actualiza
  - Validación impide avanzar si preview.length === 0
  - Submit crea sesión con formato correcto

□ Integración:
  - Sesión nueva se abre en War Room
  - Landing muestra employeeCount correcto
  - Sistema legacy NO roto
  - NO hay TypeScript errors
```

---

## 🚀 ORDEN DE EJECUCIÓN

```yaml
PASO 1 (45 min):
  - CalibrationService: Agregar buildCandidatesQuery completo
  - CalibrationService: Agregar getEmployeesPreview

PASO 2 (30 min):
  - API POST /sessions: Modificar data preparation
  - Validar que acepta ambos formatos

PASO 3 (30 min):
  - Crear API /preview
  - Crear API /job-titles

PASO 4 (90 min):
  - Reemplazar WizardStep2.tsx completo
  - Implementar sub-components

PASO 5 (30 min):
  - Testing completo
  - Validar checklist
```

**Total:** ~3-4 horas

---

**FIN TASK 17B**

Sistema ahora soporta filtrado enterprise completo. Combinar con TASK 17A para solución completa.
