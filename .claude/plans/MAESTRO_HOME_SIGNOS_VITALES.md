# MAESTRO - HOME SIGNOS VITALES

Spec: `.claude/tasks/SPEC_HOME_SIGNOS_VITALES_v1.1.md`

> Ancla de continuidad del proyecto. Mantenido por Code, versionado en git,
> actualizado al sellar CADA gate en el MISMO commit del sello. Si un chat se
> cae, este archivo mas la spec bastan para retomar en otro.

---

## Estado de gates

- [x] Gate A - backend (servicio + endpoint + permiso)
- [x] Gate B - UI portada
- [x] Gate C - router server-side por rol
- [x] Gate D - cambio de puerta (AuthForm.tsx:116)

**PROYECTO COMPLETO.** Los 4 gates sellados. 100% aditivo excepto 1 linea
(`AuthForm.tsx:116`). Pendiente unico: push, que corre Victor con criterio propio.

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

## Gate C - SELLADO 2026-07-20

**Commits:** `a602df4` (redirect + smoke)

**Entregado:**
- `src/app/dashboard/inicio/page.tsx`: constante local `ROLES_A_VISTA_OPERATIVA`
  y redirect a `/dashboard` antes de resolver acceso. 18 lineas.
- `prisma/scripts/smoke-vitals-gateC.ts`: 8 escenarios, round-trip HTTP real.

`middleware.ts` NO se toco, por regla firme de Victor.

**Evidencia: 23 PASS.** Regresion verificada: Gate A 42, Gate B 32, paridad 15,
todos en verde. `tsc` limpio y `next build` compilado correctamente
(ClimaIntroSequence.tsx ya fue arreglado por la sesion paralela).

| # | Rol | Objetivo | Resultado |
|---|-----|----------|-----------|
| 1-5 | FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CEO | `/api/vitals/summary` | 200, scope organization, 57 deptos |
| 6 | AREA_MANAGER con depto | `/api/vitals/summary` | 200, scope area, 1/57 deptos |
| 7 | AREA_MANAGER sin depto | `/api/vitals/summary` | 403 + code, sin datos |
| 8 | HR_OPERATOR | `/dashboard/inicio` | digest `NEXT_REDIRECT;replace;/dashboard;307;` |
| 8d-e | CEO (paridad) | `/dashboard/inicio` | 200, sin digest de redirect |

Escenario 6 lleva **tres asserts explicitos** contra fail-open silencioso:
devueltos > 0, devueltos < universo de la cuenta, y todos dentro del territorio
(depto + descendientes, resuelto con el mismo CTE recursivo que usa la API).

**EVALUATOR: NO ejecutado.** Cubierto por `middleware.ts:252`, que ya lo
redirige a `/dashboard/evaluaciones`. Validar el middleware no es
responsabilidad de este gate.

**Tokens sinteticos:** no existen usuarios FOCALIZAHR_ADMIN, HR_ADMIN ni
HR_OPERATOR en la cuenta de prueba. Para esos tres el token se acuna con
`userId` sintetico y `accountId` real, que es lo que produciria un login real de
un usuario asi. Declarado en el propio smoke.

---

## Gate D - SELLADO 2026-07-21

**Commits:** `ea53f0a` (la linea) + este commit de docs.

**Cambio unico** (`src/components/forms/AuthForm.tsx:116`):
```
- const redirectTo = searchParams?.get('from') || '/dashboard'
+ const redirectTo = searchParams?.get('from') || '/dashboard/inicio'
```

El home operativo (`/dashboard`) queda intacto con todos sus flujos. Solo cambia
el aterrizaje del login frio; los deep-links con `?from=` conservan prioridad.

**Reversible:** `git revert ea53f0a` (una sola linea).

**Verificacion visual (Victor, 2026-07-21):** 4 estados alcanzables validados en
desktop y mobile 375px:
- S1 sin_veredicto (estado real de la cuenta hoy)
- S2 con_criticos (via fixture temporal)
- S3 sin_riesgo (via fixture, modo --estado=sin-riesgo)
- S5 sin_departamentos (cuenta sin deptos, sin escritura)

S4 sin_acceso: logica verificada por HTTP (escenario 7 del smoke de Gate C, 403 +
code) pero render visual PENDIENTE — no existe AREA_MANAGER sin departamento en
la BD y crearlo tocaria la tabla User, fuera del alcance de Gate D.

**Scripts de fixture visual:** `fixture-vitals-visual-check.ts` y
`cleanup-vitals-visual-check.ts` se usaron para la verificacion (patron probado:
insertar 3 filas -> navegar -> cleanup por id en $transaction) y se descartaron
sin versionar. Nunca entraron al repo.

**Smokes finales (todos en verde tras el incidente de entorno):** Gate A 42 PASS
(cleanup 0 residuo), Gate B 32 PASS, Gate C 23 PASS (round-trip HTTP real contra
:3000, re-corrido despues del commit RBAC `72bab31` de la sesion paralela para
confirmar cero regresion en el router por rol).

---

## INCIDENTE DE ENTORNO (2026-07-20/21) - causa raiz y reparacion

Durante Gate D, al verificar que HEAD typechequeaba de forma aislada, se daño el
entorno local. Registrado aca porque la causa raiz era una instruccion del propio
repo y la leccion es transversal.

**Causa raiz:** `CLAUDE.md` instruia `npx tsc --noEmit` (y `npx prisma ...`) sin
`--no-install`. Cuando `npx <comando>` no resuelve un binario local, va al
registro publico de npm y ejecuta el paquete que encuentre con ese nombre. Al
correr `npx tsc` desde un worktree temporal sin `node_modules`, npx descargo y
ejecuto `tsc@2.0.4` — un paquete abandonado que NO es el compilador de
TypeScript (el compilador vive en el paquete `typescript`). Inofensivo en si,
pero el mismo mecanismo ejecutaria un typosquat malicioso con permisos del
usuario.

**Que se rompio:** para verificar HEAD se creo un git worktree temporal con
`node_modules` enlazado por junction. Al desmontarlo, un `git worktree remove
--force` siguio el junction y entro al `node_modules` REAL, borrando
`node_modules/.bin/` (los ~90 lanzadores de binarios) y `.package-lock.json`
antes de abortar. Consecuencia: `npm run dev` / `build` / `npx <x>` dejaron de
resolver comandos. Los paquetes en si quedaron intactos; solo se perdieron los
enlaces y el inventario.

**Que NO se toco:** codigo fuente, commits, git, `package-lock.json` del repo,
base de datos. Daño acotado a `node_modules`.

**Reparacion (con dev server bajo, para evitar EPERM de Windows):**
1. `npm install` real — reconstruyo `.bin/` (volvio a 198 entradas) y
   `.package-lock.json` desde el `package-lock.json` intacto. Cero descargas
   nuevas, cero cambios en package-lock (verificado con git status).
2. `npm install` borro de paso el cliente Prisma generado (`.prisma/client/`,
   artefacto de `prisma generate`, no un paquete npm). Regenerado con
   `node node_modules/prisma/build/index.js generate` — v5.22.0, sin EPERM.
3. Reinicio del dev server (lo hizo Victor) para reconstruir la cache `.next`,
   que habia quedado con un chunk huerfano (`Cannot find module './38948.js'`)
   por el cambio de `node_modules` bajo un server corriendo.
4. Re-corrida de los 3 smokes: 42 / 32 / 23, todos verdes.

**Regla nueva, YA APLICADA** (commit `9f38db5`, `CLAUDE.md`): nunca `npx <x>` a
secas. Siempre `npx --no-install <x>` o ruta explicita al binario local
(`node node_modules/typescript/bin/tsc`). `--no-install` falla con error claro
en vez de descargar y ejecutar codigo de internet. Se corrigieron ademas las 3
lineas de `CLAUDE.md` que enseñaban el patron inseguro.

**Leccion de proceso:** el daño no vino de la verificacion (que salio bien: HEAD
typechequea limpio) sino del desmontaje. Un junction hacia una carpeta real debe
desmontarse (rmdir del enlace) ANTES de invocar `git worktree remove --force`;
cuando el primer intento de rmdir fallo por escape de rutas, se debio parar en
vez de seguir. Se suma a la regla transversal del proyecto: cuando una operacion
de limpieza falla, parar y reportar, no continuar.

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

**PROYECTO COMPLETO — los 4 gates sellados.** No queda gate por abrir. Lo unico
pendiente es el push (Victor). Si se retoma para trabajo NUEVO sobre la portada,
arrancar leyendo la spec v1.1 + este MAESTRO completo.

Verificacion visual de S4 (render del estado sin_acceso) queda pendiente hasta que
exista un AREA_MANAGER sin departamento en el sistema; su logica ya esta
verificada por HTTP (smoke Gate C, escenario 7).

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

### DEUDA FUNCIONAL (reclasificada en Gate C) - layout client bloquea children

`/dashboard/inicio` cuelga de `src/app/dashboard/layout.tsx`, que es
`'use client'` y **no renderiza children hasta validar `localStorage`**
(`layout.tsx:29-61`), mostrando un spinner propio.

**En Gate B se registro como deuda cosmetica ("spinner <300ms"). Gate C
demostro que es FUNCIONAL:**

> Degrada **todo redirect server-side del arbol `/dashboard`** a redirect de
> cliente. Afecta a cualquier pagina futura del arbol que necesite redirect
> server-side, no solo a Signos Vitales. Se resuelve en el proyecto de
> auth-modernizacion.

Evidencia (Gate C): un `redirect()` desde el server component se emite
correctamente — el flight payload contiene
`"digest":"NEXT_REDIRECT;replace;/dashboard;307;"` — pero Next no puede
promoverlo a un redirect de nivel documento porque ocurre al renderizar los
children serializados dentro del boundary de un client component. El navegador
recibe 200 y el router de cliente ejecuta la navegacion tras hidratar.

Consecuencia adicional ya conocida: el rol llega correcto en el primer render
(sin flash de rol equivocado), pero el primer pintado visible es el spinner del
layout. La spec seccion 4 exige "rol confiable en primer render, sin segundo
paint" — el rol si lo esta, el paint no.

Ese layout tiene ademas un guard de auth duplicado y divergente con el del home
legacy (`page.tsx:132` redirige a `/`, `layout.tsx:34-37` a `/login`).

El header del layout (logo, GoalAlertsBell, Salir) SI se acepta como definitivo
para la portada: en una pantalla de entrada tener salida y alertas a mano es
correcto.

### Redirect de HR_OPERATOR - estado real y regla para roles futuros

El redirect server-side de HR_OPERATOR desde `/dashboard/inicio` se emite
correctamente (evidencia: digest `NEXT_REDIRECT;replace;/dashboard;307;` en el
flight payload) pero se degrada a redirect de cliente por la deuda del layout.
La linea de defensa efectiva es el fail-closed del endpoint
`/api/vitals/summary` (HR_OPERATOR no tiene `vitals:view`). En navegador real el
HR_OPERATOR termina en `/dashboard` tras hidratacion del cliente, no por HTTP.

Cuando la deuda del layout se resuelva, el redirect pasa a HTTP 307 real y la
doble proteccion (router + endpoint) queda cerrada correctamente.

**Regla para roles futuros:** si se agrega un rol al permiso `vitals:view`,
evaluar si tambien corresponde agregarlo o quitarlo de
`ROLES_A_VISTA_OPERATIVA` — hoy la coherencia entre ambos existe por
convencion, no esta enforced.

### Leccion - aserciones en smokes server-side

Aserciones sobre HTML renderizado server-side del arbol `/dashboard` son
**inverificables con curl** mientras el layout bloquee children con spinner de
localStorage. La verificacion valida en ese contexto es sobre el **payload RSC**
(digests, presencia de componentes en el flight), no sobre el HTML del `<body>`.
La verificacion de HTML se traslada a test visual en navegador o a smoke
instrumentado con Playwright, fuera del alcance de estos gates.

Caso concreto: el assert "la pagina rendereo la portada" de Gate C pasaba por
**falso positivo** — el HTML contiene "Signos" por el `<title>`, no por el
contenido. Es el segundo falso positivo de la serie (el primero fue un
`.replace()` no-op en el smoke de Gate B). Patron a vigilar: una asercion que
pasa siempre no es una asercion.

### Metodo correcto de smoke por rol - endpoints del sistema nuevo

Para endpoints que usan el patron moderno (`extractUserContext` /
`resolveVitalsAccess`), la unica forma valida de simular un rol es **acunar un
token con `generateJWT`** (`src/lib/auth.ts:71`) con payload identico al de
`api/auth/user/login/route.ts:132-150`, cambiando solo `userId`, `userEmail`,
`userRole` y `departmentId`.

**NO headers forjados.** Descubierto empiricamente en Gate C, tras una falsa
alarma sobre `middleware.ts:300`: con un token moderno el middleware
**sobrescribe** cualquier `x-user-role` que mande el cliente
(`middleware.ts:208`), asi que un smoke por headers mediria la sobrescritura del
middleware, no el rol bajo prueba.

(La falsa alarma tambien dejo un hallazgo real de seguridad, fuera del alcance
de estos gates: con un token **legacy** sin `userId`, el middleware no setea los
`x-user-*` y un header forjado por el cliente sobrevive. Queda en
`SPEC_MIDDLEWARE_LEGACY_ROLE_HARDENING_v1`, coordinado por Victor: el fix debe
cubrir `x-user-id`, `x-department-id` y `x-user-role`, y la auditoria debe
contemplar EVALUATOR-por-ciclo, que no tiene `userId` a proposito.)

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
