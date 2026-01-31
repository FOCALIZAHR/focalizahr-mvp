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
          FOOTER - Estado Actual
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
