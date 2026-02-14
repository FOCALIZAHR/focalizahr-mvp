# 🎯 TASK FINAL: PotentialNineBoxCard en SpotlightCard

## 📍 ARCHIVO A MODIFICAR
`src/components/evaluator/cinema/SpotlightCard.tsx`

---

## 🔧 PASO 1: AGREGAR IMPORTS

**Ubicación:** Línea ~9 (después de imports existentes)

```typescript
import PotentialNineBoxCard from '@/components/performance/PotentialNineBoxCard'
import { GhostButton } from '@/components/ui/PremiumButton'
import { Eye } from 'lucide-react'
```

---

## 🔧 PASO 2: INSERTAR CÓDIGO ENTRE GRID Y CTAS

**Ubicación exacta:** Después del `</div>` que cierra el grid, ANTES de `{/* CTAs */}`

**Buscar:**
```typescript
          {/* Grid de datos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {employee.insights.map((insight, idx) => (
              // ... código existente
            ))}
          </div>

          {/* CTAs */}
```

**Insertar ENTRE esos dos bloques:**
```typescript
          {/* Potencial y 9-Box */}
          {employee.potentialScore && (
            <div className="flex items-start gap-3 mb-4">
              <PotentialNineBoxCard
                potentialScore={employee.potentialScore}
                potentialLevel={employee.potentialLevel}
                nineBoxPosition={employee.nineBoxPosition}
                showTeslaLine={true}
                className="flex-1"
              />
              
              <GhostButton
                icon={Eye}
                size="sm"
                onClick={() => {
                  if (employee.status === 'completed' && employee.assignmentId) {
                    onViewSummary(employee.assignmentId)
                  }
                }}
              >
                Ver Resumen
              </GhostButton>
            </div>
          )}
```

---

## 🔧 PASO 3: VERIFICAR TIPO SpotlightEmployee

**Archivo:** `src/types/evaluator-cinema.ts`

**Buscar interface:** `SpotlightEmployee`

**Verificar que tenga estos campos (si NO existen, AGREGAR):**
```typescript
export interface SpotlightEmployee {
  // ... campos existentes
  
  // AGREGAR si no existen:
  potentialScore?: number | null
  potentialLevel?: string | null
  nineBoxPosition?: string | null
}
```

---

## 🔧 PASO 4: VERIFICAR API RETORNA DATOS

**Archivo:** `src/app/api/evaluator/assignments/route.ts`

**Buscar el map de assignments** y verificar que incluya:

```typescript
.map(assignment => ({
  // ... campos existentes
  
  // VERIFICAR que incluya:
  potentialScore: assignment.performanceRating?.potentialScore ?? null,
  potentialLevel: assignment.performanceRating?.potentialLevel ?? null,
  nineBoxPosition: assignment.performanceRating?.nineBoxPosition ?? null,
}))
```

**Y verificar que el include tenga:**
```typescript
include: {
  evaluatee: true,
  cycle: true,
  performanceRating: true,  // ← DEBE EXISTIR
}
```

---

## ✅ RESULTADO ESPERADO

**SpotlightCard mostrará:**
```
┌──────────────────────────────────────────┐
│  Grid de datos                           │
│  (Antigüedad/Tipo/Resultado/Completada) │
└──────────────────────────────────────────┘

┌────────────────────┐  ┌─────────────┐
│ PotentialNineBox   │  │ 👁 Ver      │
│ Card con línea     │  │ Resumen     │
│ Tesla cyan/purple  │  │ (GhostBtn)  │
└────────────────────┘  └─────────────┘

┌──────────────────────────────────────────┐
│  [COMENZAR EVALUACIÓN] [Historial]      │
└──────────────────────────────────────────┘
```

---

## 🎨 DISEÑO CUMPLE

- ✅ Glassmorphism card
- ✅ Línea Tesla dinámica (cyan/purple/amber según potencial)
- ✅ Layout horizontal (flex gap-3)
- ✅ Card flex-1, botón auto width
- ✅ GhostButton size sm
- ✅ Solo se muestra si potentialScore existe
- ✅ Botón funcional (abre summary si está completed)

---

## 📝 VALIDACIÓN POST-IMPLEMENTACIÓN

```bash
# Compilar TypeScript
npx tsc --noEmit

# Debe retornar: 0 errores
```

---

## 🔍 DEBUGGING

Si NO aparece la card:
1. Verificar que employee.potentialScore !== null en DevTools
2. Verificar que API `/api/evaluator/assignments` retorne los campos
3. Verificar que performanceRating existe en BD para ese employee

---

**EJECUTA ESTA TASK QUIRÚRGICA.**
**NO MODIFIQUES NADA MÁS.**
