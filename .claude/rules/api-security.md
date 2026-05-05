# FocalizaHR — API Security Rules
glob: src/app/api/**

---

## Patrón Obligatorio — Todo route.ts

```typescript
import { extractUserContext, hasPermission, 
         getChildDepartmentIds, GLOBAL_ACCESS_ROLES } 
  from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  const userContext = extractUserContext(request)
  if (!userContext.accountId) 
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!hasPermission(userContext.role, 'recurso:view')) 
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const where: any = { accountId: userContext.accountId }
  // + filtrado jerárquico según rol (ver abajo)
}
```

---

## Filtrado 3 Capas — Obligatorio

| Capa | Roles | Filtro |
|------|-------|--------|
| GLOBAL | FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, HR_OPERATOR, CEO | Solo `accountId` |
| HIERARCHICAL | AREA_MANAGER | `accountId` + `departmentId` + hijos via `getChildDepartmentIds()` |
| DIRECT | EVALUATOR | `accountId` + `managerId = currentEmployee.id` |

---

## Checklist Pre-Entrega

- `extractUserContext(request)` presente
- `hasPermission()` con permiso correcto — nunca arrays hardcodeados
- `accountId` en TODA query Prisma
- Filtrado 3 capas según rol
- Stats calculadas en backend — nunca en frontend
- Paginación real: `skip/take` — nunca `limit: 500`

---

## Anti-Patrones Prohibidos

```typescript
// ❌ Arrays hardcodeados
if (['HR_ADMIN', 'HR_MANAGER'].includes(role))
// ✅ Siempre constantes
if (GLOBAL_ACCESS_ROLES.includes(role as any))

// ❌ Query sin accountId
where: { cycleId }
// ✅ accountId siempre presente
where: { cycleId, accountId: userContext.accountId }

// ❌ email de userContext (no existe)
userContext.email
// ✅ email del header
request.headers.get('x-user-email')
```

---

## Conocimiento Profundo

Para casos complejos de RBAC y filtrado jerárquico:
→ Cargar skill `focalizahr-api`
