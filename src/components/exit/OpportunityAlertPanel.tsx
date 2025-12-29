// src/components/exit/OpportunityAlertPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 PANEL: Tu Alerta - Muestra datos del motor
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileText, Scale, Flame, Lightbulb } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ETAPAS
// ═══════════════════════════════════════════════════════════════════════════════

const STAGES_CONFIG = [
  { key: 'indicios', label: 'Indicios', icon: AlertTriangle },
  { key: 'denuncia', label: 'Denuncia', icon: FileText },
  { key: 'investigacion', label: 'Investigación', icon: Scale },
  { key: 'escandalo', label: 'Escándalo', icon: Flame }
];

// Contenido por etapa (contexto educativo para el usuario)
const STAGE_CONTENT = {
  indicios: {
    titulo: 'LA VENTANA DE ORO',
    descripcion: 'Tienen una SEÑAL. No una denuncia. No una crisis. Una oportunidad única de anticipación.',
    items: ['Sin costos legales', 'Sin plazos obligatorios', 'Sin exposición pública', 'Control total']
  },
  denuncia: {
    titulo: 'GESTIÓN DE CRISIS',
    descripcion: 'Una vez existe denuncia formal, se activan plazos legales. El reloj empieza a correr.',
    items: ['48h medidas de resguardo', '30 días investigación', 'Documentación obligatoria', 'Posible inspección DT']
  },
  investigacion: {
    titulo: 'TERRENO LEGAL',
    descripcion: 'El caso llegó a tribunales o Dirección del Trabajo. Las consecuencias son permanentes.',
    items: ['6-11 sueldos indemnización', '$5M-$20M daño moral', 'Registro público', 'Prohibición contratos Estado']
  },
  escandalo: {
    titulo: 'PUNTO DE NO RETORNO',
    descripcion: 'Una vez que es público, no hay vuelta atrás. La única opción es que NUNCA llegue aquí.',
    items: ['1 post viral = crisis global', 'Medios amplifican sin control', 'Efecto dominó denuncias', 'Talento huye']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface OpportunityAlertPanelProps {
  currentStage: number;
  message: string;
  callToAction?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: TIMELINE
// ═══════════════════════════════════════════════════════════════════════════════

const Timeline = memo(function Timeline({
  selectedStage,
  onStageSelect,
  currentStage
}: {
  selectedStage: number;
  onStageSelect: (index: number) => void;
  currentStage: number;
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
        className="absolute top-1/2 left-[10%] h-px -translate-y-1/2 bg-cyan-400"
        animate={{ width: `${(selectedStage / 3) * 80}%` }}
        transition={{ duration: 0.4 }}
      />
      
      {/* Stages */}
      <div className="relative flex items-center justify-between">
        {STAGES_CONFIG.map((stage, index) => {
          const isSelected = selectedStage === index;
          const isCurrent = currentStage === index;
          const Icon = stage.icon;
          
          return (
            <div key={stage.key} className="relative flex flex-col items-center gap-3">
              {/* Badge AQUÍ */}
              {isCurrent && (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-8 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                >
                  AQUÍ
                </motion.span>
              )}
              
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
                    ? 'rgba(34, 211, 238, 0.1)'
                    : 'rgba(30, 41, 59, 0.8)',
                  border: `1px solid ${isSelected ? '#22D3EE' : 'rgba(71, 85, 105, 0.3)'}`,
                  boxShadow: isSelected ? '0 0 20px rgba(34, 211, 238, 0.2)' : 'none'
                }}
              >
                <Icon 
                  style={{
                    width: isSelected ? '22px' : '18px',
                    height: isSelected ? '22px' : '18px',
                    color: isSelected ? '#22D3EE' : 'rgba(148, 163, 184, 0.5)'
                  }}
                />
              </motion.button>
              
              {/* Label */}
              <span 
                className="text-xs font-medium"
                style={{ color: isSelected ? '#22D3EE' : 'rgba(148, 163, 184, 0.6)' }}
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
// COMPONENTE: PANEL DE CONTENIDO
// ═══════════════════════════════════════════════════════════════════════════════

const ContentPanel = memo(function ContentPanel({
  stageKey,
  callToAction
}: {
  stageKey: keyof typeof STAGE_CONTENT;
  callToAction?: string;
}) {
  const content = STAGE_CONTENT[stageKey];
  
  return (
    <motion.div
      key={stageKey}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50"
    >
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-cyan-400 mb-1">
          {content.titulo}
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          {content.descripcion}
        </p>
      </div>
      
      {/* Items */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {content.items.map((item, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-xs text-slate-300">{item}</span>
          </div>
        ))}
      </div>
      
      {/* CTA del motor */}
      {callToAction && (
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-cyan-400 font-medium">{callToAction}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function OpportunityAlertPanel({
  currentStage,
  message,
  callToAction
}: OpportunityAlertPanelProps) {
  const [selectedStage, setSelectedStage] = React.useState(currentStage);
  const stageKey = STAGES_CONFIG[selectedStage].key as keyof typeof STAGE_CONTENT;
  
  return (
    <div className="space-y-2">
      {/* Mensaje del motor */}
      <p className="text-sm text-slate-400 text-center">
        {message}
      </p>
      
      {/* Timeline */}
      <Timeline
        selectedStage={selectedStage}
        onStageSelect={setSelectedStage}
        currentStage={currentStage}
      />
      
      {/* Panel de contenido */}
      <ContentPanel 
        stageKey={stageKey} 
        callToAction={callToAction}
      />
    </div>
  );
});