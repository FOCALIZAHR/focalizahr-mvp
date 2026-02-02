"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CompetencyLabels {
  min: string;
  max: string;
  scale: string[];
}

interface ParsedOption {
  value: number;
  label: string;
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

function parseLabel(labelString: string, index: number): ParsedOption {
  const hasColon = labelString.includes(":");
  if (hasColon) {
    const [label, ...descParts] = labelString.split(":");
    return {
      value: index + 1,
      label: label.trim().toUpperCase(),
      description: descParts.join(":").trim()
    };
  }
  return {
    value: index + 1,
    label: `NIVEL ${index + 1}`,
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
  // Parse options from labels
  const options: ParsedOption[] = labels.scale.map((label, idx) => parseLabel(label, idx));
  
  // Current selection (undefined = Estado Cero)
  const selectedValue = response?.rating;
  const selectedOption = options.find((o) => o.value === selectedValue);
  const hasUserSelected = response?.rating != null && response.rating >= 1;

  const handleSelect = (value: number) => {
    updateResponse({ rating: value });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* ════════════════════════════════════════════════════════
          PANTALLA VISUALIZADORA (Cinema Display)
          ════════════════════════════════════════════════════════ */}
      <div 
        className={cn(
          "relative w-full h-[200px] md:h-[220px] rounded-2xl overflow-hidden",
          "bg-slate-900/80 backdrop-blur-xl",
          "border transition-all duration-500",
          selectedOption 
            ? "border-slate-700/50 shadow-xl shadow-purple-900/10" 
            : "border-slate-800"
        )}
      >
        {/* ENERGY BEAM (Tesla Line) - Solo cuando hay selección */}
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
          <motion.div 
            className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            style={{ boxShadow: "0 0 15px #22d3ee" }}
            initial={{ x: "-100%" }}
            animate={{ 
              x: selectedOption ? "0%" : "-100%", 
              opacity: selectedOption ? 1 : 0 
            }}
            transition={{ duration: 0.6, ease: "circOut" }}
          />
        </div>

        {/* WATERMARK (Background Number) */}
        <AnimatePresence mode="popLayout">
          {selectedOption && (
            <motion.div
              key={`wm-${selectedOption.value}`}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 0.06, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute -bottom-8 -right-4 text-[180px] font-black text-white leading-none tracking-tighter select-none pointer-events-none z-0"
            >
              {selectedOption.value}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTENIDO PRINCIPAL */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 py-4 text-center">
          <AnimatePresence mode="wait">
            {!selectedOption ? (
              /* ══════════════════════════════════════════════════
                 ESTADO CERO - Instrucción Clara
                 ══════════════════════════════════════════════════ */
              <motion.div
                key="zero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full border border-dashed border-slate-600 flex items-center justify-center bg-slate-800/30">
                  <MousePointerClick className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-300">
                    Seleccione un nivel para evaluar
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                    Haga clic en los números abajo
                  </span>
                </div>
              </motion.div>
            ) : (
              /* ══════════════════════════════════════════════════
                 ESTADO SELECCIONADO - Hero Content
                 ══════════════════════════════════════════════════ */
              <motion.div
                key={selectedOption.value}
                initial={{ y: 15, opacity: 0, filter: "blur(5px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -15, opacity: 0, filter: "blur(5px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex flex-col items-center justify-between w-full h-full"
              >
                {/* Fila superior: Badge izquierda + Check derecha */}
                <div className="flex justify-between items-center w-full">
                  <span className="font-mono text-[10px] tracking-[2px] uppercase text-cyan-400/70">
                    Nivel 0{selectedOption.value} / 05
                  </span>

                  {hasUserSelected && (
                    <motion.div
                      className="relative w-8 h-8 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 flex items-center justify-center overflow-hidden"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                      <Check className="w-4 h-4 text-cyan-400 relative z-10" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>

                {/* Centro: Título + Descripción */}
                <div className="flex flex-col items-center">
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 leading-none uppercase bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    {selectedOption.label}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-[90%]">
                    {selectedOption.description}
                  </p>
                </div>

                {/* Spacer inferior para balancear */}
                <div />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          SELECTOR CIRCULAR (The Dials)
          Consistente con RatingScaleRenderer
          ════════════════════════════════════════════════════════ */}
      <div className="w-full flex justify-between items-start px-2 md:px-4">
        {options.map((option) => {
          const isActive = selectedValue === option.value;
          
          return (
            <div key={option.value} className="flex flex-col items-center gap-2">
              {/* Botón Circular */}
              <button
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "relative flex items-center justify-center transition-all duration-300 outline-none",
                  "w-12 h-12 md:w-14 md:h-14 rounded-full",
                  isActive 
                    ? "bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-110 -translate-y-1" 
                    : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-700/80 hover:text-white hover:scale-105"
                )}
              >
                {/* Número */}
                <span className={cn(
                  "font-mono text-lg md:text-xl font-bold z-10",
                  isActive ? "text-slate-900" : "text-inherit"
                )}>
                  {option.value}
                </span>

                {/* Anillo exterior animado (solo activo) */}
                {isActive && (
                  <motion.div
                    layoutId="competencyActiveRing"
                    className="absolute inset-[-4px] rounded-full border-2 border-cyan-400/30"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </button>
              
              {/* Label SIEMPRE visible */}
              <span className={cn(
                "text-[9px] md:text-[10px] font-semibold uppercase tracking-wide transition-all duration-300 text-center max-w-[60px] leading-tight",
                isActive ? "text-cyan-400" : "text-slate-500"
              )}>
                {option.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompetencyBehaviorRenderer;