// ====================================================================
// PÁGINA DE PRUEBA SIMPLE - SOLO IMPORT DEL COMPONENTE
// src/app/test-velocimetro/page.tsx
// ====================================================================

'use client';

import VelocimetroEngagement from '@/components/monitor/VelocimetroEngagement';

export default function TestVelocimetroPage() {
  
  // 🎯 DATOS DE PRUEBA REALISTAS
  const mockData = {
    participationRate: 72,
    participationPrediction: {
      finalProjection: 85,
      velocity: 5.2,
      riskLevel: 'medium' as const,
      confidence: 0.87
    },
    name: "Clima Organizacional Q3",
    type: "Experiencia Colaborador Full",
    daysRemaining: 12,
    totalInvited: 120,
    totalResponded: 89,
    alerts: [
      { type: 'warning', priority: 'medium', department: 'Marketing' },
      { type: 'warning', priority: 'high', department: 'Ventas' }
    ],
    topMovers: [
      { name: 'IT', momentum: 250, trend: 'acelerando' },
      { name: 'RRHH', momentum: 200, trend: 'completado' }
    ],
    departmentAnomalies: [
      { department: 'Marketing', severity: 'medium' }
    ],
    lastRefresh: new Date()
  };

  return (
    <div className="min-h-screen bg-slate-900">
      
      {/* Header simple */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white font-bold text-xl">
            FocalizaHR - Test Cabina de Mando v1.0
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Página de prueba para visualizar el VelocimetroEngagement
          </p>
        </div>
      </div>

      {/* Contenedor del componente */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Info de prueba */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h2 className="text-white font-semibold mb-2">📊 Datos de Prueba:</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-slate-300">
              <span className="text-slate-500">Participación:</span> {mockData.participationRate}%
            </div>
            <div className="text-slate-300">
              <span className="text-slate-500">Proyección:</span> {mockData.participationPrediction.finalProjection}%
            </div>
            <div className="text-slate-300">
              <span className="text-slate-500">Velocidad:</span> +{mockData.participationPrediction.velocity}/día
            </div>
            <div className="text-slate-300">
              <span className="text-slate-500">Riesgo:</span> {mockData.participationPrediction.riskLevel}
            </div>
          </div>
        </div>

        {/* COMPONENTE VELOCÍMETRO - IMPORTADO */}
        <VelocimetroEngagement
          participationRate={mockData.participationRate}
          participationPrediction={mockData.participationPrediction}
          name={mockData.name}
          type={mockData.type}
          daysRemaining={mockData.daysRemaining}
          totalInvited={mockData.totalInvited}
          totalResponded={mockData.totalResponded}
          alerts={mockData.alerts}
          topMovers={mockData.topMovers}
          departmentAnomalies={mockData.departmentAnomalies}
          lastRefresh={mockData.lastRefresh}
        />

        {/* Resto del contenido simulado */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Cards simulados para mostrar integración */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-semibold mb-4">📈 Componente 1</h3>
            <p className="text-slate-400 text-sm">
              Aquí iría otro componente del dashboard, 
              mostrando cómo el velocímetro se integra con el resto.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-semibold mb-4">🏢 Componente 2</h3>
            <p className="text-slate-400 text-sm">
              Ejemplo de cómo otros componentes 
              coexisten con la Cabina de Mando.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-semibold mb-4">🎯 Componente 3</h3>
            <p className="text-slate-400 text-sm">
              La cabina de mando es el protagonista 
              visual pero no interfiere con otros elementos.
            </p>
          </div>
        </div>

        {/* Notas de desarrollo */}
        <div className="mt-8 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <h3 className="text-blue-400 font-semibold mb-2">💡 Notas de Integración:</h3>
          <ul className="text-blue-300/80 text-sm space-y-1">
            <li>• El componente usa datos mock realistas para la demo</li>
            <li>• Las animaciones y efectos se cargan automáticamente</li>
            <li>• El diseño es completamente responsive</li>
            <li>• Sistema de alertas reacciona a los datos proporcionados</li>
            <li>• Listo para integrar en page.tsx real con datos del hook</li>
          </ul>
        </div>
      </div>
    </div>
  );
}