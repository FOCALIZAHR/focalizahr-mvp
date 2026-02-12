# TASK: Rediseño UX Modal Activación Ciclo de Evaluación

## 📋 CONTEXTO
El modal actual de "Activar Ciclo de Evaluación" es genérico y no comunica al usuario las consecuencias reales de la acción. Solo dice "Esta acción no se puede deshacer. Una vez activado, el ciclo pasará a estado activo."

## 🎯 OBJETIVO
Rediseñar el modal para comunicar transparentemente TODAS las acciones que se ejecutarán al activar, siguiendo filosofía UX FocalizaHR premium.

## 📍 ARCHIVO A MODIFICAR

**Archivo:** `src/app/dashboard/admin/performance-cycles/[id]/page.tsx`
**Líneas:** 731-786 (Modal "Confirmar Activar Ciclo")

### Código Actual a Reemplazar (líneas 731-786):

```tsx
{/* ══════════════════════════════════════════════════════════════ */}
{/* MODAL: Confirmar Activar Ciclo                               */}
{/* ══════════════════════════════════════════════════════════════ */}
<Dialog open={showActivateModal} onOpenChange={setShowActivateModal}>
  <DialogContent className="bg-slate-900 border-slate-700">
    <DialogHeader>
      <DialogTitle className="text-white text-lg">
        ¿Activar Ciclo de Evaluación?
      </DialogTitle>
      <DialogDescription className="text-slate-400">
        Esto habilitará las evaluaciones y los evaluadores podrán comenzar a responder.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-3 py-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
        <Users className="w-5 h-5 text-cyan-400" />
        <div>
          <p className="text-sm text-white font-medium">{stats?.total || 0} evaluaciones</p>
          <p className="text-xs text-slate-400">serán habilitadas para responder</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-300">
          Esta acción no se puede deshacer. Una vez activado, el ciclo pasará a estado activo.
        </p>
      </div>
    </div>

    <DialogFooter className="gap-2">
      <Button
        variant="outline"
        onClick={() => setShowActivateModal(false)}
        className="border-slate-600 text-slate-300 hover:bg-slate-800"
      >
        Cancelar
      </Button>
      <Button
        onClick={handleActivateCycle}
        disabled={activating}
        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
      >
        {activating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Activando...
          </>
        ) : (
          'Sí, Activar Ciclo'
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Imports Adicionales Necesarios (línea ~7):
Agregar a los imports existentes:
```tsx
import { Rocket, Bell, UserCircle } from 'lucide-react';
```

## 🎨 PATRONES DE DISEÑO
**OBLIGATORIO:** Leer y aplicar `.claude/task/focalizahr-ui-design-standards.md`
**MODO:** Cinema mode (glassmorphism, gradientes sutiles, espaciado generoso)

## 📐 ESPECIFICACIÓN DEL NUEVO MODAL

### Estructura Visual

```tsx
<Dialog>
  <DialogContent className="sm:max-w-lg bg-slate-900/95 backdrop-blur-xl border border-white/10">
    
    {/* Header con ícono y título */}
    <DialogHeader>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
          <Rocket className="w-6 h-6 text-cyan-400" />
        </div>
        <DialogTitle className="text-xl font-semibold text-white">
          ¿Activar Ciclo de Evaluación?
        </DialogTitle>
      </div>
      <DialogDescription className="text-slate-400 mt-2">
        Al activar, se ejecutarán las siguientes acciones:
      </DialogDescription>
    </DialogHeader>

    {/* Cards de Consecuencias */}
    <div className="space-y-3 my-6">
      
      {/* Card 1: Emails */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <p className="font-medium text-white">
              {evaluatorCount} evaluadores recibirán email de invitación
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Envío inmediato a sus correos corporativos
            </p>
          </div>
        </div>
      </div>

      {/* Card 2: Autoevaluaciones (si aplica) */}
      {cycle.includesSelf && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-start gap-3">
            <UserCircle className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="font-medium text-white">
                {selfEvaluationCount} autoevaluaciones habilitadas
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Cada colaborador podrá evaluarse a sí mismo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Card 3: Fecha límite */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <p className="font-medium text-white">
              Fecha límite: {formatDate(cycle.endDate)}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Los evaluadores tendrán {daysRemaining} días para completar
            </p>
          </div>
        </div>
      </div>

      {/* Card 4: Recordatorios */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-green-400 mt-0.5" />
          <div>
            <p className="font-medium text-white">
              Recordatorios automáticos activados
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Día 7: Amigable → Día 3: Urgente → Día 1: CC Gerente
            </p>
          </div>
        </div>
      </div>

    </div>

    {/* Warning */}
    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <p className="text-sm text-amber-200">
        Esta acción no se puede deshacer
      </p>
    </div>

    {/* Actions */}
    <DialogFooter className="mt-6 gap-3">
      <Button 
        variant="ghost" 
        onClick={onClose}
        className="text-slate-400 hover:text-white"
      >
        Cancelar
      </Button>
      <Button 
        onClick={handleActivate}
        disabled={isActivating}
        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-medium"
      >
        {isActivating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Activando...
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4 mr-2" />
            Activar y Notificar
          </>
        )}
      </Button>
    </DialogFooter>

  </DialogContent>
</Dialog>
```

### Datos Dinámicos Requeridos

El modal ya tiene acceso a estos datos (definidos en el componente):

```typescript
// Ya existe en el componente (línea 100-101):
const [cycle, setCycle] = useState<CycleDetail | null>(null);
const [stats, setStats] = useState<CycleStats | null>(null);

// CycleDetail incluye (líneas 41-59):
interface CycleDetail {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  includesManager: boolean;
  includesUpward: boolean;
  includesSelf: boolean;
  includesPeer: boolean;
  // ...
}

// CycleStats incluye (líneas 61-67):
interface CycleStats {
  total: number;      // Total evaluaciones (99 en ejemplo)
  pending: number;
  inProgress: number;
  completed: number;
  expired: number;
}
```

### Cálculos a Agregar

Agregar estos cálculos antes del return (aproximadamente línea 270):

```typescript
// Calcular días restantes hasta cierre
const daysRemaining = cycle ? 
  Math.ceil((new Date(cycle.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
  : 0;

// Formatear fecha
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Contar evaluaciones por tipo (aproximado basado en configuración)
const selfCount = cycle?.includesSelf ? Math.floor((stats?.total || 0) * 0.5) : 0;
const managerCount = cycle?.includesManager ? Math.floor((stats?.total || 0) * 0.5) : 0;
```

### Cálculos Necesarios

```typescript
// Días restantes hasta cierre
const daysRemaining = differenceInDays(cycle.endDate, new Date());

// Desglose por tipo (mostrar solo si > 0)
const breakdownItems = [
  { 
    show: stats.managerEvaluationCount > 0,
    icon: Users,
    color: 'text-cyan-400',
    title: `${stats.managerEvaluationCount} evaluaciones jefe → colaborador`,
    subtitle: 'Los jefes evaluarán a sus reportes directos'
  },
  {
    show: cycle.includesSelf && stats.selfEvaluationCount > 0,
    icon: UserCircle,
    color: 'text-purple-400',
    title: `${stats.selfEvaluationCount} autoevaluaciones`,
    subtitle: 'Cada colaborador se evaluará a sí mismo'
  },
  // ... peer, upward si aplican
];
```

## 🎨 COLORES ICONOS POR TIPO

| Tipo | Ícono | Color |
|------|-------|-------|
| Emails/Notificaciones | Mail | `text-cyan-400` |
| Autoevaluación | UserCircle | `text-purple-400` |
| Fecha/Calendario | Calendar | `text-amber-400` |
| Recordatorios | Bell | `text-green-400` |
| Warning | AlertTriangle | `text-amber-400` |
| Jefe→Colaborador | Users | `text-cyan-400` |
| Pares | UserPlus | `text-blue-400` |
| Upward | TrendingUp | `text-emerald-400` |

## ✅ CRITERIOS DE ACEPTACIÓN

1. [ ] Modal muestra número exacto de evaluaciones por tipo
2. [ ] Muestra fecha límite y días restantes
3. [ ] Indica que se enviarán emails (con conteo)
4. [ ] Muestra info de recordatorios automáticos
5. [ ] Botón dice "Activar y Notificar" no solo "Activar"
6. [ ] Loading state mientras procesa
7. [ ] Sigue patrones glassmorphism FocalizaHR
8. [ ] Responsive en móvil

## 🧪 PRUEBA VISUAL

Después de implementar, el modal debe verse premium y comunicar claramente:
- QUÉ pasará (emails, activación)
- CUÁNTOS (números exactos)
- CUÁNDO (fecha límite, días)
- QUÉ MÁS (recordatorios)

## 📚 REFERENCIAS

- Patrones UI: `.claude/task/focalizahr-ui-design-standards.md`
- Filosofía: Transparencia total, usuario informado, cero sorpresas
- Inspiración: Modales de Stripe, Linear, Notion
