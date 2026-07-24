# Pendientes Activos — EX Clima

> **Lista viva, no historia.** Solo lo que bloquea trabajo FUTURO. Se borra la
> fila al resolverse — no se acumula. El changelog histórico (lo que ya se hizo)
> vive en `EX_CLIMA_PROGRESS.md` y no se toca desde acá.
>
> **Práctica de sello:** al sellar cualquier gate que descubra algo que bloquea
> trabajo futuro, agregar una fila acá (NO una nota en el changelog). Al
> resolverse, borrar la fila; la resolución detallada queda en el documento vivo
> de la columna 4, no en este índice.

## Bloqueadores abiertos

| Qué falta | A qué bloquea | Estado | Dónde vive la resolución |
|---|---|---|---|
| `activateProduct` runtime | Botones META_AREA / META_DURA / PDI_CLIMA (5D **Tab 2 · POR PERSONA**) | Diseño cerrado, falta implementar | `SPEC_UI_META_REACTIVO_v1.md` §4/§6 |
| Reescribir "energia" (doble-barril) | 3 celdas de Capa 2 que la usan como reactivo-palanca (hoy VIVO: no está en `REACTIVE_CIRCULARITY_EXCLUDE`) | Pendiente decisión de banco | `AUDITORIA_BANCO_REACTIVOS_v1.md` §2 |
| Botón "No ahora" (`pospuesto`) en Bloque 3 | Cerrar el flujo de decisión del lote con la 4ª opción | Decisión tomada (Ruta B1), falta implementar | Ver "Bloque 3 · pospuesto" abajo |
| Diccionario `reactivoLabel()` (31 ítems) | Slug de reactivo crudo visible en `ClimaDecisionCard:123` + título del strip de lote (solo existe `dimensionLabel` para la dimensión) | PROVISIONAL / Studio IA, decisión aparte | Este doc |

### Bloque 3 · pospuesto — Ruta B1 (falta implementar)

Botón **"No ahora"** (`ceoDecision: 'pospuesto'`) junto a "Aprobar N" en Victorias Rápidas.
**Ruta B1:** valor nuevo en la union `CeoDecision`, SIN log ni recordatorio (igual que `rechazar`
para `ClimaActionLogService`/Tab 3), pero **distinguible de `rechazar` en el snapshot** para reporting
futuro (el *por qué*: no sirve vs. no era el momento). ~20 LOC (union + `DECISION_LABELS` + botón lote +
handler batch que espeja `handleAcceptBatch`). **Ruta B2** (que `pospuesto` sea MEDIBLE en la matriz →
crea log + campo de schema en `ClimaActionLog`) queda **diferida a Tab 3** (implica cambio de schema en
la BD única de producción).

---

## Gate 5D-i — pendientes del sello (2026-07-23, NO bloquean el sello)

**(a) Deuda de UX — el indicador "Plan aprobado" es poco visible.**
Hoy es texto chico en la esquina; no comunica con claridad que el usuario está en **modo revisión de un
plan ya cerrado** (inmutable). Propuesta a evaluar (NO decidida): estado más prominente + botón explícito
**"Revisar decisiones"**. No bloquea; es pulido de comunicación del estado read-only.

**(b) Cuenta demo "EmptyState A/B" — decidir si se limpia o se conserva.**
Creada esta sesión vía flujo real (submit + agregación + generate) para verificar los empty-states en
pantalla. Persistente en la BD de producción:
- `adminEmail = demo-emptystates-5di@fixture.local` · password `Demo5Di2026!` · `accountId = cmrx7lkg800009ay7zrbwmwac`
- Campaña A (empty-state, todo sano): `cmrx7ll3200029ay7s89tiuyn` · Campaña B (mixto, lote/genérico vacíos): `cmrx7psja01fe9ay72qxrinkz`
- Regenerable idempotente: `prisma/scripts/seed-clima-empty-states-demo.ts` (untracked; borra+recrea).
Pendiente decidir: **limpiar** (borrar la cuenta) o **conservar** para uso futuro. NO tocar `cmruvpmzx…`
(aprobado real) ni `cmrq30aue…` (borrador Corp Enterprise).

---

## Tab 3 (GROUP C · Seguimiento) — diferido a gate propio futuro

**NO CONSTRUIDO.** Tab 3 sigue siendo `FHREmptyState`; no existe `ClimaPlanTrackingTab.tsx` ni endpoint
de tracking. Se decidió sellar **5D-i sin Tab 3** y darle su propio gate.

> **Caso de referencia real para el alcance de Tab 3 (Victor, 2026-07-22):**
> GATE4_LOBBY_DEMO es **Pulso Express, no Experiencia Full**. Por eso sus `ClimaActionLog` (los 17 del
> plan aprobado `cmruvpmzx…`) **nunca recibirán veredicto de Tab 3 a través de ESTA misma campaña**:
> `ActionEffectivenessService.evaluateOnFollowUpClose` corre al cerrar un **Seguimiento Focalizado**
> (Experiencia Full, `isFollowUp`), midiendo el delta de mean de los mismos deptos. Un Pulso Express no
> dispara ese cierre. Para que estos logs se midan haría falta una **Experiencia Full futura sobre los
> mismos departamentos** actuando como Seguimiento. Dato a considerar al definir el gate de Tab 3: qué
> tipos de campaña habilitan la matriz de efectividad.

---

## Enhancement diferido (NO bloqueante) — consolidación de Bloque 2 (Crítico)

Bloque 2 hoy son tarjetas individuales inamovibles → a escala (300 deptos = 300 clics). Patrón `deptGroups`
de `DecisionConsole.DetailPanel.tsx` es **viable y BARATO-A-MODERADO**, NO choca con el modelo de datos ni
con Tab 3 (la persistencia N-broadcast ya existe en `handleAcceptBatch`; el gate `decididas===total` sigue
igual). Trabajo: helper `groupCriticoBySharedPlan` + handler decisión-batch modificar/rechazar + header
"transversal N deptos" en `ClimaDecisionCard` + refactor de `ClimaCaseReview` a grupos (~90-110 LOC).
Salvaguarda: agrupar SOLO con plan literalmente idéntico + mostrar los N deptos explícitos. **Deuda
documentada, NO bloqueante.**

---

## Deudas abiertas relacionadas (NO tocar sin decisión)

| Qué | Dónde | Por qué no se tocó |
|---|---|---|
| RBAC: `x-user-role` no se setea en login legacy Account | `src/middleware.ts:206-213` | El rol se calcula (`getEffectiveRole`) pero va a `x-effective-role`; `extractUserContext` lee `x-user-role` → 403 en todo endpoint con `hasPermission`. **RBAC global, se investiga en otra sesión.** |
| Toast con acción (retry) no implementado | `src/components/ui/toast-system.tsx` | La skill lo especifica como **v1.2 "Toast con acción — retry/undo"** pero el componente no tiene campo `action`. La franja de error de Bug B quedó **inline**; migrar cuando se implemente v1.2. Trabajo de plataforma, alcance propio. |
| `dangerouslySetInnerHTML` en toast | `toast-system.tsx:169` | XSS latente si un mensaje llega a incluir texto de usuario (ahora existe `ceoNotes`, escrito por el usuario). |
| `AnclaInteligente` posible corte de CTA | `src/components/executive/AnclaInteligente.tsx:140,204` | **COMPARTIDA con Goals y P&L.** Solución si se aborda: prop `compact?` aditivo (default false = cero cambio). Se le dio aire desde el wrapper de clima sin tocarla. |
| MAESTRO §3A/§8 dicen "4 cards" del Rail | `MAESTRO_EX_CLIMA.md` | Ahora son 5 (se agregó "Planes de Acción"). Consistencia de doc, no bloqueante. |
| 5 smokes trackeados de gates previos (5A / 5B-ii / 5C / 5D-x) | `prisma/scripts/smoke-clima-*.ts` | Evaluar en su propia sesión cuál es verificación puntual vs. regresión permanente. No urgente. |
