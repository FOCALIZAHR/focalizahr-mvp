# Session Handoff — Cascada Ambiente Sano cerrada arquitectónicamente

**Fecha cierre:** 2026-06-11 (arquitectura: 2026-06-08)
**Plan maestro:** `.claude/plans/lee-claude-tasks-plan-cascada-que-y-cond-eventual-hejlsberg.md` (v2, aprobado 2026-06-06)
**Inventario copy pendiente:** `.claude/tasks/INVENTARIO_COPY_GATE_2_5.md` (entregable para Victor)

## Resumen ejecutivo

La cascada `Ambiente Sano` fue rearmada de raíz contra el plan §3 (espejo del PRINCIPIO de Talento, modelo de salida propio AS). El bug que rompió la cascada 4 meses (Beat 1 planta silencio → Beat 6 cierra "sin dirección clara") está resuelto **arquitectónicamente**: una sola autoridad server-side sobre el mundo D4 (`classifyD4` en `deriveBeat1Slots.ts`), `Beat1Seed` lo serializa, Beat 1 y Beat 6 lo consumen.

**Arquitectura + Gate 2.5 copy + Gate 9 audit + enriquecimiento de señal + badge FUEGO + titulares Beat 1 (Gate 5b) + Apertura-Titular v4 (Gate 1) + Gate 1.5 (A) léxico ISA + paquete de copy §A/B/C: TODO cerrado y commiteado.** Próximo gate: **Triage (zoom del pero)**, no abierto.

## ESTADO AL CIERRE (2026-06-11)

- **Working tree limpio · tsc 0 · tests 170/170** (compliance services + ActoAmbiente).
- **NADA a medio gate.** Todos los gates de la sesión están completos, verdes y commiteados. La Apertura quedó con copy 100% aprobado (sin provisionales); las variantes sin caso en esta campaña están candadas por test.
- **Commits de la sesión** (`b852cfe`→`b139842`): Gate 2.5 copy (`b852cfe`,`9b91e75`) · Gate 9 risks (`055583d`) · Nivel 1/2 señal (`3f8b437`,`a294b77`,`2b44aa1`) · copy v2 amplificadores (`b0e2fa9`) · badge FUEGO (`cc8a74f`,`af22c2f`) · titulares 5b (`c56c94e`) · handoff (`33438ae`) · Apertura v4 Gate 1 (`2de4221`,`c8f25b2`) · Gate 1.5 A léxico ISA (`6ac821e`) · paquete copy §A/B/C (`b139842`). (`9121b1a`/`a5582e5` = otra sesión paralela; bajaron el baseline 43→0.)
- **Próximo gate listo para arrancar — Triage (zoom del pero):** tiene `buildExtremosLine` exportada en `ActoAmbiente` (migra acá per §1) + helper `orgDimensions.ts` + la **regla puente del léxico** (importar solo `classifyIsa`).

### Hallazgos que no estaban en ningún doc (persistidos acá)
- **Clasificador canónico por objeto (no confundir):** para narrativa de **dimensión** → `classifyDimensionLevel` (4 niveles, crítico **<2.0**, `ComplianceNarrativeDictionary:399`). Para banda de **departamento/safetyScore** → `classifyRisk` (3 niveles, critical **<2.5**, `SafetyScoreService:115`). En la frontera 2.0–2.5 la palabra miente si se usa el equivocado. La Apertura mov3 usa `classifyDimensionLevel` (correcto).
- **Tres familias de labels de dimensión** (Triage las va a necesitar): `DIMENSION_CEO_LABELS` ("Seguridad psicológica" — nombre ejecutivo, `ComplianceNarrativeDictionary:45`) · `DIMENSION_LABELS` ("Lo que el equipo cree que pasaría si habla" — aposición descriptiva, `labels.ts:72`) · `DIMENSION_SHORT` (heatmap). El código NO las fusiona. La aposición lowercasea la inicial de `DIMENSION_LABELS` (mid-sentence).
- **`personResponseRate`** (`beat1Slots`, person-level responded/invited) ≠ **`coverage.pctCobertura`** (dept-level). La Apertura y el "silencio" usan `personResponseRate`; Triage usa coverage. Umbral "silencio" horneado = `< 50` (default GO Victor).
- **Counts org se derivan** (no hay campo org): indicios = Σ `rollups[].leyKarin.signalsCount`; denuncias = Σ `riskScores[].inputs.denuncias_12m` (respetando `null≠0`).

## Estado de la cadena

| Gate | Estado | Commit |
|---|---|---|
| Gate 1 — `AmbienteRiskOrchestrator` + `classifyD4` backend | ✅ | `5e0d488` |
| Gate 2 — `AmbienteSynthesisEngine` esqueleto (8 candidatos + boost + multiplicador) | ✅ | `374ae7e` |
| Gate 3 — Wire API: payload emite `synthesis` + `beat1Seed` | ✅ | `ab8c762` |
| Gate 5 — Beat 1 lee `beat1Seed` + titulares de factores/extremos | ✅ | `40958ca` |
| Gate 6 — Beats 2 (Triage) / 3 (Anatomía) / 5 (Nombre) + reordenar | ✅ | `b0bfca8` |
| Gate 2.5 (parcial mecánico) — 9 slots REUSE + 2 cláusulas núcleo | ✅ | `f932d6f` |
| Gate 7 — Beat 4 Voz honesta (citas literales + género, sin patrones LLM) | ✅ | `5e0cff8` |
| Gate 8 — Limpieza legacy + migración Beat 6 al Engine (Gate 4 efectivo) | ✅ | `f19f5c1` |
| **Gate 2.5 completo — copy verbatim COPY_GATE_2_5_PENDIENTE.md** | ✅ | `b852cfe` |
| **Gate 9 — Audit McKinsey ácido + risks render Beat 6** | ✅ | `055583d` |
| **Enriquecimiento señal específica (Nivel 1 + 2)** | ✅ | `3f8b437` · `a294b77` |
| **Copy v2 amplificadores (cláusulas con señal específica)** | ✅ | `b0e2fa9` |
| **Badge FUEGO Beat 6 (count synth + tooltip org-level)** | ✅ | `cc8a74f` · `af22c2f` |
| **Titulares Beat 1 (Gate 5b)** | ✅ | `c56c94e` |
| **Apertura-Titular v4 — Beat 1 (Gate 1)** | ✅ | `2de4221` |
| **Gate 1.5 (A) léxico ISA + copy §A/B/C** | ✅ | `6ac821e` · `b139842` |
| **Gate 2 Triage — investigación 0a-0e + datos reales** | ✅ (read-only, sin cablear) | `10421c1` |
| **Gate 2a Triage — el acto (grupos narrativos)** | ✅ (visto Victor) | `8dbfb2c` |
| **Gate 2b Triage — modal "ver más"** | ✅ (visto Victor) | `b16f75b` |
| **Gate 2c Triage — pulido acto + modal** | ✅ (visto Victor) | `f37a0a2` |
| **Gate 3a Anatomía — fundación dimFoco + display** | ✅ (puro) | `ffcd73e` |
| **Gate 3b Anatomía — el acto** | ✅ (visto Victor) | `5b78834` |
| **Gate 3c Anatomía — modal + shell común** | ✅ (visto Victor) | `adc15a5` |

### Gate 3 (Anatomía) — cerrado (2026-06-12, `ffcd73e`/`5b78834`/`adc15a5`)

Beat 3 completo. Sub-gates: **3a** fundación pura (`dimFoco` doble filtro gravedad→precedencia P2>P7>P3>P5>P4>P8 + `toDisplay100` 1–5→0–100, ambos en `orgDimensions.ts`); **3b** el acto (`buildAnatomia`: selector de forma DESPAREJO/+singular/TODO BAJO/TODO SANO + foco llano cyan + ⓘ + causa raíz §5 + listado por gravedad/precedencia + escala + cierre; `ActoAnatomia` reescrito, paleta §7 **violet eliminado**, hero del hallazgo; §8 migración Orchestrator+ActoAnatomia → `computeOrgDimensions`); **3c** modal (`buildAnatomiaModal` headline+body verbatim del motor; `AnatomiaDetailModal` con barra 3px+tick 75, headline cursiva; **`CascadaModalShell` extraído** — shell común heredado por Triage+Anatomía modales). Caso real cmob0e56 = TODO BAJO, foco P2. tsc 0, compliance 205/205.

**Copy verbatim fuente única = `HANDOFF_GATE_3_ANATOMIA.md`** (§4.1 formas, §4.6 cierre, §5 causa raíz). DESPAREJO-plural: "las dos que más caen por debajo de la línea" (corrección Victor, verdadera N≥2).

### Barrido de em-dashes (—) en prosa visible — CERRADO (`4e404b9`)

48 reemplazos verbatim de `TABLA_EMDASHES_BARRIDO.md` aplicados (10 archivos). Auditoría en **0** (`scripts/audit-emdashes-cascada.ts` queda como verificación permanente — debe seguir en 0). tsc 0, 205/205. **Regla del producto vigente:** ningún `—` como puntuación de prosa en texto visible; glifo de sin-dato (`'—'` standalone) permitido. Decisiones: conector mov3 (render L777 + oráculo `mov3ToText` L599) = `:` en AMBOS (invariante render=oráculo; el mapeo `·/:` de la tabla era inconsistente). `ComplianceNarrativeDictionary.ts:218` ("cuando entre") = **flag de typo preexistente para Victor**, NO tocado.

### PRÓXIMO BEAT — La Voz (Beat 4) — DISEÑO PENDIENTE

NO abrir todavía: el diseño de La Voz viene del chat de arquitectura. El `ActoVoz.tsx` actual (Gate 7) es el estado legacy a reemplazar cuando llegue el diseño.

### (histórico) Inventario de em-dashes — insumo del barrido ya cerrado

**Regla afinada (Victor 2026-06-12): prohibido el em-dash COMO PUNTUACIÓN DE PROSA en texto visible; como GLIFO DE SIN-DATO (`'—'` standalone) se permite.** Inventario read-only: `.claude/tasks/INVENTARIO_EMDASHES_CASCADA.txt` (script `scripts/audit-emdashes-cascada.ts`) — **48 ocurrencias de prosa a barrer, ~9 archivos** (excluye comentarios + glifos sin-dato + trazas internas). La tabla de reemplazos editoriales la entrega el chat de arquitectura; ese barrido es el gate siguiente.

**Borderline ya resueltos (Victor):** `AmbienteSynthesisEngine.ts:408` (`trigger` audit) EXCLUIDO · `buildTriageModal.ts:232` (`'—'` sin-dato) SE QUEDA · `ActoSintesis.tsx:95` separador → **middot `·` ya aplicado** (`b2d21da`+) · `AmbienteSynthesisDictionary.ts:83` (par parentético `—x—`) ENTRA a la tabla.

### Gate 2c (Triage) — cerrado (2026-06-12, `f37a0a2`)

Pulido sobre 2a/2b, sin rediseño (contrato `HANDOFF_GATE_2C_PULIDO_TRIAGE.md`). 6 reglas:
- **§1 idioma de gerente**: instancia `{Gerencia} · riesgo {n} de 100`; "vía" → `— el foco: {dept}`. La composición aritmética "silencio + señales" SALE del acto (solo en el modal). `buildComposicion` + el campo `composicion` eliminados.
- **§2 grupo homogéneo** (mismo score): número factorizado al kicker (`triageFactoredKicker`) + nombres en línea corrida (`triageInstanceName` con `(foco: …)`). `TriageGroup.homogeneous`/`sharedScore`. Scores distintos → líneas normales.
- **§3** kicker color de familia + peso 500 + tamaño; link corto atenuado (slate + flecha cyan); más aire entre grupos.
- **§4** hero sub-label `del mapa de gerencias, sin voz medible`.
- **§5** modal: `LO QUE DECLARARON` abre con `Participación: {pct}% — ` (pct = `rollup.silencio.participationRate`).
- **§6** `formatDepartmentName` (util compartido): preposición en mayúscula (idx>0) NO es acrónimo → "GERENCIA DE PERSONAS" → "Gerencia de Personas". **Bug del util**, fix con dueño = Victor. 6 consumidores, mejora pura. **Test candado** `formatName.test.ts` (5 casos).

Oráculos verbatim actualizados. tsc 0, suites compliance 145/145 + formatName 5/5. **La cadena del Triage (2 → 2a → 2b → 2c) queda cerrada.**

### Gate 2b (Triage) — cerrado (2026-06-11, `b16f75b`)

`buildTriageModal` (pure) + `TriageDetailModal` (portal, chrome clonado de `GoalsFindingModal`). Los `SubtleLink` del 2a abren el modal. Modo **individual** (1 gerencia, §2b completo) vs **grupo** (N gerencias, veredicto del tipo 1× + bloques compactos). Sin cards/grids/barras. `buildGerenciaRollup` ahora expone `childDeptIds` (SUS DEPARTAMENTOS sin re-derivar la agrupación; excluye la gerencia-misma del merge de ancestro). 7 oráculos del modal. tsc 0, suites cascada 119/119.

**Decisiones Victor:**
- **Tensión CONFIABLE sin filtrar/suavizar** — el reveal honesto del modelo "peor dept": muestra justo las áreas que sí respondieron. **Verificado read-only (`scripts/gate2b-verify-conisa-source.ts`): EQUIPOS MEDICOS·5resp + TI·5resp son COMPLETED en ESTA campaña cmob0e56, NO mezclan campañas.** Son las 2 gerencias (Operaciones+Tecnología) del "2 de 6" del intro 2a (= 20% personResponseRate). Sin bug.
- **Drivers VISIBLES** como texto fino bajo el score (§2b-3); el **ⓘ del score** = línea de escala `SCORE_SCALE_INFO` ("Riesgo 0–100: cuánto hay que mirar esta área, y por qué.").
- **Slot legal en PROSA** (`legalProseMarco`): CL "bajo Ley Karin" / resto "de riesgo de cumplimiento". "Es un indicio, no una denuncia." aprobada. (legalBadgeForCountry es badge, no prosa.)
- **Copy aprobado**: §2b-4 "Nada medible este ciclo…", §2b-2 "{n} puntos de silencio, {n} de señales del año", rama con_isa "ISA {n} · {Nivel}" (oráculo + **flag**: sin caso real que la ejercite).

**Deuda menor:** la rama con_isa de `LO QUE DECLARARON` no se ejercita en cmob0e56 (ninguna gerencia con_isa) — revisar copy cuando aparezca caso real. Bloques de grupo no muestran ⓘ/drivers/declararon/señales (compactos, por diseño).

### Gate 2a (Triage) — cerrado (2026-06-11, `8dbfb2c`)

`buildTriageGroups` (pure, exportado) + `ActoTriage` reescrito a GRUPOS por lectura del `DepartmentRiskNarrativeDictionary`, nivel GERENCIA (rollup autoritativo). 12 oráculos verbatim + drift-guard. tsc 0, suites cascada 112/112.

**Decisiones Victor cableadas:**
- **"vía sí misma" suprimido**: el merge de ancestro hace que el worstDept SEA la gerencia (Comercial). Guard: `nChildren>1 && worstDept.id !== groupId`. Consolida Comercial en una línea `75·HUMO/A-legal`.
- **Kickers de lectura PROPUESTOS** (el dictionary no trae títulos) en `LECTURA_KICKER`: FUEGO="Denuncia formal registrada" (reusa label de `buildFuegoBadge`), A-legal="Señal legal tras el silencio", A="Fuga de talento en gestación", B="Fricción en la entrada", PUNTO_CIEGO="Gestión sin radar", CONFIABLE="Métrica validada".
- **Sexta + OTRO MUNDO**: dedupe contra entidades nombradas en grupos (`worstDeptId` ∪ `gerenciaId` no-`__dept__:`). Banda vacía tras dedupe → no se emite. **Caso real: ambas Sexta (Comercial + Subgerencia Cultura y DO) nombradas → Sexta off; OTRO MUNDO sin items → off.** El acto real muestra SOLO los 3 grupos.

**Pendiente para 2b (NO abierto):** los links "Ver…→" están **inertes** (`SubtleLink` sin `onClick`). El modal 2b los cablea. Contrato 2b en `HANDOFF_GATE_2_TRIAGE.md §GATE 2b`. El builder ya expone `instances[].worstDeptId` y `gerenciaId` para que 2b liste departamentos del rollup. `NARRATIVA_PLURAL` + kickers viven en `buildTriageGroups.ts` (no en el dictionary auditado).
**Deuda menor:** las plurales (`NARRATIVA_PLURAL`) y kickers son "adaptación/propuesta" — si Victor afina copy, se tocan ahí. Script read-only del render real: `scripts/gate2a-triage-render-cmob0e56.ts`.

### Gate 2 (Triage) — investigación + datos reales (read-only, NADA cableado)

Sesión de investigación pura (contrato `HANDOFF_GATE_2_TRIAGE.md`). **No se cableó código.** Resultados volcados a (gitignored, locales):
- **`.claude/tasks/GATE2_INVESTIGACION.md`** — respuestas 0a-0e verificadas por símbolo + las **6 lecturas verbatim** del `DepartmentRiskNarrativeDictionary` (FUEGO/HUMO-A-legal/HUMO-A/HUMO-B/PUNTO_CIEGO/CONFIABLE) + modelo confirmado + nota hero≠intro.
- **`.claude/tasks/GATE2_DATOS_REALES.md`** — rollup REAL de cmob0e56 por gerencia (extraído read-only de la DB con `scripts/gate2-triage-rollup-cmob0e56.ts`): GERENCIA DE PERSONAS·85·HUMO/B · Gerencia Comercial·75·HUMO/A-legal (el indicio Karin) · 4× PUNTO_CIEGO. Hero=82% (coverageGapPct), intro=20% (personResponseRate). Sin FUEGO, sin CONFIABLE.

**Hallazgos clave (load-bearing para 2a):**
- **Modelo CONFIRMADO (Victor):** gerencia = **peor dept** (`buildGerenciaRollup.riesgo.maxScore` + lectura/drivers del `worstDept`, lookup en `riskScores[]`). No hay score-con-drivers por gerencia. **Exigencia de render:** si `nChildren>1` → anotar `{Gerencia} · {score} — vía {worstDept}`; 1 dept/standalone → sin anotación.
- **`resolveDepartmentRiskNarrative` (per-dept) se REUSA verbatim** en 2a (con adaptación singular↔plural aprobada). El dictionary NO trae títulos de lectura → kickers del mockup quedan propuestos para visto de Victor.
- **hero ≠ intro:** hero del Triage = `coverageGapPct` (dept-level, 82%); intro conectora = `personResponseRate` (person-level, 20%, el del titular). Dos % distintos.
- **Caveat 2a:** usar `buildGerenciaRollup(response)` directo para la lista autoritativa (el script de datos usó agrupación simplificada → duplica "Gerencia Comercial"; el rollup real las consolida en 75·HUMO/A-legal).

**Tasks a medio gate:** Gate 2a = builder puro + oráculos verbatim (copy §2a-3 + narrativas adaptadas) + pantalla del caso real para visto de Victor. No abrir 2b sin 2a aprobado. `buildExtremosLine` (exportada en `ActoAmbiente`) migra al Triage con guard (en el caso real NO se emite).

### Apertura-Titular v4 cerrada (2026-06-11, `2de4221`, contrato `HANDOFF_APERTURA_TITULAR_V4.md`)

`ActoAmbiente` reemplazó el cuerpo (`copyFor` switch de mundos) por el titular de 3 movimientos (veredicto + pero + foco), copy verbatim aprobado. `buildAperturaTitular` puro + 9 tests oráculo contra §2. 4 cableados §4 hechos; dims org-level extraídas a `orgDimensions.ts`. Provisionales flaggeados en `meta` (no afectan el caso real). Pendiente §5: veredicto de los 3 niveles ISA no-`riesgo`, variante sin-coincidencia mov3.

**Deudas reconocidas CON DUEÑO (no huérfanas):**
- **`copyFor` vivo sin llamadores en runtime** (solo lo usan sus tests). Se dejó por reversibilidad. **Dueño/trigger:** gate de limpieza de la cascada una vez que los 3 movimientos estén estables en todos los niveles ISA → remover `copyFor` + sus tests de mundos. NO antes (es el fallback histórico).
- **Migración de `ActoAnatomia:66-95` al helper `orgDimensions.ts`** (hoy duplica el cómputo). **Dueño:** el **gate de Anatomía** — se ejecuta ahí, no antes (toca el cuerpo del `useMemo`, no es un import). Idem `AmbienteRiskOrchestrator.buildOrgDimensionAverages`.
- **`buildExtremosLine`** (exportada en `ActoAmbiente`) **migra a Triage** per §1 — disponible para el próximo gate.

### Gate 1.5 (A) — léxico ISA único en pantalla (2026-06-11)

Léxico canónico unificado al de `classifyIsa`/`ISA_NARRATIVES` (**Sano / Atención / Riesgo / Crítico**). Solo se cambiaron los 3 strings de `ISA_LABELS.label` en `ISAService.ts` (`Saludable→Sano`, `En observación→Atención`, `En riesgo→Riesgo`). KEYS del union (`saludable`/`observacion`) y `getISARiskLevel` **intactos** — cero lógica tocada. `SectionAncla`/`SectionSintesis` auto-actualizan. Pantalla del Ancla (dashboard `SectionAncla`, "de 100 · Sano") mostrada + GO Victor.

**REGLA PUENTE (vigente hasta el gate de limpieza de la cascada):** todo código NUEVO de la cascada (**Triage en adelante**) importa SOLO `classifyIsa` para nivel ISA. `getISARiskLevel` queda **congelado** para los consumidores existentes (gauge color maps, `deriveBeat1Slots.banda`, `ComplianceRail`) — no se le agregan consumidores nuevos.

- **(B) Fuente única de FUNCIÓN — DIFERIDA con dueño = gate de limpieza de la cascada** (junto con `copyFor`). Deprecar `getISARiskLevel` exige tocar lógica (re-keyear los mapas de color del gauge `ISA_GAUGE_HEX`/`TESLA_SINTESIS`/`isaLevelToGaugeColor` + comparación `=== 'saludable'` y slot `banda` en `deriveBeat1Slots`) → gatilla la parada #2 del handoff. No antes de ese gate.
- **Corrección criterio de listo (#1):** la pantalla de visto del léxico ISA es **`SectionAncla` (dashboard)**, NO el Ancla de la cascada — `AnclaISA` (cascada) usa `getISARiskLevel` solo para el COLOR del gauge, no muestra palabra de banda.
- **Inconsistencia aparte (#2, fuera de scope):** `DecisionConsole:500` muestra "En observación" — es léxico de **dimensión** (`classifyDimensionLevel`, excluido del Gate 1.5). Sin tocar; anotada.

### Apertura-Titular — paquete de copy §A/B/C cableado (2026-06-11)

Reemplazados los provisionales de Gate 1 por el copy aprobado: veredicto + hero por los **4 niveles** ISA (`VEREDICTO_BY_LEVEL` + `HERO_LABEL_BY_LEVEL`; crítico = "EL AMBIENTE NO ES SANO, COMIENZA A SER TÓXICO", corrección Victor); mov3 sin-coincidencia (§B); composiciones del pero incl. **coexistencia** denuncia+indicio nombrados POR SEPARADO / jamás sumados (§C). Removido el flag `veredictoPendiente` (sin provisionales). Oráculo verbatim por cada texto nuevo (+9 tests). Variantes sin caso en esta campaña: candado por test, no por pantalla.

### Gate 2.5 cerrado (2026-06-08, commit `b852cfe`)

- Cableada copy final de `COPY_GATE_2_5_PENDIENTE.md` (NO del inventario, desactualizado en FUEGO/SILENCIO/TEATRO). 8 tipos × 4 slots + 4 cláusulas nuevas + `risks` (FUEGO_LEGAL, CONCENTRACION_MANDO).
- **Interpolación opción A**: `implicationBase` con placeholders `{deptos}{nombres}{origen}{riesgoDeptos}{totalDeptos}{orgISA}` + `interpolate()` en el Engine (NO functions). `{origen}` threaded vía `metaAnalysis.origen_organizacional` → `ORIGEN_LABELS` (recreado en el Dictionary; Orchestrator lo pobla en `data.origenOrganizacional`). `{nombres}`/`{deptos}` resuelven id→name.
- **FUEGO_LEGAL** type-agnóstico: "Denuncia formal registrada" sin nombrar la ley, sin plazos, sin `legalNote`. Badge FUEGO **DIFERIDO** (Beat 6 oculto) — no construido.
- **TEATRO base count-free** (decisión Victor 2026-06-08): el contrato sellado de 6 placeholders no incluye `teatroCount`; el cuánto/cuáles lo cargan classification + cláusula. Robusto al caso convergencia-contradice (teatroCount=0).
- **Fix colateral**: `buildAmplificadores` ahora emite NAMES (no IDs) en `TEATRO_EN_DEPTO` y `CONVERGENCIA_*` (antes solo SEXTA/OTRO_MUNDO resolvían nombre). Con las cláusulas vacías no importaba; ahora rinden copy real.
- Beat 6 deja de ocultarse para los 8 tipos reales; solo GENERIC sigue silencioso (`classification===''`).
- Tests: Engine 26 + Orchestrator 7 = 33 verde; 4-file cascada 69/69; tsc 43 baseline.
- **Pendiente del badge FUEGO** (diferido): label NEUTRO "Denuncia formal registrada" (o "· {count}"), tooltips por count en `COPY_GATE_2_5_PENDIENTE.md §TIPO 1`. NO usa `legalBadgeForCountry` (ese es de la sexta alerta). Entra cuando se diseñe el render de Beat 6 (Gate 9 o posterior).

### Gate 9 + enriquecimiento de señal (2026-06-09)

- **Gate 9 audit** (`055583d`): Beat 6 (`ActoSintesis`) ahora renderiza `risks` (hipótesis "O" de FUEGO_LEGAL/CONCENTRACION_MANDO). Hilo único ✅, diseño coherente (tokens limpios, sin los prohibidos del módulo compliance), Beat 3 sin leak de P-keys. **PENDIENTE copy (surface-only, espera chat de narrativa):** chips `AMPLIFIER_LABEL` con jerga — `"Teatro detectado"` (jerga), `"Silencio con voz externa"`/`"No invitados con rastro externo"` (borderline). NO cablear hasta copy aprobada.
- **Enriquecimiento señal específica** (Nivel 1 `3f8b437` + Nivel 2 `a294b77`): el refactor a `amplificadoresActivos` había colapsado la señal a "otras señales". Recuperada vía `Amplificador.senal? { producto, alertType, severidad, esCritica }`. Pick = Ley Karin priority, si no mayor `pesoEfectivo` (espejo `resolveDepartmentRiskNarrative` 2a). **Un dominante por amplificador** (no per-depto). Nameable: CONVERGENCIA exit+onb, OTRO_MUNDO exit+onb, SEXTA exit-dominante específico, SEXTA onboarding-dominante solo producto (límite aceptado: el caso grave Ley Karin es siempre exit). **NO persiste** `senalDominante` (schema+backfill diferido). **SIN copy** — el chat de narrativa escribe los strings (ley_karin NO literal en prosa → indicio + `legalBadgeForCountry`) y revalida con gerentes. Invariante: falta dato → cláusula genérica validada (nunca bajo el piso).

### Cierre copy + badge FUEGO + titulares (2026-06-09/11)

- **Copy v2 amplificadores** (`b0e2fa9`): cableadas las cláusulas con **señal específica** desde `COPY_AMPLIFICADORES_SENAL_ESPECIFICA_v2.md`. `SIGNAL_FRAGMENTS` (9 fragmentos vivos: 5 exit + 4 onb, keyed por alertType canónico). Cláusulas con fallback genérico validado (piso de claridad). AMBOS = fallback neutro (Engine entrega dominante global). TEATRO frase fija. **Chips `AMPLIFIER_LABEL` validados** con gerentes: "Medición sana, comentarios no" / "No respondió, pero hay señales afuera" / "Fuera del estudio, con señales" → la jerga que el Gate 9 marcó queda resuelta.
- **Badge FUEGO** (`cc8a74f` + fix tooltip org-level `af22c2f`): la pieza diferida del Gate 2.5 entra. `synth.issueCount` (Σ denuncias_12m de deptos en fuego) expuesto por el Engine. `buildFuegoBadge(count)` (Dictionary) — label NEUTRO "Denuncia formal registrada" / "Denuncia formal · {n}" + tooltip **org-level** por count (sin nombrar ley, sin departamento, sin plazos). Slot en `ActoSintesis` gateado por `diagnosticType==='FUEGO_LEGAL'`. NO toca `legalBadgeForCountry`.
- **Titulares Beat 1 (Gate 5b)** (`c56c94e`): `ActoAmbiente` renderiza `beat1Seed.{factoresTitulares, extremosTitulares}` (copy `COPY_TITULARES_BEAT1.md`). Dos sub-bloques independientes con rama vacía: A factores (voz por banda, sin número 1-5), B extremos (mejor/peor con ISA 0-100). `buildFactoresLine`/`buildExtremosLine`/`buildTitularesBeat1` puros y exportados.

**Baseline cambió: tsc 43 → 0.** El commit `9121b1a` (otra sesión paralela) restauró el productor del rollup por gerencia (`parentGerencia*` en `DepartmentRiskScoreService` + tipo + resolución jerarquía en `route.ts`), eliminando la deuda pre-existente de `buildGerenciaRollup`. **El baseline limpio ahora es 0, no 43.** Mis archivos sin errores; suites cascada **80/80** verde al cierre.

### Apertura / cierre-sobre-ISA — fase diseño (sin código, 2026-06-10/11)

Inventario read-only hecho para diseñar el titular. **Falta implementar** si la Apertura lo necesita:
- `ISA_NARRATIVES` (`SectionDimensiones/_shared/constants.ts:62`, dashboard) **no está cableado a la cascada** — import nuevo o copy propia.
- **`dimFoco`** (dimensión raíz no-la-más-baja) **no existe** en `src/`. `InterventionEngine.buildInterventionPlan` consume triggers de dimensión, no entrega una dim raíz.
- **No hay molde count-based para indicios** — solo `buildFuegoBadge` (denuncia). Indicios = `legalBadgeForCountry` (fijo por país, no count).
- Count org de indicios/denuncias **se deriva** (sumar `rollupsPerGerencia[].leyKarin.signalsCount` / `riskScores[].inputs.denuncias_12m`) — no hay campo org.
- **Clasificador canónico para "dimensión crítica" = `classifyDimensionLevel` (<2.0, 4 niveles)**, NO `classifyRisk` (<2.5, 3 niveles, ese es del safetyScore del departamento). No confundir: en 2.0-2.5 la palabra mentiría.

---

12 commits de cascada en total, 80/80 tests verde sostenido, **tsc 0 (baseline limpio post-`9121b1a`)**.

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
