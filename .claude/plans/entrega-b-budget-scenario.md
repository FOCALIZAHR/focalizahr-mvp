# Plan — Entrega B: Persistencia BudgetScenario

## Contexto
El wizard de presupuesto (Entrega A) calcula todo en memoria. Al cerrar la
pestaña se pierde. Entrega B persiste escenarios para que el CEO pueda
guardar, comparar y reabrir — detectando cambios en la dotación real.

---

## BLOQUE 1 — Modelo Prisma

### 1.1 Schema `BudgetScenario`
```prisma
model BudgetScenario {
  id          String   @id @default(cuid())
  accountId   String
  createdBy   String   // email del usuario que creó
  name        String   // "Presupuesto 2026 v1"
  year        Int      // anioPresupuesto
  status      String   @default("draft") // draft | approved | archived

  // Estado completo del wizard (JSON opaco — el backend lo recalcula al reabrir)
  supuestos               Json  // SupuestosMacro serializado
  movimientos             Json  // Movimiento[] serializado
  provisionesSeleccionadas String[] // employeeIds seleccionados en Paso 4
  mesesSalidaPorPersona   Json  // Record<string, number>
  prescindiblesIds        String[] // IDs de listaRoja (dato opaco de /provisiones)

  // Snapshot al momento de guardar (para detección de cambios)
  headcountAlGuardar      Int
  masaSalarialAlGuardar   Float

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  account     Account  @relation(fields: [accountId], references: [id])

  @@index([accountId, year])
}
```

### 1.2 Migración
- `npx prisma migrate dev --name add_budget_scenario`
- Agregar relación en modelo Account: `budgetScenarios BudgetScenario[]`

---

## BLOQUE 2 — 3 Endpoints

### 2.1 POST `/api/workforce/presupuesto/scenarios/route.ts` (save)
- Body: `{ name, wizardState }` donde wizardState = todo lo que page.tsx tiene en estado
- Validar `workforce:budget:view` (guardar = ver)
- Guardar snapshot de headcount + masaSalarial actuales
- Retorna `{ id, name, createdAt }`

### 2.2 GET `/api/workforce/presupuesto/scenarios/route.ts` (list)
- Filtro: `accountId` del usuario, ordenados por `updatedAt DESC`
- Retorna array ligero: `{ id, name, year, status, createdAt, updatedAt }`

### 2.3 GET `/api/workforce/presupuesto/scenarios/[id]/route.ts` (load + detect changes)
- Carga BudgetScenario por id + accountId
- Query Employee actual: headcount + masaSalarial
- Detecta cambios:
  - `personasSalieron`: provisionesSeleccionadas IDs que ya no están ACTIVE
  - `personasNuevas`: headcount actual > headcountAlGuardar
  - `pasivoSubio`: masaSalarial actual > masaSalarialAlGuardar
- Retorna: `{ scenario, cambiosDetectados: { personasSalieron[], personasNuevas, deltaHeadcount, deltaMasaSalarial } }`

---

## BLOQUE 3 — Frontend

### 3.1 Botón "Guardar borrador" en Paso 5
- Actualmente disabled con placeholder
- Habilitar → abre mini-modal con input nombre + botón guardar
- POST /scenarios → feedback "Escenario guardado"

### 3.2 Selector de escenarios al entrar al wizard
- Si hay escenarios guardados → mostrar lista con "Reanudar" y "Nuevo"
- "Reanudar" → GET /scenarios/[id] → carga estado en wizard
- Si hay cambios detectados → Banner con chips:
  - "2 personas ya salieron" (chips rojos)
  - "Headcount subió de 309 a 312" (chip info)
  - "Recalcular" → re-POST /resultado con estado cargado

### 3.3 Banner de cambios detectados
- Card amarilla/ámbar debajo del título del wizard
- "Este escenario fue guardado el [fecha]. Desde entonces: [cambios]."
- Botón "Recalcular con datos actuales"

---

## Archivos a crear
```
prisma/migrations/XXXXX_add_budget_scenario/  ← auto
src/app/api/workforce/presupuesto/scenarios/route.ts      ← POST + GET list
src/app/api/workforce/presupuesto/scenarios/[id]/route.ts  ← GET load
src/components/workforce/presupuesto/SaveScenarioModal.tsx
src/components/workforce/presupuesto/ScenarioSelector.tsx
src/components/workforce/presupuesto/ChangeBanner.tsx
```

## Archivos a modificar
```
prisma/schema.prisma                        ← +modelo BudgetScenario
src/app/dashboard/workforce/presupuesto/page.tsx  ← habilitar guardar + cargar
src/components/workforce/presupuesto/ResultadoMensual.tsx  ← habilitar botón guardar
```

---

## Orden de ejecución
```
□ 1.1 Schema Prisma + migrate
□ 1.2 npx prisma generate
□ 2.1 POST /scenarios (save)
□ 2.2 GET /scenarios (list)
□ 2.3 GET /scenarios/[id] (load + detect)
□ 3.1 SaveScenarioModal + habilitar botón
□ 3.2 ScenarioSelector al entrar
□ 3.3 ChangeBanner
□ tsc --noEmit + test manual
```

## Verificación
```
□ Guardar escenario desde Paso 5 → aparece en lista
□ Reabrir → carga estado completo en wizard
□ Modificar un Employee (simular salida) → banner muestra cambios
□ Recalcular → Paso 5 recalcula con datos actuales
□ RBAC: AREA_MANAGER no puede guardar (no tiene workforce:budget:view)
```
