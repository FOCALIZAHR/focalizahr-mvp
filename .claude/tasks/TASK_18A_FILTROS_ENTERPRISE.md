# TASK 18A: FILTROS ENTERPRISE + SELECTOR MANUAL

**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 3-4 horas  
**Prerequisito:** Tasks 17A + 17B completadas  
**Objetivo:** Agregar filtro "Reportes de Manager" + Selector Manual funcional

---

## 🎯 OBJETIVOS

1. Agregar modo `directReports` al sistema multi-criterio
2. Implementar selector managers con preview
3. Implementar `EmployeePickerSelector` completo para `customPicks`
4. API auxiliar para obtener managers del ciclo

---

## 📋 IMPLEMENTACIÓN

### **1. CalibrationService - Agregar Query DirectReports**

**Archivo:** `src/lib/services/CalibrationService.ts`

**Buscar función `buildMultiCriteriaQuery` y AGREGAR case:**

```typescript
// Dentro de switch (session.filterMode)

// DESPUÉS del case 'jobFamily':

// ════════════════════════════════════════════════════════════════════════
// MODO: Por Reportes de Manager (directReports)
// Uso: "Calibrar todos los reportes directos de María (segunda línea)"
// ════════════════════════════════════════════════════════════════════════
case 'directReports': {
  console.log('[CalibrationService] Filtro directReports:', config.managerIds)
  return {
    ...baseWhere,
    managerId: { in: config.managerIds || [] }
  }
}
```

**Actualizar tipo:**
```typescript
// Al inicio del archivo, buscar:
type FilterMode = 'jobLevel' | 'jobFamily' | 'customPicks' | 'department'

// REEMPLAZAR con:
type FilterMode = 'jobLevel' | 'jobFamily' | 'directReports' | 'customPicks' | 'department'
```

---

### **2. API - GET Managers**

**Crear archivo:** `src/app/api/calibration/managers/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'

/**
 * GET /api/calibration/managers?cycleId=xxx
 * Obtiene lista de managers con reportes directos en el ciclo
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

    // Query managers con reportes directos evaluados en este ciclo
    const managers = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        isActive: true,
        directReports: {
          some: {
            isActive: true,
            performanceRatings: {
              some: { 
                cycleId,
                calculatedScore: { gt: 0 }
              }
            }
          }
        }
      },
      select: {
        id: true,
        fullName: true,
        standardJobTitle: true,
        jobLevel: true,
        department: {
          select: {
            displayName: true
          }
        },
        _count: {
          select: {
            directReports: {
              where: {
                isActive: true,
                performanceRatings: {
                  some: {
                    cycleId,
                    calculatedScore: { gt: 0 }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    })

    const managersWithCounts = managers.map(m => ({
      id: m.id,
      fullName: m.fullName,
      jobTitle: m.standardJobTitle,
      jobLevel: m.jobLevel,
      departmentName: m.department?.displayName || 'Sin departamento',
      directReportsCount: m._count.directReports
    }))

    return NextResponse.json({
      success: true,
      managers: managersWithCounts
    })

  } catch (error) {
    console.error('[API /calibration/managers] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error obteniendo managers' },
      { status: 500 }
    )
  }
}
```

---

### **3. Wizard Step 2 - Agregar Opción DirectReports**

**Archivo:** `src/components/calibration/wizard/WizardStep2.tsx`

**Buscar el bloque de radio buttons y AGREGAR después de `jobFamily`:**

```tsx
{/* OPCIÓN: directReports - NUEVO */}
<label className={cn(
  "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
  filterMode === 'directReports'
    ? "bg-green-500/10 border-green-500/50"
    : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
)}>
  <input
    type="radio"
    name="filterMode"
    checked={filterMode === 'directReports'}
    onChange={() => {
      setFilterMode('directReports')
      setFilterConfig({})
    }}
    className="mt-1"
  />
  <div className="flex-1">
    <div className="flex items-center gap-2 mb-1">
      <Users className="w-5 h-5 text-green-400" />
      <span className="font-medium text-white">Por Reportes de Manager</span>
      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">
        Recomendado Gerencial
      </span>
    </div>
    <p className="text-sm text-slate-400">
      Calibrar reportes directos de un líder (segunda línea organizacional)
    </p>
  </div>
</label>
```

**Agregar selector dinámico dentro del bloque de configuración:**

```tsx
{filterMode === 'directReports' && (
  <ManagerSelector
    cycleId={formData.cycleId}
    config={filterConfig}
    onChange={setFilterConfig}
  />
)}
```

**Crear component ManagerSelector al final del archivo:**

```tsx
function ManagerSelector({ cycleId, config, onChange }: any) {
  const [managers, setManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cycleId) return
    
    fetch(`/api/calibration/managers?cycleId=${cycleId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setManagers(data.managers || [])
        }
      })
      .catch(error => console.error('Error loading managers:', error))
      .finally(() => setLoading(false))
  }, [cycleId])

  const toggleManager = (managerId: string) => {
    const current = config.managerIds || []
    const updated = current.includes(managerId)
      ? current.filter((id: string) => id !== managerId)
      : [...current, managerId]
    onChange({ ...config, managerIds: updated })
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400">Cargando managers...</p>
      </div>
    )
  }

  if (managers.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p>No hay managers con reportes directos en este ciclo</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {managers.map(manager => (
        <label
          key={manager.id}
          className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.managerIds?.includes(manager.id) || false}
              onChange={() => toggleManager(manager.id)}
              className="w-4 h-4 rounded border-slate-600 text-green-500 focus:ring-green-500"
            />
            <div>
              <p className="text-white font-medium">{manager.fullName}</p>
              <p className="text-sm text-slate-400">
                {manager.jobTitle} • {manager.departmentName}
              </p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            {manager.directReportsCount} reportes
          </span>
        </label>
      ))}
    </div>
  )
}
```

---

### **4. EmployeePickerSelector - Implementar**

**Archivo:** `src/components/calibration/wizard/WizardStep2.tsx`

**REEMPLAZAR el bloque `{filterMode === 'customPicks' && ...}` con:**

```tsx
{filterMode === 'customPicks' && (
  <EmployeePickerSelector
    cycleId={formData.cycleId}
    config={filterConfig}
    onChange={setFilterConfig}
  />
)}
```

**Crear component al final del archivo:**

```tsx
function EmployeePickerSelector({ cycleId, config, onChange }: any) {
  const [search, setSearch] = useState('')
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    departmentId: '',
    jobLevel: ''
  })

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        loadEmployees()
      } else {
        setEmployees([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, filters])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        cycleId,
        search,
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.jobLevel && { jobLevel: filters.jobLevel })
      })
      
      const res = await fetch(`/api/calibration/employees?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEmployee = (employeeId: string) => {
    const current = config.employeeIds || []
    const updated = current.includes(employeeId)
      ? current.filter((id: string) => id !== employeeId)
      : [...current, employeeId]
    onChange({ ...config, employeeIds: updated })
  }

  const removeEmployee = (employeeId: string) => {
    const updated = (config.employeeIds || []).filter((id: string) => id !== employeeId)
    onChange({ ...config, employeeIds: updated })
  }

  const selectedEmployees = employees.filter(e => 
    config.employeeIds?.includes(e.id)
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 gap-3">
        <select
          value={filters.departmentId}
          onChange={(e) => setFilters({...filters, departmentId: e.target.value})}
          className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm"
        >
          <option value="">Todos los departamentos</option>
          {/* TODO: Load departments */}
        </select>
        
        <select
          value={filters.jobLevel}
          onChange={(e) => setFilters({...filters, jobLevel: e.target.value})}
          className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm"
        >
          <option value="">Todos los niveles</option>
          <option value="1">Nivel 1</option>
          <option value="2">Nivel 2</option>
          <option value="3">Nivel 3</option>
          <option value="4">Nivel 4</option>
          <option value="5">Nivel 5</option>
        </select>
      </div>

      {/* Selected Chips */}
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          {selectedEmployees.map(emp => (
            <div
              key={emp.id}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm"
            >
              <span>{emp.fullName}</span>
              <button
                onClick={() => removeEmployee(emp.id)}
                className="hover:text-amber-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : employees.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {employees.map(emp => (
            <label
              key={emp.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={config.employeeIds?.includes(emp.id) || false}
                onChange={() => toggleEmployee(emp.id)}
                className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <p className="text-white font-medium">{emp.fullName}</p>
                <p className="text-sm text-slate-400">
                  {emp.standardJobTitle} • {emp.departmentName}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                Nivel {emp.jobLevel}
              </span>
            </label>
          ))}
        </div>
      ) : search.length >= 2 ? (
        <div className="text-center py-8 text-slate-400">
          <Star className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p>No se encontraron empleados</p>
        </div>
      ) : null}
    </div>
  )
}
```

---

### **5. API - GET Employees (para search)**

**Crear archivo:** `src/app/api/calibration/employees/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'

/**
 * GET /api/calibration/employees?cycleId=xxx&search=xxx&departmentId=xxx&jobLevel=xxx
 * Búsqueda de empleados para selector manual
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('departmentId')
    const jobLevel = searchParams.get('jobLevel')

    if (!cycleId) {
      return NextResponse.json({ success: false, error: 'cycleId requerido' }, { status: 400 })
    }

    const whereClause: any = {
      accountId: userContext.accountId,
      isActive: true,
      performanceRatings: {
        some: {
          cycleId,
          calculatedScore: { gt: 0 }
        }
      }
    }

    // Search por nombre
    if (search.length >= 2) {
      whereClause.fullName = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Filtros opcionales
    if (departmentId) {
      whereClause.departmentId = departmentId
    }
    
    if (jobLevel) {
      whereClause.jobLevel = parseInt(jobLevel)
    }

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
      take: 50,
      orderBy: {
        fullName: 'asc'
      }
    })

    const formatted = employees.map(emp => ({
      ...emp,
      departmentName: emp.department?.displayName || 'Sin departamento'
    }))

    return NextResponse.json({
      success: true,
      employees: formatted
    })

  } catch (error) {
    console.error('[API /calibration/employees] Error:', error)
    return NextResponse.json({ success: false, error: 'Error buscando empleados' }, { status: 500 })
  }
}
```

---

## ✅ VALIDACIÓN

```yaml
CalibrationService:
  - [ ] buildMultiCriteriaQuery soporta case 'directReports'
  - [ ] Query retorna empleados con managerId correcto

APIs:
  - [ ] GET /managers retorna lista con counts correctos
  - [ ] GET /employees permite search y filtros
  - [ ] Multi-tenant isolation (accountId) funciona

Wizard Step 2:
  - [ ] Radio button "Por Reportes de Manager" visible
  - [ ] ManagerSelector carga y muestra managers
  - [ ] EmployeePickerSelector permite buscar
  - [ ] Preview actualiza con ambos selectores
  - [ ] Chips visuales en customPicks funcionan

TypeScript:
  - [ ] tsc --noEmit clean
  - [ ] npm run build exitoso
```

---

**FIN TASK 18A**

Ejecutar ANTES de TASK 18B.
