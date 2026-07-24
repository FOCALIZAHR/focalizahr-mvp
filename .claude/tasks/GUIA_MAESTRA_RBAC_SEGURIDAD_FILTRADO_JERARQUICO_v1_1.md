# 🔐 GUÍA MAESTRA: RBAC, SEGURIDAD Y FILTRADO JERÁRQUICO
## FocalizaHR Enterprise - Documento Único Consolidado
### Versión 1.1 | Enero 2025 | Estado: ✅ VALIDADO + RBAC CENTRALIZADO

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura de Seguridad](#2-arquitectura-de-seguridad)
3. [Sistema RBAC - Roles y Permisos](#3-sistema-rbac---roles-y-permisos)
4. [AuthorizationService - Código Actual](#4-authorizationservice---código-actual)
5. [Middleware JWT - Implementación](#5-middleware-jwt---implementación)
6. [Filtrado Jerárquico - CTE Recursivo](#6-filtrado-jerárquico---cte-recursivo)
7. [Ecosistema Jerárquico - 8 Gerencias](#7-ecosistema-jerárquico---8-gerencias)
8. [Patrones de Implementación](#8-patrones-de-implementación)
9. [Troubleshooting](#9-troubleshooting)
10. [Checklist de Desarrollo](#10-checklist-de-desarrollo)
11. [Archivos a Archivar](#11-archivos-a-archivar)

---

## 1. RESUMEN EJECUTIVO

### 1.1 ¿Qué es este documento?

Esta es la **ÚNICA FUENTE DE VERDAD** para todo lo relacionado con:
- Sistema de autenticación y autorización
- Roles y permisos (RBAC)
- Filtrado jerárquico por departamentos
- Seguridad multi-tenant

### 1.2 Estado Actual del Sistema

```yaml
AUTENTICACIÓN:
  Método: JWT + HttpOnly Cookies
  Archivo: src/lib/auth.ts
  Estado: ✅ IMPLEMENTADO Y FUNCIONANDO

MIDDLEWARE:
  Archivo: src/middleware.ts
  Headers inyectados: x-account-id, x-user-role, x-department-id, x-user-id
  Estado: ✅ IMPLEMENTADO Y FUNCIONANDO

AUTORIZACIÓN:
  Servicio: src/lib/services/AuthorizationService.ts
  Funciones exportadas: 
    - extractUserContext()
    - buildParticipantAccessFilter()
    - getChildDepartmentIds()
    - invalidateDepartmentCache()
    - hasPermission()          # NUEVO (Enero 2025)
    - getPermissionsForRole()  # NUEVO (Enero 2025)
  Constantes exportadas:
    - PERMISSIONS              # NUEVO (Enero 2025)
    - ALL_ROLES                # NUEVO (Enero 2025)
  Estado: ✅ IMPLEMENTADO Y FUNCIONANDO

FILTRADO JERÁRQUICO:
  Método: CTE Recursivo PostgreSQL
  Cache: LRU (15 minutos TTL)
  Estado: ✅ IMPLEMENTADO Y FUNCIONANDO
```

### 1.3 Quick Reference - Uso Inmediato

```typescript
// ✅ PATRÓN CORRECTO PARA CUALQUIER API
import { 
  extractUserContext, 
  buildParticipantAccessFilter 
} from '@/lib/services/AuthorizationService';

export async function GET(request: NextRequest) {
  // 1. Extraer contexto (viene del middleware)
  const userContext = extractUserContext(request);
  
  // 2. Validar autenticación
  if (!userContext.accountId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  // 3. Construir filtros de seguridad
  const accessFilter = await buildParticipantAccessFilter(
    userContext,
    { dataType: 'results' }  // 'participation' | 'results' | 'administrative'
  );
  
  // 4. Aplicar filtros en query
  const data = await prisma.model.findMany({
    where: {
      ...accessFilter,
      // tus filtros adicionales
    }
  });
  
  return NextResponse.json({ success: true, data });
}
```

---

## 2. ARQUITECTURA DE SEGURIDAD

### 2.1 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE SEGURIDAD                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Usuario] ──→ [Login] ──→ [JWT Cookie] ──→ [Request]                  │
│                                                │                        │
│                                                ▼                        │
│                                        ┌──────────────┐                 │
│                                        │  MIDDLEWARE  │                 │
│                                        │  Valida JWT  │                 │
│                                        │  Inyecta     │                 │
│                                        │  Headers     │                 │
│                                        └──────┬───────┘                 │
│                                               │                         │
│                     ┌─────────────────────────┼─────────────────────┐   │
│                     │                         │                     │   │
│                     ▼                         ▼                     ▼   │
│              x-account-id            x-user-role          x-department-id│
│                     │                         │                     │   │
│                     └─────────────────────────┼─────────────────────┘   │
│                                               │                         │
│                                               ▼                        │
│                                        ┌──────────────┐                │
│                                        │  API ROUTE   │                │
│                                        │  extractUser │                │
│                                        │  Context()   │                │
│                                        └──────┬───────┘                │
│                                               │                        │
│                                               ▼                        │
│                                  ┌────────────────────────┐            │
│                                  │ AuthorizationService   │            │
│                                  │ buildParticipant       │            │
│                                  │ AccessFilter()         │            │
│                                  └────────────┬───────────┘            │
│                                               │                        │
│                            ┌──────────────────┼──────────────────┐     │
│                            │                  │                  │     │
│                            ▼                  ▼                  ▼     │
│                     ┌──────────┐      ┌──────────────┐    ┌──────────┐ │
│                     │ NIVEL 1  │      │   NIVEL 2    │    │ NIVEL 3  │ │
│                     │ Multi-   │      │  Jerárquico  │    │ Contexto │ │
│                     │ tenant   │      │ (AREA_MNGR)  │    │ Plan B   │ │
│                     │ accountId│      │ departmentId │    │ dataType │ │
│                     └──────────┘      └──────────────┘    └──────────┘ │
│                            │                  │                  │     │
│                            └──────────────────┼──────────────────┘     │
│                                               │                        │
│                                               ▼                        │
│                                        ┌──────────────┐                │
│                                        │ Prisma Query │                │
│                                        │ con filtros  │                │
│                                        └──────────────┘                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Tres Capas de Seguridad

| Capa | Nombre | Aplica a | Descripción |
|------|--------|----------|-------------|
| **1** | Multi-Tenant | TODOS | `accountId` SIEMPRE en queries. Empresa A nunca ve datos de Empresa B |
| **2** | Jerárquico | AREA_MANAGER | `departmentId` + hijos. Ve solo su gerencia y departamentos subordinados |
| **3** | Plan B | AREA_MANAGER | `participation` = transparente, `results` = privado |

### 2.3 Principio Fundamental

```
"BACKEND CALCULA, FRONTEND MUESTRA"
- Toda lógica de autorización está en el servidor
- El frontend NUNCA decide qué puede ver el usuario
- Todas las queries incluyen filtros de seguridad
```

---

## 3. SISTEMA RBAC - ROLES Y PERMISOS

### 3.1 Matriz de Roles

```typescript
// Roles definidos en el sistema (enum implícito por uso)
type UserRole = 
  // SISTEMA
  | 'FOCALIZAHR_ADMIN'   // FocalizaHR team - acceso total, todas las cuentas
  
  // EMPRESA - ACCESO GLOBAL
  | 'ACCOUNT_OWNER'      // Dueño cuenta - todo en su empresa
  | 'ACCOUNT_ADMIN'      // Admin operacional - gestiona usuarios
  | 'CEO'                // Ejecutivo - solo lectura, ve toda empresa
  | 'HR_ADMIN'           // RRHH principal - gestiona campañas
  | 'HR_OPERATOR'        // RRHH operacional - ejecuta campañas
  
  // EMPRESA - ACCESO LIMITADO
  | 'AREA_MANAGER'       // Gerente área - ve solo su scope jerárquico
  | 'VIEWER'             // Solo lectura limitada
  
  // LEGACY
  | 'CLIENT';            // Account legacy (compatibilidad)
```

### 3.2 Matriz de Acceso por Rol

| Rol | Scope | Multi-Tenant | Filtro Jerárquico | Permisos |
|-----|-------|--------------|-------------------|----------|
| `FOCALIZAHR_ADMIN` | Todas las cuentas | N/A | ❌ No | CRUD total |
| `ACCOUNT_OWNER` | Su cuenta | ✅ Sí | ❌ No | CRUD total |
| `CEO` | Su cuenta | ✅ Sí | ❌ No | Solo lectura |
| `HR_ADMIN` | Su cuenta | ✅ Sí | ❌ No | CRUD campañas |
| `HR_OPERATOR` | Su cuenta | ✅ Sí | ❌ No | CRU campañas |
| `AREA_MANAGER` | Su departamento | ✅ Sí | ✅ **SÍ** | Solo lectura filtrada |
| `VIEWER` | Su cuenta | ✅ Sí | ❌ No | Solo lectura pública |

### 3.3 Permisos por Recurso

> ⚠️ **NOTA:** Esta es una vista conceptual resumida. La **matriz REAL implementada en código** 
> está en **ADDENDUM B.2** (`PERMISSIONS` en AuthorizationService.ts), que es la fuente de verdad.

```yaml
CAMPAÑAS:
  create: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_OPERATOR
  read: Todos (filtrado por rol)
  update: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_OPERATOR
  delete: FOCALIZAHR_ADMIN, ACCOUNT_OWNER

PARTICIPANTES:
  read: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_MANAGER, HR_ADMIN, HR_OPERATOR, CEO, AREA_MANAGER
  write: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_OPERATOR

ONBOARDING:
  enroll: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_OPERATOR
  enroll:batch: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN
  read: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, HR_OPERATOR, CEO, AREA_MANAGER
  journeys:read: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_OPERATOR, AREA_MANAGER

EXIT INTELLIGENCE:
  register: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER
  register:batch: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN
  records:read: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, CEO
  alerts:manage: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, AREA_MANAGER

EMPLOYEE MASTER:
  read: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, HR_OPERATOR, AREA_MANAGER
  write: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER
  sync: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER

MÉTRICAS:
  upload: ACCOUNT_OWNER, FOCALIZAHR_ADMIN

ANALYTICS/RESULTADOS:
  read: Todos (filtrado por rol y dataType)
  
ADMINISTRACIÓN:
  access: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_MANAGER
  accounts: FOCALIZAHR_ADMIN
  system:full: FOCALIZAHR_ADMIN
  
USUARIOS:
  create: FOCALIZAHR_ADMIN, ACCOUNT_OWNER
  manage: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, ACCOUNT_ADMIN
```

### 3.4 Plan B: Participación vs Resultados

```typescript
// CRÍTICO: El sistema distingue entre tipos de datos para AREA_MANAGER

// PARTICIPACIÓN = Transparente (fomenta competencia sana)
// AREA_MANAGER puede ver participación de TODA la empresa
{ dataType: 'participation' }  // ← No filtra por departamento

// RESULTADOS = Privado (protege información sensible)  
// AREA_MANAGER solo ve resultados de su gerencia
{ dataType: 'results' }  // ← SÍ filtra por departamento + hijos
```

---

## 4. AUTHORIZATIONSERVICE - CÓDIGO ACTUAL

### 4.1 Ubicación y Exports

```typescript
// Archivo: src/lib/services/AuthorizationService.ts

// EXPORTS DISPONIBLES (verificado en código):

// --- EXISTENTES ---
export interface FilterOptions {
  dataType?: 'participation' | 'results' | 'administrative';
  skipDepartmentFilter?: boolean;
}

export async function getChildDepartmentIds(parentId: string): Promise<string[]>;
export async function buildParticipantAccessFilter(userContext, options?): Promise<any>;
export function extractUserContext(request: Request): UserContext;
export function invalidateDepartmentCache(departmentId?: string): void;

// --- NUEVOS (Enero 2025) ---
export const PERMISSIONS: Record<string, readonly string[]>;
export type PermissionType = keyof typeof PERMISSIONS;
export function hasPermission(role: string | null, action: PermissionType): boolean;
export function getPermissionsForRole(role: string): PermissionType[];
export const ALL_ROLES: readonly string[];
export type RoleType = typeof ALL_ROLES[number];
```

### 4.2 Función: extractUserContext

```typescript
/**
 * Extrae contexto de seguridad desde headers HTTP
 * Headers son inyectados por el middleware
 * 
 * @param request - Request HTTP de Next.js
 * @returns Contexto del usuario con toda la información de seguridad
 */
export function extractUserContext(request: Request): {
  accountId: string;
  role: string | null;
  departmentId: string | null;
  userId: string | null;
} {
  return {
    accountId: request.headers.get('x-account-id') || '',
    role: request.headers.get('x-user-role'),
    departmentId: request.headers.get('x-department-id'),
    userId: request.headers.get('x-user-id')
  };
}
```

### 4.3 Función: buildParticipantAccessFilter

```typescript
/**
 * FUNCIÓN CRÍTICA - Construye filtros de seguridad multi-nivel
 * 
 * NIVEL 1: Multi-tenant (accountId) - SIEMPRE
 * NIVEL 2: Departamental (departmentId) - Solo AREA_MANAGER y según contexto
 * 
 * @param userContext - Contexto extraído con extractUserContext
 * @param options - Opciones de filtrado (dataType, skipDepartmentFilter)
 * @returns Objeto de filtro para usar en Prisma where clause
 */
export async function buildParticipantAccessFilter(
  userContext: {
    accountId: string;
    role: string | null;
    departmentId: string | null;
  },
  options?: FilterOptions
): Promise<any> {
  
  // Log del contexto si está presente
  if (options?.dataType) {
    debugLog(`📋 Contexto: ${options.dataType}`);
  }
  
  debugLog(`🔐 Construyendo filtros para rol: ${userContext.role}, account: ${userContext.accountId}`);
  
  // Roles con acceso global (ven toda la empresa)
  const globalRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'HR_OPERATOR', 'CEO'];
  
  // CASO 1: Roles globales - filtro por cuenta únicamente
  if (globalRoles.includes(userContext.role || '')) {
    debugLog(`✅ Acceso total para ${userContext.role} en cuenta ${userContext.accountId}`);
    return {
      campaign: { 
        accountId: userContext.accountId  // CRÍTICO: Filtro multi-tenant
      }
    };
  }
  
  // CASO 2: AREA_MANAGER - filtro por cuenta Y departamentos (CON CONTEXTO)
  if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
    
    // Plan B: Si es participación, NO filtrar por departamento
    if (options?.dataType === 'participation' || options?.skipDepartmentFilter) {
      debugLog(`📊 AREA_MANAGER en modo participación: Sin filtro departamental`);
      return {
        campaign: { 
          accountId: userContext.accountId  // Solo multi-tenant
        }
      };
    }
    
    // Para resultados o sin contexto, SÍ filtrar
    debugLog(`🏢 AREA_MANAGER: Aplicando filtros para depto ${userContext.departmentId}`);
    
    const childIds = await getChildDepartmentIds(userContext.departmentId);
    const allAllowedIds = [userContext.departmentId, ...childIds];
    
    debugLog(`✅ Puede ver ${allAllowedIds.length} departamentos en cuenta ${userContext.accountId}`);
    
    return {
      campaign: { 
        accountId: userContext.accountId  // NIVEL 1: Multi-tenant
      },
      departmentId: { 
        in: allAllowedIds  // NIVEL 2: Departamental
      }
    };
  }
  
  // CASO 3: Sin acceso (seguridad por defecto)
  debugLog(`🚫 Sin acceso: rol ${userContext.role} no reconocido`);
  return {
    campaign: { 
      accountId: userContext.accountId 
    },
    id: 'no-access-impossible-value'  // Garantiza 0 resultados
  };
}
```

### 4.4 Función: getChildDepartmentIds

```typescript
/**
 * Obtiene recursivamente todos los departamentos hijos
 * Usa CTE recursivo de PostgreSQL con cache LRU
 * 
 * @param parentId - ID del departamento padre (gerencia)
 * @returns Array de IDs de departamentos hijos
 */
export async function getChildDepartmentIds(parentId: string): Promise<string[]> {
  // Check cache primero
  if (hierarchyCache.has(parentId)) {
    debugLog(`📦 Cache hit para departamento ${parentId}`);
    return hierarchyCache.get(parentId)!;
  }
  
  debugLog(`🔍 Consultando hijos de departamento ${parentId}`);
  
  // Query recursivo con CTE
  const result = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE dept_tree AS (
      -- Nivel inicial: hijos directos
      SELECT id, 0 as depth 
      FROM departments 
      WHERE parent_id = ${parentId}
      
      UNION ALL
      
      -- Recursión: hijos de hijos
      SELECT d.id, dt.depth + 1
      FROM departments d
      JOIN dept_tree dt ON d.parent_id = dt.id
      WHERE dt.depth < 3  -- Límite de profundidad
    )
    SELECT id FROM dept_tree
  `;
  
  const ids = result.map(r => r.id);
  debugLog(`✅ Encontrados ${ids.length} departamentos hijos`);
  
  hierarchyCache.set(parentId, ids);  // Guardar en cache
  return ids;
}
```

### 4.5 Cache LRU

```typescript
// Cache para jerarquías departamentales
const hierarchyCache = new LRUCache<string, string[]>({
  max: 500,           // Máximo 500 entradas
  ttl: 1000 * 60 * 15 // TTL: 15 minutos
});

/**
 * Invalida cache cuando hay cambios en estructura organizacional
 * Llamar cuando: se crean/eliminan departamentos, se modifica parent_id
 */
export function invalidateDepartmentCache(departmentId?: string) {
  if (departmentId) {
    debugLog(`🗑️ Invalidando cache para departamento ${departmentId}`);
    hierarchyCache.delete(departmentId);
  } else {
    debugLog(`🗑️ Limpiando todo el cache de departamentos`);
    hierarchyCache.clear();
  }
}
```

---

## 5. MIDDLEWARE JWT - IMPLEMENTACIÓN

### 5.1 Ubicación y Funcionamiento

```typescript
// Archivo: src/middleware.ts

// FLUJO:
// 1. Intercepta TODAS las requests
// 2. Extrae JWT de cookie o header Authorization
// 3. Valida token
// 4. Inyecta headers de contexto
// 5. Verifica permisos para rutas admin
```

### 5.2 Headers Inyectados

| Header | Contenido | Siempre Presente |
|--------|-----------|------------------|
| `x-user-id` | ID del usuario (si es User nuevo) | Si es User |
| `x-account-id` | ID de la cuenta/empresa | ✅ Siempre |
| `x-user-role` | Rol del usuario | ✅ Siempre |
| `x-department-id` | ID departamento asignado | Solo AREA_MANAGER |
| `x-user-email` | Email del usuario | ✅ Siempre |
| `x-company-name` | Nombre de la empresa | ✅ Siempre |
| `x-effective-role` | Rol efectivo calculado | ✅ Siempre |

### 5.3 Rutas Públicas (Sin Autenticación)

```typescript
// Rutas que NO requieren autenticación
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/user/login',
  '/api/cron',
  '/',
  '/favicon.ico'
];

// Rutas con autenticación por uniqueToken (encuestas)
const dynamicPublicPatterns = [
  '/encuesta/',
  '/api/survey/',
  '/onboarding/encuesta/',
  '/api/onboarding/survey/'
];
```

### 5.4 Verificación de Roles Admin

```typescript
// Rutas que requieren roles específicos
const adminRoutes = ['/dashboard/admin', '/register'];

// Roles permitidos para rutas admin
const adminRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER'];

// Si usuario no tiene rol permitido → 403 Forbidden
```

---

## 6. FILTRADO JERÁRQUICO - CTE RECURSIVO

### 6.1 Estructura de Datos

```sql
-- Tabla departments con jerarquía
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,           -- Multi-tenant isolation
  display_name VARCHAR(255),          -- "Gerencia Comercial"
  parent_id UUID,                     -- Referencia a padre (NULL = raíz)
  unit_type VARCHAR(30),              -- 'gerencia' | 'departamento'
  level INTEGER,                      -- 2 (gerencia) | 3 (departamento)
  standard_category VARCHAR(50),      -- 'comercial', 'tecnologia', etc
  employee_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  FOREIGN KEY (parent_id) REFERENCES departments(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- ÍNDICES CRÍTICOS para performance
CREATE INDEX idx_departments_hierarchy 
  ON departments(account_id, parent_id, level);

CREATE INDEX idx_departments_category 
  ON departments(account_id, standard_category);

CREATE INDEX idx_departments_parent 
  ON departments(parent_id);
```

### 6.2 Ejemplo de Jerarquía

```
Corporación Enterprise (account)
├── Gerencia Comercial (level 2, parent_id: NULL, standard_category: 'comercial')
│   ├── Ventas Nacional (level 3, parent_id: comercial_id)
│   ├── Ventas Internacional (level 3, parent_id: comercial_id)
│   └── Marketing Digital (level 3, parent_id: comercial_id)
├── Gerencia Operaciones (level 2, parent_id: NULL, standard_category: 'operaciones')
│   ├── Producción (level 3, parent_id: operaciones_id)
│   ├── Logística (level 3, parent_id: operaciones_id)
│   └── Control Calidad (level 3, parent_id: operaciones_id)
└── Gerencia Tecnología (level 2, parent_id: NULL, standard_category: 'tecnologia')
    ├── Desarrollo (level 3, parent_id: tecnologia_id)
    ├── QA (level 3, parent_id: tecnologia_id)
    └── Soporte (level 3, parent_id: tecnologia_id)
```

### 6.3 CTE Recursivo Explicado

```sql
-- Este es el query que usa getChildDepartmentIds()
WITH RECURSIVE dept_tree AS (
  -- CASO BASE: Hijos directos del departamento padre
  SELECT id, 0 as depth 
  FROM departments 
  WHERE parent_id = '${parentId}'
  
  UNION ALL
  
  -- RECURSIÓN: Hijos de los hijos
  SELECT d.id, dt.depth + 1
  FROM departments d
  JOIN dept_tree dt ON d.parent_id = dt.id
  WHERE dt.depth < 3  -- LÍMITE: máximo 3 niveles de profundidad
)
SELECT id FROM dept_tree;

-- EJEMPLO DE RESULTADO:
-- Si parentId = 'gerencia_comercial_id'
-- Retorna: ['ventas_nacional_id', 'ventas_internacional_id', 'marketing_digital_id']
```

---

## 7. ECOSISTEMA JERÁRQUICO - 8 GERENCIAS

### 7.1 Categorías Estratégicas

```typescript
// Archivo: src/lib/services/DepartmentAdapter.ts
// FUENTE ÚNICA DE VERDAD para categorización

const gerenciaAliases = {
  'personas': [
    'rrhh', 'recursos humanos', 'personas', 'people', 'talento',
    'hr', 'capital humano', 'people & culture', 'gestión humana',
    'selección', 'reclutamiento', 'compensaciones', 'bienestar'
  ],
  'comercial': [
    'ventas', 'sales', 'comercial', 'business', 'negocios',
    'revenue', 'cuentas clave', 'retail', 'b2b', 'b2c'
  ],
  'marketing': [
    'marketing', 'mercadeo', 'marca', 'branding', 'publicidad',
    'comunicaciones', 'digital', 'growth', 'contenidos'
  ],
  'tecnologia': [
    'tecnología', 'ti', 'it', 'sistemas', 'informática',
    'desarrollo', 'dev', 'ingeniería', 'innovación', 'software'
  ],
  'operaciones': [
    'operaciones', 'ops', 'logística', 'producción', 'supply chain',
    'calidad', 'procesos', 'mantenimiento', 'manufactura'
  ],
  'finanzas': [
    'finanzas', 'contabilidad', 'tesorería', 'administración',
    'controlling', 'auditoría', 'impuestos', 'costos'
  ],
  'servicio': [
    'servicio', 'atención', 'soporte', 'customer', 'mesa ayuda',
    'postventa', 'experiencia cliente', 'call center'
  ],
  'legal': [
    'legal', 'jurídico', 'compliance', 'regulatorio', 'contratos',
    'normativo', 'fiscalización', 'riesgos'
  ]
};
```

### 7.2 Categorización Automática

```typescript
// DepartmentAdapter.getGerenciaCategory()
// Mapea nombre libre → categoría estándar

DepartmentAdapter.getGerenciaCategory("Ventas Regional")     // → "comercial"
DepartmentAdapter.getGerenciaCategory("Desarrollo Software") // → "tecnologia"
DepartmentAdapter.getGerenciaCategory("RRHH")                // → "personas"
DepartmentAdapter.getGerenciaCategory("Término Desconocido") // → null → "sin_asignar"
```

### 7.3 Departamento Paraguas

```yaml
PRINCIPIO: "Carga Tolerante"

✅ API NUNCA rechaza participantes por departamento faltante
✅ Si un término no mapea → se crea departamento "sin_asignar"
✅ Equipo Concierge revisa post-carga y reasigna manualmente
✅ 0% pérdida de datos durante carga

DEPARTAMENTO SIN_ASIGNAR:
  display_name: 'sin_asignar'
  standard_category: 'sin_asignar'
  Propósito: Contenedor temporal para revisión manual
```

---

## 8. PATRONES DE IMPLEMENTACIÓN

### 8.1 Patrón API Route Completo

```typescript
// ✅ PATRÓN CORRECTO - Usar como template

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  extractUserContext, 
  buildParticipantAccessFilter 
} from '@/lib/services/AuthorizationService';

export async function GET(request: NextRequest) {
  try {
    // ========================================
    // PASO 1: EXTRAER CONTEXTO DE SEGURIDAD
    // ========================================
    const userContext = extractUserContext(request);
    
    // Validación crítica
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado - contexto faltante' },
        { status: 401 }
      );
    }
    
    console.log(`🔐 Contexto:`, {
      accountId: userContext.accountId,
      role: userContext.role,
      departmentId: userContext.departmentId
    });
    
    // ========================================
    // PASO 2: CONSTRUIR FILTROS DE SEGURIDAD
    // ========================================
    const accessFilter = await buildParticipantAccessFilter(
      userContext,
      { dataType: 'results' }  // Elegir: 'participation' | 'results' | 'administrative'
    );
    
    // ========================================
    // PASO 3: QUERY CON FILTROS APLICADOS
    // ========================================
    const data = await prisma.model.findMany({
      where: {
        campaignId: request.nextUrl.searchParams.get('campaignId'),
        ...accessFilter  // ← CRÍTICO: Siempre incluir
      },
      include: {
        // tus includes
      }
    });
    
    // ========================================
    // PASO 4: RESPONSE
    // ========================================
    return NextResponse.json({
      success: true,
      data,
      meta: {
        filtered: userContext.role === 'AREA_MANAGER',
        count: data.length
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### 8.2 Patrón para Endpoints de Detalle

```typescript
// Para GET /api/resource/[id] - Validación individual

import { getChildDepartmentIds } from '@/lib/services/AuthorizationService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userContext = extractUserContext(request);
  
  // 1. Obtener recurso con validación multi-tenant
  const resource = await prisma.resource.findFirst({
    where: {
      id: params.id,
      accountId: userContext.accountId  // ← Multi-tenant
    },
    include: { department: true }
  });
  
  if (!resource) {
    return NextResponse.json(
      { success: false, error: 'Recurso no encontrado' },
      { status: 404 }
    );
  }
  
  // 2. Validación jerárquica para AREA_MANAGER
  if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
    const childIds = await getChildDepartmentIds(userContext.departmentId);
    const accessibleDepts = [userContext.departmentId, ...childIds];
    
    if (!accessibleDepts.includes(resource.departmentId)) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado - fuera de su ámbito' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.json({ success: true, data: resource });
}
```

### 8.3 Patrón para Acciones (PATCH/DELETE)

```typescript
// Para modificaciones - Misma validación que detalle

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userContext = extractUserContext(request);
  
  // 1. Roles permitidos para esta acción
  const allowedRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN'];
  if (!allowedRoles.includes(userContext.role || '')) {
    return NextResponse.json(
      { success: false, error: 'Sin permisos para esta acción' },
      { status: 403 }
    );
  }
  
  // 2. Obtener recurso con multi-tenant
  const resource = await prisma.resource.findFirst({
    where: {
      id: params.id,
      accountId: userContext.accountId
    }
  });
  
  if (!resource) {
    return NextResponse.json(
      { success: false, error: 'Recurso no encontrado' },
      { status: 404 }
    );
  }
  
  // 3. Actualizar
  const body = await request.json();
  const updated = await prisma.resource.update({
    where: { id: params.id },
    data: body
  });
  
  return NextResponse.json({ success: true, data: updated });
}
```

```typescript
// ═══════════════════════════════════════════════════════════════
// ALTERNATIVA: Usar hasPermission() (recomendado para nuevos endpoints)
// ═══════════════════════════════════════════════════════════════
import { hasPermission, extractUserContext } from '@/lib/services/AuthorizationService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userContext = extractUserContext(request);
  
  // Validación centralizada en lugar de array hardcodeado
  if (!hasPermission(userContext.role, 'participants:write')) {
    return NextResponse.json(
      { success: false, error: 'Sin permisos para esta acción' },
      { status: 403 }
    );
  }
  
  // ... resto del código igual
}
```

### 8.4 Cuándo Usar Cada dataType

```typescript
// GUÍA PARA ELEGIR dataType

{ dataType: 'participation' }
// ✅ Usar cuando:
//    - Mostrando tasas de participación
//    - Dashboard de estado de campaña
//    - Métricas de respuesta (sin contenido)
//    - Ranking de participación entre áreas
// EFECTO: AREA_MANAGER ve participación de TODA la empresa

{ dataType: 'results' }
// ✅ Usar cuando:
//    - Mostrando respuestas/scores
//    - Analytics con datos sensibles
//    - Alertas y predicciones
//    - Insights individuales
// EFECTO: AREA_MANAGER ve SOLO su gerencia + hijos

{ dataType: 'administrative' }
// ✅ Usar cuando:
//    - Gestión de participantes
//    - Configuración de estructura
//    - Operaciones administrativas
// EFECTO: Similar a 'results'
```

---

## 9. TROUBLESHOOTING

### 9.1 Error: "No autorizado - contexto faltante"

**Causa:** Headers de contexto no llegan a la API

**Solución:**
```typescript
// 1. Verificar que middleware está activo
// Archivo: src/middleware.ts debe existir

// 2. Verificar matcher incluye tu ruta
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// 3. Debug en tu API:
console.log('Headers:', {
  accountId: request.headers.get('x-account-id'),
  role: request.headers.get('x-user-role'),
  departmentId: request.headers.get('x-department-id')
});
```

### 9.2 Error: "Empresa A ve datos de Empresa B"

**Causa:** Filtro multi-tenant no aplicado

**Solución:**
```typescript
// ❌ INCORRECTO
const data = await prisma.model.findMany({
  where: { campaignId }
});

// ✅ CORRECTO
const accessFilter = await buildParticipantAccessFilter(userContext);
const data = await prisma.model.findMany({
  where: {
    campaignId,
    ...accessFilter  // ← CRÍTICO
  }
});
```

### 9.3 Error: "AREA_MANAGER ve toda la empresa"

**Causa:** Falta especificar dataType o filtro mal aplicado

**Solución:**
```typescript
// ✅ Especificar dataType para resultados
const accessFilter = await buildParticipantAccessFilter(
  userContext,
  { dataType: 'results' }  // ← IMPORTANTE
);

// Verificar logs:
// Debe mostrar: "🏢 AREA_MANAGER: Aplicando filtros para depto..."
// NO debe mostrar: "📊 AREA_MANAGER en modo participación..."
```

### 9.4 Error: "Performance lento con 1000+ participantes"

**Solución:**
```sql
-- 1. Verificar índices existen
SELECT indexname FROM pg_indexes 
WHERE tablename = 'departments';

-- 2. Crear si faltan
CREATE INDEX IF NOT EXISTS idx_departments_hierarchy 
  ON departments(account_id, parent_id, level);

CREATE INDEX IF NOT EXISTS idx_participants_campaign_dept 
  ON participants(campaign_id, department_id);
```

```typescript
// 3. Usar paginación
const data = await prisma.model.findMany({
  where: { ...accessFilter },
  take: 100,    // Límite por página
  skip: offset, // Offset para paginación
  orderBy: { createdAt: 'desc' }
});
```

### 9.5 Error: "hierarchicalData siempre null"

**Causa:** No hay jerarquía configurada para la empresa

**Verificación:**
```sql
-- Verificar que empresa tiene jerarquía
SELECT COUNT(*) FROM departments 
WHERE account_id = 'tu_account_id' 
  AND parent_id IS NOT NULL;

-- Si resultado es 0 → empresa no tiene jerarquía configurada
-- Usar AggregationService.hasHierarchy(accountId) para verificar
```

---

## 10. CHECKLIST DE DESARROLLO

### 10.1 Antes de Crear Nueva API

```markdown
□ ¿Importé extractUserContext de AuthorizationService?
□ ¿Importé buildParticipantAccessFilter de AuthorizationService?
□ ¿Valido que userContext.accountId existe (401 si no)?
□ ¿Determiné el dataType correcto? (participation/results)
□ ¿Aplico accessFilter en TODAS las queries a BD?
□ ¿Manejo errores con try/catch?
□ ¿Tengo logs para debugging?
```

### 10.2 Antes de Crear Endpoint de Detalle/Acción

```markdown
□ ¿Valido multi-tenant en la query inicial?
□ ¿Para AREA_MANAGER, valido jerarquía explícitamente?
□ ¿Uso getChildDepartmentIds para obtener departamentos accesibles?
□ ¿Retorno 403 si el recurso está fuera del ámbito del usuario?
□ ¿Valido roles permitidos para acciones de escritura?
```

### 10.3 Antes de Deploy

```markdown
□ ¿Probé con usuario FOCALIZAHR_ADMIN? (debe ver todo)
□ ¿Probé con usuario ACCOUNT_OWNER? (debe ver toda su empresa)
□ ¿Probé con usuario AREA_MANAGER? (debe ver solo su gerencia)
□ ¿Probé con usuario de OTRA empresa? (no debe ver nada)
□ ¿Verifiqué logs de seguridad en desarrollo?
□ ¿Los índices de BD están creados?
```

---

## 11. ARCHIVOS A ARCHIVAR

### 11.1 Archivos que Este Documento Reemplaza

Los siguientes archivos contienen información que ahora está consolidada en esta guía y pueden ser **movidos a una carpeta `/docs/archive/`**:

| Archivo | Razón para Archivar |
|---------|---------------------|
| `Plan_de_Implementación_RBAC___Jerarquías_-_FocalizaHR_Enterprise.md` | Era plan, ya ejecutado |
| `DÍA_4__Plan_Completo_Filtrado_Jerárquico_-_FocalizaHR.md` | Era plan de 1 día, ya ejecutado |
| `Plan_de_Implementación_-_Estructura_Organizacional_Jerárquica_FocalizaHR.md` | Duplicado, ya ejecutado |
| `Plan_de_Implementación__Estructura_Jerárquica_FocalizaHR.md` | Duplicado, ya ejecutado |
| `PLAN_COMPLETO_FILTRADO_JERARQUICO.md` | Duplicado de DÍA_4 |
| `PROMPT_OPTIMIZADO_-_Implementación_User_Multi-Tenant_FocalizaHR.md` | Era prompt, ya ejecutado |
| `Documentación_Completa_-_Sistema_de_Seguridad_FocalizaHR.md` | Incompleto, fusionado aquí |

### 11.2 Archivos que PERMANECEN como Referencia Complementaria

| Archivo | Razón para Mantener |
|---------|---------------------|
| `Documentación_Sistema_AuthorizationService_-_FocalizaHR.md` | Detalle técnico específico del servicio |
| `GUIA_MAESTRA_DESARROLLO_PAGINAS_FILTRADAS_JERARQUICAS.md` | Guía completa de desarrollo con ejemplos |
| `Guía_Maestra_Consolidada_-_Ecosistema_Jerárquico_FocalizaHR.md` | Detalle del ecosistema de 8 gerencias |
| `Implementación_Jerarquía_Gerencias_-_Documentación_Técnica_v2_0_md.md` | Inteligencia predictiva v2.0 |

### 11.3 Archivos de Código Fuente (No tocar)

```
src/lib/services/AuthorizationService.ts  ← CRÍTICO
src/lib/services/DepartmentAdapter.ts     ← CRÍTICO
src/lib/services/AggregationService.ts    ← CRÍTICO
src/middleware.ts                          ← CRÍTICO
src/lib/auth.ts                           ← CRÍTICO
```

---

## 📋 RESUMEN FINAL

### Lo que Debes Recordar

1. **SIEMPRE** usar `extractUserContext()` + `buildParticipantAccessFilter()`
2. **SIEMPRE** incluir `accessFilter` en queries a BD
3. **SIEMPRE** especificar `dataType` para comportamiento correcto
4. **NUNCA** confiar en el frontend para seguridad
5. **NUNCA** omitir filtro multi-tenant (accountId)

### Servicios Clave

| Servicio | Ubicación | Propósito |
|----------|-----------|-----------|
| `AuthorizationService` | `src/lib/services/` | Seguridad y filtrado |
| `DepartmentAdapter` | `src/lib/services/` | Categorización departamentos |
| `AggregationService` | `src/lib/services/` | Cálculos jerárquicos |

### Imports Frecuentes

```typescript
// Para seguridad
import { 
  extractUserContext, 
  buildParticipantAccessFilter,
  getChildDepartmentIds,
  invalidateDepartmentCache
} from '@/lib/services/AuthorizationService';

// Para categorización
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

// Para agregaciones jerárquicas
import { AggregationService } from '@/lib/services/AggregationService';
```

---

## ADDENDUM A: MODELO USER Y AUTENTICACIÓN DUAL

### A.1 Schema Prisma - Modelo User

```prisma
// TABLA: USERS - Sistema Multi-usuario
model User {
  id           String   @id @default(cuid())
  accountId    String   @map("account_id")
  email        String   @unique
  name         String
  passwordHash String   @map("password_hash")
  
  // Sistema de roles
  role         String   @default("VIEWER") 
  departmentId String?  @map("department_id") // NULL = acceso total
  
  // Control y auditoría
  isActive     Boolean  @default(true) @map("is_active")
  lastLoginAt  DateTime? @map("last_login_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  // Relaciones
  account      Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  department   Department? @relation(fields: [departmentId], references: [id])
  
  @@index([accountId])
  @@index([email])
  @@map("users")
}
```

### A.2 Login Dual - Endpoints

```yaml
LOGIN ACCOUNT (Legacy):
  Endpoint: POST /api/auth/login
  Propósito: Login para cuentas Account existentes
  Cookie: focalizahr_token

LOGIN USER (Multi-usuario):
  Endpoint: POST /api/auth/user/login
  Propósito: Login para usuarios User nuevos
  Cookie: focalizahr_token (mismo nombre, diferente payload)

JWT PAYLOAD DIFERENCIADO:
  Account Login:
    - id (accountId)
    - adminEmail
    - adminName
    - companyName
    - role (FOCALIZAHR_ADMIN | CLIENT)
    
  User Login:
    - userId
    - userEmail
    - userName
    - userRole (ACCOUNT_OWNER | HR_MANAGER | AREA_MANAGER | etc)
    - departmentId
    - accountId (referencia a empresa)
    - companyName
```

### A.3 Script Migración Account → User

```typescript
// scripts/migrate-accounts-to-users.ts
async function migrateAccountsToUsers() {
  const accounts = await prisma.account.findMany();
  
  for (const account of accounts) {
    const existingUser = await prisma.user.findUnique({
      where: { email: account.adminEmail }
    });
    
    if (!existingUser) {
      await prisma.user.create({
        data: {
          accountId: account.id,
          email: account.adminEmail,
          name: account.adminName,
          passwordHash: account.passwordHash,
          role: account.role === 'FOCALIZAHR_ADMIN' 
            ? 'FOCALIZAHR_ADMIN' 
            : 'ACCOUNT_OWNER',
          departmentId: null, // Owners ven todo
          isActive: true
        }
      });
    }
  }
}
```

---

## ADDENDUM B: SISTEMA DE PERMISOS CENTRALIZADO

### B.1 Estado de Implementación

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| `PERMISSIONS` | ✅ IMPLEMENTADO (Enero 2025) | `AuthorizationService.ts` |
| `hasPermission()` | ✅ IMPLEMENTADO (Enero 2025) | `AuthorizationService.ts` |
| `getPermissionsForRole()` | ✅ IMPLEMENTADO (Enero 2025) | `AuthorizationService.ts` |
| `config/permissions.ts` | ❌ NO EXISTE | N/A - Todo está en AuthorizationService |

### B.2 Matriz PERMISSIONS (Código Real)

```typescript
// src/lib/services/AuthorizationService.ts

export const PERMISSIONS = {
  // PARTICIPANTES
  'participants:read': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN',
    'HR_OPERATOR', 'CEO', 'AREA_MANAGER'
  ],
  'participants:write': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_OPERATOR'
  ],
  
  // MÉTRICAS
  'metrics:upload': ['ACCOUNT_OWNER', 'FOCALIZAHR_ADMIN'],
  
  // ONBOARDING
  'onboarding:enroll': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_OPERATOR'
  ],
  'onboarding:enroll:batch': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN'
  ],
  'onboarding:read': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER',
    'HR_OPERATOR', 'CEO', 'AREA_MANAGER'
  ],
  'onboarding:journeys:read': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_OPERATOR', 'AREA_MANAGER'
  ],
  
  // EXIT INTELLIGENCE
  'exit:register': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'
  ],
  'exit:register:batch': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN'
  ],
  'exit:records:read': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'CEO'
  ],
  'exit:alerts:manage': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'AREA_MANAGER'
  ],
  
  // ADMINISTRACIÓN
  'admin:access': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER'],
  'admin:accounts': ['FOCALIZAHR_ADMIN'],
  'system:full': ['FOCALIZAHR_ADMIN'],
  
  // EMPLOYEE MASTER (futuro)
  'employees:read': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER',
    'HR_OPERATOR', 'AREA_MANAGER'
  ],
  'employees:write': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'
  ],
  'employees:sync': [
    'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'
  ],
} as const;
```

### B.3 Función hasPermission

```typescript
/**
 * Valida si un rol tiene permiso para ejecutar una acción.
 * 
 * @param role - Rol del usuario (puede ser null)
 * @param action - Acción a validar (type-safe)
 * @returns boolean
 */
export function hasPermission(role: string | null, action: PermissionType): boolean {
  if (!role) return false;
  const allowedRoles = PERMISSIONS[action];
  if (!allowedRoles) return false;
  return (allowedRoles as readonly string[]).includes(role);
}
```

### B.4 Uso en Endpoints

```typescript
// ═══════════════════════════════════════════════════════════════
// PATRÓN RECOMENDADO (nuevos endpoints)
// ═══════════════════════════════════════════════════════════════
import { hasPermission, extractUserContext } from '@/lib/services/AuthorizationService';

export async function POST(request: NextRequest) {
  const userContext = extractUserContext(request);
  
  if (!hasPermission(userContext.role, 'employees:sync')) {
    return NextResponse.json(
      { error: 'Sin permisos para sincronizar empleados' },
      { status: 403 }
    );
  }
  
  // ... lógica del endpoint
}

// ═══════════════════════════════════════════════════════════════
// PATRÓN LEGACY (endpoints existentes - SIGUEN FUNCIONANDO)
// ═══════════════════════════════════════════════════════════════
const allowedRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN'];
if (!allowedRoles.includes(userContext.role || '')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### B.5 Constante ALL_ROLES

```typescript
export const ALL_ROLES = [
  'FOCALIZAHR_ADMIN',   // Sistema FocalizaHR (super admin)
  'ACCOUNT_OWNER',      // Dueño de la cuenta/empresa
  'HR_ADMIN',           // RRHH principal
  'HR_MANAGER',         // Jefe RRHH
  'HR_OPERATOR',        // RRHH operacional
  'CEO',                // Ejecutivo (solo lectura)
  'AREA_MANAGER',       // Gerente de área (filtrado jerárquico)
  'VIEWER',             // Solo lectura limitada (FUTURO)
  'CLIENT',             // Legacy (default en middleware)
] as const;
```

### B.6 Roles: Estado de Implementación

| Rol | Estado | Uso Actual |
|-----|--------|------------|
| `FOCALIZAHR_ADMIN` | ✅ Activo | Super admin, acceso total |
| `ACCOUNT_OWNER` | ✅ Activo | Dueño empresa, CRUD total en su cuenta |
| `HR_ADMIN` | ✅ Activo | RRHH principal |
| `HR_MANAGER` | ✅ Activo | Jefe RRHH (similar a HR_ADMIN) |
| `HR_OPERATOR` | ✅ Activo | RRHH operacional |
| `CEO` | ✅ Activo | Solo lectura ejecutiva |
| `AREA_MANAGER` | ✅ Activo | Filtrado jerárquico |
| `CLIENT` | ✅ Legacy | Compatibilidad con Account antiguo |
| `ACCOUNT_ADMIN` | 🔮 Futuro | Planificado para gestión de usuarios |
| `VIEWER` | 🔮 Futuro | Planificado para acceso limitado |
| `DIRECTOR` | 🔮 Futuro | Planificado para nivel directivo |

### B.7 Migración de Endpoints

**Estrategia:** Migración gradual post-lanzamiento

| Fase | Acción | Estado |
|------|--------|--------|
| 1 | Implementar PERMISSIONS y hasPermission() | ✅ Completado |
| 2 | Nuevos endpoints usan hasPermission() | 🔄 En progreso |
| 3 | Migrar endpoints existentes (sprint dedicado) | 📅 Post-lanzamiento |
| 4 | Eliminar arrays hardcodeados | 📅 Post-lanzamiento |

### B.8 Nota sobre config/permissions.ts

> ⚠️ **IMPORTANTE:** El archivo `config/permissions.ts` mencionado en versiones anteriores de esta guía **NO EXISTE**. 
> Todo el sistema de permisos está centralizado en `src/lib/services/AuthorizationService.ts`.

---

## ADDENDUM B.9 — Deuda vínculo Employee↔User (35 sitios)

Detalle completo y etapas en `.claude/tasks/ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md`.
Regla vigente desde ahora para código nuevo:

Ningún endpoint nuevo agrega `prisma.employee.findFirst({email: userEmail})`.
Usar `userContext.employeeId` (extractUserContext). Si aún no existe el
vínculo o el usuario cae en el caso ejecutivo/holding sin Employee, manejar
el `null` explícito — no agregar otro lookup por email.

**Estado: Etapa 1 no iniciada — no tratar como resuelto.**

---

## ADDENDUM C: AUDITORÍA Y COMPLIANCE

### C.1 Modelo AuditLog

```prisma
model AuditLog {
  id              String    @id @default(cuid())
  userId          String
  accountId       String
  
  // QUÉ HIZO
  action          String    // 'create', 'read', 'update', 'delete', 'login', 'logout'
  resource        String    // 'campaign', 'participant', 'alert', 'user', 'session'
  resourceId      String?
  
  // CONTEXTO
  changes         Json?     // Diff de cambios (antes/después)
  metadata        Json?     // Info adicional
  
  // TRACKING
  ipAddress       String?
  userAgent       String?
  timestamp       DateTime  @default(now())
  
  user            User      @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([accountId])
  @@index([timestamp])
  @@index([action, resource])
  @@map("audit_logs")
}
```

### C.2 Servicio de Auditoría

```typescript
// services/AuditService.ts
export class AuditService {
  static async log(data: {
    userId: string;
    accountId: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout';
    resource: string;
    resourceId?: string;
    changes?: object;
    metadata?: object;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await prisma.auditLog.create({
      data: {
        ...data,
        timestamp: new Date()
      }
    });
  }
  
  // Para reportes de compliance
  static async getAuditReport(accountId: string, dateRange: { from: Date; to: Date }) {
    return await prisma.auditLog.findMany({
      where: {
        accountId,
        timestamp: {
          gte: dateRange.from,
          lte: dateRange.to
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }
}
```

### C.3 Checklist Compliance

```yaml
SEGURIDAD:
  ✅ Tokens JWT expiran (7 días default)
  ✅ Passwords hasheados con bcrypt (12 rounds)
  ✅ Rate limiting en login (recomendado implementar)
  ✅ SQL injection prevenido (Prisma ORM)
  ✅ XSS prevenido (sanitización)
  ✅ CSRF protection (SameSite cookies)

GDPR:
  ✅ Derecho al olvido (delete cascade en User)
  ✅ Exportación de datos (audit logs)
  ✅ Consentimiento explícito (terms acceptance)
  ⬜ Data portability endpoint

SOC2:
  ✅ Logs de auditoría completos
  ✅ Control de acceso basado en roles
  ✅ Encriptación en tránsito (HTTPS)
  ⬜ Encriptación en reposo (Supabase config)
  ⬜ Backup verification
```

---

## ADDENDUM D: ISSUES DE SEGURIDAD CONOCIDOS Y FIXES

### D.1 Issue: GET /api/onboarding/journeys/[id]

**Problema Detectado:**
```typescript
// ❌ CÓDIGO PROBLEMÁTICO
if (userRole === 'AREA_MANAGER') {
  if (userDepartmentId === journeyDepartmentId) {  // Comparación directa
    return { allowed: true };
  }
  return { allowed: false };  // NO considera hijos
}
```

**Escenario que Falla:**
```
Jerarquía:
  └── Comercial (dept-comercial) ← AREA_MANAGER asignado
      ├── Ventas (dept-ventas)
      └── Marketing (dept-marketing)

Usuario: AREA_MANAGER dept-comercial
Journey: departmentId = "dept-ventas"

Resultado ACTUAL: ❌ 403 Forbidden (INCORRECTO)
Resultado ESPERADO: ✅ 200 OK (Ventas es hijo de Comercial)
```

**Fix Requerido:**
```typescript
// ✅ CÓDIGO CORREGIDO
import { getChildDepartmentIds } from '@/lib/services/AuthorizationService';

if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
  const childIds = await getChildDepartmentIds(userContext.departmentId);
  const accessibleDepts = [userContext.departmentId, ...childIds];
  
  if (!accessibleDepts.includes(journey.departmentId)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }
}
```

### D.2 Issue: PATCH /api/onboarding/alerts/[id]

**Problema Detectado:**
```typescript
// ❌ CÓDIGO PROBLEMÁTICO
const existingAlert = await prisma.journeyAlert.findFirst({
  where: {
    id,
    accountId: userContext.accountId  // ✅ Multi-tenant OK
    // ❌ NO valida departmentId del journey
  }
});
// Permite acknowledge/resolve sin verificar jerarquía
```

**Vulnerabilidad:**
- AREA_MANAGER de Comercial puede gestionar alertas de Tecnología (INCORRECTO)

**Fix Requerido:**
```typescript
// ✅ CÓDIGO CORREGIDO
const existingAlert = await prisma.journeyAlert.findFirst({
  where: {
    id,
    accountId: userContext.accountId
  },
  include: {
    journey: {
      select: { departmentId: true }
    }
  }
});

// Validar jerarquía para AREA_MANAGER
if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
  const childIds = await getChildDepartmentIds(userContext.departmentId);
  const accessibleDepts = [userContext.departmentId, ...childIds];
  
  if (!accessibleDepts.includes(existingAlert.journey.departmentId)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
}
```

### D.3 Tests de Validación

```bash
# Test 1: Journey de departamento hijo (debe permitir)
curl -X GET http://localhost:3000/api/onboarding/journeys/journey_123 \
  -H "Cookie: focalizahr_token=..." \
  -H "x-user-role: AREA_MANAGER" \
  -H "x-department-id: dept-comercial"
# Esperado: 200 OK (si journey es de dept hijo)

# Test 2: Gestionar alerta de otra gerencia (debe denegar)
curl -X PATCH http://localhost:3000/api/onboarding/alerts/alert_456 \
  -H "Cookie: focalizahr_token=..." \
  -H "x-user-role: AREA_MANAGER" \
  -H "x-department-id: dept-comercial" \
  -d '{"action": "acknowledge"}'
# Esperado: 403 Forbidden (si alerta es de Tecnología)
```

---

## ADDENDUM E: AGGREGATION SERVICE Y JERARQUÍAS

### E.1 Servicio de Agregación Jerárquica

```typescript
// src/lib/services/AggregationService.ts

export class AggregationService {
  /**
   * Obtiene scores jerárquicos usando CTE recursivo
   * Calcula promedios ponderados por número de participantes
   */
  static async getHierarchicalScores(campaignId: string, accountId: string) {
    const query = `
      WITH RECURSIVE unit_scores AS (
        -- Base: Departamentos con scores directos
        SELECT 
          d.id,
          d.parent_id,
          d.display_name,
          d.unit_type,
          d.level,
          AVG(r.score) AS weighted_score,
          COUNT(DISTINCT p.id)::FLOAT AS participant_count
        FROM departments d
        LEFT JOIN participants p ON d.id = p.department_id
        LEFT JOIN responses r ON p.id = r.participant_id
        WHERE d.account_id = $2
          AND (p.campaign_id = $1 OR p.campaign_id IS NULL)
        GROUP BY d.id, d.parent_id, d.display_name, d.unit_type, d.level
        
        UNION ALL
        
        -- Recursivo: Agregación hacia gerencias (promedio ponderado)
        SELECT
          parent.id,
          parent.parent_id,
          parent.display_name,
          parent.unit_type,
          parent.level,
          CASE 
            WHEN SUM(child.participant_count) > 0 THEN
              SUM(child.weighted_score * child.participant_count) / SUM(child.participant_count)
            ELSE 0
          END AS weighted_score,
          SUM(child.participant_count) AS participant_count
        FROM departments parent
        JOIN unit_scores child ON parent.id = child.parent_id
        WHERE parent.account_id = $2
        GROUP BY parent.id, parent.parent_id, parent.display_name, parent.unit_type, parent.level
      )
      SELECT 
        id,
        parent_id,
        display_name,
        unit_type,
        level,
        ROUND(weighted_score::numeric, 2) as score,
        participant_count::INTEGER as participants
      FROM unit_scores
      ORDER BY level, display_name;
    `;
    
    return await prisma.$queryRaw(query, campaignId, accountId);
  }

  /**
   * Construye árbol jerárquico desde lista plana
   */
  static buildHierarchyTree(flatList: any[]) {
    const map = new Map();
    const roots: any[] = [];
    
    // Primera pasada: crear nodos
    flatList.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });
    
    // Segunda pasada: establecer relaciones padre-hijo
    flatList.forEach(item => {
      const node = map.get(item.id);
      if (item.parent_id) {
        const parent = map.get(item.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });
    
    return roots;
  }

  /**
   * Detecta si la empresa tiene jerarquía configurada
   */
  static async hasHierarchy(accountId: string): Promise<boolean> {
    const count = await prisma.department.count({
      where: {
        accountId,
        parentId: { not: null }
      }
    });
    return count > 0;
  }
}
```

### E.2 Integración con DepartmentAdapter

```typescript
// Agregar a DepartmentAdapter.ts
export class DepartmentAdapter {
  /**
   * Enriquece analytics con jerarquía si está configurada
   */
  static async enrichWithHierarchy(
    analytics: any,
    campaignId: string,
    accountId: string
  ) {
    const hasHierarchy = await AggregationService.hasHierarchy(accountId);
    
    if (!hasHierarchy) {
      return analytics; // Sin cambios si no hay jerarquía
    }
    
    const hierarchicalScores = await AggregationService.getHierarchicalScores(
      campaignId,
      accountId
    );
    
    const hierarchyTree = AggregationService.buildHierarchyTree(hierarchicalScores);
    
    return {
      ...analytics,
      hasHierarchy: true,
      hierarchicalData: hierarchyTree,
      defaultView: 'gerencia' // Vista por defecto para empresas con jerarquía
    };
  }
}
```

---

## ADDENDUM F: USUARIOS DE PRUEBA

### F.1 Credenciales de Testing

```yaml
USUARIOS SISTEMA:
  admin@focalizahr.com:
    password: Admin@FocalizaHR2025
    role: FOCALIZAHR_ADMIN
    scope: Todas las cuentas

USUARIOS EMPRESA TEST:
  cliente@empresa.com:
    password: Cliente@123
    role: CLIENT (Account legacy)
    scope: Su empresa

  ceo@test.com:
    password: Test123!
    role: CEO
    scope: Ve toda su empresa (read-only)

  hr@test.com:
    password: Test123!
    role: HR_MANAGER
    scope: Ve toda su empresa (CRUD campañas)

  ventas@test.com:
    password: Test123!
    role: AREA_MANAGER
    departmentId: id-depto-ventas
    scope: Solo ve Gerencia Ventas + hijos
```

### F.2 Script Crear Usuarios de Prueba

```typescript
// scripts/create-test-users.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  const account = await prisma.account.findFirst();
  if (!account) {
    console.error('❌ No hay cuentas. Crear una primero.');
    return;
  }
  
  const ventasDept = await prisma.department.findFirst({
    where: { 
      accountId: account.id,
      standardCategory: 'comercial'
    }
  });
  
  const passwordHash = await bcrypt.hash('Test123!', 12);
  
  // CEO - Ve todo
  await prisma.user.upsert({
    where: { email: 'ceo@test.com' },
    update: {},
    create: {
      accountId: account.id,
      email: 'ceo@test.com',
      name: 'CEO Test',
      passwordHash,
      role: 'CEO',
      departmentId: null,
      isActive: true
    }
  });
  
  // HR Manager - Ve todo
  await prisma.user.upsert({
    where: { email: 'hr@test.com' },
    update: {},
    create: {
      accountId: account.id,
      email: 'hr@test.com',
      name: 'HR Manager Test',
      passwordHash,
      role: 'HR_MANAGER',
      departmentId: null,
      isActive: true
    }
  });
  
  // Gerente Área - Solo su departamento
  if (ventasDept) {
    await prisma.user.upsert({
      where: { email: 'ventas@test.com' },
      update: {},
      create: {
        accountId: account.id,
        email: 'ventas@test.com',
        name: 'Gerente Ventas',
        passwordHash,
        role: 'AREA_MANAGER',
        departmentId: ventasDept.id,
        isActive: true
      }
    });
  }
  
  console.log('✅ Usuarios de prueba creados');
}

createTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## ADDENDUM G: CONFIGURACIÓN COOKIES Y SESIONES

### G.1 Cookie HttpOnly Segura

```typescript
// Configuración recomendada para producción
response.cookies.set({
  name: 'focalizahr_token',
  value: token,
  httpOnly: true,                    // No accesible desde JavaScript
  secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
  sameSite: 'strict',                // Protección CSRF
  maxAge: 60 * 60 * 24 * 7,          // 7 días
  path: '/'                          // Disponible en todo el sitio
});
```

### G.2 Modelo Session (Opcional para Control Avanzado)

```prisma
model Session {
  id              String    @id @default(cuid())
  userId          String
  token           String    @unique
  ipAddress       String?
  userAgent       String?
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
  
  user            User      @relation(fields: [userId], references: [id])
  
  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}
```

### G.3 Verificación de Sesión Extendida

```typescript
// Para implementar sesiones con tracking
class SessionService {
  static async createSession(userId: string, request: Request) {
    const token = generateSecureToken();
    
    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt: addDays(new Date(), 7),
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent')
      }
    });
    
    return token;
  }
  
  static async validateSession(token: string): Promise<User | null> {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });
    
    if (!session || session.expiresAt < new Date()) {
      return null;
    }
    
    return session.user;
  }
  
  static async revokeAllSessions(userId: string) {
    await prisma.session.deleteMany({
      where: { userId }
    });
  }
}
```

---

**FIN DE LA GUÍA MAESTRA**

```yaml
Documento: GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_0.md
Versión: 1.0 + Addendums A-G
Fecha: Diciembre 2025
Estado: ✅ VALIDADO CONTRA CÓDIGO + CONSOLIDACIÓN COMPLETA
Autor: Consolidación automática desde documentación existente
Archivos Consolidados: 8 documentos fuente
Próxima Revisión: Cuando haya cambios en AuthorizationService
```

---

> **NOTA IMPORTANTE:** Este documento es la ÚNICA fuente de verdad para seguridad y filtrado jerárquico. 
> Si encuentras información contradictoria en otros documentos, **este documento tiene prioridad**.
> Actualiza este documento si haces cambios en el código de seguridad.

---

## ÍNDICE DE ARCHIVOS CONSOLIDADOS

Los siguientes archivos fueron revisados y su información única fue incorporada a esta guía:

| Archivo Original | Sección Destino | Info Incorporada |
|------------------|-----------------|------------------|
| `Plan_de_Implementación_RBAC___Jerarquías_-_FocalizaHR_Enterprise.md` | Addendum B, C | Permisos granulares, AuditLog, Compliance |
| `Documentación_Completa_-_Sistema_de_Seguridad_FocalizaHR.md` | Addendum F, G | Usuarios prueba, Cookies config |
| `PROMPT_OPTIMIZADO_-_Implementación_User_Multi-Tenant_FocalizaHR.md` | Addendum A | Schema User, Login dual, Migración |
| `DÍA_4__Plan_Completo_Filtrado_Jerárquico_-_FocalizaHR.md` | Sección 4, Addendum F | AuthorizationService base, Scripts prueba |
| `PLAN_COMPLETO_FILTRADO_JERARQUICO.md` | Addendum D | Issues seguridad Onboarding, Fixes específicos |
| `Plan_de_Implementación_-_Estructura_Organizacional_Jerárquica_FocalizaHR.md` | Addendum E | AggregationService, buildHierarchyTree |
| `Plan_de_Implementación__Estructura_Jerárquica_FocalizaHR.md` | Addendum E, Sección 7 | CTE completo, LevelSelector |

**TODOS estos archivos pueden ser archivados/eliminados** ya que su información relevante está consolidada aquí.
