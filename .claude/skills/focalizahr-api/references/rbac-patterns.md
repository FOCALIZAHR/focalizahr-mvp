# 🔐 PATRONES RBAC - FocalizaHR APIs

> Patrones obligatorios para implementar seguridad en endpoints.

---

## ARQUITECTURA DE SEGURIDAD

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  REQUEST                                                               │
│     │                                                                  │
│     ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  MIDDLEWARE (src/middleware.ts)                                   │ │
│  │  ├─ Valida JWT de cookie                                         │ │
│  │  └─ Inyecta headers:                                             │ │
│  │      x-account-id, x-user-role, x-department-id, x-user-id       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                               │                                        │
│                               ▼                                        │
│                        ┌──────────────┐                                │
│                        │  API ROUTE   │                                │
│                        │  extractUser │                                │
│                        │  Context()   │                                │
│                        └──────┬───────┘                                │
│                               │                                        │
│                               ▼                                        │
│                  ┌────────────────────────┐                            │
│                  │ AuthorizationService   │                            │
│                  │ hasPermission()        │                            │
│                  │ buildAccessFilter()    │                            │
│                  └────────────┬───────────┘                            │
│                               │                                        │
│            ┌──────────────────┼──────────────────┐                     │
│            │                  │                  │                     │
│            ▼                  ▼                  ▼                     │
│     ┌──────────┐      ┌──────────────┐    ┌──────────┐                │
│     │ CAPA 1   │      │   CAPA 2     │    │ CAPA 3   │                │
│     │ GLOBAL   │      │ HIERARCHICAL │    │ DIRECT   │                │
│     │ accountId│      │ departmentId │    │ managerId│                │
│     └──────────┘      └──────────────┘    └──────────┘                │
│            │                  │                  │                     │
│            └──────────────────┼──────────────────┘                     │
│                               │                                        │
│                               ▼                                        │
│                        ┌──────────────┐                                │
│                        │ Prisma Query │                                │
│                        │ con filtros  │                                │
│                        └──────────────┘                                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## PATRÓN GET (Listar con Paginación)

```typescript
export async function GET(request: NextRequest) {
  // 1. EXTRAER CONTEXTO
  const userContext = extractUserContext(request)
  
  if (!userContext.accountId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  // 2. VALIDAR PERMISOS
  if (!hasPermission(userContext.role, 'recurso:view')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  
  // 3. PARSEAR QUERY PARAMS
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const skip = (page - 1) * limit
  const search = searchParams.get('search') || ''
  
  // 4. CONSTRUIR WHERE (siempre accountId)
  const where: any = { accountId: userContext.accountId }
  
  // 5. FILTRADO JERÁRQUICO
  const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
  
  if (!hasGlobalAccess) {
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      where.departmentId = { in: [userContext.departmentId, ...childIds] }
    }
  }
  
  // 6. FILTRO DE BÚSQUEDA (opcional)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  // 7. QUERY CON PAGINACIÓN
  const [data, total] = await Promise.all([
    prisma.model.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { relaciones: true }
    }),
    prisma.model.count({ where })
  ])
  
  // 8. RESPONSE
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}
```

---

## PATRÓN POST (Crear)

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. CONTEXTO + PERMISOS
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    if (!hasPermission(userContext.role, 'recurso:create')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    
    // 2. PARSEAR BODY
    const body = await request.json()
    
    // 3. VALIDACIÓN
    if (!body.campoRequerido) {
      return NextResponse.json(
        { error: 'Campo requerido faltante', success: false },
        { status: 400 }
      )
    }
    
    // 4. VALIDAR RESTRICCIONES POR ROL
    if (userContext.role === 'AREA_MANAGER') {
      // Solo puede crear en su departamento
      const childIds = await getChildDepartmentIds(userContext.departmentId!)
      const allowedDepts = [userContext.departmentId, ...childIds]
      
      if (!allowedDepts.includes(body.departmentId)) {
        return NextResponse.json(
          { error: 'No puede crear en este departamento', success: false },
          { status: 403 }
        )
      }
    }
    
    // 5. CREAR (siempre con accountId)
    const created = await prisma.model.create({
      data: {
        ...body,
        accountId: userContext.accountId  // OBLIGATORIO
      }
    })
    
    return NextResponse.json({ success: true, data: created }, { status: 201 })
    
  } catch (error) {
    console.error('[API POST ERROR]:', error)
    return NextResponse.json(
      { error: 'Error creando registro', success: false },
      { status: 500 }
    )
  }
}
```

---

## PATRÓN PUT/PATCH (Actualizar)

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    if (!hasPermission(userContext.role, 'recurso:edit')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    
    // VERIFICAR QUE EL REGISTRO PERTENECE A LA CUENTA
    const existing = await prisma.model.findFirst({
      where: {
        id: params.id,
        accountId: userContext.accountId  // CRÍTICO: multi-tenant
      }
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Registro no encontrado', success: false },
        { status: 404 }
      )
    }
    
    // VALIDAR ACCESO JERÁRQUICO SI APLICA
    if (userContext.role === 'AREA_MANAGER') {
      const childIds = await getChildDepartmentIds(userContext.departmentId!)
      const allowedDepts = [userContext.departmentId, ...childIds]
      
      if (!allowedDepts.includes(existing.departmentId)) {
        return NextResponse.json(
          { error: 'No tiene acceso a este registro', success: false },
          { status: 403 }
        )
      }
    }
    
    const body = await request.json()
    
    const updated = await prisma.model.update({
      where: { id: params.id },
      data: body
    })
    
    return NextResponse.json({ success: true, data: updated })
    
  } catch (error) {
    console.error('[API PUT ERROR]:', error)
    return NextResponse.json(
      { error: 'Error actualizando registro', success: false },
      { status: 500 }
    )
  }
}
```

---

## PATRÓN DELETE

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    if (!hasPermission(userContext.role, 'recurso:delete')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    
    // VERIFICAR QUE EL REGISTRO PERTENECE A LA CUENTA
    const existing = await prisma.model.findFirst({
      where: {
        id: params.id,
        accountId: userContext.accountId
      }
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Registro no encontrado', success: false },
        { status: 404 }
      )
    }
    
    await prisma.model.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true, message: 'Eliminado' })
    
  } catch (error) {
    console.error('[API DELETE ERROR]:', error)
    return NextResponse.json(
      { error: 'Error eliminando registro', success: false },
      { status: 500 }
    )
  }
}
```

---

## PATRÓN: RUTAS /equipo (Subordinados Directos)

En rutas `/equipo`, `/mi-gente`, `/mis-evaluaciones`: **GLOBAL_ACCESS_ROLES NO APLICA**.

Todos ven SOLO su equipo directo.

```typescript
// En rutas de "mi equipo"
export async function GET(request: NextRequest) {
  const userContext = extractUserContext(request)
  
  if (!userContext.accountId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  // OBTENER EMPLEADO ACTUAL
  const userEmail = request.headers.get('x-user-email') || ''
  const currentEmployee = await prisma.employee.findFirst({
    where: {
      accountId: userContext.accountId,
      email: userEmail,
      status: 'ACTIVE'
    }
  })
  
  if (!currentEmployee) {
    return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
  }
  
  // SIEMPRE FILTRAR POR managerId (incluso HR_ADMIN)
  const subordinates = await prisma.employee.findMany({
    where: {
      accountId: userContext.accountId,
      managerId: currentEmployee.id,  // Solo sus subordinados directos
      status: 'ACTIVE'
    }
  })
  
  return NextResponse.json({ success: true, data: subordinates })
}
```

---

## MATRIZ DE ROLES Y ACCESO

| Rol | Capa | Ve | Puede Hacer |
|-----|------|-----|-------------|
| `FOCALIZAHR_ADMIN` | GLOBAL | Todo (cross-tenant) | CRUD total |
| `ACCOUNT_OWNER` | GLOBAL | Todo de su empresa | CRUD total empresa |
| `HR_ADMIN` | GLOBAL | Todo de su empresa | Gestión completa |
| `HR_MANAGER` | GLOBAL | Todo de su empresa | Gestión campañas |
| `HR_OPERATOR` | GLOBAL | Todo de su empresa | Solo ejecución |
| `CEO` | GLOBAL | Todo de su empresa | Solo lectura |
| `AREA_MANAGER` | HIERARCHICAL | Su gerencia + hijos | Gestión limitada |
| `EVALUATOR` | DIRECT | Solo subordinados | Evaluar equipo |
| `CLIENT` | - | Solo sus respuestas | Responder encuestas |

---

## CONSTANTES DISPONIBLES

```typescript
// En AuthorizationService.ts

export const GLOBAL_ACCESS_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER', 
  'HR_ADMIN',
  'HR_MANAGER',
  'HR_OPERATOR',
  'CEO'
] as const

export const HIERARCHICAL_FILTER_ROLES = [
  'AREA_MANAGER'
] as const

export const ALL_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
  'HR_OPERATOR',
  'CEO',
  'AREA_MANAGER',
  'EVALUATOR',
  'CLIENT'
] as const
```
