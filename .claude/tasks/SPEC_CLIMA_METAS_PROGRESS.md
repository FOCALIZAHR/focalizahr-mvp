# 📊 PROGRESO — SPEC Clima × Metas (Gate A / B / C)

**Fuente de verdad del plan:** `.claude/tasks/SPEC_CLIMA_METAS_INTEGRACION_v1.md`
**Este doc:** bitácora de avance + resultados de Gate 0 sellados con evidencia.
**Última actualización:** 2026-07-14

> Regla: lo que está acá **NO se re-investiga**. Si una sesión futura duda de un
> dato, verifica el file:line contra el código — no vuelve a explorar desde cero.

---

## Estado general

| Gate | Estado |
|---|---|
| **Gate 0 de Gate A** (investigación read-only §2.2) | ✅ **CERRADO** (2026-07-14, esta sesión) |
| **Gate A** (peso por ciclo + BUGs 1-6) | 🔲 PENDIENTE — listo para implementar |
| **Gate 0 de Gate B** (investigación §3.3) | 🟡 PARCIAL — 2 de 6 puntos ya respondidos |
| **Gate B** (categoría familia/subfamilia) | 🔲 PENDIENTE (bloqueado por Gate A) |
| **Gate C** (UX wizard) | 🔲 PENDIENTE (bloqueado por A + B) |

---

## ✅ GATE 0 DE GATE A — CERRADO. Los 4 puntos de §2.2, respondidos

### 1. Firma de `validateTotalWeight` y cómo se llama hoy

```ts
// src/lib/services/GoalsService.ts:640-662  (private static)
validateTotalWeight(accountId: string, employeeId: string, newWeight: number): Promise<void>
```

El `where` actual (`:645-653`): `accountId` + `employeeId` + `level: 'INDIVIDUAL'` +
`status: { in: ['NOT_STARTED','ON_TRACK','AT_RISK','BEHIND'] }`. Lanza si
`currentTotalWeight + newWeight > 100` (`:657`). **Sin `goalCycleId` — ese es el BUG 2.**

Invocada desde 3 lugares, **siempre dentro de `if (input.employeeId)`**:
- `cascadeGoal:218`
- `createManagerGoal:245`
- `createFromDevelopmentGoal:731`

`createCorporateGoal:185-195` **NO la llama** (correcto: una meta COMPANY no consume
presupuesto de nadie).

### 2. `GoalCycleService.getActiveCycle` desde `GoalsService` — sin dependencia circular

**Ya está importado y ya se usa.** No hay nada que resolver:

```ts
// GoalsService.ts:17
import { GoalCycleClosedError, GoalCycleValidationError, GoalCycleService } from './GoalCycleService'

// GoalsService.ts:1349-1351  ← el patrón a replicar
private static async resolveInheritedCycleId(accountId: string): Promise<string | null> {
  return (await GoalCycleService.getActiveCycle(accountId))?.id ?? null
}
```

### 3. ¿Puede llegar a `validateTotalWeight` sin ciclo activo? → **SÍ.** Decisión: fallar cerrado

Gate E vive **solo en las rutas**, no en el servicio:
- `api/goals/route.ts:330-336` → 409 si no hay ciclo activo
- `api/goals/from-pdi/route.ts:41-47` → mismo 409

Los **4 creadores de `GoalsService` siguen siendo invocables directo sin ciclo**
(`resolveInheritedCycleId` devuelve `null` sin romper). Prueba viviente: el seed
`seed-goals-demo.ts` llama al servicio directo, saltándose toda ruta.

→ **Decisión tomada (spec §2.1.1a): `validateTotalWeight` debe RECHAZAR con error de
dominio si no hay ciclo activo. Nunca fail-open.**

### 4. ¿El PATCH tiene `employeeId` / `accountId` para validar? → **SÍ, ya los tiene**

`src/app/api/goals/[id]/route.ts`:
- `context.accountId` disponible desde `extractUserContext` (`:200`)
- **`existing`** (`:215-220`) es el registro `Goal` COMPLETO, traído con
  `findFirst({ where: { id, accountId } })` → ya trae `employeeId`, `level`,
  `weight` (el viejo, para excluirlo de la suma) y **`goalCycleId`** (necesario
  para el guard de ciclo cerrado del punto 2c).

**No hace falta ninguna query extra.** Todo lo que Gate A necesita ya está cargado
antes del `prisma.goal.update` (`:246`).

**Nit de endurecimiento detectado (no es un bug hoy):** el `update` de `:246-248` usa
`where: { id }` **sin `accountId`**. Es seguro porque `existing` ya validó ownership
(`:215-220`), pero al tocar esa función conviene agregar `accountId` al `where` por
consistencia con la regla multi-tenant del proyecto.

---

## 🟡 GATE 0 DE GATE B — 2 de 6 puntos ya respondidos (no re-investigar)

| # | Pregunta (§3.3) | Estado |
|---|---|---|
| 1 | ¿`family`/`subfamily` en `Goal` es aditivo? | 🔲 pendiente (pero el precedente `goalCycleId` nullable, `schema.prisma:2892`, ya lo sugiere) |
| 2 | file:line de herencia de categoría (A vs D) | ✅ **RESPONDIDO** (ver abajo) |
| 3 | ¿`createFromDevelopmentGoal` necesita categoría? | 🔲 pendiente |
| 4 | Permiso de creación COMPANY/AREA | ✅ **RESPONDIDO: no existe ninguno (BUG 6).** Falta DECIDIR el set, no investigar |
| 5 | ¿`/dashboard/metas/estrategia` tiene UI de creación? | 🔲 pendiente |
| 6 | ¿El banco de Área filtra por departamento del jefe? | 🔲 pendiente |

**Punto 2 — dónde vive la herencia de categoría (confirmado):**
- Los 4 caminos convergen en **`GoalsService.cascadeGoal:202`** (llamada desde
  `GoalRulesEngine.ts:151` para el automático, y desde `api/goals/route.ts:357`
  para los manuales). **NO hay mecanismo privilegiado.**
- `cascadeGoal:227-232` construye con `prepareGoalData(input)` y solo sobrescribe
  `parentId`, `originType`, `isAligned` (del padre), `isOrphan`, `goalCycleId`.
  **Nunca copia `metricType`/`targetValue`/`title`/`description` del padre.**
- El camino automático **sí copia todo del padre**, pero lo hace **al armar el input**
  en `GoalRulesEngine.ts:155-168` (incluido `weight: rule.assignedWeight`, `:167`).
- → **La herencia de categoría va en `GoalRulesEngine` (input), NUNCA dentro de
  `cascadeGoal`**, o pisaría la categoría que el jefe eligió en el Camino D.

---

## 📌 Contexto de datos vigente (cuenta `cmfgedx7b…`, tras el saneamiento del 2026-07-13)

- **92 metas** (eran 217; se borraron 125 del seed contaminado — `52aa2d6`).
- Ciclos: **Q4 2026 = ACTIVE** · *Ciclo Vigente 2026* = **CLOSED** (tiene casi todas
  las metas individuales vivas) · S2 2026 y Año 2025 = PLANNING · Año 2027 = CLOSED.
- **Metas con `goalCycleId = null`: 0.** (No confundir con `isOrphan = true` (155 en su
  momento) = sin meta PADRE. Son conceptos distintos.)
- **3 empleados siguen >100% de peso** (145%, 130%, 124%) — metas de API de feb-2026,
  contemporáneas al nacimiento de `validateTotalWeight` (`f595883`, 2026-02-25).
  No son del seed. Gate A los deja fuera del presupuesto del ciclo activo automáticamente.
- `DESEMPEÑO_TP26` quedó con **`includeGoals = false`** (decisión de negocio, ver ficha).

⚠️ **Al activar Gate A:** el presupuesto disponible de ~47 empleados saltará a ~100%
porque sus metas vivas cuelgan del ciclo CLOSED. **Es correcto** (decisión de rollover),
pero parece un bug la primera vez que se ve. Ya advertido en la spec §4.2.

---

## Decisiones de negocio pendientes de Victor (bloquean Gate B, no Gate A)

1. **Set de roles "Estratega"** para crear COMPANY/AREA (BUG 6). `goals:cycles:manage`
   hoy es `[FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER]` — **sin CEO**
   (excluido a propósito en una decisión previa). ¿Mismo set u otro?
2. **Origen del "Sugerido: X%"** (spec §4.2): `Goal.weight` de la meta padre (hoy inerte)
   vs. `GoalCascadeRule.assignedWeight`.
3. **"Meta corporativa activa"** para la consulta de Clima (§3.4): ¿(a) el ciclo está
   ACTIVE, o (b) la meta no está en estado terminal?
4. Nombres finales de familias/subfamilias + mínimo de caracteres del campo
   "¿Cómo se mide?" (10 vs 15).

---

## Commits relacionados (sin pushear — push manual de Victor)

| Hash | Qué |
|---|---|
| `52aa2d6` | Scripts de auditoría: `cleanup-seed-goals-demo.ts` + `fix-tp26-include-goals.ts` |
| `59021a2` | Ficha de Metas (GoalCycle, cierre, peso, rollover, saneamiento) |
| `fd679fd` | `seed-goals-demo.ts` reescrito vía `GoalsService` (**aprobado, NO ejecutar**) |

---

## Próximo paso

**Implementar Gate A** siguiendo §2.1 de la spec (5 ítems + 1a + 1b + 3b). Gate 0 ya está
cerrado: no hace falta investigar nada más para empezar. El smoke de §2.3 tiene 12 casos.
