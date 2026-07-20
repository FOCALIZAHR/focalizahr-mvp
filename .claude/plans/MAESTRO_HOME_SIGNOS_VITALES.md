# MAESTRO - HOME SIGNOS VITALES

Spec: `.claude/tasks/SPEC_HOME_SIGNOS_VITALES_v1.1.md`

> Ancla de continuidad del proyecto. Mantenido por Code, versionado en git,
> actualizado al sellar CADA gate en el MISMO commit del sello. Si un chat se
> cae, este archivo mas la spec bastan para retomar en otro.

---

## Estado de gates

- [x] Gate A - backend (servicio + endpoint + permiso)
- [ ] Gate B - UI portada
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

## Proximo gate - B (UI portada)

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
.claude/plans/MAESTRO_HOME_SIGNOS_VITALES.md. Estamos en Gate B.
Cumple ceremonia focalizahr-design completa desde Gate 0.
Presenta plan en Plan Mode. No implementes.
```

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
