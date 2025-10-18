// ====================================================================
// FOCALIZAHR MONITOR PAGE - ARQUITECTURA 3 NIVELES OPTIMIZADA
// src/app/dashboard/campaigns/[id]/monitor/page.tsx
// VERSIÓN FINAL: 3 Niveles limpios con DepartmentWowCarousel integrado
// ====================================================================

'use client';

import { useCampaignMonitor } from '@/hooks/useCampaignMonitor';
import { useRouter, useParams } from 'next/navigation';

// ====================================================================
// ARQUITECTURA 3 NIVELES - IMPORTS LIMPIOS
// ====================================================================

// 🚀 NIVEL 1: Vista Empresa General
import { CockpitHeaderBimodal } from '@/components/monitor/CockpitHeaderBimodal';

// 🏢 NIVEL 2: Vista Gerencias Competitivo
import { GerenciaPulseBimodal } from '@/components/monitor/gerencia/GerenciaPulseBimodal';

// 📊 NIVEL 3: Vista Departamentos Profundización (Carrusel)
import { DepartmentWowCarousel } from '@/components/monitor/DepartmentWowCarousel';

// 🎛️ Componente de Acciones (no es WOW, se mantiene)
import { ActionButtons } from '@/components/monitor/ActionButtons';

// UI Components
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2, Sparkles, Building2, BarChart3 } from 'lucide-react';

// ✅ CSS FocalizaHR
import '@/styles/focalizahr-design-system.css';

export default function CampaignMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  // ✅ HOOK CENTRAL - Single Source of Truth
  const monitorData = useCampaignMonitor(campaignId);
  const { isLoading, error, lastRefresh } = monitorData;

  // 🔄 LOADING STATE
  if (isLoading) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
        <Card className="fhr-card border border-white/10">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
            <h3 className="fhr-subtitle text-lg mb-2">
              Cargando Torre de Control
            </h3>
            <p className="text-white/60">
              Procesando datos de campaña...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ⚠️ ERROR STATE
  if (error) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
        <Alert className="max-w-md bg-red-500/10 border-red-500/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-white">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // MAPEO DE DATOS PARA GERENCIAS
  const hierarchicalData = (monitorData as any).hierarchicalData || [];
  const hasHierarchy = monitorData.hasHierarchy || false;

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* ====================================================================
            NIVEL 1: VISTA EMPRESA GENERAL
            CockpitHeaderBimodal - Visión ejecutiva completa
        ==================================================================== */}
        <div id="vista-empresa">
          <div id="vista-empresa">
  {(() => {
              // Transformar datos para CockpitHeaderBimodal
              // Transformar datos para CockpitHeaderBimodal
              const cockpitHeaderProps = {
                campaignName: monitorData.name || 'Campaña',
                participationRate: monitorData.participationRate,
                daysRemaining: monitorData.daysRemaining,
                totalInvited: monitorData.totalInvited,
                totalResponded: monitorData.totalResponded,
                dailyResponses: monitorData.dailyResponses?.map(dr => ({
                  date: dr.date,
                  count: dr.responses,
                  cumulative: dr.cumulative || 0
                })),
                topMovers: monitorData.topMovers,
                negativeAnomalies: monitorData.negativeAnomalies,
                participationPrediction: monitorData.participationPrediction,
                // FIX para cockpitIntelligence
                cockpitIntelligence: monitorData.cockpitIntelligence ? {
                  ...monitorData.cockpitIntelligence,
                  action: {
                    ...monitorData.cockpitIntelligence.action,
                    timeline: (monitorData.cockpitIntelligence.action as any).timeline ||
                      `${monitorData.daysRemaining} días restantes`
                  }
                } : undefined
              };

              return <CockpitHeaderBimodal {...cockpitHeaderProps} />;
            })()}
          </div>
        </div>

        {/* ====================================================================
            SEPARADOR NIVEL 1 → 2 (Estilo coherente con design system)
        ==================================================================== */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div 
              className="w-full h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.3), rgba(167, 139, 250, 0.3), transparent)'
              }}
            />
          </div>
          <div className="relative flex justify-center">
            <div 
              className="px-6 py-2 rounded-full backdrop-blur-sm"
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(34, 211, 238, 0.2)'
              }}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium uppercase tracking-wider text-slate-300">
                  Nivel 2: Vista Gerencias
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            NIVEL 2: VISTA GERENCIAS COMPETITIVO
            GerenciaPulseBimodal - Comparación y competencia entre gerencias
        ==================================================================== */}
        <div id="vista-gerencias">
          <GerenciaPulseBimodal 
            gerenciaData={hierarchicalData}
            hasHierarchy={hasHierarchy}
            isLoading={false}
          />
        </div>
        
        {/* ====================================================================
            SEPARADOR NIVEL 2 → 3 (Estilo coherente con design system)
        ==================================================================== */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div 
              className="w-full h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.3), rgba(167, 139, 250, 0.3), transparent)'
              }}
            />
          </div>
          <div className="relative flex justify-center">
            <div 
              className="px-6 py-2 rounded-full backdrop-blur-sm"
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(167, 139, 250, 0.2)'
              }}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium uppercase tracking-wider text-slate-300">
                  Nivel 3: Análisis Departamental
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            NIVEL 3: VISTA DEPARTAMENTOS PROFUNDIZACIÓN
            DepartmentWowCarousel - Todos los componentes WOW en carrusel
        ==================================================================== */}
        <div id="vista-departamentos">
          <DepartmentWowCarousel 
            monitorData={monitorData}
          />
        </div>

        {/* ====================================================================
            PANEL DE ACCIONES - Se mantiene fuera de los 3 niveles
        ==================================================================== */}
        <div id="actions" className="mt-8">
          <ActionButtons {...monitorData} />
        </div>

        {/* ====================================================================
            RESUMEN EJECUTIVO - Cards informativos finales
        ==================================================================== */}
        <div id="overview" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card 
            className="p-6"
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '12px'
            }}
          >
            <h3 className="text-sm font-medium uppercase tracking-wider text-cyan-400 mb-4">
              Resumen Ejecutivo
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Participación actual</span>
                <span className="text-white font-medium">{monitorData.participationRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Días restantes</span>
                <span className="text-white font-medium">{monitorData.daysRemaining}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Respuestas</span>
                <span className="text-white font-medium">
                  {monitorData.totalResponded} de {monitorData.totalInvited}
                </span>
              </div>
              {hasHierarchy && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Gerencias activas</span>
                  <span className="text-white font-medium">{hierarchicalData.length}</span>
                </div>
              )}
            </div>
          </Card>
          
          <Card 
            className="p-6"
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '12px'
            }}
          >
            <h3 className="text-sm font-medium uppercase tracking-wider text-purple-400 mb-4">
              Próximos Pasos Recomendados
            </h3>
            <div className="space-y-2">
        
            </div>
          </Card>
        </div>

        {/* ====================================================================
            FOOTER INFORMACIÓN
        ==================================================================== */}
        <div className="text-center text-xs text-slate-500 pt-8 mt-8 border-t border-slate-800">
          <div className="flex items-center justify-center gap-4">
            <span>Última actualización: {lastRefresh?.toLocaleString()}</span>
            <span>•</span>
            <span>Torre de Control v7.0</span>
            <span>•</span>
            <span>ID: {campaignId.slice(0, 8)}...</span>
            {hasHierarchy && (
              <>
                <span>•</span>
                <span>{hierarchicalData.length} Gerencias</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}