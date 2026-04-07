# SESIÓN 6 — Plan de Refinamiento Descriptores + Clasificación Masiva

**Fecha**: Para próxima sesión
**Prerrequisitos**: Fases 0-5 completas (commits f7432f1 → fed2401)
**Foco**: Hacer Descriptores funcional como producto para el CEO

---

## DIAGNÓSTICO ACTUAL (investigado 2026-04-07)

### Problema 1: Tareas en inglés
- **Causa raíz**: `taskDescriptionEs` es NULL en OnetTask (el batch de traducción nunca se ejecutó)
- **Código correcto**: `t.taskDescriptionEs ?? t.taskDescription` (JobDescriptorService.ts:157) — el fallback funciona, solo faltan los datos
- **Fix**: Ejecutar batch de traducción ES. Dos opciones:
  - A) Script con Claude API que traduce las top 500 tareas (las más usadas por las 97 ocupaciones del config)
  - B) Traducción manual en CSV y re-seed
- **Recomendación**: Opción A — script `scripts/translate-onet-tasks.ts` que lee tareas con taskDescriptionEs=NULL, las traduce en batches de 20 via Claude Haiku, y actualiza

### Problema 2: Propósito vacío
- **Causa raíz**: OnetOccupation NO tiene campo `description` en el schema. El service intenta usar `titleEs` como base para un template genérico, pero `titleEs` es NULL para la mayoría
- **Código actual** (JobDescriptorService.ts:150):
  ```ts
  purpose = occupation.titleEs
    ? `Responsable de las funciones asociadas a ${occupation.titleEs.toLowerCase()}...`
    : null
  ```
- **Fix**: Dos opciones:
  - A) Agregar campo `description` a OnetOccupation y popularlo desde "Occupation Data.csv" (columna `Description` ya existe en el CSV pero no se carga)
  - B) Generar propósito con LLM desde titleEn + tasks (más rico pero depende de API key)
- **Recomendación**: Opción A + B combinadas. Primero cargar `description` del CSV (ya existe la columna). Después, si hay API key, refinar con LLM.

### Problema 3: Exposición IA no visible en wizard
- **Causa raíz**: Diseño intencional de Fase 3 ("NO mostrar exposición IA en esta pantalla")
- **Ahora el usuario QUIERE verlo**: mostrar betaScore como colores en las tareas
- **Endpoint existe**: `GET /api/descriptors/[id]/exposure` retorna adjustedExposure + genericExposure
- **Fix**: Agregar al wizard:
  - Fetch exposure después de generar propuesta
  - DescriptorTaskList: colorear tareas según betaScore (Roja >0.7, Amarilla 0.3-0.7, Verde <0.3)
  - Header con exposure score del cargo

### Problema 4: Confidence "medium"
- **Causa raíz**: FUNCIONA CORRECTAMENTE. "medium" se retorna cuando:
  - Score 4-9 pts (scoring parcial sin frase exacta)
  - Context disambiguation (ambiguo pero gerencia/nivel resuelve)
- **No es un bug** — es que el cargo no tiene exact match en los aliases

### Problema 5: Endpoint de corrección no existe
- **`/api/workforce/occupation/correct/route.ts`** NO se creó en Fase 1 (estaba en el plan pero se omitió)
- **Fix**: Crear el endpoint (simple upsert en OccupationMapping con source='MANUAL')

---

## TAREAS PARA SESIÓN 6 (en orden de prioridad)

### TAREA 6.0 — Schema: agregar `description` a OnetOccupation
- Agregar campo `description String? @db.Text @map("description")` al modelo
- Actualizar seed script para cargar columna `Description` del CSV
- `npx prisma db push`
- Re-ejecutar seed: `npm run db:seed:onet`

### TAREA 6.1 — Batch traducción tareas ES
- Crear `scripts/translate-onet-tasks.ts`
- Lee tareas con `taskDescriptionEs = NULL` (top 500 por frequency)
- Traduce en batches de 20 via Claude Haiku
- Actualiza `taskDescriptionEs` en OnetTask
- Idempotente (no re-traduce si ya tiene valor)
- También traducir `titleEs` en OnetOccupation si es NULL

### TAREA 6.2 — Fix propósito del cargo
- En `generateProposal()`: usar `occupation.description` (ahora existe del CSV)
- Si description es null: fallback a template con titleEs/titleEn
- Si hay API key: refinar con LLM (prompt: "Resume en 1-2 oraciones el propósito de este cargo para un descriptor corporativo chileno")

### TAREA 6.3 — Clasificación masiva
- Crear endpoint `POST /api/descriptors/classify-all`
  - Obtiene todos los Employee.position únicos del account
  - Ejecuta OccupationMapper.classifyBatch
  - Retorna: { classified, unclassified, total }
- Agregar botón "Clasificar todos los cargos" en DescriptoresPortada
- Mostrar toast con progreso/resultado
- Auto-refresh del ranking después

### TAREA 6.4 — Endpoint corrección manual
- Crear `src/app/api/workforce/occupation/correct/route.ts`
- PUT con body: { positionText, socCode, correctedBy }
- Upsert en OccupationMapping con source='MANUAL', confidence='HIGH'
- Permiso: descriptors:manage

### TAREA 6.5 — UI corrección UNCLASSIFIED
- En DescriptoresRanking: nuevo tab "Sin clasificar (N)"
- Cards con input de búsqueda → sugiere SOC codes
- Al seleccionar: llama PUT /api/workforce/occupation/correct
- Auto-refresh

### TAREA 6.6 — Exposición IA en Wizard (colores en tareas)
- En DescriptorWizard: fetch `/api/descriptors/[id]/exposure` post-save
- En DescriptorTaskList: cambiar de neutral a coloreado:
  - betaScore > 0.7 → border-left purple (automatizable)
  - betaScore 0.3-0.7 → border-left amber (augmentada)
  - betaScore < 0.3 o null → border-left cyan (humana)
  - Mostrar label sutil: "automatizable" / "augmentada" / "humana"
- Header del wizard: mostrar exposure % del cargo con badge

### TAREA 6.7 — Commit fase 3 completa con DashboardNavigation
- Verificar que DashboardNavigation tiene el link "Descriptores"
- Verificar que el permiso descriptors:view funciona
- Commit final de Fase 3 completa + refinamientos

---

## ARCHIVOS AFECTADOS (estimación)

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `prisma/schema.prisma` | +1 campo description en OnetOccupation |
| 2 | `prisma/seeds/onet-reference-seed.ts` | Cargar description del CSV |
| 3 | `scripts/translate-onet-tasks.ts` | NUEVO — batch traducción ES |
| 4 | `src/lib/services/JobDescriptorService.ts` | Fix purpose con description |
| 5 | `src/app/api/descriptors/classify-all/route.ts` | NUEVO — clasificación masiva |
| 6 | `src/app/api/workforce/occupation/correct/route.ts` | NUEVO — corrección manual |
| 7 | `src/components/descriptores/DescriptoresPortada.tsx` | Botón "Clasificar todos" |
| 8 | `src/components/descriptores/DescriptoresRanking.tsx` | Tab "Sin clasificar" |
| 9 | `src/components/descriptores/DescriptorWizard.tsx` | Fetch exposure + header |
| 10 | `src/components/descriptores/DescriptorTaskList.tsx` | Colores por betaScore |

**Total estimado**: ~500 líneas nuevas + ~200 líneas editadas

---

## PROMPT PARA INICIAR SESIÓN 6

```
Lee .claude/tasks/SESION_6_PLAN_DESCRIPTORES_REFINAMIENTO.md
Ejecuta las tareas 6.0 → 6.7 en orden.
Fases 0-5 ya están completas (commit fed2401).
Empieza con Tarea 6.0 (schema + seed).
```

---

## ESTADO POST-SESIÓN 5 (para contexto)

```
Commits del proyecto O*NET + Anthropic:
fed2401 Phase 5: WorkforceIntelligenceService (10 methods)
ac40806 Phase 4: descriptor-based exposure comparison
(Phase 3 commit): JobDescriptor schema + service + API + frontend
e31984d Phase 2: AIExposureService
75a7e71 Phase 0: ETL (51K registros)
f7432f1 Phase 0-1: Schema + OccupationMapper

Datos en Supabase:
- 1,016 ocupaciones (691 con scores Anthropic)
- 18,796 tareas (taskDescriptionEs mayormente NULL)
- 31,290 skills
- OccupationMapper: 97 SOC aliases + LLM fallback
- WorkforceIntelligenceService: 10 métodos de cruces operativos
- 1 descriptor confirmado de prueba
```
