// ====================================================================
// COCKPIT HEADER BIMODAL - EXTREMADAMENTE SENCILLO
// src/components/monitor/CockpitHeaderBimodal.tsx
// 🎯 SOLO CAMBIA DE VISTA + BOTÓN ELEGANTE + TÍTULO
// ====================================================================

"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import PredictiveHeader from './cockpit/PredictiveHeader';
import { DynamicHeader } from './cockpit/DynamicHeader';

// 🎯 INTERFACE MÍNIMA - Solo lo esencial
interface CockpitHeaderBimodalProps {
  // Datos básicos para los hijos
  campaignName: string;
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  
  // Datos más complejos que vienen del hook
  dailyResponses?: Array<{ date: string; count: number; cumulative: number }>;
  topMovers?: Array<{
    name: string;
    momentum: number;
    trend: string;
  }>;
  negativeAnomalies?: Array<{
    department: string;
    rate: number;
    severity: string;
    zScore?: number;
  }>;
  participationPrediction?: {
    finalProjection: number;
    confidence: number;
    velocity: number;
  };
  cockpitIntelligence?: {
    vectorMomentum: string;
    projection: {
      finalProjection: number;
      confidence: number;
    };
    action: {
      primary: string;
      reasoning: string;
      timeline: string;
      urgency: 'baja' | 'media' | 'alta' | 'crítica';
    };
  };
  
  // Handler opcional
  onNavigate?: (section: string) => void;
}

export function CockpitHeaderBimodal(props: CockpitHeaderBimodalProps) {
  // ✅ ESTADO SIMPLE: Solo qué vista mostrar
  const [vistaActiva, setVistaActiva] = useState<'predictivo' | 'dinamico'>('predictivo');
  
  // ✅ FUNCIÓN SIMPLE: Solo cambiar vista
  const cambiarVista = (nuevaVista: 'predictivo' | 'dinamico') => {
    setVistaActiva(nuevaVista);
  };
  
  return (
    <div className="space-y-6">
      
      {/* 🏆 LAYOUT OPTIMIZADO - GAUGE PROTAGONISTA */}
      <div 
        className="relative"
        style={{ 
          minHeight: '80px',
          padding: '20px 40px'
        }}
      >
        
        {/* 🎯 HEADER INTEGRADO: TOGGLE + TÍTULO + COUNTDOWN */}
        <div className="flex items-center justify-between mb-6">
          
          {/* Toggle compacto izquierda */}
          <div className="relative group">
            <motion.div 
              className="relative backdrop-blur-sm border"
              style={{
                width: '180px',
                height: '36px',
                borderRadius: '18px',
                padding: '2px',
                background: 'rgba(15, 23, 42, 0.4)',
                borderColor: 'rgba(71, 85, 105, 0.2)',
                boxShadow: `
                  0 1px 3px rgba(0, 0, 0, 0.1),
                  inset 0 0 0 1px rgba(255, 255, 255, 0.02)
                `
              }}
              whileHover={{ 
                borderColor: vistaActiva === 'predictivo' ? 'rgba(34, 211, 238, 0.3)' : 'rgba(167, 139, 250, 0.3)',
                transition: { duration: 0.3 }
              }}
            >
              
              {/* Indicator activo */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  top: '2px',
                  height: '32px',
                  width: '87px',
                  background: vistaActiva === 'predictivo'
                    ? 'linear-gradient(135deg, #22D3EE, #0891B2)'
                    : 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
                  boxShadow: `
                    0 1px 4px rgba(0, 0, 0, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `
                }}
                animate={{
                  x: vistaActiva === 'predictivo' ? '2px' : '89px'
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
              />
              
              {/* Botón Predictivo */}
              <button
                onClick={() => cambiarVista('predictivo')}
                className="absolute left-0.5 top-0.5 bottom-0.5 z-10 rounded-full transition-all duration-200 flex items-center justify-center"
                style={{
                  width: '87px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: vistaActiva === 'predictivo' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(148, 163, 184, 0.8)'
                }}
              >
                Futuro
              </button>
              
              {/* Botón Dinámico */}
              <button
                onClick={() => cambiarVista('dinamico')}
                className="absolute right-0.5 top-0.5 bottom-0.5 z-10 rounded-full transition-all duration-200 flex items-center justify-center"
                style={{
                  width: '87px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: vistaActiva === 'dinamico' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(148, 163, 184, 0.8)'
                }}
              >
                Ahora
              </button>
            </motion.div>
          </div>
          
          {/* Título con submarca correcta FocalizaHR */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center flex items-center justify-center space-x-3"
          >
            <div>
              <h1 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  marginBottom: '2px',
                  lineHeight: 1.1
                }}
              >
                <span className="sub-brand-logo-text" style={{
                  color: 'var(--color-text-primary, #E6EDF3)'
                }}>
                  Focaliza
                </span>
                <span className="sub-brand-suffix-gradient">
                  DIAGNÓSTICO
                </span>
              </h1>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 400,
                  color: 'var(--color-text-secondary, #7D8590)',
                  margin: 0,
                  letterSpacing: '0.005em'
                }}
              >
                Monitoreo continuo, predictivo y accionable
              </p>
            </div>
            
            {/* 🩺 ECG ÚNICO CONTINUO - Sin saltos que creen múltiples segmentos */}
            <motion.div
              style={{
                marginTop: '-4px',
                alignSelf: 'flex-start'
              }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <svg width="180" height="40" viewBox="0 0 180 40">
                {/* Path ECG CONTINUO sin saltos - Una sola línea fluida */}
                <path
                  d="M0 20 L20 20 L22 18 L24 22 L26 20 L28 8 L30 32 L32 20 L34 14 L36 26 L38 20 L40 19 L42 21 L44 20 L46 18 L48 22 L50 20 L52 16 L54 24 L56 20 L58 19.5 L60 20.5 L62 20 L64 17 L66 23 L68 20 L70 18.5 L72 21.5 L74 20 L76 6 L78 34 L80 20 L82 13 L84 27 L86 20 L88 19.2 L90 20.8 L92 20 L94 18.8 L96 21.2 L98 20 L100 19.6 L102 20.4 L104 20 L106 18.3 L108 21.7 L110 20 L112 7 L114 33 L116 20 L118 15 L120 25 L122 20 L124 19.4 L126 20.6 L128 20 L130 18.9 L132 21.1 L134 20 L136 19.7 L138 20.3 L140 20 L142 18.6 L144 21.4 L146 20 L148 19.8 L150 20.2 L152 20 L154 9 L156 31 L158 20 L160 16 L162 24 L164 20 L166 19.9 L168 20.1 L170 20 L172 19.5 L174 20.5 L176 20 L180 20"
                  fill="none"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                >
                  {/* ✅ Animación continua única - Ciclo extendido perfecto */}
                  <animate
                    attributeName="stroke-dasharray"
                    values="0 180;20 160;40 140;60 120;80 100;100 80;120 60;140 40;160 20;180 0;160 20;140 40;120 60;100 80;80 100;60 120;40 140;20 160;0 180"
                    dur="8s"
                    repeatCount="indefinite"
                  />
                  
                  {/* 🎨 Color alternante más suave y lento */}
                  <animate
                    attributeName="stroke"
                    values="#22D3EE;#A78BFA;#22D3EE"
                    dur="12s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
            </motion.div>
          </motion.div>

          <style jsx>{`
            .sub-brand-suffix-gradient {
              background: linear-gradient(90deg, var(--color-accent-primary, #22D3EE) 0%, var(--color-accent-secondary, #A78BFA) 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              display: inline-block;
            }
          `}</style>
          
          {/* Espaciador invisible para centrado matemático perfecto */}
          <div style={{ width: '180px' }}></div>
        </div>
      </div>

      {/* 🎯 CONTENEDOR DE VISTAS - SOLO MOSTRAR LA ACTIVA */}
      <div className="min-h-[400px]">
        {vistaActiva === 'predictivo' ? (
          <PredictiveHeader
            {...props}
            isActive={true}
          />
        ) : (
          <DynamicHeader
            {...props}
            isActive={true}
          />
        )}
      </div>
    </div>
  );
}

export default CockpitHeaderBimodal;