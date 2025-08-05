// ====================================================================
// PÁGINA DE PRUEBA COMPLETA - COCKPIT HEADER TESLA
// src/app/test-cockpit/page.tsx
// ====================================================================

'use client';

import CockpitHeader from '@/components/monitor/CockpitHeader';

export default function TestCockpitPage() {
  
  // 🎯 DATOS DE PRUEBA REALISTAS (estructura monitorData completa)
  const mockMonitorData = {
    // Datos básicos
    isLoading: false,
    id: "test-campaign-123",
    name: "Clima Organizacional Q3 2024",
    type: "Experiencia Colaborador Full",
    status: "active",
    participationRate: 72,
    totalInvited: 150,
    totalResponded: 108,
    daysRemaining: 12,
    lastActivity: "Última actividad hace 23 min",
    startDate: "2024-08-01",
    endDate: "2024-08-20",
    lastRefresh: new Date(),
    
    // Datos departamentales
    byDepartment: {
      "Marketing": { invited: 25, responded: 18, rate: 72 },
      "IT": { invited: 30, responded: 28, rate: 93 },
      "RRHH": { invited: 20, responded: 14, rate: 70 },
      "Ventas": { invited: 35, responded: 22, rate: 63 },
      "Finanzas": { invited: 40, responded: 26, rate: 65 }
    },
    
    // Datos temporales
    dailyResponses: [
      { day: "Lun", responses: 12, date: "2024-08-12" },
      { day: "Mar", responses: 18, date: "2024-08-13" },
      { day: "Mié", responses: 15, date: "2024-08-14" },
      { day: "Jue", responses: 22, date: "2024-08-15" },
      { day: "Vie", responses: 19, date: "2024-08-16" }
    ],
    
    // Alertas del sistema
    alerts: [
      { 
        id: "alert-1", 
        type: "warning", 
        priority: "high", 
        department: "Ventas",
        message: "Baja participación en Ventas (63%)",
        timestamp: "14:30"
      },
      { 
        id: "alert-2", 
        type: "warning", 
        priority: "medium", 
        department: "Finanzas",
        message: "Participación Finanzas por debajo del objetivo",
        timestamp: "13:45"
      }
    ],
    
    // Actividad reciente
    recentActivity: [
      { id: "1", dept: "IT", participant: "Ana García", timestamp: "14:23", status: "completed", action: "Encuesta completada" },
      { id: "2", dept: "Marketing", participant: "Carlos López", timestamp: "14:15", status: "completed", action: "Encuesta completada" },
      { id: "3", dept: "RRHH", participant: "María Rodríguez", timestamp: "13:58", status: "completed", action: "Encuesta completada" }
    ],
    
    // 🔥 DATOS PARA COMPONENTES WOW
    participationPrediction: {
      finalProjection: 85,
      velocity: 5.2,
      riskLevel: 'medium' as const,
      confidence: 0.87,
      recommendedActions: [
        { action: "Enviar recordatorio a Ventas", impact: 8 },
        { action: "Comunicar avance general", impact: 5 }
      ]
    },
    
    departmentAnomalies: [
      {
        department: "IT",
        currentRate: 93,
        zScore: 2.1,
        type: 'positive_outlier' as const,
        severity: 'medium' as const
      },
      {
        department: "Ventas", 
        currentRate: 63,
        zScore: -1.8,
        type: 'negative_outlier' as const,
        severity: 'high' as const
      }
    ],
    
    positiveAnomalies: [
      {
        department: "IT",
        currentRate: 93,
        zScore: 2.1,
        type: 'positive_outlier' as const,
        severity: 'medium' as const
      }
    ],
    
    negativeAnomalies: [
      {
        department: "Ventas",
        currentRate: 63, 
        zScore: -1.8,
        type: 'negative_outlier' as const,
        severity: 'high' as const
      }
    ],
    
    meanRate: 72.6,
    totalDepartments: 5,
    
    topMovers: [
      { name: "IT", momentum: 250, trend: "acelerando" },
      { name: "Marketing", momentum: 180, trend: "estable" },
      { name: "RRHH", momentum: 160, trend: "completado" },
      { name: "Finanzas", momentum: 120, trend: "desacelerando" },
      { name: "Ventas", momentum: 90, trend: "desacelerando" }
    ],
    
    // Datos adicionales requeridos por la interface
    engagementHeatmap: {
      hourlyData: [
        { hour: 9, count: 12, intensity: 0.8 },
        { hour: 10, count: 18, intensity: 1.0 },
        { hour: 11, count: 15, intensity: 0.9 }
      ],
      recommendations: [
        { message: "Óptimo enviar recordatorios entre 9-11 AM", confidence: 0.85 }
      ],
      nextOptimalWindow: { hour: 10, day: "martes", confidence: 0.9 },
      totalEngagementScore: 7.8,
      maxHour: 10,
      maxActivity: 18,
      totalActivity: 45,
      hourBars: []
    },
    
    departmentalIntelligence: {
      departments: [],
      insights: [],
      recommendations: [],
      riskMatrix: [],
      lastAnalysis: new Date()
    },
    
    crossStudyComparison: undefined,
    
    // Handlers (mock functions para prueba)
    handleRefresh: () => console.log('Refresh triggered'),
    handleSendReminder: () => console.log('Reminder sent'),
    handleSendDepartmentReminder: (dept: string) => console.log(`Department reminder sent to ${dept}`)
  };

  // 📱 HANDLER SCROLL TO SECTION
  const handleScrollToSection = (section: 'anomalies' | 'departments' | 'predictions') => {
    console.log(`Scrolling to section: ${section}`);
    // En la implementación real, esto haría scroll suave al componente correspondiente
  };

  return (
    <div className="min-h-screen bg-slate-900">
      
      {/* Header navegación */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-white font-bold text-xl">FocalizaHR</div>
            <div className="text-slate-400 text-sm">/ Test Cockpit Header Tesla</div>
          </div>
          <div className="text-slate-400 text-sm">
            Directriz Maestra v1.0 - Cabina de Mando
          </div>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Info técnica */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              🎯 Velocímetro Tesla
            </h3>
            <div className="text-slate-300 text-sm space-y-1">
              <div>Participación: {mockMonitorData.participationRate}%</div>
              <div>Proyección: {mockMonitorData.participationPrediction.finalProjection}%</div>
              <div>Momentum: +{(mockMonitorData.participationPrediction.finalProjection - mockMonitorData.participationRate).toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              🚨 Sistema Alertas
            </h3>
            <div className="text-slate-300 text-sm space-y-1">
              <div>Anomalías: {mockMonitorData.departmentAnomalies.length}</div>
              <div>Alertas críticas: {mockMonitorData.alerts.filter(a => a.priority === 'high').length}</div>
              <div>Advertencias: {mockMonitorData.alerts.filter(a => a.priority === 'medium').length}</div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              📱 HUD Contextual
            </h3>
            <div className="text-slate-300 text-sm space-y-1">
              <div>Campaña: {mockMonitorData.name}</div>
              <div>Días restantes: {mockMonitorData.daysRemaining}</div>
              <div>Respuestas: {mockMonitorData.totalResponded}/{mockMonitorData.totalInvited}</div>
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        /* COCKPIT HEADER TESLA - COMPONENTE PRINCIPAL */}
        {/* ====================================================================== */}
        <CockpitHeader 
          monitorData={mockMonitorData}
          onScrollToSection={handleScrollToSection}
        />

        {/* Componentes simulados debajo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              📊 Componente Anomalías
            </h3>
            <p className="text-slate-400 text-sm">
              Al hacer clic en el icono de alertas rojas del Cockpit Header, 
              se haría scroll suave hasta este componente.
            </p>
            <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="text-red-400 text-sm">
                🚨 Anomalía detectada: IT supera promedio por +20.4%
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              🏢 Componente Departamentos
            </h3>
            <p className="text-slate-400 text-sm">
              Al hacer clic en el icono naranja del Cockpit Header, 
              se haría scroll hasta este componente de análisis departamental.
            </p>
            <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <div className="text-orange-400 text-sm">
                🎯 Foco: Ventas requiere intervención inmediata (63%)
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              📈 Componente Predicciones
            </h3>
            <p className="text-slate-400 text-sm">
              Al hacer clic en el icono amarillo del Cockpit Header,
              se haría scroll hasta este componente de análisis predictivo.
            </p>
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <div className="text-yellow-400 text-sm">
                ⚡ Proyección: 85% final con 87% confianza estadística
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              🎮 Controles de Prueba
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Prueba la interacción con los elementos del Cockpit Header:
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => handleScrollToSection('anomalies')}
                className="w-full text-left px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm hover:bg-red-500/20 transition-colors"
              >
                🚨 Simular clic icono Anomalías
              </button>
              <button 
                onClick={() => handleScrollToSection('departments')}
                className="w-full text-left px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded text-orange-400 text-sm hover:bg-orange-500/20 transition-colors"
              >
                🎯 Simular clic icono Departamentos
              </button>
              <button 
                onClick={() => handleScrollToSection('predictions')}
                className="w-full text-left px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 text-sm hover:bg-yellow-500/20 transition-colors"
              >
                ⚡ Simular clic icono Predicciones
              </button>
            </div>
          </div>
        </div>

        {/* Notas de implementación */}
        <div className="mt-8 p-6 bg-blue-500/5 rounded-xl border border-blue-500/20">
          <h3 className="text-blue-400 font-semibold mb-4">💡 Notas de Implementación Tesla</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="text-blue-300 font-medium mb-2">✅ Implementado según Directriz:</h4>
              <ul className="text-blue-200/80 space-y-1">
                <li>• Recharts para velocímetro con RadialBarChart</li>
                <li>• Framer Motion para animaciones Tesla</li>
                <li>• Glassmorphism con gradientes corporativos</li>
                <li>• Sistema alertas que se "encienden" dinámicamente</li>
                <li>• HUD minimalista en esquinas</li>
                <li>• Componente 100% "tonto" - solo recibe props</li>
              </ul>
            </div>
            <div>
              <h4 className="text-blue-300 font-medium mb-2">🎯 Características Tesla:</h4>
              <ul className="text-blue-200/80 space-y-1">
                <li>• Foco absoluto: Velocímetro protagonista</li>
                <li>• Minimalismo funcional: Sin decoración</li>
                <li>• Narrativa intuitiva: Metáfora cabina coherente</li>
                <li>• Estética nueva era: Neural glows contextuales</li>
                <li>• UX instantánea: Decisiones en segundos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// INTEGRACIÓN EN MONITOR REAL
// src/app/dashboard/campaigns/[id]/monitor/page.tsx  
// ====================================================================

/*
PASO 1: IMPORTAR EL COCKPIT HEADER
*/
//import CockpitHeader from '@/components/monitor/CockpitHeader';

/*
PASO 2: REEMPLAZAR HEADER ACTUAL
*/

// ANTES:
// <CampaignMonitorHeader {...monitorData} router={router} />

// DESPUÉS:
// <CockpitHeader 
//   monitorData={monitorData}
//   onScrollToSection={handleScrollToSection}
// />

/*
PASO 3: AGREGAR HANDLER SCROLL
*/
const handleScrollToSection = (section: 'anomalies' | 'departments' | 'predictions') => {
  const elementMap = {
    anomalies: 'anomaly-detector-panel',
    departments: 'department-pulse-panel', 
    predictions: 'participation-predictor-card'
  };
  
  const element = document.getElementById(elementMap[section]);
  element?.scrollIntoView({ 
    behavior: 'smooth',
    block: 'start'
  });
};

/*
PASO 4: AGREGAR IDs A COMPONENTES DESTINO
*/
// En los componentes correspondientes agregar:
// <div id="anomaly-detector-panel">
//   <AnomalyDetectorPanel ... />
// </div>

// <div id="department-pulse-panel">
//   <DepartmentPulsePanel ... />
// </div>

// <div id="participation-predictor-card">
//   <ParticipationPredictorCard ... />
// </div>

/*
PASO 5: INSTALAR DEPENDENCIAS NECESARIAS
*/
// npm install recharts framer-motion
// (Si no están ya instaladas)

/*
RESULTADO ESPERADO:
✅ Header Tesla revolucionario funcionando
✅ Velocímetro Recharts con datos reales
✅ Sistema alertas inteligente interactivo
✅ HUD contextual minimalista
✅ Animaciones Framer Motion fluidas
✅ Navegación por scroll suave a secciones
✅ Experiencia "pilotear una misión" lograda
*/