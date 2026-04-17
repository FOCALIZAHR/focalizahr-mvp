# Plan de Implementación — Efficiency Intelligence Hub
## FocalizaHR · 4 Sesiones · Abril 2026

---

## Contexto

El CEO abre el hub cuando necesita tomar una decisión difícil y sale con un
Plan de Eficiencia guardado — con evidencia irrefutable, decisiones aprobadas
y proyección financiera — listo para presentar al directorio.

9 lentes en 3 familias. Carrito acumulador. Plan Documento persistente.

---

## Decisiones Arquitectónicas (cerradas)

| Decisión | Resolución |
|----------|------------|
| Ruta | `/dashboard/efficiency/` (page.tsx) + `/plan/[planId]/` |
| Permiso | `efficiency:view` — ADMIN, OWNER, HR_ADMIN, HR_MANAGER, CEO |
| L6 adaptabilidad | `potentialAbility === 3` del modelo AAE (escala 1-3) |
| L6 servicio | Via `PerformanceRatingService` como intermediario, no query directa a PerformanceRating |
| L3 clima | Jerarquía: Pulso reciente → Experiencia → potentialEngagement AAE (fallback con advertencia) → vacío + CTA |
| Carrito key | `employeeId` (nunca `lenteId`). Último lente actualiza, no duplica |
| SeniorityCompression | YA EXISTE en WorkforceIntelligenceService (interface + detection). Solo falta exponerlo en endpoint nuevo |
| Servicios existentes | SOLO CONSUMIR. No modificar. Agregar método nuevo solo si es estrictamente necesario |

---

## Servicios existentes verificados

| Servicio | Método | Para lente |
|----------|--------|------------|
| WorkforceIntelligenceService | `getOrganizationDiagnostic()` | L1,L2,L3,L4,L5,L7,L8 (todas las detecciones) |
| WorkforceIntelligenceService | `seniorityCompression` | L6 (ya tiene `CompressionOpportunity[]`) |
| WorkforceIntelligenceService | `retentionPriority.ranking` | L8+L9 (prescindibles + scores) |
| TalentFinancialFormulas | `calculateFiniquitoConTopeCustomUF()` | L9 (finiquitos) |
| TalentFinancialFormulas | `calculateFiniquitoFuturo()` | L9 (finiquitoQ2, Q4, costoEspera) |
| SalaryConfigService | `getSalaryForAccount()` | L5,L6,L9 (salarios por acotadoGroup) |
| PerformanceRatingService | ratings con `potentialAbility` | L6 (filtrar juniors con ability=3) |
| NPSAggregationService | scores por producto "pulso" | L3 (clima, fuente preferida) |
| AIExposureService | `getOrganizationExposure()` | L1,L2,L3 (exposición IA) |

---

## SESIÓN 1 — Backend: Motor + Endpoint Diagnóstico

### Bloque 1.1 — Permiso
**Archivo:** `src/lib/services/AuthorizationService.ts`
```
Agregar en PERMISSIONS:
'efficiency:view': ['FOCALIZAHR_ADMIN','ACCOUNT_OWNER','HR_ADMIN','HR_MANAGER','CEO']
```
**Verificar:** `npx tsc --noEmit`

### Bloque 1.2 — EfficiencyNarrativeEngine.ts
**Archivo:** `src/lib/services/efficiency/EfficiencyNarrativeEngine.ts`
- 9 templates (uno por lente) con variables `{PLACEHOLDER}`
- `compilarActo(lenteId, datos)` → reemplaza variables con datos reales
- Templates siguen skill focalizahr-narrativas (McKinsey, sin jerga RRHH)

### Bloque 1.3 — EfficiencyCalculator.ts
**Archivo:** `src/lib/services/efficiency/EfficiencyCalculator.ts`
- `calcularResumenCarrito(decisiones: DecisionItem[])` → totales
- `calcularProyecciones(ahorroMes, inversion)` → mes 3/6/12/24/36
- `payback = ahorroMes > 0 ? Math.ceil(inversion / ahorroMes) : null`
- Guard contra division por cero

### Bloque 1.4 — EfficiencyDataResolver.ts
**Archivo:** `src/lib/services/efficiency/EfficiencyDataResolver.ts`
- `resolverLente(accountId, lenteId, departmentIds?)` → datos específicos del lente
- Internamente llama a los servicios existentes según el lente
- L3 implementa jerarquía de fuentes clima:
  1. NPSAggregationService → campaign producto "pulso" < 6 meses
  2. NPSAggregationService → campaign producto "experiencia"
  3. potentialEngagement promedio por gerencia (fallback con flag `usandoFallback: true`)
  4. `null` → vacío + CTA

### Bloque 1.5 — Endpoint GET /api/efficiency/diagnostic
**Archivo:** `src/app/api/efficiency/diagnostic/route.ts`
- Patrón canónico: `extractUserContext → hasPermission('efficiency:view') → accountId`
- Llama `getOrganizationDiagnostic()` + `getOrganizationExposure()` (como workforce/diagnostic)
- Enriquece cada lente con:
  - L9: finiquitoQ2, finiquitoQ4, costoEspera por prescindible
  - L6: ya viene de `seniorityCompression` del diagnostic
  - L3: clima por gerencia con jerarquía de fuentes
- Compila narrativa por lente via `EfficiencyNarrativeEngine`
- Response: `{ familias: [...], lentes: { l1: {...}, ..., l9: {...} } }`

**Verificar:** `npx tsc --noEmit` + test manual con Thunder Client

---

## SESIÓN 2 — Frontend: Hub UI (3 familias + carrito)

### Bloque 2.1 — Navegación
**Archivo:** `src/components/dashboard/DashboardNavigation.tsx`
- Agregar link "Eficiencia" en dropdown "Executive Hub" o como item top-level
- Gated por `efficiency:view`

### Bloque 2.2 — page.tsx (Hub)
**Archivo:** `src/app/dashboard/efficiency/page.tsx`
- Fetch `GET /api/efficiency/diagnostic` al montar
- Estado: `{ lentes, carrito: Map<string, DecisionItem>, expandedLente }`
- Layout: `h-[calc(100vh-80px)] overflow-hidden` (zero scroll global)
- 3 columnas en desktop (1 por familia) con scroll interno cada una
- Mobile: stack vertical con scroll

### Bloque 2.3 — FamiliaSection.tsx
**Archivo:** `src/components/efficiency/lentes/FamiliaSection.tsx`
- Header con nombre de familia + color lateral (cyan / purple / amber)
- 3 LenteCards dentro
- Scroll interno `overflow-y-auto pb-32`

### Bloque 2.4 — LenteCard.tsx
**Archivo:** `src/components/efficiency/lentes/LenteCard.tsx`
- Glassmorphism card con Tesla line (color según familia)
- Métrica protagonista (número grande, font-extralight)
- Narrativa generada (texto McKinsey)
- Badge según tono (L2: "Pasivo Tóxico" destructive, L7: protector cyan/verde)
- L3: advertencia ruidosa si clima bajo + alta exposición
- CTA: "Agregar al plan" → añade al carrito
- Expandible: click → detalle con breakdown por persona/cargo

### Bloque 2.5 — CarritoBar.tsx
**Archivo:** `src/components/efficiency/carrito/CarritoBar.tsx`
- `position: fixed; bottom: 0` — SIEMPRE visible
- Muestra: N decisiones · FTE liberados · Ahorro/mes · Inversión · Payback
- Deduplicado por `employeeId` (Map, no array)
- CTA: "Ver Plan →" (habilitado si hay >= 1 decisión)
- Tesla line top cyan→purple
- z-[40] para no pisar ModuleToolbar z-[45]

**Verificar:** `npm run build` + test manual en browser

---

## SESIÓN 3 — Frontend: Plan Documento

### Bloque 3.1 — plan/[planId]/page.tsx
**Archivo:** `src/app/dashboard/efficiency/plan/[planId]/page.tsx`
- Carga plan desde API o desde estado del carrito (si es nuevo)
- Layout: scroll vertical elegante, no layout rígido (es un documento)

### Bloque 3.2 — MetricasResumen.tsx
**Archivo:** `src/components/efficiency/plan/MetricasResumen.tsx`
- 4 cards: FTE liberados | Ahorro/mes | Inversión | Payback
- Payback: `null` → "∞ Sin Breakeven" (guard division por cero)

### Bloque 3.3 — ProyeccionBars.tsx
**Archivo:** `src/components/efficiency/plan/ProyeccionBars.tsx`
- 5 barras horizontales: mes 3/6/12/24/36
- Rojo si negativo (aún en payback), verde si positivo
- Label: "+$Xm" o "-$Xm"
- Mes de payback destacado en amber

### Bloque 3.4 — ActoNarrativo.tsx
**Archivo:** `src/components/efficiency/plan/ActoNarrativo.tsx`
- Un acto por decisión aprobada
- Color lateral según familia (cyan/purple/amber)
- Narrativa editable (contentEditable o textarea)
- Botones: [Aprobar] [Eliminar del plan]
- Autosave con debounce 1.5s

### Bloque 3.5 — PlanDocument.tsx
**Archivo:** `src/components/efficiency/plan/PlanDocument.tsx`
- Ensambla: Header → Métricas → Proyección → Narrativa ejecutiva → Actos → Tesis
- Selector tesis: [Eficiencia] [Crecimiento] [Evolución]
- CTA final: [Guardar borrador] [Generar Business Case →]
- Business Case habilitado solo cuando TODAS las decisiones están aprobadas

**Verificar:** `npm run build` + test manual completo

---

## SESIÓN 4 — Persistencia + Export

### Bloque 4.1 — Modelo Prisma EfficiencyPlan
**Schema:**
```prisma
model EfficiencyPlan {
  id              String   @id @default(cuid())
  accountId       String   @map("account_id")
  createdBy       String   @map("created_by")
  nombre          String   @default("Plan sin nombre")
  estado          String   @default("borrador")
  tesisElegida    String   @default("eficiencia") @map("tesis_elegida")
  lentesActivos   String[] @map("lentes_activos")
  decisiones      Json     @db.JsonB
  narrativasEdit  Json     @default("{}") @map("narrativas_edit") @db.JsonB
  resumenSnap     Json     @default("{}") @map("resumen_snap") @db.JsonB
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  account         Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  @@index([accountId], map: "idx_efficiency_plan_account")
  @@map("efficiency_plans")
}
```
- Relación en Account: `efficiencyPlans EfficiencyPlan[]`
- `prisma db push`

### Bloque 4.2 — API CRUD
```
GET  /api/efficiency/plans             → listar (accountId, orderBy updatedAt desc)
POST /api/efficiency/plans             → crear (nombre + decisiones + narrativas)
PUT  /api/efficiency/plans/[planId]    → actualizar (autosave body parcial)
```
Todos con `extractUserContext + hasPermission('efficiency:view')`

### Bloque 4.3 — Export PDF
**Archivo:** `GET /api/efficiency/plans/[planId]/export`
- jsPDF + jspdf-autotable (ya instalados para calibration audit)
- Patrón Kit Comunicación v3.0
- SIN nombres de personas (sensibilidad directorio)
- Con narrativas editadas, proyecciones, métricas

**Verificar:** `npx tsc --noEmit` + save/load/export manual

---

## Archivos a crear (nuevos)

```
src/lib/services/efficiency/EfficiencyNarrativeEngine.ts
src/lib/services/efficiency/EfficiencyCalculator.ts
src/lib/services/efficiency/EfficiencyDataResolver.ts
src/app/api/efficiency/diagnostic/route.ts
src/app/api/efficiency/plans/route.ts
src/app/api/efficiency/plans/[planId]/route.ts
src/app/api/efficiency/plans/[planId]/export/route.ts
src/app/dashboard/efficiency/page.tsx
src/app/dashboard/efficiency/plan/[planId]/page.tsx
src/components/efficiency/EfficiencyHub.tsx
src/components/efficiency/lentes/FamiliaSection.tsx
src/components/efficiency/lentes/LenteCard.tsx
src/components/efficiency/carrito/CarritoBar.tsx
src/components/efficiency/plan/PlanDocument.tsx
src/components/efficiency/plan/ActoNarrativo.tsx
src/components/efficiency/plan/ProyeccionBars.tsx
src/components/efficiency/plan/MetricasResumen.tsx
```

## Archivos a modificar (existentes)

```
src/lib/services/AuthorizationService.ts    ← +permiso efficiency:view
src/components/dashboard/DashboardNavigation.tsx  ← +link Eficiencia
prisma/schema.prisma                        ← +modelo EfficiencyPlan (Sesión 4)
```

## Archivos a consultar (read-only, NO modificar)

```
src/lib/services/WorkforceIntelligenceService.ts  ← getOrganizationDiagnostic, seniorityCompression
src/lib/services/AIExposureService.ts             ← getOrganizationExposure
src/lib/services/SalaryConfigService.ts           ← getSalaryForAccount
src/lib/services/PerformanceRatingService.ts      ← potentialAbility
src/lib/services/NPSAggregationService.ts         ← clima Pulso
src/lib/utils/TalentFinancialFormulas.ts          ← finiquitos
```

---

## Orden de ejecución por sesión

```
SESIÓN 1 (backend):
  □ 1.1 Permiso efficiency:view → tsc
  □ 1.2 EfficiencyNarrativeEngine.ts
  □ 1.3 EfficiencyCalculator.ts
  □ 1.4 EfficiencyDataResolver.ts
  □ 1.5 GET /api/efficiency/diagnostic → tsc + test manual

SESIÓN 2 (hub UI):
  □ 2.1 Navegación
  □ 2.2 page.tsx (hub)
  □ 2.3 FamiliaSection.tsx
  □ 2.4 LenteCard.tsx
  □ 2.5 CarritoBar.tsx → build + test manual

SESIÓN 3 (plan documento):
  □ 3.1 plan/[planId]/page.tsx
  □ 3.2 MetricasResumen.tsx
  □ 3.3 ProyeccionBars.tsx
  □ 3.4 ActoNarrativo.tsx
  □ 3.5 PlanDocument.tsx → build + test manual

SESIÓN 4 (persistencia):
  □ 4.1 Prisma EfficiencyPlan + migrate
  □ 4.2 API CRUD planes
  □ 4.3 Export PDF → tsc + test e2e
```

---

*Plan generado: Abril 2026*
*Prerequisitos: 3 skills leídas + servicios verificados*
*Estimación: 4 sesiones de ~2h cada una*
