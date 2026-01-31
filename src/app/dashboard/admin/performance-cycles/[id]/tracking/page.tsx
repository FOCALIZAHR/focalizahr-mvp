'use client'

// ════════════════════════════════════════════════════════════════════════════
// DELIVERY TRACKING - Dashboard métricas entrega reportes
// src/app/dashboard/admin/performance-cycles/[id]/tracking/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Loader2,
  Home,
  ChevronRight,
  BarChart3,
  Timer,
  Search,
  ListFilter
} from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface DeliveryRecord {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  sentAt: string
  confirmedAt: string | null
  receivedOnTime: boolean | null
  expiresAt: string
  status: 'confirmed' | 'pending' | 'expired'
}

interface TrackingStats {
  total: number
  confirmed: number
  pending: number
  expired: number
  onTime: number
  confirmationRate: number
  onTimeRate: number
}

interface TrackingData {
  cycleId: string
  cycleName: string
  stats: TrackingStats
  deliveries: DeliveryRecord[]
}

type FilterStatus = 'all' | 'confirmed' | 'pending' | 'expired'

function getToken(): string | null {
  if (typeof window !== 'undefined') return localStorage.getItem('focalizahr_token')
  return null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function DeliveryTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const cycleId = params.id as string

  const [data, setData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Load data
  useEffect(() => {
    const loadTracking = async () => {
      try {
        setIsLoading(true)
        const token = getToken()
        const res = await fetch(`/api/admin/performance-cycles/${cycleId}/delivery-tracking`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Error cargando tracking')
        const json = await res.json()
        if (json.success) setData(json.tracking)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    if (cycleId) loadTracking()
  }, [cycleId])

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    if (!data) return []
    let list = data.deliveries
    if (filterStatus !== 'all') {
      list = list.filter(d => d.status === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(d =>
        d.employeeName.toLowerCase().includes(q) ||
        d.employeeEmail.toLowerCase().includes(q)
      )
    }
    return list
  }, [data, filterStatus, searchQuery])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusConfig: Record<string, { label: string; badgeClass: string; icon: any }> = {
    confirmed: { label: 'Confirmado', badgeClass: 'fhr-badge fhr-badge-success', icon: CheckCircle },
    pending: { label: 'Pendiente', badgeClass: 'fhr-badge fhr-badge-warning', icon: Clock },
    expired: { label: 'Expirado', badgeClass: 'fhr-badge fhr-badge-error', icon: AlertTriangle }
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="fhr-card p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400">{error || 'No se pudo cargar tracking'}</p>
          <button onClick={() => router.back()} className="fhr-btn fhr-btn-secondary mt-4 flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" />Admin</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <button onClick={() => router.push('/dashboard/admin/performance-cycles')} className="hover:text-cyan-400 transition-colors">
          Ciclos
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <button onClick={() => router.push(`/dashboard/admin/performance-cycles/${cycleId}`)} className="hover:text-cyan-400 transition-colors truncate max-w-[200px]">
          {data.cycleName}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-200">Tracking</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-slate-200 flex items-center gap-3">
          <Mail className="w-6 h-6 text-cyan-400" />
          <span className="fhr-title-gradient">Tracking Entrega Reportes</span>
        </h1>
        <p className="text-slate-400 mt-1">{data.cycleName}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fhr-card p-4 text-center">
          <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-200">{data.stats.total}</div>
          <div className="text-xs text-slate-400">Total Enviados</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="fhr-card p-4 text-center border-green-500/20">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-400">{data.stats.confirmed}</div>
          <div className="text-xs text-slate-400">Confirmados ({data.stats.confirmationRate}%)</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="fhr-card p-4 text-center border-amber-500/20">
          <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-amber-400">{data.stats.pending}</div>
          <div className="text-xs text-slate-400">Pendientes</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="fhr-card p-4 text-center border-cyan-500/20">
          <Timer className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-cyan-400">{data.stats.onTimeRate}%</div>
          <div className="text-xs text-slate-400">On-Time Rate</div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="fhr-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="fhr-input w-full pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
            <ListFilter className="w-4 h-4 text-slate-500 ml-2 mr-1" />
            {(['all', 'confirmed', 'pending', 'expired'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status === 'all' ? 'Todos' : statusConfig[status]?.label || status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      {data.stats.total === 0 ? (
        <div className="fhr-card p-12 text-center">
          <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay reportes enviados para este ciclo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDeliveries.map((delivery, idx) => {
            const cfg = statusConfig[delivery.status]
            const StatusIcon = cfg.icon
            return (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="fhr-card p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    delivery.status === 'confirmed' ? 'bg-green-500/20' :
                    delivery.status === 'pending' ? 'bg-amber-500/20' : 'bg-red-500/20'
                  }`}>
                    <StatusIcon className={`w-5 h-5 ${
                      delivery.status === 'confirmed' ? 'text-green-400' :
                      delivery.status === 'pending' ? 'text-amber-400' : 'text-red-400'
                    }`} />
                  </div>

                  {/* Employee Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200 truncate">{delivery.employeeName}</span>
                      <span className={cfg.badgeClass + ' text-xs'}>{cfg.label}</span>
                      {delivery.receivedOnTime === true && (
                        <span className="fhr-badge fhr-badge-active text-xs">On-time</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{delivery.employeeEmail}</p>
                  </div>

                  {/* Dates */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-xs text-slate-400">
                      Enviado: {formatDateTime(delivery.sentAt)}
                    </div>
                    {delivery.confirmedAt ? (
                      <div className="text-xs text-green-400">
                        Confirmado: {formatDateTime(delivery.confirmedAt)}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        Expira: {formatDate(delivery.expiresAt)}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}

          {filteredDeliveries.length === 0 && (
            <div className="fhr-card p-8 text-center">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No se encontraron resultados</p>
            </div>
          )}
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-center">
        <button
          onClick={() => router.push(`/dashboard/admin/performance-cycles/${cycleId}`)}
          className="fhr-btn fhr-btn-ghost flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Ciclo
        </button>
      </div>
    </div>
  )
}
