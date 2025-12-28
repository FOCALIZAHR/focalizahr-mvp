// src/components/exit/DepartmentContextCard.tsx
// 🎯 Contexto Departamental - Datos históricos que enriquecen la alerta
// STATUS: MOCK - Requiere implementación de APIs

'use client';

import { memo } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Users,
  Skull,
  History
} from 'lucide-react';

/**
 * TODO: APIS REQUERIDAS PARA DATOS REALES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 1. GET /api/exit/alerts?departmentId={id}&status=pending
 *    → Obtener alertas previas del departamento
 *    → Campos: count, pendingCount
 * 
 * 2. GET /api/exit/department-insights/{departmentId}
 *    → Obtener DepartmentExitInsight
 *    → Campos: avgEIS, totalExits, toxicExits
 * 
 * 3. GET /api/department-metrics/{departmentId}?period=latest
 *    → Obtener DepartmentMetric más reciente
 *    → Campos: turnoverRate, headcountAvg
 * 
 * 4. GET /api/department-metrics/company-avg?accountId={id}
 *    → Obtener promedio empresa para comparación
 *    → Campos: avgTurnoverRate
 * 
 * 5. Opcional: GET /api/benchmarks?type=eis&category={standardCategory}
 *    → Benchmark EIS del mercado para comparar
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface DepartmentContextCardProps {
  departmentId: string;
  departmentName: string;
  /** EIS de la alerta actual para comparar */
  currentEIS: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA - Reemplazar con datos reales de APIs
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_DATA = {
  alertasPrevias: {
    total: 3,
    pendientes: 2,
    // TODO: Obtener de GET /api/exit/alerts?departmentId={id}
  },
  eisDepartamento: {
    promedio: 42,
    totalSalidas: 12,
    salidasToxicas: 4,
    // TODO: Obtener de GET /api/exit/department-insights/{departmentId}
  },
  rotacion: {
    departamento: 15,
    empresa: 8,
    // TODO: Obtener de GET /api/department-metrics
  },
  // Insight generado basado en datos
  patron: {
    detectado: true,
    mensaje: 'Este departamento acumula señales de alerta recurrentes.',
    // TODO: Generar dinámicamente basado en thresholds
  }
};

export default memo(function DepartmentContextCard({
  departmentId,
  departmentName,
  currentEIS
}: DepartmentContextCardProps) {
  
  // TODO: Reemplazar con hooks reales
  // const { data: alerts } = useExitAlerts({ departmentId, status: 'pending' });
  // const { data: insights } = useDepartmentExitInsights(departmentId);
  // const { data: metrics } = useDepartmentMetrics(departmentId);
  
  const data = MOCK_DATA;
  const eisDiff = currentEIS - data.eisDepartamento.promedio;
  const rotacionDiff = data.rotacion.departamento - data.rotacion.empresa;
  const toxicRate = Math.round((data.eisDepartamento.salidasToxicas / data.eisDepartamento.totalSalidas) * 100);

  return (
    <div className="fhr-card-static">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="fhr-icon-box fhr-icon-box-purple">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="fhr-title-card">Contexto Departamental</h3>
          <p className="fhr-text-muted text-xs">{departmentName}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="fhr-divider">
        <div className="fhr-divider-line"></div>
        <div className="fhr-divider-dot"></div>
        <div className="fhr-divider-line"></div>
      </div>

      {/* Grid de Métricas - Mobile: 2 cols, Desktop: 4 cols */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        
        {/* Métrica 1: Alertas Previas */}
        <div className="fhr-card-metric">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-3.5 h-3.5 fhr-text-accent" />
            <span className="fhr-text-sm">Alertas</span>
          </div>
          <p className="fhr-title-section">{data.alertasPrevias.total}</p>
          <span className="fhr-badge fhr-badge-warning">
            {data.alertasPrevias.pendientes} pendientes
          </span>
        </div>

        {/* Métrica 2: EIS Promedio Depto */}
        <div className="fhr-card-metric fhr-card-metric-purple">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5" style={{ color: 'var(--fhr-purple)' }} />
            <span className="fhr-text-sm">EIS Depto</span>
          </div>
          <p className="fhr-title-section">{data.eisDepartamento.promedio}</p>
          <div className="flex items-center gap-1">
            {eisDiff < 0 ? (
              <TrendingDown className="w-3 h-3" style={{ color: 'var(--fhr-error)' }} />
            ) : (
              <TrendingUp className="w-3 h-3" style={{ color: 'var(--fhr-success)' }} />
            )}
            <span className={`text-xs ${eisDiff < 0 ? 'fhr-text-accent' : 'fhr-text-muted'}`}>
              Esta: {currentEIS} ({eisDiff > 0 ? '+' : ''}{eisDiff})
            </span>
          </div>
        </div>

        {/* Métrica 3: Rotación vs Empresa */}
        <div className={`fhr-card-metric ${rotacionDiff > 5 ? 'fhr-card-metric-warning' : 'fhr-card-metric-success'}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: rotacionDiff > 5 ? 'var(--fhr-warning)' : 'var(--fhr-success)' }} />
            <span className="fhr-text-sm">Rotación</span>
          </div>
          <p className="fhr-title-section">{data.rotacion.departamento}%</p>
          <span className={`fhr-badge ${rotacionDiff > 5 ? 'fhr-badge-warning' : 'fhr-badge-success'}`}>
            {rotacionDiff > 0 ? '+' : ''}{rotacionDiff}% vs empresa
          </span>
        </div>

        {/* Métrica 4: Salidas Tóxicas */}
        <div className="fhr-card-metric fhr-card-metric-error">
          <div className="flex items-center gap-2 mb-2">
            <Skull className="w-3.5 h-3.5" style={{ color: 'var(--fhr-error)' }} />
            <span className="fhr-text-sm">Tóxicas</span>
          </div>
          <p className="fhr-title-section">{data.eisDepartamento.salidasToxicas}/{data.eisDepartamento.totalSalidas}</p>
          <span className="fhr-badge fhr-badge-error">
            {toxicRate}% del total
          </span>
        </div>
      </div>

      {/* Insight/Patrón Detectado */}
      {data.patron.detectado && (
        <div className="mt-4 p-3 rounded-lg" style={{ 
          background: 'rgba(34, 211, 238, 0.05)',
          border: '1px solid rgba(34, 211, 238, 0.2)'
        }}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 fhr-text-accent flex-shrink-0 mt-0.5" />
            <p className="fhr-text text-sm">
              <span className="fhr-text-accent font-medium">Patrón detectado:</span>{' '}
              {data.patron.mensaje}
            </p>
          </div>
        </div>
      )}

      {/* TODO Banner - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 rounded border border-dashed" style={{ 
          borderColor: 'rgba(167, 139, 250, 0.3)',
          background: 'rgba(167, 139, 250, 0.05)'
        }}>
          <p className="text-xs" style={{ color: 'var(--fhr-purple)' }}>
            🚧 MOCK: Ver TODOs en código para implementar APIs reales
          </p>
        </div>
      )}
    </div>
  );
});