# 🚨 TASK CRÍTICA: Fix Seguridad Performance Ratings

> **PRIORIDAD:** MÁXIMA — Incumplimiento de GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_1.md
> **TIPO:** Corrección de seguridad + bugs funcionales
> **AFECTA:** Todos los endpoints de `/api/admin/performance-ratings/`
> **REFERENCIA OBLIGATORIA:** `focalizahr-ui-design-standards.md` → Checklist Técnico Pre-Entrega

---

## 📋 CONTEXTO DEL PROBLEMA

La guía de seguridad define 4 checks obligatorios para TODA API:

```yaml
SEGURIDAD (Checklist Pre-Entrega):
  □ ¿Usa extractUserContext en APIs?              → ✅ SÍ cumple
  □ ¿Valida permisos con hasPermission?            → ✅ SÍ cumple
  □ ¿Aplica filtrado jerárquico si es AREA_MANAGER? → ❌ NO cumple
  □ ¿Query incluye accountId en where?              → ❌ NO cumple
```

**El módulo Performance Ratings está protegido por azar (CUIDs indivinables), NO por arquitectura correcta.** Esto viola el principio "BACKEND CALCULA, FRONTEND MUESTRA" de la guía RBAC.

---

## 🔍 PARTE 1: AUDITORÍA — Leer y reportar ANTES de cambiar nada

### INSTRUCCIÓN: Lee estos archivos y reporta el estado actual

```
ARCHIVOS A AUDITAR:
1. src/app/api/admin/performance-ratings/route.ts           (GET lista)
2. src/app/api/admin/performance-ratings/[id]/route.ts      (GET detalle)
3. src/app/api/admin/performance-ratings/[id]/potential/route.ts (POST asignar potencial)
4. src/app/api/admin/performance-ratings/nine-box/route.ts  (GET 9-box)
5. src/lib/services/PerformanceRatingService.ts             (listRatingsForCycle)
6. src/lib/services/AuthorizationService.ts                 (buildParticipantAccessFilter)

PARA CADA ARCHIVO REPORTAR:
- ¿Tiene extractUserContext? [SÍ/NO]
- ¿Tiene hasPermission? [SÍ/NO]  
- ¿La query Prisma incluye accountId en WHERE? [SÍ/NO]
- ¿Aplica filtrado departamental para AREA_MANAGER? [SÍ/NO]
- ¿Valida que el usuario puede operar sobre ese recurso? [SÍ/NO]
```

### FORMATO DE REPORTE AUDITORÍA:

```
=== AUDITORÍA SEGURIDAD PERFORMANCE RATINGS ===

1. GET /api/admin/performance-ratings (lista):
   extractUserContext: [SÍ/NO]
   hasPermission: [SÍ/NO]
   accountId en WHERE: [SÍ/NO] — ¿dónde exactamente?
   Filtrado AREA_MANAGER: [SÍ/NO]
   
2. GET /api/admin/performance-ratings/[id] (detalle):
   extractUserContext: [SÍ/NO]
   hasPermission: [SÍ/NO]
   accountId validación: [SÍ/NO] — ¿cómo?
   Filtrado AREA_MANAGER: [SÍ/NO]

3. POST /api/admin/performance-ratings/[id]/potential:
   extractUserContext: [SÍ/NO]
   hasPermission: [SÍ/NO]
   Valida relación jefe-subordinado: [SÍ/NO]
   accountId validación: [SÍ/NO]

4. GET /api/admin/performance-ratings/nine-box:
   extractUserContext: [SÍ/NO]
   hasPermission: [SÍ/NO]
   accountId en WHERE: [SÍ/NO]
   Filtrado AREA_MANAGER: [SÍ/NO]

5. PerformanceRatingService.listRatingsForCycle:
   Recibe accountId como parámetro: [SÍ/NO]
   Lo usa en WHERE: [SÍ/NO]
   Soporta filtro departamental: [SÍ/NO]
```

**NO aplicar cambios hasta completar esta auditoría.**

---

## 🔧 PARTE 2: FIX BUGS FUNCIONALES (página vacía)

> Aplicar DESPUÉS de completar la auditoría de Parte 1.

### BUG A — Fetch sin limit (page.tsx línea ~71)

**Archivo:** `src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx`

```typescript
// ACTUAL (bug):
const ratingsRes = await fetch(`/api/admin/performance-ratings?cycleId=${cycleId}`)

// FIX:
const ratingsRes = await fetch(`/api/admin/performance-ratings?cycleId=${cycleId}&limit=500`)
```

**Explicación:** El API default es `limit=20`. Con 200 ratings, solo trae 20 (ordenados por nombre A-C). Los filtros y stats se calculan client-side sobre esos 20 → página vacía.

**NOTA:** `limit=500` es TEMPORAL. La solución enterprise definitiva viene en Parte 3 (server-side filtering + stats del backend).

### BUG B — Precedencia de operadores en filtro (page.tsx líneas ~124-129)

```typescript
// ACTUAL (bug — el || tiene precedencia sobre ?:):
const matchesEvaluated =
  filterPotential === 'all' ||
  filterPotential === 'evaluated' ? isEvaluated :
  filterPotential === 'assigned' ? (r.potentialScore != null && isEvaluated) :
  filterPotential === 'pending' ? (r.potentialScore == null && isEvaluated) :
  true

// JS interpreta como: (all || evaluated) ? isEvaluated : ...
// Resultado: 'all' y 'evaluated' hacen LO MISMO — ambos filtran

// FIX (ternarios encadenados correctos):
const matchesEvaluated =
  filterPotential === 'all' ? true :
  filterPotential === 'evaluated' ? isEvaluated :
  filterPotential === 'assigned' ? (r.potentialScore != null && isEvaluated) :
  filterPotential === 'pending' ? (r.potentialScore == null && isEvaluated) :
  true
```

### Verificación Bugs:
```bash
npx tsc --noEmit
```

---

## 🔐 PARTE 3: FIX SEGURIDAD — Aplicar patrón RBAC correcto

> **REFERENCIA OBLIGATORIA:** `GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_1.md` Sección 8.1

### 3A. Agregar accountId a listRatingsForCycle

**Archivo:** `src/lib/services/PerformanceRatingService.ts`

**Cambio en `listRatingsForCycle`:** Agregar `accountId` como parámetro obligatorio y filtro departamental opcional.

```typescript
// FIRMA ACTUAL:
static async listRatingsForCycle(
  cycleId: string,
  options?: {
    page?: number
    limit?: number
    sortBy?: 'name' | 'score' | 'level'
    sortOrder?: 'asc' | 'desc'
    filterLevel?: string
    filterNineBox?: string
    filterCalibrated?: boolean
  }
)

// FIRMA CORREGIDA — agregar accountId + filtro departamental:
static async listRatingsForCycle(
  cycleId: string,
  accountId: string,  // ← NUEVO: obligatorio para defense-in-depth
  options?: {
    page?: number
    limit?: number
    sortBy?: 'name' | 'score' | 'level'
    sortOrder?: 'asc' | 'desc'
    filterLevel?: string
    filterNineBox?: string
    filterCalibrated?: boolean
    // ═══ NUEVOS ═══
    departmentIds?: string[]    // ← Para AREA_MANAGER (filtro jerárquico)
  }
)
```

**Cambio en el WHERE:**

```typescript
// ACTUAL:
const where: any = { cycleId }

// CORREGIDO:
const where: any = { 
  cycleId,
  accountId  // ← DEFENSE-IN-DEPTH: doble candado multi-tenant
}

// Si hay filtro departamental (AREA_MANAGER)
if (options?.departmentIds?.length) {
  where.employee = {
    departmentId: { in: options.departmentIds }
  }
}
```

### 3B. Aplicar filtrado en el endpoint GET /api/admin/performance-ratings

**Archivo:** `src/app/api/admin/performance-ratings/route.ts`

**Patrón a seguir:** Sección 8.1 de GUIA_MAESTRA_RBAC (ya implementado en exit/metrics, onboarding/journeys, etc.)

```typescript
// DESPUÉS de extractUserContext y hasPermission, ANTES de llamar al servicio:

import { 
  extractUserContext, 
  hasPermission,
  getChildDepartmentIds  // ← AGREGAR este import
} from '@/lib/services/AuthorizationService'

// ... dentro del GET handler:

// ════════════════════════════════════════════════════════════════
// NUEVO: Calcular filtro jerárquico según rol
// Patrón: GUIA_MAESTRA_RBAC Sección 4.3
// ════════════════════════════════════════════════════════════════
const globalRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'HR_OPERATOR', 'CEO']
let departmentIds: string[] | undefined = undefined

if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
  const childIds = await getChildDepartmentIds(userContext.departmentId)
  departmentIds = [userContext.departmentId, ...childIds]
}

// Llamada al servicio CON accountId y filtro departamental
const result = await PerformanceRatingService.listRatingsForCycle(
  cycleId, 
  userContext.accountId,  // ← NUEVO
  {
    page, limit, sortBy, sortOrder,
    filterLevel, filterNineBox, filterCalibrated,
    departmentIds  // ← NUEVO: undefined para roles globales, array para AREA_MANAGER
  }
)
```

### 3C. Fix endpoint 9-Box

**Archivo:** `src/app/api/admin/performance-ratings/nine-box/route.ts`

Aplicar el MISMO patrón: agregar `accountId` al servicio `get9BoxData` y filtrado departamental para AREA_MANAGER. Verificar que `get9BoxData` filtre por `accountId` internamente.

### 3D. Validación en asignación de potencial

**Archivo:** `src/app/api/performance-ratings/[id]/potential/route.ts`

**VERIFICAR si existe validación de que el usuario puede asignar potencial a ESE empleado.**

```typescript
// PATRÓN CORRECTO para validar asignación:

// 1. Obtener el rating con su empleado
const rating = await prisma.performanceRating.findFirst({
  where: { 
    id: ratingId,
    accountId: userContext.accountId  // ← Multi-tenant
  },
  include: { 
    employee: { select: { departmentId: true, managerId: true } }
  }
})

if (!rating) {
  return NextResponse.json({ error: 'Rating no encontrado' }, { status: 404 })
}

// 2. Si es AREA_MANAGER, validar que el empleado está en su scope
if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
  const childIds = await getChildDepartmentIds(userContext.departmentId)
  const allowedDepts = [userContext.departmentId, ...childIds]
  
  if (!allowedDepts.includes(rating.employee.departmentId)) {
    return NextResponse.json(
      { error: 'Sin acceso - empleado fuera de su ámbito jerárquico' },
      { status: 403 }
    )
  }
}

// 3. Registrar quién asignó (auditoría)
// potentialRatedBy ya existe en el schema — asegurar que se graba
```

---

## 📊 PARTE 4: Verificación Post-Fix

### Tests manuales:

```yaml
TEST 1 — Multi-tenant (accountId):
  - Llamar GET /api/admin/performance-ratings?cycleId=ID_EMPRESA_A
  - Con JWT de Empresa B (si tuvieras otro)
  - Esperado: 0 resultados o 403

TEST 2 — AREA_MANAGER filtrado:
  - Login como AREA_MANAGER (ventas@test.com si existe)
  - Ir a Asignar Potencial
  - Esperado: Solo ve empleados de Gerencia Ventas + subdepartamentos
  - NO debe ver empleados de TI, RRHH, etc.

TEST 3 — HR_MANAGER ve todos:
  - Login como HR_MANAGER (hr@test.com)
  - Esperado: Ve TODOS los empleados de la empresa

TEST 4 — Filtros funcionales:
  - Filtro "Evaluados": muestra solo calculatedScore > 0
  - Filtro "Todos": muestra todos los 200
  - Filtro "Pendientes": evaluados sin potencial asignado
  - Filtro "Asignados": evaluados con potencial asignado

TEST 5 — Stats correctos:
  - Stats muestran totales sobre TODO el dataset, no solo la página
```

### Verificación técnica:

```bash
# Compilación limpia
npx tsc --noEmit

# Grep para verificar que accountId está en todos los WHERE
grep -rn "where.*cycleId" src/lib/services/PerformanceRatingService.ts
# Debe mostrar accountId junto a cycleId
```

---

## 📎 RESUMEN DE CAMBIOS

```yaml
ARCHIVOS A MODIFICAR:

1. src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx
   - Línea ~71: Agregar &limit=500 al fetch
   - Líneas ~124-129: Fix precedencia operadores en filtro

2. src/lib/services/PerformanceRatingService.ts
   - listRatingsForCycle: Agregar accountId obligatorio + departmentIds opcional
   - WHERE: Agregar accountId + employee.departmentId filter

3. src/app/api/admin/performance-ratings/route.ts
   - GET: Calcular departmentIds para AREA_MANAGER
   - GET: Pasar accountId y departmentIds al servicio

4. src/app/api/admin/performance-ratings/nine-box/route.ts
   - GET: Mismo patrón — accountId + filtrado departamental

5. src/app/api/performance-ratings/[id]/potential/route.ts (si existe)
   - POST: Validar accountId + scope departamental antes de permitir asignación

ARCHIVOS DE REFERENCIA (NO modificar):
- GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_1.md → Sección 4.3, 8.1
- focalizahr-ui-design-standards.md → Checklist Técnico Pre-Entrega
- src/lib/services/AuthorizationService.ts → extractUserContext, getChildDepartmentIds
```

---

## ⚠️ REGLAS INQUEBRANTABLES

1. **Auditoría PRIMERO (Parte 1) → Reportar → Luego aplicar cambios**
2. **NO crear funciones nuevas si ya existen** — usar `getChildDepartmentIds` que ya está implementado
3. **NO modificar AuthorizationService.ts** — solo CONSUMIR las funciones existentes
4. **Cambios quirúrgicos** — NO reescribir archivos completos
5. **Verificar con `npx tsc --noEmit`** después de cada parte
6. **Si algo no queda claro, PREGUNTAR antes de implementar**

---

## 📋 FORMATO REPORTE FINAL

```
=== PARTE 1: AUDITORÍA ===
[resultado de cada archivo]

=== PARTE 2: BUGS FUNCIONALES ===
Bug A (limit): [aplicado/no necesario] — [detalle]
Bug B (precedencia): [aplicado/no necesario] — [detalle]
tsc: [PASS/FAIL]

=== PARTE 3: FIX SEGURIDAD ===
3A (accountId en servicio): [aplicado] — [detalle]
3B (filtrado endpoint lista): [aplicado] — [detalle]  
3C (filtrado 9-box): [aplicado] — [detalle]
3D (validación potencial): [aplicado] — [detalle]
tsc: [PASS/FAIL]

=== PARTE 4: VERIFICACIÓN ===
[resultados de cada test]
```
