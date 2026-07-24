# Pendientes Activos — Metas

> **Lista viva, no historia.** Solo lo que bloquea (o podría bloquear) trabajo
> FUTURO. Se borra la fila al resolverse — no se acumula. El changelog histórico
> (lo que ya se hizo) vive en los docs de progreso de Metas y no se toca desde acá.
>
> **Práctica:** al descubrir algo que conviene decidir más adelante pero que NO
> bloquea el trabajo en curso, agregar una fila acá (NO una nota en el changelog).
> Al resolverse, borrar la fila; la resolución detallada queda en el documento vivo
> de la columna 4, no en este índice.

## Decisiones abiertas (NO bloqueantes)

| Qué falta | A qué bloquea | Estado | Dónde vive la resolución |
|---|---|---|---|
| Decidir si `validateTotalWeight` debe excluir `isLeaderGoal` para empleados sin reportes directos (igual que ya hace `team/route.ts` vía `visibleGoals`), o si `team/route.ts` debería empezar a incluirlas | Nada hoy — caso raro (persona con meta de líder pero 0 reportes directos). No bloquea Clima ni el trabajo de esta noche | Decisión de Victor, sin tomar | Este doc (ver detalle abajo) |

### `isLeaderGoal` — divergencia UI vs. validación de peso

Al colapsar el cálculo de presupuesto de peso a una fuente única (`src/lib/goals/weightBudget.ts`)
quedó en evidencia una divergencia **preexistente** de conjunto-de-entrada (NO de aritmética):

- **`team/route.ts`** computa el presupuesto sobre `visibleGoals`, que **excluye** las metas
  `isLeaderGoal: true` de quien no tiene reportes directos (`src/app/api/goals/team/route.ts:105`).
- **`GoalsService.validateTotalWeight`** cuenta **toda** meta INDIVIDUAL viva del ciclo activo,
  sin mirar `isLeaderGoal` ni reportes (`src/lib/services/GoalsService.ts:759` → `checkGoalWeight`).

**Efecto (solo en el caso raro):** una persona con una `isLeaderGoal` y 0 reportes directos vería
en la UI de `/team` MÁS presupuesto disponible del que la validación de escritura le permite gastar
— la UI podría dejar asignar algo que el server luego rechaza (o al revés). En el caso normal
(líder con reportes) no hay divergencia: la meta cuenta en ambos lados.

**Contexto — de dónde nace:** probablemente de una `GoalCascadeRule` con `isLeaderOnly = true`
(`src/lib/services/GoalRulesEngine.ts:168`, cascadea con `isLeaderGoal: rule.isLeaderOnly` y
`weight: rule.assignedWeight`), cuando la persona **después pierde sus reportes** (reorganización).
La meta de líder queda colgada de alguien que ya no lidera.

**Alcance de la decisión:** elegir UNA de las dos semánticas y unificar —
(a) que `validateTotalWeight`/`checkGoalWeight` también excluyan `isLeaderGoal` para no-managers, o
(b) que `team/route.ts` deje de excluirlas. Hoy la arquitectura preserva el comportamiento previo:
cada llamador decide QUÉ lista pasa a `filterBudgetGoals`; la función solo aplica el filtro de
presupuesto (INDIVIDUAL ∧ viva ∧ ciclo activo) encima. **No se toca sin decisión de Victor.**
