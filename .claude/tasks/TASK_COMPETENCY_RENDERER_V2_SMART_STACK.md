# TASK: Refactorizar CompetencyBehaviorRenderer → Smart Stack Design

## 📋 CONTEXTO

El `CompetencyBehaviorRenderer` actual (grid de 5 cards) tiene problemas de respiración visual y legibilidad. Se requiere refactorizar a un diseño "Smart Stack" con:
- **Visor**: Una sola card grande visible a la vez
- **Navegador**: Barra inferior con 5 pills clickeables
- **Animación**: Pill deslizante + card con fade transition

## 🎯 RESULTADO ESPERADO

```
┌─────────────────────────────────────────────────────┐
│  ══════════════════════════════════════════════     │ ← Energy beam cyan
│                                                     │
│  NIVEL 03 / 05                                      │ ← Tech label
│                                                     │
│  A veces                                            │ ← Título 28px
│                                                     │
│  Demuestra la competencia de manera                 │ ← Descripción 16px
│  inconsistente. En ocasiones comunica               │
│  bien, pero otras veces genera confusión.           │
│                                                     │
│  [✓]                                           3    │ ← Check + Watermark
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ┌───────┐                                           │
│ │  01   │  02     [03]    04     05                │ ← Pills navegación
│ │ Nunca │  Rara   A veces Frec   Siempre           │
│ └───────┘  vez            uente                     │
└─────────────────────────────────────────────────────┘
  ↑ Pill animada se desliza al nivel activo
```

---

## 🔧 ESPECIFICACIONES TÉCNICAS

### Archivo a Modificar
`src/components/survey/renderers/CompetencyBehaviorRenderer.tsx`

### Props (SIN CAMBIOS)
```typescript
interface CompetencyBehaviorRendererProps {
  response: {
    questionId: string;
    rating?: number;
  };
  updateResponse: (update: { rating: number }) => void;
  labels?: {
    min: string;
    max: string;
    scale: string[];
  };
}
```

### Estructura del Componente

```typescript
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CompetencyLabels {
  min: string;
  max: string;
  scale: string[];
}

interface ParsedLevel {
  id: number;
  title: string;
  description: string;
}

interface CompetencyBehaviorRendererProps {
  response: {
    questionId: string;
    rating?: number;
  };
  updateResponse: (update: { rating: number }) => void;
  labels?: CompetencyLabels;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const DEFAULT_LABELS: CompetencyLabels = {
  min: "Nunca demuestra",
  max: "Siempre demuestra",
  scale: [
    "Nunca: No demuestra esta competencia en su trabajo diario.",
    "Rara vez: Demuestra la competencia solo en situaciones específicas.",
    "A veces: Demuestra la competencia de manera inconsistente.",
    "Frecuente: Demuestra la competencia de manera consistente.",
    "Siempre: Es un referente en esta competencia para el equipo."
  ]
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function parseLabel(labelString: string, index: number): ParsedLevel {
  const hasColon = labelString.includes(":");
  if (hasColon) {
    const [title, ...descParts] = labelString.split(":");
    return {
      id: index + 1,
      title: title.trim(),
      description: descParts.join(":").trim()
    };
  }
  return {
    id: index + 1,
    title: `Nivel ${index + 1}`,
    description: labelString
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const CompetencyBehaviorRenderer: React.FC<CompetencyBehaviorRendererProps> = ({
  response,
  updateResponse,
  labels = DEFAULT_LABELS
}) => {
  const currentLevel = response?.rating || 1;
  
  // Parse all labels
  const levels: ParsedLevel[] = labels.scale.map((label, idx) => parseLabel(label, idx));
  const activeLevel = levels.find(l => l.id === currentLevel) || levels[0];

  const handleSelect = (level: number) => {
    updateResponse({ rating: level });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* ════════════════════════════════════════════════════════
          VISOR - Card Grande Única
          ════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              "absolute inset-0",
              "bg-slate-800/80 backdrop-blur-md",
              "border border-purple-500/50",
              "rounded-2xl",
              "p-8",
              "flex flex-col justify-between",
              "overflow-hidden",
              "shadow-xl shadow-purple-500/10"
            )}
          >
            {/* Energy Beam */}
            <motion.div 
              className="absolute top-0 left-0 right-0 h-[3px] bg-slate-700/50"
            >
              <motion.div
                className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
            </motion.div>

            {/* Watermark */}
            <motion.div
              className="absolute -bottom-8 -right-2 text-[180px] font-black text-purple-500/10 leading-none pointer-events-none select-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {activeLevel.id}
            </motion.div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Tech Label */}
              <span className="font-mono text-[11px] tracking-[2px] uppercase text-cyan-400 mb-4">
                NIVEL 0{activeLevel.id} / 05
              </span>

              {/* Title & Description */}
              <div className="flex-1">
                <h3 className="text-[28px] font-bold text-white mb-3 leading-tight">
                  {activeLevel.title}
                </h3>
                <p className="text-base text-slate-300 leading-relaxed max-w-[90%]">
                  {activeLevel.description}
                </p>
              </div>

              {/* Check Icon */}
              <motion.div
                className={cn(
                  "mt-auto self-start",
                  "w-10 h-10 rounded-full",
                  "bg-cyan-400 text-slate-900",
                  "flex items-center justify-center",
                  "shadow-lg shadow-cyan-400/30"
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.3 }}
              >
                <Check className="w-5 h-5" strokeWidth={3} />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════════════════════
          NAVEGADOR - Pills con Número + Título
          ════════════════════════════════════════════════════════ */}
      <div className="relative bg-slate-900/50 rounded-2xl p-1.5 border border-slate-700/50">
        
        {/* Animated Pill Background */}
        <motion.div
          className="absolute top-1.5 left-1.5 h-[70px] bg-purple-600 rounded-xl shadow-lg shadow-purple-500/30"
          initial={false}
          animate={{
            x: `${(currentLevel - 1) * 100}%`,
            width: `calc((100% - 12px) / 5)`
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: `calc((100% - 12px) / 5)` }}
        />

        {/* Nav Items */}
        <div className="relative z-10 flex">
          {levels.map((level) => {
            const isActive = level.id === currentLevel;
            
            return (
              <button
                key={level.id}
                onClick={() => handleSelect(level.id)}
                className={cn(
                  "flex-1 h-[70px]",
                  "flex flex-col items-center justify-center gap-1",
                  "rounded-xl",
                  "transition-colors duration-200",
                  "cursor-pointer",
                  !isActive && "hover:bg-white/5"
                )}
              >
                <span
                  className={cn(
                    "font-mono font-bold text-base leading-none transition-all duration-200",
                    isActive ? "text-white" : "text-slate-500"
                  )}
                >
                  0{level.id}
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide font-semibold transition-all duration-200",
                    "max-w-full px-1 truncate",
                    isActive ? "text-white" : "text-slate-400"
                  )}
                >
                  {level.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          FOOTER - Estado Actual (opcional, puede removerse)
          ════════════════════════════════════════════════════════ */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
        <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
          Selección actual
        </span>
        <span className="text-xs font-bold text-cyan-400 font-mono">
          NIVEL 0{activeLevel.id} - {activeLevel.title.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

export default CompetencyBehaviorRenderer;
```

---

## 📐 VALORES CSS CRÍTICOS

| Elemento | Valor | Razón |
|----------|-------|-------|
| **Card Height** | 380px | Espacio para respirar |
| **Card Padding** | 32px (p-8) | Generoso |
| **Title Size** | 28px | Legible, impactante |
| **Description** | 16px / 1.6 line-height | Cómodo de leer |
| **Watermark** | 180px font-size | Imponente pero sutil (10% opacity) |
| **Nav Height** | 70px | Acomoda número + título |
| **Energy Beam** | 3px height | Sutil pero visible |
| **Pill** | purple-600 con shadow | Destaca sin saturar |

---

## 🎨 COLORES ESPECÍFICOS

```css
/* Card */
background: rgba(30, 41, 59, 0.8)     /* slate-800/80 */
border: rgba(139, 92, 246, 0.5)        /* purple-500/50 */

/* Energy Beam */
background: #22d3ee                    /* cyan-400 */
shadow: rgba(34, 211, 238, 0.5)

/* Watermark */
color: rgba(139, 92, 246, 0.1)         /* purple-500/10 */

/* Nav Pill */
background: #9333ea                    /* purple-600 */
shadow: rgba(139, 92, 246, 0.3)

/* Text */
title: white
description: #cbd5e1                   /* slate-300 */
tech-label: #22d3ee                    /* cyan-400 */
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Funcionalidad
- [ ] Click en pill → actualiza `response.rating` (1-5)
- [ ] Card cambia con animación suave
- [ ] Pill se desliza al nivel seleccionado
- [ ] Energy beam se llena al 100% en cada cambio
- [ ] Labels se parsean correctamente ("Título: Descripción")
- [ ] Check icon siempre visible en card activa

### Visual
- [ ] Card altura 380px con padding generoso
- [ ] Título 28px bold, descripción 16px
- [ ] Watermark grande (180px) pero sutil (10% opacity)
- [ ] Nav pills muestran número + título truncado
- [ ] Pill animada se desliza suavemente
- [ ] Colores: purple para activo, cyan para energía/acciones

### Integración
- [ ] Props interface sin cambios
- [ ] Exporta correctamente en index.ts
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit` sin errores

---

## 🚀 COMANDO DE EJECUCIÓN

```bash
# Refactorizar el archivo existente
# src/components/survey/renderers/CompetencyBehaviorRenderer.tsx
# Reemplazar contenido completo con el código de arriba
```

---

**VERSIÓN:** 2.0 (Smart Stack)
**FECHA:** Enero 2026
**REEMPLAZA:** CompetencyBehaviorRenderer v1.0 (Grid 5 cards)
