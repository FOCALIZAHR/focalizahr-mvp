# Pendientes Activos — EX Clima

> **Lista viva, no historia.** Solo lo que bloquea trabajo FUTURO. Se borra la
> fila al resolverse — no se acumula. El changelog histórico (lo que ya se hizo)
> vive en `EX_CLIMA_PROGRESS.md` y no se toca desde acá.
>
> **Práctica de sello:** al sellar cualquier gate que descubra algo que bloquea
> trabajo futuro, agregar una fila acá (NO una nota en el changelog). Al
> resolverse, borrar la fila; la resolución detallada queda en el documento vivo
> de la columna 4, no en este índice.

| Qué falta | A qué bloquea | Estado | Dónde vive la resolución |
|---|---|---|---|
| `activateProduct` runtime | Botones de META_AREA/META_DURA/PDI_CLIMA en Tab 1 | Diseño cerrado, falta implementar | `SPEC_UI_META_REACTIVO_v1.md` §4/§6 |
| Reescribir "energia" (doble-barril) | 3 celdas de Capa 2 que la usan como reactivo-palanca | Pendiente decisión de banco | `AUDITORIA_BANCO_REACTIVOS_v1.md` §2 |

---

## Gate 5D-i — estado al cierre de sesión 2026-07-20 (NO SELLADO)

### ✅ Completado y verificado hoy

- **GROUP A (Paso 0 — ensamblado):** `assembleClimaDecisionInputs.ts` (puro) +
  `GET /api/clima/action-plan/generate` (preview, 0 writes). Probado contra datos
  reales de `GATE4_LOBBY_DEMO` → 17 decisiones.
- **GROUP B (Tab 1):** portada → carrusel de 4 caminos → workspace 35/65 →
  revisión uno-a-uno → encadenado → lote con sub-batches por reactivo.
- **Guardas de `isSystemic`:** `REACTIVE_SYSTEMIC_MIN_MEASURED=3` +
  `REACTIVE_SYSTEMIC_MIN_BELOW=2` (además del ratio 0.5). Sin ellas, una dimensión
  de 1-2 reactivos salía sistémica por aritmética del denominador (15/17 → 2/17).
- **3 bugs del flujo de decisión, cerrados:**
  - **A** — avance instantáneo sin feedback: botones bloqueados + "Guardando…" →
    "Guardado ✓" → recién ahí avanza. Caso congelado (`frozenRef`) + guard de fase
    contra doble clic.
  - **B** — autosave fallaba en silencio: `persist()` devuelve `PersistResult`
    tipado, maneja `!res.ok` y el catch, mensajes en lenguaje humano, franja de
    error con **Reintentar**, y **rollback** del estado local (el progreso ya no
    cuenta decisiones que no se guardaron). El lote también.
  - **C** — "Modificar" sin editor: textarea inline "¿Qué vas a ajustar?",
    "Confirmar ajuste" deshabilitado si está vacío → `ceoNotes` deja de viajar
    `undefined`.
- **Revert aprobado:** Bloque 1 volvió a los 3 botones (Aceptar/Modificar/Rechazar).
  La versión de 1 solo CTA dejaba a los sistémicos sin forma de rechazarse y trababa
  el gate `decididas === total`.
- **Verificación:** `tsc --noEmit` EXIT 0 · `npm run build` EXIT 0 ·
  smokes 7/7 (lote grouping) + 17/17 (assembler) + 36/36 (narrativas sistémicas).

### ✅ Paso 1 de la revisión — variantes Capa 2 sembradas (HECHO)

**Hallazgo:** `autonomia.amarilla` NO tenía `colaboracion` (solo `autonomia`,
`ambiente_fisico`, `herramientas`, `cohesion_equipo`, `flexibilidad`), y
`liderazgo.amarilla` NO tenía `desarrollo`. Por eso **Gestión Corriente quedaba en 0
para siempre** y el bloque era inejercitable.

**Sembradas 2 celdas** en `CLIMA_INTERVENTION_VARIANTS` (copy PROVISIONAL, requiere
revisión de Victor/Studio IA):
- `autonomia.amarilla.colaboracion` — esfuerzo BAJO / efectividad ALTA
- `liderazgo.amarilla.desarrollo` — esfuerzo BAJO / efectividad MEDIA_ALTA

**Resultado verificado en GATE4_LOBBY_DEMO:**
`{gestion_corriente: 3, sistemico: 2, critico: 11, generico: 1}` — **los 4 bloques
poblados**. Gestión Corriente: 3 casos en **2 sub-batches**
(`colaboracion` con 2 deptos, `desarrollo` con 1).

### ❌ Lo que FALTA para poder sellar 5D-i

1. **Recorrer los 4 caminos en UI** (Aceptar/Modificar/Rechazar en cada tipo + el
   lote con sus sub-batches). Solo se ejercitó Sistémico.
2. **Aprobar un plan de verdad** y confirmar en BD que se crean `ClimaActionLog` y
   los `CommunicationMessage` de recordatorio. Hoy: **`ClimaActionLog = 0`, ningún
   plan aprobado jamás**. (Walk-up de responsable ya verificado: los 57 deptos de
   Corporación Enterprise resuelven a `victor@focalizahr.cl` vía fallback
   `account_admin`; ningún email de tercero.)
3. **Estados de borde:** read-only tras aprobar · 409 de carrera (2 pestañas) ·
   empty states · un error real distinto del 403 de RBAC.
4. **Mobile 320px** — nunca verificado.
5. **GROUP C (Tab 3 · Seguimiento): NO CONSTRUIDO.** Sigue siendo `FHREmptyState`;
   no existe `ClimaPlanTrackingTab.tsx` ni endpoint de tracking. Decidir si se sella
   "5D-i sin Tab 3" o se construye antes.

### Deudas abiertas relacionadas (NO tocar sin decisión)

| Qué | Dónde | Por qué no se tocó |
|---|---|---|
| RBAC: `x-user-role` no se setea en login legacy Account | `src/middleware.ts:206-213` | El rol se calcula (`getEffectiveRole`) pero va a `x-effective-role`; `extractUserContext` lee `x-user-role` → 403 en todo endpoint con `hasPermission`. **RBAC global, se investiga en otra sesión.** |
| Toast con acción (retry) no implementado | `src/components/ui/toast-system.tsx` | La skill lo especifica como **v1.2 "Toast con acción — retry/undo"** pero el componente no tiene campo `action`. La franja de error de Bug B quedó **inline**; migrar cuando se implemente v1.2. Trabajo de plataforma, alcance propio. |
| `dangerouslySetInnerHTML` en toast | `toast-system.tsx:169` | XSS latente si un mensaje llega a incluir texto de usuario (ahora existe `ceoNotes`, escrito por el usuario). |
| `AnclaInteligente` posible corte de CTA | `src/components/executive/AnclaInteligente.tsx:140,204` | **COMPARTIDA con Goals y P&L.** Solución si se aborda: prop `compact?` aditivo (default false = cero cambio). Se le dio aire desde el wrapper de clima sin tocarla. |
| MAESTRO §3A/§8 dicen "4 cards" del Rail | `MAESTRO_EX_CLIMA.md` | Ahora son 5 (se agregó "Planes de Acción"). Actualizar al sellar. |
