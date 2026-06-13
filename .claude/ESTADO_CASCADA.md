# ESTADO_CASCADA — Ambiente Sano · Cascada Ejecutiva
> Documento de traspaso del chat de arquitectura. Se actualiza al cierre de cada gate.
> Si este chat muere o compacta: chat nuevo + este archivo + los HANDOFF_GATE_*.md en `.claude/tasks/` = continuidad total.
> Actualizado: 2026-06-12 · post-Gate 5 El Nombre.

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
| 6 La Decisión | ⚪ existe; pendiente test de integridad contra el titular | — |
| Gate de limpieza final | ⚪ cola | — |

## Reglas selladas (NO renegociar sin Victor)
- **Em-dash prohibido** como puntuación de prosa visible; glifo sin-dato standalone permitido. Separador de la casa: middot "·". Verificación permanente: `npx tsx scripts/audit-emdashes-cascada.ts` → 0.
- **dimFoco** = doble filtro: entre las dims del nivel más grave presente, gana la precedencia causal P2>P7>P3>P5>P4>P8. Helper junto a orgDimensions.ts.
- **Display dimensiones 0–100**: (score−1)/4×100; sano ≥75; motor sigue 1–5. Toda la cascada habla "de 100".
- **Paleta sin semáforo**: crítico #EA580C · riesgo #F59E0B · atención #94A3B8 · sano/protagonista #22D3EE · purple SOLO IA.
- **Léxico ISA canónico** = classifyIsa (Sano/Atención/Riesgo/Crítico). Regla puente: cascada importa solo classifyIsa; getISARiskLevel congelado hasta limpieza.
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
- **Primera campaña real que emita El Nombre → revisión de Victor** (mismo patrón que la rama con_isa del modal Triage). cmob0e56 NO lo emite (criticalByManager vacío); la tres-llaves + factorización solo se validaron con fixtures sintéticos.
- Copy DESPAREJO-plural corregido a "las dos que más caen por debajo de la línea" (N≥2): confirmar aplicado en commit 3b.
- Rama con_isa del modal Triage sin caso real que la ejercite (oráculo A4 + flag).

## Deudas con dueño
- Gate de limpieza (final): remover copyFor/mundos viejos + fuente única classifyIsa (re-keyear mapas gauge + deriveBeat1Slots).
- Motor (task propia): ConvergenciaEngine y ComplianceAlertService filtran por estado en vez de fecha.
- Evolución La Voz: versión N-grande (LLM agrupa temas + citas representativas, batch persistido) cuando haya campañas con muchas voces.
- **Barrido em-dashes módulo dashboard**: `ComplianceNarrativeEngine` tiene 25 em-dashes legacy (acto1-4 / cierre / origen, no-cascada) + posibles más en `src/app/dashboard/compliance/`. Gate propio cuando se toque ese módulo, NO de pasada. Los 2 em-dashes cascada-visibles (Beat 5) ya barridos; el archivo queda fuera del auditor (file-scope rompería el 0) con comentario.
- ComplianceActiveState a Cinema Mode (cosmética vieja).

## Campaña de verificación
cmob0e56 (CAMPAIGN_ID='cmob0e56u0005f7g42l11urw0'): orgISA 49 riesgo · 20% personas (10/50: Equipos Médicos 5 + TI 5) · 82% mapa sin voz · forma TODO BAJO, dimFoco P2 · 2 humo (Comercial 75 A-legal; Personas 85 B vía Cultura y DO) + 4 punto ciego 50 · 5 voces de silencio + 1 voz género TI.
