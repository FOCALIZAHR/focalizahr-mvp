# MAESTRO - HOME SIGNOS VITALES

Spec: `.claude/tasks/SPEC_HOME_SIGNOS_VITALES_v1.1.md`

> Ancla de continuidad del proyecto. Mantenido por Code, versionado en git,
> actualizado al sellar CADA gate en el MISMO commit del sello. Si un chat se
> cae, este archivo mas la spec bastan para retomar en otro.

---

## Estado de gates

- [x] Gate A - backend (servicio + endpoint + permiso)
- [x] Gate B - UI portada
- [ ] Gate C - router server-side por rol
- [ ] Gate D - cambio de puerta (AuthForm.tsx:116)

---

## Gate A - SELLADO 2026-07-20

**Commits:** `30418a0` (implementacion) + `ec4b10e` (smoke)

**Archivos entregados:**
- `src/lib/constants/vitalsThresholds.ts`
- `src/lib/services/vitals/types.ts`
- `src/lib/services/vitals/VitalSignsService.ts`
- `src/app/api/vitals/summary/route.ts`
- `src/lib/auth/permissions.ts` (+ entrada `vitals:view`, unico contacto con
  codigo existente: 17 inserciones, 0 borrados)
- `prisma/scripts/smoke-vitals-gateA.ts` (queda en repo hasta Gate D)

**Regla de dominio que implementa** (ver spec seccion 2, sellada en v1.1):
veredicto de clima SOLO desde `experiencia-full` con `isFollowUp=false`;
seguimiento en capa separada que jamas pisa la zona; pulso-express excluido en
el `WHERE`; `Department.accumulatedClima*` descartado como fuente.

**Evidencia:** 42 PASS
- Frente 1 (funcion pura, sin BD): 5 casos de spec + 4 de borde.
- Frente 2a: camino vacio real, 57 deptos, ninguna favorabilidad de
  pulso-express filtrada como veredicto.
- Frente 2b: fixture de contrato sobre 3 deptos reales limpios; cleanup
  verificado con sonda independiente, 0 residuo.
- Frente 2c: señales reales EXO 11/57, EIS 3/57, ISA 2/57 (filas FAILED
  excluidas).
- Frente 2d: scope AREA_MANAGER; scope vacio no cae a toda la cuenta.
- Frente 2e: RBAC 6 allow, 4 deny, rol null deny.

**NO verificado en Gate A (diferido a Gate C):** round-trip HTTP del 403
`AREA_MANAGER_SIN_DEPARTAMENTO`. La escritura del 403 esta en el endpoint y fue
revisada, pero no existe ningun AREA_MANAGER sin departamento en la cuenta de
prueba, y sin dev server no se puede simular el header vacio por HTTP.

**Nota de build:** `npm run build` falla en `prisma generate` con EPERM en
Windows si hay un `node` corriendo (dev server de Victor). No se matan procesos
node. Con schema sin cambios, `npx next build` es suficiente y compila limpio.

**Deuda descubierta (modulo Clima, NO del home):** 3 campañas `experiencia-full`
en estado `completed` con `climaAggregationStatus = NULL`
(`prisma/schema.prisma:346`), fechas 2025-07 a 2025-11, previas al wiring de
agregacion (`ClimaAggregationService.ts:463`). Por eso no existe ni una fila
`experiencia-full` en `DepartmentClimaInsight` y la señal de clima sale
legitimamente vacia en la cuenta de prueba.

---

## Gate B - SELLADO 2026-07-20

**Commits:** `f6328e7` (refactor helper) + `870b52e` (portada)

**Ruta:** `/dashboard/inicio`. Patron Portada universal, ceremonia
`focalizahr-design` completa (Gate 0 producto to Gate 3 tokens) cumplida antes
de escribir JSX.

**Archivos entregados:**
- `src/lib/services/vitals/resolveVitalsAccess.ts` (fuente unica fail-closed)
- `src/app/api/vitals/summary/route.ts` (delega en el helper, sin cambio de
  comportamiento)
- `src/lib/narratives/vitalsNarratives.ts` (funciones puras, fuente unica de
  textos)
- `src/app/dashboard/inicio/page.tsx` (server component)
- `src/components/vitals/VitalSignsPortada.tsx`
- `src/components/vitals/VitalsBelowFold.tsx`
- `src/components/vitals/VitalsCTA.tsx` (unico client component)
- `prisma/scripts/smoke-vitals-access-parity.ts`, `smoke-vitals-gateB.ts`

**Decisiones de producto selladas (Victor, 2026-07-20):**
- Estado degradado disenado PRIMERO: es el estado real de la cuenta hoy.
- Hero sin veredicto = FRASE, no numero. Un cero de 72px seria la regla
  null != 0 violada en tipografia.
- CTA dependiente de permiso: con `campaigns:manage` "Activar medicion
  completa"; sin el (CEO, AREA_MANAGER) "Ver la operacion".
- Top 3 areas SIN enlaces individuales: no existe drill-down por departamento.
- Hallazgo del dia SOLO clima (sellado en Gate A).

**Evidencia:** 32 PASS (Gate B) + 15 PASS (paridad del refactor) + 42 PASS
(Gate A re-corrido sin cambios, cleanup 0 residuo). `npx tsc --noEmit` limpio.
La auditoria de narrativas es automatica: falla el smoke si aparece jerga del
sistema, instruccion prescriptiva, plazo, o una cima Minto de mas de 8 palabras.

**Ganancia colateral:** el 403 `AREA_MANAGER_SIN_DEPARTAMENTO`, que en Gate A
quedo escrito pero sin ejecutar, ahora SI se ejecuta y se verifica (paridad 4a
y 4b, incluido el header como string vacio). Falta solo el round-trip HTTP.

**NO verificado en Gate B:**
1. **Visual y de pulgar en 375px.** Requiere dev server y ojo humano. Es de
   Victor o de Gate C. No se reporta mobile-first como cumplido sin haberlo visto.
2. **`npx next build` completo.** BLOQUEADO por un error de sintaxis en
   `src/app/dashboard/clima/components/cascada/ClimaIntroSequence.tsx`, archivo
   MODIFICADO SIN COMMITEAR por la sesion paralela de Clima (bloque `{/* */}`
   mal ubicado, linea 43-46). En HEAD ese archivo esta sano. La rotura vive
   solo en el working tree local: el estado commiteado del repo compila. Volver
   a correr `npx next build` cuando esa sesion cierre su edicion.

---

## Proximo gate - B (UI portada) [COMPLETADO, ver arriba]

**Skills OBLIGATORIAS antes de escribir una linea de JSX:**

- `focalizahr-design`, ceremonia COMPLETA y en orden:
  - **Gate 0 producto** (trabajo del usuario en 1 linea, friccion minima,
    wireflow, mobile-first, RECURSOS_DE_DISENO_REQUERIDOS) ANTES de elegir
    patron. Sin esto no se elige patron.
  - **Gate 1** patron de navegacion (Portada universal ya definida en spec
    seccion 5, reconfirmar contra la skill).
  - **Gate 2** composicion jerarquica.
  - **Gate 3** tokens (Manifiesto v5: anti-semaforo, Tesla line, sin emojis,
    Lucide 18px, `formatDisplayName`).
- `focalizahr-narrativas` para el hallazgo del dia (piramide, contradiccion
  protagonista, sin jerga, sin plazos).

**Insumo que Gate B ya tiene resuelto:** el endpoint `GET /api/vitals/summary`
devuelve por departamento las dos capas de clima, EXO/EIS/ISA, la distribucion
de zonas, el hallazgo del dia y `coverage`. Con la BD de prueba actual el
camino real es el DEGRADADO (todos `sin_veredicto`), asi que el estado vacio no
es un caso de borde: es el estado que se va a ver. Diseñarlo primero.

**Prompt de arranque para retomar en otro chat si este cae:**

```
Lee .claude/tasks/SPEC_HOME_SIGNOS_VITALES_v1.1.md y
.claude/plans/MAESTRO_HOME_SIGNOS_VITALES.md. Gates A y B sellados.
Estamos en Gate C: router por rol server-side, redirect de HR_OPERATOR
a /dashboard, y prueba de los 6 roles navegando directo a
/dashboard/inicio. Presenta plan en Plan Mode. No implementes.
```

---

## Deudas y riesgos conocidos

### RESUELTA en Gate B - fail-closed AREA_MANAGER

La regla "AREA_MANAGER sin departamento no ve nada" vive ahora en UN solo lugar:
`resolveVitalsAccess.ts`. El endpoint y la portada server-side la comparten.

**Esto es el modelo a replicar cuando se ataque `DEUDA_FAIL_OPEN_AREA_MANAGER`**
(los 16 endpoints que repiten el filtro jerarquico inline y fallan ABIERTO si el
AREA_MANAGER no tiene departamento: admin/employees, admin/employees/[id],
admin/performance-ratings, analytics/nps, performance/role-fit,
calibration/sessions, 4x pdi/*, goals/[id], 4x workforce/presupuesto/*).
El patron: un resolver compartido que devuelve acceso o denegacion tipada, en
vez de un `if (role === 'AREA_MANAGER' && departmentId)` copiado.

### DEUDA DE SKILL (no del proyecto) - focalizahr-design

`SKILL.md` define el patron Portada como "mensaje corto + 1 CTA". Pero
`references/page-patterns.md:267-268` dibuja el Patron 5 con una fila final
"EXPLORAR INTELIGENCIA [Vista Ejecutiva][Pipeline][Alertas][Dashboard]": cuatro
CTAs secundarios que contradicen el Mandamiento 3 (un solo CTA principal).

Gate B siguio `SKILL.md` + spec seccion 5 (un CTA). **La proxima portada va a
tropezar con la misma ambiguedad** si no se corrige la skill. No se toco: es
deuda de la skill, no del proyecto.

### RIESGO PARA GATE C - auth vieja heredada del layout

`/dashboard/inicio` cuelga de `src/app/dashboard/layout.tsx`, que es
`'use client'` y **no renderiza children hasta validar `localStorage`**
(`layout.tsx:29-61`), mostrando un spinner propio.

Consecuencia: aunque `page.tsx` es server component y el rol llega correcto en
el primer render (sin flash de rol equivocado), **el primer pintado visible
sigue siendo el spinner del layout**. La spec seccion 4 exige "rol confiable en
primer render, sin segundo paint" — el rol si lo esta, el paint no.

**Aceptado para v1, NO como definitivo.** Gate C tiene que resolverlo. Ademas
ese layout tiene un guard de auth duplicado y divergente con el del home legacy
(`page.tsx:132` redirige a `/`, `layout.tsx:34-37` a `/login`).

El header del layout (logo, GoalAlertsBell, Salir) SI se acepta como definitivo
para la portada: en una pantalla de entrada tener salida y alertas a mano es
correcto.

---

## Reglas transversales del proyecto

- **100% aditivo hasta Gate D** (una linea en `AuthForm.tsx:116`). El home
  actual (`src/app/dashboard/page.tsx`) NO se mueve, NO se edita, NO se borra.
- `git status --stat` + `git add` archivo por archivo antes de todo commit.
  Jamas `git add -A`. Pathspec explicito en `git commit`.
- **Sesiones paralelas activas:** verificar contaminacion antes de cada commit.
  Al sellar Gate A habia trabajo en vuelo de Clima (planes de accion) en el
  working tree, incluido `climaThresholds.ts`, del que Gate A importa
  `RiskZone`. Se verifico que ese simbolo ya existe en HEAD, asi que los
  commits de vitals son autocontenidos.
- `.claude/tasks/*` esta en `.gitignore` (`.gitignore:54`): los docs vivos
  entran con `git add -f`. `.claude/plans/` si esta trackeado normalmente.
- Commits de codigo y de docs SEPARADOS. Sin em dashes en los mensajes.
- El smoke de Gate A permanece en repo hasta cerrar Gate D.

---

## Actualizaciones

Actualizar este archivo al sellar CADA gate futuro (B, C, D) en el MISMO commit
del sello.
