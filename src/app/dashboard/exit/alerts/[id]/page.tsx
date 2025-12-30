// src/app/dashboard/exit/alerts/[id]/page.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ORQUESTADOR - Exit Alert Detail Page
// Filosofía: "El WOW viene de contar la historia correcta"
// Flujo: EMOCIÓN → Contexto → Dato → Acción
// ⚡ v2.1: ActionPlanCard premium + Flujo 3 estados
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Scale, 
  Skull, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  Loader2, 
  BrainCircuit
} from 'lucide-react';

// Componentes modulares
import RevelationCard from '@/components/exit/RevelationCard';
import EISScoreGauge from '@/components/exit/EISScoreGauge';
import BenchmarkCard from '@/components/exit/BenchmarkCard';
import UrgencyCard from '@/components/exit/UrgencyCard';
import DepartmentContextCard from '@/components/exit/DepartmentContextCard';
import CollapsibleSection from '@/components/exit/CollapsibleSection';
import OpportunityTimeline from '@/components/exit/OpportunityTimeline';
import ResolutionPanel from '@/components/exit/ResolutionPanel';
import ActionPlanCard from '@/components/exit/ActionPlanCard';  // ⚡ v2.1: Nuevo

// Engine y tipos
import { ExitAlertEngine } from '@/engines/ExitAlertEngine';
import type { ExitBusinessCase } from '@/types/ExitBusinessCase';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const ALERT_CONFIG: Record<string, { icon: typeof Scale; label: string }> = {
  ley_karin: { icon: Scale, label: 'Indicios Ley Karin' },
  toxic_exit: { icon: Skull, label: 'Exit Tóxico' },
  toxic_exit_detected: { icon: Skull, label: 'Exit Tóxico' },
  nps_critical: { icon: TrendingDown, label: 'NPS Crítico' },
  nps_critico: { icon: TrendingDown, label: 'NPS Crítico' },
  default: { icon: AlertTriangle, label: 'Alerta Exit' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function ExitAlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = params.id as string;

  // State
  const [alert, setAlert] = useState<any>(null);
  const [businessCase, setBusinessCase] = useState<ExitBusinessCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  
  // ⚡ v2.1: Estado para flujo 3 estados
  const [showResolutionPanel, setShowResolutionPanel] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/exit/alerts/${alertId}`);
        if (!res.ok) throw new Error('Error al cargar alerta');
        const { data } = await res.json();
        setAlert(data);
        
        // Generar BusinessCase con contexto completo
        const generated = ExitAlertEngine.generateBusinessCaseFromAlert(
          data,
          data.exitRecord || undefined,
          {
            name: data.department?.displayName,
            employeeCount: data.departmentMetrics?.headcount || 15,
            avgSalary: 2_500_000,
            companyName: data.account?.companyName
          }
        );
        setBusinessCase(generated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [alertId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER: RESOLVER ALERTA
  // ═══════════════════════════════════════════════════════════════════════════

  const handleResolve = async (selectedAction: string, notes: string) => {
    setIsResolving(true);
    try {
      const response = await fetch(`/api/exit/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          notes: `${selectedAction}${notes ? ` | ${notes}` : ''}`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[AlertDetailPage] Error:', error);
        throw new Error(error.error || 'Error resolviendo alerta');
      }

      router.push('/dashboard/exit/alerts');
    } catch (err) {
      console.error('[AlertDetailPage] Error resolving:', err);
      setIsResolving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (error || !alert || !businessCase) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white mb-4">{error || 'Alerta no encontrada'}</p>
          <button 
            onClick={() => router.push('/dashboard/exit/alerts')}
            className="px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Volver a Alertas
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREPARAR DATOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const config = ALERT_CONFIG[alert.alertType] || ALERT_CONFIG.default;
  const Icon = config.icon;
  const eis = alert.exitRecord?.eis ?? businessCase.detection.scoreValue ?? 35;
  const isResolved = alert.status === 'resolved' || alert.status === 'resuelta';

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* ═══════════════════════════════════════════════════════════════════
            ACTO 1: HERO
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          {/* Back */}
          <button 
            onClick={() => router.push('/dashboard/exit/alerts')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a alertas</span>
          </button>

          {/* Hero Content */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
              <BrainCircuit className="w-4 h-4 text-white" />
              <span className="text-sm text-slate-300">{config.label} · {businessCase.header.departmentName}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight text-white mb-4">
              Oportunidad de{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Anticipación
              </span>
            </h1>

            {/* Línea decorativa ── • ── */}
            <div className="flex items-center justify-center gap-4 my-6">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-slate-600" />
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-slate-600" />
            </div>

            <p className="text-slate-400 text-lg font-light max-w-xl mx-auto">
              Tienes lo que otras empresas NO tuvieron.
            </p>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            ACTO 2: LA REVELACIÓN (Protagonista)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <RevelationCard
            alertType={alert.alertType}
            summary={businessCase.detection.summary}
            questionText={businessCase.detection.questionText || ''}
            questionId={businessCase.detection.questionId || 'P6'}
            scoreValue={businessCase.detection.scoreValue}
            scoreMax={businessCase.detection.scoreMax}
            interpretation={businessCase.detection.interpretation || ''}
            disclaimer={businessCase.detection.disclaimer}
            departmentName={businessCase.header.departmentName}
            companyName={alert.account?.companyName}  
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ACTO 3: CONTEXTO (Gauge + Métricas)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gauge */}
          <EISScoreGauge
            alertType={alert.alertType}
            triggerScore={businessCase.detection.scoreValue}
            triggerMax={businessCase.detection.scoreMax}
            eisScore={alert.exitRecord?.eis}
            eisClassification={alert.exitRecord?.eisClassification}
          />
          
          {/* Métricas: Benchmark + Urgencia */}
          <div className="space-y-4">
            <BenchmarkCard
              alertType={alert.alertType}
              score={eis}
              departmentCategory={alert.department?.standardCategory}
            />
            <UrgencyCard
              alertType={alert.alertType}
              dueDate={alert.dueDate}
              riskFormatted={businessCase.header.riskFormatted}
              severity={businessCase.header.severity}
            />
          </div>
        </div>

        {/* Contexto Departamental - Datos históricos */}
        <div className="mb-8">
          <DepartmentContextCard
            departmentId={alert.department?.id || ''}
            departmentName={businessCase.header.departmentName}
            currentEIS={eis}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ACTO 4: OPORTUNIDAD
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4 mb-8">
          <CollapsibleSection 
            title="La Oportunidad" 
            icon={<Lightbulb className="w-5 h-5" />}
            defaultOpen
          >
            <OpportunityTimeline
              companyName={businessCase.header.departmentName || 'Tu Empresa'}
              currentStage={businessCase.goldenOpportunity.diagram.currentStage}
              stages={businessCase.goldenOpportunity.diagram.stages}
              message={businessCase.goldenOpportunity.message}
              callToAction={businessCase.goldenOpportunity.callToAction}
              autopsiaCase={businessCase.emblamaticCases?.cases?.[0]}
            />
          </CollapsibleSection>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ACTO 5: PLAN DE ACCIÓN + RESOLUCIÓN
            ⚡ v2.1: ActionPlanCard premium con flujo 3 estados
            ═══════════════════════════════════════════════════════════════════ */}
        
        {/* Componente premium de Plan de Acción */}
        <div className="mb-6">
          <ActionPlanCard
            philosophy={businessCase.actionPlan?.philosophy}
            steps={businessCase.actionPlan?.steps || []}
            escalationCriteria={businessCase.actionPlan?.escalationCriteria || []}
            isResolved={isResolved}
            onRegisterAction={() => setShowResolutionPanel(true)}
            followUpDays={businessCase.resolutionOptions?.followUpDays || 30}
          />
        </div>

        {/* Panel de Resolución (aparece al hacer clic en CTA del ActionPlanCard) */}
        {showResolutionPanel && !isResolved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <ResolutionPanel
              quickPicks={businessCase.resolutionOptions.quickPicks}
              followUpDays={businessCase.resolutionOptions.followUpDays}
              isResolved={isResolved}
              onResolve={handleResolve}
              isLoading={isResolving}
            />
          </motion.div>
        )}

      </div>
    </div>
  );
}