// src/app/dashboard/admin/performance-cycles/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  Play,
  Mail,
  RefreshCw,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast-system';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface Assignment {
  id: string;
  evaluateeName: string;
  evaluatorName: string;
  evaluateeDepartment: string;
  evaluationType: 'SELF' | 'MANAGER_TO_EMPLOYEE' | 'EMPLOYEE_TO_MANAGER' | 'PEER';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
}

interface CycleDetail {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  cycleType: string;
  campaignId?: string;
  includesManager: boolean;
  includesUpward: boolean;
  includesSelf: boolean;
  includesPeer: boolean;
  minSubordinates: number;
  anonymousResults: boolean;
  competencySnapshot?: any[];
  assignments: Assignment[];
  _count: { assignments: number };
}

interface CycleStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  expired: number;
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const EVALUATION_TYPE_LABELS: Record<string, string> = {
  SELF: 'Auto-evaluación',
  MANAGER_TO_EMPLOYEE: 'Jefe → Subordinado',
  EMPLOYEE_TO_MANAGER: 'Subordinado → Jefe',
  PEER: 'Entre Pares'
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-slate-500/20 text-slate-400',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400',
  EXPIRED: 'bg-red-500/20 text-red-400'
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function PerformanceCycleDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { id } = params;
  const router = useRouter();
  const toast = useToast();

  const [cycle, setCycle] = useState<CycleDetail | null>(null);
  const [stats, setStats] = useState<CycleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [generateResult, setGenerateResult] = useState<any>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);

  // ══════════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ══════════════════════════════════════════════════════════════════════════

  const fetchCycle = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('focalizahr_token');

      const response = await fetch(`/api/admin/performance-cycles/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error cargando ciclo');
      }

      const data = await response.json();

      if (data.success) {
        setCycle(data.data);
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCycle();
  }, [id]);

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIVAR CICLO
  // ══════════════════════════════════════════════════════════════════════════

  const handleActivateCycle = async () => {
    if (!cycle) return;

    try {
      setActivating(true);
      setShowActivateModal(false);
      const token = localStorage.getItem('focalizahr_token');

      // 1. Activar PerformanceCycle → status: 'ACTIVE'
      const cycleRes = await fetch(`/api/admin/performance-cycles/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'ACTIVE' })
      });

      if (!cycleRes.ok) {
        const data = await cycleRes.json();
        throw new Error(data.error || 'Error activando ciclo');
      }

      // 2. Activar Campaign vinculada → requiere body: { action: 'activate' }
      if (cycle.campaignId) {
        const campaignRes = await fetch(`/api/campaigns/${cycle.campaignId}/activate`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'activate' })
        });

        if (!campaignRes.ok) {
          console.warn('Warning: Error activando campaña vinculada');
        }
      }

      // 3. Refresh data
      await fetchCycle();

      toast.success(
        `Ciclo "${cycle.name}" activado. ${stats?.total || 0} evaluaciones habilitadas.`,
        'Ciclo Activado'
      );

    } catch (err: any) {
      toast.error(err.message, 'Error al activar');
    } finally {
      setActivating(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // GENERAR EVALUACIONES
  // ══════════════════════════════════════════════════════════════════════════

  const handleGenerateEvaluations = async () => {
    if (!cycle) return;

    try {
      setGenerating(true);
      setShowGenerateModal(false);
      setGenerateResult(null);
      const token = localStorage.getItem('focalizahr_token');

      const response = await fetch(`/api/admin/performance-cycles/${id}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setGenerateResult(data);
        await fetchCycle();

        toast.success(
          `Se generaron ${data.totalCreated} evaluaciones para "${cycle.name}"`,
          'Evaluaciones Generadas'
        );
      } else {
        throw new Error(data.error || 'Error generando evaluaciones');
      }
    } catch (err: any) {
      toast.error(err.message, 'Error al generar');
    } finally {
      setGenerating(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateDaysRemaining = () => {
    if (!cycle) return 0;
    const end = new Date(cycle.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const completionRate = stats ? Math.round((stats.completed / Math.max(stats.total, 1)) * 100) : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  if (error || !cycle) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-slate-400">{error || 'Ciclo no encontrado'}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/admin/performance-cycles')}
        >
          Volver a Ciclos
        </Button>
      </div>
    );
  }

  const daysRemaining = calculateDaysRemaining();
  const canGenerate = cycle.status === 'DRAFT' || cycle.status === 'SCHEDULED';
  const hasAssignments = stats && stats.total > 0;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/admin/performance-cycles')}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-light text-white">
              {cycle.name}
            </h1>
            {cycle.description && (
              <p className="text-sm text-slate-500">{cycle.description}</p>
            )}
          </div>
          <Badge className={`
            ${cycle.status === 'DRAFT' ? 'bg-slate-500/20 text-slate-400' : ''}
            ${cycle.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-400' : ''}
            ${cycle.status === 'ACTIVE' ? 'bg-cyan-500/20 text-cyan-400' : ''}
            ${cycle.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : ''}
          `}>
            {cycle.status}
          </Badge>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Progress Card */}
          <Card
            className="p-6"
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '12px'
            }}
          >
            <h3 className="text-sm font-medium uppercase tracking-wider text-cyan-400 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Progreso General
            </h3>

            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Completadas</span>
                  <span className="text-white font-medium">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-2xl font-light text-white">{stats?.completed || 0}</p>
                  <p className="text-xs text-slate-500">Completadas</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-white">{stats?.pending || 0}</p>
                  <p className="text-xs text-slate-500">Pendientes</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-white">{stats?.inProgress || 0}</p>
                  <p className="text-xs text-slate-500">En Progreso</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-white">{stats?.total || 0}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
              </div>

              {/* Fechas */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-700 text-sm">
                <span className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                </span>
                <span className={`flex items-center gap-2 ${daysRemaining <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
                  <Clock className="w-4 h-4" />
                  {daysRemaining} días restantes
                </span>
              </div>
            </div>
          </Card>

          {/* Config Card */}
          <Card
            className="p-6"
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '12px'
            }}
          >
            <h3 className="text-sm font-medium uppercase tracking-wider text-purple-400 mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Configuración
            </h3>

            <div className="space-y-3">
              {[
                { enabled: cycle.includesManager, label: 'Jefe evalúa a Subordinado' },
                { enabled: cycle.includesUpward, label: 'Subordinado evalúa a Jefe (Impact Pulse)' },
                { enabled: cycle.includesSelf, label: 'Auto-evaluación' },
                { enabled: cycle.includesPeer, label: 'Evaluación entre Pares' }
              ].map(item => (
                <div
                  key={item.label}
                  className={`
                    flex items-center gap-3 p-2 rounded-lg
                    ${item.enabled ? 'bg-emerald-500/10' : 'bg-slate-800/50'}
                  `}
                >
                  <span className={item.enabled ? 'text-emerald-400' : 'text-slate-500'}>
                    {item.enabled ? '✓' : '✗'} {item.label}
                  </span>
                </div>
              ))}

              <div className="pt-3 border-t border-slate-700 text-sm text-slate-400 space-y-2">
                <p>Min. subordinados para Upward: <span className="text-white">{cycle.minSubordinates}</span></p>
                <p>Resultados anónimos: <span className="text-white">{cycle.anonymousResults ? 'Sí' : 'No'}</span></p>
                <p>Competencias: <span className="text-white">{cycle.competencySnapshot?.length || 0} definidas</span></p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions Card */}
        <Card
          className="p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.05), rgba(167, 139, 250, 0.05))',
            border: '1px solid rgba(34, 211, 238, 0.2)',
            borderRadius: '12px'
          }}
        >
          <h3 className="text-sm font-medium uppercase tracking-wider text-white mb-4">
            Acciones Principales
          </h3>

          {/* Estado actual */}
          <div className="mb-4 p-3 rounded-lg bg-slate-800/50">
            <p className="text-sm text-slate-400">
              <span className="text-white font-medium">Estado actual:</span>{' '}
              {cycle.status === 'DRAFT' && !hasAssignments && 'Borrador sin evaluaciones generadas'}
              {cycle.status === 'DRAFT' && hasAssignments && 'Borrador con evaluaciones listas para activar'}
              {cycle.status === 'SCHEDULED' && 'Programado - evaluaciones generadas'}
              {cycle.status === 'ACTIVE' && 'Ciclo activo - evaluaciones en progreso'}
              {cycle.status === 'COMPLETED' && 'Ciclo completado'}
            </p>
          </div>

          {/* Generate Result */}
          {generateResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
            >
              <p className="text-emerald-400 font-medium mb-2">
                Evaluaciones generadas exitosamente
              </p>
              <div className="text-sm text-slate-300 space-y-1">
                <p>Creadas: <span className="text-white">{generateResult.totalCreated}</span></p>
                <p>Omitidas (ya existían): <span className="text-white">{generateResult.totalSkipped}</span></p>
                {generateResult.errors?.length > 0 && (
                  <p className="text-amber-400">Errores: {generateResult.errors.length}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowGenerateModal(true)}
              disabled={!canGenerate || generating}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generar Evaluaciones
                </>
              )}
            </Button>

            <Button
              variant="outline"
              disabled={!hasAssignments || cycle.status !== 'DRAFT' && cycle.status !== 'SCHEDULED' || activating}
              onClick={() => setShowActivateModal(true)}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
            >
              {activating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Activar Ciclo
                </>
              )}
            </Button>
          </div>

          {!canGenerate && (
            <p className="text-xs text-slate-500 mt-3">
              Solo se pueden generar evaluaciones en estado DRAFT o SCHEDULED
            </p>
          )}
        </Card>

        {/* Assignments Table */}
        {hasAssignments && (
          <Card
            className="p-6"
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '12px'
            }}
          >
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Asignaciones de Evaluación ({stats?.total})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Evaluador</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Evaluado</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Departamento</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Tipo</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cycle.assignments.slice(0, 20).map(assignment => (
                    <tr
                      key={assignment.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="py-3 px-4 text-white">{assignment.evaluatorName}</td>
                      <td className="py-3 px-4 text-white">{assignment.evaluateeName}</td>
                      <td className="py-3 px-4 text-slate-400">{assignment.evaluateeDepartment}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-400">
                          {EVALUATION_TYPE_LABELS[assignment.evaluationType]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={STATUS_COLORS[assignment.status]}>
                          {assignment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {cycle.assignments.length > 20 && (
                <p className="text-center text-sm text-slate-500 py-4">
                  Mostrando 20 de {cycle.assignments.length} asignaciones
                </p>
              )}
            </div>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MODAL: Confirmar Generar Evaluaciones                        */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">
                ¿Generar Evaluaciones?
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Se crearán asignaciones de evaluación basadas en la estructura organizacional actual para "{cycle.name}".
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-3">
              <p className="text-sm text-slate-400 mb-2">Tipos de evaluación incluidos:</p>
              {[
                { enabled: cycle.includesManager, label: 'Jefe evalúa a Subordinado' },
                { enabled: cycle.includesUpward, label: 'Subordinado evalúa a Jefe' },
                { enabled: cycle.includesSelf, label: 'Auto-evaluación' },
                { enabled: cycle.includesPeer, label: 'Evaluación entre Pares' }
              ].filter(t => t.enabled).map(t => (
                <div key={t.label} className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t.label}
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowGenerateModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateEvaluations}
                disabled={generating}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generar Evaluaciones
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MODAL: Confirmar Activar Ciclo                               */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Dialog open={showActivateModal} onOpenChange={setShowActivateModal}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">
                ¿Activar Ciclo de Evaluación?
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Esto habilitará las evaluaciones y los evaluadores podrán comenzar a responder.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <Users className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-sm text-white font-medium">{stats?.total || 0} evaluaciones</p>
                  <p className="text-xs text-slate-400">serán habilitadas para responder</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-300">
                  Esta acción no se puede deshacer. Una vez activado, el ciclo pasará a estado activo.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowActivateModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleActivateCycle}
                disabled={activating}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                {activating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Activando...
                  </>
                ) : (
                  'Sí, Activar Ciclo'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
