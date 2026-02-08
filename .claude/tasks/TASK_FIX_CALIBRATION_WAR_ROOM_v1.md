# TASK: FIX_CALIBRATION_WAR_ROOM_DUPLICATES_v1

## 📋 CONTEXTO

El War Room de calibración muestra empleados duplicados y todos agrupados en el centro sin nota de desempeño.

## ✅ DIAGNÓSTICO CONFIRMADO

| Problema | Causa Raíz | Evidencia |
|----------|------------|-----------|
| Empleados "duplicados" | Personas DIFERENTES con mismo nombre (datos de prueba) | Query SQL confirmó 3 RUTs distintos para "ZUÑIGA SANHUEZA, CLAUDIA SOLANGE" |
| Todos en el centro | API trae ratings con `calculatedScore = 0` (no evaluados) | Query SQL confirmó 2 de 3 con score = 0 |
| Sin nota de desempeño | Empleados sin `potentialScore` van al centro por default | Hook defaultea a `q5` cuando no hay potencial |

## 🎯 OBJETIVOS

1. **Filtrar solo empleados evaluados** - No mostrar ratings con `calculatedScore = 0`
2. **Diferenciar visualmente** empleados sin potencial asignado por jefe
3. **Mensaje UX claro**: "Atención, jefe no asignó potencial"

---

## 📁 ARCHIVOS A MODIFICAR

### ARCHIVO 1: API de Ratings
**Ruta:** `src/app/api/calibration/sessions/[sessionId]/ratings/route.ts`

**Cambio:** Agregar filtro `calculatedScore: { gt: 0 }` en línea ~57

```typescript
// ANTES (líneas 55-58):
const ratingWhere: any = {
  cycleId: session.cycleId,
  accountId: session.accountId
}

// DESPUÉS:
const ratingWhere: any = {
  cycleId: session.cycleId,
  accountId: session.accountId,
  calculatedScore: { gt: 0 }  // ✅ Solo empleados con evaluación completada
}
```

---

### ARCHIVO 2: Hook useCalibrationRoom
**Ruta:** `src/components/calibration/hooks/useCalibrationRoom.ts`

**Cambios:**

#### 2.1 Agregar campo `isPendingPotential` al tipo `CinemaEmployee` (~línea 40):
```typescript
export interface CinemaEmployee {
  // ... campos existentes ...
  
  // ✅ NUEVO: Flag para identificar tarjetas sin potencial asignado por jefe
  isPendingPotential: boolean
}
```

#### 2.2 Agregar `pendingPotentialCount` al tipo `CalibrationStats` (~línea 52):
```typescript
export interface CalibrationStats {
  // ... campos existentes ...
  
  pendingPotentialCount: number  // ✅ NUEVO: Contador de pendientes
}
```

#### 2.3 En el `useMemo` de `employeeList` (~línea 207), detectar potencial faltante:
```typescript
return ratings.map((rating: any) => {
  const adjustment = pendingAdjustments.find((a: any) => a.ratingId === rating.id)

  // ✅ NUEVO: Detectar si falta potencial del jefe (ANTES de adjustment)
  const originalPotentialMissing = rating.potentialScore == null
  
  // ... resto del código existente ...

  const effectivePotentialScore = adjustment?.newPotentialScore ?? rating.potentialScore

  return {
    // ... campos existentes ...
    
    // ✅ NUEVO: Flag para UI
    isPendingPotential: originalPotentialMissing && effectivePotentialScore == null,
  }
})
```

#### 2.4 En el `useMemo` de `stats` (~línea 261), contar pendientes:
```typescript
const stats: CalibrationStats = useMemo(() => {
  // ... código existente ...

  // ✅ NUEVO: Contar pendientes de potencial
  const pendingPotentialCount = employeeList.filter(emp => emp.isPendingPotential).length

  return {
    // ... campos existentes ...
    pendingPotentialCount,  // ✅ NUEVO
  }
}, [employeeList])
```

---

### ARCHIVO 3: Componente de Tarjeta Cinema
**Ruta:** Buscar el componente que renderiza las tarjetas en `CinemaGrid.tsx` o similar

**Cambio:** Agregar indicador visual cuando `isPendingPotential === true`

```tsx
// Dentro del componente de tarjeta:
{employee.isPendingPotential && (
  <div className="absolute top-0 right-0 px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded-bl-lg">
    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
      <AlertTriangle size={12} />
      <span>Atención, jefe no asignó potencial</span>
    </div>
  </div>
)}

// Agregar borde condicional a la tarjeta:
className={cn(
  "tarjeta-base-classes",
  employee.isPendingPotential && "border-amber-500/50 border-2"
)}
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

- [ ] API `/api/calibration/sessions/[sessionId]/ratings` retorna SOLO ratings con `calculatedScore > 0`
- [ ] Hook `useCalibrationRoom` expone `isPendingPotential` en cada `CinemaEmployee`
- [ ] Hook `useCalibrationRoom` expone `pendingPotentialCount` en `CalibrationStats`
- [ ] Tarjetas sin potencial muestran borde amber y mensaje "Atención, jefe no asignó potencial"
- [ ] TypeScript compila sin errores
- [ ] War Room muestra solo empleados evaluados (no duplicados por datos con score=0)

---

## 🧪 VALIDACIÓN

```sql
-- Antes del fix: Verificar cuántos ratings tienen score = 0
SELECT COUNT(*) as sin_evaluar 
FROM performance_ratings 
WHERE calculated_score = 0 OR calculated_score IS NULL;

-- Después del fix: El War Room debe mostrar SOLO los que tienen score > 0
```

---

## 📚 CONTEXTO ADICIONAL

**Regla de negocio acordada:** 
- La calibración es para empleados YA EVALUADOS (con `calculatedScore > 0`)
- El potencial (`potentialScore`) se puede asignar antes O durante la calibración
- Si el jefe no asignó potencial, la tarjeta debe mostrarse pero diferenciada visualmente
- Esto convierte un "gap de proceso" en visibilidad para accountability

**NO hacer:**
- NO filtrar por `potentialScore` (se asigna durante calibración)
- NO filtrar por `nineBoxPosition` (se calcula después de potencial)
- NO ocultar empleados sin potencial (deben verse para que el comité actúe)
