# Session Handoff — Cascada Ambiente Sano cerrada arquitectónicamente

**Fecha cierre:** 2026-06-08
**Plan maestro:** `.claude/plans/lee-claude-tasks-plan-cascada-que-y-cond-eventual-hejlsberg.md` (v2, aprobado 2026-06-06)
**Inventario copy pendiente:** `.claude/tasks/INVENTARIO_COPY_GATE_2_5.md` (entregable para Victor)

## Resumen ejecutivo

La cascada `Ambiente Sano` fue rearmada de raíz contra el plan §3 (espejo del PRINCIPIO de Talento, modelo de salida propio AS). El bug que rompió la cascada 4 meses (Beat 1 planta silencio → Beat 6 cierra "sin dirección clara") está resuelto **arquitectónicamente**: una sola autoridad server-side sobre el mundo D4 (`classifyD4` en `deriveBeat1Slots.ts`), `Beat1Seed` lo serializa, Beat 1 y Beat 6 lo consumen.

**Mi parte (arquitectura) cerrada y commiteada. Lo que falta: ~22 strings de copy (Victor entrega aparte) + Gate 9 audit ácido (después).**

## Estado de la cadena

| Gate | Estado | Commit |
|---|---|---|
| Gate 1 — `AmbienteRiskOrchestrator` + `classifyD4` backend | ✅ | `5e0d488` |
| Gate 2 — `AmbienteSynthesisEngine` esqueleto (8 candidatos + boost + multiplicador) | ✅ | `374ae7e` |
| Gate 3 — Wire API: payload emite `synthesis` + `beat1Seed` | ✅ | `ab8c762` |
| Gate 5 — Beat 1 lee `beat1Seed` + titulares de factores/extremos | ✅ | `40958ca` |
| Gate 6 — Beats 2 (Triage) / 3 (Anatomía) / 5 (Nombre) + reordenar | ✅ | `b0bfca8` |
| Gate 2.5 (parcial mecánico) — 9 slots REUSE + 2 cláusulas núcleo | 🟡 | `f932d6f` |
| Gate 7 — Beat 4 Voz honesta (citas literales + género, sin patrones LLM) | ✅ | `5e0cff8` |
| Gate 8 — Limpieza legacy + migración Beat 6 al Engine (Gate 4 efectivo) | ✅ | `f19f5c1` |
| **Gate 2.5 completo (~22 strings de copy)** | ⏸️ | **Victor entrega aparte** |
| **Gate 9 — Audit McKinsey ácido** | ⏸️ | después de Gate 2.5 |

7 commits en una sesión, 78/78 tests verde sostenido, tsc 43 errores (idéntico baseline — los pre-existentes en `buildGerenciaRollup.ts:275` etc. son deuda anterior).

## Archivos clave creados / modificados

### Backend nuevo

- `src/types/ambiente-cascada.ts` — contrato público completo (`Beat1Seed`, `AmbienteRiskData`, `AmbienteRiskNarratives`, `AmbienteRiskPayload`, `DiagnosticType` 8 tipos + GENERIC, `Amplificador` 6 tipos, `AmbienteSynthesis`, `FactoresTitulares`, `ExtremosTitulares`). Documentación arriba: dónde leen los Beats nuevos (capa Orchestrator, NO response crudo).
- `src/lib/services/compliance/AmbienteRiskOrchestrator.ts` — wrap del `ComplianceReportResponse`. `buildAmbientePayload()` compone `data + narratives + beat1Seed + synthesis + reportNarratives`. `buildBeat1Seed()` ejecuta `classifyD4` + `deriveBeat1Slots` + titulares (banda alta=fortalezas; observación/baja=debilidades + fortaleza relativa).
- `src/lib/services/compliance/AmbienteSynthesisEngine.ts` — motor diferencial. `detect → afinidad → convergencia → tipo 8 → selectDominant → amplificadores → ensamblar`. Boost +10 afinidad mundoDominante. Multiplicador asimétrico convergencia (×1.3 confirma / +20 contradice activa CONTRADICCION_TEATRO desde cero). Composición `implication = base + cláusulas.join(' ')` en orden fijo.
- `src/lib/services/compliance/AmbienteSynthesisDictionary.ts` — **parche mecánico Gate 2.5**: 9 slots REUSE verbatim (CONCENTRACION_MANDO 2, SISTEMICO_SIN_MANDO 2, TODO_BIEN 3, GENERIC path, AMBOS clause núcleo, SEXTA_ALERTA clause). ADAPT y NUEVA esperan a Victor (todos como `""`).

### Backend modificado

- `src/lib/services/compliance/deriveBeat1Slots.ts` — `classifyD4` + `intensidadFromISA` + `bumpIntensidad` movidos desde `ActoAmbiente.tsx` (client-side) → server-side. `classifyD4Trace` auditable.
- `src/config/narratives/ComplianceNarrativeDictionary.ts` — agregado `DIMENSION_CEO_LABELS` map (P2_seguridad → "Seguridad psicológica" etc).
- `src/lib/services/compliance/ComplianceNarrativeEngine.ts` — borrados `buildCierreFrancotirador` + `SintesisFrancotirador` + key `cascada.sintesis`. Acto1-4 siguen computándose (deuda menor — gate hygiene posterior).
- `src/types/compliance.ts` — `ComplianceReportResponse.data` gana `beat1Seed?` + `synthesis?`.
- `src/app/api/compliance/report/route.ts` — wire del Orchestrator + Engine al final del path executive. Cero queries nuevas.

### Frontend cascada

- `src/components/compliance/cascada/CascadaCompliance.tsx` — secuencia final `Ancla → 1 → 2 → 3 → 4 → 5 → 6`.
- `src/components/compliance/cascada/ActoAmbiente.tsx` — Beat 1, prefiere `beat1Seed` server-side, fallback recálculo client.
- **NUEVO** `ActoTriage.tsx` — Beat 2. Hero condicional silencio/peligro según `coverageGapPct`. Ranking per-dept FUEGO → HUMO → PUNTO_CIEGO → CONFIABLE con narrativas VERBATIM de `resolveDepartmentRiskNarrative`. Bandas Sexta + OTRO MUNDO neutras debajo.
- **NUEVO** `ActoAnatomia.tsx` — Beat 3. 6 dims P2/P3/P4/P5/P7/P8 ponderadas org-level con labels CEO + headlines verbatim de `COMPLIANCE_DIMENSION_DICTIONARY[key][level]`. Privacy: dim sin masa se omite.
- `ActoVoz.tsx` — **reescritura completa Gate 7**. Citas literales agregadas de `departments[].patrones.fragmentos` + cláusula género `narratives.alertasGenero[].evidenciaGenero`. CERO jerga LLM/patrón.
- **NUEVO** `ActoNombre.tsx` — Beat 5. Consume `narratives.criticalByManagerNarrativa` verbatim. AREA_MANAGER → endpoint envía undefined.
- `ActoSintesis.tsx` — Beat 6 migrado a `payload.synthesis`. Guard `classification === ''` → render oculto silencioso (anti-rec #3 del plan: "Mientras Engine emita '', Beat 6 se oculta, no renderiza roto").

### Borrados (Gate 8)

- `ActoCobertura.tsx`, `ActoCoberturaModal.tsx` — Beat 0 legacy descartado por MAPA.
- `ActoSenales.tsx` — convergencia legacy. Contenido absorbido en Triage + Nombre.
- `ActoAlertas.tsx` — alertas legacy. Karin → cláusula ortogonal Beat 1, sexta → componente Beat 2.

### Tests

- `src/lib/services/compliance/AmbienteRiskOrchestrator.test.ts` — 7 tests end-to-end (wire cmob0e56 → SILENCIO_SIN_VOZ + titulares).
- `src/lib/services/compliance/AmbienteSynthesisEngine.test.ts` — 19 tests (8 candidatos + boost + multiplicador asimétrico + amplificadores + dictionary REUSE).
- + 14 deriveBeat1Slots + 38 ActoAmbiente pre-existentes que siguen verdes.

## Lo que falta (NO mío)

### 1) Gate 2.5 — copy verbatim Victor

**Inventario detallado:** `.claude/tasks/INVENTARIO_COPY_GATE_2_5.md` (entregable durable, local — gitignored por convención).

**Resumen pendiente** (~22 strings):

| Tipo | Slot | Estado | Fuente recomendada |
|---|---|---|---|
| FUEGO_LEGAL | classification, path, accountability, legalNote, risks[] | NUEVA | concept (excepción vocab: "denuncia" / "Ley Karin" OK) |
| FUEGO_LEGAL | implicationBase | ADAPT | `DepartmentRiskNarrativeDictionary.FUEGO_TEMPLATE` per-dept → org |
| SILENCIO_SIN_VOZ | classification, path | NUEVA | concept "el silencio que ya habla" |
| SILENCIO_SIN_VOZ | implicationBase | ADAPT | combina `ActoAmbiente.copyFor.silencio.CELDA_PUENTE` para 3 + `HUMO_A_LEGAL` |
| SILENCIO_SIN_VOZ | accountability | REUSE | `buildCierreFrancotirador.cultural.accountability` |
| CONTRADICCION_TEATRO | classification, accountability | ADAPT | `buildPortada.teatro` + `buildActo2Patron.teatro.coachingTip` |
| CONTRADICCION_TEATRO | implicationBase | REUSE | `buildActo2Patron.teatro.parrafoGancho` verbatim |
| CONTRADICCION_TEATRO | path | NUEVA | concepto "creele a lo que escribieron" |
| CONCENTRACION_MANDO | implicationBase | REUSE | `buildCierreFrancotirador.localizado.implication` (decidir interpolación) |
| CONCENTRACION_MANDO | path, risks[] | ADAPT | `buildCriticalByManagerNarrative.una_linea` |
| SISTEMICO_SIN_MANDO | implicationBase | REUSE | `buildCierreFrancotirador.sistemico.implication` (decidir interpolación) |
| SISTEMICO_SIN_MANDO | path | NUEVA | concepto "rediseñar, no reemplazar" |
| OBSERVACION_SIN_FOCO | 4 slots | NUEVA | sin precedente — ver §3.5.8 del plan |
| BIEN_CON_FOCOS | 4 slots | ADAPT mayoría | `buildPortada.riesgo_concentrado` + `buildActo1Ambiente.riesgo_concentrado` |
| TODO_BIEN | path | ADAPT | `buildCierre.sin_riesgo` recortado |
| Cláusula TEATRO_EN_DEPTO | — | ADAPT | `buildPortada.teatro.subtitular` |
| Cláusula CONVERGENCIA_EXIT | — | ADAPT | `HUMO_A` + `buildConvergenciaCruce.unica` |
| Cláusula CONVERGENCIA_ONBOARDING | — | ADAPT | `HUMO_B` |
| Cláusula OTRO_MUNDO | — | NUEVA | sin precedente |

**Decisión arquitectónica pendiente Gate 2.5**: shape para `implicationBase` con interpolación. TIPO 4 y TIPO 5 implication tienen `${nombres}` / `${origen}` / `${riesgoDeptos}` que se interpolan en runtime. Hoy `implicationBase` es `string`. Opciones:
- A) Mantener `string` con placeholders `{nombres}` y resolver en `Engine.buildSynthesis`.
- B) Cambiar a `(context: SynthesisContext) => string` — más flexible pero más código.

Recomiendo A: minimal y predecible. Pero queda abierta para Victor.

**Archivo destino:** `src/lib/services/compliance/AmbienteSynthesisDictionary.ts`. Estructura ya armada con todos los slots; Victor solo llena strings.

**Excepción de vocabulario** autorizada explícitamente (`DepartmentRiskNarrativeDictionary.ts:12-20`): "denuncia formal" y "Ley Karin" SE NOMBRAN en `FUEGO_LEGAL` y en cláusula `SEXTA_ALERTA` Karin. NO se eufemizan.

### 2) Gate 9 — Audit ácido McKinsey

Después de que Gate 2.5 esté completo:
- Recorrer la cascada con las skills `cascada-ejecutiva` + `focalizahr-narrativas` + `focalizahr-design`.
- Validar test del hilo único: Beat 1 planta X → Beat 6 NOMBRA ese X.
- Cero "marcador", "score", "LLM", "patrón", "convergencia" expuesto al CEO.
- "¿lee un CEO esto y entiende sin preguntar?".

## Decisiones arquitectónicas tomadas en sesión (no las reabras)

1. **Talento es referencia del PRINCIPIO, no plantilla.** Modelo de salida AS propio (`amplificadoresActivos[]`, `convergenciaProductos`, `beat1Seed` como input formal).
2. **`AmbienteRiskPayload`** = `data` + `narratives` + `beat1Seed` + `synthesis` + `reportNarratives` (passthrough legacy). Los Beats nuevos leen de `data` + `narratives` — NO del response crudo.
3. **Convergencia productos asimétrica**: confirma multiplica top ×1.3; contradice activa CONTRADICCION_TEATRO desde cero (+20). NUNCA candidato propio.
4. **`OBSERVACION_SIN_FOCO` como tipo 8** (no GENERIC). 8 tipos sellados.
5. **Beat 2 hero condicional silencio/peligro** según `coverageGapPct ≥ 50` (MAPA §12 — decisión Victor cerrada).
6. **Beat 1 nombra titulares; Beats 2-3 desarrollan detalle** (zoom progresivo). `Beat1Seed.factoresTitulares` + `extremosTitulares` se computan server-side.
7. **`classifyD4` server-side** (`deriveBeat1Slots.ts`). Una autoridad para Beat 1 y Beat 6.
8. **Beat 6 silencioso hasta Gate 2.5** (anti-rec #3): si `synthesis.classification === ''` → render oculto.

## Deudas técnicas reconocidas

- **Acto1-4 legacy en `buildReportNarratives`**: siguen computándose aunque nadie en UI los consume tras Gate 6. Borrarlos como tarea de hygiene aparte (no toca contrato del Engine).
- **Bug pre-existente `buildGerenciaRollup.ts:275`** (`parentGerenciaId`): precede a esta sesión. `next build` typecheck falla acá pero `next compile` pasa. No tocado.
- **`onVerDetalle` de ActoAmbiente eliminado en Gate 6**: bug pre-existente accidentalmente arreglado por refactor de CascadaCompliance.

## Cómo continuar la próxima sesión

1. Si Victor entrega copy → llenar `AmbienteSynthesisDictionary.ts`, correr tests (deben seguir verde), commit `feat(compliance): copy verbatim Gate 2.5 completo`.
2. Si después de eso → Gate 9 audit ácido (recorrer la cascada con las 3 skills auditoras).
3. Si querés cerrar la deuda acto1-4 → quitar `buildActo1-4` functions de `ComplianceNarrativeEngine.ts` + remover key `cascada` del `ReportNarratives` + quitar guard `!data.narratives.cascada` de `CascadaCompliance.tsx`. Cada Beat tiene su propio guard interno.

## Entrypoints útiles

- Tests cascada: `npx tsx --test src/lib/services/compliance/AmbienteRiskOrchestrator.test.ts src/lib/services/compliance/AmbienteSynthesisEngine.test.ts`
- Diagnóstico tsc: `npx tsc --noEmit | wc -l` (baseline esperado: 43)
- Build smoke: `npx next build` (typecheck falla en deuda pre-existente, compile pasa)
- Plan maestro: `.claude/plans/lee-claude-tasks-plan-cascada-que-y-cond-eventual-hejlsberg.md`
- Inventario copy: `.claude/tasks/INVENTARIO_COPY_GATE_2_5.md`
