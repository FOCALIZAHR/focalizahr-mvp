# ═══════════════════════════════════════════════════════════════════════════════
# TASK: VICTORY OVERLAY - CELEBRACIÓN CINEMA MODE
# ═══════════════════════════════════════════════════════════════════════════════
# Prioridad: ALTA
# Estimación: 30-45 minutos
# Filosofía: Cinema Mode + Diseño Apple/Tesla + FocalizaHR
# ═══════════════════════════════════════════════════════════════════════════════

## 🎯 OBJETIVO

Implementar overlay de celebración que aparece cuando el jefe completa TODAS las evaluaciones (desempeño + potencial). El overlay cubre la pantalla y al cerrarlo revela el equipo.

---

## 📐 ARQUITECTURA

```
┌─────────────────────────────────────────┐
│         VictoryOverlay (z-100)          │  ← NUEVO COMPONENTE
│              ◆ 🏆                        │
│    ¡Felicidades, [Nombre]!              │
│         Misión Cumplida                 │
│           [Continuar]                   │
├─────────────────────────────────────────┤
│      CinemaModeOrchestrator (z-10)      │  ← YA EXISTE (detrás)
│      Rail con equipo expandido          │
└─────────────────────────────────────────┘

Click "Continuar" → Overlay desaparece → Equipo visible
```

---

## 📝 ARCHIVOS A CREAR/MODIFICAR

### 1. CREAR: `src/components/evaluator/cinema/VictoryOverlay.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

interface VictoryOverlayProps {
  onClose: () => void
  evaluatorName?: string
}

export default function VictoryOverlay({ onClose, evaluatorName }: VictoryOverlayProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Confetti Burst Sequence
  useEffect(() => {
    const duration = 3000
    const end = Date.now() + duration
    const colors = ['#22D3EE', '#F59E0B', '#FFFFFF']

    ;(function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        zIndex: 100
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        zIndex: 100
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    })()
  }, [])

  const handleExit = () => {
    setIsVisible(false)
    setTimeout(onClose, 500)
  }

  // Extraer primer nombre para saludo cálido
  const firstName = evaluatorName?.split(' ')[0] || ''

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center font-sans overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          transition={{ duration: 0.5 }}
        >
          {/* BACKGROUND: Deep Radial Void */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)'
            }}
          />

          {/* Ambient Lights */}
          <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
            <div
              className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </div>

          {/* MAIN CONTENT */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6 pb-12">
            {/* DIAMOND TROPHY */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 45 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
                delay: 0.2
              }}
            >
              {/* The Gem Shape */}
              <div className="w-28 h-28 bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2rem] border border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.25)] flex items-center justify-center relative overflow-hidden group">
                {/* Shine Animation */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-150%] animate-[shimmer_3s_infinite]" />

                {/* Icon */}
                <Trophy
                  size={48}
                  strokeWidth={1.5}
                  className="text-amber-400 -rotate-45 drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)]"
                />
              </div>

              {/* Orbital Glow Ring */}
              <div className="absolute inset-[-10px] rounded-[2.5rem] border border-amber-500/20 animate-pulse" />

              {/* Sparkles */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-6 -right-6 rotate-[-45deg]"
              >
                <Sparkles size={20} className="text-amber-200" />
              </motion.div>
            </motion.div>

            {/* TYPOGRAPHY */}
            <div className="space-y-3 mb-8">
              {/* Nombre del Evaluador - Cálido */}
              {firstName && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg md:text-xl font-medium text-cyan-400 mb-1"
                >
                  ¡Felicidades, {firstName}!
                </motion.div>
              )}

              <motion.h1
                className="text-5xl font-black text-white tracking-tight drop-shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Misión Cumplida
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center gap-2"
              >
                <p className="text-lg text-slate-300 font-light leading-relaxed">
                  Tu feedback impulsa el desarrollo de tu equipo.
                </p>

                {/* Badge Compacto */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 mt-2 rounded-full border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                    Desempeño + Potencial ✓
                  </span>
                </div>
              </motion.div>
            </div>

            {/* TESLA LINE */}
            <motion.div
              className="w-16 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-8"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            />

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <button
                onClick={handleExit}
                className="group flex items-center gap-3 px-6 py-2.5 rounded-full border border-slate-700 hover:border-cyan-500/50 bg-transparent hover:bg-cyan-500/5 text-slate-400 hover:text-cyan-400 transition-all duration-300 backdrop-blur-sm"
              >
                <span className="text-xs font-bold uppercase tracking-[0.2em]">
                  Continuar
                </span>
                <div className="p-1 rounded-full bg-slate-800 group-hover:bg-cyan-900/50 transition-colors">
                  <X size={12} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

### 2. AGREGAR animación shimmer en `globals.css`

```css
@keyframes shimmer {
  0% {
    transform: translateX(-150%);
  }
  100% {
    transform: translateX(150%);
  }
}
```

---

### 3. MODIFICAR: `src/app/dashboard/evaluaciones/components/CinemaModeOrchestrator.tsx`

```tsx
// AGREGAR import
import VictoryOverlay from '@/components/evaluator/cinema/VictoryOverlay'

// AGREGAR estado para controlar overlay
const [showVictoryOverlay, setShowVictoryOverlay] = useState(false)

// DETECTAR victoria (desempeño + potencial completos)
useEffect(() => {
  if (!employees.length) return
  
  const allDesempenoComplete = employees.every(e => e.status === 'completed')
  const allPotentialComplete = employees.every(e => e.potentialScore !== null)
  
  // Solo mostrar overlay si AMBOS completos y no se ha mostrado antes
  if (allDesempenoComplete && allPotentialComplete) {
    // Verificar si ya se mostró en esta sesión
    const victoryKey = `victory-shown-${cycle?.id}`
    if (!sessionStorage.getItem(victoryKey)) {
      setShowVictoryOverlay(true)
      sessionStorage.setItem(victoryKey, 'true')
    }
  }
}, [employees, cycle?.id])

// Handler para cerrar overlay
const handleCloseVictory = () => {
  setShowVictoryOverlay(false)
  // Opcional: expandir rail automáticamente
  setIsRailExpanded(true)
}

// EN EL RETURN, agregar overlay (ANTES de todo lo demás)
return (
  <div className="...">
    
    {/* Victory Overlay - SOBRE TODO */}
    {showVictoryOverlay && (
      <VictoryOverlay
        onClose={handleCloseVictory}
        evaluatorName={userDisplayName}  // Obtener del contexto/auth
      />
    )}
    
    {/* Resto del contenido existente */}
    <CinemaHeader ... />
    ...
  </div>
)
```

---

### 4. OBTENER nombre del evaluador

Si no tienes acceso al nombre del usuario en el orchestrator, agregar:

```tsx
// Opción A: Desde el contexto de auth
import { useAuth } from '@/hooks/useAuth' // o tu hook de auth
const { user } = useAuth()
const userDisplayName = user?.name || user?.email?.split('@')[0]

// Opción B: Desde props del cycle o API
// Si el backend retorna info del evaluador, usarla directamente
```

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Overlay aparece al completar desempeño + potencial
- [ ] Confetti funciona correctamente
- [ ] Diamond trophy con animación shimmer
- [ ] Nombre del evaluador aparece correctamente
- [ ] Badge muestra "Desempeño + Potencial ✓"
- [ ] Click "Continuar" cierra overlay con animación
- [ ] Al cerrar, el equipo es visible (rail expandido o normal)
- [ ] No se muestra de nuevo si refrescas (sessionStorage)
- [ ] Responsive en mobile

---

## 🎨 RESUMEN VISUAL

```
ANTES (VictoryScreen):              DESPUÉS (VictoryOverlay):
┌────────────────────┐             ┌────────────────────┐
│        🏆         │              │        ◆ 🏆        │
│  Misión Cumplida!  │             │                    │
│                    │             │ ¡Felicidades,      │
│ ┌────────────────┐ │             │     Claudia!       │
│ │ 4 Evaluaciones │ │ ← QUITAR   │                    │
│ └────────────────┘ │             │  Misión Cumplida   │
│                    │             │                    │
│ [Ver mi equipo]    │ ← TAPADO   │ [Desempeño +       │
├────────────────────┤             │  Potencial ✓]      │
│ TU EQUIPO (4)      │ ← TAPA     │       ───          │
│ [Card][Card]       │             │   [Continuar]      │ ← VISIBLE
└────────────────────┘             └────────────────────┘
                                          ↓
                                   Click "Continuar"
                                          ↓
                                   Overlay se va
                                          ↓
                                   Equipo visible ✓
```

---

## 🚀 PROMPT PARA CLAUDE CODE

```
Ejecuta .claude/tasks/TASK_VICTORY_OVERLAY.md

OBJETIVO: Implementar VictoryOverlay que aparece al completar desempeño + potencial.

ENTREGABLES:
1. Crear src/components/evaluator/cinema/VictoryOverlay.tsx
2. Agregar @keyframes shimmer en globals.css
3. Modificar CinemaModeOrchestrator para mostrar overlay
4. Obtener nombre del evaluador para personalización

VERIFICACIÓN: Overlay aparece sobre todo, "Continuar" lo cierra y revela equipo.
```

---

**FIN DE TASK**
