# 🎯 TASK 02: PORTAL DEL JEFE - /dashboard/evaluaciones

## CONTEXTO
Cuando un jefe tiene evaluaciones de desempeño asignadas, recibe un email con link al portal.
El portal muestra su progreso y lista de subordinados por evaluar.

**Autenticación:** Login con cuenta User existente (NO token)
**Autorización:** Por asignación (tiene EvaluationAssignments)

---

## OBJETIVO
Crear el portal donde el jefe:
1. Ve su progreso general (gauge 2/5)
2. Ve lista de subordinados por evaluar
3. Hace clic en [Evaluar] → va a Welcome → Survey

---

## COMPONENTES A CREAR

### 1. Página Principal
```
Ubicación: src/app/dashboard/evaluaciones/page.tsx
```

```typescript
// Página server component
// 1. Verificar autenticación (redirect a /login si no)
// 2. Obtener evaluaciones asignadas al usuario
// 3. Renderizar EvaluatorDashboard

export default async function MisEvaluacionesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/dashboard/evaluaciones');
  
  const assignments = await getEvaluatorAssignments(user.id);
  const cycle = await getCurrentPerformanceCycle(user.accountId);
  
  return <EvaluatorDashboard user={user} assignments={assignments} cycle={cycle} />;
}
```

---

### 2. EvaluatorDashboard.tsx
```
Ubicación: src/components/evaluator/EvaluatorDashboard.tsx
```

```typescript
interface EvaluatorDashboardProps {
  user: User;
  cycle: PerformanceCycle | null;
  assignments: EvaluationAssignmentWithEmployee[];
}

interface EvaluationAssignmentWithEmployee {
  id: string;
  status: 'pending' | 'completed';
  completedAt?: Date;
  evaluatee: {
    id: string;
    fullName: string;
    position: string;
    departmentName: string;
    tenure: string;  // "2 años 3 meses"
    avatarUrl?: string;
  };
  participantToken: string;  // Para link a /encuesta/[token]
}
```

**UI:**
- Header con nombre del ciclo y días restantes
- EvaluatorProgressCard (gauge)
- SubordinateEvaluationList

**Estados especiales:**
- Sin ciclo activo → Mensaje vacío
- Sin asignaciones → Mensaje "No tienes evaluaciones asignadas"
- 100% completado → Estado de éxito con confetti

---

### 3. EvaluatorProgressCard.tsx
```
Ubicación: src/components/evaluator/EvaluatorProgressCard.tsx
```

```typescript
interface EvaluatorProgressCardProps {
  completed: number;
  total: number;
  estimatedMinutesPerEvaluation: number;
}
```

**UI:**
- Gauge semicircular (como Torre de Control)
- Centro: "2/5" + "40%"
- 3 métricas abajo: Completadas (green), Pendientes (cyan), Tiempo estimado (slate)
- Animación de progreso al cargar

---

### 4. SubordinateEvaluationList.tsx
```
Ubicación: src/components/evaluator/SubordinateEvaluationList.tsx
```

```typescript
interface SubordinateEvaluationListProps {
  assignments: EvaluationAssignmentWithEmployee[];
  onEvaluate: (assignmentId: string, token: string) => void;
  onViewSummary: (assignmentId: string) => void;
}
```

**UI:**
- Lista de SubordinateEvaluationCard
- Ordenadas: Pendientes primero, luego completadas

---

### 5. SubordinateEvaluationCard.tsx
```
Ubicación: src/components/evaluator/SubordinateEvaluationCard.tsx
```

```typescript
interface SubordinateEvaluationCardProps {
  assignment: EvaluationAssignmentWithEmployee;
  onEvaluate: () => void;
  onViewSummary: () => void;
}
```

**UI Estado Pendiente:**
```
┌─────────────────────────────────────────────────────┐
│  ┌────┐                                             │
│  │ 👤 │  María García                 ○ Pendiente  │
│  │    │  Analista Comercial Senior                 │
│  └────┘  Comercial · 2 años 3 meses                │
│                                                     │
│                          ┌─────────────────────┐   │
│                          │     Evaluar →       │   │
│                          │  (fhr-btn-primary)  │   │
│                          └─────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**UI Estado Completada:**
```
┌─────────────────────────────────────────────────────┐ bg-green-50/50
│  ┌────┐                                             │
│  │ 👤 │  Juan Méndez                 ✓ Completada  │
│  │ ✓  │  Analista Junior                (green)    │
│  └────┘  Comercial · 8 meses                       │
│                                                     │
│                          ┌─────────────────────┐   │
│                          │   Ver Resumen       │   │
│                          │  (fhr-btn-ghost)    │   │
│                          └─────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## LAYOUT

El portal usa el layout existente de /dashboard con DashboardNavigation:

```
Ubicación: src/app/dashboard/evaluaciones/layout.tsx (opcional, puede usar el de /dashboard)
```

Si necesita layout específico:
```typescript
export default function EvaluacionesLayout({ children }) {
  return (
    <div className="min-h-screen fhr-bg-main flex">
      <DashboardNavigation />
      <main className="flex-1 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
```
```

---

## FLUJO DE NAVEGACIÓN

```
Email "Tienes 5 evaluaciones pendientes"
  ↓
Click link → /dashboard/evaluaciones
  ↓
(Si no logueado) → /login?redirect=/dashboard/evaluaciones
  ↓
Portal: Ve lista de subordinados
  ↓
Click [Evaluar] → /dashboard/evaluaciones/[assignmentId]  (Welcome)
  ↓
Click [Comenzar] → /encuesta/[token]  (Survey existente)
  ↓
Completa survey → Redirect a portal con actualización
```

---

## API NECESARIA

```typescript
// GET /api/evaluator/assignments
// Auth: Bearer token (user logueado)
// Response:
{
  cycle: PerformanceCycle | null,
  assignments: EvaluationAssignmentWithEmployee[],
  stats: {
    total: number,
    completed: number,
    pending: number
  }
}

// Implementación:
// 1. Obtener user de JWT
// 2. Buscar EvaluationAssignments donde evaluatorUserId = user.id
// 3. Incluir Employee del evaluatee con join
// 4. Calcular tenure desde hireDate
// 5. Incluir participantToken para link
```

---

## ESTILOS

```yaml
Card contenedor: fhr-card
Card completada: fhr-card + bg-green-50/50
Badge pendiente: bg-cyan-100 text-cyan-700
Badge completada: bg-green-100 text-green-700
Botón evaluar: fhr-btn-primary
Botón ver resumen: fhr-btn-ghost
Gauge: Reutilizar estilo de Torre de Control
Background: fhr-bg-main (slate-900 con gradiente)
```

---

## ESTADOS ESPECIALES

### Sin Asignaciones
```typescript
if (assignments.length === 0) {
  return (
    <EmptyState
      icon={<ClipboardList />}
      title="No tienes evaluaciones asignadas"
      description="Actualmente no hay ciclos de evaluación activos donde debas evaluar colaboradores."
    />
  );
}
```

### 100% Completado
```typescript
if (completed === total && total > 0) {
  return (
    <SuccessState
      title="¡Felicitaciones!"
      description="Completaste todas las evaluaciones"
      subtitle="Tu feedback es valioso para el desarrollo de tu equipo."
    />
  );
}
```

---

## CRITERIO DE ÉXITO

- [ ] Página /dashboard/evaluaciones renderiza
- [ ] Requiere autenticación (redirect a login)
- [ ] Muestra solo evaluaciones del usuario actual
- [ ] Gauge de progreso funciona correctamente
- [ ] Cards muestran estado pendiente/completado
- [ ] Click [Evaluar] navega a /dashboard/evaluaciones/[id]
- [ ] Estado vacío cuando no hay asignaciones
- [ ] Estado éxito cuando 100% completado
- [ ] Usa DashboardNavigation existente
- [ ] Responsive (375px mínimo)

---

## ARCHIVOS A CREAR

```
src/app/dashboard/evaluaciones/
  page.tsx
  [assignmentId]/
    page.tsx

src/components/evaluator/
  EvaluatorDashboard.tsx
  EvaluatorProgressCard.tsx
  SubordinateEvaluationList.tsx
  SubordinateEvaluationCard.tsx

src/app/api/evaluator/
  assignments/
    route.ts
```
