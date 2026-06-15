# ESTADO_CASCADA — Ambiente Sano · Cascada Ejecutiva
> Documento de traspaso del chat de arquitectura. Se actualiza al cierre de cada gate.
> Si este chat muere o compacta: chat nuevo + este archivo + los HANDOFF_GATE_*.md en `.claude/tasks/` = continuidad total.
> Actualizado: 2026-06-14 · Gate de limpieza CERRADO — cascada SELLADA (Beats 1→6) + deuda técnica saldada.

## Método de trabajo
Chat de arquitectura (diseña en pantalla, audita copy, escribe handoffs) → Victor (visto en cada gate, copia handoffs a `.claude/tasks/`) → Claude Code (cablea con tests-oráculo verbatim, pantalla real, SIN COMMIT hasta visto) → commit. Un gate por vez; cola sin plan-documento. Sesiones de Code: misma sesión mientras dure el arco; ritual de cierre (git limpio + SESSION_HANDOFF + volcar lo no-persistido).

## Beats: estado
| Beat | Estado | Commits clave |
|---|---|---|
| 1 Apertura (titular 3 movimientos) | ✅ cerrado | 2de4221, c8f25b2 |
| 1.5 Léxico ISA único + copy niveles | ✅ cerrado | 6ac821e, b139842 |
| 2 Triage (acto+modal+pulido) | ✅ cerrado | 8dbfb2c, b16f75b, f37a0a2 |
| 3 Anatomía (3a fundación / 3b acto / 3c modal) | ✅ cerrado | adc15a5 (3c) |
| Barrido em-dashes (48) | ✅ cerrado | 4e404b9 (+b2a8a9e borderlines, b2d21da script) |
| 4 La Voz | ✅ cerrado | 81a3df8 |
| 5 El Nombre (línea de mando) | ✅ cerrado | 617bdce |
| 6 La Decisión | ✅ CERRADO · test de integridad PASADO (mecánico + editorial) | 7deeb63 |
| Gate de limpieza final | ✅ CERRADO (§1 fuente única classifyIsa · §2 remover copyFor · §3 barrido em-dashes engine) | d94e094 (§1), f8583f1 (§2), 7711fbd (§3) |

**🏁 LA CASCADA QUEDA SELLADA** (Beats 1→6) y la deuda técnica de limpieza saldada.

## Reglas selladas (NO renegociar sin Victor)
- **Em-dash prohibido** como puntuación de prosa visible; glifo sin-dato standalone permitido. Separador de la casa: middot "·". Verificación permanente: `npx tsx scripts/audit-emdashes-cascada.ts` → 0.
- **dimFoco** = doble filtro: entre las dims del nivel más grave presente, gana la precedencia causal P2>P7>P3>P5>P4>P8. Helper junto a orgDimensions.ts.
- **Display dimensiones 0–100**: (score−1)/4×100; sano ≥75; motor sigue 1–5. Toda la cascada habla "de 100".
- **Paleta sin semáforo**: crítico #EA580C · riesgo #F59E0B · atención #94A3B8 · sano/protagonista #22D3EE · purple SOLO IA.
- **Léxico ISA canónico** = classifyIsa / IsaLevel (sano/atencion/riesgo/critico). Fuente única en todo el módulo (cascada + dashboard). `getISARiskLevel` + tipo `ISARiskLevel` ELIMINADOS en el gate de limpieza §1 (d94e094); cortes 80/60/40 viven en SCORE_THRESHOLDS.
- **Clasificador de dimensión** = classifyDimensionLevel (crítico <2.0). NUNCA classifyRisk.
- Denuncia (`denuncias_12m`, null≠0) ≠ indicio. Prosa legal: CL "un indicio bajo Ley Karin"; default "un indicio de riesgo de cumplimiento" (legalProseMarco). "Es un indicio, no una denuncia." aprobada.
- Hechos cuentan por FECHA (12m), no por estado. Sin plazos, sin prescripción. El pero acota alcance, nunca validez.
- Narrativas del motor verbatim (solo número gramatical adaptable). La narrativa pertenece al TIPO; en modal de grupo el veredicto va 1× (el modal se sostiene solo).
- Acto = noticia: hero del HALLAZGO (no metodología), sin cards/grids/border-left; kickers, tipografía, hairlines. Modal admite barra 3px con tick en 75. Shell común: CascadaModalShell.
- Líneas de instancia en idioma de gerente: "riesgo {n} de 100", "· el foco: {worstDept}"; composición aritmética solo en modal; grupo homogéneo factoriza el score al kicker.
- formatDepartmentName: preposiciones ganan al heurístico de acrónimo (candado de test).
- LLM estructura (clasifica/extrae/agrupa, batch persistido auditable), dictionaries narran. JAMÁS narrativa generada en runtime frente al CEO.

## Flags abiertos (decisión de Victor)
- ComplianceNarrativeDictionary L218 "cuando entre la primera denuncia formal": posible typo (entre→entra). NO tocado.
- **Hero Triage 82% (gerencias) vs intro 20% (personas)**: universos distintos (áreas vs personas), no complementarios, no suman 100. Correcto pero un CEO puede leerlo como contradicción. Posible mejora de claridad futura (handoff Gate 6 §4) — decisión de Victor, fuera de scope.
- **Primera campaña real que emita El Nombre → revisión de Victor** (mismo patrón que la rama con_isa del modal Triage). cmob0e56 NO lo emite (criticalByManager vacío); la tres-llaves + factorización solo se validaron con fixtures sintéticos.
- Copy DESPAREJO-plural corregido a "las dos que más caen por debajo de la línea" (N≥2): confirmar aplicado en commit 3b.
- Rama con_isa del modal Triage sin caso real que la ejercite (oráculo A4 + flag).

## Deudas con dueño
- **Gancho (Síntesis) CERRADO:** reconectado a `synthesis.diagnosticType` (8 estados: 7 mundos + GENERIC), copy verbatim en `ganchoVariants.ts`, `buildPortada` eliminado, léxico ISA corregido (`ISAService.ts:206,210`). Rediseño Portada: StatusBadge + narrativa + CTA único, sin hero/chips/2º CTA. GENERIC = copy de cobertura-por-área (Mundo A: todos los deptos <5 → orgISA null), badge slate, **sin CTA** (cascada suprimida). RESUELTO.
- **Opción A — orgISA agregado directo (DEUDA 0-impacto, archivada):** `orgISA`/`orgSafetyScore` se computan bottom-up desde los deptos que pasan n>=5 (`ComplianceAnalysisOrchestrator.ts:735-753`, `SafetyScoreService.ts:388-396`); si ningún depto llega a 5 → null (Mundo A) aunque el total org supere 5 (no identifica a nadie). Medición: **0 campañas reales afectadas hoy** (la única con orgISA null tiene 4 respuestas totales, <5 también org-wide). Riesgo del arreglo ≈ 0 con **scoping fallback-only** (directo SOLO cuando bottom-up devuelve null): cmob0e56 (49) midió delta 0.0000 y su path no cambia. Caveats: ISA fallback sería safety-only (sin voz libre); la cascada por-depto queda flaca (no hay deptos analizables). Scripts: `scripts/measure-orgisa-null.ts`, `scripts/measure-orgisa-direct-vs-bottomup.ts`. Dueño: gate propio del motor safety/ISA cuando haya empresa fragmentada real.
- **Participación per-depto sub-umbral sin render (DEUDA de UI, decisión de producto):** `deptosCobertura` (`CoverageAnalysisService.ts:256`) computa invited/responded/rate de cada depto incl. `skipped_privacy`, pero ningún `.tsx` lo consume. Un depto <5 sin señal externa es invisible salvo en el agregado "mapa sin voz". Mostrar "respondió 3 de 8" NO viola privacy (cuántos, no qué). Candidato a vista "áreas con baja participación". Decisión de producto de Victor.
- ~~Gate de limpieza (final): remover copyFor/mundos viejos + fuente única classifyIsa~~ ✅ CERRADO (d94e094 §1 · f8583f1 §2 · 7711fbd §3).
- ~~Barrido em-dashes módulo dashboard (`ComplianceNarrativeEngine`)~~ ✅ CERRADO §3 (7711fbd): 27 em-dashes barridos, archivo ya en el auditor permanente.
- **DEUDA DE DISEÑO (chat propio): auditoría de paleta del módulo cascada/compliance contra la skill de diseño.** (a) Deriva de color acumulada: hay hex introducidos con el tiempo posiblemente desalineados de §7 — ej. el Ancla Científica muestra crítico→purple y atención→amber, que viola crítico=naranja/atención=slate/purple=solo-IA. (b) Los dos estados del gauge (campaña abierta=participación vs cerrada=ISA) pueden requerir paletas/lógica distintas. Verificar TODO contra focalizahr-design SKILL, no fix puntual. NO tocar sin gate dedicado.
- Motor (task propia): ConvergenciaEngine y ComplianceAlertService filtran por estado en vez de fecha.
- Evolución La Voz: versión N-grande (LLM agrupa temas + citas representativas, batch persistido) cuando haya campañas con muchas voces.
- ComplianceActiveState a Cinema Mode (cosmética vieja).

## Campaña de verificación
cmob0e56 (CAMPAIGN_ID='cmob0e56u0005f7g42l11urw0'): orgISA 49 riesgo · 20% personas (10/50: Equipos Médicos 5 + TI 5) · 82% mapa sin voz · forma TODO BAJO, dimFoco P2 · 2 humo (Comercial 75 A-legal; Personas 85 B vía Cultura y DO) + 4 punto ciego 50 · 5 voces de silencio + 1 voz género TI.
