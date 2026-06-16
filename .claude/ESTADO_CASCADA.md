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
- **Opción A — orgISA agregado directo: IMPLEMENTADA** (fallback-only, ya NO es deuda). Cuando ningún depto alcanza n>=5 (bottom-up null) pero el total org es >=5, el orgISA se computa safety-only (`resolveOrgIsa` en `ISAService.ts` + pooled en `SafetyScoreService.computePooledOrgScore`), marcado `isaParcial` y nombrado en el gancho (caption de negocio `ISA_PARCIAL_CAPTION`). El desglose por área sigue gateado a 5. **Candado:** el bottom-up existente nunca se sobrescribe (cmob0e56=49 intacto, oráculo `opcionA-orgisa.test.ts`). Cascada flaca pero estable (beats se auto-gatean: `AnclaISA.tsx:43`, `ActoAnatomia.tsx:45`). Scripts de medición: `measure-orgisa-null.ts`, `measure-orgisa-direct-vs-bottomup.ts`.
- **Participación per-depto sub-umbral sin render (DEUDA de UI, decisión de producto):** `deptosCobertura` (`CoverageAnalysisService.ts:256`) computa invited/responded/rate de cada depto incl. `skipped_privacy`, pero ningún `.tsx` lo consume. Un depto <5 sin señal externa es invisible salvo en el agregado "mapa sin voz". Mostrar "respondió 3 de 8" NO viola privacy (cuántos, no qué). Candidato a vista "áreas con baja participación". Decisión de producto de Victor.
- ~~Gate de limpieza (final): remover copyFor/mundos viejos + fuente única classifyIsa~~ ✅ CERRADO (d94e094 §1 · f8583f1 §2 · 7711fbd §3).
- ~~Barrido em-dashes módulo dashboard (`ComplianceNarrativeEngine`)~~ ✅ CERRADO §3 (7711fbd): 27 em-dashes barridos, archivo ya en el auditor permanente.
- **DEUDA DE DISEÑO (chat propio): auditoría de paleta del módulo cascada/compliance contra la skill de diseño.** (a) Deriva de color acumulada: hay hex introducidos con el tiempo posiblemente desalineados de §7 — ej. el Ancla Científica muestra crítico→purple y atención→amber, que viola crítico=naranja/atención=slate/purple=solo-IA. (b) Los dos estados del gauge (campaña abierta=participación vs cerrada=ISA) pueden requerir paletas/lógica distintas. Verificar TODO contra focalizahr-design SKILL, no fix puntual. NO tocar sin gate dedicado.
- **Gate convergencia "por hecho" — ✅ CABLEADO:** los 2 callers (`ConvergenciaEngine:1114` `buildConvergencia` + `Orchestrator:274`) cargan `loadDepartmentExternalAlerts(..., { porHecho: true })`. Modo nuevo `porHecho` = espejo per-dept de `loadAlertasByDeptBulk`: **(a) estado FUERA** (status-agnóstico, sin key `status`); **(b) ventana 12m** (`CONVERGENCIA_WINDOW_MONTHS`, nueva en `convergenciaWeights.ts`, unifica con `ALERTAS_WINDOW_MONTHS`/`DENUNCIA_WINDOW_MONTHS`); **(c) PESO COMPLETO** (`factorDecaimiento=1.0`). El `where` inline se refactorizó a 2 funciones puras (`resolveExternalAlertMode` + `buildExternalAlertModeWhere`); modos `fase2`/`historical` sin cambio. `HISTORICAL_LOOKBACK_MONTHS` (6m) intacto (histórico legacy). **Candado cmob0e56 inmutable VERIFICADO**: oráculo puro `convergenciaPorHecho.test.ts` (7/7) + candado vivo `scripts/candado-convergencia-porhecho-cmob.ts` (TI/Equipos Médicos idénticos fase2↔porHecho; las 5 cerradas viven en Operaciones/Compensaciones/Personas, fuera de scope → +5 delta SOLO ahí). ISA inmune (`riskSignalsCount` score-based, `Orchestrator:302`). La copy del pie del Triage («por fecha del hecho: últimos 12 meses, sin importar estado ni desenlace») ahora coincide con el backend. tsc 0, audit 0, compliance 197/197.
  - **PRINCIPIO SELLADO (fundamento de las 3 decisiones):** *"El ISA es la verdad del ciclo, medido fresco. El score de riesgo lo pone a prueba: cuenta el hecho completo (12m, sin estado, sin decay) para traer toda la evidencia que cuestiona al ISA. La mejora se demuestra con ISA nuevo, no se asume con decay. Medir le gana a suponer; olvidar no es resolver."*
- **DEUDA NUEVA (gate propio, potente) — `senalIgnorada` usa proxy débil:** hoy `senalIgnorada` (`ConvergenciaEngine.ts:282-291,320`) se prende con `onboardingEXOScore < 60` (proxy de score), NO con la señal real `onboardingIgnoredAlerts > 0` (alerta de onboarding levantada e IGNORADA + la persona se fue). Esa señal real YA existe y se computa (`ExitRegistrationService.ts:470-478`: matchea por nationalId, cuenta alertas ignoradas=pending/dismissed-sin-resolver) y se usa en Exit Intelligence (`/api/exit/insights/onboarding-correlation`, `/api/exit/causes`). El campo `ExitRecord.onboardingIgnoredAlerts` (`schema.prisma:1333`) está poblado pero la convergencia compliance lo ignora. Subir `senalIgnorada` a la señal real = feature de Exit Intelligence con narrativa propia + lugar en la card de monitoreo futura. Render-only (no mueve ISA/severidad; `CombinatoriaDictionary.ts:48`). Gate propio. (La ventana del proxy ya se subió **6→12m** por consistencia — `SENAL_IGNORADA_EXIT_WINDOW_MONTHS` en `ConvergenciaEngine.ts`, cosmético/render-only; lo que sigue abierto es subir `senalIgnorada` del proxy de score a la señal real `onboardingIgnoredAlerts`.)
- Evolución La Voz: versión N-grande (LLM agrupa temas + citas representativas, batch persistido) cuando haya campañas con muchas voces.
- ComplianceActiveState a Cinema Mode (cosmética vieja).

## Campaña de verificación
cmob0e56 (CAMPAIGN_ID='cmob0e56u0005f7g42l11urw0'): orgISA 49 riesgo · 20% personas (10/50: Equipos Médicos 5 + TI 5) · 82% mapa sin voz · forma TODO BAJO, dimFoco P2 · 2 humo (Comercial 75 A-legal; Personas 85 B vía Cultura y DO) + 4 punto ciego 50 · 5 voces de silencio + 1 voz género TI.
