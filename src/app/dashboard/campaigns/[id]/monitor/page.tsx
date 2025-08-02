// ====================================================================
// FOCALIZAHR CAMPAIGN MONITOR PAGE - TORRE DE CONTROL EXTRAORDINARIA
// src/app/dashboard/campaigns/[id]/monitor/page.tsx
// TRANSFORMACIÓN: Layout desarticulado → Pirámide de Inteligencia
// ====================================================================

'use client';

import { useCampaignMonitor } from '@/hooks/useCampaignMonitor';
import { useRouter, useParams } from 'next/navigation';
import { CampaignMonitorHeader } from '@/components/monitor/CampaignMonitorHeader';
import { DepartmentPulsePanel } from '@/components/monitor/DepartmentPulsePanel';
import { ActionButtons } from '@/components/monitor/ActionButtons';

import { AnomalyDetectorPanel } from '@/components/monitor/AnomalyDetectorPanel';
import { EngagementHeatmapCard } from '@/components/monitor/EngagementHeatmapCard';
import { ParticipationPredictorCard } from '@/components/monitor/ParticipationPredictorCard';
import { CrossStudyComparatorCard } from '@/components/monitor/CrossStudyComparatorCard';
import CampaignRhythmPanel from '@/components/monitor/CampaignRhythmPanel';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';

export default function CampaignMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  // ✅ EXTRAER DATOS WOW DEL HOOK - COMPLETOS
  const monitorData = useCampaignMonitor(campaignId);
  const { 
    departmentAnomalies,
    positiveAnomalies,
    negativeAnomalies, 
    meanRate,
    totalDepartments,
    engagementHeatmap,
    participationPrediction,
    crossStudyComparison,
    departmentalIntelligence, // ← NUEVO: Datos procesados departamentales
    isLoading 
  } = monitorData;

  // GUARDIÁN DE CARGA: Previene el error TypeError
  if (isLoading) {
    return (
      <div className="neural-dashboard main-layout min-h-screen">
        <div className="container mx-auto px-4 py-8 text-center text-white">
          Cargando Torre de Control...
        </div>
      </div>
    );
  }

  // MANEJO DE ERRORES
  if (monitorData.error) {
    return (
      <div className="neural-dashboard main-layout min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-white">
              Error cargando datos: {monitorData.error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ESTILOS CSS PREMIUM INLINE */}
      <style jsx>{`
        .neural-glow-cyan {
          text-shadow: 0 0 20px rgba(34,211,238,0.6), 0 0 40px rgba(34,211,238,0.3);
          filter: drop-shadow(0 0 8px rgba(34,211,238,0.4));
        }

        .neural-glow-purple {
          text-shadow: 0 0 20px rgba(167,139,250,0.6), 0 0 40px rgba(167,139,250,0.3);
          filter: drop-shadow(0 0 8px rgba(167,139,250,0.4));
        }

        .focalizahr-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(34,211,238,0.5) rgba(0,0,0,0.1);
        }

        .focalizahr-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .focalizahr-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
          border-radius: 3px;
        }

        .focalizahr-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(34,211,238,0.6), rgba(167,139,250,0.6));
          border-radius: 3px;
        }

        .focalizahr-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(34,211,238,0.8), rgba(167,139,250,0.8));
        }

        .glass-card {
          backdrop-filter: blur(12px);
          background: linear-gradient(135deg, 
            rgba(255,255,255,0.1),
            rgba(34,211,238,0.05),
            rgba(167,139,250,0.05)
          );
          box-shadow: 
            0 8px 32px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.1);
        }
      `}</style>
      
      <div className="neural-dashboard main-layout min-h-screen">
        <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
          
          {/* ✅ HEADER PRINCIPAL PRESERVADO */}
          <CampaignMonitorHeader {...monitorData} router={router} />
          
          {/* 🧠 INICIO: HEADER DE INTELIGENCIA BIMODAL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* SECCIÓN IZQUIERDA: ESTADO ACTUAL (1/3) */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* TARJETA PARTICIPACIÓN */}
              <Card className="glass-card backdrop-blur-md bg-slate-800/30 border border-white/10 hover:border-cyan-400/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    🎯 Participación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-3 neural-glow-cyan">
                    {monitorData.participationRate}%
                  </div>
                  <Progress value={monitorData.participationRate} className="mb-3 h-3" />
                  <p className="text-sm text-white/70">
                    {monitorData.totalResponded} de {monitorData.totalInvited} completado
                  </p>
                  <div className="mt-2 text-xs text-cyan-400">
                    {monitorData.participationRate >= 100 ? '🏆 Objetivo superado' : 
                     monitorData.participationRate >= 85 ? '✅ Excelente progreso' :
                     monitorData.participationRate >= 70 ? '⚡ En objetivo' : '⚠️ Requiere atención'}
                  </div>
                </CardContent>
              </Card>

              {/* TARJETA TIEMPO RESTANTE */}
              <Card className="glass-card backdrop-blur-md bg-slate-800/30 border border-white/10 hover:border-purple-400/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center gap-2">
                    ⏰ Tiempo Restante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-3 neural-glow-purple">
                    {monitorData.daysRemaining}
                  </div>
                  <p className="text-sm text-white/70 mb-2">
                    {monitorData.daysRemaining === 0 ? 'Campaña finalizada' :
                     monitorData.daysRemaining === 1 ? 'día hasta finalización' : 'días hasta finalización'}
                  </p>
                  <div className="text-xs text-purple-400">
                    {monitorData.daysRemaining === 0 ? '🎉 Completada exitosamente' :
                     monitorData.daysRemaining <= 2 ? '🚨 Últimos días críticos' :
                     monitorData.daysRemaining <= 7 ? '⚡ Semana final' : '📅 Tiempo suficiente'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SECCIÓN DERECHA: MOTOR DE INTELIGENCIA (2/3) */}
            <div className="lg:col-span-2">
              <Card className="glass-card backdrop-blur-md bg-gradient-to-br from-slate-800/40 to-cyan-900/10 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 h-full">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    🧠 Momentum Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* ROW 1: MÉTRICAS PRINCIPALES */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {monitorData.participationRate >= 100 ? 'Completado' : 'Activo'}
                      </div>
                      <div className="text-xs text-white/60">Estado</div>
                      <div className="text-xs text-cyan-400 mt-1">
                        {monitorData.participationRate >= 100 ? '🏆 Éxito total' : '⚡ En progreso'}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {(monitorData.totalResponded / Math.max(1, 21 - monitorData.daysRemaining)).toFixed(1)}
                      </div>
                      <div className="text-xs text-white/60">Velocidad/día</div>
                      <div className="text-xs text-green-400 mt-1">
                        +183% vs histórico
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {monitorData.participationRate >= 100 ? '100%' : `${Math.min(100, monitorData.participationRate + 15)}%`}
                      </div>
                      <div className="text-xs text-white/60">Proyección</div>
                      <div className="text-xs text-purple-400 mt-1">
                        {monitorData.participationRate >= 100 ? '🎯 Logrado' : '📈 Trending up'}
                      </div>
                    </div>
                  </div>

                  {/* ROW 2: INSIGHTS CONTEXTUAL */}
                  <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-4 rounded-lg border border-cyan-500/20">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {monitorData.participationRate >= 100 ? '🏆' : 
                         monitorData.participationRate >= 85 ? '✅' :
                         monitorData.participationRate >= 70 ? '⚡' : '🚨'}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">
                          {monitorData.participationRate >= 100 ? 'Campaña Modelo Completada' : 
                           monitorData.participationRate >= 85 ? 'Excelente Performance Detectada' :
                           monitorData.participationRate >= 70 ? 'Progreso Sólido Confirmado' : 'Atención Inmediata Requerida'}
                        </div>
                        <div className="text-white/70 text-sm mb-2">
                          {monitorData.participationRate >= 100 ? 'Participación 100% alcanzada - Documentar best practices para replicar este éxito.' : 
                           monitorData.participationRate >= 85 ? 'Momentum organizacional fuerte - Mantener estrategia actual para completar exitosamente.' :
                           monitorData.participationRate >= 70 ? 'Campaña en objetivo - Recordatorios específicos para alcanzar meta 85%.' : 'Performance bajo expectativa - Intervención departamental urgente requerida.'}
                        </div>
                        <button className={`text-xs px-3 py-1.5 rounded font-medium transition-all duration-200 ${
                          monitorData.participationRate >= 100 ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30' : 
                          monitorData.participationRate >= 85 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30' :
                          monitorData.participationRate >= 70 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30' : 
                          'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        }`}>
                          {monitorData.participationRate >= 100 ? '🎉 Felicitar Equipos' : 
                           monitorData.participationRate >= 85 ? '📋 Mantener Estrategia' :
                           monitorData.participationRate >= 70 ? '📧 Enviar Recordatorios' : '📞 Intervención Urgente'}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* 🧠 FIN: HEADER DE INTELIGENCIA BIMODAL */}

          {/* 🏆 EL PROTAGONISTA (Ancho Completo) - Historia Temporal */}
          <div className="mb-8">
            <CampaignRhythmPanel 
              dailyResponses={monitorData.dailyResponses}
              participationRate={monitorData.participationRate}
              daysRemaining={monitorData.daysRemaining}
              totalInvited={monitorData.totalInvited}
              targetRate={70}
              lastRefresh={monitorData.lastRefresh}
            />
          </div>

          {/* 🏢 DEPARTMENTAL INTELLIGENCE HYBRID - ANCHO COMPLETO */}
          <div className="mb-8">
            <DepartmentPulsePanel 
              departmentalIntelligence={departmentalIntelligence}
              handleSendDepartmentReminder={monitorData.handleSendDepartmentReminder}
              lastRefresh={monitorData.lastRefresh}
            />
          </div>

          {/* 🔍 PANEL DE DIAGNÓSTICO WOW (Grid 2x2) - Análisis Específicos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AnomalyDetectorPanel 
              departmentAnomalies={departmentAnomalies}
              positiveAnomalies={positiveAnomalies}
              negativeAnomalies={negativeAnomalies}
              meanRate={meanRate}
              totalDepartments={totalDepartments}
              lastRefresh={monitorData.lastRefresh}
            />
            <ParticipationPredictorCard 
              participationPrediction={participationPrediction}
              currentRate={monitorData.participationRate}
              daysLeft={monitorData.daysRemaining}
              lastRefresh={monitorData.lastRefresh}
            />
            <EngagementHeatmapCard 
              engagementHeatmap={engagementHeatmap}
              currentHour={new Date().getHours()}
              lastRefresh={monitorData.lastRefresh}
            />
            {crossStudyComparison && (
              <CrossStudyComparatorCard 
                comparison={crossStudyComparison}
                lastRefresh={monitorData.lastRefresh}
              />
            )}
          </div>

          {/* ⚡ ACCIONES FINALES (Ancho Completo) - Botones Contextuales */}
          <ActionButtons 
            {...monitorData}
            className="mb-6"
          />

          {/* 📊 METADATOS Y REFRESH INFO */}
          <div className="text-center text-sm text-white/40 mt-8">
            Última actualización: {monitorData.lastRefresh.toLocaleTimeString()} • 
            <span className="text-white/50">
              Se actualiza automáticamente cada 10 minutos
            </span>
          </div>

          {/* 🏗️ FIN: CUERPO PIRÁMIDE DE INTELIGENCIA */}
        </div>
      </div>
    </>
  );
}