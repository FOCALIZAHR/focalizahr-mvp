// ====================================================================
// MODO PREDICTIVO - MISSION CONTROL FUTURISTA REAL
// src/components/monitor/cockpit/PredictiveHeader.tsx
// ✅ IMPLEMENTA: Layout asimétrico con velocímetro masivo central 300px
// ✅ NEURAL MORPHING: layoutId="main-gauge" para transformación
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// 🎯 INTERFACE PROPS - ARQUITECTURA NEURAL DOCUMENTADA
interface PredictiveHeaderProps {
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  topMovers: Array<{
    name: string;
    momentum: number;
    trend: 'completado' | 'acelerando' | 'estable' | 'desacelerando';
  }>;
  negativeAnomalies: Array<{
    department: string;
    rate: number;
    severity: 'high' | 'medium';
    zScore: number;
  }>;
  participationPrediction?: {
    finalProjection: number;
    confidence: number;
    velocity: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  crossStudyComparison?: {
    percentileRanking: number;
    patternSimilarity: number;
    velocityTrend: 'faster' | 'slower' | 'similar';
  };
  insights: string[];
  recommendations: string[];
  cockpitIntelligence?: {
    vectorMomentum: string;
    projection: {
      finalProjection: number;
      confidence: number;
      methodology: string;
      confidenceText: string;
    };
    action: {
      primary: string;
      reasoning: string;
      urgency: 'baja' | 'media' | 'alta' | 'crítica';
      nextSteps: string[];
      urgencyColor: string;
    };
    pattern: {
      dominantPattern: string;
      description: string;
      insights: string[];
      patternColor: string;
    };
  };
  onNavigate?: (sectionId: string) => void;
  isLoading: boolean;
  lastRefresh: Date;
}

// 🎯 MODO PREDICTIVO - MISSION CONTROL LAYOUT ASIMÉTRICO
export function PredictiveHeader(props: PredictiveHeaderProps) {
  const {
    participationRate,
    daysRemaining,
    totalInvited,
    totalResponded,
    participationPrediction,
    cockpitIntelligence,
    onNavigate,
  } = props;

  // ✅ VALIDACIÓN DATOS REALES DEL HOOK - NO FALLBACKS MOCK
  const hasValidProjection = cockpitIntelligence?.projection?.finalProjection != null;
  const hasValidPrediction = participationPrediction?.finalProjection != null;
  
  if (!hasValidProjection && !hasValidPrediction) {
    console.warn('PredictiveHeader: Datos de proyección no disponibles del hook');
    return (
      <div className="predictivo-error" style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>
        <div>Error: Datos de proyección no calculados</div>
        <div style={{ fontSize: '0.875rem', marginTop: '8px', color: 'rgba(255,255,255,0.6)' }}>
          Verificar cockpitIntelligence del hook central
        </div>
      </div>
    );
  }

  // ✅ USAR SOLO DATOS REALES PRE-CALCULADOS
  const proyeccionFinal = cockpitIntelligence?.projection?.finalProjection ?? 
    participationPrediction?.finalProjection ?? 0;
  
  const confianza = cockpitIntelligence?.projection?.confidence ?? 
    participationPrediction?.confidence ?? 0;

  const velocidad = participationPrediction?.velocity ?? 0;

  // ✅ CONSTANTES DE CONFIGURACIÓN (no hardcode)
  const CONFIG = {
    CAMPAIGN_DURATION_DAYS: 21,
    TARGET_PARTICIPATION: 90,
    GAUGE_SIZE: 300,
    GAUGE_INNER_RADIUS: 110,
    GAUGE_OUTER_RADIUS: 140
  };

  const metaNecesaria = daysRemaining > 0 ? CONFIG.TARGET_PARTICIPATION / daysRemaining : 0;

  // ✅ VALIDAR DATOS GAUGE - NO SIMULACIÓN
  if (proyeccionFinal === 0 && confianza === 0) {
    console.warn('PredictiveHeader: Datos de gauge no válidos');
  }

  const gaugeData = [
    { value: proyeccionFinal, fill: '#00d9ff', name: 'Proyección' },
    { value: Math.max(0, 100 - proyeccionFinal), fill: 'rgba(71, 85, 105, 0.2)', name: 'Restante' }
  ];

  // ✅ CLUSTER ALERTAS (solo si crítico)
  const showCriticalAlert = cockpitIntelligence?.action?.urgency === 'crítica';

  return (
    <div 
      className="predictivo-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 220px',
        gridTemplateRows: '1fr auto',
        gap: '1.5rem',
        minHeight: '320px',
        position: 'relative'
      }}
    >
      {/* ▌SMALL HUD IZQUIERDO */}
      <div 
        className="small-hud"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          justifyContent: 'center',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}
      >
        <div className="hud-metric" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
            STATUS
          </div>
          <div 
            style={{ 
              fontSize: '0.875rem', 
              color: proyeccionFinal >= 80 ? '#10B981' : proyeccionFinal >= 60 ? '#F59E0B' : '#EF4444',
              fontWeight: 600
            }}
          >
            {proyeccionFinal >= 80 ? 'NOMINAL' : proyeccionFinal >= 60 ? 'CAUTION' : 'CRITICAL'}
          </div>
        </div>

        <div className="hud-metric" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
            MODE
          </div>
          <div style={{ fontSize: '0.875rem', color: '#00d9ff', fontWeight: 600 }}>
            PRED
          </div>
        </div>
      </div>

      {/* 🎯 VELOCÍMETRO MASIVO CENTRAL - ELEMENTO DOMINANTE */}
      <motion.div
        layoutId="main-gauge"
        className="velocimetro-masivo"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        onClick={() => onNavigate?.('proyeccion-cientifica')}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* GAUGE CIRCULAR MASIVO - USO CONFIGURACIÓN */}
        <div style={{ width: `${CONFIG.GAUGE_SIZE}px`, height: `${CONFIG.GAUGE_SIZE}px`, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                startAngle={90}
                endAngle={450}
                innerRadius={CONFIG.GAUGE_INNER_RADIUS}
                outerRadius={CONFIG.GAUGE_OUTER_RADIUS}
                dataKey="value"
                strokeWidth={0}
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* CENTRO GAUGE - MÉTRICAS PRINCIPALES */}
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}
          >
            <motion.div
              style={{
                fontSize: '3.5rem',
                fontWeight: 700,
                color: '#00d9ff',
                fontFamily: 'JetBrains Mono, monospace',
                textShadow: '0 0 20px rgba(0, 217, 255, 0.5)',
                lineHeight: 1
              }}
              animate={{
                textShadow: [
                  '0 0 20px rgba(0, 217, 255, 0.5)',
                  '0 0 30px rgba(0, 217, 255, 0.8)',
                  '0 0 20px rgba(0, 217, 255, 0.5)'
                ]
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              {proyeccionFinal.toFixed(0)}%
            </motion.div>
            
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
              Proyección {daysRemaining} días
            </div>
            
            <div style={{ fontSize: '0.75rem', color: '#00d9ff', marginTop: '4px' }}>
              Confianza: {confianza.toFixed(0)}%
            </div>
          </div>

          {/* NEURAL GLOW EFFECT */}
          <motion.div
            style={{
              position: 'absolute',
              inset: '-20px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 217, 255, 0.1) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
        </div>

        {/* ETIQUETA GAUGE */}
        <motion.div
          style={{
            marginTop: '1rem',
            textAlign: 'center',
            background: 'rgba(0, 217, 255, 0.1)',
            border: '1px solid rgba(0, 217, 255, 0.2)',
            borderRadius: '20px',
            padding: '8px 16px',
            backdropFilter: 'blur(10px)'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ fontSize: '0.75rem', color: '#00d9ff', fontWeight: 600 }}>
            PROYECCIÓN CIENTÍFICA IA
          </div>
        </motion.div>
      </motion.div>

      {/* 📊 CONTEXT HUD DERECHO */}
      <div 
        className="context-hud"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* DÍAS RESTANTES */}
        <div className="hud-item">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              TIEMPO
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
            {daysRemaining}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            días restantes
          </div>
        </div>

        {/* VELOCIDAD ACTUAL */}
        <div className="hud-item">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              VELOCITY
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F59E0B' }}>
            {velocidad.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            resp/día actual
          </div>
        </div>

        {/* META REQUERIDA */}
        <div className="hud-item">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded border-2 border-green-400"></div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              TARGET
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981' }}>
            {metaNecesaria.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            resp/día meta
          </div>
        </div>

        {/* ESTADO VELOCITY */}
        <div 
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: velocidad >= metaNecesaria ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${velocidad >= metaNecesaria ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}
        >
          <div style={{ 
            fontSize: '0.75rem', 
            color: velocidad >= metaNecesaria ? '#10B981' : '#EF4444',
            fontWeight: 600,
            textAlign: 'center'
          }}>
            {velocidad >= metaNecesaria ? '✓ ON TARGET' : '⚠ BELOW TARGET'}
          </div>
        </div>
      </div>

      {/* 🚨 CLUSTER ALERTAS (solo si crítico) */}
      {showCriticalAlert && (
        <motion.div
          className="cluster-alertas"
          style={{
            gridColumn: '1 / -1',
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => onNavigate?.('accion-critica')}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </motion.div>
            
            <div className="flex-1">
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#EF4444', marginBottom: '4px' }}>
                ACCIÓN CRÍTICA REQUERIDA
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                {cockpitIntelligence?.action?.primary || 'Intervención inmediata necesaria'}
              </div>
            </div>
            
            <div style={{
              padding: '4px 8px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#EF4444',
              fontWeight: 600
            }}>
              CRÍTICA
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}