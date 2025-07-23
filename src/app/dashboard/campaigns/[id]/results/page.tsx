// src/app/dashboard/campaigns/[id]/results/page.tsx
// FIX: Console logs movidos FUERA del JSX return

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

// ✅ COMPONENTES LIMPIOS - CONSUMEN DATOS NORMALIZADOS
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import PulseIndicatorGrid from '@/components/dashboard/PulseIndicatorGrid';
import ComparativeAnalysis from '@/components/dashboard/ComparativeAnalysis';
import KitComunicacionComponent from '@/components/dashboard/KitComunicacionComponent';
import ParticipantList from '@/components/dashboard/ParticipantList';

// 🎯 CASOS NEGOCIO v3.0 (INTEGRADO E2E) - ARQUITECTURA V3.0
import { InsightAccionable } from '@/components/insights/InsightAccionable';
import { useRetentionAnalysis } from '@/hooks/useRetentionAnalysis';

export default function CampaignResultsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  // ✅ ÚNICO HOOK - DATOS YA NORMALIZADOS Y VALIDADOS
  const { data, isLoading, error, refreshData } = useCampaignResults(campaignId);
  
  // 🧠 FASE 2: HOOK DEDICADO LÓGICA NEGOCIO (ARQUITECTURA V3.0)
  const retentionAnalysis = useRetentionAnalysis(data);
  
  const { isCollapsed } = useSidebar();
  
  // 🎯 CLASES DINÁMICAS BASADAS EN ESTADO SIDEBAR
  const mainContentClasses = isCollapsed 
    ? 'min-h-screen transition-all duration-300 lg:ml-20'
    : 'min-h-screen transition-all duration-300 lg:ml-64';

  const handleBack = () => {
    router.push('/dashboard');
  };

  // ✅ LOADING STATE - NAVEGACIÓN CORREGIDA
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

  // ✅ ERROR STATE - NAVEGACIÓN CORREGIDA
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

  // ✅ NO DATA STATE - NAVEGACIÓN CORREGIDA
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

  // ✅ EXTRACCIÓN DIRECTA - DATOS YA NORMALIZADOS
  const { campaign, analytics } = data;
  
  // 🔧 CONSOLE LOGS PARA DEBUG (FASE 3: SIMPLIFICACIÓN)
  console.log('🔍 DEBUG - analytics objeto:', analytics);
  console.log('🔍 DEBUG - campaign object:', campaign);
  console.log('🔍 DEBUG - retentionAnalysis:', retentionAnalysis);
  return (
    <>
      {/* ✅ NAVEGACIÓN FUERA DEL CONTENEDOR */}
      <DashboardNavigation />

      {/* ✅ CONTENIDO PRINCIPAL LIMPIO */}
      <div className={`${mainContentClasses} fhr-background-gradient`}>
        <div className="fhr-container-fluid px-6 py-8">
          {/* ✅ HEADER - DATOS DIRECTOS SIN FALLBACKS */}
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
                  <Badge className="fhr-badge-primary">
                    {campaign.campaignType?.displayName || campaign.campaignType?.name}
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

          {/* ✅ MÉTRICAS PRINCIPALES - DATOS NORMALIZADOS DIRECTOS */}
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

          {/* 🎯 CASOS DE NEGOCIO v3.0 (ARQUITECTURA V3.0 - FASE 3) */}
          {retentionAnalysis?.businessCases?.length > 0 && (
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
                    Riesgo Global: {retentionAnalysis.globalRetentionRisk}/100 | 
                    Urgencia: {retentionAnalysis.interventionUrgency?.replace('_', ' ')}
                  </AlertDescription>
                </Alert>

                {/* 🎯 CASOS NEGOCIO CONECTADOS - ARQUITECTURA V3.0 */}
                <div className="space-y-4">
                  {retentionAnalysis.businessCases.map((businessCase, index) => (
                    <InsightAccionable 
                      key={`business-case-${index}`}
                      businessCase={businessCase}
                      companyName={campaign.company?.name || 'Empresa'}
                      onActionClick={(action) => {
                        console.log(`🎯 Acción ejecutiva: ${action} para caso ${businessCase.type}`);
                        // TODO: Implementar acciones específicas (reunión, reporte, etc.)
                      }}
                    />
                  ))}
                </div>

                {/* 🎯 RESUMEN EJECUTIVO */}
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

          {/* ✅ INDICADORES PULSO - DATOS NORMALIZADOS DIRECTOS */}
          <div className="mb-8">
            <h3 className="fhr-title-section mb-6">📊 Indicadores de Pulso</h3>
            <PulseIndicatorGrid analytics={analytics} />
          </div>

          {/* ✅ ANÁLISIS COMPARATIVO - DATOS NORMALIZADOS */}
          <div className="mb-8">
            <h3 className="fhr-title-section mb-6">📈 Análisis Comparativo</h3>
            <ComparativeAnalysis analytics={analytics} />
          </div>

          {/* ✅ KIT COMUNICACIÓN - DATOS NORMALIZADOS DIRECTOS */}
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
                category_scores: analytics.categoryScores,
                department_scores: analytics.departmentScores,
                confidence_level: analytics.participationRate > 75 ? 'high' : analytics.participationRate > 50 ? 'medium' : 'low',
                created_date: campaign.createdAt,
                campaign_type: campaign.campaignType?.name || 'Estudio Organizacional'
              }}
            />
          </div>

          {/* ✅ LISTA PARTICIPANTES */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-6 w-6 fhr-icon-primary" />
              <h3 className="fhr-title-section">👥 Participantes</h3>
              <Badge className="fhr-badge-info">{analytics.totalInvited} invitados</Badge>
            </div>
            <ParticipantList campaignId={campaignId} />
          </div>

          {/* ✅ FOOTER CON ACCIONES */}
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

        {/* ✅ DEBUG INFO DESARROLLO */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="fhr-card-debug max-w-sm bg-black/80 text-white">
              <CardContent className="p-3">
                <h3 className="text-xs text-gray-300 mb-2">🔍 Debug Info v3.0 NORMALIZADO</h3>
                <div className="text-xs space-y-1 text-gray-400">
                  <div><strong>Campaign ID:</strong> {campaignId}</div>
                  <div><strong>Campaign Type:</strong> {campaign.campaignType?.name || 'No definido'}</div>
                  <div><strong>Average Score:</strong> {analytics.averageScore.toFixed(1)}</div>
                  <div><strong>Retention Analysis:</strong> {retentionAnalysis ? `${retentionAnalysis.businessCases?.length || 0} casos` : 'No aplicable'}</div>
                  <div><strong>Data Source:</strong> ✅ Hook Normalizado v3.0</div>
                  <div><strong>Validation:</strong> ✅ Arquitectura Separada</div>
                  <div><strong>Architecture:</strong> ✅ v3.0 Lógica/Presentación</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}