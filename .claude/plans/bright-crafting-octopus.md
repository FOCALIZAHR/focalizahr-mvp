# Plan de Implementación — Presupuesto Inteligente de Dotación (Entrega A)

## Context

CEO necesita un wizard de 5 pasos que genera un presupuesto anual de dotación
en menos de 5 minutos — mensualizado, con timing alerts de finiquitos, y
narrativa ejecutiva para directorio. Entrega A = Sesiones 1-4 del TASK (sin
persistencia). Todo consume servicios existentes, no crea datos nuevos.

Se auditó el TASK contra el codebase real y se resolvieron 12 inconsistencias.
Las decisiones arquitectónicas están cerradas en `.claude/tasks/respuesta.md`.

---

## Decisiones Arquitectónicas (cerradas)

| Decisión | Resolución |
|----------|------------|
| Navegación sidebar | Dropdown "Fuerza de Trabajo" con sub-items: Diagnóstico + Presupuesto |
| Acceso presupuesto | Página separada `/dashboard/workforce/presupuesto` + Card #7 en Rail con `router.push()` |
| Card Rail | Card #7 nuevo. Mocks (benchmarks, simulador) se mantienen. `router.push()` como excepción documentada con comentario |
| Pill bar 5 layers | FUERA de scope Entrega A |
| prescindiblesConAniversario | Movido de `/base` a `/provisiones` |
| Wizard pattern | Página única con useState + renderizado condicional (patrón CalibrationWizard) |
| UF | NO expuesta en Paso 3. `calculateFiniquitoConTopeCustomUF()` en TalentFinancialFormulas.ts. Constante actualizable por config |
| hireDate | Query directa a Employee para prescindibles (son 5-15, no impacta performance) |
| Salary Paso 1 | Query Employee + `getSalaryForAccount()` cacheado por acotadoGroup (4 llamadas max) |
| Exposición por gerencia | Promedio `focalizaScore` desde `retentionPriority.ranking` agrupado por `standardCategory` |

---

## BLOQUE 1 — Permisos + Utilidad Financiera

### 1.1 Agregar permisos en AuthorizationService.ts
**Archivo:** `src/lib/services/AuthorizationService.ts`

Agregar en el objeto `PERMISSIONS` (junto a los de succession):
```typescript
'workforce:budget:view': [
  'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'CEO'
],
'workforce:budget:approve': [
  'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'CEO'
],
```

Actualizar el type `PermissionType` (se infiere automáticamente del objeto PERMISSIONS).

**Verificar:** `npx tsc --noEmit` sin errores.

### 1.2 Extender TalentFinancialFormulas.ts
**Archivo:** `src/lib/utils/TalentFinancialFormulas.ts`

Agregar función:
```typescript
export function calculateFiniquitoConTopeCustomUF(
  salary: number,
  tenureMonths: number,
  ufValueCLP: number
): number
```

Misma lógica que `calculateFiniquitoConTope` pero recibe `ufValueCLP` como
parámetro en vez de usar la constante `UF_VALUE_CLP`. Reutiliza
`calculateFiniquito()` internamente.

Agregar también:
```typescript
export function calculateFiniquitoFuturo(
  salary: number,
  tenureMonths: number,
  diasAdicionales: number,
  ufValueCLP: number = UF_VALUE_CLP
): number
```

Calcula finiquito proyectado sumando `diasAdicionales/30` a `tenureMonths`.
Usa `calculateFiniquitoConTopeCustomUF` internamente.

**Verificar:** `npx tsc --noEmit` sin errores.

---

## BLOQUE 2 — 4 Endpoints Backend

Todos los endpoints siguen el patrón canónico:
```
extractUserContext → hasPermission('workforce:budget:view') → accountId en query
```

### 2.1 GET `/api/workforce/presupuesto/base/route.ts`

**Lógica:**
1. Query `prisma.employee.findMany({ where: { accountId, isActive: true, status: 'ACTIVE' }, include: { department: true } })`
2. Cache salary por acotadoGroup: 4 llamadas a `SalaryConfigService.getSalaryForAccount(accountId, group)`
3. Agrupar por `department.standardCategory` (gerencia)
4. Para exposición IA: llamar `WorkforceIntelligenceService.getOrganizationDiagnostic(accountId)`, extraer `retentionPriority.ranking`, promediar `focalizaScore` por `standardCategory`
5. Para rotación histórica default: query `DepartmentExitInsight` si hay data, o default 12%

**Response:**
```typescript
{
  totalHeadcount: number
  masaSalarialBruta: number
  costoEmpresa: number
  factorAmplificacion: 1.35
  exposicionIAPromedio: number
  rotacionHistorica: number
  porGerencia: Array<{
    gerenciaId: string
    gerenciaNombre: string
    standardCategory: string
    headcount: number
    masaSalarial: number
    costoEmpresa: number
    exposicionIA: number
  }>
  intocablesCount: number
}
```

**NO incluye** `prescindiblesConAniversario` (va en `/provisiones`).

### 2.2 POST `/api/workforce/presupuesto/movimientos/route.ts`

**Body:** `{ movimientos: Array<{ acotadoGroup, cargo, delta, mesInicio }>, accountId implícito }`

**Lógica:**
1. Validar delta negativo no exceda headcount actual del cargo
2. Validar no toca personas INTOCABLE (consultar `retentionPriority.ranking`)
3. Para cada movimiento: `delta × getSalaryForAccount(accountId, acotadoGroup).monthlySalary`
4. Calcular impacto mensual y anual

**Response:** `{ nuevoHeadcount, deltaMasaSalarial, deltaCostoEmpresa, movimientosProcesados[] }`

### 2.3 GET `/api/workforce/presupuesto/provisiones/route.ts`

**Lógica:**
1. `getOrganizationDiagnostic(accountId)` → `retentionPriority.ranking`
2. Filtrar `tier === 'prescindible'` → lista roja
3. Para cada prescindible: query `Employee.hireDate` directo (son pocos, 5-15)
4. Calcular `finiquitoHoy` con `calculateFiniquitoConTopeCustomUF(salary, tenureMonths, UF_VALUE_CLP)` — NO depender del campo condicional
5. Calcular `finiquitoQ2` y `finiquitoQ4` con `calculateFiniquitoFuturo()`
6. `mesAniversario` desde `hireDate.getMonth() + 1`
7. `costoEspera = finiquitoQ4 - finiquitoHoy`
8. Generar timing alerts (narrativa McKinsey, sin jerga RRHH)
9. `prescindiblesConAniversario` agrupado por mes (para Paso 5 barChart)
10. Lista verde (top 10 intocables, solo referencia)

**Response:** `{ listaRoja[], listaVerde[], prescindiblesConAniversario[], resumen: { finiquitosTotal, personasCount, ahorroMensualPostSalida, paybackMeses } }`

### 2.4 POST `/api/workforce/presupuesto/resultado/route.ts`

**Body:** `{ movimientos[], supuestos: SupuestosMacro, provisionesSeleccionadas: string[] }`

**Lógica:**
1. Recalcular base (query Employee + salary cache)
2. Calcular 12 meses con `calcularMesAMes()` (lógica del TASK líneas 371-421)
3. Marcar meses con aniversarios de prescindibles no seleccionados
4. Generar narrativa ejecutiva en backend (lenguaje CEO):
   - "Su organización de N personas proyecta $X en [año]..."
   - Sin "dotación", sin "desvinculación"
5. Generar tooltips por mes para el bar chart

**Response:** `{ meses: MesPresupuesto[12], narrativaEjecutiva: string, tooltips: string[12], resumenAnual: { costoTotal, ahorro, finiquitos, payback } }`

---

## BLOQUE 3 — Navegación + Shell + Pasos 1 y 2

### 3.1 Agregar "Fuerza de Trabajo" al sidebar
**Archivo:** `src/components/dashboard/DashboardNavigation.tsx`

Agregar dropdown con RBAC (mismos roles que `workforce:budget:view`):
```typescript
{
  id: 'workforce',
  label: 'Fuerza de Trabajo',
  icon: Users, // o BrainCircuit
  isDropdown: true,
  subItems: [
    { id: 'workforce-diagnostico', label: 'Diagnóstico', href: '/dashboard/workforce', icon: Brain },
    { id: 'workforce-presupuesto', label: 'Presupuesto', href: '/dashboard/workforce/presupuesto', icon: DollarSign },
  ]
}
```

Gated por roles executive hub (Admin, Owner, HR Manager, HR Admin, CEO).

### 3.2 Agregar Card #7 al Rail
**Archivos:**
- `src/app/dashboard/workforce/components/WorkforceRailCard.tsx` — agregar `'presupuesto'` a `WorkforceCardType`, `CARD_ICONS` (Wallet o Banknote), `CARD_LABELS` ("Presupuesto"), narrative ("Presupuesto anual de dotación")
- `src/app/dashboard/workforce/components/WorkforceRail.tsx` — agregar `'presupuesto'` a `WORKFORCE_CARDS` array
- `src/app/dashboard/workforce/components/WorkforceCinemaOrchestrator.tsx` — en el handler de card click, caso especial para `'presupuesto'`:
  ```typescript
  // Excepción: Presupuesto vive en página separada porque el wizard
  // de 5 pasos es demasiado complejo para renderizar dentro del Orchestrator.
  // Todos los demás cards usan setView(). Este usa router.push().
  if (cardType === 'presupuesto') {
    router.push('/dashboard/workforce/presupuesto')
    return
  }
  ```

### 3.3 Shell del wizard — `presupuesto/page.tsx`
**Archivo:** `src/app/dashboard/workforce/presupuesto/page.tsx`

Página única con useState (patrón CalibrationWizard):
```typescript
'use client'
// Estado en componente padre — NO React Context
const [pasoActual, setPasoActual] = useState<1|2|3|4|5>(1)
const [dotacionBase, setDotacionBase] = useState(null)
const [movimientos, setMovimientos] = useState([])
const [supuestos, setSupuestos] = useState(SUPUESTOS_DEFAULT)
const [provisionesDisponibles, setProvisionesDisponibles] = useState([])
const [provisionesSeleccionadas, setProvisionesSeleccionadas] = useState([])
const [resultado, setResultado] = useState(null)
const [loading, setLoading] = useState(false)
```

**Diseño shell (FocalizaHR Design System):**
- `fhr-bg-main` + `min-h-screen`
- Contenedor `max-w-2xl mx-auto` (crece a `max-w-4xl` en md para Paso 4)
- Tesla line en top (`fhr-top-line`)
- `WizardStepNav` arriba
- `fhr-glass-card` como contenedor único del paso activo
- Botón "Volver al diagnóstico" → `router.push('/dashboard/workforce')`
- Mobile-first: base 320px, columnas colapsan

### 3.4 WizardStepNav.tsx
**Archivo:** `src/components/workforce/presupuesto/WizardStepNav.tsx`

5 pasos en fila horizontal. Patrón CalibrationWizard:
- Mobile: solo números (círculos)
- md+: número + label
- Completado: check icon cyan
- Activo: `bg-cyan-500/10` + `border-cyan-500/30`
- Futuro: disabled + `cursor-not-allowed` + `opacity-50`
- No permite saltar pasos no completados

### 3.5 Paso 1 — DotacionBaseTable.tsx
**Archivo:** `src/components/workforce/presupuesto/DotacionBaseTable.tsx`

**Props:** `dotacionBase`, `onConfirm`

Al montar: fetch `GET /api/workforce/presupuesto/base`

**Diseño Patrón G (Narrativa → Evidencia → Acción):**
1. **Narrativa** (arriba): "Tu organización tiene N personas con un costo empresa de $X/mes."
2. **Evidencia** (tabla):
   - Columnas: Gerencia | Personas | Masa salarial | Costo empresa | Exposición IA
   - Exposición IA: barra visual inline (rojo ≥60%, ámbar 40-59%, verde <40%) + número
   - Row total al final
   - Mobile: scroll horizontal en tabla
3. **Acción** (card guardarraíl + botón):
   - Card glassmorphism: "N personas con RoleFit ≥75% marcadas como protegidas..."
   - Botón `fhr-btn fhr-btn-primary`: "Confirmar y continuar"

### 3.6 Paso 2 — FamiliaCargoSelector.tsx + MovimientosTable.tsx
**Archivos:**
- `src/components/workforce/presupuesto/FamiliaCargoSelector.tsx`
- `src/components/workforce/presupuesto/MovimientosTable.tsx`

**FamiliaCargoSelector** — 3 niveles cascada:
1. Familia: 4 pills (`alta_gerencia`, `mandos_medios`, `profesionales`, `base_operativa`)
2. Cargo: select filtrado por familia seleccionada (query Employee distinct positions)
3. Cantidad: input numérico (+2 / -1)
- Botón "Agregar movimiento" → POST a `/movimientos` → muestra impacto desde backend

**MovimientosTable** — tabla editable:
- Columnas: Familia | Cargo | Δ | Impacto mensual | Impacto anual | Eliminar
- Cada cambio recalcula via backend (zero aritmética frontend)
- Card resumen al pie: nuevo headcount, delta masa salarial, delta costo empresa

**Diseño Patrón G:**
1. Narrativa: "Planifica los movimientos de personas para el año."
2. Evidencia: selector + tabla de movimientos
3. Acción: "Confirmar movimientos"

---

## BLOQUE 4 — Pasos 3 y 4

### 4.1 Paso 3 — SupuestosMacroForm.tsx
**Archivo:** `src/components/workforce/presupuesto/SupuestosMacroForm.tsx`

**Props:** `supuestos`, `setSupuestos`, `costoBase`

5 sliders + valor numérico editable (NO 6 — UF no se expone):
```typescript
interface SupuestosMacro {
  ipcPorcentaje: number          // default 4.5, range 0-10
  meritoPorcentaje: number       // default 2.0, range 0-8
  factorAmplificacion: number    // default 1.35, range 1.20-1.60
  ausentismoPorcentaje: number   // default 3.0, range 0-8
  rotacionEsperada: number       // default desde base.rotacionHistorica o 12%
}
```

Cada slider: `<input type="range">` + `<input type="number">` sincronizados.
Diseño: sliders con track `bg-slate-700`, thumb cyan, valor editable a la derecha.

**Card informativo al pie** (cálculo tiempo real en frontend — excepción permitida porque es aproximación visual, no número final):
"Con estos supuestos, la masa salarial proyectada al cierre del año sube +X% vs enero."

**Narrativa McKinsey:** "Estos supuestos determinan el marco del presupuesto. El resultado final se calcula con precisión en el paso siguiente."

### 4.2 Paso 4 — ProvisionesTable.tsx + AniversarioTimingAlert.tsx
**Archivos:**
- `src/components/workforce/presupuesto/ProvisionesTable.tsx`
- `src/components/workforce/presupuesto/AniversarioTimingAlert.tsx`

Al montar: fetch `GET /api/workforce/presupuesto/provisiones`

**AniversarioTimingAlert** (card destacada, aparece solo si hay prescindibles con aniversario en próximos 2 meses):
- Narrativa McKinsey: "Si actúas antes de [mes], evitas $X en alzas salariales de N personas de la lista roja."
- Diseño: `fhr-card` con borde izquierdo ámbar, icono AlertTriangle

**ProvisionesTable:**
- Columnas: Persona/Cargo | RetentionScore | Antigüedad | Finiquito hoy | Timing alert | Incluir (checkbox)
- Filas prescindibles: checkbox habilitado, marcado por default
- Filas intocables: `opacity-50 cursor-not-allowed`, checkbox disabled, badge "Guardarraíl activo" (emerald)
- Timing alert en italic: ámbar si aniversario próximo, rojo si costoEspera > $2M, vacío si < $500K
- Mobile: scroll horizontal, columna checkbox siempre visible (sticky left)

**Card resumen al pie:**
```
Finiquitos total: $X | Personas: N | Ahorro mensual post-salida: $Y | Payback: Z meses
```

---

## BLOQUE 5 — Paso 5 (Resultado)

### 5.1 Paso 5 — ResultadoMensual.tsx + AniversarioBarChart.tsx
**Archivos:**
- `src/components/workforce/presupuesto/ResultadoMensual.tsx`
- `src/components/workforce/presupuesto/AniversarioBarChart.tsx`

Al montar: POST `/api/workforce/presupuesto/resultado` con todo el estado del wizard.

**AniversarioBarChart** (recharts BarChart, 12 barras):
- Colores semánticos por mes:
  - `#475569` (slate-600): mes normal
  - `#EF9F27` (ámbar): mes con aniversarios de prescindibles no desvinculados
  - `#E24B4A` (rojo): mes con pago de finiquitos
  - `#639922` (verde): meses post-salida (ahorro activo)
- Tooltip: texto generado por backend (narrativa McKinsey)
- `<ResponsiveContainer>` + custom `<Tooltip>` con glassmorphism
- Mobile: barras más delgadas, labels rotados

**Card narrativa ejecutiva** (generada por backend):
```
"Su organización de 309 personas tiene un costo proyectado de $X en 2026,
un +Y% sobre 2025 — por debajo de inflación proyectada.

Las salidas planificadas generan $Z en ahorro neto después de cubrir
$W en finiquitos. Payback: N meses."
```

**Botones finales:**
- "Exportar PDF" → disabled placeholder (v1.1)
- "Guardar borrador" → disabled placeholder (Entrega B)
- "Volver al diagnóstico" → `router.push('/dashboard/workforce')`

---

## Archivos a Crear (nuevos)

```
src/app/dashboard/workforce/presupuesto/page.tsx          ← Shell wizard
src/app/api/workforce/presupuesto/base/route.ts           ← GET dotación base
src/app/api/workforce/presupuesto/movimientos/route.ts    ← POST impacto movimientos
src/app/api/workforce/presupuesto/provisiones/route.ts    ← GET lista roja + finiquitos
src/app/api/workforce/presupuesto/resultado/route.ts      ← POST presupuesto final
src/components/workforce/presupuesto/WizardStepNav.tsx
src/components/workforce/presupuesto/DotacionBaseTable.tsx
src/components/workforce/presupuesto/FamiliaCargoSelector.tsx
src/components/workforce/presupuesto/MovimientosTable.tsx
src/components/workforce/presupuesto/SupuestosMacroForm.tsx
src/components/workforce/presupuesto/ProvisionesTable.tsx
src/components/workforce/presupuesto/AniversarioTimingAlert.tsx
src/components/workforce/presupuesto/ResultadoMensual.tsx
src/components/workforce/presupuesto/AniversarioBarChart.tsx
```

## Archivos a Modificar (existentes)

```
src/lib/services/AuthorizationService.ts                  ← +2 permisos
src/lib/utils/TalentFinancialFormulas.ts                  ← +2 funciones
src/components/dashboard/DashboardNavigation.tsx           ← +dropdown workforce
src/app/dashboard/workforce/components/WorkforceRailCard.tsx  ← +tipo presupuesto
src/app/dashboard/workforce/components/WorkforceRail.tsx      ← +card en array
src/app/dashboard/workforce/components/WorkforceCinemaOrchestrator.tsx ← +router.push excepción
```

## Archivos a Consultar (read-only, no modificar)

```
src/lib/services/WorkforceIntelligenceService.ts          ← getOrganizationDiagnostic()
src/lib/services/SalaryConfigService.ts                   ← getSalaryForAccount()
src/lib/services/PositionAdapter.ts                       ← acotadoGroup valores
src/lib/services/TalentIntelligenceService.ts             ← cuadrantes
src/components/calibration/CalibrationWizard.tsx           ← patrón wizard referencia
src/components/exit/ExitTabsToggle.tsx                     ← patrón toggle referencia
prisma/schema.prisma                                       ← Employee, Department models
```

---

## Orden de Ejecución

```
BLOQUE 1: Permisos + utilidad financiera
  □ 1.1 AuthorizationService.ts — 2 permisos nuevos
  □ 1.2 TalentFinancialFormulas.ts — 2 funciones nuevas
  □ npx tsc --noEmit ✓

BLOQUE 2: 4 endpoints backend
  □ 2.1 /api/workforce/presupuesto/base/route.ts
  □ 2.2 /api/workforce/presupuesto/movimientos/route.ts
  □ 2.3 /api/workforce/presupuesto/provisiones/route.ts
  □ 2.4 /api/workforce/presupuesto/resultado/route.ts
  □ npx tsc --noEmit ✓

BLOQUE 3: Navegación + Shell + Pasos 1-2
  □ 3.1 DashboardNavigation.tsx — dropdown workforce
  □ 3.2 WorkforceRailCard + Rail + Orchestrator — card #7
  □ 3.3 presupuesto/page.tsx — shell wizard
  □ 3.4 WizardStepNav.tsx
  □ 3.5 DotacionBaseTable.tsx (Paso 1)
  □ 3.6 FamiliaCargoSelector.tsx + MovimientosTable.tsx (Paso 2)
  □ npm run build ✓

BLOQUE 4: Pasos 3-4
  □ 4.1 SupuestosMacroForm.tsx (Paso 3)
  □ 4.2 ProvisionesTable.tsx + AniversarioTimingAlert.tsx (Paso 4)
  □ npm run build ✓

BLOQUE 5: Paso 5
  □ 5.1 ResultadoMensual.tsx + AniversarioBarChart.tsx (Paso 5)
  □ npm run build ✓
  □ npm run dev → test manual en browser
```

## Verificación

```
□ npx tsc --noEmit — zero errores
□ npm run build — compila limpio
□ npm run dev — test manual:
  □ Sidebar muestra "Fuerza de Trabajo" dropdown con 2 sub-items
  □ Rail muestra 7 cards (6 existentes + Presupuesto)
  □ Click en card Presupuesto → navega a /dashboard/workforce/presupuesto
  □ Wizard carga Paso 1 con datos reales
  □ Paso 1 → 2 → 3 → 4 → 5 fluye sin errores
  □ Narrativas en lenguaje CEO (zero jerga RRHH)
  □ Mobile: layout no se rompe en 320px
  □ RBAC: AREA_MANAGER no ve presupuesto (no tiene workforce:budget:view)
  □ RBAC: CEO ve todo, solo lectura
```

## Pendientes Técnicos

```
SPAN DE CONTROL — ✅ IMPLEMENTADO (Abril 2026):
  directReportsCount se lee de Employee._count.directReports en
  buildEnrichedDataset(). El endpoint /api/workforce/diagnostic
  ahora calcula spanData.global + spanData.porGerencia (avgSpan
  real por departamento). ModuleToolbar lo consume directo.
```
