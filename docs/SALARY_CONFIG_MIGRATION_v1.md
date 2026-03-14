# SalaryConfig Migration — Documentación Técnica v1.1

> **Migración completa de salarios hardcodeados → configuración empresa-específica**
> Fecha: 2026-03-14 | Estado: Completado | Commit: 648ba89

---

## 1. PROBLEMA ORIGINAL

Todos los cálculos financieros usaban `$1,200,000 CLP/mes` hardcodeado. Costos idénticos para todas las empresas.

---

## 2. JERARQUÍA DE FALLBACK (3 Niveles)

### Código fuente: `src/lib/services/SalaryConfigService.ts:65-156`

```typescript
// NIVEL 1a (líneas 84-102): Salario específico por nivel de cargo
// Requiere: salaryByJobLevel + acotadoGroup válido
if (account.salaryByJobLevel && isValidSalaryCategory(acotadoGroup)) {
  const salaryConfig = account.salaryByJobLevel as SalaryByJobLevel
  const levelSalary = salaryConfig[acotadoGroup as keyof SalaryByJobLevel]
  // → source: 'empresa_nivel', confidence: 'high'
}

// NIVEL 1b (líneas 105-131): Promedio ponderado SIN acotadoGroup
// Se activa cuando: hay salaryByJobLevel PERO el consumidor no dice qué nivel
if (account.salaryByJobLevel && !isValidSalaryCategory(acotadoGroup)) {
  const salaryConfig = account.salaryByJobLevel as SalaryByJobLevel
  const dist = (account.headcountDistribution as HeadcountDistribution)
               || CHILE_HEADCOUNT_DISTRIBUTION  // ← fallback si empresa no configuró

  const weightedAvg = Math.round(
    (salaryConfig.alta_gerencia * dist.alta_gerencia) +
    (salaryConfig.mandos_medios * dist.mandos_medios) +
    (salaryConfig.profesionales * dist.profesionales) +
    (salaryConfig.base_operativa * dist.base_operativa)
  )
  // → source: 'empresa_nivel', confidence: 'high'
}

// NIVEL 2 (líneas 133-148): Promedio general empresa
// Se activa cuando: NO hay salaryByJobLevel, pero sí averageMonthlySalary
if (account.averageMonthlySalary && account.averageMonthlySalary > 0) {
  // → source: 'empresa_promedio', confidence: 'medium'
}

// NIVEL 3 (líneas 150-156): Default Chile
// Se activa cuando: no hay NADA configurado
// → $1,200,000 CLP/mes, source: 'default_chile', confidence: 'low'
```

### Distribución default Chile (`src/config/SalaryConfig.ts:44-49`)

```typescript
export const CHILE_HEADCOUNT_DISTRIBUTION = {
  alta_gerencia: 0.10,   // 10%
  mandos_medios: 0.20,   // 20%
  profesionales: 0.35,   // 35%
  base_operativa: 0.35   // 35%
}
```

### Ejemplo real verificado en producción

```
Cuenta con salaryByJobLevel, SIN headcountDistribution:
  alta_gerencia:  $4,500,000 × 0.10 = $  450,000
  mandos_medios:  $3,500,000 × 0.20 = $  700,000
  profesionales:  $2,800,000 × 0.35 = $  980,000
  base_operativa: $1,850,000 × 0.35 = $  647,500
                                       ─────────
  Promedio ponderado:                  $2,777,500 ✅ (verificado con API)
```

---

## 3. ARCHIVOS MODIFICADOS — REFERENCIA POR LÍNEA

### Archivos nuevos (6)

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `src/config/SalaryConfig.ts` | 112 | Defaults Chile, constantes SHRM, validators |
| `src/lib/services/SalaryConfigService.ts` | 305 | Servicio principal: fallback 3 niveles, CRUD, turnover cost |
| `src/app/api/settings/salary-config/route.ts` | 145 | GET/POST con RBAC y multi-tenant |
| `src/components/settings/SalaryConfigSettings.tsx` | 484 | UI config simple/detallado, dirty tracking |
| `src/app/dashboard/configuracion/empresa/page.tsx` | 60 | Página wrapper |
| `docs/SALARY_CONFIG_MIGRATION_v1.md` | este archivo | Documentación técnica |

### Archivos modificados — Server-side (APIs y servicios)

| Archivo | Líneas clave | Qué cambió |
|---------|-------------|------------|
| `prisma/schema.prisma:222-229` | 6 campos nuevos en Account | `averageMonthlySalary Int?`, `salaryByJobLevel Json?`, `headcountDistribution Json?`, `turnoverBaselineRate Float?`, `headcount Int?`, `newHiresPerYear Int?` |
| `src/lib/services/AuthorizationService.ts:537-549` | 2 permisos nuevos | `salary-config:view`, `salary-config:edit` |
| `src/engines/RetentionEngine.ts:50-52` | Llamada async | `SalaryConfigService.getSalaryForAccount(accountId)` sin acotadoGroup → Nivel 1b |
| `src/lib/services/ExitAggregationService.ts:1017-1025` | getGlobalMetrics enriquecido | Devuelve `turnoverCostPerExit`, `totalTurnoverCost`, `salarySource` |
| `src/app/api/exit/causes/route.ts:372-374` | ROI section | `getSalaryForAccount(accountId)` + `calculateTurnoverCost()` |
| `src/app/api/exit/insights/onboarding-correlation/route.ts:243-245` | Costo evitable | `getSalaryForAccount(accountId)` → `costPerExit` |
| `src/lib/services/OnboardingEffectivenessAnalyzer.ts:153-154` | ROI mensual | `getSalaryForAccount(accountId)` → `avgTurnoverCost` |
| `src/app/api/exit/alerts/[id]/route.ts:313-318` | GET response enriquecido | Inyecta `avgSalary` y `salarySource` en response JSON |
| `src/app/api/onboarding/alerts/route.ts:182-186` | GET response enriquecido | Inyecta `avgSalary` y `salarySource` en `data` |
| `src/lib/financialCalculations.ts:500` | Fix multiplicador | `turnoverMultiplier: 6.0 → 0.5` (6 sueldos = 0.5x anual) |
| `src/config/impactAssumptions.ts` | Deprecation marker | `average_salaries_by_sector` marcado como deprecated |
| `src/types/exit.ts:889-902` | ExitMetricsSummary | 3 campos nuevos: `turnoverCostPerExit`, `totalTurnoverCost`, `salarySource` |

### Archivos modificados — Client-side (hooks, componentes, engines)

| Archivo | Líneas clave | Qué cambió |
|---------|-------------|------------|
| `src/hooks/useRetentionAnalysis.ts:35-95` | useMemo → useEffect | RetentionEngine.analyze es ahora async |
| `src/hooks/useOnboardingAlerts.ts:72,94,137,231` | Nuevo estado avgSalary | `setAvgSalary(result.data.avgSalary)`, expone en return |
| `src/app/dashboard/exit/overview/page.tsx:53` | Backend-driven | `const totalCost = summary?.totalTurnoverCost \|\| 0` (ya no calcula en cliente) |
| `src/app/dashboard/exit/alerts/[id]/page.tsx:97` | Usa backend salary | `avgSalary: data.avgSalary` en vez de hardcoded `2_500_000` |
| `src/components/onboarding/AlertsCommandCenter.tsx:17,60,71` | Pasa avgSalary | Desestructura del hook, pasa a MoneyWall y GroupedFeed |
| `src/components/onboarding/AlertsMoneyWall.tsx:20,39,91` | Recibe y usa avgSalary | Pasa al engine como 3er parámetro |
| `src/components/onboarding/AlertsGroupedFeed.tsx:27,72,239,251` | Recibe y usa avgSalary | Pasa al engine como 3er parámetro |
| `src/components/onboarding/AlertasGerenciaRanking.tsx:73,80-82` | Hook avgSalary | `avgSalary \|\| CHILE_SALARY_DEFAULTS.promedio_general` como fallback |
| `src/engines/OnboardingAlertEngine.ts:65-96` | 3er parámetro currentSalary | `_currentSalary` pasado a `calculateOnboardingFinancialImpact({ currentSalary })` en 7 generadores |
| `src/engines/ExitAlertEngine.ts:142-144` | Sin cambio en engine | Ya tenía `context?.avgSalary \|\| getAverageSalary()`, el fix fue en la API que inyecta avgSalary |
| `src/components/dashboard/DashboardNavigation.tsx:116,197-204` | Nav link nuevo | DollarSign icon, ruta `/dashboard/configuracion/empresa`, RBAC |

---

## 4. MULTIPLICADORES DE COSTO ROTACIÓN

### Rotación general (`SalaryConfigService.calculateTurnoverCost`, línea 162-178)

Aplicados sobre **salario anual** (mensual × 12):

| Nivel | Multiplicador | Ejemplo ($2.8M/mes) | Fuente |
|-------|--------------|---------------------|--------|
| Alta Gerencia | 2.0x | $67.2M | SHRM 2024 |
| Mandos Medios | 1.5x | $50.4M | SHRM 2024 |
| Profesionales | 1.25x | $42.0M | SHRM 2024 |
| Base Operativa | 0.75x | $25.2M | SHRM 2024 |
| Sin nivel | 1.25x (default) | $42.0M | SHRM 2024 |

### Rotación temprana onboarding (`financialCalculations.ts:500,635-637`)

| Multiplicador | Fórmula | Ejemplo ($2.77M/mes) |
|--------------|---------|---------------------|
| 0.5x anual = 6 sueldos | `mensual × 12 × 0.5` | $16,665,000 |

**Bug corregido**: Era `6.0` (72 sueldos) → ahora `0.5` (6 sueldos).

---

## 5. DEBUGGING — QUERIES Y LOGS

### Verificar qué salario tiene una cuenta

```sql
-- Supabase SQL Editor
SELECT
  id,
  company_name,
  average_monthly_salary,
  salary_by_job_level,
  headcount_distribution
FROM accounts
WHERE id = 'ACCOUNT_ID';
```

### Verificar qué salario devuelve la API

```bash
# Desde el navegador (con sesión activa)
GET /api/settings/salary-config

# Response incluye:
# - data.effectiveSalary → el salario que se usa
# - data.source → "Configuracion por nivel" | "Promedio empresa" | "Default Chile"
# - data.hasCustomConfig → true/false
```

### Verificar qué salario usa Exit Overview

```bash
# Abrir DevTools > Network > filtrar "exit/metrics"
# En response buscar:
#   summary.turnoverCostPerExit → costo por salida
#   summary.totalTurnoverCost → total
#   summary.salarySource → "empresa_nivel" | "empresa_promedio" | "default_chile"
```

### Verificar qué salario usa Onboarding Alerts

```bash
# DevTools > Network > filtrar "onboarding/alerts"
# En response buscar:
#   data.avgSalary → salario mensual usado
#   data.salarySource → fuente
```

### Verificar qué salario usa Exit Alert Detail

```bash
# DevTools > Network > filtrar "exit/alerts/"
# En response buscar:
#   data.avgSalary → salario mensual inyectado
#   data.salarySource → fuente
```

### Verificar personas únicas vs alertas en BD

```sql
-- Desglose por status
SELECT
  ja.status,
  COUNT(DISTINCT ja.journey_id) as personas_unicas,
  COUNT(*) as total_alertas
FROM journey_alerts ja
WHERE ja.account_id = 'ACCOUNT_ID'
GROUP BY ja.status;

-- Detalle por persona
SELECT
  ja.journey_id,
  jo.full_name,
  COUNT(*) as alertas,
  STRING_AGG(DISTINCT ja.severity, ', ') as severidades
FROM journey_alerts ja
JOIN journey_orchestrations jo ON jo.id = ja.journey_id
WHERE ja.status = 'pending'
  AND ja.account_id = 'ACCOUNT_ID'
GROUP BY ja.journey_id, jo.full_name
ORDER BY alertas DESC;
```

### Validar cálculo del promedio ponderado

```sql
-- Si salarySource = "empresa_nivel" pero el monto no cuadra
SELECT
  salary_by_job_level->>'alta_gerencia' as alta,
  salary_by_job_level->>'mandos_medios' as mandos,
  salary_by_job_level->>'profesionales' as prof,
  salary_by_job_level->>'base_operativa' as base,
  headcount_distribution
FROM accounts
WHERE id = 'ACCOUNT_ID';

-- Calcular manualmente (si headcount_distribution es null, usa 10/20/35/35):
-- promedio = (alta × 0.10) + (mandos × 0.20) + (prof × 0.35) + (base × 0.35)
```

### Logs del servidor

```bash
# En la terminal del dev server, buscar:
# [Exit Causes] → API exit/causes
# [Exit Metrics] → API exit/metrics
# [Exit Alert GET] → API exit/alerts/[id]
# [API /onboarding/alerts] → API onboarding/alerts
```

---

## 6. FLUJO DE DATOS — SERVER → CLIENT

### Patrón Server-side (APIs con acceso a BD)

```
Request
  → middleware inyecta x-account-id header
  → extractUserContext(request) → { accountId }
  → SalaryConfigService.getSalaryForAccount(accountId)
    → Prisma query Account (id, salaryByJobLevel, headcountDistribution, averageMonthlySalary)
    → Nivel 1a/1b/2/3 según datos disponibles
    → return { monthlySalary, source, confidence }
  → Cálculos con monthlySalary
  → Response JSON incluye costos calculados
```

### Patrón Client-side (componentes React sin acceso a Prisma)

```
API response incluye avgSalary (calculado server-side)
  → Hook (useOnboardingAlerts, useExitMetrics) expone avgSalary
  → Componente orquestador (AlertsCommandCenter) pasa avgSalary como prop
  → Componente hijo (AlertsMoneyWall) pasa a Engine como 3er parámetro
  → Engine (OnboardingAlertEngine) guarda en _currentSalary
  → calculateOnboardingFinancialImpact({ currentSalary: _currentSalary })
    → Si currentSalary existe: usa ese
    → Si undefined: fallback ONBOARDING_FINANCIAL_CONFIG.avgSalaryChile ($1.2M × 12)
```

**Principio**: El backend es dueño de la lógica financiera. El cliente solo muestra.

---

## 7. TABLA DE CONSUMIDORES — TRAZABILIDAD COMPLETA

| # | Archivo | Tipo | Cómo obtiene salario | Línea | Nivel que usa |
|---|---------|------|---------------------|-------|--------------|
| 1 | `RetentionEngine.ts` | Server async | `getSalaryForAccount(accountId)` | 50-52 | 1b |
| 2 | `ExitAggregationService.ts` | Server async | `getSalaryForAccount(accountId)` | 1017 | 1b |
| 3 | `exit/causes/route.ts` | Server API | `getSalaryForAccount(accountId)` | 372 | 1b |
| 4 | `exit/insights/onboarding-correlation` | Server API | `getSalaryForAccount(userContext.accountId)` | 243 | 1b |
| 5 | `OnboardingEffectivenessAnalyzer.ts` | Server service | `getSalaryForAccount(accountId)` | 153 | 1b |
| 6 | `exit/alerts/[id]/route.ts` | Server API | `getSalaryForAccount(accountId)` → inyecta en response | 313 | 1b |
| 7 | `onboarding/alerts/route.ts` | Server API | `getSalaryForAccount(accountId)` → inyecta en response | 182 | 1b |
| 8 | `exit/overview/page.tsx` | Client | `summary.totalTurnoverCost` del backend | 53 | Indirecto (via #2) |
| 9 | `exit/alerts/[id]/page.tsx` | Client | `data.avgSalary` del backend | 97 | Indirecto (via #6) |
| 10 | `AlertsMoneyWall.tsx` | Client | `avgSalary` prop → engine 3er param | 91 | Indirecto (via #7) |
| 11 | `AlertsGroupedFeed.tsx` | Client | `avgSalary` prop → engine 3er param | 239,251 | Indirecto (via #7) |
| 12 | `AlertasGerenciaRanking.tsx` | Client | `avgSalary` del hook, fallback Chile | 80-82 | Indirecto (via #7) |
| 13 | `ExitAlertEngine.ts` | Client engine | `context.avgSalary` (inyectado por #6) | 260 | Indirecto |
| 14 | `OnboardingAlertEngine.ts` | Client engine | `_currentSalary` (inyectado por #10/#11) | 7 generadores | Indirecto |

**Ningún consumidor pasa acotadoGroup.** Todos usan Nivel 1b (promedio ponderado).

---

## 8. ROLES Y PERMISOS

### AuthorizationService.ts líneas 537-549

| Permiso | Roles |
|---------|-------|
| `salary-config:view` | FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CEO |
| `salary-config:edit` | FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN |

### Navegación (`DashboardNavigation.tsx:116`)

Visible para: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CLIENT.

---

## 9. SCHEMA — CAMPOS EN ACCOUNT

```prisma
// prisma/schema.prisma líneas 222-229
averageMonthlySalary    Int?    @map("average_monthly_salary")
salaryByJobLevel        Json?   @map("salary_by_job_level")
headcountDistribution   Json?   @map("headcount_distribution")
turnoverBaselineRate    Float?  @map("turnover_baseline_rate")
headcount               Int?    @map("headcount")
newHiresPerYear         Int?    @map("new_hires_per_year")
```

### Estructura JSON de `salaryByJobLevel`

```json
{
  "alta_gerencia": 4500000,
  "mandos_medios": 3500000,
  "profesionales": 2800000,
  "base_operativa": 1850000
}
```

### Estructura JSON de `headcountDistribution`

```json
{
  "alta_gerencia": 0.10,
  "mandos_medios": 0.20,
  "profesionales": 0.35,
  "base_operativa": 0.35
}
```

Si `headcountDistribution` es `null`, se usa `CHILE_HEADCOUNT_DISTRIBUTION` (10/20/35/35).

---

## 10. VERIFICACIÓN REALIZADA

```
✅ npx tsc --noEmit — 0 errores
✅ npx prisma validate — schema válido
✅ npx prisma db push — sincronizado
✅ next build — compilación limpia
✅ BD Supabase — 15 personas pending, 9 acknowledged (verificado SQL)
✅ exit/overview — totalTurnoverCost del backend, no hardcoded
✅ onboarding/alerts — $250M en riesgo (15 × $16.6M = $249.9M)
✅ onboarding/alerts — riesgo total $283.3M (incluye gestionadas)
✅ configuracion/empresa — POST guarda, GET lee, UI refleja
✅ salarySource: "empresa_nivel" — confirma fallback 1b activo
✅ Promedio ponderado: $2,777,500 verificado manualmente con SQL
```

---

**Versión:** 1.1 (versión técnica para debugging)
**Autor:** Claude Code + Victor Yáñez
**Fecha:** 2026-03-14
