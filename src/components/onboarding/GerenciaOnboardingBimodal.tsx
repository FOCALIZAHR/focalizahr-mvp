// ====================================================================
// GERENCIA ONBOARDING BIMODAL - RANKING EXO SCORE
// src/components/onboarding/GerenciaOnboardingBimodal.tsx
// v5.5 - Click en gerencia → Modal "Próximamente"
// ====================================================================

'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Sparkles } from 'lucide-react';
import type { OnboardingDashboardData } from '@/types/onboarding';

// ====================================================================
// INTERFACES
// ====================================================================

interface GerenciaOnboardingBimodalProps {
  data: OnboardingDashboardData | null;
  loading: boolean;
}

interface RankingItem {
  id: string;
  name: string;
  score: number;
  position: number;
}

// ====================================================================
// CONSTANTES
// ====================================================================

const CARD_STYLES = {
  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  backdropFilter: 'blur(16px)'
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export default function GerenciaOnboardingBimodal({ 
  data, 
  loading 
}: GerenciaOnboardingBimodalProps) {
  
  const [selectedGerencia, setSelectedGerencia] = useState<RankingItem | null>(null);

  // ================================================================
  // DATOS DE API (NO RECALCULA)
  // ================================================================
  const ranking = useMemo((): RankingItem[] => {
    const accDepts = data?.accumulated?.departments;
    if (!accDepts || accDepts.length === 0) return [];

    return accDepts
      .filter(d => d.accumulatedExoScore !== null && d.accumulatedExoScore > 0)
      .sort((a, b) => (b.accumulatedExoScore || 0) - (a.accumulatedExoScore || 0))
      .map((d, i) => ({
        id: d.id,
        name: d.displayName,
        score: d.accumulatedExoScore || 0,
        position: i + 1
      }));
  }, [data?.accumulated?.departments]);

  const globalScore = data?.accumulated?.globalExoScore;
  
  // Separar top 3 y resto
  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  // ================================================================
  // HANDLERS
  // ================================================================
  const handleGerenciaClick = (item: RankingItem) => {
    setSelectedGerencia(item);
  };

  const closeModal = () => {
    setSelectedGerencia(null);
  };

  // ================================================================
  // LOADING
  // ================================================================
  if (loading) {
    return (
      <div className="w-full max-w-[700px] mx-auto">
        <div className="p-4 sm:p-6 rounded-2xl" style={CARD_STYLES}>
          <div className="animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-40 mb-8"></div>
            <div className="flex justify-center items-end gap-4 mb-6">
              <div className="w-28 h-24 bg-slate-800/50 rounded-xl"></div>
              <div className="w-32 h-32 bg-slate-800/70 rounded-xl"></div>
              <div className="w-28 h-20 bg-slate-800/30 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // EMPTY STATE
  // ================================================================
  if (ranking.length === 0) {
    return (
      <div className="w-full max-w-[700px] mx-auto">
        <div className="p-6 sm:p-8 text-center rounded-2xl" style={CARD_STYLES}>
          <p className="text-slate-500 text-sm">Sin datos de ranking</p>
        </div>
      </div>
    );
  }

  // ================================================================
  // HELPERS
  // ================================================================
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#22D3EE';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <>
      <div className="w-full max-w-[700px] mx-auto">
        <div className="p-4 sm:p-6 rounded-2xl" style={CARD_STYLES}>
          
          {/* HEADER */}
          <div className="flex items-baseline justify-between mb-6">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
              Ranking Gerencias
            </h3>
            <span className="text-xs text-slate-600">12 meses</span>
          </div>

          {/* PODIO - Top 3 */}
          {podium.length >= 1 && (
            <div className="flex justify-center items-end gap-3 sm:gap-4 mb-8">
              
              {/* #2 - Izquierda - BORDE PÚRPURA + HOVER */}
              {podium[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => handleGerenciaClick(podium[1])}
                  className="flex flex-col items-center w-[110px] sm:w-[130px] group cursor-pointer"
                >
                  {/* Card con hover */}
                  <div 
                    className="w-full h-[75px] sm:h-[85px] rounded-xl flex flex-col items-center justify-center
                               bg-slate-800/60 border border-purple-500/30 backdrop-blur-sm
                               transition-all duration-300 ease-out
                               group-hover:border-purple-500/60 group-hover:-translate-y-1
                               group-hover:shadow-[0_8px_20px_rgba(168,85,247,0.15)]"
                  >
                    <span 
                      className="text-2xl sm:text-3xl font-light tabular-nums transition-transform duration-300 group-hover:scale-105"
                      style={{ color: getScoreColor(podium[1].score) }}
                    >
                      {podium[1].score.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">EXO</span>
                  </div>
                  
                  {/* Posición + Nombre */}
                  <div className="mt-2 text-center w-full">
                    <span className="text-purple-400 text-xs font-medium">2°</span>
                    <p 
                      className="text-slate-300 text-xs mt-1 leading-tight line-clamp-2 min-h-[32px]
                                 transition-colors duration-300 group-hover:text-white"
                      title={podium[1].name}
                    >
                      {podium[1].name}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* #1 - Centro (Protagonista) - HOVER ESPECIAL */}
              {podium[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  onClick={() => handleGerenciaClick(podium[0])}
                  className="flex flex-col items-center w-[130px] sm:w-[150px] -mt-6 group cursor-pointer"
                >
                  {/* Card con hover */}
                  <div 
                    className="w-full h-[100px] sm:h-[115px] rounded-xl flex flex-col items-center justify-center
                               bg-gradient-to-b from-cyan-500/10 to-purple-500/5
                               border border-cyan-500/30 backdrop-blur-sm
                               shadow-[0_0_20px_rgba(34,211,238,0.15)]
                               transition-all duration-300 ease-out
                               group-hover:border-cyan-400/60 group-hover:-translate-y-2
                               group-hover:shadow-[0_12px_30px_rgba(34,211,238,0.25)]"
                  >
                    <span 
                      className="text-4xl sm:text-5xl font-extralight tabular-nums transition-transform duration-300 group-hover:scale-110"
                      style={{ color: getScoreColor(podium[0].score) }}
                    >
                      {podium[0].score.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-cyan-400/70 mt-0.5">EXO</span>
                  </div>
                  
                  {/* Posición + Nombre */}
                  <div className="mt-2 text-center w-full">
                    <span className="text-cyan-400 text-xs font-semibold">1°</span>
                    <p 
                      className="text-white text-sm mt-1 leading-tight line-clamp-2 font-medium min-h-[40px]
                                 transition-colors duration-300 group-hover:text-cyan-300"
                      title={podium[0].name}
                    >
                      {podium[0].name}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* #3 - Derecha - HOVER SUTIL */}
              {podium[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => handleGerenciaClick(podium[2])}
                  className="flex flex-col items-center w-[110px] sm:w-[130px] group cursor-pointer"
                >
                  {/* Card con hover */}
                  <div 
                    className="w-full h-[60px] sm:h-[70px] rounded-xl flex flex-col items-center justify-center
                               bg-slate-800/40 border border-slate-700/30 backdrop-blur-sm
                               transition-all duration-300 ease-out
                               group-hover:border-slate-600/50 group-hover:-translate-y-1
                               group-hover:shadow-[0_6px_16px_rgba(100,116,139,0.1)]"
                  >
                    <span 
                      className="text-xl sm:text-2xl font-light tabular-nums transition-transform duration-300 group-hover:scale-105"
                      style={{ color: getScoreColor(podium[2].score) }}
                    >
                      {podium[2].score.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-600 mt-0.5">EXO</span>
                  </div>
                  
                  {/* Posición + Nombre */}
                  <div className="mt-2 text-center w-full">
                    <span className="text-slate-600 text-xs font-medium">3°</span>
                    <p 
                      className="text-slate-400 text-xs mt-1 leading-tight line-clamp-2 min-h-[32px]
                                 transition-colors duration-300 group-hover:text-slate-300"
                      title={podium[2].name}
                    >
                      {podium[2].name}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* SEPARADOR */}
          {rest.length > 0 && (
            <div className="border-t border-dashed border-slate-800 mb-4"></div>
          )}

          {/* LISTA - Posición 4+ */}
          {rest.length > 0 && (
            <div 
              className="space-y-1 max-h-[160px] overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
            >
              {rest.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => handleGerenciaClick(item)}
                  className="flex items-center justify-between py-2 px-2 rounded-lg
                             hover:bg-slate-800/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-slate-600 text-sm tabular-nums w-6">
                      {String(item.position).padStart(2, '0')}
                    </span>
                    <span className="text-slate-400 text-sm truncate group-hover:text-slate-200 transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <span 
                    className="text-sm tabular-nums font-medium ml-2"
                    style={{ color: getScoreColor(item.score) }}
                  >
                    {item.score.toFixed(0)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* FOOTER */}
          <div className="mt-6 pt-4 border-t border-slate-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                {ranking.length} {ranking.length === 1 ? 'gerencia' : 'gerencias'}
              </span>
              {globalScore && (
                <span className="text-slate-500">
                  Promedio <span className="text-slate-300 font-medium">{globalScore}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MODAL "PRÓXIMAMENTE"
          ============================================================ */}
      <AnimatePresence>
        {selectedGerencia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl overflow-hidden"
              style={CARD_STYLES}
            >
              {/* Gradiente decorativo superior */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: 'linear-gradient(90deg, #22D3EE, #A78BFA)'
                }}
              />
              
              {/* Botón cerrar */}
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 
                           hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* Contenido */}
              <div className="p-6 text-center">
                {/* Icono animado */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                  className="inline-flex p-4 rounded-2xl mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(167, 139, 250, 0.1))'
                  }}
                >
                  <Rocket className="h-10 w-10 text-cyan-400" />
                </motion.div>
                
                {/* Nombre de gerencia */}
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                  {selectedGerencia.name}
                </p>
                
                {/* Título */}
                <h3 className="text-xl font-semibold text-white mb-2">
                  Próximamente
                </h3>
                
                {/* Descripción */}
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  El detalle por gerencia estará disponible pronto. 
                  Podrás ver el breakdown de EXO Score, tendencias y personas.
                </p>
                
                {/* Features preview */}
                <div className="space-y-2 mb-6">
                  {['Score por dimensión 4C', 'Tendencia histórica', 'Personas en riesgo'].map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-2 text-xs text-slate-500"
                    >
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Botón */}
                <button
                  onClick={closeModal}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-medium
                             bg-gradient-to-r from-cyan-500 to-purple-500
                             text-white shadow-lg shadow-cyan-500/20
                             hover:shadow-cyan-500/30 hover:scale-[1.02]
                             transition-all duration-200"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}