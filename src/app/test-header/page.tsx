'use client';

import React from 'react';

// ⚠️ AJUSTA ESTA RUTA según donde pongas HeaderExecutiveDashboard.tsx
// Si lo pones en src/components/monitor/:
// import HeaderExecutiveDashboard from '@/components/monitor/HeaderExecutiveDashboard';

// Si lo pones en la misma carpeta test-header/:
// import HeaderExecutiveDashboard from './HeaderExecutiveDashboard';

// Por ahora uso el componente inline para que funcione inmediatamente:

// Props interface
interface HeaderExecutiveDashboardProps {
  participationRate: number;
  dailyResponses: Array<{ date: string; responses: number; }>;
  daysRemaining: number;
  name: string;
  startDate: string;
  endDate: string;
  lastRefresh: Date;
  engagementHeatmap?: {
    totalEngagementScore: number;
    nextOptimalWindow: { hour: number; day: string; confidence: number; };
  };
  participationPrediction?: {
    finalProjection: number;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

const HeaderExecutiveDashboard: React.FC<HeaderExecutiveDashboardProps> = ({
  participationRate,
  dailyResponses,
  daysRemaining,
  name,
  startDate,
  endDate,
  lastRefresh,
  engagementHeatmap,
  participationPrediction
}) => {
  // ✅ CÁLCULOS USANDO DATOS EXISTENTES (sin modificar hook)
  const sparklineData = dailyResponses?.slice(-30) || []; // Últimos 30 días
  const maxResponses = sparklineData.length > 0 ? Math.max(...sparklineData.map(d => d.responses), 1) : 1;
  
  // SVG path para sparkline minimalista
  const createSparklinePath = () => {
    if (sparklineData.length < 2) return '';
    
    const width = 200;
    const height = 40;
    const points = sparklineData.map((point, index) => {
      const x = (index / (sparklineData.length - 1)) * width;
      const y = height - (point.responses / maxResponses) * height;
      return `${x},${y}`;
    });
    
    return `M${points.join('L')}`;
  };

  // Gauge circular path calculation
  const createGaugePath = (percentage: number) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return { strokeDasharray, strokeDashoffset };
  };

  const { strokeDasharray, strokeDashoffset } = createGaugePath(participationRate);

  // Tendencia y momentum calculation
  const recentTrend = sparklineData.length >= 7 
    ? sparklineData.slice(-7).reduce((sum, d) => sum + d.responses, 0) / 7 
    : 0;
  const previousTrend = sparklineData.length >= 14 
    ? sparklineData.slice(-14, -7).reduce((sum, d) => sum + d.responses, 0) / 7 
    : 0;
  const momentum = previousTrend > 0 ? ((recentTrend - previousTrend) / previousTrend) * 100 : 0;

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-2xl" 
         style={{ 
           background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.95) 100%)',
           backdropFilter: 'blur(20px)',
           border: '1px solid rgba(71, 85, 105, 0.3)'
         }}>
      
      {/* Background SVG Patterns - Organizational Vectors */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 400 128" className="absolute inset-0">
          <defs>
            <pattern id="org-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="#22D3EE" opacity="0.3"/>
              <line x1="10" y1="20" x2="30" y2="20" stroke="#22D3EE" strokeWidth="1" opacity="0.2"/>
              <line x1="20" y1="10" x2="20" y2="30" stroke="#A78BFA" strokeWidth="1" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#org-pattern)"/>
        </svg>
      </div>

      <div className="relative z-10 flex h-full items-center justify-between px-8">
        
        {/* LEFT SECTION - Participation Gauge (30%) */}
        <div className="flex w-[30%] items-center space-x-4">
          <div className="relative">
            <svg width="80" height="80" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="rgba(71, 85, 105, 0.3)"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="#22D3EE"
                strokeWidth="6"
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: '#22D3EE' }}>
                {participationRate}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Participación</p>
            <p className="text-xs text-white/60">{daysRemaining} días rest.</p>
          </div>
        </div>

        {/* CENTER SECTION - Sparkline & Context (40%) */}
        <div className="flex w-[40%] flex-col items-center space-y-2">
          <div className="relative">
            <svg width="200" height="40" className="overflow-visible">
              <path
                d={createSparklinePath()}
                stroke="#22D3EE"
                strokeWidth="2"
                fill="none"
                className="drop-shadow-sm"
              />
              {/* Gradient fill under line */}
              <defs>
                <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path
                d={`${createSparklinePath()}L200,40L0,40Z`}
                fill="url(#sparkline-gradient)"
              />
            </svg>
          </div>
          
          {/* Context overlay */}
          <div className="text-center">
            <p className="text-sm font-medium text-white">
              Tendencia: {momentum >= 0 ? '↗️' : '↘️'} {Math.abs(momentum).toFixed(1)}%
            </p>
            <p className="text-xs text-white/60">Últimos 30 días</p>
          </div>
        </div>

        {/* RIGHT SECTION - Projection & Confidence (30%) */}
        <div className="w-[30%] text-right">
          <div 
            className="rounded-lg p-4"
            style={{ 
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(71, 85, 105, 0.3)' 
            }}
          >
            {participationPrediction ? (
              <>
                <p className="text-lg font-bold text-white">
                  Proyección: {participationPrediction.finalProjection}%
                </p>
                <p className="text-sm" style={{ color: '#A78BFA' }}>
                  Confianza: {participationPrediction.confidence}%
                </p>
                <div className="mt-2">
                  <span 
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      participationPrediction.riskLevel === 'low' 
                        ? 'bg-green-900/50 text-green-300' 
                        : participationPrediction.riskLevel === 'medium'
                        ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-red-900/50 text-red-300'
                    }`}
                  >
                    {participationPrediction.riskLevel === 'low' ? 'Bajo Riesgo' : 
                     participationPrediction.riskLevel === 'medium' ? 'Riesgo Medio' : 'Alto Riesgo'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-white">
                  Meta: 80%
                </p>
                <p className="text-sm" style={{ color: '#A78BFA' }}>
                  En progreso...
                </p>
              </>
            )}
            
            {/* Alert crítico si necesario */}
            {engagementHeatmap && engagementHeatmap.totalEngagementScore < 50 && (
              <div className="mt-2 text-xs" style={{ color: '#F59E0B' }}>
                ⚠️ Engagement bajo detectado
              </div>
            )}
          </div>
          
          {/* Next optimal window */}
          {engagementHeatmap?.nextOptimalWindow && (
            <p className="mt-2 text-xs text-white/60">
              Próxima ventana: {engagementHeatmap.nextOptimalWindow.day} {engagementHeatmap.nextOptimalWindow.hour}:00
            </p>
          )}
        </div>
      </div>

      {/* Bottom overlay info */}
      <div className="absolute bottom-2 left-8 text-xs text-white/50">
        Actualizado: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
};

// Datos mock que simulan lo que viene del hook useCampaignMonitor
const mockData = {
  participationRate: 67,
  name: "Pulso Organizacional Q4",
  startDate: "2025-01-15",
  endDate: "2025-02-15", 
  daysRemaining: 8,
  lastRefresh: new Date(),
  
  // Datos sparkline últimos 30 días
  dailyResponses: [
    { date: "2025-01-15", responses: 5 },
    { date: "2025-01-16", responses: 8 },
    { date: "2025-01-17", responses: 12 },
    { date: "2025-01-18", responses: 7 },
    { date: "2025-01-19", responses: 15 },
    { date: "2025-01-20", responses: 10 },
    { date: "2025-01-21", responses: 18 },
    { date: "2025-01-22", responses: 14 },
    { date: "2025-01-23", responses: 22 },
    { date: "2025-01-24", responses: 16 },
    { date: "2025-01-25", responses: 25 },
    { date: "2025-01-26", responses: 19 },
    { date: "2025-01-27", responses: 28 },
    { date: "2025-01-28", responses: 21 },
    { date: "2025-01-29", responses: 31 },
    { date: "2025-01-30", responses: 24 },
    { date: "2025-01-31", responses: 35 },
    { date: "2025-02-01", responses: 27 },
    { date: "2025-02-02", responses: 38 },
    { date: "2025-02-03", responses: 30 },
    { date: "2025-02-04", responses: 42 },
    { date: "2025-02-05", responses: 33 },
    { date: "2025-02-06", responses: 45 },
    { date: "2025-02-07", responses: 36 },
    { date: "2025-02-08", responses: 48 },
    { date: "2025-02-09", responses: 39 },
    { date: "2025-02-10", responses: 52 },
    { date: "2025-02-11", responses: 41 },
    { date: "2025-02-12", responses: 55 },
    { date: "2025-02-13", responses: 44 }
  ],
  
  // Datos WOW opcionales (simulando lo que vendría del hook)
  engagementHeatmap: {
    totalEngagementScore: 78,
    nextOptimalWindow: { 
      hour: 10, 
      day: "Martes", 
      confidence: 84 
    }
  },
  
  participationPrediction: {
    finalProjection: 84,
    confidence: 87,
    riskLevel: 'low' as const
  }
};

export default function TestHeaderPage() {
  return (
    <div 
      className="min-h-screen p-8" 
      style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' 
      }}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Título para contexto */}
        <div className="text-center">
          <h1 
            className="text-4xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #22D3EE, #3B82F6, #A78BFA)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Header Executive Dashboard - Tesla Style
          </h1>
          <p className="text-white/60">
            Prueba visual del componente con datos mock simulando useCampaignMonitor
          </p>
        </div>

        {/* EL HEADER TESLA */}
        <HeaderExecutiveDashboard {...mockData} />
        
        {/* Info técnica para desarrollo */}
        <div 
          className="rounded-lg p-6 mt-8"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(71, 85, 105, 0.3)'
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            📊 Datos Utilizados (Mock)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-cyan-300 mb-2">Gauge Participación</h4>
              <ul className="text-white/70 space-y-1">
                <li>• Participación: {mockData.participationRate}%</li>
                <li>• Días restantes: {mockData.daysRemaining}</li>
                <li>• Última actualización: {mockData.lastRefresh.toLocaleTimeString()}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-cyan-300 mb-2">Sparkline Central</h4>
              <ul className="text-white/70 space-y-1">
                <li>• Últimos 30 días de respuestas</li>
                <li>• Tendencia calculada automáticamente</li>
                <li>• Gradiente SVG bajo la línea</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-cyan-300 mb-2">Proyección & Alertas</h4>
              <ul className="text-white/70 space-y-1">
                <li>• Proyección: {mockData.participationPrediction?.finalProjection}%</li>
                <li>• Confianza: {mockData.participationPrediction?.confidence}%</li>
                <li>• Riesgo: {mockData.participationPrediction?.riskLevel}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Variaciones para testing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            🎛️ Variaciones para Testing
          </h3>
          
          {/* Header con participación alta */}
          <div>
            <h4 className="text-sm text-cyan-300 mb-2">Participación Alta (92%)</h4>
            <HeaderExecutiveDashboard 
              {...mockData} 
              participationRate={92}
              participationPrediction={{
                finalProjection: 96,
                confidence: 93,
                riskLevel: 'low'
              }}
            />
          </div>
          
          {/* Header con participación crítica */}
          <div>
            <h4 className="text-sm text-red-300 mb-2">Participación Crítica (34%)</h4>
            <HeaderExecutiveDashboard 
              {...mockData} 
              participationRate={34}
              participationPrediction={{
                finalProjection: 42,
                confidence: 65,
                riskLevel: 'high'
              }}
              engagementHeatmap={{
                totalEngagementScore: 25,
                nextOptimalWindow: { hour: 14, day: "Viernes", confidence: 52 }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}