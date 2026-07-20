# SPEC_HOME_SIGNOS_VITALES_v1.1
## FocalizaHR — Portada de entrada "Signos Vitales" + reubicación del home operativo

**Fecha:** 2026-07-20 (v1.1) · 2026-07-19 (v1)
**Estado:** Aprobado por Victor. Gate A implementado y sellado.
**Regla madre:** 100% aditivo salvo UNA línea (el redirect post-login), que es el último commit, separado y revertible.

### Changelog

**v1.1 (2026-07-20) — sella la distinción VEREDICTO vs SEGUIMIENTO.**
La v1 decía que la señal de clima era "la última lectura de
DepartmentClimaInsight", sin distinguir tipo de campaña. Eso quedó obsoleto:
el veredicto sale SOLO de una medición completa (`experiencia-full` con
`isFollowUp=false`). Pulso Express es señal direccional y jamás produce
veredicto ni zona. El Seguimiento Focalizado (`isFollowUp=true`) se expone
como capa separada con su delta y nunca pisa la zona.

La v1 también proponía `Department.accumulatedClima*` (gold cache) como fuente
de la zona. **Descartado**: ese campo es un promedio rolling 12m construido
sobre filas pulso-express (`ClimaAggregationService.ts:730-738`), es decir una
zona derivada de señal direccional — exactamente lo que la regla prohíbe.

Es la regla que Gate A implementa y que su smoke verifica (42 PASS).

**v1 (2026-07-19)** — versión inicial, aprobada tras el Gate 0 de producto y el
mapa de terreno.

---

## 1. DECISIÓN

Se crea una portada nueva "Signos Vitales" en ruta privada nueva. El home actual
(`/dashboard/page.tsx`) NO se mueve, NO se edita, NO se borra en este proyecto —
queda como la vista operativa, en su ruta actual, con todos sus flujos intactos
(botones "volver", toast del wizard de campañas, CTAs de emails).

El único cambio a código existente en todo el proyecto:

```
src/components/forms/AuthForm.tsx:116
  const redirectTo = searchParams?.get('from') || '/dashboard'
→ const redirectTo = searchParams?.get('from') || '/dashboard/inicio'
```

Commit final, separado, de líneas contadas, revertible con un solo `git revert`.

**Por qué esta arquitectura y no "mover el home":** el mapa de Code demostró que
mover la page arrastra el sidebar (vive dentro de la page, no del layout) y
obligaría a refactorizar el chasis de las 25 subrutas. La portada Signos Vitales
no lleva sidebar por diseño (Portada universal), así que la ruta nueva evita el
nudo completo.

---

## 2. ALCANCE v1 — qué muestra y qué NO

### Muestra (solo lecturas materializadas, cero cálculo pesado on-demand)

#### Clima — DOS CAPAS, nunca mezcladas (regla sellada v1.1)

| Capa | Fuente | Qué produce |
|------|--------|-------------|
| **1. VEREDICTO** | `DepartmentClimaInsight`: última fila con `productType='experiencia-full'` **y** `isFollowUp=false` (la más reciente por `periodEnd`) | **Única fuente de la zona.** `riskZone`, `engagementFavorability`, `momentum`, `correlationFlags`, `topFocusArea`. La zona se LEE del campo persistido, jamás se recalcula. Nada más la mueve |
| **2. SEGUIMIENTO** | `DepartmentClimaInsight` con `isFollowUp=true` **posterior** al veredicto | Señal separada: `{ measuredAt, dimension, delta }`. `dimension` = `topFocusArea` del veredicto; `delta` = fav de esa dimensión en el seguimiento menos la del veredicto. **Nunca recalcula ni pisa la zona** |

**Pulso Express: EXCLUIDO explícitamente de v1.** Es señal direccional (pocos
reactivos, cadencia alta): sirve para ver hacia dónde se mueve algo, jamás para
dictaminar el estado de un departamento. La exclusión vive en el `WHERE` de la
query, así que esas filas ni se leen. Si a futuro entra, es como badge aparte,
nunca como veredicto.

**`Department.accumulatedClima*` NO se usa** (ver changelog v1.1): promedio
rolling 12m construido sobre pulso-express.

**Casos de ausencia:**
- Depto **sin ninguna medición completa** → `sin_veredicto`. Sin zona. No se
  inventa una desde un follow-up.
- Depto **con seguimiento pero sin medición completa previa** →
  `solo_seguimiento`: se expone su señal de seguimiento, `verdict: null`, sin zona.

#### Resto de señales

| Señal | Fuente | Nota |
|-------|--------|------|
| Onboarding (EXO) | `Department.accumulatedExoScore` | |
| Exit (EIS) | `Department.accumulatedEISScore` | |
| Ambiente (ISA) | `ComplianceAnalysis.isaScore` más reciente por depto, con `status='COMPLETED'` y `scope='DEPARTMENT'` obligatorios | Ya viene penalizado por teatro (×0.7 aplicado al persistir) — PROHIBIDO re-aplicar. `previousIsaScore` da el delta gratis; si falta, delta null (nunca 0) |

### NO muestra en v1 (honestidad de datos)

- **Metas departamental:** no existe tabla materializada (solo EmployeeGoalsInsight
  por persona). Entra cuando exista DepartmentGoalsInsight — gate futuro propio.
- **Risk score de compliance:** DepartmentRiskScoreService es runtime por diseño
  explícito. No se paga su cómputo en la puerta de entrada.
- **Rotación / ausentismo:** DepartmentMetric es carga manual del cliente y
  null ≠ 0 (regla documentada). Si hay dato se puede mostrar con etiqueta de
  origen; si es null, "sin dato cargado" — jamás cero.

### Regla transversal null ≠ 0

Toda señal ausente se renderiza como estado "sin lectura" (FHREmptyState o
equivalente inline). El gauge nunca miente con ceros.

---

## 3. DECISIÓN ABIERTA #1 — el número único (resuelta para v1)

El índice compuesto único (ISD, "un número, una verdad") NO se inventa en v1:
su fórmula de pesos no está sellada y hardcodear una sin aprobación viola la
regla de indicadores no entendidos. 

**v1:** el hero es la LECTURA de signos vitales — distribución de zonas
(N deptos sanos / en atención / críticos) + la señal más crítica del día como
hallazgo narrativo + CTA. Todas las cifras son señales reales existentes.

**Hallazgo del día — alcance sellado en Gate A (v1.1):** se elige SOLO con
clima (mayor severidad de zona del veredicto; desempate por menor
favorabilidad). ISA/EXO/EIS se exponen por departamento pero **no compiten**
por el hallazgo: rankear señales de productos distintos entre sí exige una
fórmula de criticidad cross-señal, que es el ISD diferido a v2. Si ningún
departamento tiene veredicto, el hallazgo es `null` con razón explícita
(`sin_veredictos`), nunca un relleno.

**v2 (gate futuro):** fórmula ISD con pesos nombrados en
`src/lib/constants/vitalsThresholds.ts`, propuesta a Victor antes de una línea
de código. Recién ahí el gauge central pasa a ser el número único.

---

## 4. ARQUITECTURA (todo nuevo, todo aditivo)

```
src/lib/constants/vitalsThresholds.ts        # umbrales/zonas — cero números mágicos
src/lib/services/vitals/VitalSignsService.ts # SOLO LECTURA de materializado.
                                             # accountId en toda query.
                                             # Sin writes de ningún tipo.
src/lib/services/vitals/types.ts
src/app/api/vitals/summary/route.ts          # GET — patrón auth MODERNO
src/app/dashboard/inicio/page.tsx            # Portada (server component para
                                             # el rol en primer render)
src/components/vitals/*                      # componentes de la portada
```

### Auth y roles — regla no negociable

La portada NO copia ningún patrón del home legacy:
- NADA de localStorage, NADA de decodificar JWT en cliente, NADA de `verifyJWT`
  legacy (gate-blind), NADA del campo `role` colapsado a CLIENT.
- Endpoint: `extractUserContext` + `AuthorizationService.hasPermission`.
- Rol disponible en el PRIMER render (server-side), sin segundo paint.

### Permiso RBAC (se agrega a PERMISSIONS, registro central)

```typescript
'vitals:view': [FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CEO, AREA_MANAGER]
```

### Router por rol (dentro de la portada, server-side)

| Rol | Ve |
|-----|-----|
| FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CEO | Signos vitales de toda la cuenta |
| AREA_MANAGER | Solo su territorio, filtrado server-side vía `buildParticipantAccessFilter` (fail-CLOSED). Sin departmentId → estado explícito "tu acceso no tiene departamento asignado — contacta a tu administrador". Nunca datos de toda la cuenta, nunca "sin datos" silencioso |
| HR_OPERATOR | Redirect server-side a la vista operativa (`/dashboard`) |
| EVALUATOR | Ya lo redirige el middleware (:252) a evaluaciones — no se toca ese bloque en v1 |

**Nota departmentId:** el header llega como string vacío (`''`), no null
(middleware `payload.departmentId || ''`). El servicio trata `''` como ausencia
— explícitamente, con comentario.

---

## 5. UI (Gate 0 de diseño ya aprobado — resumen vinculante)

- Patrón: **Portada universal** (mensaje + gauge + 1 hallazgo + 1 CTA).
  Sin sidebar. Sin tabs. Sin listas largas. Sin identidad de persona.
- Referencia visual canónica: `CompensationPortada.tsx` (Tesla line, word-split,
  número hero, glassmorphism). Anti-semáforo: números en blanco, color solo en
  borde/acento. Sin emojis, Lucide 18px, `formatDisplayName()`.
- CTA: **"Ver diagnóstico"** → aterriza en Executive Hub/Cockpit con el hallazgo
  más crítico pre-seleccionado.
- Mobile-first: en 375px todo above the fold (headline 2 líneas + lectura +
  hallazgo + CTA). Detalle por departamento colapsa a "top 3 + ver todos".
- Estados degradados de primera clase: cuenta nueva / sin campañas / bajo
  privacy threshold → "qué está midiendo el sistema y cuándo tendrás lectura".
  El diseño del empty state se entrega junto con el diseño del estado lleno,
  no después.
- Narrativas: skill focalizahr-narrativas (pirámide, sin jerga, consecuencia).
  El hallazgo del día lo redacta el motor con templates aprobados por Victor.

---

## 6. GATES DE IMPLEMENTACIÓN

| Gate | Contenido | Contacto con código existente |
|------|-----------|-------------------------------|
| A | vitalsThresholds + VitalSignsService + endpoint + smoke con datos reales | CERO (archivos nuevos + 1 entrada en PERMISSIONS) |
| B | Portada UI + estados degradados + mobile (Gate 0→3 de la skill de diseño) | CERO |
| C | Router por rol server-side + redirect HR_OPERATOR + prueba de los 6 roles navegando directo a /dashboard/inicio | CERO |
| D | Cambio de puerta: la línea de AuthForm.tsx:116. Commit propio, separado, revertible. Smoke: login con cada rol | UNA LÍNEA |

Regla entre gates: la plataforma completa funciona igual hasta el Gate D.
Durante A–C la portada se prueba navegando directo a la ruta.

Regla operacional (sesiones paralelas de Code activas): `git status --stat`
antes de cada commit, `git add` archivo por archivo, commits de código y docs
separados, sin em dashes en commits.

---

## 7. DEUDAS DESCUBIERTAS EN GATE 0 (aprobado su tratamiento por Victor)

1. **DEUDA_FAIL_OPEN_AREA_MANAGER (seguridad, proyecto separado):** ~16 endpoints
   replican el filtro jerárquico inline y fallan ABIERTO si el AREA_MANAGER no
   tiene departmentId (ven toda la cuenta): admin/employees, admin/employees/[id],
   admin/performance-ratings, analytics/nps, performance/role-fit,
   calibration/sessions, 4× pdi/*, goals/[id], 4× workforce/presupuesto/*.
   El patrón correcto (403 explícito) existe en clima/results y compliance/report.
   NO se toca en este proyecto. Se documenta con la lista file:line del reporte
   de Code y se agenda como proyecto de seguridad propio.
2. **Bug de rol en menú actual:** DashboardNavigation.tsx:115 gatea sobre el
   campo `role` colapsado (CLIENT) → AREA_MANAGER ve menú "Operaciones".
   Solo canSeeGoalCycles usa el campo correcto (userRole). No bloquea este
   proyecto (la portada no usa ese componente). Documentado, no se toca.
3. **Nav móvil roto preexistente:** layout.tsx:152 apunta a /dashboard/campanas
   (ruta inexistente). Documentado, no se toca.

## 8. AUTORIZACIÓN DE LECTURA BD (aprobada por Victor)

Code está autorizado a correr consultas de SOLO LECTURA (SELECT) contra la BD
para confirmar qué cuentas/períodos tienen filas reales en DepartmentClimaInsight
y qué gold caches de Department están poblados. Ninguna otra operación. La BD es
producción compartida: cualquier cosa que no sea SELECT requiere aprobación
explícita nueva.

## 9. FUTURO (fuera de alcance v1, anotado)

- Fórmula ISD (número único) — decisión de pesos con Victor (v2 del hero).
- DepartmentGoalsInsight materializado — habilita la señal de metas.
- Rotación real alimentando el sistema (EVAL_ROTACION_SALARIO_CLIMA_v1, punto 1).
- Retiro del home legacy / unificación de guards de auth duplicados — proyecto
  aparte cuando la portada esté estable.
- Naming ICC (coherencia cultural vs concentración de conocimiento) — se
  resuelve cuando despierte la encuesta de cultura.
