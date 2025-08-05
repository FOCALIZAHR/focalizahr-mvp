import React from 'react';
import HeaderExecutiveDashboard from './HeaderExecutiveDashboard';

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

const TestHeaderPage: React.FC = () => {
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

        {/* Instrucciones integración */}
        <div 
          className="rounded-lg p-6"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          <h3 className="text-lg font-semibold text-green-300 mb-3">
            ✅ Cómo Integrar en CampaignMonitorPage
          </h3>
          <pre className="text-green-200 text-sm overflow-x-auto">
{`// En src/app/dashboard/campaigns/[id]/monitor/page.tsx
import HeaderExecutiveDashboard from '@/components/monitor/HeaderExecutiveDashboard';

export default function CampaignMonitorPage() {
  const monitorData = useCampaignMonitor(campaignId);
  
  return (
    <div className="space-y-6">
      {/* REEMPLAZAR header actual con: */}
      <HeaderExecutiveDashboard 
        participationRate={monitorData.participationRate}
        dailyResponses={monitorData.dailyResponses}
        daysRemaining={monitorData.daysRemaining}
        name={monitorData.name}
        startDate={monitorData.startDate}
        endDate={monitorData.endDate}
        lastRefresh={monitorData.lastRefresh}
        engagementHeatmap={monitorData.engagementHeatmap}
        participationPrediction={monitorData.participationPrediction}
      />
      
      {/* Resto de componentes existentes */}
    </div>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestHeaderPage;
