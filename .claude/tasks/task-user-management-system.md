# 🎯 TASK: Sistema de Gestión de Usuarios FocalizaHR

## 📋 RESUMEN EJECUTIVO

**Objetivo:** Implementar sistema completo de creación y mantenimiento de usuarios multi-tenant para FocalizaHR.

**Contexto:** El modelo `User` ya existe en Prisma. Falta la UI y APIs para gestionar usuarios desde el panel administrativo.

**Patrón a seguir:** Dual Admin/Cliente (ya implementado en sistema de métricas departamentales).

---

## ✅ LO QUE YA EXISTE (NO CREAR)

```yaml
MODELO PRISMA (prisma/schema.prisma):
  model User {
    id           String    @id @default(cuid())
    accountId    String    @map("account_id")
    email        String    @unique
    name         String
    passwordHash String    @map("password_hash")
    role         String    @default("VIEWER")
    departmentId String?   @map("department_id")
    isActive     Boolean   @default(true)
    lastLoginAt  DateTime?
    createdAt    DateTime  @default(now())
    updatedAt    DateTime  @updatedAt
    
    account      Account    @relation(...)
    department   Department? @relation(...)
  }

COMPONENTE SELECTOR:
  src/components/admin/AccountSelector.tsx
  - Dropdown empresas activas
  - SOLO visible para FOCALIZAHR_ADMIN
  - Ya usado en métricas departamentales

ROLES CENTRALIZADOS:
  src/lib/services/AuthorizationService.ts
  - ALL_ROLES: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, 
               HR_OPERATOR, CEO, AREA_MANAGER, EVALUATOR, VIEWER, CLIENT
  - hasPermission(), extractUserContext()

SCRIPT REFERENCIA:
  scripts/create-test-users.ts
  - Lógica de creación con bcrypt
  - Patrón upsert por email
```

---

## 🚀 LO QUE DEBES CREAR

### 1. APIs Backend

#### POST /api/admin/users - Crear usuario
```
Ubicación: src/app/api/admin/users/route.ts

Payload:
{
  email: string (requerido, único)
  name: string (requerido)
  password: string (requerido, min 8 chars)
  role: string (requerido, validar contra ALL_ROLES)
  departmentId?: string (opcional, requerido si role=AREA_MANAGER)
  targetAccountId?: string (solo FOCALIZAHR_ADMIN puede usar)
}

Lógica:
1. extractUserContext(request)
2. Validar hasPermission(role, 'admin:accounts') o similar
3. Determinar effectiveAccountId:
   - Si targetAccountId presente Y rol=FOCALIZAHR_ADMIN → usar targetAccountId
   - Sino → usar accountId del JWT
4. Validar email único en esa cuenta
5. Hash password con bcrypt (12 rounds)
6. Crear User en Prisma
7. Registrar en AuditLog
8. Retornar usuario creado (sin passwordHash)
```

#### GET /api/admin/users - Listar usuarios
```
Ubicación: src/app/api/admin/users/route.ts (mismo archivo)

Query params:
- accountId?: string (para FOCALIZAHR_ADMIN)
- page?: number (default 1)
- limit?: number (default 20)
- search?: string (buscar por email o nombre)
- role?: string (filtrar por rol)
- isActive?: boolean

Lógica:
1. extractUserContext(request)
2. Determinar effectiveAccountId
3. Query con paginación y filtros
4. Incluir department y account en respuesta
5. NO retornar passwordHash nunca
```

#### PATCH /api/admin/users/[id]/route.ts - Editar usuario
```
Campos editables:
- name
- role
- departmentId
- isActive

NO editable:
- email (inmutable)
- passwordHash (endpoint separado si se necesita)
```

#### DELETE /api/admin/users/[id]/route.ts - Desactivar usuario
```
Lógica:
- NO eliminar físicamente
- Marcar isActive = false
- Registrar en AuditLog
```

---

### 2. Páginas Frontend

#### /dashboard/admin/users/page.tsx - Lista de usuarios
```
Estructura:
┌─────────────────────────────────────────────────────────────┐
│  ← Volver al Dashboard                                      │
│                                                             │
│  Gestión de Usuarios                    [+ Nuevo Usuario]   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔍 Buscar usuario...        [Filtro Rol ▾] [Estado ▾]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ⚠️ SOLO SI ES FOCALIZAHR_ADMIN:                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ AccountSelector - Seleccionar empresa                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  TABLA USUARIOS:                                            │
│  ┌──────────────────────────────────────────────────────────┐
│  │ Nombre        │ Email          │ Rol      │ Estado │ ⚙️ │
│  ├──────────────────────────────────────────────────────────┤
│  │ Juan Pérez    │ juan@corp.cl   │ CEO      │ ✅     │ ⋮  │
│  │ María García  │ maria@corp.cl  │ HR_MGR   │ ✅     │ ⋮  │
│  └──────────────────────────────────────────────────────────┘
│                                                             │
│  Paginación: ← 1 2 3 ... →                                  │
└─────────────────────────────────────────────────────────────┘

Menú ⋮ por usuario:
- Editar
- Desactivar/Activar
```

#### /dashboard/admin/users/new/page.tsx - Crear usuario
```
Estructura:
┌─────────────────────────────────────────────────────────────┐
│  ← Volver a Usuarios                                        │
│                                                             │
│  Nuevo Usuario                                              │
│                                                             │
│  ⚠️ SOLO SI ES FOCALIZAHR_ADMIN:                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Empresa: [AccountSelector]                              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │  Nombre completo *                                      ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │                                                  │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  Email corporativo *                                    ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │                                                  │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  Contraseña temporal *                                  ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ ••••••••                              [👁️]     │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │  ℹ️ El usuario deberá cambiarla en primer login        ││
│  │                                                         ││
│  │  Rol *                                                  ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ Seleccionar rol...                          ▾   │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  ⚠️ SI ROL = AREA_MANAGER:                             ││
│  │  Departamento asignado *                                ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ Seleccionar departamento...                 ▾   │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Cancelar]                          [Crear Usuario]        │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Hook Compartido

```typescript
// src/hooks/useUsersManagement.ts

interface UseUsersManagementProps {
  accountId?: string;      // Solo admin pasa esto
  userRole?: string;       // Para lógica condicional
}

interface UseUsersManagementReturn {
  // Data
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  totalCount: number;
  currentPage: number;
  
  // Actions
  fetchUsers: (filters?) => Promise<void>;
  createUser: (data) => Promise<User>;
  updateUser: (id, data) => Promise<User>;
  toggleUserStatus: (id) => Promise<void>;
  
  // Filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string | null;
  setRoleFilter: (role: string | null) => void;
}
```

---

### 4. Integración Sidebar Admin

```typescript
// Modificar: src/app/dashboard/admin/layout.tsx
// O el componente AdminNavigation si existe separado

// Agregar en navegación admin (junto a Cuentas, Estructuras, etc.):
{
  name: 'Usuarios',
  href: '/dashboard/admin/users',
  icon: Users, // de lucide-react
}

// NAVEGACIÓN ADMIN ACTUAL:
// - Dashboard
// - Cuentas
// - Estructuras
// - Revisión de Mapeo
// - Campañas
// - Templates
// - Benchmarks
// - Configuración
// + Usuarios ← AGREGAR AQUÍ
```

---

## 🎨 DISEÑO OBLIGATORIO

**LEER ANTES DE CODIFICAR:**
```
.claude/docs/focalizahr-ui-design-standards.md
```

**FILOSOFÍA CORE:**
- UN protagonista por pantalla
- UN CTA principal (crear usuario)
- Datos → Insight (mostrar rol badge con color)
- Mobile-first obligatorio

**CLASES CSS A USAR:**
```css
.fhr-card            /* Cards con glassmorphism */
.fhr-title-gradient  /* Títulos principales */
.fhr-btn-primary     /* Botón crear */
.fhr-btn-secondary   /* Botón cancelar */
.fhr-badge-success   /* Estado activo */
.fhr-badge-warning   /* Estado pendiente */
.fhr-bg-main         /* Fondo página */
```

**COLORES ROLES (sugeridos):**
```yaml
FOCALIZAHR_ADMIN: purple (#A78BFA)
ACCOUNT_OWNER: cyan (#22D3EE)
CEO: amber (#F59E0B)
HR_MANAGER: emerald (#10B981)
AREA_MANAGER: blue (#3B82F6)
VIEWER: slate (#64748B)
```

---

## 🔐 SEGURIDAD CRÍTICA

1. **NUNCA retornar passwordHash** en ninguna respuesta API
2. **SIEMPRE validar** que el usuario tiene permiso antes de cualquier operación
3. **SIEMPRE validar** multi-tenant (accountId)
4. **Solo FOCALIZAHR_ADMIN** puede usar targetAccountId
5. **Registrar en AuditLog** toda operación CRUD

---

## 📋 CHECKLIST IMPLEMENTACIÓN

### Backend
- [ ] POST /api/admin/users (crear)
- [ ] GET /api/admin/users (listar con paginación)
- [ ] PATCH /api/admin/users/[id] (editar)
- [ ] DELETE /api/admin/users/[id] (desactivar)
- [ ] Validación Zod para todos los endpoints
- [ ] AuditLog en cada operación

### Frontend
- [ ] /dashboard/admin/users/page.tsx (lista)
- [ ] /dashboard/admin/users/new/page.tsx (crear)
- [ ] Hook useUsersManagement
- [ ] Integración AccountSelector (solo admin)
- [ ] Selector de departamentos (solo AREA_MANAGER)
- [ ] Estados de carga y error

### Integración
- [ ] Agregar ruta "Usuarios" en layout admin (`/dashboard/admin/layout.tsx`)
- [ ] Permisos en middleware si necesario

### Testing
- [ ] Crear usuario como FOCALIZAHR_ADMIN para cliente
- [ ] Crear usuario como ACCOUNT_OWNER para su empresa
- [ ] Listar usuarios con filtros
- [ ] Editar rol de usuario
- [ ] Desactivar usuario
- [ ] Verificar que AREA_MANAGER no puede acceder

---

## 🔮 FUTURO (NO IMPLEMENTAR AHORA)

```yaml
FASE 2 - Carga Masiva:
  - Endpoint POST /api/admin/users/batch
  - UI para subir Excel con usuarios
  - Generación automática de contraseñas
  - Email de bienvenida con credenciales
  
FASE 3 - Evaluadores:
  - Rol EVALUATOR específico
  - Carga batch desde evaluación desempeño
  - Credenciales temporales
  - Portal evaluador separado
```

---

## 📝 NOTAS FINALES

- Usa `bcrypt` con 12 rounds para passwords
- El email es **inmutable** después de creación
- Para cambio de contraseña, crear endpoint separado en futuro
- Los roles disponibles vienen de `ALL_ROLES` en AuthorizationService
- Sigue el patrón exacto de `src/app/api/department-metrics/upload/route.ts` para la lógica dual admin/cliente
