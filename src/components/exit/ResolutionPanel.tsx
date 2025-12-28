// src/components/exit/ResolutionPanel.tsx
// 🎯 Panel de Resolución - Flujo de 2 pasos

'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Play, Loader2, 
  FileText, ChevronRight, Shield 
} from 'lucide-react';

interface QuickPick {
  id: string;
  label: string;
}

interface ResolutionPanelProps {
  /** Opciones de quick pick */
  quickPicks: string[];
  /** Días de seguimiento */
  followUpDays?: number;
  /** Estado: ya resuelta */
  isResolved?: boolean;
  /** Callback al resolver */
  onResolve: (selectedAction: string, notes: string) => Promise<void>;
  /** Estado de carga */
  isLoading?: boolean;
}

export default memo(function ResolutionPanel({
  quickPicks,
  followUpDays = 60,
  isResolved = false,
  onResolve,
  isLoading = false
}: ResolutionPanelProps) {
  
  // Estados
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Handler de resolución
  const handleResolve = async () => {
    if (!selectedAction) return;
    await onResolve(selectedAction, notes);
  };

  // Si ya está resuelta
  if (isResolved) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          relative overflow-hidden
          bg-emerald-500/10 backdrop-blur-xl
          border border-emerald-500/30 rounded-2xl p-6
        "
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 font-medium">Alerta Resuelta</p>
            <p className="text-slate-400 text-sm">Esta alerta ya fue gestionada y cerrada.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="
        relative overflow-hidden
        bg-slate-900/40 backdrop-blur-xl
        border border-slate-700/50 rounded-2xl
      "
    >
      {/* Efecto decorativo */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 md:p-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-medium text-white">Registrar Acción</h2>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Documenta la acción tomada. El sistema medirá su efectividad.
        </p>

        {/* Línea decorativa */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-700" />
        </div>

        {/* PASO 1: Botón para expandir */}
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.button
              key="expand-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => setIsExpanded(true)}
              className="
                w-full py-4 px-6 rounded-xl
                bg-gradient-to-r from-cyan-500/20 to-purple-500/20
                border border-cyan-500/30
                text-white font-medium
                flex items-center justify-center gap-3
                hover:from-cyan-500/30 hover:to-purple-500/30
                hover:border-cyan-500/50
                transition-all duration-300
                group
              "
            >
              <Play className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Iniciar Resolución de Alerta</span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ) : (
            <motion.div
              key="resolution-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Quick Picks */}
              <div>
                <label className="text-sm text-slate-400 block mb-3">
                  ¿Qué acción tomaste?
                </label>
                <div className="space-y-3">
                  {quickPicks.map((pick, index) => (
                    <motion.label
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        block cursor-pointer p-4 rounded-xl border transition-all
                        ${selectedAction === pick 
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                          : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="action"
                          value={pick}
                          checked={selectedAction === pick}
                          onChange={() => setSelectedAction(pick)}
                          className="sr-only"
                        />
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          transition-all duration-200
                          ${selectedAction === pick 
                            ? 'border-cyan-500 bg-cyan-500' 
                            : 'border-slate-600'
                          }
                        `}>
                          {selectedAction === pick && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <CheckCircle className="w-3 h-3 text-slate-900" />
                            </motion.div>
                          )}
                        </div>
                        <span className="text-sm text-slate-300">{pick}</span>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales sobre la acción tomada..."
                  className="
                    w-full p-4 rounded-xl
                    bg-slate-800/30 border border-slate-700/50
                    text-white placeholder-slate-500
                    focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/50
                    resize-none transition-all
                  "
                  rows={3}
                />
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="
                    flex-1 py-3 px-4 rounded-xl
                    bg-slate-800/50 border border-slate-700/50
                    text-slate-400
                    hover:bg-slate-800 hover:text-slate-300
                    transition-all
                  "
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleResolve}
                  disabled={!selectedAction || isLoading}
                  className={`
                    flex-1 py-3 px-4 rounded-xl font-medium
                    flex items-center justify-center gap-2
                    transition-all
                    ${selectedAction 
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/20' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Registrar y Cerrar
                    </>
                  )}
                </button>
              </div>

              {/* Follow-up info */}
              {followUpDays && (
                <p className="text-slate-500 text-xs text-center pt-2">
                  📊 El sistema medirá la efectividad de esta acción en {followUpDays} días
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});