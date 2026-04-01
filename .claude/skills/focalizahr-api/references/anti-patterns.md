# 🚫 ANTI-PATRONES APIs - FocalizaHR

> Lo que NUNCA hacer al crear endpoints.

---

## ❌ ANTI-PATRÓN 1: Arrays de Roles Hardcodeados

```typescript
// ❌ MAL - Array hardcodeado
if (['HR_ADMIN', 'HR_MANAGER'].includes(role)) {
  // código...
}

// ❌ MAL - Lista repetida en cada API
const allowedRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN']
if (allowedRoles.includes(role)) {
  // código...
}

// ✅ BIEN - Usar constantes del servicio
import { GLOBAL_ACCESS_ROLES } from '@/lib/services/AuthorizationService'

if (GLOBAL_ACCESS_ROLES.includes(role as any)) {
  // código...
}

// ✅ MEJOR - Usar hasPermission
if (hasPermission(role, 'campaigns:manage')) {
  // código...
}
```

**Por qué es malo:** Si agregan/quitan roles, hay que cambiar en 50 archivos.

---

## ❌ ANTI-PATRÓN 2: Query Sin accountId

```typescript
// ❌ MAL - Sin accountId
const campaigns = await prisma.campaign.findMany({
  where: { status: 'ACTIVE' }
})

// ❌ MAL - accountId solo en algunas queries
const campaign = await prisma.campaign.findUnique({
  where: { id: campaignId }  // Cualquiera puede acceder
})

// ✅ BIEN - accountId SIEMPRE
const campaigns = await prisma.campaign.findMany({
  where: { 
    accountId: userContext.accountId,
    status: 'ACTIVE' 
  }
})

// ✅ BIEN - Verificar pertenencia antes de operar
const campaign = await prisma.campaign.findFirst({
  where: { 
    id: campaignId,
    accountId: userContext.accountId  // Solo si pertenece a su cuenta
  }
})
```

**Por qué es malo:** Vulnerabilidad CRÍTICA - una empresa puede ver datos de otra.

---

## ❌ ANTI-PATRÓN 3: Email de userContext

```typescript
// ❌ MAL - userContext.email NO EXISTE
const currentEmployee = await prisma.employee.findFirst({
  where: { email: userContext.email }  // undefined
})

// ✅ BIEN - Email viene del header
const userEmail = request.headers.get('x-user-email') || ''
const currentEmployee = await prisma.employee.findFirst({
  where: { 
    accountId: userContext.accountId,
    email: userEmail 
  }
})
```

**Por qué es malo:** `userContext` solo tiene `accountId`, `role`, `departmentId`, `userId`. El email está en header separado.

---

## ❌ ANTI-PATRÓN 4: limit=500 y Filtrar en Frontend

```typescript
// ❌ MAL - Traer todo y filtrar en frontend
const allEmployees = await prisma.employee.findMany({
  where: { accountId },
  take: 500  // "por si acaso"
})
return NextResponse.json({ data: allEmployees })
// Frontend: employees.filter(e => e.departmentId === myDept)

// ✅ BIEN - Filtrar en backend con paginación real
const { searchParams } = new URL(request.url)
const page = parseInt(searchParams.get('page') || '1')
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
const skip = (page - 1) * limit

const employees = await prisma.employee.findMany({
  where: { 
    accountId,
    departmentId: { in: allowedDepts }  // Filtro en backend
  },
  skip,
  take: limit
})
```

**Por qué es malo:** 
- Performance terrible
- Expone datos que el usuario no debería ver
- El frontend no es confiable para seguridad

---

## ❌ ANTI-PATRÓN 5: Stats Calculados en Frontend

```typescript
// ❌ MAL - Traer datos y calcular en frontend
const responses = await prisma.response.findMany({
  where: { campaignId }
})
return NextResponse.json({ data: responses })
// Frontend: const avg = responses.reduce(...) / responses.length

// ✅ BIEN - Calcular stats en backend
const stats = await prisma.response.aggregate({
  where: { 
    campaignId,
    accountId: userContext.accountId
  },
  _avg: { score: true },
  _count: true
})

return NextResponse.json({ 
  data: responses,
  stats: {
    average: stats._avg.score,
    total: stats._count
  }
})
```

**Por qué es malo:**
- Inconsistencia si hay filtros
- Performance (traer miles de registros para un promedio)
- Seguridad (el frontend puede manipular los cálculos)

---

## ❌ ANTI-PATRÓN 6: Sin Validar Permisos

```typescript
// ❌ MAL - Cualquiera puede llamar
export async function DELETE(request: NextRequest, { params }) {
  await prisma.campaign.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

// ✅ BIEN - Validar todo
export async function DELETE(request: NextRequest, { params }) {
  const userContext = extractUserContext(request)
  
  // 1. Validar autenticación
  if (!userContext.accountId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  // 2. Validar permiso
  if (!hasPermission(userContext.role, 'campaigns:manage')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  
  // 3. Validar que pertenece a su cuenta
  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, accountId: userContext.accountId }
  })
  
  if (!campaign) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  
  // 4. Ahora sí eliminar
  await prisma.campaign.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

---

## ❌ ANTI-PATRÓN 7: Confiar en Parámetros del Frontend

```typescript
// ❌ MAL - Confiar en accountId del body
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  await prisma.employee.create({
    data: {
      ...body,
      accountId: body.accountId  // ¡El frontend puede enviar cualquier accountId!
    }
  })
}

// ✅ BIEN - Usar accountId del contexto
export async function POST(request: NextRequest) {
  const userContext = extractUserContext(request)
  const body = await request.json()
  
  await prisma.employee.create({
    data: {
      ...body,
      accountId: userContext.accountId  // Siempre del contexto seguro
    }
  })
}
```

---

## ❌ ANTI-PATRÓN 8: GLOBAL_ACCESS en Rutas /equipo

```typescript
// ❌ MAL - HR_ADMIN ve todos los equipos
export async function GET(request: NextRequest) {
  const userContext = extractUserContext(request)
  const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
  
  if (hasGlobalAccess) {
    // HR_ADMIN ve TODOS los empleados como "su equipo"
    return prisma.employee.findMany({ where: { accountId } })
  }
}

// ✅ BIEN - En /equipo TODOS ven solo SU equipo
export async function GET(request: NextRequest) {
  const userContext = extractUserContext(request)
  const userEmail = request.headers.get('x-user-email') || ''
  
  // Obtener empleado actual
  const me = await prisma.employee.findFirst({
    where: { accountId: userContext.accountId, email: userEmail }
  })
  
  // SIEMPRE filtrar por managerId, sin importar el rol
  const myTeam = await prisma.employee.findMany({
    where: {
      accountId: userContext.accountId,
      managerId: me?.id  // Solo subordinados directos
    }
  })
  
  return NextResponse.json({ data: myTeam })
}
```

**Por qué:** En rutas `/equipo`, `/mi-gente`, `/mis-evaluaciones`, la pregunta es "quién ME reporta", no "a quién tengo acceso". HR quiere ver todos → va a `/estrategia`.

---

## ❌ ANTI-PATRÓN 9: No Manejar Errores

```typescript
// ❌ MAL - Sin try/catch
export async function GET(request: NextRequest) {
  const data = await prisma.model.findMany()
  return NextResponse.json({ data })
}

// ✅ BIEN - Manejo completo
export async function GET(request: NextRequest) {
  try {
    const data = await prisma.model.findMany({
      where: { accountId: userContext.accountId }
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[API GET ERROR]:', error)
    return NextResponse.json(
      { success: false, error: 'Error obteniendo datos' },
      { status: 500 }
    )
  }
}
```

---

## 📋 CHECKLIST ANTI-PATRONES

Antes de hacer PR, verificar que NO existe:

```yaml
□ Arrays de roles hardcodeados
□ Queries sin accountId
□ Uso de userContext.email
□ limit=500 sin paginación real
□ Stats calculados en frontend
□ Endpoints sin validar permisos
□ accountId tomado del body/params
□ GLOBAL_ACCESS en rutas /equipo
□ Sin try/catch en APIs
```

---

## CONSECUENCIAS DE VIOLAR

| Anti-Patrón | Consecuencia |
|-------------|--------------|
| Sin accountId | Fuga de datos entre empresas |
| Sin hasPermission | Usuarios hacen lo que no deben |
| limit=500 | Performance + Exposición datos |
| Stats en frontend | Datos inconsistentes |
| Confiar en body | Manipulación de datos |

**Cada violación es una vulnerabilidad de seguridad potencial.**
