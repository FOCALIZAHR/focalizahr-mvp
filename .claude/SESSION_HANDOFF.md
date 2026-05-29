# Session Handoff — Cierre Gate 3 + fold Acto 0

## Commit que cerró

**`755da77` — feat(compliance): fold voz del score en Acto 0 + restore en Señales cruzadas**

Acto 0 fold (territorios FUEGO/HUMO/PUNTO_CIEGO plegados dentro de `ActoCobertura`) + restore del render de `silencioVozExterna[]` en `SectionConvergencia` (nuevo `BandaSilencioExterna`) + reverts completos de Gate 3 (Section paralela `SectionMapaTerritorios` descartada — el motor se pliega en la cascada, no compite con ella).

## Estado del working tree

NO se tocan los siguientes archivos — son trabajo paralelo de otra sesión o tuyos:

**6 archivos modificados pre-existentes:**
- `src/components/compliance/cascada/AnclaISA.tsx`
- `src/components/compliance/cascada/CascadaCompliance.tsx`
- `src/lib/services/compliance/CascadaNarrativeDictionary.ts`
- `src/lib/services/compliance/CoverageNarrativeDictionary.ts`
- `.claude/MOTORES_INTELIGENCIA_FOCALIZAHR_v1.md`
- `src/app/preview/confidencial/page.tsx`

**Untracked previos:**
- 9 plans en `.claude/plans/` (compliance-engine-narrativas-cruce, convergencia-engine-v2-fase1/2/3, safety-score-formula-refactor, section-convergencia-c3-ui, section-convergencia-header-hibrido, section-convergencia-rebuild, sintesis-ejecutiva-c3-llm)
- `DIAGNOSTICO_WORKFORCE_2026-05-11.md`
- `prisma/backups/`
- `scripts/verify-risk-scores.ts`

## Patterns implementados

**Fold pattern del Acto 0** — el motor de territorios (`resolveDepartmentRiskNarrative` sobre `data.riskScores`) se ejecuta dentro de `ActoCobertura`, agrupa por estado, y enriquece 3 piezas existentes:

- **FUEGO**: 3 modos según estado de `denuncias_12m` — `cards` (denuncia real ≥ 1), `positive_line` ("0 denuncias formales confirmadas este ciclo." cuando cargada con 0), `hidden` (null en todos — respeta null ≠ 0).
- **HUMO**: cards reemplazan la lista `<li>` previa del sub-hallazgo "El silencio que ya habla". Cross-ref por `departmentId` con `silencioConVozExterna`.
- **PUNTO_CIEGO**: línea compacta después del sub-hallazgo con nombres separados por coma.
- **CONFIABLE**: skip en este ciclo (diluiría el punch del hero del Acto 0).

Narrativas viajan **verbatim** desde el dictionary (`DepartmentRiskNarrativeDictionary.ts`) — sin reescritura en el componente.

**Country-aware vía `legalBadgeForCountry`** — el `LegalBadgePill` extraído a `shared.tsx` lee `country` y resuelve label + tooltip por país (CL: "RIESGO LEY KARIN", default: "RIESGO DE CUMPLIMIENTO"). Renderiza solo en cards FUEGO y en HUMO rama A-legal.

## Mapa de archivos clave

| Path | Rol |
|---|---|
| `src/components/compliance/cascada/` | Root de la cascada ejecutiva (Ambiente Sano). |
| `src/components/compliance/cascada/ActoCobertura.tsx` | **Acto 0** — Hero + sub-hallazgo "el silencio que ya habla" enriquecido con motor de voz (FUEGO/HUMO/PUNTO_CIEGO). |
| `src/app/dashboard/compliance/components/sections/SectionConvergencia/BandaSilencioExterna.tsx` | **Nuevo** — banda compacta de typología "silencio que ya habla" para Señales cruzadas. Reemplaza la antigua `BandaSilencioVozExterna`. |
| `src/app/dashboard/compliance/components/sections/SectionConvergencia/index.tsx` | Banda restaurada. Cruza items con `riskScores` para resolver narrativa HUMO. |
| `src/components/compliance/cascada/shared.tsx` | `Tooltip` y `LegalBadgePill` ahora exportados desde acá (reuso cross-cascada + nueva banda). |
| `src/lib/services/compliance/ComplianceNarrativeEngine.ts` | **Builders `buildActoN`** (`buildActo1Ambiente`, `buildActo2Patron`, `buildActo3Senales`, `buildActo4Alertas`, `buildCierreFrancotirador`). **Pendiente de rewire** para actos 1-5 — el batch fold próximo. |
| `src/lib/services/compliance/DepartmentRiskNarrativeDictionary.ts` | Templates **`HUMO_A_LEGAL`** y **`FUEGO_TEMPLATE`** viven acá. "Ley Karin" está hardcoded en ambos — **pendiente country-aware** (ver patch en pendientes). |
| `src/lib/services/compliance/DepartmentRiskScoreService.ts` | Servicio del score (Gates 1-4 ya commiteados). Reusable, no se toca. |

## Decisiones estructurales abiertas

Las planteará el próximo chat — no decididas en esta sesión:

- **D1**: Cobertura rompe la Regla del Río (skill `focalizahr-design` → `cascada-ejecutiva.md`).
- **D2**: Ancla en ruta propia vs top del scroll de la cascada.
- **D3**: Mundos intermedios del espectro (qué actos disparan en qué combinaciones).
- **D4**: Clasificador determinístico del "pero" (cómo nombrar la contradicción cuando dos fuentes discrepan sin colapsar a teatro).

## Pendientes inmediatos

1. **Batch fold actos 1-5** — replicar el fold pattern del Acto 0 en `ActoAmbiente`, `ActoVoz`, `ActoSenales`, `ActoAlertas`, `ActoSintesis`. Builders existen en `ComplianceNarrativeEngine.ts`. Inventario primero (R1 del playbook que armamos en la sesión).

2. **Narrative patch country-aware + scale**:
   - Templates de `DepartmentRiskNarrativeDictionary.ts` (HUMO_A_LEGAL + FUEGO_TEMPLATE) deben usar `legalBadgeForCountry(country).label` en lugar de "Ley Karin" hardcoded.
   - HUMO Exit: "al menos alguien que se fue" en lugar de "los que se fueron" (no asume volumen).
   - HUMO Onboarding: "al menos algún talento nuevo detectó" en lugar de "el talento nuevo detecta" (mismo principio).
   - Es patch de contenido en el dictionary. No toca arquitectura.

## Referencias

- `.claude/HANDOFF_CASCADA_AMBIENTE_SANO.md` — master de la cascada (contexto completo del módulo).
- Skill `focalizahr-design` → `cascada-ejecutiva.md` — patrón canónico de cascadas ejecutivas.
