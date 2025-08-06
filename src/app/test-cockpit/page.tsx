// ====================================================================
// PÁGINA DE PRUEBA COMPLETA - COCKPIT HEADER TESLA
// src/app/test-cockpit/page.tsx
// ====================================================================

'use client';

import { CockpitHeader } from '@/components/monitor/CockpitHeader';

export default function TestCockpitPage() {
  
  // 🎯 DATOS DE PRUEBA REALISTAS (estructura monitorData completa)
  const mockMonitorData = {
    // Datos básicos
    isLoading: false,
    error: null,
    campaign: {
        id: "test-campaign-123",
        name: "Clima Organizacional Q3 2024",
        type: "Experiencia Colaborador Full",
        status: "active" as const,
    },
    participationRate: 72,
    totalInvited: 150,
    totalResponded: 108,
    daysRemaining: 12,
    lastRefresh: new Date(),
    
    // Inteligencia Predictiva y Departamental
    velocity: 5.2,
    participationPrediction: {
        finalProjection: 85,
        confidence: 87,
    },
    topMovers: [
        { name: 'Ventas', momentum: 250, trend: 'acelerando' as const },
        { name: 'IT', momentum: 220, trend: 'estable' as const },
    ],
    departmentAnomalies: [
        { name: 'Marketing', type: 'negative' as const, severity: 'high' as const, value: 45, zScore: -2.1 }
    ],
    alerts: [
        { id: "alert-1", type: "warning" as const, message: "Baja participación en Marketing" }
    ]
  };

  // Función mock para la navegación
  const handleScroll = (sectionId: string) => {
    console.log(`Navegando a la sección: ${sectionId}`);
  };

  return (
    <main className="min-h-screen bg-slate-900 p-8">
        <h1 className="fhr-title-gradient text-2xl mb-8">Página de Prueba - CockpitHeader</h1>
        <CockpitHeader
            // @ts-ignore - Usamos ignore para flexibilidad en el mock. En producción, los tipos deben coincidir perfectamente.
            monitorData={mockMonitorData}
            onScrollToSection={handleScroll}
        />
    </main>
  );
}