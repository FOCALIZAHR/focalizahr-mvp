// src/app/dashboard/admin/performance-cycles/[id]/results/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  BarChart3,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface EvaluateeSummary {
  evaluateeId: string;
  evaluateeName: string;
  evaluateePosition: string | null;
  overallAvgScore: number;
  totalEvaluations: number;
  completedEvaluations: number;
  evaluationCompleteness: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ResultsStats {
  avgScore: number;
  avgCompleteness: number;
  totalEvaluatees: number;
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

function getScoreBg(score: number): string {
  if (score >= 4.0) return 'bg-emerald-500/20';
  if (score >= 3.0) return 'bg-cyan-500/20';
  if (score >= 2.0) return 'bg-amber-500/20';
  return 'bg-red-500/20';
}

function getCompletenessColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function ResultsListPage({
  params
}: {
  params: { id: string }
}) {
  const { id: cycleId } = params;
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  const [evaluatees, setEvaluatees] = useState<EvaluateeSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [stats, setStats] = useState<ResultsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<'name' | 'score'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ══════════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ══════════════════════════════════════════════════════════════════════════

  const fetchResults = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('focalizahr_token');

      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '20',
        sortBy,
        sortOrder
      });

      const response = await fetch(
        `/api/admin/performance-cycles/${cycleId}/results?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error cargando resultados');
      }

      const data = await response.json();

      if (data.success) {
        setEvaluatees(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
        setCurrentPage(data.pagination.page);
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
    if (cycleId) fetchResults(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId, sortBy, sortOrder]);

  // ══════════════════════════════════════════════════════════════════════════
  // FILTRADO LOCAL
  // ══════════════════════════════════════════════════════════════════════════

  const filteredEvaluatees = useMemo(() => {
    if (!searchQuery.trim()) return evaluatees;
    const q = searchQuery.toLowerCase();
    return evaluatees.filter(e =>
      e.evaluateeName.toLowerCase().includes(q) ||
      (e.evaluateePosition && e.evaluateePosition.toLowerCase().includes(q))
    );
  }, [evaluatees, searchQuery]);

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleSort = (field: 'name' | 'score') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'score' ? 'desc' : 'asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchResults(page);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (loading && evaluatees.length === 0) {
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

  if (error) {
    return (
      <div className="min-h-screen fhr-bg-main flex">
        <DashboardNavigation />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-screen px-4">
            <div className="fhr-card p-8 text-center space-y-4 max-w-md">
              <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
              <p className="text-slate-300">{error}</p>
              <button
                onClick={() => { setError(null); fetchResults(); }}
                className="fhr-btn fhr-btn-secondary"
              >
                Reintentar
              </button>
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
              onClick={() => router.push(`/dashboard/admin/performance-cycles/${cycleId}`)}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Volver al Ciclo</span>
            </button>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extralight text-white tracking-tight mb-2">
              Resultados <span className="fhr-title-gradient">360°</span>
            </h1>

            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
            </div>
          </motion.div>

          {/* ── Stats Cards ── */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            >
              <div className="fhr-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-cyan-400" />
                  </div>
                  <span className="text-sm text-slate-400">Total Evaluados</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalEvaluatees}</p>
              </div>

              <div className="fhr-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">Score Promedio</span>
                </div>
                <p className={`text-3xl font-bold ${getScoreColor(stats.avgScore)}`}>
                  {stats.avgScore.toFixed(1)}<span className="text-lg text-slate-500">/5.0</span>
                </p>
              </div>

              <div className="fhr-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-sm text-slate-400">Completitud</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats.avgCompleteness.toFixed(0)}<span className="text-lg text-slate-500">%</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Search + Sort Controls ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="fhr-card p-4 mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar evaluado por nombre o cargo..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="fhr-input w-full pl-10"
                />
              </div>

              {/* Sort buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSort('name')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    sortBy === 'name'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Nombre
                </button>
                <button
                  onClick={() => handleSort('score')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    sortBy === 'score'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Score
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Evaluatees Grid ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            {filteredEvaluatees.length === 0 ? (
              <div className="fhr-card p-12 text-center">
                <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {searchQuery ? 'No se encontraron evaluados con ese criterio' : 'No hay evaluados en este ciclo'}
                </p>
              </div>
            ) : (
              filteredEvaluatees.map((evaluatee, idx) => (
                <motion.div
                  key={evaluatee.evaluateeId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx }}
                >
                  <button
                    onClick={() => router.push(
                      `/dashboard/admin/performance-cycles/${cycleId}/results/${evaluatee.evaluateeId}`
                    )}
                    className="fhr-card w-full p-4 sm:p-5 text-left hover:border-cyan-500/30 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Avatar + Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-semibold text-white">
                            {evaluatee.evaluateeName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-white font-medium truncate group-hover:text-cyan-400 transition-colors">
                            {evaluatee.evaluateeName}
                          </h3>
                          {evaluatee.evaluateePosition && (
                            <p className="text-sm text-slate-500 truncate">{evaluatee.evaluateePosition}</p>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-6 sm:gap-8">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(evaluatee.overallAvgScore)}`}>
                            {evaluatee.overallAvgScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-slate-500">Score</div>
                        </div>

                        {/* Completeness bar */}
                        <div className="w-24 sm:w-32">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">
                              {evaluatee.completedEvaluations}/{evaluatee.totalEvaluations}
                            </span>
                            <span className="text-xs text-slate-500">
                              {evaluatee.evaluationCompleteness.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getCompletenessColor(evaluatee.evaluationCompleteness)}`}
                              style={{ width: `${Math.min(evaluatee.evaluationCompleteness, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Completeness icon */}
                        <div className="hidden sm:block">
                          {evaluatee.evaluationCompleteness >= 100 ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <div className={`w-5 h-5 rounded-full ${getScoreBg(evaluatee.overallAvgScore)} flex items-center justify-center`}>
                              <span className="text-[10px] font-bold text-white">
                                {evaluatee.overallAvgScore.toFixed(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* ── Pagination ── */}
          {pagination.pages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 mt-8"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="fhr-btn fhr-btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.pages}
                className="fhr-btn fhr-btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
