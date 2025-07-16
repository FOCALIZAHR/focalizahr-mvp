// src/app/dashboard/campaigns/[id]/results/page.tsx
// CONSOLA DE INTELIGENCIA - Sistema de Diseño FocalizaHR v1.0
// 🚀 VERSIÓN OPTIMIZADA RESPONSIVE - Correcciones Layout + Grid + Spacing

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCampaignResults } from '@/hooks/useCampaignResults';
import { useSidebar } from '@/hooks/useSidebar'; // ✅ USAR HOOK EXISTENTE
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Brain, TrendingUp, BarChart3, Clock, Target } from 'lucide-react';
import '@/styles/focalizahr-design-system.css';

// ✅ IMPORTAR COMPONENTES DE INTELIGENCIA + NAVIGATION
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import PulseIndicatorGrid from '@/components/dashboard/PulseIndicatorGrid';
import ComparativeAnalysis from '@/components/dashboard/ComparativeAnalysis';
import KitComunicacionOrchestrator from '@/components/kit-comunicacion/KitComunicacionOrchestrator';

export default function CampaignResultsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  // ✅ HOOKS PARA DATOS Y LAYOUT DINÁMICO (USANDO HOOK EXISTENTE)
  const { data, isLoading, error, refreshData } = useCampaignResults(campaignId);
  const { isCollapsed } = useSidebar(); // 🚀 HOOK EXISTENTE DEL PROYECTO
  
  // 🎯 CLASES DINÁMICAS BASADAS EN ESTADO SIDEBAR
  const mainContentClasses = isCollapsed 
    ? 'min-h-screen transition-all duration-300 lg:ml-20' // Sidebar colapsado = 80px
    : 'min-h-screen transition-all duration-300 lg:ml-64'; // Sidebar expandido = 256px

  // Handler para volver al dashboard
  const handleBack = () => {
    router.push('/dashboard');
  };

  // 🔄 LOADING STATE - LAYOUT RESPONSIVE QUE SE ADAPTA AL SIDEBAR
  if (isLoading) {
    return (
      <div className={mainContentClasses}>
        <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-6 w-full">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-cyan-400 mx-auto mb-4" />
              <p className="fhr-subtitle text-base sm:text-lg">Cargando Consola de Inteligencia...</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-2">Procesando análisis organizacional</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ❌ ERROR STATE - LAYOUT RESPONSIVE QUE SE ADAPTA AL SIDEBAR
  if (error) {
    return (
      <div className={mainContentClasses}>
        <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-6 w-full">
          <div className="flex items-center justify-center h-64">
            <div className="fhr-card max-w-md w-full mx-4">
              <div className="p-4 sm:p-6 text-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-400 text-lg sm:text-xl">!</span>
                </div>
                <h3 className="fhr-subtitle text-base sm:text-lg mb-2">Error al cargar inteligencia</h3>
                <p className="text-slate-400 text-sm mb-4">{error}</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline" onClick={handleBack} className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Dashboard
                  </Button>
                  <button className="fhr-btn-primary w-full sm:w-auto" onClick={refreshData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🚫 NO DATA STATE - LAYOUT RESPONSIVE QUE SE ADAPTA AL SIDEBAR
  if (!data) {
    return (
      <div className={mainContentClasses}>
        <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-6 w-full">
          <div className="flex items-center justify-center h-64">
            <div className="fhr-card max-w-md w-full mx-4">
              <div className="p-4 sm:p-6 text-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-slate-400 text-lg sm:text-xl">?</span>
                </div>
                <h3 className="fhr-subtitle text-base sm:text-lg mb-2">No hay inteligencia disponible</h3>
                <p className="text-slate-400 text-sm mb-4">No se encontraron datos para generar análisis organizacional.</p>
                <button className="fhr-btn-secondary w-full sm:w-auto" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🎯 CONSOLA DE INTELIGENCIA - LAYOUT COMPLETO RESPONSIVE OPTIMIZADO
  return (
    <>
      {/* DASHBOARD NAVIGATION COMO EN ANALYTICS */}
      <DashboardNavigation />
      
      {/* 🚀 CONTAINER PRINCIPAL QUE SE ADAPTA DINÁMICAMENTE AL SIDEBAR */}
      <div className={mainContentClasses}>
        <div className="p-4 sm:p-6 lg:p-8 pt-6 w-full">
          
          {/* 📱 HEADER RESPONSIVE - MOBILE-FIRST */}
          <div className="fhr-card mb-6 lg:mb-8 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="fhr-title-gradient text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">
                    Consola de Inteligencia
                  </h1>
                  <p className="fhr-subtitle text-sm sm:text-base lg:text-lg mt-1">
                    {data?.campaign?.name} - Análisis Organizacional
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 flex-shrink-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-400 order-2 sm:order-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                  <span>Sistema Activo</span>
                </div>
                <button className="fhr-btn-secondary w-full sm:w-auto order-1 sm:order-2" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Volver</span>
                </button>
              </div>
            </div>
          </div>

          {/* 📊 GRID DE MÉTRICAS CON TÍTULOS COMPLETOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-6 mb-6 lg:mb-8 w-full">
            <div className="fhr-card-metric w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="fhr-subtitle text-xs sm:text-sm font-medium">Participación</h3>
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
              </div>
              <p className="fhr-text-accent text-2xl sm:text-3xl lg:text-3xl font-bold mb-1">
                {data?.analytics?.participationRate?.toFixed(1) || data?.stats?.participationRate?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-slate-400 text-xs">vs benchmark 65%</p>
            </div>

            <div className="fhr-card-metric w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="fhr-subtitle text-xs sm:text-sm font-medium">Score Promedio</h3>
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
              </div>
              <p className="fhr-text-accent text-2xl sm:text-3xl lg:text-3xl font-bold mb-1">
                {data?.analytics?.averageScore?.toFixed(1) || '0.0'}
              </p>
              <p className="text-slate-400 text-xs">escala 1-5</p>
            </div>

            <div className="fhr-card-metric w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="fhr-subtitle text-xs sm:text-sm font-medium">Respuestas</h3>
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
              </div>
              <p className="fhr-text-accent text-2xl sm:text-3xl lg:text-3xl font-bold mb-1">
                {data?.stats?.respondedParticipants || data?.stats?.totalResponded || 0}
              </p>
              <p className="text-slate-400 text-xs">
                de {data?.stats?.totalParticipants || data?.stats?.totalInvited || 0} invitados
              </p>
            </div>

            <div className="fhr-card-metric w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="fhr-subtitle text-xs sm:text-sm font-medium">Tiempo Promedio</h3>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0" />
              </div>
              <p className="fhr-text-accent text-2xl sm:text-3xl lg:text-3xl font-bold mb-1">
                {data?.analytics?.completionTime?.toFixed(0) || '0'}
              </p>
              <p className="text-slate-400 text-xs">minutos</p>
            </div>
          </div>

          {/* 🎯 COMPONENTES DE INTELIGENCIA EMPRESARIAL - RESPONSIVE STACK */}
          <div className="space-y-6 lg:space-y-8">
            
            {/* 🚨 SISTEMA DE ALERTAS INTELIGENTES */}
            <div className="fhr-card border-l-4 border-l-cyan-500">
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="fhr-title-gradient text-lg sm:text-xl font-bold">
                    🚨 Diagnóstico Inteligente
                  </h2>
                  <p className="fhr-subtitle text-sm sm:text-base">Sistema de alertas automáticas basado en patrones</p>
                </div>
              </div>
              
              {/* 🎛️ ALERTAS DINÁMICAS - GRID RESPONSIVE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Alerta Score Bajo */}
                {(data?.analytics?.averageScore || 0) < 3.0 && (
                  <div className="fhr-card-simple bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse shadow-lg shadow-red-500/30 flex-shrink-0"></div>
                      <span className="fhr-text-accent text-red-400 font-semibold text-xs sm:text-sm">CRÍTICO</span>
                    </div>
                    <p className="text-slate-200 text-xs sm:text-sm mb-3">
                      <strong className="text-red-400">Score General Crítico:</strong> {data?.analytics?.averageScore?.toFixed(1)}/5.0 
                      está <span className="fhr-text-accent">{((3.2 - (data?.analytics?.averageScore || 0)) * 100 / 3.2).toFixed(0)}%</span> bajo benchmark
                    </p>
                    <button className="fhr-btn-secondary text-red-400 border-red-400/30 hover:bg-red-500/10 text-xs w-full sm:w-auto">
                      → Plan de acción recomendado
                    </button>
                  </div>
                )}
                
                {/* Alerta Participación */}
                {(data?.analytics?.participationRate || 0) < 60 && (
                  <div className="fhr-card-simple bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full animate-pulse shadow-lg shadow-amber-500/30 flex-shrink-0"></div>
                      <span className="fhr-text-accent text-amber-400 font-semibold text-xs sm:text-sm">ATENCIÓN</span>
                    </div>
                    <p className="text-slate-200 text-xs sm:text-sm mb-3">
                      <strong className="text-amber-400">Participación Baja:</strong> {data?.analytics?.participationRate?.toFixed(1)}% 
                      requiere estrategia engagement
                    </p>
                    <button className="fhr-btn-secondary text-amber-400 border-amber-400/30 hover:bg-amber-500/10 text-xs w-full sm:w-auto">
                      → Recordatorio automático
                    </button>
                  </div>
                )}
                
                {/* Alerta Positiva */}
                {(data?.analytics?.averageScore || 0) >= 4.0 && (
                  <div className="fhr-card-simple bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-pulse shadow-lg shadow-green-500/30 flex-shrink-0"></div>
                      <span className="fhr-text-accent text-green-400 font-semibold text-xs sm:text-sm">EXCELENCIA</span>
                    </div>
                    <p className="text-slate-200 text-xs sm:text-sm mb-3">
                      <strong className="text-green-400">Performance Excepcional:</strong> {data?.analytics?.averageScore?.toFixed(1)}/5.0 
                      supera benchmark {(((data?.analytics?.averageScore || 0) - 3.2) * 100 / 3.2).toFixed(0)}%
                    </p>
                    <button className="fhr-btn-secondary text-green-400 border-green-400/30 hover:bg-green-500/10 text-xs w-full sm:w-auto">
                      → Replicar mejores prácticas
                    </button>
                  </div>
                )}
                
                {/* Insight Temporal */}
                <div className="fhr-card-simple bg-gradient-to-br from-cyan-500/10 to-purple-500/5 border border-cyan-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0" />
                    <span className="fhr-text-accent text-cyan-400 font-semibold text-xs sm:text-sm">TENDENCIA</span>
                  </div>
                  <p className="text-slate-200 text-xs sm:text-sm mb-3">
                    <strong className="text-cyan-400">Momentum Detectado:</strong> {data?.stats?.respondedParticipants || 0} respuestas 
                    en <span className="fhr-text-accent">{data?.analytics?.completionTime?.toFixed(0) || 0}</span> min promedio
                  </p>
                  <button className="fhr-btn-secondary text-cyan-400 border-cyan-400/30 hover:bg-cyan-500/10 text-xs w-full sm:w-auto">
                    → Análisis detallado
                  </button>
                </div>
              </div>
            </div>

            {/* 📈 INDICADORES DE PULSO CON SPARKLINES */}
            <div className="fhr-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <h2 className="fhr-title-gradient text-lg sm:text-xl font-bold">
                  📈 Indicadores de Pulso Organizacional
                </h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Live Analytics</span>
                </div>
              </div>
              <PulseIndicatorGrid 
                stats={{
                  totalResponded: data?.stats?.respondedParticipants || data?.stats?.totalResponded || 0,
                  totalInvited: data?.stats?.totalParticipants || data?.stats?.totalInvited || 0,
                  participationRate: data?.analytics?.participationRate || data?.stats?.participationRate || 0,
                  averageScore: data?.analytics?.averageScore || 0,
                  completionTime: (data?.analytics?.completionTime || 0) * 60,
                  responseRate: data?.analytics?.responseRate || data?.analytics?.participationRate || data?.stats?.participationRate || 0
                }}
                analytics={data?.analytics || {}}
              />
            </div>

            {/* 🎯 MATRIZ DE RIESGO DEPARTAMENTAL */}
            {data?.analytics?.categoryScores && Object.keys(data.analytics.categoryScores).length > 0 && (
              <div className="fhr-card">
                <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="fhr-title-gradient text-lg sm:text-xl font-bold">
                    🎯 Matriz de Riesgo por Categoría
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                  {Object.entries(data.analytics.categoryScores).map(([category, score]) => {
                    const riskLevel = score >= 4.0 ? 'Excelente' : score >= 3.5 ? 'Bueno' : score >= 3.0 ? 'Regular' : 'Crítico';
                    const benchmark = 3.2;
                    const gap = score - benchmark;
                    
                    const getCardStyle = (score: number) => {
                      if (score >= 4.0) return {
                        bg: 'bg-gradient-to-br from-green-500/15 to-emerald-600/10',
                        border: 'border border-green-500/30',
                        textColor: 'text-green-400',
                        badgeBg: 'bg-green-500/20'
                      };
                      if (score >= 3.5) return {
                        bg: 'bg-gradient-to-br from-cyan-500/15 to-blue-600/10',
                        border: 'border border-cyan-500/30',
                        textColor: 'text-cyan-400',
                        badgeBg: 'bg-cyan-500/20'
                      };
                      if (score >= 3.0) return {
                        bg: 'bg-gradient-to-br from-amber-500/15 to-yellow-600/10',
                        border: 'border border-amber-500/30',
                        textColor: 'text-amber-400',
                        badgeBg: 'bg-amber-500/20'
                      };
                      return {
                        bg: 'bg-gradient-to-br from-red-500/15 to-red-600/10',
                        border: 'border border-red-500/30',
                        textColor: 'text-red-400',
                        badgeBg: 'bg-red-500/20'
                      };
                    };
                    
                    const cardStyle = getCardStyle(score);
                    
                    return (
                      <div key={category} className={`fhr-card-simple ${cardStyle.bg} ${cardStyle.border} backdrop-blur-sm hover:scale-105 transition-all duration-300`}>
                        <div className="text-center p-3 sm:p-4">
                          <h3 className="fhr-subtitle text-xs sm:text-sm mb-2 sm:mb-3 capitalize text-slate-200">{category}</h3>
                          <div className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${cardStyle.textColor}`}>{score.toFixed(1)}</div>
                          <div className="text-xs text-slate-400 mb-1 sm:mb-2">vs {benchmark} benchmark</div>
                          <div className={`inline-block text-xs px-2 sm:px-3 py-1 rounded-full font-medium ${cardStyle.badgeBg} ${cardStyle.textColor} mb-1 sm:mb-2`}>
                            {riskLevel}
                          </div>
                          <div className="text-xs text-slate-400">
                            <span className={`font-semibold ${gap >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {gap >= 0 ? '+' : ''}{gap.toFixed(1)}
                            </span> vs industria
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 📈 ANÁLISIS COMPARATIVO */}
            <div className="fhr-card">
              <h2 className="fhr-title-gradient text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                📈 Análisis Comparativo vs Benchmark
              </h2>
              <ComparativeAnalysis 
                analytics={{
                  ...data?.analytics,
                  participationRate: data?.analytics?.participationRate || data?.stats?.participationRate,
                  averageScore: data?.analytics?.averageScore
                }}
              />
            </div>

            {/* 🎭 KIT DE COMUNICACIÓN INTELIGENTE */}
            {data?.campaign && data?.stats && (
              <div className="fhr-card">
                <h2 className="fhr-title-gradient text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                  🎭 Kit de Comunicación Empresarial Inteligente
                </h2>
                <KitComunicacionOrchestrator
                  campaignId={data?.campaign?.id}
                  campaignResults={{
                    overall_score: data?.analytics?.averageScore || 0,
                    participation_rate: data?.analytics?.participationRate || data?.stats?.participationRate || 0,
                    total_responses: data?.stats?.respondedParticipants || data?.stats?.totalResponded || 0,
                    total_invited: data?.stats?.totalParticipants || data?.stats?.totalInvited || 0,
                    company_name: data?.campaign?.company?.name || 'Empresa',
                    industry_benchmark: 3.2,
                    category_scores: data?.analytics?.categoryScores || {
                      liderazgo: 0,
                      ambiente: 0,
                      desarrollo: 0,
                      bienestar: 0
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* 🎯 FOOTER ACTIONS - RESPONSIVE */}
          <div className="flex justify-center py-6 lg:py-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <button className="fhr-btn-secondary w-full sm:w-auto" onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar Inteligencia
              </button>
              <button className="fhr-btn-primary w-full sm:w-auto" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Centro de Control
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}