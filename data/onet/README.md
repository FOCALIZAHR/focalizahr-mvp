# O*NET + Anthropic Economic Index — Datos de Referencia

## Instrucciones de descarga

Colocar los siguientes CSVs en esta carpeta antes de ejecutar el seed:

### O*NET Database (US Dept of Labor)
Descargar desde: https://www.onetcenter.org/database.html

Archivos necesarios:
- `Occupation Data.csv` — ocupaciones con SOC code, título
- `Task Statements.csv` — tareas por ocupación con importancia
- `Skills.csv` — skills por ocupación con nivel e importancia

### Anthropic Economic Index
Descargar desde: https://huggingface.co/datasets/Anthropic/EconomicIndex

Archivo:
- `anthropic-economic-index.csv` — scores de exposición observada

## Ejecutar seed

```bash
npm run db:seed:onet
```

El script es idempotente — puede re-ejecutarse sin duplicar registros.
