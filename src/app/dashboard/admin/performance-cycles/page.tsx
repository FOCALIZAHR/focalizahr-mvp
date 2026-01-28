// src/app/dashboard/admin/performance-cycles/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AccountSelector from '@/components/admin/AccountSelector';

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface PerformanceCycle {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  cycleType: string;
  includesManager: boolean;
  includesUpward: boolean;
  includesSelf: boolean;
  includesPeer: boolean;
  campaignId?: string;
  _count: {
    assignments: number;
  };
}

type FilterStatus = 'all' | 'DRAFT' | 'ACTIVE' | 'COMPLETED';

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: {
    label: 'Borrador',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    icon: Clock
  },
  SCHEDULED: {
    label: 'Programado',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Calendar
  },
  ACTIVE: {
    label: 'En Progreso',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    icon: BarChart3
  },
  IN_REVIEW: {
    label: 'En Revisión',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: AlertTriangle
  },
  COMPLETED: {
    label: 'Completado',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: AlertTriangle
  }
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function PerformanceCyclesListPage() {
  const router = useRouter();

  // Account Selector state (patrón employees)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedAccountName, setSelectedAccountName] = useState<string>('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // ══════════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ══════════════════════════════════════════════════════════════════════════

  const fetchCycles = async (accountId: string) => {
    if (!accountId) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('focalizahr_token');

      const response = await fetch(`/api/admin/performance-cycles?accountId=${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error cargando ciclos');
      }

      const data = await response.json();

      if (data.success) {
        setCycles(data.data || []);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message);
      setCycles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchCycles(selectedAccountId);
    } else {
      setCycles([]);
    }
  }, [selectedAccountId]);

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleAccountChange = (accountId: string, accountName: string) => {
    setSelectedAccountId(accountId);
    setSelectedAccountName(accountName);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // FILTRADO
  // ══════════════════════════════════════════════════════════════════════════

  const filteredCycles = useMemo(() => {
    if (filterStatus === 'all') return cycles;
    return cycles.filter(c => c.status === filterStatus);
  }, [cycles, filterStatus]);

  const statusCounts = useMemo(() => ({
    all: cycles.length,
    DRAFT: cycles.filter(c => c.status === 'DRAFT').length,
    ACTIVE: cycles.filter(c => ['ACTIVE', 'SCHEDULED', 'IN_REVIEW'].includes(c.status)).length,
    COMPLETED: cycles.filter(c => c.status === 'COMPLETED').length
  }), [cycles]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-light text-white">
                Ciclos de Evaluación
              </h1>
              <p className="text-sm text-slate-500">
                Gestiona los ciclos de evaluación de desempeño
              </p>
            </div>
          </div>

          <Button
            onClick={() => router.push('/dashboard/campaigns/new')}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            disabled={!selectedAccountId}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ciclo
          </Button>
        </div>

        {/* Account Selector */}
        <AccountSelector
          value={selectedAccountId}
          onChange={handleAccountChange}
          placeholder="Buscar empresa por nombre o email..."
          onOpenChange={setIsSelectorOpen}
        />

        {/* Contenido solo si hay cuenta seleccionada */}
        {!selectedAccountId ? (
          <div className="text-center py-20">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">Selecciona una empresa para ver sus ciclos de evaluación</p>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'Todos', count: statusCounts.all },
                { key: 'DRAFT', label: 'Borradores', count: statusCounts.DRAFT },
                { key: 'ACTIVE', label: 'Activos', count: statusCounts.ACTIVE },
                { key: 'COMPLETED', label: 'Completados', count: statusCounts.COMPLETED }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key as FilterStatus)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${filterStatus === tab.key
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-transparent'
                    }
                  `}
                >
                  {tab.label}
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-700/50 text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-slate-400">{error}</p>
              </div>
            ) : filteredCycles.length === 0 ? (
              <EmptyState onCreateNew={() => router.push('/dashboard/campaigns/new')} />
            ) : (
              <div className="grid gap-4">
                {filteredCycles.map((cycle, index) => (
                  <motion.div
                    key={cycle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PerformanceCycleCard
                      cycle={cycle}
                      onManage={() => router.push(`/dashboard/admin/performance-cycles/${cycle.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTES
// ════════════════════════════════════════════════════════════════════════════

function PerformanceCycleCard({
  cycle,
  onManage
}: {
  cycle: PerformanceCycle;
  onManage: () => void;
}) {
  const statusConfig = STATUS_CONFIG[cycle.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const evaluationTypes = [
    { enabled: cycle.includesManager, label: 'Jefe→Subordinado' },
    { enabled: cycle.includesUpward, label: 'Upward' },
    { enabled: cycle.includesSelf, label: 'Auto' },
    { enabled: cycle.includesPeer, label: 'Pares' }
  ];

  return (
    <Card
      className="p-6 hover:border-cyan-500/30 transition-all cursor-pointer"
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(71, 85, 105, 0.3)',
        borderRadius: '12px'
      }}
      onClick={onManage}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Info Principal */}
        <div className="flex-1 space-y-3">
          {/* Título y Badge */}
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-medium text-white">
              {cycle.name}
            </h3>
            <Badge className={`${statusConfig.color} border`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {cycle._count.assignments} asignaciones
            </span>
          </div>

          {/* Tipos de Evaluación */}
          <div className="flex items-center gap-2 flex-wrap">
            {evaluationTypes.map(type => (
              <span
                key={type.label}
                className={`
                  px-2 py-1 rounded text-xs
                  ${type.enabled
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700/50 text-slate-500'
                  }
                `}
              >
                {type.enabled ? '✓' : '✗'} {type.label}
              </span>
            ))}
          </div>
        </div>

        {/* Action */}
        <Button
          variant="outline"
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          onClick={(e) => {
            e.stopPropagation();
            onManage();
          }}
        >
          Gestionar Ciclo
        </Button>
      </div>
    </Card>
  );
}

function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="text-center py-20">
      <div
        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(34, 211, 238, 0.1)' }}
      >
        <BarChart3 className="w-10 h-10 text-cyan-400" />
      </div>
      <h3 className="text-xl font-light text-white mb-2">
        No hay ciclos de evaluación
      </h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">
        Crea tu primer ciclo de evaluación de desempeño para comenzar a medir
        el rendimiento de tu equipo.
      </p>
      <Button
        onClick={onCreateNew}
        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        Crear Primer Ciclo
      </Button>
    </div>
  );
}
