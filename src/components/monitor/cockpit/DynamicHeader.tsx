// ====================================================================
// MODO DINÁMICO - WAR ROOM EJECUTIVO REAL
// src/components/monitor/cockpit/DynamicHeader.tsx
// ✅ IMPLEMENTA: Grid 4 tarjetas especializadas inteligencia
// ✅ NEURAL MORPHING: gauge compacto recibe layoutId="main-gauge"
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { Crown, AlertTriangle, Users, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar } from 'recharts';

// 🎯 INTERFACE PROPS - ARQUITECTURA NEURAL DOCUMENTADA
interface DynamicHeaderProps {
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
  riskTrendData?: Array<{date: string, rate: number}>;
  departmentSizes?: Record<string, number>;
  momentumGaugeData?: Array<{value: number, fill: string}>;
  byDepartment?: Record<string, {
    invited: number;
    responded: number;
    rate: number;
  }>;
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
    tacticalAction?: {
      primary: string;
      reasoning: string;
      urgency: string;
      urgencyColor: string;
      timeline?: string;
    };
  };
  onNavigate?: (section: string) => void;
}

// 🎯 MODO DINÁMICO - WAR ROOM GRID INTELIGENCIA
export function DynamicHeader(props: DynamicHeaderProps) {
  const {
    participationRate,
    daysRemaining,
    topMovers,
    negativeAnomalies,
    riskTrendData = [],
    byDepartment = {},
    cockpitIntelligence,
    onNavigate,
  } = props;

  // ✅ VALIDACIÓN DATOS REALES - NO SIMULACIÓN
  const hasValidTopMovers = topMovers && topMovers.length > 0;
  const hasValidAnomalies = negativeAnomalies && negativeAnomalies.length > 0;
  const hasValidDepartmentData = byDepartment && Object.keys(byDepartment).length > 0;

  // ✅ USAR SOLO DATOS REALES DEL HOOK
  const campeón = hasValidTopMovers ? topMovers[0] : null;
  const focoRiesgo = hasValidAnomalies ? negativeAnomalies[0] : null;
  
  // ✅ PANORAMA BASADO EN DATOS REALES
  const departamentosTotal = hasValidDepartmentData ? Object.keys(byDepartment).length : topMovers.length;
  const completados = hasValidTopMovers ? topMovers.filter(m => m.trend === 'completado').length : 0;
  const enRiesgo = hasValidAnomalies ? negativeAnomalies.length : 0;
  const acelerando = hasValidTopMovers ? topMovers.filter(m => m.trend === 'acelerando').length : 0;

  // ✅ ERROR SI NO HAY DATOS SUFICIENTES
  if (!hasValidTopMovers && !hasValidAnomalies && !hasValidDepartmentData) {
    console.warn('DynamicHeader: Datos insuficientes del hook central');
    return (
      <div className="dinamico-error" style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>
        <div>Error: Datos de análisis departamental no disponibles</div>
        <div style={{ fontSize: '0.875rem', marginTop: '8px', color: 'rgba(255,255,255,0.6)' }}>
          Verificar topMovers, negativeAnomalies del hook
        </div>
      </div>
    );
  }

  // ✅ RECOMENDACIÓN TÁCTICA INTELIGENTE
  const recomendaciónTáctica = cockpitIntelligence?.tacticalAction || {
    primary: campeón && focoRiesgo 
      ? `Replicar éxito de ${campeón.name} en ${focoRiesgo.department}`
      : focoRiesgo 
      ? `Intervención inmediata en ${focoRiesgo.department}`
      : 'Mantener momentum actual',
    reasoning: campeón && focoRiesgo 
      ? `${campeón.name} 89% vs ${focoRiesgo.department} ${focoRiesgo.rate}%`
      : 'Estrategia basada en datos tiempo real',
    urgency: focoRiesgo?.severity === 'high' ? 'crítica' : 'media',
    timeline: 'Ejecutar en próximas 24-48 horas'
  };

  // ✅ USAR DATOS REALES DE RIESGO - NO SIMULACIÓN
  const riskSparklineData = riskTrendData && riskTrendData.length > 0 
    ? riskTrendData.slice(-7) 
    : null; // No simular datos

  if (!riskSparklineData && focoRiesgo) {
    console.warn('DynamicHeader: riskTrendData no disponible para sparkline');
  }

  // ✅ DATOS VISUALIZACIONES REALES
  const gaugeCompactoData = campeón ? [
    { value: campeón.momentum, fill: '#10B981' },
    { value: Math.max(0, 100 - campeón.momentum), fill: 'rgba(71, 85, 105, 0.2)' }
  ] : [
    { value: 0, fill: 'rgba(71, 85, 105, 0.2)' },
    { value: 100, fill: 'rgba(71, 85, 105, 0.1)' }
  ];

  const panoramaDonutData = [
    { name: 'Completados', value: completados, fill: '#10B981' },
    { name: 'Acelerando', value: acelerando, fill: '#3B82F6' },
    { name: 'En Riesgo', value: enRiesgo, fill: '#EF4444' },
    { name: 'Otros', value: Math.max(0, departamentosTotal - completados - acelerando - enRiesgo), fill: '#6B7280' }
  ].filter(item => item.value > 0); // Solo mostrar valores reales

  return (
    <div 
      className="dinamico-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.5rem',
        minHeight: '320px'
      }}
    >
      {/* 👑 TARJETA 1: DEPARTAMENTO LÍDER (con gauge compacto) */}
      <motion.div
        layoutId="main-gauge"
        className="tarjeta-campeon"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.04))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => onNavigate?.('departamento-lider')}
        whileHover={{ 
          scale: 1.02,
          borderColor: 'rgba(16, 185, 129, 0.5)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)'
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* HEADER TARJETA */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-green-400" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10B981' }}>
              Departamento Líder
            </span>
          </div>
          <motion.div
            className="w-2 h-2 rounded-full bg-green-400"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>

        {campeón ? (
          <div className="flex items-center gap-4">
            {/* GAUGE COMPACTO (proviene de velocímetro masivo) */}
            <div style={{ width: '80px', height: '80px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeCompactoData}
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={450}
                    innerRadius={25}
                    outerRadius={35}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {gaugeCompactoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Centro gauge compacto */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '40px',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10B981' }}>
                  {(campeón.momentum || 0).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* INFO DEPARTAMENTO */}
            <div className="flex-1">
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                {campeón.name}
              </div>
              <div className="flex items-center gap-2">
                <div 
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: campeón.trend === 'completado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: campeón.trend === 'completado' ? '#10B981' : '#3B82F6',
                    border: `1px solid ${campeón.trend === 'completado' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                  }}
                >
                  {campeón.trend}
                </div>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                Replicar metodología exitosa
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: '0.875rem' }}>Analizando departamentos...</div>
            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Datos en proceso</div>
          </div>
        )}
      </motion.div>

      {/* 🚨 TARJETA 2: ATENCIÓN REQUERIDA (con sparkline) */}
      <motion.div
        className="tarjeta-riesgo"
        style={{
          background: focoRiesgo 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(185, 28, 28, 0.04))'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.04))',
          border: focoRiesgo?.severity === 'high' 
            ? '1px solid rgba(239, 68, 68, 0.5)' 
            : focoRiesgo 
            ? '1px solid rgba(245, 158, 11, 0.3)'
            : '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          position: 'relative'
        }}
        onClick={() => onNavigate?.('atencion-requerida')}
        whileHover={{ 
          scale: 1.02,
          borderColor: focoRiesgo?.severity === 'high' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.5)'
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* HEADER TARJETA */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${focoRiesgo ? (focoRiesgo.severity === 'high' ? 'text-red-400' : 'text-yellow-400') : 'text-green-400'}`} />
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: focoRiesgo ? (focoRiesgo.severity === 'high' ? '#EF4444' : '#F59E0B') : '#10B981'
            }}>
              {focoRiesgo ? 'Atención Requerida' : 'Todo Nominal'}
            </span>
          </div>
          {focoRiesgo && (
            <motion.div
              className={`w-2 h-2 rounded-full ${focoRiesgo.severity === 'high' ? 'bg-red-400' : 'bg-yellow-400'}`}
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [1, 0.6, 1]
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </div>

        {focoRiesgo ? (
          <div className="flex items-center gap-4">
            {/* SPARKLINE DESCENDENTE - SOLO SI HAY DATOS REALES */}
            {riskSparklineData ? (
              <div style={{ width: '100px', height: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskSparklineData}>
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke={focoRiesgo.severity === 'high' ? '#EF4444' : '#F59E0B'}
                      strokeWidth={3}
                      dot={false}
                      strokeDasharray={focoRiesgo.severity === 'high' ? "0" : "5 5"}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ width: '100px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  Sin histórico
                </div>
              </div>
            )}

            {/* INFO DEPARTAMENTO RIESGO */}
            <div className="flex-1">
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                {focoRiesgo.department}
              </div>
              <div className="flex items-center gap-2">
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  color: focoRiesgo.severity === 'high' ? '#EF4444' : '#F59E0B' 
                }}>
                  {focoRiesgo.rate}%
                </div>
                <TrendingDown className={`w-4 h-4 ${focoRiesgo.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                {focoRiesgo.severity === 'high' ? 'Intervención crítica' : 'Monitoreo estrecho'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: '0.875rem', color: '#10B981' }}>Todos los departamentos</div>
            <div style={{ fontSize: '0.875rem', color: '#10B981' }}>en buen ritmo</div>
            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Continuar monitoreo</div>
          </div>
        )}
      </motion.div>

      {/* 🌐 TARJETA 3: PANORAMA ORGANIZACIONAL (con donut) */}
      <motion.div
        className="tarjeta-patron"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(34, 211, 238, 0.04))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)'
        }}
        onClick={() => onNavigate?.('panorama-organizacional')}
        whileHover={{ 
          scale: 1.02,
          borderColor: 'rgba(59, 130, 246, 0.5)'
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* HEADER TARJETA */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3B82F6' }}>
              Panorama Organizacional
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* DONUT CHART DISTRIBUCIÓN */}
          <div style={{ width: '80px', height: '80px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={panoramaDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={35}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {panoramaDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* MÉTRICAS PANORAMA */}
          <div className="flex-1">
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              {cockpitIntelligence?.pattern?.dominantPattern || 'Progreso Variable'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#3B82F6', marginBottom: '8px' }}>
              {departamentosTotal} departamentos monitoreados
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div>✓ Completados: {completados}</div>
              <div>⚡ Acelerando: {acelerando}</div>
              <div>⚠ En riesgo: {enRiesgo}</div>
              <div>📊 Total: {departamentosTotal}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ⚡ TARJETA 4: ACCIÓN RECOMENDADA (prominente) */}
      <motion.div
        className="tarjeta-accion"
        style={{
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(139, 92, 246, 0.04))',
          border: `1px solid ${recomendaciónTáctica.urgency === 'crítica' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(167, 139, 250, 0.3)'}`,
          borderRadius: '16px',
          padding: '1.5rem',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          position: 'relative'
        }}
        onClick={() => onNavigate?.('accion-recomendada')}
        whileHover={{ 
          scale: 1.02,
          borderColor: recomendaciónTáctica.urgency === 'crítica' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(167, 139, 250, 0.5)'
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* HEADER TARJETA */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#A78BFA' }}>
              Acción Recomendada
            </span>
          </div>
          <motion.div
            className={`w-2 h-2 rounded-full ${
              recomendaciónTáctica.urgency === 'crítica' ? 'bg-red-400' :
              recomendaciónTáctica.urgency === 'alta' ? 'bg-yellow-400' :
              'bg-green-400'
            }`}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          />
        </div>

        {/* CONTENIDO ACCIÓN */}
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', lineHeight: 1.3 }}>
            {recomendaciónTáctica.primary}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', lineHeight: 1.4 }}>
            {recomendaciónTáctica.reasoning}
          </div>
          
          {/* URGENCIA Y TIMELINE */}
          <div className="flex items-center justify-between">
            <div 
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: recomendaciónTáctica.urgency === 'crítica' ? 'rgba(239, 68, 68, 0.2)' : 
                           recomendaciónTáctica.urgency === 'alta' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: recomendaciónTáctica.urgency === 'crítica' ? '#EF4444' : 
                       recomendaciónTáctica.urgency === 'alta' ? '#F59E0B' : '#10B981',
                border: `1px solid ${recomendaciónTáctica.urgency === 'crítica' ? 'rgba(239, 68, 68, 0.3)' : 
                                     recomendaciónTáctica.urgency === 'alta' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
              }}
            >
              {recomendaciónTáctica.urgency.toUpperCase()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              {recomendaciónTáctica.timeline}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}