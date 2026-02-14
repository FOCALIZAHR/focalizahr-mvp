# 🎯 TASK: Integrar PotentialNineBoxCard + Botón "Ver Resumen"

## 📋 CONTEXTO

**Archivo objetivo:** `src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx`

**Componente ya creado:** `src/components/performance/PotentialNineBoxCard.tsx`

**Ubicación de integración:** Dentro de `rightColumnContent`, específicamente en la vista `calibracion`, entre `PerformanceScoreCard` y `TeamCalibrationHUD`.

---

## 🎨 OBJETIVO DE DISEÑO

Actualmente existe un texto plano mostrando:
```
Potencial: 3.0 (medium)
9-Box: high performer
```

**Debe reemplazarse por:**
1. **PotentialNineBoxCard** (componente premium con glassmorphism + línea Tesla)
2. **Botón "Ver Resumen"** tipo `GhostButton` minimalista, posicionado al lado derecho de la card

**Layout horizontal esperado:**
```
┌──────────────────────┐ ┌─────────────────┐
│ PotentialNineBoxCard │ │ [👁 Ver Resumen]│
│ Potencial: 3.0       │ │  GhostButton sm │
│ 9-Box: High Performer│ └─────────────────┘
└──────────────────────┘
```

---

## ✅ REQUISITOS TÉCNICOS

### 1. **Importar componentes necesarios**

```typescript
// Al inicio del archivo summary/page.tsx, agregar:
import PotentialNineBoxCard from '@/components/performance/PotentialNineBoxCard'
import { GhostButton } from '@/components/ui/PremiumButton'
import { Eye } from 'lucide-react'
```

### 2. **Agregar estado para datos de potencial**

```typescript
// Después de los estados existentes (teamMembers, activeView, etc.):
const [potentialData, setPotentialData] = useState<{
  potentialScore: number | null
  potentialLevel: string | null
  nineBoxPosition: string | null
} | null>(null)
```

### 3. **Agregar useEffect para cargar datos**

```typescript
// Después del useEffect que carga teamData, agregar:
useEffect(() => {
  async function fetchPotentialData() {
    if (!summary?.cycle?.id || !summary?.evaluatee?.id) return
    
    try {
      const token = localStorage.getItem('focalizahr_token')
      if (!token) return

      const res = await fetch(
        `/api/performance-ratings/nine-box?cycleId=${summary.cycle.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!res.ok) return

      const json = await res.json()
      if (json.success && json.data.grid) {
        // Buscar el empleado actual en toda la grid
        const employeeData = json.data.grid
          .flatMap((cell: any) => cell.employees)
          .find((emp: any) => emp.employeeId === summary.evaluatee.id)
        
        if (employeeData) {
          setPotentialData({
            potentialScore: employeeData.potentialScore,
            potentialLevel: employeeData.potentialLevel,
            nineBoxPosition: employeeData.nineBoxPosition
          })
        }
      }
    } catch (err) {
      console.error('[Summary] Error fetching potential data:', err)
    }
  }

  fetchPotentialData()
}, [summary])
```

### 4. **Modificar rightColumnContent**

**UBICACIÓN EXACTA:** Dentro de la vista `calibracion`, en el `<div className="space-y-3">`, entre `PerformanceScoreCard` y `TeamCalibrationHUD`.

**CÓDIGO A INSERTAR:**

```typescript
{/* PerformanceScoreCard - Score en escala 1-5 */}
{scoreOn5 !== null && (
  <PerformanceScoreCard
    score={scoreOn5}
    showProgressBar
    showTeslaLine
    size="sm"
    className="w-full"
  />
)}

{/* ═══════════════════════════════════════════════════════════════
    NUEVO: PotentialNineBoxCard + Botón Ver Resumen
    Layout horizontal: Card (flex-1) + Botón (auto width)
   ═══════════════════════════════════════════════════════════════ */}
{potentialData && (
  <div className="flex items-start gap-3">
    {/* Card de Potencial - Ocupa espacio disponible */}
    <PotentialNineBoxCard
      potentialScore={potentialData.potentialScore}
      potentialLevel={potentialData.potentialLevel}
      nineBoxPosition={potentialData.nineBoxPosition}
      showTeslaLine={true}
      className="flex-1"
    />
    
    {/* Botón Ver Resumen - Minimalista Ghost */}
    <GhostButton
      icon={Eye}
      size="sm"
      onClick={() => {
        // TODO: Implementar navegación al reporte completo
        console.log('Ver resumen completo')
      }}
    >
      Ver Resumen
    </GhostButton>
  </div>
)}

{/* TeamCalibrationHUD - ranking del equipo */}
{teamMembers.length > 0 ? (
  // ... código existente de TeamCalibrationHUD
)}
```

---

## 🎨 ESPECIFICACIONES DE DISEÑO

### **PotentialNineBoxCard:**
- ✅ Glassmorphism: `bg-slate-800/30 backdrop-blur-md`
- ✅ Línea Tesla superior dinámica (color según potencial)
- ✅ `className="flex-1"` para ocupar espacio disponible
- ✅ Mobile-first responsive (ya integrado en componente)

### **GhostButton "Ver Resumen":**
- ✅ Variante: `GhostButton` (transparente + border)
- ✅ Tamaño: `sm` (h-9 px-3 text-sm)
- ✅ Icono: `Eye` de lucide-react
- ✅ Sin glow (por defecto en botones small)
- ✅ Background: `rgba(15, 23, 42, 0.95)`
- ✅ Border: `1px solid rgba(148, 163, 184, 0.2)`

### **Layout Container:**
```typescript
<div className="flex items-start gap-3">
  // items-start: alinea tops de ambos elementos
  // gap-3: 12px de separación horizontal
  // flex: layout horizontal responsive
</div>
```

---

## 📱 RESPONSIVE BEHAVIOR

**Desktop (640px+):**
```
┌──────────────────────────┐ ┌─────────────┐
│  PotentialNineBoxCard    │ │ Ver Resumen │
│  (flex-1 = crece)        │ │  (auto)     │
└──────────────────────────┘ └─────────────┘
```

**Mobile (320px-640px):**
- Layout sigue siendo horizontal
- Card se comprime ligeramente
- Botón mantiene tamaño mínimo sm
- Si es muy estrecho, considerar stack vertical (opcional)

---

## ✅ CHECKLIST DE VALIDACIÓN

Después de implementar, verificar:

1. ✅ El componente `PotentialNineBoxCard` se renderiza correctamente
2. ✅ La línea Tesla superior cambia de color según nivel de potencial
3. ✅ El botón "Ver Resumen" está visible al lado derecho
4. ✅ El botón tiene estilo `GhostButton` (transparente + border)
5. ✅ El layout es horizontal con `gap-3` entre elementos
6. ✅ La card tiene `flex-1` y ocupa el espacio disponible
7. ✅ El botón tiene tamaño `sm` (h-9)
8. ✅ El componente no se muestra si `potentialData` es null
9. ✅ No hay errores de TypeScript
10. ✅ El diseño es responsive (mobile + desktop)

---

## 🚨 IMPORTANTE - NO HACER

❌ **NO modificar PerformanceScoreCard** - debe permanecer intacto
❌ **NO modificar TeamCalibrationHUD** - debe permanecer intacto
❌ **NO usar PrimaryButton** - debe ser GhostButton
❌ **NO cambiar el orden** - debe ir entre Performance y Team
❌ **NO agregar padding/margin extra** - usa solo gap-3
❌ **NO hardcodear datos** - debe usar potentialData del API

---

## 📦 ARCHIVOS INVOLUCRADOS

**Modificar:**
- `src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx`

**Ya existen (NO modificar):**
- `src/components/performance/PotentialNineBoxCard.tsx`
- `src/components/ui/PremiumButton.tsx` (GhostButton)

**API utilizada:**
- `GET /api/performance-ratings/nine-box?cycleId={id}`

---

## 🎯 RESULTADO ESPERADO

```typescript
// ANTES (texto plano):
Potencial: 3.0 (medium)
9-Box: high performer

// DESPUÉS (componentes premium):
┌──────────────────────────────────────────────────┐
│ ════ Línea Tesla Purple ════                    │
│                                                  │
│ 📈 POTENCIAL         3.0  /5.0                  │
│                      MEDIO                       │
│ ────────────────────────────────────────────     │
│ ⭐ 9-BOX             HIGH                        │
│                      High Performer              │
└──────────────────────────────────────────────────┘
     ↑ Card glassmorphism              ↑ Botón Ghost minimalista
```

---

## 💡 TIPS DE IMPLEMENTACIÓN

1. **Buscar la línea exacta** donde está `<PerformanceScoreCard` en `summary/page.tsx`
2. **Insertar el nuevo código** justo después del closing `</PerformanceScoreCard>`
3. **Verificar imports** al inicio del archivo
4. **Compilar** y verificar que no hay errores TypeScript
5. **Probar** en navegador que el fetch funciona y la card aparece

---

## 🔧 DEBUGGING

Si la card NO aparece:
```typescript
// Agregar console.log para debug
console.log('[Summary] potentialData:', potentialData)
console.log('[Summary] summary.cycle.id:', summary?.cycle?.id)
console.log('[Summary] summary.evaluatee.id:', summary?.evaluatee?.id)
```

Si el API falla:
- Verificar que existe `/api/performance-ratings/nine-box`
- Verificar que el cycleId es válido
- Verificar que el employeeId está en la grid del 9-Box

---

## ✨ BONUS: Animación Smooth

Opcional - agregar `framer-motion` para entrada suave:

```typescript
import { motion } from 'framer-motion'

{potentialData && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex items-start gap-3"
  >
    <PotentialNineBoxCard ... />
    <GhostButton ... />
  </motion.div>
)}
```

---

**Versión:** 1.0  
**Fecha:** 12 Feb 2026  
**Autor:** FocalizaHR Design System  
**Status:** ✅ Ready for Implementation
