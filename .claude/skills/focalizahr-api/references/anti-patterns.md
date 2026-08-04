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

### 🔴 Caso real (jul 2026) — por qué esto NO es teórico

Una auditoría completa del proyecto encontró **14 arrays de roles hardcodeados**
que redefinían "acceso global" a mano, en vez de importar `GLOBAL_ACCESS_ROLES` o
llamar a `hasPermission()`. De esos, **5 eran bugs confirmados de acceso** —
roles que deberían tener acceso a un recurso y no lo tenían (o viceversa), porque
alguien clonó un array de roles en algún momento del pasado y ese clon quedó
congelado mientras la fuente única (`permissions.ts`) seguía evolucionando.

El caso más grave (`AuthorizationService.ts`, función `buildParticipantAccessFilter`):
un array local `globalRoles` excluía a `HR_ADMIN` y `HR_OPERATOR` del acceso
global a participantes/campañas — mientras que la constante oficial
`GLOBAL_ACCESS_ROLES` sí los incluye desde Feb 2025. El array clonado nunca se
actualizó cuando se corrigió la fuente única.

Además se encontró un patrón más grave todavía: **7 de 9 endpoints de un módulo
completo (`executive-hub/*`) no tenían NINGÚN gate de autorización por rol** —
solo verificaban `accountId` (autenticación), confundiendo un array de *scope*
(quién ve sin filtro departamental) con un gate real de *permiso* (quién puede
acceder). Son conceptos distintos y mezclarlos escondió la ausencia total de
`hasPermission()` en la mayoría del módulo.

**La lección:** cada array de roles escrito a mano es una copia que puede
desincronizarse de `permissions.ts` sin que nadie lo note, hasta que alguien
audita todo el proyecto a mano. La única forma de que esto no vuelva a pasar es
no crear el array nunca — importar la constante o llamar `hasPermission()`
siempre, sin excepción, incluso para un endpoint "chico" o "interno".

Ver `DEUDA_RBAC_ARRAYS_HARDCODEADOS_v1.md` (Project Knowledge) para el detalle
completo de los 14 sitios y su estado de corrección — a la fecha, **pendiente
de fix**, no tratar como resuelto.

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

### ⚠️ El ✅ de arriba es un FALLBACK, no la primera opción

Ese patrón es el **legacy de 35 sitios** que el proyecto **RUT_MAIL** está
reemplazando. Sigue siendo válido, pero no es lo primero que escribe un endpoint
nuevo. Referencia: `.claude/tasks/ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md`.

**Patrón preferido para endpoints nuevos** — leer `x-employee-id` (viene de
`User.employeeId`, Etapa 1 de RUT_MAIL) y caer a la búsqueda por email SOLO si ese
header viene vacío (usuarios todavía no migrados, que hoy son la mayoría):

```typescript
// 1º: el vínculo directo (Etapa 1 de RUT_MAIL). Ya expuesto por extractUserContext.
let employeeId = userContext.employeeId

// 2º: fallback legacy por email, solo si el vínculo no está poblado.
if (!employeeId) {
  const userEmail = request.headers.get('x-user-email') || ''
  const currentEmployee = userEmail
    ? await prisma.employee.findFirst({
        where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' },
        select: { id: true },
      })
    : null
  employeeId = currentEmployee?.id ?? null
}

// 3º: manejar el null explícito. Nunca asumir identidad.
```

El fallback **corre después**, no en paralelo: cuando el vínculo esté poblado
(Etapas 4 y 5), la rama por email deja de ejecutarse sola y el día que se borre,
el endpoint no cambia de comportamiento.

**⛔ NO poblar `User.employeeId` a mano para destrabar un feature.** La Etapa 4
(aprovisionamiento automático) y la Etapa 5 (backfill) **todavía no están
diseñadas**. Un vínculo escrito a mano hoy queda fuera de esas etapas y se
convierte en dato huérfano que nadie sabe reconciliar.

**Por qué el orden importa:** `Employee` y `User` son tablas disjuntas sin FK.
`User.email` y `Employee.email` pueden no coincidir, y `Employee.email` es nullable
y no único — por eso el email es el fallback y no la fuente. Es el mismo motivo por
el que la regla de `SKILL.md` §Vínculo existe.

#### ⛔ "No único" no es teórico: hoy resuelve a la persona equivocada

Medido en la cuenta de producción el 2026-08-04:

```
Employees en la cuenta                 219
Emails distintos                        20
Comparten '1uan@corre.cl'              199  (91%), de los cuales 44 ACTIVE

findFirst({ email:'1uan@corre.cl', status:'ACTIVE' })  ->  VALENZUELA LANDEROS JUAN FRANCISCO
El responsable de Comercial es                          ->  GONZALEZ JIMENEZ LUCIANO SALVADOR
```

Es un placeholder de una carga de nómina, y **3 de los 4 responsables de departamento
lo tienen**. `findFirst` devuelve uno arbitrario de los 44 activos.

**Consecuencia por tipo de ruta:**

- **Lectura** (los ~30 sitios legacy): muestra una lista que no corresponde. Grave,
  ya conocido, es el comportamiento actual.
- **Escritura o atribución de identidad** (`createdBy`, `registeredBy`, guards que
  deciden quién puede escribir): **el fallback NO se usa**. Firmar un registro con la
  persona equivocada es peor que no tener registro. Si tu endpoint escribe algo
  atribuible a una persona, maneja el `null` y devuelve vacío o un mensaje honesto.

Precedente aplicado: la Bitácora de Acciones de Clima
(`src/app/api/clima/action-log/route.ts`, función `resolveViewerEmployeeId`) devuelve
pantalla vacía a propósito hasta que exista el vínculo, en vez de adivinar.

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
