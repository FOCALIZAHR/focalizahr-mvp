"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface CompetencyLabels {
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
          "bg-slate-900/40",
          "border border-slate-700/30"
        )}
      >
        {/* Animated Pill Background - Purple solo en activo */}
        <motion.div
          className={cn(
            "absolute top-1.5 left-1.5 h-[60px] rounded-lg",
            "bg-purple-600/80"
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
