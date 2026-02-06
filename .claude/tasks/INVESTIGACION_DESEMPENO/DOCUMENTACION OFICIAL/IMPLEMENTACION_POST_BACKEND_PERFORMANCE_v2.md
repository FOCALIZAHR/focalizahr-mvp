# 📋 IMPLEMENTACIÓN POST-BACKEND: EMPLOYEE PERFORMANCE
## FocalizaHR Enterprise | Documentación Ejecutiva para Claude
### Versión 2.0 | Enero 2026 | Estado: ✅ IMPLEMENTADO

---

## 🎯 PROPÓSITO DE ESTE DOCUMENTO

Este documento **continúa la v1.0** y registra todo lo construido para completar el módulo de Evaluación de Desempeño. Cubre:

1. **Biblioteca de Competencias** - Sistema configurable por cliente con snapshot inmutable
2. **Gestión de Ciclos** - Vinculación Campaign ↔ Cycle + Fix medular de Participants
3. **UX Enterprise** - Modales, toasts y feedback visual profesional

**Prerrequisito:** Leer `IMPLEMENTACION_POST_BACKEND_PERFORMANCE_v1.md` que cubre Capas 1-5.

---

## 📊 RESUMEN EJECUTIVO

### Arquitectura Completa v2 (Capas 6-8)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              FLUJO COMPLETO EMPLOYEE PERFORMANCE (CAPAS 6-8)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  CAPA 6: BIBLIOTECA DE COMPETENCIAS                                    ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  Admin ──▶ [Competency Library UI] ──▶ Competency Model                     │
│            • CRUD competencias               │                               │
│            • Categorías: CORE, LEADERSHIP    │                               │
│            • Behaviors configurables         ▼                               │
│                                       [CompetencyService]                    │
│                                       • generateSnapshot()                   │
│                                       • filterByTrack()                      │
│                                              │                               │
│                                              ▼                               │
│                                       competencySnapshot (inmutable)         │
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  CAPA 7: GESTIÓN DE CICLOS (FIX MEDULAR)                              ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  Wizard ──▶ [Campaign + PerformanceCycle] ──▶ VINCULADOS (TASK_04)          │
│              campaignId ≠ null                                               │
│                     │                                                        │
│                     ▼                                                        │
│              [Generar Evaluaciones]                                          │
│                     │                                                        │
│                     ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  EvaluationService.generateManagerEvaluations() (TASK_08 CORE)      │    │
│  │                                                                      │    │
│  │  1. Crear EvaluationAssignment ────────────────────────┐            │    │
│  │     • evaluatorId (jefe)                               │            │    │
│  │     • evaluateeId (subordinado)                        │            │    │
│  │     • SNAPSHOT congelado                               │            │    │
│  │                                                        ▼            │    │
│  │  2. Crear Participant (FIX MEDULAR) ◀──────────────────┘            │    │
│  │     • nationalId = EVALUATEE (para reportes)                        │    │
│  │     • email = EVALUADOR (recibe link)                               │    │
│  │     • evaluationAssignmentId = vínculo                              │    │
│  │     • uniqueToken = acceso encuesta                                 │    │
│  │                                                        │            │    │
│  │  3. Actualizar Assignment.participantId ◀──────────────┘            │    │
│  │                                                                      │    │
│  │  4. Actualizar Campaign.totalInvited                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                     │                                                        │
│                     ▼                                                        │
│              [Máquina de Estados]                                            │
│              DRAFT ──▶ SCHEDULED ──▶ ACTIVE ──▶ IN_REVIEW ──▶ COMPLETED     │
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  CAPA 8: UX ENTERPRISE                                                 ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  /performance-cycles ──▶ [Lista Ciclos] ──▶ Click ──▶ [Detalle Ciclo]       │
│                          • Status badges          • Métricas                 │
│                          • Filtros                • Generar modal            │
│                          • flowType detection     • Activar modal            │
│                                                   • Toast feedback           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ BIBLIOTECA DE COMPETENCIAS

### Problema Resuelto
Las evaluaciones de desempeño requieren preguntas específicas por nivel jerárquico. Un COLABORADOR no debe responder preguntas de liderazgo estratégico, pero un EJECUTIVO sí.

### Solución Implementada
Sistema de competencias configurable por cliente con snapshot inmutable y filtrado automático por Performance Track.

### Modelo Competency

```prisma
model Competency {
  id          String   @id @default(cuid())
  accountId   String   @map("account_id")
  
  // Identificación
  name        String   // "Comunicación Efectiva"
  code        String?  // "CORE-COMM"
  description String?
  
  // Clasificación
  category    CompetencyCategory  // CORE, LEADERSHIP, STRATEGIC, TECHNICAL
  subcategory String?
  
  // Contenido
  behaviors   Json?    // ["Escucha activamente", "Adapta mensaje al público"]
  indicators  Json?    // Indicadores de medición
  
  // Reglas de audiencia
  audienceRule String? // "MANAGER_ONLY", "EXECUTIVE_ONLY", null = todos
  
  // Estado
  isActive    Boolean @default(true)
  sortOrder   Int     @default(0)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  account     Account @relation(fields: [accountId], references: [id])
  
  @@unique([accountId, code])
  @@map("competencies")
}

enum CompetencyCategory {
  CORE        // Todos los empleados
  LEADERSHIP  // Managers + Ejecutivos
  STRATEGIC   // Solo Ejecutivos
  TECHNICAL   // Por área específica
}
```

### CompetencyService

```typescript
// src/lib/services/CompetencyService.ts

export class CompetencyService {
  
  /**
   * Genera snapshot inmutable de competencias al crear ciclo
   * Este snapshot NO cambia aunque el cliente edite su biblioteca después
   */
  static async generateSnapshot(accountId: string): Promise<CompetencySnapshot[]> {
    const competencies = await prisma.competency.findMany({
      where: { accountId, isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
    });
    
    return competencies.map(c => ({
      code: c.code,
      name: c.name,
      category: c.category,
      behaviors: c.behaviors,
      audienceRule: c.audienceRule
    }));
  }
  
  /**
   * Filtra competencias del snapshot según Performance Track del evaluatee
   */
  static filterByTrack(
    snapshot: CompetencySnapshot[],
    performanceTrack: 'COLABORADOR' | 'MANAGER' | 'EJECUTIVO'
  ): CompetencySnapshot[] {
    return snapshot.filter(comp => {
      // CORE siempre visible
      if (comp.category === 'CORE') return true;
      
      // LEADERSHIP visible para MANAGER y EJECUTIVO
      if (comp.category === 'LEADERSHIP') {
        return performanceTrack === 'MANAGER' || performanceTrack === 'EJECUTIVO';
      }
      
      // STRATEGIC solo para EJECUTIVO
      if (comp.category === 'STRATEGIC') {
        return performanceTrack === 'EJECUTIVO';
      }
      
      // TECHNICAL: verificar audienceRule específica
      if (comp.audienceRule) {
        if (comp.audienceRule === 'MANAGER_ONLY') {
          return performanceTrack === 'MANAGER' || performanceTrack === 'EJECUTIVO';
        }
        if (comp.audienceRule === 'EXECUTIVE_ONLY') {
          return performanceTrack === 'EJECUTIVO';
        }
      }
      
      return true;
    });
  }
}
```

### Matriz de Visibilidad por Track

```
┌─────────────────────────────────────────────────────────────────┐
│              MATRIZ COMPETENCIAS × PERFORMANCE TRACK            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Categoría      │ COLABORADOR │ MANAGER │ EJECUTIVO │           │
│  ───────────────┼─────────────┼─────────┼───────────┼           │
│  CORE           │     ✅      │    ✅   │    ✅     │           │
│  LEADERSHIP     │     ❌      │    ✅   │    ✅     │           │
│  STRATEGIC      │     ❌      │    ❌   │    ✅     │           │
│  TECHNICAL*     │     ⚙️      │    ⚙️   │    ⚙️     │           │
│                                                                 │
│  * TECHNICAL depende de audienceRule configurada                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Snapshot Inmutable en PerformanceCycle

```typescript
// Al crear ciclo, se congela la biblioteca
const cycle = await prisma.performanceCycle.create({
  data: {
    accountId,
    name,
    startDate,
    endDate,
    // ...
    
    // ═══════════════════════════════════════════════════
    // SNAPSHOT: Se congela al crear - NUNCA cambia
    // ═══════════════════════════════════════════════════
    competencySnapshot: await CompetencyService.generateSnapshot(accountId)
  }
});

// Si cliente edita biblioteca a mitad de ciclo:
// - Ciclo en curso: Usa snapshot original (integridad garantizada)
// - Ciclos futuros: Usarán nueva biblioteca
```

---

## 7️⃣ GESTIÓN DE CICLOS (FIX MEDULAR)

### Problema Resuelto
El sistema creaba `EvaluationAssignments` pero NO creaba `Participants`, causando:
- `participantId = NULL` en assignments
- `Campaign.totalInvited = 0`
- `/activate` fallaba por falta de participantes
- Motor de encuestas no tenía token para enviar

### Problema Adicional: Constraint de Unicidad

```
CONSTRAINT ORIGINAL:
@@unique([campaignId, nationalId])

ESCENARIO 360° - 3 personas evalúan a Juan:
  María evalúa a Juan → nationalId="RUT-Juan" ✅ (primero)
  Pedro evalúa a Juan → nationalId="RUT-Juan" ❌ VIOLA CONSTRAINT
  Ana evalúa a Juan   → nationalId="RUT-Juan" ❌ VIOLA CONSTRAINT

RESULTADO: Solo 1 de 3 evaluaciones se puede crear
```

### Solución Implementada (TASK_04 + TASK_08 CORE)

#### TASK_04: Vinculación Campaign ↔ PerformanceCycle

**Problema:** Wizard creaba Campaign y Cycle pero NO los vinculaba (`campaignId = null`)

**Fix en Wizard (Frontend):**
```typescript
// src/app/dashboard/campaigns/new/page.tsx
const cycleResponse = await fetch('/api/admin/performance-cycles', {
  method: 'POST',
  body: JSON.stringify({
    campaignId: createdCampaign.id,  // ✅ AGREGADO
    name: formData.name.trim(),
    // ...
  })
});
```

**Fix en API (Backend):**
```typescript
// src/app/api/admin/performance-cycles/route.ts
const { campaignId, name, ... } = body;

const cycle = await prisma.performanceCycle.create({
  data: {
    accountId: userContext.accountId,
    campaignId: campaignId || undefined,  // ✅ AGREGADO
    name,
    // ...
  }
});
```

#### TASK_08 CORE: Fix GAP de Participants (EL FIX MEDULAR)

**Modificación Schema Prisma:**
```prisma
model Participant {
  // ... campos existentes ...
  
  // ═══════════════════════════════════════════════════════════════
  // AGREGADO: Vínculo con EvaluationAssignment (para Performance)
  // ═══════════════════════════════════════════════════════════════
  evaluationAssignmentId  String?  @unique @map("evaluation_assignment_id")
  evaluationAssignment    EvaluationAssignment? @relation(fields: [evaluationAssignmentId], references: [id])
  
  // ═══════════════════════════════════════════════════════════════
  // MODIFICADO: Constraint para permitir múltiples evaluaciones
  // ═══════════════════════════════════════════════════════════════
  // ANTES: @@unique([campaignId, nationalId])
  // DESPUÉS:
  @@unique([campaignId, nationalId, evaluationAssignmentId])
}
```

**Modificación EvaluationService:**
```typescript
// src/lib/services/EvaluationService.ts

export async function generateManagerEvaluations(
  cycleId: string,
  accountId: string,
  options?: GenerationOptions
): Promise<GenerationResult> {
  
  const cycle = await prisma.performanceCycle.findUnique({
    where: { id: cycleId },
    include: { campaign: true }
  });

  if (!cycle?.campaignId) {
    throw new Error('Ciclo sin Campaign vinculada. Ejecute TASK_04 primero.');
  }

  // ... obtener managers con subordinados ...

  for (const manager of managers) {
    for (const subordinate of manager.subordinates) {
      
      await prisma.$transaction(async (tx) => {
        
        // 1. CREAR ASSIGNMENT (ya existía)
        const assignment = await tx.evaluationAssignment.create({
          data: {
            accountId,
            cycleId,
            evaluatorId: manager.id,
            evaluateeId: subordinate.id,
            snapshotDate: new Date(),
            evaluateeName: subordinate.fullName,
            evaluateeNationalId: subordinate.nationalId,
            evaluateeDepartmentId: subordinate.departmentId,
            evaluateeDepartment: subordinate.department?.displayName || '',
            evaluateePosition: subordinate.position,
            evaluateePerformanceTrack: subordinate.performanceTrack,
            evaluatorName: manager.fullName,
            evaluatorNationalId: manager.nationalId,
            evaluatorDepartmentId: manager.departmentId,
            evaluatorDepartment: manager.department?.displayName || '',
            evaluationType: 'MANAGER_TO_EMPLOYEE',
            status: 'PENDING',
            dueDate: cycle.endDate
          }
        });

        // ═══════════════════════════════════════════════════════════
        // 2. CREAR PARTICIPANT (EL FIX MEDULAR)
        // ═══════════════════════════════════════════════════════════
        
        const participant = await tx.participant.create({
          data: {
            campaignId: cycle.campaignId!,
            
            // ⚠️ CRÍTICO: nationalId del EVALUATEE (para reportes por depto)
            nationalId: subordinate.nationalId,
            fullName: subordinate.fullName,
            
            // ⚠️ CRÍTICO: email del EVALUADOR (quien recibe el link)
            email: manager.email,
            
            // Departamento del EVALUATEE (para agregación correcta)
            departmentId: subordinate.departmentId,
            
            // Vínculo con Assignment
            evaluationAssignmentId: assignment.id,
            
            // Token único para acceso a encuesta
            uniqueToken: generateUniqueToken(),
            
            // Estado inicial
            hasResponded: false
          }
        });

        // ═══════════════════════════════════════════════════════════
        // 3. ACTUALIZAR ASSIGNMENT CON participantId
        // ═══════════════════════════════════════════════════════════
        
        await tx.evaluationAssignment.update({
          where: { id: assignment.id },
          data: { participantId: participant.id }
        });

      }); // Fin transacción

      created++;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. ACTUALIZAR Campaign.totalInvited
  // ═══════════════════════════════════════════════════════════════
  
  if (created > 0) {
    await prisma.campaign.update({
      where: { id: cycle.campaignId! },
      data: { totalInvited: created }
    });
  }

  return { success: true, created, skipped, errors };
}
```

### ¿Por qué nationalId = EVALUATEE?

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEMÁNTICA DE nationalId                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ESCENARIO: María (Ventas) evalúa a Juan (Operaciones)         │
│                                                                 │
│  CON nationalId = EVALUATEE (CORRECTO):                        │
│    Participant.nationalId = "RUT-Juan"                          │
│    Participant.departmentId = "Operaciones"                     │
│                                                                 │
│    → Reportes por departamento: Juan aparece en Operaciones     │
│    → Métricas de Operaciones incluyen score de Juan             │
│    → AggregationService agrupa correctamente                    │
│                                                                 │
│  CON nationalId = EVALUADOR (INCORRECTO):                      │
│    Participant.nationalId = "RUT-María"                         │
│    Participant.departmentId = "Ventas" (de María)               │
│                                                                 │
│    → Reportes incorrectos: Juan aparece en Ventas               │
│    → Métricas de Operaciones no incluyen a Juan                 │
│    → Análisis 360° completamente roto                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Backwards Compatibility

```
┌─────────────────────────────────────────────────────────────────┐
│              ¿ROMPE PRODUCTOS LEGACY?                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRODUCTO          │ assignmentId  │ Constraint Efectivo        │
│  ──────────────────┼───────────────┼────────────────────────────│
│  Pulso Express     │ NULL          │ [campaignId, nationalId]   │
│  Experiencia Full  │ NULL          │ [campaignId, nationalId]   │
│  Exit Intelligence │ NULL          │ [campaignId, nationalId]   │
│  Onboarding        │ NULL          │ [campaignId, nationalId]   │
│  Performance       │ "asgn_xxx"    │ [campaignId, nationalId,   │
│                    │               │  evaluationAssignmentId]   │
│                                                                 │
│  RESULTADO: ✅ NO ROMPE NADA                                    │
│  - Productos legacy: assignmentId = NULL sigue funcionando     │
│  - Constraint triple con NULL es equivalente al original       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Máquina de Estados del Ciclo

```typescript
// src/app/api/admin/performance-cycles/[id]/route.ts

const validTransitions: Record<string, string[]> = {
  'DRAFT':     ['SCHEDULED', 'CANCELLED'],
  'SCHEDULED': ['ACTIVE', 'CANCELLED'],
  'ACTIVE':    ['IN_REVIEW', 'CANCELLED'],
  'IN_REVIEW': ['COMPLETED'],
  'COMPLETED': [],
  'CANCELLED': []
};
```

```
┌─────────────────────────────────────────────────────────────────┐
│                 MÁQUINA DE ESTADOS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   DRAFT ──────────▶ SCHEDULED ──────────▶ ACTIVE               │
│     │    (generar)      │     (activar)      │                  │
│     │                   │                    │                  │
│     ▼                   ▼                    ▼                  │
│  CANCELLED ◀────── CANCELLED ◀──────── CANCELLED               │
│                                              │                  │
│                                              ▼                  │
│                                          IN_REVIEW              │
│                                              │                  │
│                                              ▼                  │
│                                          COMPLETED              │
│                                                                 │
│  TRANSICIÓN AUTOMÁTICA:                                         │
│  /generate → Si creó assignments → Status = SCHEDULED           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Fix Auto-Transición:**
```typescript
// src/app/api/admin/performance-cycles/[id]/generate/route.ts

// Al final del endpoint, después de generar:
if (totalCreated > 0 && cycle.status === 'DRAFT') {
  await prisma.performanceCycle.update({
    where: { id },
    data: { status: 'SCHEDULED' }
  });
}
```

---

## 8️⃣ UX ENTERPRISE

### Problema Resuelto
Los botones de "Generar Evaluaciones" y "Activar Ciclo" se desactivaban sin feedback. Usuario no entendía qué pasaba.

### Solución Implementada

#### Sistema de Modales de Confirmación

```typescript
// src/app/dashboard/admin/performance-cycles/[id]/page.tsx

// Estados para modales
const [showGenerateModal, setShowGenerateModal] = useState(false);
const [showActivateModal, setShowActivateModal] = useState(false);

// Modal Generar Evaluaciones
<Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Generar Evaluaciones</DialogTitle>
      <DialogDescription>
        Se generarán evaluaciones según la configuración del ciclo:
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-2 py-4">
      {cycle.includesManager && (
        <Badge>✓ Jefe → Subordinado</Badge>
      )}
      {cycle.includesSelf && (
        <Badge>✓ Auto-evaluación</Badge>
      )}
      {cycle.includesUpward && (
        <Badge>✓ Impact Pulse (Upward)</Badge>
      )}
      {cycle.includesPeer && (
        <Badge>✓ Entre pares</Badge>
      )}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
        Cancelar
      </Button>
      <Button onClick={handleGenerateConfirmed} disabled={generating}>
        {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Generar Evaluaciones
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Modal Activar Ciclo
<Dialog open={showActivateModal} onOpenChange={setShowActivateModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Activar Ciclo</DialogTitle>
      <DialogDescription>
        Esta acción es irreversible. Se enviarán invitaciones a todos los evaluadores.
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-4">
      <p className="text-lg font-semibold">
        {cycle._count.assignments} evaluaciones serán activadas
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Los evaluadores recibirán un email con el link a su portal.
      </p>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowActivateModal(false)}>
        Cancelar
      </Button>
      <Button 
        onClick={handleActivateConfirmed} 
        disabled={activating}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        {activating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sí, Activar Ciclo
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Sistema de Toasts

```typescript
// Importar hook
import { useToast } from '@/components/ui/use-toast';

// En el componente
const { toast } = useToast();

// Handler de Generar
const handleGenerateConfirmed = async () => {
  setShowGenerateModal(false);
  setGenerating(true);
  
  try {
    const response = await fetch(`/api/admin/performance-cycles/${id}/generate`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      toast({
        title: "✅ Evaluaciones generadas",
        description: `Se crearon ${data.totalCreated} evaluaciones. ${data.totalSkipped} omitidas.`,
        variant: "default"
      });
      router.refresh();
    } else {
      throw new Error(data.error);
    }
  } catch (error: any) {
    toast({
      title: "❌ Error al generar",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setGenerating(false);
  }
};

// Handler de Activar
const handleActivateConfirmed = async () => {
  setShowActivateModal(false);
  setActivating(true);
  
  try {
    const response = await fetch(`/api/admin/performance-cycles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    const data = await response.json();
    
    if (data.success) {
      toast({
        title: "🚀 Ciclo activado",
        description: "Los evaluadores recibirán sus invitaciones por email.",
        variant: "default"
      });
      router.refresh();
    } else {
      throw new Error(data.error);
    }
  } catch (error: any) {
    toast({
      title: "❌ Error al activar",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setActivating(false);
  }
};
```

#### Integración CampaignsList (TASK_07)

```typescript
// src/components/dashboard/CampaignsList.tsx

// Detectar si es employee-based
const isEmployeeBased = campaign.campaignType?.flowType === 'employee-based';
const cycleId = campaign.performanceCycle?.id;

// Botón condicional
<Button onClick={() => {
  if (isEmployeeBased && cycleId) {
    router.push(`/dashboard/admin/performance-cycles/${cycleId}`);
  } else {
    router.push(`/dashboard/campaigns/${campaign.id}`);
  }
}}>
  {isEmployeeBased ? (
    <>
      <BarChart3 className="w-4 h-4 mr-2" />
      Gestionar Ciclo
    </>
  ) : (
    'Ver Campaña'
  )}
</Button>

// Badge indicador
{isEmployeeBased && (
  <Badge className="bg-purple-500/20 text-purple-400">
    <Users className="w-3 h-3 mr-1" />
    Evaluación
  </Badge>
)}
```

---

## 🗂️ ESTRUCTURA DE ARCHIVOS

### Services

```
src/lib/services/
├── CompetencyService.ts        # Snapshot + filtrado por track
├── EvaluationService.ts        # Generadores + FIX Participants
├── EmployeeSyncService.ts      # Carga CSV (v1)
└── PositionAdapter.ts          # Mapeo cargos (v1)
```

### APIs

```
src/app/api/admin/
├── performance-cycles/
│   ├── route.ts                # GET lista, POST crear
│   └── [id]/
│       ├── route.ts            # GET detalle, PATCH estado
│       └── generate/
│           └── route.ts        # POST generar evaluaciones
└── competencies/
    ├── route.ts                # GET lista, POST crear
    └── [id]/
        └── route.ts            # GET/PATCH/DELETE
```

### Páginas

```
src/app/dashboard/admin/
├── performance-cycles/
│   ├── page.tsx                # Lista de ciclos
│   └── [id]/
│       └── page.tsx            # Detalle + acciones
└── competencias/
    └── page.tsx                # Biblioteca de competencias
```

### Componentes UI

```
src/components/
├── ui/
│   ├── dialog.tsx              # Modal base
│   ├── toast.tsx               # Toast notifications
│   └── use-toast.ts            # Hook useToast
└── dashboard/
    └── CampaignsList.tsx       # + flowType detection
```

---

## 🔗 CONEXIONES ENTRE COMPONENTES

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE DATOS COMPLETO                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ADMINISTRADOR                                                           │
│       │                                                                  │
│       ▼                                                                  │
│  /admin/competencias ───▶ CompetencyService ───▶ Competency Model       │
│       │                                                │                 │
│       │                                                ▼                 │
│       ▼                                         generateSnapshot()       │
│  /campaigns/new (Wizard)                               │                 │
│       │                                                │                 │
│       ▼                                                │                 │
│  Campaign + PerformanceCycle ◀─────────────────────────┘                │
│  (VINCULADOS via campaignId)                                            │
│       │                                                                  │
│       ▼                                                                  │
│  /performance-cycles/[id] ───▶ "Generar Evaluaciones"                   │
│       │                              │                                   │
│       │                              ▼                                   │
│       │                    EvaluationService                             │
│       │                    generateManagerEvaluations()                  │
│       │                              │                                   │
│       │                              ▼                                   │
│       │               ┌──────────────┴──────────────┐                   │
│       │               │                             │                   │
│       │               ▼                             ▼                   │
│       │      EvaluationAssignment            Participant                │
│       │      • evaluatorId                   • nationalId=EVALUATEE     │
│       │      • evaluateeId                   • email=EVALUADOR          │
│       │      • SNAPSHOT                      • evaluationAssignmentId   │
│       │               │                             │                   │
│       │               └──────────┬──────────────────┘                   │
│       │                          │                                       │
│       │                          ▼                                       │
│       │              Campaign.totalInvited = N                          │
│       │                          │                                       │
│       │                          ▼                                       │
│       ▼                   Status: SCHEDULED                             │
│  "Activar Ciclo"                 │                                       │
│       │                          │                                       │
│       ▼                          ▼                                       │
│  Status: ACTIVE ◀────────────────┘                                      │
│       │                                                                  │
│       ▼                                                                  │
│  EVALUADOR (Jefe)                                                        │
│       │                                                                  │
│       ▼                                                                  │
│  /dashboard/evaluaciones (Portal del Jefe)                              │
│       │                                                                  │
│       ▼                                                                  │
│  /encuesta/[token] ───▶ CompetencyService.filterByTrack()               │
│       │                  (filtra por performanceTrack del evaluatee)    │
│       │                                                                  │
│       ▼                                                                  │
│  Response ───▶ Assignment.status = COMPLETED                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Biblioteca de Competencias
- [x] Modelo Competency con categorías y audienceRules
- [x] CompetencyService.generateSnapshot() funcional
- [x] CompetencyService.filterByTrack() filtra correctamente
- [x] Snapshot se congela al crear ciclo
- [x] UI /admin/competencias operativa

### Gestión de Ciclos (TASK_04 + TASK_08)
- [x] Wizard pasa campaignId al crear cycle
- [x] API guarda campaignId en PerformanceCycle
- [x] Schema: evaluationAssignmentId en Participant
- [x] Schema: Constraint triple funcional
- [x] EvaluationService crea Participant por cada Assignment
- [x] nationalId = EVALUATEE, email = EVALUADOR
- [x] Assignment.participantId se actualiza
- [x] Campaign.totalInvited se actualiza
- [x] Auto-transición DRAFT → SCHEDULED al generar
- [x] Máquina de estados validada

### UX Enterprise
- [x] Modal confirmación "Generar Evaluaciones"
- [x] Modal confirmación "Activar Ciclo"
- [x] Toast success con información descriptiva
- [x] Toast error con mensaje claro
- [x] Loader2 spinner durante procesamiento
- [x] CampaignsList detecta flowType
- [x] Botón "Gestionar Ciclo" para employee-based
- [x] Badge indicador de tipo

### Productos Legacy (Backwards Compatibility)
- [x] Pulso Express funciona sin cambios
- [x] Experiencia Full funciona sin cambios
- [x] Exit Intelligence funciona sin cambios
- [x] Onboarding Journey funciona sin cambios

---

## 📚 DOCUMENTOS DE REFERENCIA

| Documento | Propósito |
|-----------|-----------|
| `IMPLEMENTACION_POST_BACKEND_PERFORMANCE_v1.md` | Capas 1-5 (Ingesta, Clasificación, Validación, Manager, Config) |
| `TRASPASO_EVALUACION_DESEMPENO_COMPLETO.md` | Contexto histórico y decisiones |
| `CIERRE_SESSION_PERFORMANCE_CYCLES.md` | Estado de TASKs al cierre |
| `TASK_04_FIX_CAMPAIGN_CYCLE_LINK.md` | Fix vinculación Campaign ↔ Cycle |
| `TASK_08_CORE_FIX_PARTICIPANTS_GAP.md` | Fix medular de Participants |
| `TASK_UX_PERFORMANCE_CYCLES.md` | Especificación UX Enterprise |

---

## 🎯 ESTADO FINAL DEL MÓDULO

```
┌─────────────────────────────────────────────────────────────────┐
│              EMPLOYEE PERFORMANCE v3.0.1                        │
│              Estado: ✅ PRODUCTION READY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COMPLETADO:                                                    │
│  ✅ Backend completo (Schema + Services + APIs)                 │
│  ✅ Ingesta de nómina (Smart Batch Import)                      │
│  ✅ Clasificación de cargos (PositionAdapter)                   │
│  ✅ Biblioteca de competencias (Snapshot inmutable)             │
│  ✅ Gestión de ciclos (Crear, Generar, Activar)                │
│  ✅ Fix GAP Participants (TASK_08 CORE)                         │
│  ✅ UX Enterprise (Modales + Toasts)                            │
│  ✅ Portal del Jefe (diseño + navegación)                       │
│                                                                 │
│  PENDIENTE (Fase futura):                                       │
│  ⏳ Backend de cierre (cálculo resultados)                      │
│  ⏳ Reportes 360° con anonimato                                 │
│  ⏳ Integración Torre de Control                                │
│  ⏳ Correlación con otros productos (Clima)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Fin del documento v2.0**

*Generado para FocalizaHR Enterprise - Sistema de Inteligencia Organizacional*
*Enero 2026*
