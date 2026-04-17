# O*NET + Anthropic Economic Index — Datos de Referencia

## Estado actual

| Dato | Registros | Fuente |
|------|-----------|--------|
| Ocupaciones | 1,016 | O*NET v29.1 |
| Tareas | 18,796 | O*NET Task Statements |
| Skills | 31,290 | O*NET Skills (pivot IM/LV) |
| Exposición IA | 691 ocupaciones | Anthropic Economic Index |

## Archivos requeridos

Colocar en esta carpeta (`data/onet/`) antes de ejecutar el seed:

### O*NET Database (US Dept of Labor)

Descargar desde: https://www.onetcenter.org/database.html (v29.1+)

| Archivo | Formato | Delimitador |
|---------|---------|-------------|
| `Occupation Data.csv` | SOC code, Title, Description | TAB |
| `Job Zones.csv` | SOC code, Job Zone (1-5) | TAB |
| `Task Statements.csv` | SOC code, Task ID, Task text | TAB |
| `Skills.csv` | SOC code, Element Name, Scale ID (IM/LV), Data Value | TAB |

### Anthropic Economic Index

Descargar desde: https://huggingface.co/datasets/Anthropic/EconomicIndex

| Archivo | Formato | Delimitador |
|---------|---------|-------------|
| `anthropic-economic-index.csv` | task_name + 5 dimensiones + filtered | COMMA |
| `onet_task_mappings.csv` | task_name, pct | COMMA |
| `task_pct_v2.csv` | task_name, pct | COMMA |

## Ejecutar ETL

```bash
npm run db:seed:onet
```

### Pipeline (7 pasos en memoria antes de escribir a DB)

1. Parse ocupaciones + merge Job Zones por SOC code
2. Parse tareas (columna `Task`, guarda Task ID)
3. Parse skills con pivot `Scale ID`: `IM` → importance, `LV` → levelRequired
4. Parse Anthropic Economic Index (5 dimensiones por tarea)
5. JOIN Anthropic → O*NET por `task_name` normalizado (lowercase, trim)
6. ROLLUP ponderado por ocupación: `Σ(importance × exposure) / Σ(importance)`
7. Upsert idempotente a PostgreSQL (delete+create tasks/skills, upsert occupations)

### Rollup por ocupación

| Campo | Cálculo |
|-------|---------|
| `observedExposure` | Promedio ponderado de las 5 dimensiones Anthropic |
| `automationShare` | `directive` ponderado (IA reemplaza decisión humana) |
| `augmentationShare` | Promedio de `feedback_loop + task_iteration + validation + learning` |
| `taskCoverage` | % de tareas con datos Anthropic vs total de tareas O*NET |

## Actualización de datos

### Cuando O*NET publica nueva versión (~anual)

1. Descargar los 4 CSVs actualizados de onetcenter.org
2. Reemplazar archivos en `data/onet/`
3. Ejecutar `npm run db:seed:onet` (idempotente, actualiza sin duplicar)

### Cuando Anthropic actualiza el Economic Index (~trimestral)

1. Descargar dataset actualizado de HuggingFace
2. Reemplazar `anthropic-economic-index.csv` y `onet_task_mappings.csv`
3. Ejecutar `npm run db:seed:onet` (re-calcula rollup automáticamente)

### Verificar carga

```bash
npx prisma studio
```

Tablas: `onet_occupations`, `onet_tasks`, `onet_skills`

## Notas técnicas

- Todos los scores son `Float` (no Int) — crítico para cálculo `FTE_Liberado = importance × betaScore × FTE`
- El script es **idempotente**: puede re-ejecutarse sin duplicar registros
- Las tareas sin match Anthropic quedan con `betaScore = null` e `isAutomated = false`
- El campo `taskCoverage` indica qué % de tareas de cada ocupación tiene datos de IA
- Campos de traducción español (`titleEs`, `taskDescriptionEs`, `skillNameEs`) son nullable y se llenan en un batch posterior
