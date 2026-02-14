# TASK 03A: API Job Classification (Base)

## Objetivo
Crear APIs de clasificación de cargos que trabajen sobre Employee (NO Participant) y sean accesibles tanto por clientes como administradores.

## IMPORTANTE: NO en /api/admin/
Las APIs van en `/api/job-classification/` para que el middleware NO bloquee a clientes.

## Archivos a Crear

```
src/app/api/job-classification/
├── review/route.ts       # GET - Lista empleados sin clasificar
├── assign/route.ts       # POST - Asignar nivel manual
├── batch-assign/route.ts # POST - Asignar múltiples
└── validate/route.ts     # GET - Pre-check antes de generar ciclo
```

## Referencia Técnica
Ver: `.claude/tasks/REF_TASK_03A.md`

## Criterios de Aceptación

- [ ] GET /api/job-classification/review retorna Employee con standardJobLevel = NULL
- [ ] POST /api/job-classification/assign actualiza Employee + JobMappingHistory
- [ ] GET /api/job-classification/validate retorna {canProceed, pendingCount, anomalyCount}
- [ ] RBAC: CLIENT solo ve su cuenta, ADMIN puede especificar accountId
- [ ] Todos los endpoints tienen manejo de errores consistente
- [ ] TypeScript estricto sin any

## Comando de Test
```bash
# Después de implementar, probar con Thunder Client:
GET /api/job-classification/review
Headers: x-account-id: cmfgedx7b00012413i92048wl

GET /api/job-classification/validate
Headers: x-account-id: cmfgedx7b00012413i92048wl
```
