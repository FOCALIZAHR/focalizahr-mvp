// src/components/exit/ResolutionPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 PANEL DE RESOLUCIÓN v2.0 - ESTILOS FOCALIZAHR
// ═══════════════════════════════════════════════════════════════════════════════
//
// FILOSOFÍA: "Capturar la acción de forma elegante y eficiente"
//
// CAMBIOS v2.0:
// ✅ Sin gradientes en botones (cyan sólido)
// ✅ Quick picks pasan al textarea (editable antes de guardar)
// ✅ Estilos FocalizaHR consistentes
// ✅ Botones elegantes, no gigantes
// ✅ UX mejorada: seleccionar → editar → registrar
//
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Play, 
  Loader2, 
  FileText, 
  ChevronRight, 
  Shield,
  X
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface ResolutionPanelProps {
  /** Opciones de quick pick */
  quickPicks: string[];
  /** Días de seguimiento */
  followUpDays?: number;
  /** Estado: ya resuelta */
  isResolved?: boolean;
  /** Resolución previa (si existe) */
  resolvedAction?: string;
  resolvedAt?: string;
  /** Callback al resolver - MANTIENE API ORIGINAL */
  onResolve: (selectedAction: string, notes: string) => Promise<void>;
  /** Estado de carga */
  isLoading?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function ResolutionPanel({
  quickPicks,
  followUpDays = 60,
  isResolved = false,
  resolvedAction,
  resolvedAt,
  onResolve,
  isLoading = false
}: ResolutionPanelProps) {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null); // Quick pick seleccionado (para tracking)
  const [notes, setNotes] = useState(''); // Contenido editable del textarea

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Quick pick → Guarda cuál fue seleccionado + agrega al textarea
  const handleQuickPickClick = (pick: string) => {
    // Guardar cuál quick pick fue seleccionado (para analytics/tracking)
    setSelectedAction(pick);
    
    // Agregar al textarea para que el usuario pueda editarlo
    if (notes.trim() === '') {
      // Si está vacío, poner el quick pick directamente
      setNotes(pick);
    } else if (!notes.includes(pick)) {
      // Si ya tiene contenido y no incluye este pick, agregar con separador
      setNotes(prev => `${prev}\n• ${pick}`);
    }
    // Si ya incluye el pick, no hacer nada (evitar duplicados)
  };

  // Resolver alerta
  const handleResolve = async () => {
    if (!notes.trim()) return;
    
    // selectedAction: El quick pick original (o el texto si escribió manual)
    // notes: Todo el contenido del textarea (editable)
    const actionToSend = selectedAction || notes.split('\n')[0] || notes;
    
    await onResolve(actionToSend, notes);
  };

  // Cancelar y limpiar
  const handleCancel = () => {
    setIsExpanded(false);
    setSelectedAction(null);
    setNotes('');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Estado Resuelto
  // ═══════════════════════════════════════════════════════════════════════════

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
        {/* Línea Tesla verde */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #10B981 30%, #10B981 70%, transparent 100%)',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
          }}
        />
        
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-emerald-400 font-medium mb-1">Alerta Resuelta</p>
            <p className="text-slate-400 text-sm mb-3">
              Esta alerta fue gestionada y cerrada.
            </p>
            
            {/* Mostrar acción registrada */}
            {resolvedAction && (
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                  Acción registrada
                </p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {resolvedAction}
                </p>
                {resolvedAt && (
                  <p className="text-[10px] text-slate-600 mt-2">
                    {resolvedAt}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Panel de Resolución
  // ═══════════════════════════════════════════════════════════════════════════

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
      {/* Efecto decorativo sutil */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6">
        
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-medium text-white">Registrar Acción</h2>
        </div>
        <p className="text-slate-400 text-sm mb-5">
          Documenta la acción tomada. El sistema medirá su efectividad.
        </p>

        {/* Línea decorativa */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-700" />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTENIDO PRINCIPAL
            ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            
            // ─────────────────────────────────────────────────────────────────
            // BOTÓN EXPANDIR - Borde cyan sólido, SIN gradiente
            // ─────────────────────────────────────────────────────────────────
            <motion.button
              key="expand-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(true)}
              className="
                w-full py-3 px-5 rounded-xl
                bg-slate-800/40
                border border-cyan-500/50
                text-white font-medium
                flex items-center justify-center gap-3
                hover:bg-slate-800/60 hover:border-cyan-500/70
                transition-all duration-300
                group
              "
            >
              <Play className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm">Iniciar Resolución de Alerta</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
          ) : (
            
            // ─────────────────────────────────────────────────────────────────
            // FORMULARIO EXPANDIDO
            // ─────────────────────────────────────────────────────────────────
            <motion.div
              key="resolution-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-5"
            >
              
              {/* ─────────────────────────────────────────────────────────────
                  QUICK PICKS - Chips clickeables que agregan al textarea
                  ───────────────────────────────────────────────────────────── */}
              <div>
                <label className="text-sm text-slate-400 block mb-2.5">
                  Selecciona una acción rápida o escribe la tuya:
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickPicks.map((pick, index) => {
                    const isSelected = selectedAction === pick;
                    const isInNotes = notes.includes(pick);
                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleQuickPickClick(pick)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium
                          border transition-all duration-200
                          ${isSelected 
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400' 
                            : isInNotes
                              ? 'bg-slate-700/50 border-slate-600/50 text-slate-300'
                              : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                          }
                        `}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {pick}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  TEXTAREA - Donde se acumulan las acciones
                  ───────────────────────────────────────────────────────────── */}
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  Acción a registrar
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe la acción tomada o selecciona una opción rápida arriba..."
                  className="
                    w-full p-3 rounded-xl
                    bg-slate-800/30 border border-slate-700/30
                    text-white text-sm placeholder-slate-500
                    focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/50
                    resize-none transition-all
                  "
                  rows={3}
                />
                {notes.trim() === '' && (
                  <p className="text-xs text-slate-600 mt-1.5">
                    * Requerido para registrar la resolución
                  </p>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  BOTONES DE ACCIÓN
                  ───────────────────────────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                
                {/* Botón Cancelar - Neutral, sutil */}
                <button
                  onClick={handleCancel}
                  className="
                    flex-1 py-2.5 px-4 rounded-xl
                    bg-slate-800/30 border border-slate-700/30
                    text-slate-400 text-sm font-medium
                    flex items-center justify-center gap-2
                    hover:bg-slate-800/50 hover:text-slate-300
                    transition-all duration-200
                  "
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                
                {/* Botón Registrar - Cyan SÓLIDO, sin gradiente */}
                <button
                  onClick={handleResolve}
                  disabled={!notes.trim() || isLoading}
                  className={`
                    flex-1 py-2.5 px-4 rounded-xl
                    text-sm font-medium
                    flex items-center justify-center gap-2
                    transition-all duration-200
                    ${notes.trim() 
                      ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20' 
                      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Registrar y Cerrar
                    </>
                  )}
                </button>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  INFORMACIÓN DE SEGUIMIENTO
                  ───────────────────────────────────────────────────────────── */}
              {followUpDays > 0 && (
                <p className="text-slate-500 text-xs text-center">
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