# 🛡️ AuthorizationService - Referencia de Funciones

> Archivo: `src/lib/services/AuthorizationService.ts`

---

## EXPORTS DISPONIBLES

```typescript
// Funciones
export function extractUserContext(request: Request): UserContext
export function hasPermission(role: string | null, action: PermissionType): boolean
export function getPermissionsForRole(role: string): PermissionType[]
export async function getChildDepartmentIds(parentId: string): Promise<string[]>
export async function buildParticipantAccessFilter(userContext, options?): Promise<any>
export function invalidateDepartmentCache(departmentId?: string): void

// Constantes
export const PERMISSIONS: Record<string, readonly string[]>
export const ALL_ROLES: readonly string[]
export const GLOBAL_ACCESS_ROLES: readonly string[]
export const HIERARCHICAL_FILTER_ROLES: readonly string[]

// Tipos
export type PermissionType = keyof typeof PERMISSIONS
export type RoleType = typeof ALL_ROLES[number]
export interface UserContext {
  accountId: string
  role: string | null
  departmentId: string | null
  userId: string | null
}
```

---

## extractUserContext()

Extrae contexto de seguridad desde headers HTTP inyectados por el middleware.

```typescript
export function extractUserContext(request: Request): UserContext {
  return {
    accountId: request.headers.get('x-account-id') || '',
    role: request.headers.get('x-user-role'),
    departmentId: request.headers.get('x-department-id'),
    userId: request.headers.get('x-user-id')
  }
}
```

### Uso

```typescript
const userContext = extractUserContext(request)

if (!userContext.accountId) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}
```

### Headers Disponibles

| Header | Contenido | Siempre presente |
|--------|-----------|------------------|
| `x-account-id` | ID de la cuenta/empresa | ✅ Sí |
| `x-user-role` | Rol del usuario | ✅ Sí |
| `x-department-id` | Departamento asignado | ❌ Puede ser null |
| `x-user-id` | ID del usuario | ✅ Sí |
| `x-user-email` | Email del usuario | ✅ Sí (header separado) |

---

## hasPermission()

Valida si un rol tiene un permiso específico.

```typescript
export function hasPermission(
  role: string | null, 
  action: PermissionType
): boolean
```

### Uso

```typescript
// Validar permiso específico
if (!hasPermission(userContext.role, 'campaigns:manage')) {
  return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
}

// En condicionales
const canEdit = hasPermission(userContext.role, 'employees:manage')
const canExport = hasPermission(userContext.role, 'results:export')
```

### Permisos Disponibles

```typescript
const PERMISSIONS = {
  'campaigns:manage': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
  'participants:upload': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR'],
  'results:view': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'CEO', 'AREA_MANAGER'],
  'results:export': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
  'account:config': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER'],
  'employees:manage': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
  'goals:view': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'CEO', 'AREA_MANAGER', 'EVALUATOR'],
  'goals:create': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'CEO', 'AREA_MANAGER', 'EVALUATOR'],
  'goals:approve': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'CEO', 'AREA_MANAGER'],
  'goals:config': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN']
}
```

---

## getChildDepartmentIds()

Obtiene IDs de departamentos hijos usando CTE recursivo PostgreSQL.

```typescript
export async function getChildDepartmentIds(parentId: string): Promise<string[]>
```

### Uso

```typescript
// Obtener departamento + todos sus hijos
const childIds = await getChildDepartmentIds(userContext.departmentId!)
const allowedDepts = [userContext.departmentId, ...childIds]

// Usar en query
where.departmentId = { in: allowedDepts }
```

### Caching

- Usa cache LRU con TTL de 15 minutos
- Se invalida automáticamente cuando cambia la jerarquía
- Para invalidar manualmente: `invalidateDepartmentCache(departmentId)`

---

## buildParticipantAccessFilter()

Construye filtros de seguridad multi-nivel automáticamente.

```typescript
export async function buildParticipantAccessFilter(
  userContext: UserContext,
  options?: {
    dataType?: 'participation' | 'results' | 'administrative'
    skipDepartmentFilter?: boolean
  }
): Promise<any>
```

### Uso

```typescript
const accessFilter = await buildParticipantAccessFilter(
  userContext,
  { dataType: 'results' }
)

const data = await prisma.participant.findMany({
  where: {
    ...accessFilter,
    // tus filtros adicionales
    campaignId: campaignId
  }
})
```

### dataType

| Tipo | Descripción | Filtrado |
|------|-------------|----------|
| `participation` | Datos de participación | Estricto |
| `results` | Resultados de encuestas | Jerárquico |
| `administrative` | Datos administrativos | Solo accountId |

---

## invalidateDepartmentCache()

Invalida el cache de jerarquía departamental.

```typescript
export function invalidateDepartmentCache(departmentId?: string): void
```

### Uso

```typescript
// Invalidar cache de un departamento específico
invalidateDepartmentCache(department.id)

// Invalidar todo el cache
invalidateDepartmentCache()
```

### Cuándo Usar

- Después de crear un departamento
- Después de modificar `parentId` de un departamento
- Después de eliminar un departamento

---

## GLOBAL_ACCESS_ROLES

Roles que ven toda la empresa sin filtro jerárquico.

```typescript
export const GLOBAL_ACCESS_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
  'HR_OPERATOR',
  'CEO'
] as const
```

### Uso

```typescript
const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)

if (hasGlobalAccess) {
  // Solo filtrar por accountId
  where.accountId = userContext.accountId
} else {
  // Aplicar filtro jerárquico adicional
}
```

---

## getPermissionsForRole()

Obtiene todos los permisos de un rol.

```typescript
export function getPermissionsForRole(role: string): PermissionType[]
```

### Uso

```typescript
const permissions = getPermissionsForRole('HR_MANAGER')
// ['campaigns:manage', 'participants:upload', 'results:view', ...]
```

---

## EJEMPLO COMPLETO

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
  // 1. Extraer contexto
  const userContext = extractUserContext(request)
  
  if (!userContext.accountId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  // 2. Validar permiso
  if (!hasPermission(userContext.role, 'results:view')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  
  // 3. Construir filtro base
  const where: any = { accountId: userContext.accountId }
  
  // 4. Aplicar filtro jerárquico si corresponde
  const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
  
  if (!hasGlobalAccess && userContext.role === 'AREA_MANAGER') {
    const childIds = await getChildDepartmentIds(userContext.departmentId!)
    where.participant = {
      employee: {
        departmentId: { in: [userContext.departmentId, ...childIds] }
      }
    }
  }
  
  // 5. Ejecutar query
  const results = await prisma.response.findMany({
    where,
    include: { participant: { include: { employee: true } } }
  })
  
  return NextResponse.json({ success: true, data: results })
}
```
