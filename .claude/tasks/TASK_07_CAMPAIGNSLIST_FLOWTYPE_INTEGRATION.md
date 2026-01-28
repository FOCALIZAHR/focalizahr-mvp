# TASK_07: Integración CampaignsList - FlowType Detection (OPCIONAL)

## 📋 INFORMACIÓN DEL TASK

| Campo | Valor |
|-------|-------|
| **Prioridad** | 🟡 Media (Opcional) |
| **Complejidad** | Baja |
| **Tiempo estimado** | 1-2 horas |
| **Riesgo** | Bajo (cambios menores en componente existente) |
| **Dependencias** | TASK_04, TASK_05, TASK_06 completados |
| **Bloqueante para** | Ninguno |

---

## ⚠️ DEPENDENCIA CRÍTICA - LEER PRIMERO

**Antes de implementar este TASK, la API `/api/campaigns` DEBE modificarse** para incluir `performanceCycle.id`.

Sin esta modificación, no se puede obtener el `cycleId` para la redirección.

Ver **Paso 1** de esta guía para los cambios exactos en la API.

---

## 🎯 OBJETIVO

Modificar el componente `CampaignsList` para que:
- Detecte cuando una Campaign tiene `flowType: 'employee-based'`
- Muestre un botón **[GESTIONAR CICLO]** en lugar del botón normal
- Redirija a `/dashboard/admin/performance-cycles/[cycleId]`

---

## 📍 CONTEXTO DEL PROBLEMA

Actualmente `CampaignsList` trata todas las campañas igual. Pero las campañas con `flowType: 'employee-based'` (Evaluación de Desempeño, Impact Pulse) tienen un flujo diferente:

| Tipo | Flujo Normal | Flujo Employee-Based |
|------|--------------|---------------------|
| Participantes | Se cargan manualmente | Se generan desde Employee Master |
| Gestión | `/dashboard/campaigns/[id]` | `/dashboard/admin/performance-cycles/[cycleId]` |
| Activación | Directo | Requiere "Generar Evaluaciones" primero |

---

## 🔌 DATOS DISPONIBLES

La API `/api/campaigns` ya retorna `campaignType` que incluye `flowType`:

```typescript
// Cada campaign en la lista tiene:
{
  id: "clxxx...",
  name: "Evaluación Q1 2025",
  status: "draft",
  // ...
  campaignType: {
    id: "ct-perf...",
    name: "Evaluación de Desempeño",
    slug: "performance-evaluation",
    flowType: "employee-based"  // ← CLAVE
  },
  // También necesitamos el cycleId
  performanceCycle?: {
    id: "cycle-xxx..."
  }
}
```

⚠️ **NOTA:** Actualmente el API no incluye `performanceCycle`. Esto requiere una pequeña modificación al API.

---

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Modificar API para incluir PerformanceCycle

**Archivo:** `src/app/api/campaigns/route.ts`

**Buscar en el include del findMany (~línea 120):**
```typescript
include: {
  campaignType: {
    select: {
      id: true,
      name: true,
      slug: true,
      // ...
    }
  }
}
```

**Agregar:**
```typescript
include: {
  campaignType: {
    select: {
      id: true,
      name: true,
      slug: true,
      flowType: true,  // ✅ AGREGAR
      // ...
    }
  },
  // ✅ AGREGAR RELACIÓN CON CYCLE
  performanceCycle: {
    select: {
      id: true,
      status: true
    }
  }
}
```

---

### Paso 2: Actualizar Tipo en CampaignsList

**Archivo:** `src/components/campaigns/CampaignsList.tsx`

**Agregar al tipo Campaign:**
```typescript
interface Campaign {
  // ... campos existentes ...
  campaignType: {
    id: string;
    name: string;
    slug: string;
    flowType?: 'standard' | 'employee-based';  // ✅ AGREGAR
  };
  performanceCycle?: {  // ✅ AGREGAR
    id: string;
    status: string;
  };
}
```

---

### Paso 3: Agregar Lógica de Detección

**En el componente CampaignCard (dentro de CampaignsList.tsx):**

```typescript
// Detectar si es employee-based
const isEmployeeBased = campaign.campaignType?.flowType === 'employee-based';
const cycleId = campaign.performanceCycle?.id;

// Determinar destino del botón
const handleManageClick = () => {
  if (isEmployeeBased && cycleId) {
    // Redirigir a gestión de ciclo
    router.push(`/dashboard/admin/performance-cycles/${cycleId}`);
  } else {
    // Flujo normal
    router.push(`/dashboard/campaigns/${campaign.id}`);
  }
};
```

---

### Paso 4: Modificar UI del Botón

**Buscar el botón de acción principal en CampaignCard:**

```typescript
// ANTES (aproximado):
<Button onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}>
  Ver Campaña
</Button>

// DESPUÉS:
<Button onClick={handleManageClick}>
  {isEmployeeBased ? (
    <>
      <BarChart3 className="w-4 h-4 mr-2" />
      Gestionar Ciclo
    </>
  ) : (
    <>
      Ver Campaña
    </>
  )}
</Button>
```

---

### Paso 5: Agregar Badge Indicador (Opcional)

Para que el usuario sepa que es un tipo de campaña diferente:

```typescript
{/* Badge de tipo */}
{isEmployeeBased && (
  <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
    <Users className="w-3 h-3 mr-1" />
    Evaluación
  </Badge>
)}
```

---

## 📊 FLUJO COMPLETO DESPUÉS DE TODOS LOS TASKS

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO EMPLOYEE-BASED COMPLETO                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. WIZARD                                                          │
│     /dashboard/campaigns/new                                        │
│     └── Selecciona tipo "Evaluación de Desempeño"                  │
│     └── flowType: 'employee-based' detectado                        │
│     └── Paso 3B: Criterios de selección de empleados               │
│     └── Crea Campaign + PerformanceCycle (VINCULADOS) ✅ TASK_04   │
│                                                                     │
│  2. CAMPAIGNS LIST                                                  │
│     /dashboard (CampaignsList)                                      │
│     └── Detecta flowType: 'employee-based' ✅ TASK_07              │
│     └── Muestra botón [GESTIONAR CICLO] en lugar de [VER]          │
│     └── Click → Redirige a /performance-cycles/[cycleId]           │
│                                                                     │
│  3. CYCLES LIST                                                     │
│     /dashboard/admin/performance-cycles ✅ TASK_05                  │
│     └── Lista todos los ciclos de la cuenta                        │
│     └── Filtros por estado (DRAFT, ACTIVE, COMPLETED)              │
│     └── Click en card → Detalle del ciclo                          │
│                                                                     │
│  4. CYCLE DETAIL                                                    │
│     /dashboard/admin/performance-cycles/[id] ✅ TASK_06            │
│     └── Muestra info completa del ciclo                            │
│     └── Botón [GENERAR EVALUACIONES] → POST /generate              │
│     └── Crea EvaluationAssignments desde Employee Master           │
│     └── Actualiza Campaign.totalInvited                            │
│     └── Botón [ACTIVAR CICLO] → Campaign.status = 'active'         │
│                                                                     │
│  5. EVALUATOR PORTAL (YA EXISTE)                                   │
│     /dashboard/evaluaciones                                         │
│     └── Jefe ve sus evaluaciones pendientes                        │
│     └── Click → Inicia encuesta de evaluación                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 VERIFICACIÓN

### Test Manual:

1. **Crear campaña employee-based:** Usar wizard con tipo "Evaluación de Desempeño"
2. **Ir a Dashboard:** Ver la campaña en CampaignsList
3. **Verificar:** Botón dice "Gestionar Ciclo" (no "Ver Campaña")
4. **Click:** Redirige a `/dashboard/admin/performance-cycles/[cycleId]`

### Casos de Prueba:

| Tipo Campaña | flowType | Botón | Destino |
|--------------|----------|-------|---------|
| Pulso Express | standard | Ver Campaña | /campaigns/[id] |
| Experiencia Full | standard | Ver Campaña | /campaigns/[id] |
| Evaluación Desempeño | employee-based | Gestionar Ciclo | /performance-cycles/[cycleId] |
| Impact Pulse | employee-based | Gestionar Ciclo | /performance-cycles/[cycleId] |

---

## 📁 ARCHIVOS A MODIFICAR

| Archivo | Cambio | Líneas Aprox |
|---------|--------|--------------|
| `src/app/api/campaigns/route.ts` | Agregar include performanceCycle | ~5 líneas |
| `src/components/campaigns/CampaignsList.tsx` | Lógica detección + UI botón | ~20 líneas |

**Total:** 2 archivos, ~25 líneas modificadas

---

## ⚠️ ALTERNATIVA SIN MODIFICAR API

Si prefieres no modificar el API, puedes detectar por el `slug` del campaignType:

```typescript
const EMPLOYEE_BASED_SLUGS = ['performance-evaluation', 'impact-pulse'];
const isEmployeeBased = EMPLOYEE_BASED_SLUGS.includes(campaign.campaignType?.slug);

// Pero necesitas obtener el cycleId de otra forma
// Opción: Fetch adicional al montar el componente
// Opción: Agregar link en el card que haga fetch on-demand
```

---

## ✅ CHECKLIST PRE-COMMIT

- [ ] API retorna `flowType` en campaignType
- [ ] API retorna `performanceCycle.id` si existe
- [ ] CampaignsList detecta flowType correctamente
- [ ] Botón cambia según tipo
- [ ] Redirección funciona a cycles/[id]
- [ ] Sin errores TypeScript
- [ ] Sin regresiones en campañas normales

---

## 🎯 RESUMEN EJECUTIVO

Este TASK es **OPCIONAL** pero mejora significativamente la UX al:

1. **Eliminar confusión:** Usuario no va a página equivocada
2. **Flujo natural:** Click → Gestión del ciclo directamente
3. **Consistencia:** Todas las campañas employee-based se gestionan igual

**Recomendación:** Implementar después de validar que TASK_04, 05, y 06 funcionan correctamente.
