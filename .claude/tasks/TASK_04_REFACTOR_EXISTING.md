# TASK 04: REFACTORIZAR COMPONENTES EXISTENTES

## 🎯 OBJETIVO
Eliminar clasificaciones locales y usar la config centralizada.

## 📁 ARCHIVOS A MODIFICAR
1. `src/components/performance/EvaluationReviewModal.tsx`
2. Buscar y refactorizar `calculateInsights.ts` (ubicación variable)

## ⚠️ DEPENDENCIAS
- TASK_02 completada (performanceClassification.ts existe)

## 📋 INSTRUCCIONES

### PASO 1: Refactorizar EvaluationReviewModal.tsx

**Ubicación:** `src/components/performance/EvaluationReviewModal.tsx`

#### 1.1 ELIMINAR estas líneas (aproximadamente líneas 32-81):

```typescript
// ❌ ELIMINAR TODO ESTO:
const PERFORMANCE_CLASSIFICATION = {
  // ... todo el objeto
}

function getPerformanceClassification(score: number) {
  // ... toda la función
}
```

#### 1.2 AGREGAR este import al inicio del archivo:

```typescript
// ✅ AGREGAR AL INICIO (después de otros imports):
import {
  getPerformanceClassification,
  type PerformanceLevelConfig
} from '@/config/performanceClassification'
```

#### 1.3 ACTUALIZAR el uso de la clasificación:

**ANTES:**
```typescript
const tier = getPerformanceClassification(averageScore)
// Usaba: tier.label, tier.color, tier.bg, tier.text, tier.border
```

**DESPUÉS:**
```typescript
const classification = getPerformanceClassification(averageScore)
// Usar: classification.label, classification.color, classification.bgClass, classification.textClass, classification.borderClass
```

#### 1.4 MAPEO DE PROPIEDADES (si es necesario):

| Antes (local) | Después (centralizado) |
|---------------|------------------------|
| `tier.bg` | `classification.bgClass` |
| `tier.text` | `classification.textClass` |
| `tier.border` | `classification.borderClass` |
| `tier.label` | `classification.label` |
| `tier.color` | `classification.color` |

### PASO 2: Buscar y refactorizar calculateInsights.ts

**Buscar el archivo:**

```bash
# Buscar en todo el proyecto
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "getCategory" | head -5

# O buscar por contenido
grep -r "function getCategory" src/
```

**Posibles ubicaciones:**
- `src/lib/utils/calculateInsights.ts`
- `src/services/calculateInsights.ts`
- `src/lib/calculateInsights.ts`

#### 2.1 ELIMINAR la función local:

```typescript
// ❌ ELIMINAR:
function getCategory(score: number) {
  if (score >= 4.5) return 'Excepcional'
  if (score >= 4.0) return 'Excelente'
  if (score >= 3.5) return 'Competente'
  if (score >= 3.0) return 'En Desarrollo'
  return 'Necesita Apoyo'
}
```

#### 2.2 AGREGAR import y usar centralizado:

```typescript
// ✅ AGREGAR:
import { getPerformanceClassification } from '@/config/performanceClassification'

// ✅ USAR:
const classification = getPerformanceClassification(score)
const category = classification.label
```

### PASO 3: Buscar OTRAS referencias

Ejecuta esta búsqueda para encontrar cualquier otra referencia:

```bash
# Buscar clasificaciones hardcodeadas
grep -r "Excepcional\|En Desarrollo\|Requiere Atención" src/ --include="*.tsx" --include="*.ts" | grep -v "performanceClassification"

# Buscar funciones de clasificación locales
grep -r "getPerformanceClassification\|getCategory\|PERFORMANCE_CLASSIFICATION" src/ --include="*.tsx" --include="*.ts"
```

Si encuentras más archivos, aplica el mismo patrón:
1. Eliminar función/constante local
2. Importar desde `@/config/performanceClassification`
3. Actualizar nombres de propiedades si es necesario

## ✅ CHECKLIST DE VALIDACIÓN

```bash
# 1. Verificar que no queden referencias locales
grep -r "PERFORMANCE_CLASSIFICATION" src/components/performance/

# 2. Verificar que compila
npm run build

# 3. Verificar tipos
npx tsc --noEmit
```

- [ ] EvaluationReviewModal.tsx usa import centralizado
- [ ] calculateInsights.ts usa import centralizado (si existe)
- [ ] No hay funciones `getCategory` o `getPerformanceClassification` locales
- [ ] `npm run build` pasa sin errores
- [ ] Los thresholds ahora son consistentes (4.5/4.0/3.5/2.5/0)

## 🚨 POSIBLES ERRORES

**Error: "Cannot find module '@/config/performanceClassification'"**
→ Verifica que TASK_02 esté completada

**Error: "Property 'bg' does not exist"**
→ Cambia `tier.bg` por `classification.bgClass`

**Error: Thresholds diferentes**
→ Los thresholds centralizados son: 4.5, 4.0, 3.5, 2.5, 0
→ Si el código esperaba otros valores, ajustar la lógica

## ➡️ SIGUIENTE TAREA
`TASK_05_APIS.md`
