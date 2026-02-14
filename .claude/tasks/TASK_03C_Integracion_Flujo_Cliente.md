# TASK 03C: Integración Flujo Cliente (PRIORIDAD)

## Objetivo
Integrar el gate de clasificación en el wizard de creación de campaña del CLIENTE.

## PRIORIDAD MÁXIMA
El cliente conoce mejor sus cargos. Él debe ser quien clasifica, no el admin.

## Archivo a Modificar

```
src/app/dashboard/campaigns/new/page.tsx
```

## Referencia Técnica
Ver: `.claude/tasks/REF_TASK_03C.md`

## Cambio Requerido

### Flujo Actual (4 pasos)
```
Paso 1: Tipo de estudio
Paso 2: Configuración
Paso 3: Carga participantes CSV
Paso 4: Confirmar y lanzar
```

### Flujo Nuevo (5 pasos)
```
Paso 1: Tipo de estudio
Paso 2: Configuración  
Paso 3: Carga participantes CSV
Paso 3B: Clasificación de Cargos ← NUEVO
Paso 4: Confirmar y lanzar
```

## Lógica del Paso 3B

```typescript
// Después de carga CSV exitosa:
// 1. Ejecutar PositionAdapter sobre los Employee cargados
// 2. Mostrar <JobClassificationGate mode="client" />
// 3. Cliente resuelve pendientes
// 4. Solo cuando clasificación = 100%, habilitar "Siguiente"
```

## Criterios de Aceptación

- [ ] Paso 3B aparece después de carga CSV exitosa
- [ ] Muestra resumen de clasificación automática
- [ ] Si hay pendientes, muestra drawer para resolver
- [ ] Botón "Siguiente" disabled mientras haya pendientes
- [ ] Al completar 100%, muestra celebración y habilita continuar
- [ ] Funciona con el token del cliente (no requiere /admin)

## Dependencias
- TASK_03A completada (APIs)
- TASK_03B completada (Componentes UI)

## Notas Importantes

1. **El cliente NO accede a /admin**: El middleware bloquea. Por eso las APIs están en `/api/job-classification/` (sin /admin).

2. **RBAC automático**: El header `x-account-id` viene del token JWT del cliente. No necesita especificar accountId.

3. **Employee vs Participant**: La clasificación se hace sobre Employee. Luego al generar el ciclo de evaluación, se copia a EvaluationAssignment.evaluateePerformanceTrack.
