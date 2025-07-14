// src/app/dashboard/campaigns/[id]/results/page.tsx
// FASE 2: Orquestación Final - Modificación page.tsx usando hook existente

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCampaignResults } from '@/hooks/useCampaignResults';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// ✅ IMPORTAR COMPONENTES ENSAMBLADOS
import ResultsPageHeader from '@/components/dashboard/ResultsPageHeader';
import PulseIndicatorGrid from '@/components/dashboard/PulseIndicatorGrid';
import ComparativeAnalysis from '@/components/dashboard/ComparativeAnalysis';
import KitComunicacionComponent from '@/components/dashboard/KitComunicacionComponent';
import ParticipantList from '@/components/dashboard/ParticipantList';

export default function CampaignResultsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  // ✅ USAR HOOK EXISTENTE COMO ÚNICA FUENTE DE VERDAD
  const { data, isLoading, error, refreshData } = useCampaignResults(campaignId);

  // Handler para volver al dashboard
  const handleBack = () => {
    router.push('/dashboard');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Cargando resultados de la campaña...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-xl">!</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar resultados</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Dashboard
                  </Button>
                  <Button onClick={refreshData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Data not available
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-600 text-xl">?</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos disponibles</h3>
                <p className="text-gray-600 mb-4">No se encontraron resultados para esta campaña.</p>
                <Button onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ✅ ORQUESTACIÓN FINAL - TODOS LOS COMPONENTES ENSAMBLADOS
  return (
    <div className="min-h-screen bg-gray-50">
      {/* PASO 3.1: Header con DashboardNavigation integrado */}
      <ResultsPageHeader 
        campaign={data.campaign}
        stats={data.stats}
        onBack={handleBack}
      />

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* PASO 3.2: Indicadores de Pulso con Sparklines */}
        <PulseIndicatorGrid 
          stats={data.stats}
          analytics={data.analytics || {}}
        />

        {/* PASO 3.3: Análisis Comparativo con Gráficos */}
        <ComparativeAnalysis 
          analytics={{
            ...data.analytics,
            participationRate: data.stats.participationRate,
            averageScore: data.stats.averageScore
          }}
        />

        {/* PASO 3.4: Kit de Comunicación - Props corregidos */}
        {data.campaign && data.stats && (
          <KitComunicacionComponent 
            campaignId={data.campaign.id}
            campaignResults={{
              overall_score: data.stats.averageScore || 0,
              participation_rate: data.stats.participationRate || 0,
              total_responses: data.stats.totalResponded || 0,
              total_invited: data.stats.totalInvited || 0,
              company_name: data.campaign.company?.name || 'Empresa',
              industry_benchmark: 3.2,
              category_scores: data.analytics?.categoryScores || {
                liderazgo: 0,
                ambiente: 0,
                desarrollo: 0,
                bienestar: 0
              }
            }}
          />
        )}

        {/* PASO 3.5: Lista de Participantes con API paginada */}
        <ParticipantList 
          campaignId={campaignId}
        />

        {/* Footer con acciones adicionales */}
        <div className="flex justify-center py-8">
          <div className="flex gap-4">
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar Datos
            </Button>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}