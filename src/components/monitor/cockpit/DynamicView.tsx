// ====================================================================
// DYNAMIC VIEW - VISTA TIEMPO REAL CON MOMENTUM GAUGE
// src/components/monitor/cockpit/DynamicView.tsx
// RESPONSABILIDAD: Vista presente con gauge momentum integrado
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { Eye, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { useDeviceType, getDeviceAnimationConfig } from './ResponsiveEnhancements';
import { CockpitIntelligence } from '@/lib/utils/cockpit-intelligence';
import { MomentumGauge } from './MomentumGauge';

// 🎯 INTERFACES
interface DynamicViewProps {
  topMovers?: Array<{
    name: string;
    momentum: number;
    trend: 'completado' | 'acelerando' | 'estable' | 'desacelerando';
  }>;
  negativeAnomalies?: Array<{
    department: string;
    rate: number;
    severity: 'high' | 'medium';
    zScore: number;
  }>;
  participationRate: number;
  intelligence: CockpitIntelligence;
  isTransitioning?: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  onNavigate?: (sectionId: string) => void;
}

interface DynamicCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color: 'cyan' | 'purple' | 'amber' | 'green' | 'red';
  icon: React.ReactNode;
  badge?: { text: string; color: string };
  description?: string;
  onClick?: () => void;
  customContent?: React.ReactNode; // Para contenido personalizado como el gauge
}

// 🎯 COMPONENTE CARD DINÁMICO
function DynamicCard({ 
  title, 
  value, 
  subtitle, 
  color, 
  icon, 
  badge, 
  description, 
  onClick,
  customContent 
}: DynamicCardProps) {
  const deviceType = useDeviceType();
  
  const cardClass = `
    fhr-card fhr-card-metric cursor-pointer group relative fhr-card-interactive
    transition-all duration-300 ease-out
    hover:bg-black/40 hover:border-${color}-500/50 
    hover:shadow-lg hover:shadow-${color}-500/20
    hover:translate-y-[-4px] active:translate-y-[-2px]
    ${deviceType === 'mobile' ? 'hover-disabled active:scale-95' : ''}
  `;

  return (
    <motion.div
      className={cardClass}
      variants={getDeviceAnimationConfig(deviceType)?.card || {}}
      onClick={onClick}
      whileHover={deviceType !== 'mobile' ? { scale: 1.02, y: -4 } : {}}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full bg-${color}-400`}></div>
          <h3 className="text-sm text-white/80 group-hover:text-white transition-colors">
            {title}
          </h3>
        </div>
        <div className="text-white/60 group-hover:text-white/80 transition-colors">
          {icon}
        </div>
      </div>
      
      {/* Value */}
      <div className={`text-2xl font-bold mb-2 ${
        color === 'cyan' ? 'text-cyan-300' : 
        color.includes('purple') ? 'text-purple-300' :
        color.includes('amber') ? 'text-amber-300' :
        color.includes('green') ? 'text-green-300' :
        color.includes('red') ? 'text-red-300' : 'text-white'
      }`}>
        {value}
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <p className="text-white/80 font-medium mb-2">{subtitle}</p>
      )}
      
      {/* Badge */}
      {badge && (
        <div className={`inline-block px-2 py-1 text-xs rounded-full mb-3 ${badge.color}`}>
          {badge.text}
        </div>
      )}
      
      {/* Description opcional */}
      {description && (
        <p className="text-white/60 text-sm leading-relaxed">{description}</p>
      )}
      
      {/* Contenido personalizado (como gauge) */}
      {customContent && (
        <div className="mt-3">
          {customContent}
        </div>
      )}
      
      {/* Efecto de navegación hover */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Eye className="w-4 h-4 text-white/40" />
      </div>
    </motion.div>
  );
}

// 🎯 COMPONENTE PRINCIPAL
export function DynamicView({ 
  topMovers = [],
  negativeAnomalies = [],
  participationRate,
  intelligence,
  isTransitioning,
  deviceType,
  onNavigate
}: DynamicViewProps) {

  // ✅ deviceType ya viene como prop - no llamar hook aquí
  
  // ✅ USAR SOLO DATOS YA CALCULADOS - NO RECALCULAR
  const { pattern, action } = intelligence;
  
  // 🎯 ANÁLISIS INTELIGENTE DE DATOS REALES - SOLO FORMATEO
  const campeón = topMovers.length > 0 ? topMovers[0] : null;
  const focoRiesgo = negativeAnomalies.length > 0 ? negativeAnomalies[0] : null;
  
  // Formatear foco de riesgo
  const riesgoInfo = focoRiesgo 
    ? `${focoRiesgo.department} (${focoRiesgo.rate}%)`
    : 'Sin anomalías críticas';
  
  // Determinar badge del campeón
  const campeónBadge = campeón ? {
    text: campeón.trend === 'completado' ? 'Completado' :
          campeón.trend === 'acelerando' ? 'Acelerando' :
          campeón.trend === 'desacelerando' ? 'Desacelerando' : 'Estable',
    color: campeón.trend === 'completado' ? 'bg-green-500/20 text-green-300' :
           campeón.trend === 'acelerando' ? 'bg-cyan-500/20 text-cyan-300' :
           campeón.trend === 'desacelerando' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'
  } : undefined;
  
  // Determinar badge de riesgo
  const riesgoBadge = focoRiesgo ? {
    text: focoRiesgo.severity === 'high' ? 'Crítico' : 'Moderado',
    color: focoRiesgo.severity === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
  } : undefined;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 🏆 TARJETA 1: CAMPEÓN MOMENTUM CON GAUGE INTEGRADO */}
        <DynamicCard
          title="Campeón Momentum"
          value={campeón ? campeón.name : 'Sin datos'}
          subtitle={campeón ? '' : 'Calculando momentum...'}
          color="cyan"
          icon={<TrendingUp className="w-5 h-5" />}
          badge={campeónBadge}
          onClick={() => onNavigate?.('topmovers')}
          customContent={
            campeón ? (
              <div className="mt-4 flex justify-center">
                <MomentumGauge
                  momentum={campeón.momentum}
                  trend={campeón.trend}
                  departmentName={campeón.name}
                  size="md"
                />
              </div>
            ) : null
          }
        />

        {/* ⚠️ TARJETA 2: FOCO DE RIESGO */}
        <DynamicCard
          title="Foco de Riesgo"
          value={focoRiesgo ? focoRiesgo.department : 'Sin riesgos'}
          subtitle={focoRiesgo ? `${focoRiesgo.rate}% participación` : 'Todos los departamentos estables'}
          color={focoRiesgo ? 'red' : 'green'}
          icon={<AlertTriangle className="w-5 h-5" />}
          badge={riesgoBadge}
          description={focoRiesgo ? 'Requiere atención inmediata' : undefined}
          onClick={() => onNavigate?.('anomalies')}
        />

        {/* 📊 TARJETA 3: ANÁLISIS EN VIVO */}
        <DynamicCard
          title="Análisis en Vivo"
          value={`${participationRate}%`}
          subtitle="Participación actual"
          color="purple"
          icon={<Activity className="w-5 h-5" />}
          description={pattern.description}
          onClick={() => onNavigate?.('live')}
        />

        {/* 🎯 TARJETA 4: PATRÓN DOMINANTE */}
        <DynamicCard
          title="Patrón Dominante"
          value={pattern.dominantPattern}
          subtitle="Comportamiento organizacional"
          color={pattern.patternColor as any || 'amber'}
          icon={<TrendingUp className="w-5 h-5" />}
          description="Patrón detectado automáticamente"
          onClick={() => onNavigate?.('patterns')}
        />

      </div>
    </motion.div>
  );
}