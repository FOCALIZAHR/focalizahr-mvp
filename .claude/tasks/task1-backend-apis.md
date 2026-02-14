# TASK 1 - BACKEND APIs: Employee Stats & Analytics
## Objetivo: Crear endpoints para panel dotación y modal analytics

---

## 🔐 **PERMISOS RBAC (YA EXISTEN)**

**IMPORTANTE:** Los permisos ya están definidos en `AuthorizationService.ts`.

**Usaremos el permiso existente:** `employees:read`

Este permiso ya incluye los roles correctos:
- FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, 
- HR_OPERATOR, AREA_MANAGER, CEO

**NO necesitas agregar permisos nuevos.** Solo usa `hasPermission()` en los endpoints.

---

## 🎯 OBJETIVOS

Crear 2 endpoints API que proveen:
1. **GET `/api/admin/employees/stats`** → Stats básicas para panel principal
2. **GET `/api/admin/employees/analytics`** → Analytics profundo para modal

---

## 📊 DATOS DE ENTRADA

### **Fuentes de datos:**
```typescript
// Employee (dotación actual)
prisma.employee.findMany({
  where: { 
    accountId,
    status: { in: ['ACTIVE', 'ON_LEAVE'] }
  },
  include: {
    manager: true,
    directReports: true
  }
})

// EmployeeImport (histórico para delta)
prisma.employeeImport.findMany({
  where: { accountId },
  orderBy: { startedAt: 'desc' },
  take: 3
})
```

---

## 📁 ARCHIVO 1: `/api/admin/employees/stats/route.ts`

### **Response Schema:**

```typescript
interface StatsResponse {
  success: boolean
  stats: {
    // THE ROCK
    totalActive: number
    delta: number | null  // vs mes anterior
    
    // CARDS TRACK
    byTrack: {
      ejecutivo: {
        count: number
        percentage: number
      }
      manager: {
        count: number
        percentage: number
      }
      colaborador: {
        count: number
        percentage: number
      }
    }
    
    // MINI INSIGHTS
    insights: {
      avgTenure: number  // años
      dominantLevel: string  // "Profesional/Analista"
    }
  }
}
```

### **Implementación:**

```typescript
// src/app/api/admin/employees/stats/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { JOB_LEVEL_LABELS } from '@/lib/services/PositionAdapter'

export async function GET(request: NextRequest) {
  try {
    // ═══════════════════════════════════════════════════════════════
    // SEGURIDAD: Verificar autenticación y permisos
    // ═══════════════════════════════════════════════════════════════
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId requerido' },
        { status: 400 }
      )
    }
    
    // Solo roles cliente pueden ver stats de su empresa
    if (!hasPermission(userContext.role, 'employees:read')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para ver estadísticas' },
        { status: 403 }
      )
    }

    // ═══════════════════════════════════════════════════════════════
    // 1. OBTENER EMPLEADOS ACTIVOS
    // ═══════════════════════════════════════════════════════════════
    const activeEmployees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        status: { in: ['ACTIVE', 'ON_LEAVE'] }
      },
      select: {
        id: true,
        performanceTrack: true,
        standardJobLevel: true,
        hireDate: true,
        _count: {
          select: {
            directReports: true
          }
        }
      }
    })

    const totalActive = activeEmployees.length

    // ═══════════════════════════════════════════════════════════════
    // 2. CALCULAR DELTA (vs mes anterior)
    // ═══════════════════════════════════════════════════════════════
    const imports = await prisma.employeeImport.findMany({
      where: { 
        accountId: userContext.accountId,
        status: 'COMPLETED'
      },
      orderBy: { startedAt: 'desc' },
      take: 2,
      select: {
        totalInFile: true,
        startedAt: true
      }
    })

    let delta: number | null = null
    if (imports.length >= 2) {
      delta = imports[0].totalInFile - imports[1].totalInFile
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. BREAKDOWN POR PERFORMANCE TRACK
    // ═══════════════════════════════════════════════════════════════
    const trackStats = {
      ejecutivo: { count: 0 },
      manager: { count: 0 },
      colaborador: { count: 0 }
    }

    for (const emp of activeEmployees) {
      const track = (emp.performanceTrack || 'COLABORADOR').toLowerCase() as 'ejecutivo' | 'manager' | 'colaborador'
      
      if (trackStats[track]) {
        trackStats[track].count++
      }
    }

    const byTrack = {
      ejecutivo: {
        count: trackStats.ejecutivo.count,
        percentage: Math.round((trackStats.ejecutivo.count / totalActive) * 100) || 0
      },
      manager: {
        count: trackStats.manager.count,
        percentage: Math.round((trackStats.manager.count / totalActive) * 100) || 0
      },
      colaborador: {
        count: trackStats.colaborador.count,
        percentage: Math.round((trackStats.colaborador.count / totalActive) * 100) || 0
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. CALCULAR INSIGHTS
    // ═══════════════════════════════════════════════════════════════
    
    // Antigüedad promedio
    const now = new Date()
    const tenures = activeEmployees
      .filter(e => e.hireDate)
      .map(e => {
        const years = (now.getTime() - new Date(e.hireDate!).getTime()) / (1000 * 60 * 60 * 24 * 365)
        return years
      })
    
    const avgTenure = tenures.length > 0
      ? Math.round((tenures.reduce((sum, t) => sum + t, 0) / tenures.length) * 10) / 10
      : 0

    // Nivel jerárquico dominante
    const levelCounts: Record<string, number> = {}
    for (const emp of activeEmployees) {
      if (emp.standardJobLevel) {
        levelCounts[emp.standardJobLevel] = (levelCounts[emp.standardJobLevel] || 0) + 1
      }
    }
    
    const dominantLevelCode = Object.entries(levelCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'profesional_analista'
    
    const dominantLevel = JOB_LEVEL_LABELS[dominantLevelCode] || 'Sin Clasificar'

    // ═══════════════════════════════════════════════════════════════
    // 5. RESPONSE
    // ═══════════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      stats: {
        totalActive,
        delta,
        byTrack,
        insights: {
          avgTenure,
          dominantLevel
        }
      }
    })

  } catch (error) {
    console.error('[API] Error en /api/admin/employees/stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}
```

---

## 📁 ARCHIVO 2: `/api/admin/employees/analytics/route.ts`

### **Response Schema:**

```typescript
interface AnalyticsResponse {
  success: boolean
  analytics: {
    // BREAKDOWN 7 NIVELES
    byLevel: Array<{
      level: string
      label: string
      count: number
      percentage: number
      withTeam: number
      withoutTeam: number
      avgTenure: number
      avgDirectReports: number
    }>
    
    // ESTRUCTURA LIDERAZGO
    leadership: {
      totalManagers: number
      totalContributors: number
      avgDirectReports: number
      maxDirectReports: { name: string; count: number }
      leadershipRatio: string  // "1:1.5"
      industryBenchmark: string  // "1:5-8"
      healthStatus: 'OK' | 'WARNING' | 'CRITICAL'
    }
    
    // TENDENCIAS (últimos 3 meses)
    trends: {
      months: Array<{
        period: string  // "2026-01"
        count: number
        delta: number
      }>
      lastMonth: {
        hires: number
        terminations: number
        transfers: number
        promotions: number
      }
    }
    
    // INSIGHTS AUTOMÁTICOS
    insights: Array<{
      type: 'success' | 'warning' | 'info'
      text: string
    }>
  }
}
```

### **Implementación:**

```typescript
// src/app/api/admin/employees/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { 
  PositionAdapter, 
  JOB_LEVEL_LABELS, 
  type PerformanceTrack 
} from '@/lib/services/PositionAdapter'

const JOB_LEVEL_ORDER = [
  'gerente_director',
  'subgerente_subdirector',
  'jefe',
  'supervisor_coordinador',
  'profesional_analista',
  'asistente_otros',
  'operativo_auxiliar'
]

export async function GET(request: NextRequest) {
  try {
    // ═══════════════════════════════════════════════════════════════
    // SEGURIDAD
    // ═══════════════════════════════════════════════════════════════
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId requerido' },
        { status: 400 }
      )
    }
    
    if (!hasPermission(userContext.role, 'employees:read')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para analytics' },
        { status: 403 }
      )
    }

    // ═══════════════════════════════════════════════════════════════
    // 1. OBTENER EMPLEADOS ACTIVOS CON MANAGER DATA
    // ═══════════════════════════════════════════════════════════════
    const activeEmployees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        status: { in: ['ACTIVE', 'ON_LEAVE'] }
      },
      include: {
        directReports: {
          where: {
            status: { in: ['ACTIVE', 'ON_LEAVE'] }
          }
        }
      }
    })

    const totalActive = activeEmployees.length
    const now = new Date()

    // ═══════════════════════════════════════════════════════════════
    // 2. BREAKDOWN POR 7 NIVELES JERÁRQUICOS
    // ═══════════════════════════════════════════════════════════════
    const levelStats: Record<string, {
      count: number
      withTeam: number
      tenures: number[]
      directReportCounts: number[]
    }> = {}

    for (const level of JOB_LEVEL_ORDER) {
      levelStats[level] = {
        count: 0,
        withTeam: 0,
        tenures: [],
        directReportCounts: []
      }
    }

    for (const emp of activeEmployees) {
      const level = emp.standardJobLevel || 'profesional_analista'
      
      if (levelStats[level]) {
        levelStats[level].count++
        
        if (emp.directReports.length > 0) {
          levelStats[level].withTeam++
          levelStats[level].directReportCounts.push(emp.directReports.length)
        }
        
        if (emp.hireDate) {
          const years = (now.getTime() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
          levelStats[level].tenures.push(years)
        }
      }
    }

    const byLevel = JOB_LEVEL_ORDER.map(level => {
      const stats = levelStats[level]
      const avgTenure = stats.tenures.length > 0
        ? Math.round((stats.tenures.reduce((sum, t) => sum + t, 0) / stats.tenures.length) * 10) / 10
        : 0
      
      const avgDirectReports = stats.directReportCounts.length > 0
        ? Math.round((stats.directReportCounts.reduce((sum, c) => sum + c, 0) / stats.directReportCounts.length) * 10) / 10
        : 0

      return {
        level,
        label: JOB_LEVEL_LABELS[level] || level,
        count: stats.count,
        percentage: Math.round((stats.count / totalActive) * 100) || 0,
        withTeam: stats.withTeam,
        withoutTeam: stats.count - stats.withTeam,
        avgTenure,
        avgDirectReports
      }
    })

    // ═══════════════════════════════════════════════════════════════
    // 3. ESTRUCTURA DE LIDERAZGO
    // ═══════════════════════════════════════════════════════════════
    const managers = activeEmployees.filter(e => e.directReports.length > 0)
    const contributors = activeEmployees.filter(e => e.directReports.length === 0)
    
    const totalManagers = managers.length
    const totalContributors = contributors.length
    
    const allDirectReports = managers.map(m => m.directReports.length)
    const avgDirectReports = allDirectReports.length > 0
      ? Math.round((allDirectReports.reduce((sum, c) => sum + c, 0) / allDirectReports.length) * 10) / 10
      : 0
    
    const managerWithMostReports = managers.reduce((max, m) => 
      m.directReports.length > (max?.directReports.length || 0) ? m : max,
      managers[0]
    )
    
    const maxDirectReports = managerWithMostReports 
      ? {
          name: managerWithMostReports.fullName,
          count: managerWithMostReports.directReports.length
        }
      : { name: 'N/A', count: 0 }
    
    const ratio = totalManagers > 0 
      ? `1:${Math.round((totalContributors / totalManagers) * 10) / 10}`
      : '1:0'
    
    // Health status basado en ratio
    const ratioValue = totalContributors / (totalManagers || 1)
    let healthStatus: 'OK' | 'WARNING' | 'CRITICAL'
    if (ratioValue >= 5 && ratioValue <= 8) {
      healthStatus = 'OK'
    } else if (ratioValue < 3 || ratioValue > 10) {
      healthStatus = 'CRITICAL'
    } else {
      healthStatus = 'WARNING'
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. TENDENCIAS (últimos 3 imports)
    // ═══════════════════════════════════════════════════════════════
    const imports = await prisma.employeeImport.findMany({
      where: { 
        accountId: userContext.accountId,
        status: 'COMPLETED'
      },
      orderBy: { startedAt: 'desc' },
      take: 3,
      select: {
        totalInFile: true,
        startedAt: true,
        created: true,
        updated: true,
        rehired: true
      }
    })

    const months = imports.reverse().map((imp, idx) => {
      const previousCount = idx > 0 ? imports[idx - 1].totalInFile : imp.totalInFile
      return {
        period: new Date(imp.startedAt).toISOString().slice(0, 7),
        count: imp.totalInFile,
        delta: imp.totalInFile - previousCount
      }
    })

    // Último mes (si existe)
    const lastImport = imports[imports.length - 1]
    const lastMonth = lastImport ? {
      hires: lastImport.created,
      terminations: 0,  // No tracking directo aún
      transfers: 0,     // Calcular de EmployeeHistory si necesario
      promotions: 0     // Calcular de EmployeeHistory si necesario
    } : {
      hires: 0,
      terminations: 0,
      transfers: 0,
      promotions: 0
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. GENERAR INSIGHTS AUTOMÁTICOS
    // ═══════════════════════════════════════════════════════════════
    const insights: Array<{ type: 'success' | 'warning' | 'info'; text: string }> = []

    // Insight: Ratio liderazgo
    if (healthStatus === 'CRITICAL') {
      insights.push({
        type: 'warning',
        text: `Alto ratio manager:colaborador (${ratio}) sugiere estructura muy plana`
      })
    } else if (healthStatus === 'OK') {
      insights.push({
        type: 'success',
        text: `Ratio liderazgo saludable (${ratio}) dentro de benchmark industria`
      })
    }

    // Insight: Antigüedad
    const avgGlobalTenure = byLevel
      .reduce((sum, l) => sum + (l.avgTenure * l.count), 0) / totalActive
    
    if (avgGlobalTenure >= 2 && avgGlobalTenure <= 5) {
      insights.push({
        type: 'success',
        text: `Antigüedad saludable (promedio ${Math.round(avgGlobalTenure * 10) / 10} años)`
      })
    }

    // Insight: Crecimiento
    if (months.length >= 2) {
      const totalGrowth = months[months.length - 1].count - months[0].count
      const growthPercent = Math.round((totalGrowth / months[0].count) * 100)
      if (totalGrowth > 0) {
        insights.push({
          type: 'success',
          text: `Crecimiento sostenido últimos ${months.length} meses (+${growthPercent}% total)`
        })
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. RESPONSE
    // ═══════════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      analytics: {
        byLevel,
        leadership: {
          totalManagers,
          totalContributors,
          avgDirectReports,
          maxDirectReports,
          leadershipRatio: ratio,
          industryBenchmark: '1:5-8',
          healthStatus
        },
        trends: {
          months,
          lastMonth
        },
        insights
      }
    })

  } catch (error) {
    console.error('[API] Error en /api/admin/employees/analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}
```

---

## ✅ VALIDACIÓN

### **Testing Manual:**

```bash
# 1. Test /stats
curl http://localhost:3000/api/admin/employees/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: { success: true, stats: { totalActive: 127, ... } }

# 2. Test /analytics
curl http://localhost:3000/api/admin/employees/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: { success: true, analytics: { byLevel: [...], ... } }
```

### **Checklist:**

```yaml
☐ ambos endpoints retornan success: true
☐ Stats muestra totalActive correcto
☐ Delta calcula vs import anterior
☐ byTrack suma 100% en percentages
☐ byLevel muestra 7 niveles ordenados
☐ Leadership ratio calculado correctamente
☐ Insights array no vacío
☐ Response time < 1s con 1000 employees
☐ accountId filtrado aplicado
☐ Permisos RBAC verificados
```

---

## 🎯 OBJETIVOS CUMPLIDOS

1. ✅ GET `/api/admin/employees/stats` funcionando
2. ✅ GET `/api/admin/employees/analytics` funcionando
3. ✅ Delta histórico calculado
4. ✅ Breakdown por tracks y niveles
5. ✅ Insights automáticos generados
6. ✅ RBAC y seguridad aplicados

---

**TASK 1 COMPLETADA** ✅
