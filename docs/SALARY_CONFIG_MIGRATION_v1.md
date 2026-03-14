# SalaryConfig Migration — Documento Resumen v1.0

> **Migración completa de salarios hardcodeados → configuración empresa-específica**
> Fecha: 2026-03-14 | Estado: Completado

---

## 1. PROBLEMA ORIGINAL

Todos los cálculos financieros (costo rotación, ROI intervención, riesgo onboarding, exit intelligence) usaban un **salario hardcodeado** de $1,200,000 CLP/mes (promedio Chile). Esto producía:

- Costos idénticos para todas las empresas sin importar su realidad salarial
- ROI subestimado para empresas con salarios altos
- ROI sobreestimado para empresas con salarios bajos
- Cero personalización por cliente

---

## 2. ARQUITECTURA DE LA SOLUCIÓN

### Jerarquía de Fallback (3 Niveles)

```
NIVEL 1a: empresa_nivel (confidence: high)
  → Salario específico por nivel de cargo (acotadoGroup)
  → Requiere: salaryByJobLevel configurado + acotadoGroup válido
  → Ejemplo: RetentionEngine pide salario para "mandos_medios" → $2.2M

NIVEL 1b: empresa_nivel ponderado (confidence: high)
  → Promedio ponderado cuando hay salaryByJobLevel pero NO hay acotadoGroup
  → Fórmula: Σ (salario_nivel × distribución_nivel)
  → Usa distribución empresa si existe, sino default Chile
  → Ejemplo: Exit Overview pide "salario de esta cuenta" → promedio ponderado

NIVEL 2: empresa_promedio (confidence: medium)
  → Campo averageMonthlySalary de la cuenta
  → Para empresas que solo quieren poner un promedio general
  → Ejemplo: empresa pone $1,500,000 sin desglose

NIVEL 3: default_chile (confidence: low)
  → $1,200,000 CLP/mes (CHILE_SALARY_DEFAULTS.promedio_general)
  → Fallback de última instancia cuando no hay configuración
```

### Fórmula Nivel 1b (Promedio Ponderado)

```
promedio = (alta_gerencia × dist_alta)
         + (mandos_medios × dist_mandos)
         + (profesionales × dist_prof)
         + (base_operativa × dist_base)
```

**Distribución**: Si la empresa configuró `headcountDistribution`, se usa esa.
Si no, se usa el default Chile:

| Nivel | Default Chile |
|-------|--------------|
| Alta Gerencia | 10% |
| Mandos Medios | 20% |
| Profesionales | 35% |
| Base Operativa | 35% |

---

## 3. COMPONENTES CREADOS

### Configuración (Wave 1)

| Archivo | Propósito |
|---------|-----------|
| `src/config/SalaryConfig.ts` | Defaults Chile, constantes metodológicas, validators |
| `prisma/schema.prisma` | 6 campos nuevos en Account (averageMonthlySalary, salaryByJobLevel, headcountDistribution, turnoverBaselineRate, headcount, newHiresPerYear) |

### Servicio (Wave 2)

| Archivo | Propósito |
|---------|-----------|
| `src/lib/services/SalaryConfigService.ts` | CRUD + fallback 3 niveles + cálculo turnover cost |
| `src/lib/services/AuthorizationService.ts` | Permisos `salary-config:view`, `salary-config:edit` |

### API + UI (Wave 3)

| Archivo | Propósito |
|---------|-----------|
| `src/app/api/settings/salary-config/route.ts` | GET/POST con RBAC |
| `src/components/settings/SalaryConfigSettings.tsx` | UI simple/detallado con dirty tracking |
| `src/app/dashboard/configuracion/empresa/page.tsx` | Página de configuración |
| `src/components/dashboard/DashboardNavigation.tsx` | Link "Config. Salarial" (DollarSign icon) |

### Integración Engines (Wave 4)

| Archivo | Cambio |
|---------|--------|
| `src/engines/RetentionEngine.ts` | `getSalaryForAccount(accountId)` → async |
| `src/hooks/useRetentionAnalysis.ts` | useMemo → useEffect (async) |
| `src/lib/services/ExitAggregationService.ts` | `getGlobalMetrics()` devuelve `turnoverCostPerExit` + `totalTurnoverCost` |
| `src/app/api/exit/causes/route.ts` | `getSalaryForAccount(accountId)` para ROI |
| `src/app/api/exit/insights/onboarding-correlation/route.ts` | `getSalaryForAccount(accountId)` para costo evitable |
| `src/lib/services/OnboardingEffectivenessAnalyzer.ts` | `getSalaryForAccount(accountId)` para ROI |
| `src/app/dashboard/exit/overview/page.tsx` | Usa `summary.totalTurnoverCost` del backend |

### Fix Consumidores Client-Side (Post-Wave 4)

| Archivo | Cambio |
|---------|--------|
| `src/app/api/exit/alerts/[id]/route.ts` | Inyecta `avgSalary` en response |
| `src/app/dashboard/exit/alerts/[id]/page.tsx` | Usa `data.avgSalary` en vez de hardcoded $2.5M |
| `src/app/api/onboarding/alerts/route.ts` | Inyecta `avgSalary` en response |
| `src/hooks/useOnboardingAlerts.ts` | Expone `avgSalary` del backend |
| `src/components/onboarding/AlertsCommandCenter.tsx` | Pasa `avgSalary` a MoneyWall y GroupedFeed |
| `src/components/onboarding/AlertsMoneyWall.tsx` | Recibe `avgSalary`, pasa a engine |
| `src/components/onboarding/AlertsGroupedFeed.tsx` | Recibe `avgSalary`, pasa a engine |
| `src/components/onboarding/AlertasGerenciaRanking.tsx` | Usa `avgSalary` del hook |
| `src/engines/OnboardingAlertEngine.ts` | Acepta `currentSalary` 3er parámetro |

### Fix Multiplicador

| Archivo | Cambio |
|---------|--------|
| `src/lib/financialCalculations.ts` | `turnoverMultiplier: 6.0 → 0.5` (6 sueldos mensuales = 0.5x anual) |

---

## 4. PATRÓN ARQUITECTÓNICO

### Server-side (APIs que consultan BD)

```
extractUserContext(request) → accountId
  → SalaryConfigService.getSalaryForAccount(accountId)
  → Cálculos con salario real
  → Response incluye costos calculados
```

### Client-side (Componentes React)

```
API response incluye avgSalary
  → Hook expone avgSalary
  → Componente pasa avgSalary a Engine
  → Engine pasa a calculateOnboardingFinancialImpact({ currentSalary })
  → Si currentSalary undefined → fallback CHILE_SALARY_DEFAULTS
```

**Principio**: El backend es dueño de la lógica financiera. El cliente solo muestra.

---

## 5. MULTIPLICADORES DE COSTO ROTACIÓN

### SalaryConfigService.calculateTurnoverCost (Rotación general)

Aplicados sobre **salario anual**:

| Nivel | Multiplicador | Fuente |
|-------|--------------|--------|
| Alta Gerencia | 2.0x | SHRM 2024 |
| Mandos Medios | 1.5x | SHRM 2024 |
| Profesionales | 1.25x | SHRM 2024 |
| Base Operativa | 0.75x | SHRM 2024 |
| Sin nivel (default) | 1.25x | SHRM 2024 |

### calculateTurnoverCostSHRM2024 (Rotación temprana onboarding)

Aplicado sobre **salario anual**:

| Multiplicador | Equivalencia | Fuente |
|--------------|-------------|--------|
| 0.5x anual | 6 sueldos mensuales | SHRM 2024: rotación <6 meses |

---

## 6. PREGUNTA ABIERTA: ¿Cuándo se usa el promedio ponderado?

### Escenario: Empresa configura desglose por nivel pero NO entrega promedio

El sistema calcula automáticamente un **promedio ponderado** (Nivel 1b) cuando:

1. La empresa configuró `salaryByJobLevel` (4 niveles)
2. Pero el consumidor NO especifica `acotadoGroup` (nivel de cargo)

**¿Cuándo pasa esto?**

| Consumidor | ¿Pasa acotadoGroup? | ¿Usa Nivel 1b? |
|-----------|---------------------|----------------|
| Exit Overview (costo rotación global) | NO | SÍ |
| Exit Causes (ROI talento clave) | NO | SÍ |
| Onboarding Alerts (riesgo por persona) | NO | SÍ |
| ExitAlertEngine (caso de negocio) | NO | SÍ |
| RetentionEngine (caso de negocio) | NO | SÍ |
| OnboardingEffectivenessAnalyzer | NO | SÍ |

**Ningún consumidor actual pasa acotadoGroup.** El Nivel 1a (salario específico por nivel) está disponible para uso futuro cuando se conozca el nivel de cargo del empleado afectado.

### Escenario: Empresa entrega solo renta promedio (sin desglose)

Si la empresa pone solo `averageMonthlySalary` (modo simple en la UI):

1. `salaryByJobLevel` queda `null`
2. Nivel 1a y 1b se saltan
3. **Nivel 2** aplica: usa el promedio que ingresó la empresa
4. `source: 'empresa_promedio'`, `confidence: 'medium'`

### Escenario: Empresa no configura nada

1. Todos los niveles se saltan
2. **Nivel 3** aplica: $1,200,000 CLP/mes (default Chile)
3. `source: 'default_chile'`, `confidence: 'low'`

---

## 7. ROLES Y PERMISOS

| Permiso | Roles |
|---------|-------|
| `salary-config:view` | FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CEO |
| `salary-config:edit` | FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN |

Navegación visible para: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CLIENT.

---

## 8. VERIFICACIÓN

```
✅ npx tsc --noEmit — 0 errores
✅ npx prisma validate — schema válido
✅ npx prisma db push — ya sincronizado
✅ next build — compilación limpia
✅ BD Supabase — 15 personas pending, 9 acknowledged (verificado SQL)
✅ UI exit/overview — usa totalTurnoverCost del backend
✅ UI onboarding/alerts — $250M en riesgo (15 × $16.6M) cuadra
✅ UI configuracion/empresa — guarda y lee correctamente
✅ salarySource: "empresa_nivel" — confirma que lee config empresa
```

---

**Versión:** 1.0
**Autor:** Claude Code + Victor Yáñez
**Fecha:** 2026-03-14
