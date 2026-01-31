// src/app/dashboard/admin/performance-cycles/[id]/results/[evaluateeId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Target,
  Shield,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface CompetencyScore {
  competencyCode: string;
  competencyName: string;
  selfScore: number | null;
  managerScore: number | null;
  peerAvgScore: number | null;
  upwardAvgScore: number | null;
  overallAvgScore: number;
}

interface GapAnalysis {
  strengths: Array<{
    competencyCode: string;
    competencyName: string;
    score: number;
    highlight: string;
  }>;
  developmentAreas: Array<{
    competencyCode: string;
    competencyName: string;
    score: number;
    gap: number;
    priority: string;
  }>;
}

interface QualitativeFeedback {
  questionText: string;
  responses: string[];
  evaluationType: string;
}

interface EvaluateeResults {
  evaluateeId: string;
  evaluateeName: string;
  evaluateePosition: string | null;
  cycleId: string;
  cycleName: string;
  selfScore: number | null;
  managerScore: number | null;
  peerAvgScore: number | null;
  upwardAvgScore: number | null;
  overallAvgScore: number;
  competencyScores: CompetencyScore[];
  gapAnalysis: GapAnalysis;
  qualitativeFeedback: QualitativeFeedback[];
  totalEvaluations: number;
  completedEvaluations: number;
  evaluationCompleteness: number;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getScoreColor(score: number): string {
  if (score >= 4.0) return 'text-emerald-400';
  if (score >= 3.0) return 'text-cyan-400';
  if (score >= 2.0) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreBarColor(score: number): string {
  if (score >= 4.0) return 'bg-emerald-500';
  if (score >= 3.0) return 'bg-cyan-500';
  if (score >= 2.0) return 'bg-amber-500';
  return 'bg-red-500';
}

function getEvalTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SELF: 'Auto-evaluación',
    MANAGER_TO_EMPLOYEE: 'Jefatura',
    EMPLOYEE_TO_MANAGER: 'Reporte Directo',
    PEER: 'Pares',
  };
  return labels[type] || type;
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function ResultsDetailPage({
  params
}: {
  params: { id: string; evaluateeId: string }
}) {
  const { id: cycleId, evaluateeId } = params;
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  const [results, setResults] = useState<EvaluateeResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<Set<number>>(new Set());

  // ══════════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ══════════════════════════════════════════════════════════════════════════

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('focalizahr_token');

      const response = await fetch(
        `/api/admin/performance-cycles/${cycleId}/results/${evaluateeId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Evaluado no encontrado');
        }
        throw new Error('Error cargando resultados');
      }

      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cycleId && evaluateeId) fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId, evaluateeId]);

  // ══════════════════════════════════════════════════════════════════════════
  // RADAR CHART DATA
  // ══════════════════════════════════════════════════════════════════════════

  const radarData = results?.competencyScores.map(c => ({
    competency: c.competencyName.length > 15
      ? c.competencyName.substring(0, 15) + '…'
      : c.competencyName,
    fullName: c.competencyName,
    self: c.selfScore ?? 0,
    manager: c.managerScore ?? 0,
    peers: c.peerAvgScore ?? 0,
    overall: c.overallAvgScore,
  })) || [];

  // ══════════════════════════════════════════════════════════════════════════
  // TOGGLE FEEDBACK
  // ══════════════════════════════════════════════════════════════════════════

  const toggleFeedback = (idx: number) => {
    setExpandedFeedback(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen fhr-bg-main flex">
        <DashboardNavigation />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (error || !results) {
    return (
      <div className="min-h-screen fhr-bg-main flex">
        <DashboardNavigation />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-screen px-4">
            <div className="fhr-card p-8 text-center space-y-4 max-w-md">
              <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
              <p className="text-slate-300">{error || 'No se encontraron datos'}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push(`/dashboard/admin/performance-cycles/${cycleId}/results`)}
                  className="fhr-btn fhr-btn-ghost"
                >
                  Volver a Lista
                </button>
                <button
                  onClick={() => { setError(null); fetchResults(); }}
                  className="fhr-btn fhr-btn-secondary"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen fhr-bg-main flex relative">
      {/* Decorative blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <DashboardNavigation />

      <main className={`
        flex-1 relative z-10
        transition-all duration-300
        ${isCollapsed ? 'ml-20' : 'ml-72'}
      `}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => router.push(`/dashboard/admin/performance-cycles/${cycleId}/results`)}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Volver a Lista de Evaluados</span>
            </button>

            <div className="fhr-card p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">
                    {results.evaluateeName.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-extralight text-white tracking-tight">
                    <span className="fhr-title-gradient">{results.evaluateeName}</span>
                  </h1>
                  {results.evaluateePosition && (
                    <p className="text-slate-400 mt-1">{results.evaluateePosition}</p>
                  )}
                  <p className="text-sm text-slate-500 mt-1">{results.cycleName}</p>
                </div>

                {/* Overall Score */}
                <div className="text-center px-6 py-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                  <div className={`text-4xl font-bold ${getScoreColor(results.overallAvgScore)}`}>
                    {results.overallAvgScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Score General</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Score Cards por Tipo ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Auto-evaluación', score: results.selfScore, icon: User, color: 'blue' },
              { label: 'Jefatura', score: results.managerScore, icon: Shield, color: 'emerald' },
              { label: 'Pares', score: results.peerAvgScore, icon: Target, color: 'purple' },
              { label: 'Reportes', score: results.upwardAvgScore, icon: TrendingUp, color: 'amber' },
            ].map((item) => (
              <div key={item.label} className="fhr-card p-4 text-center">
                <item.icon className={`h-5 w-5 mx-auto mb-2 text-${item.color}-400`} />
                <div className={`text-2xl font-bold ${
                  item.score !== null ? getScoreColor(item.score) : 'text-slate-600'
                }`}>
                  {item.score !== null ? item.score.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-1">{item.label}</div>
              </div>
            ))}
          </motion.div>

          {/* ── Radar Chart + Competency Bars ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Radar Chart */}
            {radarData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="fhr-card p-6"
              >
                <h2 className="text-lg font-medium text-white mb-4">
                  <span className="fhr-title-gradient">Radar de Competencias</span>
                </h2>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis
                        dataKey="competency"
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 5]}
                        tick={{ fill: '#64748B', fontSize: 10 }}
                        tickCount={6}
                      />
                      {results.selfScore !== null && (
                        <Radar
                          name="Auto"
                          dataKey="self"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      )}
                      {results.managerScore !== null && (
                        <Radar
                          name="Jefatura"
                          dataKey="manager"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      )}
                      <Radar
                        name="General"
                        dataKey="overall"
                        stroke="#22D3EE"
                        fill="#22D3EE"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Legend
                        wrapperStyle={{ color: '#94A3B8', fontSize: 12 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Competency Bars */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="fhr-card p-6"
            >
              <h2 className="text-lg font-medium text-white mb-4">
                <span className="fhr-title-gradient">Detalle por Competencia</span>
              </h2>
              <div className="space-y-4">
                {results.competencyScores.map((c) => (
                  <div key={c.competencyCode}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-300 truncate pr-4">{c.competencyName}</span>
                      <span className={`text-sm font-semibold ${getScoreColor(c.overallAvgScore)}`}>
                        {c.overallAvgScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(c.overallAvgScore)}`}
                        style={{ width: `${(c.overallAvgScore / 5) * 100}%` }}
                      />
                    </div>
                    {/* Mini scores row */}
                    <div className="flex gap-3 mt-1">
                      {c.selfScore !== null && (
                        <span className="text-[10px] text-blue-400">Auto: {c.selfScore.toFixed(1)}</span>
                      )}
                      {c.managerScore !== null && (
                        <span className="text-[10px] text-emerald-400">Jefe: {c.managerScore.toFixed(1)}</span>
                      )}
                      {c.peerAvgScore !== null && (
                        <span className="text-[10px] text-purple-400">Pares: {c.peerAvgScore.toFixed(1)}</span>
                      )}
                      {c.upwardAvgScore !== null && (
                        <span className="text-[10px] text-amber-400">Rep: {c.upwardAvgScore.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Gap Analysis ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Fortalezas */}
            {results.gapAnalysis.strengths.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="fhr-card p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-medium text-white">Fortalezas Destacadas</h2>
                </div>
                <div className="space-y-3">
                  {results.gapAnalysis.strengths.map((s) => (
                    <div
                      key={s.competencyCode}
                      className="p-3 rounded-lg border-l-4 border-emerald-500 bg-emerald-500/5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{s.competencyName}</span>
                        <span className="text-sm font-bold text-emerald-400">{s.score.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-emerald-300/70 mt-1">{s.highlight}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Áreas de Desarrollo */}
            {results.gapAnalysis.developmentAreas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="fhr-card p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-amber-400" />
                  <h2 className="text-lg font-medium text-white">Áreas de Desarrollo</h2>
                </div>
                <div className="space-y-3">
                  {results.gapAnalysis.developmentAreas.map((d) => (
                    <div
                      key={d.competencyCode}
                      className="p-3 rounded-lg border-l-4 border-amber-500 bg-amber-500/5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{d.competencyName}</span>
                        <span className="text-sm font-bold text-amber-400">{d.score.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          d.priority === 'Alta'
                            ? 'bg-red-500/20 text-red-400'
                            : d.priority === 'Media'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          Prioridad: {d.priority}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Gap: {d.gap.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Feedback Cualitativo ── */}
          {results.qualitativeFeedback.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="fhr-card p-6 mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-medium text-white">
                  <span className="fhr-title-gradient">Feedback Cualitativo</span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Respuestas anónimas agrupadas por pregunta
              </p>

              <div className="space-y-3">
                {results.qualitativeFeedback.map((fb, idx) => (
                  <div key={idx} className="border border-slate-700/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFeedback(idx)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{fb.questionText}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">
                            {getEvalTypeLabel(fb.evaluationType)}
                          </span>
                          <span className="text-[10px] text-slate-600">•</span>
                          <span className="text-[10px] text-slate-500">
                            {fb.responses.length} respuesta{fb.responses.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      {expandedFeedback.has(idx) ? (
                        <ChevronUp className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      )}
                    </button>

                    {expandedFeedback.has(idx) && (
                      <div className="px-4 pb-4 space-y-2">
                        {fb.responses.map((resp, rIdx) => (
                          <div
                            key={rIdx}
                            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"
                          >
                            <p className="text-sm text-slate-300 leading-relaxed">{resp}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Completeness Info ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="fhr-card p-4 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-400">
                  {results.completedEvaluations} de {results.totalEvaluations} evaluaciones completadas
                </span>
              </div>
              <span className="text-sm font-medium text-slate-300">
                {results.evaluationCompleteness.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                style={{ width: `${Math.min(results.evaluationCompleteness, 100)}%` }}
              />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
