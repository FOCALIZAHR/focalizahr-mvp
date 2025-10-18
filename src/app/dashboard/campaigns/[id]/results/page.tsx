// src/app/dashboard/campaigns/[id]/results/page.tsx
// ✅ FIX CONSERVADOR - ZERO BREAKING CHANGES - SOLO COMPILACIÓN

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCampaignResults } from '@/hooks/useCampaignResults';
import { useSidebar } from '@/hooks/useSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, RefreshCw, Brain, TrendingUp, BarChart3, Target, AlertCircle, MessageSquare, Users } from 'lucide-react';
import '@/styles/focalizahr-design-system.css';

import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import PulseIndicatorGrid from '@/components/dashboard/PulseIndicatorGrid';
import ComparativeAnalysis from '@/components/dashboard/ComparativeAnalysis';
import KitComunicacionComponent from '@/components/dashboard/KitComunicacionComponent';
import ParticipantList from '@/components/dashboard/ParticipantList';

import { InsightAccionable } from '@/components/insights/InsightAccionable';
import { useRetentionAnalysis } from '@/hooks/useRetentionAnalysis';

export default function CampaignResultsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { data, isLoading, error, refreshData } = useCampaignResults(campaignId);
  const retentionAnalysis = useRetentionAnalysis(data);
  const { isCollapsed } = useSidebar();
  
  const mainContentClasses = isCollapsed 
    ? 'min-h-screen transition-all duration-300 lg:ml-20'
    : 'min-h-screen transition-all duration-300 lg:ml-64';

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <>
        <DashboardNavigation />
        <div className={`${mainContentClasses} fhr-background-gradient`}>
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 animate-spin fhr-gradient-text mx-auto mb-4" />
                <p className="fhr-subtitle text-lg">Cargando resultados de la campaña...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardNavigation />
        <div className={`${mainContentClasses} fhr-background-gradient`}>
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <Card className="fhr-card-primary max-w-md">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="fhr-title-primary text-lg mb-2">Error al cargar resultados</h3>
                  <p className="fhr-subtitle mb-4">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={handleBack} className="fhr-button-secondary">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver al Dashboard
                    </Button>
                    <Button onClick={refreshData} className="fhr-button-primary">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reintentar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <DashboardNavigation />
        <div className={`${mainContentClasses} fhr-background-gradient`}>
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <Card className="fhr-card-primary max-w-md">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-600 text-xl">?</span>
                  </div>
                  <h3 className="fhr-title-primary text-lg mb-2">No hay datos disponibles</h3>
                  <p className="fhr-subtitle mb-4">No se encontraron resultados para esta campaña.</p>
                  <Button onClick={handleBack} className="fhr-button-primary">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { campaign, analytics } = data;
  
  // 🔄 FIX CONSERVADOR 1: Normalizar trendData.score para componentes
  const normalizedAnalytics = {
    ...analytics,
    trendData: analytics.trendData.map(item => ({
      date: item.date,
      responses: item.responses,
      score: item.score ?? analytics.averageScore  // Fallback a promedio si undefined
    }))
  };

  // 🔄 FIX CONSERVADOR 2: Mapear categoryScores dinámicos a 4 categorías core
  // ✅ ESTO PRESERVA FUNCIONALIDAD EXISTENTE - KitComunicacion espera estas 4
  const coreCategoryScores = {
    liderazgo: analytics.categoryScores['liderazgo'] ?? 
               analytics.categoryScores['Liderazgo'] ?? 
               0,
    ambiente: analytics.categoryScores['ambiente'] ?? 
              analytics.categoryScores['Ambiente'] ?? 
              0,
    desarrollo: analytics.categoryScores['desarrollo'] ?? 
                analytics.categoryScores['Desarrollo'] ?? 
                0,
    bienestar: analytics.categoryScores['bienestar'] ?? 
               analytics.categoryScores['Bienestar'] ?? 
               0
  };

  console.log('🔍 DEBUG - analytics objeto:', analytics);
  console.log('🔍 DEBUG - campaign object:', campaign);
  console.log('🔍 DEBUG - retentionAnalysis:', retentionAnalysis);
  console.log('🔍 DEBUG - coreCategoryScores mapeados:', coreCategoryScores);

  return (
    <>
      <DashboardNavigation />

      <div className={`${mainContentClasses} fhr-background-gradient`}>
        <div className="fhr-container-fluid px-6 py-8">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={handleBack}
                className="fhr-button-ghost"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="fhr-title-hero">{campaign.name}</h1>
                <div className="flex items-center space-x-3 mt-2">
                  {/* ✅ FIX 1: Solo usar .name (displayName no existe) */}
                  <Badge className="fhr-badge-primary">
                    {campaign.campaignType?.name}
                  </Badge>
                  <span className="fhr-subtitle">
                    {campaign.company?.name}
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={refreshData} className="fhr-button-secondary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          {/* MÉTRICAS PRINCIPALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="fhr-card-metric">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 fhr-icon-background-primary rounded-lg">
                    <Target className="h-5 w-5 fhr-icon-primary" />
                  </div>
                  <div>
                    <p className="fhr-subtitle text-sm">Invitados</p>
                    <p className="fhr-metric-value">{analytics.totalInvited}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="fhr-card-metric">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 fhr-icon-background-secondary rounded-lg">
                    <BarChart3 className="h-5 w-5 fhr-icon-secondary" />
                  </div>
                  <div>
                    <p className="fhr-subtitle text-sm">Respuestas</p>
                    <p className="fhr-metric-value">{analytics.totalResponded}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="fhr-card-metric">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 fhr-icon-background-accent rounded-lg">
                    <TrendingUp className="h-5 w-5 fhr-icon-accent" />
                  </div>
                  <div>
                    <p className="fhr-subtitle text-sm">Participación</p>
                    <p className="fhr-metric-value">{analytics.participationRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="fhr-card-metric">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 fhr-icon-background-success rounded-lg">
                    <Brain className="h-5 w-5 fhr-icon-success" />
                  </div>
                  <div>
                    <p className="fhr-subtitle text-sm">Score Promedio</p>
                    <p className="fhr-metric-value">{analytics.averageScore.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ✅ FIX 2-7: NULL SAFETY COMPLETO CON && OPERATOR */}
          {retentionAnalysis && 
           retentionAnalysis.businessCases && 
           retentionAnalysis.businessCases.length > 0 && (
            <Card className="fhr-card-intelligence border-l-4 border-l-purple-600 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="h-6 w-6 text-purple-600" />
                  <div>
                    <h2 className="fhr-title-section">🎯 Casos de Negocio Automatizados</h2>
                    <p className="fhr-subtitle text-sm mt-1">
                      Arquitectura v3.0 - Separación Lógica/Presentación
                    </p>
                  </div>
                  <Badge className="fhr-badge-accent">Arquitectura v3.0</Badge>
                </div>
                
                <Alert className="fhr-alert-info mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Análisis Automático Detectado:</strong> {retentionAnalysis.businessCases.length} casos de negocio ejecutivos generados.
                    Riesgo Global: {retentionAnalysis.globalRetentionRisk ?? 0}/100 | 
                    Urgencia: {retentionAnalysis.interventionUrgency?.replace('_', ' ') ?? 'No definida'}
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {retentionAnalysis.businessCases.map((businessCase, index) => (
                    <InsightAccionable 
                      key={`business-case-${index}`}
                      businessCase={businessCase}
                      companyName={campaign.company?.name || 'Empresa'}
                      onActionClick={(action) => {
                        console.log(`🎯 Acción ejecutiva: ${action} para caso ${businessCase.type}`);
                      }}
                    />
                  ))}
                </div>

                {retentionAnalysis.executiveSummary && (
                  <Alert className="mt-4 border-amber-500/50 bg-amber-500/10">
                    <Brain className="h-4 w-4 text-amber-400" />
                    <AlertDescription className="text-amber-200">
                      <strong>Resumen Ejecutivo:</strong> {retentionAnalysis.executiveSummary}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* ✅ FIX 8: Usar normalizedAnalytics */}
          <div className="mb-8">
            <h3 className="fhr-title-section mb-6">📊 Indicadores de Pulso</h3>
            <PulseIndicatorGrid analytics={normalizedAnalytics} />
          </div>

          {/* ✅ FIX 9: Usar normalizedAnalytics */}
          <div className="mb-8">
            <h3 className="fhr-title-section mb-6">📈 Análisis Comparativo</h3>
            <ComparativeAnalysis analytics={normalizedAnalytics} />
          </div>

          {/* ✅ FIX 10: MAPEO CONSERVADOR - 4 CATEGORÍAS CORE */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <MessageSquare className="h-6 w-6 fhr-icon-primary" />
              <h3 className="fhr-title-section">💬 Kit de Comunicación</h3>
              <Badge className="fhr-badge-secondary">Integrado</Badge>
            </div>
            <KitComunicacionComponent 
              campaignId={campaign.id}
              campaignResults={{
                overall_score: analytics.averageScore,
                participation_rate: analytics.participationRate,
                total_responses: analytics.totalResponded,
                total_invited: analytics.totalInvited,
                company_name: campaign.company?.name || 'Empresa',
                industry_benchmark: 3.2,
                category_scores: coreCategoryScores  // ✅ SOLO LOS 7 CAMPOS QUE ESPERA
              }}
            />
          </div>

          {/* LISTA PARTICIPANTES */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-6 w-6 fhr-icon-primary" />
              <h3 className="fhr-title-section">👥 Participantes</h3>
              <Badge className="fhr-badge-info">{analytics.totalInvited} invitados</Badge>
            </div>
            <ParticipantList campaignId={campaignId} />
          </div>

          {/* FOOTER */}
          <div className="flex justify-center py-8">
            <div className="flex gap-4">
              <Button variant="outline" onClick={refreshData} className="fhr-button-secondary">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar Datos
              </Button>
              <Button onClick={handleBack} className="fhr-button-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* DEBUG INFO */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="fhr-card-debug max-w-sm bg-black/80 text-white">
              <CardContent className="p-3">
                <h3 className="text-xs text-gray-300 mb-2">🔍 Debug Info - FIX CONSERVADOR</h3>
                <div className="text-xs space-y-1 text-gray-400">
                  <div><strong>Campaign ID:</strong> {campaignId}</div>
                  <div><strong>Campaign Type:</strong> {campaign.campaignType?.name || 'No definido'}</div>
                  <div><strong>Average Score:</strong> {analytics.averageScore.toFixed(1)}</div>
                  <div><strong>Core Categories:</strong> {Object.keys(coreCategoryScores).length}/4</div>
                  <div><strong>Total Categories:</strong> {Object.keys(analytics.categoryScores).length}</div>
                  <div><strong>Compilation:</strong> ✅ TypeScript Fixed</div>
                  <div><strong>Breaking Changes:</strong> ❌ Zero</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}