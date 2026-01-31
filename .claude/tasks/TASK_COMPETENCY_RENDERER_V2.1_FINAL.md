# TASK: Refactorizar CompetencyBehaviorRenderer → Smart Stack v2.1

## 📋 CONTEXTO

El `CompetencyBehaviorRenderer` actual tiene problemas:
1. Grid de 5 cards muy apretado, no respira
2. Pills de selección MUY LEJOS de la pregunta (abajo) - requiere scroll
3. **Colores MUY saturados** - no alineados al resto del survey
4. **Fondos muy opacos** - el survey usa glassmorphism más sutil

## 🎯 CAMBIOS CLAVE v2.1

1. **Pills ARRIBA** (debajo de la pregunta) → Acción inmediata
2. **Card ABAJO** (contexto expandido) → Solo lectura detallada  
3. **Altura 320px** - Watermark GRANDE (180px) que respira
4. **ESTILOS ALINEADOS AL SURVEY** - Fondos sutiles, blur correcto, colores del sistema
5. **Sin footer redundante** - El pill ya indica selección

## 🎨 ESTILOS DEL SURVEY (OBLIGATORIOS)

Extraídos de `focalizahr-unified.css` y otros renderers:

```css
/* Card Question - USAR ESTOS VALORES */
.fhr-card-question {
  background: rgba(30, 41, 59, 0.5);      /* NO 0.8, usar 0.5 */
  backdrop-filter: blur(12px);             /* NO blur(10px) */
  border: 1px solid rgba(71, 85, 105, 0.5); /* slate-600/50, NO purple */
  border-radius: var(--fhr-radius-xl);     /* 1.5rem */
}

/* Colores Activos - SOLO cuando está seleccionado */
--fhr-cyan: #22D3EE;   /* Para energy beam y checks */
--fhr-purple: #A78BFA; /* Para pill activo y watermark */

/* Filosofía Survey */
- Slate para neutral/pasivo
- Cyan/Purple SOLO para estado activo
- Font-light, espacios generosos
- Minimalismo extremo
```

## 🎯 WIREFRAME FINAL

```
┌─────────────────────────────────────────────────────────────┐
│  Pregunta de la encuesta...                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ┌──────────┐                                        │   │ ← PILLS ARRIBA
│  │ │    01    │   02       03       04       05       │   │   Fondo: slate-900/40
│  │ │  NUNCA   │  RARA    A VECES   FREC    SIEMPRE   │   │   Pill: purple-600/80
│  │ └──────────┘  VEZ              UENTE              │   │   Border: slate-700/30
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ═════════════════════════════════════════ (cyan)   │   │ ← Energy beam 2px
│  │                                                     │   │
│  │  NIVEL 01 / 05                          (cyan/80)  │   │ ← Tech label
│  │                                                     │   │
│  │  Nunca                                         1    │   │ ← Título 24px
│  │                                                     │   │   Watermark 180px
│  │  No demuestra esta competencia en su trabajo       │   │   Opacity 0.06
│  │  diario. Se aísla y evita compartir información.   │   │ ← Descripción 15px
│  │                                                     │   │
│  │  [✓]                                               │   │ ← Check cyan
│  └─────────────────────────────────────────────────────┘   │
│      ↑ Card: bg-slate-800/50, blur(12px), border-slate-700/50
│                                                             │
│  [Anterior]                               [Siguiente]       │ ← Visible SIN scroll
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 CÓDIGO COMPLETO

### Archivo: `src/components/survey/renderers/CompetencyBehaviorRenderer.tsx`

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
// CONSTANTS - Alineados a focalizahr-unified.css
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
    <div className="w-full flex flex-col gap-5">
      
      {/* ════════════════════════════════════════════════════════
          NAVEGADOR ARRIBA - Pills con Número + Título
          Estilos alineados al survey: fondos sutiles, slate base
          ════════════════════════════════════════════════════════ */}
      <div 
        className={cn(
          "relative rounded-xl p-1.5",
          // Fondo sutil como el resto del survey
          "bg-slate-900/40",
          "border border-slate-700/30"
        )}
      >
        {/* Animated Pill Background - Purple solo en activo */}
        <motion.div
          className={cn(
            "absolute top-1.5 left-1.5 h-[60px] rounded-lg",
            "bg-purple-600/80"  // Purple moderado, no saturado
          )}
          initial={false}
          animate={{
            x: `${(currentLevel - 1) * 100}%`,
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
                  "flex-1 h-[60px]",
                  "flex flex-col items-center justify-center gap-0.5",
                  "rounded-lg",
                  "transition-colors duration-200",
                  "cursor-pointer",
                  !isActive && "hover:bg-white/5"
                )}
              >
                <span
                  className={cn(
                    "font-mono font-bold text-sm leading-none transition-all duration-200",
                    isActive ? "text-white" : "text-slate-500"
                  )}
                >
                  0{level.id}
                </span>
                <span
                  className={cn(
                    "text-[9px] uppercase tracking-wide font-semibold transition-all duration-200",
                    "max-w-full px-1 truncate",
                    isActive ? "text-white/90" : "text-slate-500"
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
          VISOR ABAJO - Card con Descripción Detallada
          ESTILOS ALINEADOS AL SURVEY (.fhr-card-question)
          ════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-[320px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              "absolute inset-0",
              // ══════════════════════════════════════════════════
              // FONDOS ALINEADOS AL SURVEY - valores exactos
              // ══════════════════════════════════════════════════
              "bg-slate-800/50",           // rgba(30, 41, 59, 0.5) - NO 0.8
              "backdrop-blur-[12px]",       // blur(12px) como .fhr-card-question
              "border border-slate-700/50", // slate, NO purple
              "rounded-xl",
              "p-6",
              "flex flex-col justify-between",
              "overflow-hidden"
            )}
          >
            {/* Energy Beam - Cyan sutil, 2px */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-700/30 overflow-hidden">
              <motion.div
                className="h-full bg-cyan-400/70"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            </div>

            {/* Watermark - GRANDE (180px) pero muy sutil */}
            <motion.div
              className={cn(
                "absolute -bottom-6 -right-4",
                "text-[180px] font-black leading-none",
                "pointer-events-none select-none",
                "text-purple-500/[0.06]"  // Muy sutil, casi invisible
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {activeLevel.id}
            </motion.div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Tech Label - Cyan sutil */}
              <span className="font-mono text-[10px] tracking-[2px] uppercase text-cyan-400/70 mb-4">
                NIVEL 0{activeLevel.id} / 05
              </span>

              {/* Title & Description */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white/90 mb-3 leading-tight">
                  {activeLevel.title}
                </h3>
                <p className="text-[15px] text-slate-400 leading-relaxed">
                  {activeLevel.description}
                </p>
              </div>

              {/* Check Icon - Cyan moderado */}
              <motion.div
                className={cn(
                  "mt-auto self-start",
                  "w-9 h-9 rounded-full",
                  "bg-cyan-500/80 text-slate-900",
                  "flex items-center justify-center"
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
              >
                <Check className="w-4 h-4" strokeWidth={3} />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CompetencyBehaviorRenderer;
```

---

## 📐 VALORES CSS CRÍTICOS (ALINEADOS AL SURVEY)

| Elemento | Valor Survey | Por Qué |
|----------|--------------|---------|
| **Card bg** | `rgba(30, 41, 59, 0.5)` | `.fhr-card-question` usa 0.5 |
| **Card blur** | `blur(12px)` | Estándar del survey |
| **Card border** | `slate-700/50` | Gris neutro, no purple |
| **Card height** | `320px` | Permite watermark grande |
| **Watermark** | `180px` / `opacity 0.06` | Grande pero muy sutil |
| **Título** | `24px` (text-2xl) | Legible sin dominar |
| **Descripción** | `15px` | Legible |
| **Pills height** | `60px` | Compactas pero clickeables |
| **Pills bg** | `slate-900/40` | Fondo sutil |
| **Pill activa** | `purple-600/80` | Purple moderado |
| **Energy beam** | `2px` / `cyan-400/70` | Sutil |
| **Tech label** | `cyan-400/70` | Sutil, no saturado |
| **Check** | `cyan-500/80` | Moderado |

---

## ✅ CHECKLIST DE VALIDACIÓN

### Estilos Alineados al Survey
- [ ] Card usa `bg-slate-800/50` (NO 0.8)
- [ ] Card usa `blur(12px)` (NO blur(10px))
- [ ] Card usa `border-slate-700/50` (NO purple)
- [ ] Purple SOLO en pill activa
- [ ] Cyan SOLO en energy beam, tech label, check
- [ ] Watermark muy sutil (opacity 0.06)

### UX Mejorada
- [ ] Pills ARRIBA del card (acción inmediata)
- [ ] Card ABAJO (contexto)
- [ ] Todo visible SIN scroll antes de Anterior/Siguiente
- [ ] Height 320px permite watermark grande (180px)
- [ ] Sin footer redundante

### Funcionalidad
- [ ] Click en pill → actualiza `response.rating` (1-5)
- [ ] Card cambia con animación suave
- [ ] Pill se desliza al nivel seleccionado
- [ ] Labels se parsean correctamente ("Título: Descripción")

### Build
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run build` sin errores

---

## 🚀 COMANDO PARA CODE

```
Refactoriza el CompetencyBehaviorRenderer siguiendo el TASK.

CRÍTICO - ESTILOS DEL SURVEY:
- Card bg: bg-slate-800/50 (NO 0.8, es muy opaco)
- Card blur: blur(12px) (como .fhr-card-question)
- Card border: border-slate-700/50 (gris, NO purple)
- Purple SOLO en pill activa (purple-600/80)
- Cyan sutil (cyan-400/70) para energy beam y labels

ESTRUCTURA:
- Pills ARRIBA del card (acción inmediata tras leer pregunta)
- Card ABAJO (320px altura, watermark 180px muy sutil)
- Sin footer de "Selección actual" (redundante)

Reemplazar TODO el contenido de:
src/components/survey/renderers/CompetencyBehaviorRenderer.tsx
```

---

**VERSIÓN:** 2.1 (Smart Stack + Estilos Survey)
**FECHA:** Enero 2026
