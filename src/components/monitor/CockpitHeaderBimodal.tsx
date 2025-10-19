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
    trend: 'completado' | 'acelerando' | 'estable' | 'desacelerando';
  }>;
  negativeAnomalies?: Array<{
    department: string;
    rate: number;
    severity: 'high' | 'medium';  // ← ESPECÍFICO
    zScore: number;               // ← REQUERIDO
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
            
            {/* ECG Enterprise con 3 ciclos: cyan → purple → mezclado */}
            <motion.div
              style={{
                marginTop: '-4px',
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '8px',
                padding: '8px 12px',
                border: '1px solid rgba(34, 211, 238, 0.2)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              whileHover={{
                borderColor: 'rgba(34, 211, 238, 0.4)',
                boxShadow: '0 4px 20px rgba(34, 211, 238, 0.1)',
                y: -1
              }}
            >
              <svg
                width="140"
                height="40"
                viewBox="0 0 140 40"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22D3EE" />
                    <stop offset="50%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
                
                {/* Main ECG trace - 3 ciclos diferentes */}
                <motion.path
                  d="M0,20 L14,20 Q17,17 20,20 L35,20 L38,22 L40,8 L42,32 L44,20 L70,20 Q73,17 76,20 L91,20 L94,22 L96,6 L98,34 L100,20 L126,20 Q129,17 132,20 L140,20"
                  fill="none"
                  stroke="#22D3EE"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{
                    strokeDasharray: [
                      "0 280",      // Inicio
                      "70 210",     // Primer tercio
                      "140 140",    // Medio
                      "210 70",     // Dos tercios
                      "280 0",      // Completo
                      "210 70",     // Vuelta
                      "140 140",    // Reset
                      "70 210",     // Reset
                      "0 280"       // Inicio
                    ],
                    stroke: [
                      "#22D3EE",    // Cyan puro
                      "#22D3EE", 
                      "#22D3EE",
                      "#A78BFA",    // Purple puro
                      "#A78BFA", 
                      "#A78BFA",
                      "url(#ecg-gradient)", // Mezclado
                      "url(#ecg-gradient)",
                      "#22D3EE"     // Vuelta a cyan
                    ]
                  }}
                  transition={{
                    duration: 8,  // Más lento: 8 segundos total
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    filter: "drop-shadow(0 0 4px rgba(34, 211, 238, 0.4))"
                  }}
                />
                
                {/* Glow layer sutil */}
                <motion.path
                  d="M0,20 L14,20 Q17,17 20,20 L35,20 L38,22 L40,8 L42,32 L44,20 L70,20 Q73,17 76,20 L91,20 L94,22 L96,6 L98,34 L100,20 L126,20 Q129,17 132,20 L140,20"
                  fill="none"
                  stroke="url(#ecg-gradient)"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.4"
                  animate={{
                    strokeDasharray: [
                      "0 280",
                      "70 210", 
                      "140 140", 
                      "210 70",
                      "280 0",
                      "210 70",
                      "140 140",
                      "70 210",
                      "0 280"
                    ]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    filter: "blur(1px)"
                  }}
                />
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