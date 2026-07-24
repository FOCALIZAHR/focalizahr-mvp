---
name: focalizahr-api
description: |
  OBLIGATORIO para TODA API/endpoint en FocalizaHR.
  Triggers: "crea endpoint", "API", "route.ts", "backend", "GET", "POST",
  "PUT", "DELETE", "seguridad", "RBAC", "permisos", "filtrado".
  Aplica patrones de seguridad multi-tenant y filtrado jerárquico.
---

# 🔐 FOCALIZAHR API SKILL

> **OBLIGATORIO** para TODA API en FocalizaHR.
> Leer ANTES de crear cualquier endpoint, route.ts, o modificar APIs existentes.

---

## ⚠️ ADVERTENCIA CRÍTICA

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  ESTE DOCUMENTO CONTIENE PATRONES DE SEGURIDAD OBLIGATORIOS                  ║
║                                                                               ║
║  • NO son sugerencias, son REQUISITOS                                         ║
║  • Toda API DEBE seguir estos patrones sin excepción                         ║
║  • El incumplimiento causa vulnerabilidades de seguridad                     ║
║                                                                               ║
║  Si una implementación no sigue estos patrones → RECHAZAR y corregir         ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

> ⚠️ **NUNCA escribir un array de roles a mano** (`const globalRoles = [...]`,
> `const allowedRoles = [...]`, `['HR_ADMIN', 'HR_MANAGER'].includes(role)`), ni
> siquiera para un endpoint pequeño o interno. Una auditoría de jul 2026 encontró
> 14 casos de este patrón en el proyecto, 5 de ellos bugs de acceso reales
> (roles con acceso incorrecto), causados por arrays clonados que quedaron
> desactualizados frente a `permissions.ts`. Siempre importar `GLOBAL_ACCESS_ROLES`
> o llamar `hasPermission()` — ver `references/anti-patterns.md`, Anti-Patrón 1.

---

## 📚 ARCHIVOS DE REFERENCIA

| Archivo | Cuándo Consultar |
|---------|------------------|
| `references/rbac-patterns.md` | **SIEMPRE** - Patrones de implementación |
| `references/authorization-service.md` | Para funciones del servicio |
| `references/anti-patterns.md` | Para verificar qué NO hacer |

---

## ⚡ QUICK REFERENCE - COPIAR Y PEGAR

### Imports Obligatorios

```typescript
// Para APIs (server-side, necesita Prisma vía AuthorizationService):
import { 
  extractUserContext, 
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES
} from '@/lib/services/AuthorizationService'

// Para componentes client-side (sin Prisma, RBAC puro):
import { hasPermission, PERMISSIONS, GLOBAL_ACCESS_ROLES } from '@/lib/auth/permissions'
```

> Desde jul 2026, `permissions.ts` (`src/lib/auth/permissions.ts`) es la fuente
> RBAC pura, client-safe. `AuthorizationService.ts` la re-exporta completa para
> APIs server-side — los imports existentes desde `AuthorizationService` siguen
> funcionando sin cambios. Usar `permissions.ts` directo solo cuando el
> consumidor es un client component que no puede cargar Prisma.

### Patrón API Estándar

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  extractUserContext, 
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES
} from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  // 1. EXTRAER CONTEXTO (viene del middleware)
  const userContext = extractUserContext(request)
  
  // 2. VALIDAR AUTENTICACIÓN
  if (!userContext.accountId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  // 3. VALIDAR PERMISOS
  if (!hasPermission(userContext.role, 'recurso:view')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  
  // 4. FILTRO BASE (multi-tenant SIEMPRE)
  const where: any = { accountId: userContext.accountId }
  
  // 5. FILTRADO JERÁRQUICO SEGÚN ROL
  const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
  
  if (!hasGlobalAccess && userContext.role === 'AREA_MANAGER') {
    const childIds = await getChildDepartmentIds(userContext.departmentId!)
    const allowedDepts = [userContext.departmentId, ...childIds]
    where.employee = { departmentId: { in: allowedDepts } }
  }
  
  // 6. QUERY CON PAGINACIÓN
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const skip = (page - 1) * limit
  
  const [data, total] = await Promise.all([
    prisma.model.findMany({ where, skip, take: limit }),
    prisma.model.count({ where })
  ])
  
  return NextResponse.json({ 
    success: true, 
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  })
}
```

---

## ✅ 6 CHECKS PRE-ENTREGA (OBLIGATORIOS)

```yaml
□ CHECK 1: ¿Usa extractUserContext(request)?
□ CHECK 2: ¿Usa hasPermission() con permiso correcto? (NO arrays hardcodeados)
□ CHECK 3: ¿accountId en TODA query?
□ CHECK 4: ¿Filtrado 3 capas según rol? (GLOBAL → HIERARCHICAL → DIRECT)
□ CHECK 5: ¿Backend calcula stats? (NO frontend)
□ CHECK 6: ¿Paginación real (skip/take)? (NO limit=500)

⚠️ Si falla 1 check → NO está listo para producción
```

---

## 🔒 3 CAPAS DE FILTRADO

| Capa | Roles | Filtro |
|------|-------|--------|
| **GLOBAL** | FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, HR_OPERATOR, CEO | Solo `accountId` |
| **HIERARCHICAL** | AREA_MANAGER | `accountId` + `departmentId` + hijos (CTE recursivo) |
| **DIRECT REPORTS** | EVALUATOR | `accountId` + `managerId = currentEmployee.id` |

### Implementación 3 Capas

```typescript
// Determinar capa
const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)

if (hasGlobalAccess) {
  // CAPA 1: Solo accountId
  where.accountId = userContext.accountId
  
} else if (userContext.role === 'AREA_MANAGER') {
  // CAPA 2: Jerárquico
  const childIds = await getChildDepartmentIds(userContext.departmentId!)
  const allowedDepts = [userContext.departmentId, ...childIds]
  where.accountId = userContext.accountId
  where.employee = { departmentId: { in: allowedDepts } }
  
} else if (userContext.role === 'EVALUATOR') {
  // CAPA 3: Solo subordinados directos
  const userEmail = request.headers.get('x-user-email') || ''
  const currentEmployee = await prisma.employee.findFirst({
    where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
  })
  if (currentEmployee) {
    where.accountId = userContext.accountId
    where.employee = { managerId: currentEmployee.id }
  }
}
```

---

## 🔗 VÍNCULO Employee↔User — regla para código nuevo

> **Ningún endpoint nuevo agrega `prisma.employee.findFirst({email: userEmail})`.**
> Usar `userContext.employeeId` (extractUserContext). Si aún no existe el
> vínculo o el usuario cae en el caso ejecutivo/holding sin Employee, manejar
> el `null` explícito — no agregar otro lookup por email.

`Employee` (nómina) y `User` (login) son tablas disjuntas sin FK. 35 sitios
existentes resuelven "¿cuál es el Employee de este usuario?" buscando por email
(`findFirst({accountId, email: userEmail, status:'ACTIVE'})`) — frágil, porque
`User.email` y `Employee.email` pueden no coincidir y `Employee.email` es nullable
y no único. El ejemplo de la **CAPA 3 (DIRECT REPORTS)** de arriba usa ese patrón
legacy: es código canónico existente, no lo repliques en endpoints nuevos.

**Estado: Etapa 1 no iniciada — no tratar como resuelto.** `userContext.employeeId`
aún no está expuesto por `extractUserContext`; hasta que se selle la Etapa 1, un
endpoint nuevo que necesite el Employee del usuario **detiene y consulta**, no
agrega un lookup por email "mientras tanto".

Detalle completo y etapas: `.claude/tasks/ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md`.

---

## 🚨 ANTI-PATRONES CRÍTICOS

```typescript
// ❌ NUNCA: Arrays hardcodeados
if (['HR_ADMIN', 'HR_MANAGER'].includes(role))
// ✅ SIEMPRE: Constantes
if (GLOBAL_ACCESS_ROLES.includes(role as any))

// ❌ NUNCA: Query sin accountId
where: { cycleId }
// ✅ SIEMPRE: accountId presente
where: { cycleId, accountId: userContext.accountId }

// ❌ NUNCA: email de userContext (no existe)
userContext.email
// ✅ SIEMPRE: email del header
request.headers.get('x-user-email')

// ❌ NUNCA: limit=500 y filtrar en frontend
const all = await prisma.model.findMany({ take: 500 })
return all.filter(...)
// ✅ SIEMPRE: Filtrar en backend con paginación
await prisma.model.findMany({ where, skip, take: 20 })
```

---

## 📋 PERMISOS DISPONIBLES

```typescript
// En AuthorizationService.ts - PERMISSIONS
'campaigns:manage'    // Gestionar campañas
'participants:upload' // Subir participantes
'results:view'        // Ver resultados
'results:export'      // Exportar resultados
'account:config'      // Configurar cuenta
'employees:manage'    // Gestionar empleados
'goals:view'          // Ver metas
'goals:create'        // Crear metas
'goals:approve'       // Aprobar metas
'goals:config'        // Configurar sistema metas
```

---

## 📖 DOCUMENTACIÓN COMPLETA

Para casos complejos, consultar en Project Knowledge:
- `GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_3.md`
- `DEUDA_RBAC_ARRAYS_HARDCODEADOS_v1.md`
- `SEGURIDAD_APIS_QUICK_REFERENCE.md`
- `src/lib/auth/permissions.ts`
- `src/lib/services/AuthorizationService.ts`
