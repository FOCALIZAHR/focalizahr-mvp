# TASK: Optimizar generateRatingsForCycle

## Problema
El método `generateRatingsForCycle` en `src/lib/services/PerformanceRatingService.ts` tarda 7+ minutos para 49 ratings en localhost.

**Evidencia:**
```
POST .../generate-ratings 200 in 458080ms
[Performance] Generate-ratings result: 49 success, 0 failed
```

## Causa Raíz
Loop secuencial que repite queries idénticas:
- `getConfig(accountId)` → 49 veces mismo resultado
- `getResolvedWeights(accountId, cycleId)` → 49 veces mismo resultado

## Solución
1. PRE-CARGAR datos comunes ANTES del loop
2. Crear método interno que reciba config/weights como parámetros
3. Procesar en PARALELO con chunks de 10 (Promise.all)

## Restricciones
- NO cambiar firma del método público
- NO cambiar qué datos se guardan
- NO eliminar audit logs
- Mismo resultado: `{success, failed, errors}`

## Archivo
`src/lib/services/PerformanceRatingService.ts`
