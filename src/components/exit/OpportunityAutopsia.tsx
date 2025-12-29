// src/components/exit/OpportunityAutopsia.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 AUTOPSIA REAL: Muestra caso emblemático de emblamaticCases.ts
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileText, Scale, Flame, Lightbulb } from 'lucide-react';
import type { EmblamaticCase } from '@/types/ExitBusinessCase';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const STAGES_CONFIG = [
  { key: 'indicios', label: 'Indicios', icon: AlertTriangle },
  { key: 'denuncia', label: 'Denuncia', icon: FileText },
  { key: 'investigacion', label: 'Investigación', icon: Scale },
  { key: 'escandalo', label: 'Escándalo', icon: Flame }
];

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface OpportunityAutopsiaProps {
  autopsiaCase: EmblamaticCase;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: TIMELINE
// ═══════════════════════════════════════════════════════════════════════════════

const Timeline = memo(function Timeline({
  selectedStage,
  onStageSelect
}: {
  selectedStage: number;
  onStageSelect: (index: number) => void;
}) {
  return (
    <div className="relative py-8 px-4">
      {/* Línea de conexión */}
      <div 
        className="absolute top-1/2 left-[10%] right-[10%] h-px -translate-y-1/2"
        style={{ background: 'rgba(71, 85, 105, 0.4)' }}
      />
      
      {/* Línea de progreso */}
      <motion.div 
        className="absolute top-1/2 left-[10%] h-px -translate-y-1/2 bg-purple-400"
        animate={{ width: `${(selectedStage / 3) * 80}%` }}
        transition={{ duration: 0.4 }}
      />
      
      {/* Stages */}
      <div className="relative flex items-center justify-between">
        {STAGES_CONFIG.map((stage, index) => {
          const isSelected = selectedStage === index;
          const Icon = stage.icon;
          
          return (
            <div key={stage.key} className="relative flex flex-col items-center gap-3">
              {/* Icono */}
              <motion.button
                onClick={() => onStageSelect(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center transition-all duration-300"
                style={{
                  width: isSelected ? '52px' : '44px',
                  height: isSelected ? '52px' : '44px',
                  borderRadius: '14px',
                  background: isSelected 
                    ? 'rgba(167, 139, 250, 0.1)'
                    : 'rgba(30, 41, 59, 0.8)',
                  border: `1px solid ${isSelected ? '#A78BFA' : 'rgba(71, 85, 105, 0.3)'}`,
                  boxShadow: isSelected ? '0 0 20px rgba(167, 139, 250, 0.2)' : 'none'
                }}
              >
                <Icon 
                  style={{
                    width: isSelected ? '22px' : '18px',
                    height: isSelected ? '22px' : '18px',
                    color: isSelected ? '#A78BFA' : 'rgba(148, 163, 184, 0.5)'
                  }}
                />
              </motion.button>
              
              {/* Label */}
              <span 
                className="text-xs font-medium"
                style={{ color: isSelected ? '#A78BFA' : 'rgba(148, 163, 184, 0.6)' }}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: PANEL DE AUTOPSIA
// ═══════════════════════════════════════════════════════════════════════════════

const AutopsiaContent = memo(function AutopsiaContent({
  stageKey,
  autopsiaCase
}: {
  stageKey: string;
  autopsiaCase: EmblamaticCase;
}) {
  const autopsia = autopsiaCase.autopsia;
  if (!autopsia) return null;
  
  // Extraer datos según la etapa
  const getStageData = () => {
    switch (stageKey) {
      case 'indicios': {
        const data = autopsia.indicios;
        return {
          periodo: data.periodo,
          titulo: 'LOS INDICIOS IGNORADOS',
          contenido: data.descripcion,
          destacado: data.ignorado,
          destacadoLabel: 'Lo que dijeron:',
          esQuote: true
        };
      }
      case 'denuncia': {
        const data = autopsia.denuncia;
        return {
          periodo: data.fecha,
          titulo: 'EL DETONANTE',
          contenido: data.trigger,
          destacado: data.titulo,
          destacadoLabel: 'Titular:',
          esQuote: true
        };
      }
      case 'investigacion': {
        const data = autopsia.investigacion;
        return {
          periodo: null,
          titulo: 'LA INVESTIGACIÓN',
          contenido: data.accion,
          destacado: data.consecuencias,
          destacadoLabel: 'Consecuencias:',
          esQuote: false
        };
      }
      case 'escandalo': {
        const data = autopsia.escandalo;
        return {
          periodo: null,
          titulo: 'EL ESCÁNDALO',
          contenido: data.resultado,
          destacado: data.costoFinal,
          destacadoLabel: 'Costo final:',
          esQuote: false
        };
      }
      default:
        return null;
    }
  };
  
  const data = getStageData();
  if (!data) return null;
  
  const isEscandalo = stageKey === 'escandalo';
  
  return (
    <motion.div
      key={stageKey}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="p-6 rounded-2xl bg-slate-800/50 border border-purple-500/20"
    >
      {/* Header con empresa */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(167, 139, 250, 0.1)' }}
          >
            <Flame className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">{autopsiaCase.company}</h4>
            <p className="text-xs text-slate-400">Caso real • {autopsiaCase.year}</p>
          </div>
        </div>
        {data.periodo && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {data.periodo}
          </span>
        )}
      </div>
      
      {/* Título de la etapa */}
      <h5 className="text-sm font-semibold text-purple-400 mb-2">
        {data.titulo}
      </h5>
      
      {/* Contenido principal */}
      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        {data.contenido}
      </p>
      
      {/* Destacado */}
      {data.destacado && (
        <div 
          className="p-4 rounded-lg border-l-2"
          style={{
            background: isEscandalo 
              ? 'rgba(239, 68, 68, 0.05)' 
              : 'rgba(167, 139, 250, 0.05)',
            borderColor: isEscandalo 
              ? 'rgba(239, 68, 68, 0.4)' 
              : 'rgba(167, 139, 250, 0.4)'
          }}
        >
          <p 
            className="text-xs font-semibold mb-1"
            style={{ color: isEscandalo ? '#EF4444' : '#A78BFA' }}
          >
            {data.destacadoLabel}
          </p>
          <p 
            className="text-sm"
            style={{
              color: isEscandalo ? '#FCA5A5' : '#C4B5FD',
              fontStyle: data.esQuote ? 'italic' : 'normal'
            }}
          >
            {data.esQuote ? `"${data.destacado}"` : data.destacado}
          </p>
        </div>
      )}
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: LECCIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const Lesson = memo(function Lesson({ lesson }: { lesson: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20"
    >
      <div className="flex items-start gap-3">
        <Lightbulb className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs uppercase tracking-wider text-purple-400 font-semibold mb-1">
            La lección
          </p>
          <p className="text-sm text-slate-300 italic">"{lesson}"</p>
        </div>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function OpportunityAutopsia({
  autopsiaCase
}: OpportunityAutopsiaProps) {
  const [selectedStage, setSelectedStage] = useState(0); // Empieza en indicios
  const stageKey = STAGES_CONFIG[selectedStage].key;
  
  return (
    <div className="space-y-2">
      {/* Mensaje contextual */}
      <p className="text-sm text-slate-400 text-center">
        Cómo {autopsiaCase.company} llegó al escándalo
      </p>
      
      {/* Timeline */}
      <Timeline
        selectedStage={selectedStage}
        onStageSelect={setSelectedStage}
      />
      
      {/* Panel de contenido */}
      <AutopsiaContent 
        stageKey={stageKey} 
        autopsiaCase={autopsiaCase}
      />
      
      {/* Lección */}
      <Lesson lesson={autopsiaCase.lesson} />
    </div>
  );
});