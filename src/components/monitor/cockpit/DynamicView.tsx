"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, AlertTriangle, Users, Target } from 'lucide-react';
import { 
  DonutChart, 
  ProgressCircle, 
  SparkAreaChart,
  Metric,
  Text,
  Flex,
  BadgeDelta
} from '@tremor/react';

interface DynamicViewProps {
  cockpitIntelligence?: {
    champion?: {
      name: string;
      momentum: number;
      trend: string;
    };
    risk?: {
      department: string;
      participation: number;
      benchmark: number;
      severity: 'crítica' | 'media' | 'baja';
      trend?: number[];
    };
    stats?: {
      completedDepartments: number;
      acceleratingDepartments: number;
      riskDepartments: number;
    };
    pattern?: {
      dominantPattern: string;
    };
    action?: {
      title: string;
      description: string;
      urgency: 'crítica' | 'media' | 'baja';
    };
  };
  onNavigate?: (section: string) => void;
}

export const DynamicView: React.FC<DynamicViewProps> = ({ 
  cockpitIntelligence, 
  onNavigate 
}) => {
  const campeón = cockpitIntelligence?.champion;
  const focoRiesgo = cockpitIntelligence?.risk;
  const completados = cockpitIntelligence?.stats?.completedDepartments || 0;
  const acelerando = cockpitIntelligence?.stats?.acceleratingDepartments || 0;
  const enRiesgo = cockpitIntelligence?.stats?.riskDepartments || 0;
  const departamentosTotal = completados + acelerando + enRiesgo;

  const riskTrendData = focoRiesgo?.trend?.map((value, index) => ({
    day: `Día ${index + 1}`,
    riesgo: value
  })) || [];

  const panoramaData = [
    { name: 'Completados', value: completados },
    { name: 'Acelerando', value: acelerando },
    { name: 'En Riesgo', value: enRiesgo }
  ].filter(item => item.value > 0);

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
            <div style={{ width: '80px', height: '80px' }}>
              <ProgressCircle 
                value={campeón.momentum} 
                size="lg"
                color="emerald"
                className="flex-shrink-0"
              >
                <Text className="text-xs text-white font-medium">
                  {campeón.momentum}%
                </Text>
              </ProgressCircle>
            </div>

            <div className="flex-1">
              <Metric className="text-white mb-2">{campeón.name}</Metric>
              <Text className="text-green-400 text-sm mb-1">
                Lidera con {campeón.momentum}% participación
              </Text>
              <BadgeDelta 
                deltaType="moderateIncrease" 
                size="xs"
                className="text-xs"
              >
                Tendencia {campeón.trend}
              </BadgeDelta>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20">
            <Text className="text-gray-400">Sin datos suficientes</Text>
          </div>
        )}
      </motion.div>

      <motion.div
        className="tarjeta-riesgo"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.04))',
          border: `1px solid ${focoRiesgo?.severity === 'crítica' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(251, 191, 36, 0.3)'}`,
          borderRadius: '16px',
          padding: '1.5rem',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          position: 'relative'
        }}
        onClick={() => onNavigate?.('atencion-requerida')}
        whileHover={{ 
          scale: 1.02,
          borderColor: focoRiesgo?.severity === 'crítica' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(251, 191, 36, 0.5)'
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${focoRiesgo?.severity === 'crítica' ? 'text-red-400' : 'text-amber-400'}`} />
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: focoRiesgo?.severity === 'crítica' ? '#EF4444' : '#F59E0B' 
            }}>
              Atención Requerida
            </span>
          </div>
        </div>

        {focoRiesgo ? (
          <div>
            <Metric className="text-white mb-2">{focoRiesgo.department}</Metric>
            <Text className="text-red-400 text-sm mb-3">
              {focoRiesgo.participation}% vs benchmark {focoRiesgo.benchmark}%
            </Text>
            
            {riskTrendData.length > 0 && (
              <div className="mb-3">
                <SparkAreaChart
                  data={riskTrendData}
                  categories={['riesgo']}
                  index="day"
                  colors={['red']}
                  className="h-10 w-full"
                />
              </div>
            )}
            
            <BadgeDelta 
              deltaType="decrease"
              size="xs"
            >
              Severidad: {focoRiesgo.severity}
            </BadgeDelta>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20">
            <Text className="text-gray-400">Sin anomalías detectadas</Text>
          </div>
        )}
      </motion.div>

      <motion.div
        className="tarjeta-panorama"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.04))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          position: 'relative'
        }}
        onClick={() => onNavigate?.('panorama-organizacional')}
        whileHover={{ 
          scale: 1.02,
          borderColor: 'rgba(59, 130, 246, 0.5)'
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3B82F6' }}>
              Panorama Organizacional
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div style={{ width: '100px', height: '100px' }}>
            <DonutChart
              data={panoramaData}
              category="value"
              index="name"
              colors={['emerald', 'blue', 'rose']}
              showLabel={false}
              showAnimation={true}
            />
          </div>

          <div className="flex-1">
            <Metric className="text-white mb-2">
              {cockpitIntelligence?.pattern?.dominantPattern || 'Progreso Variable'}
            </Metric>
            <Text className="text-blue-400 text-sm mb-2">
              {departamentosTotal} departamentos monitoreados
            </Text>
            
            <div className="space-y-1">
              <Flex className="text-xs">
                <Text className="text-emerald-400">✓ Completados</Text>
                <Text className="text-white font-medium">{completados}</Text>
              </Flex>
              <Flex className="text-xs">
                <Text className="text-blue-400">⚡ Acelerando</Text>
                <Text className="text-white font-medium">{acelerando}</Text>
              </Flex>
              <Flex className="text-xs">
                <Text className="text-red-400">⚠ En riesgo</Text>
                <Text className="text-white font-medium">{enRiesgo}</Text>
              </Flex>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="tarjeta-accion"
        style={{
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(139, 92, 246, 0.04))',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          position: 'relative'
        }}
        onClick={() => onNavigate?.('accion-recomendada')}
        whileHover={{ 
          scale: 1.02,
          borderColor: 'rgba(167, 139, 250, 0.5)'
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#A855F7' }}>
              Acción Recomendada
            </span>
          </div>
        </div>

        <div>
          <Metric className="text-white mb-2">
            {cockpitIntelligence?.action?.title || 'Analizar departamentos críticos'}
          </Metric>
          <Text className="text-purple-300 text-sm mb-3">
            {cockpitIntelligence?.action?.description || 'Revisar participación baja y tendencias negativas'}
          </Text>
          
          <BadgeDelta 
            deltaType={cockpitIntelligence?.action?.urgency === 'crítica' ? 'decrease' : 'moderateIncrease'}
            size="sm"
            className="text-xs"
          >
            Urgencia: {cockpitIntelligence?.action?.urgency || 'media'}
          </BadgeDelta>
          
          <Text className="text-xs text-purple-200 mt-2">
            Ejecutar en próximas 24-48 horas
          </Text>
        </div>
      </motion.div>

    </div>
  );
};