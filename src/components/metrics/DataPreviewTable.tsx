// ============================================
// COMPONENTE: DataPreviewTable
// Preview datos antes de confirmar upload
// ============================================

'use client';

import { AlertCircle, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewData {
  costCenterCode: string;
  period: string;
  turnoverRate?: number;
  absenceRate?: number;
  issueCount?: number;
  overtimeHoursTotal?: number;
  overtimeHoursAvg?: number;
  performanceScore?: number;
  goalsAchievedRate?: number;
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface DataPreviewTableProps {
  data: PreviewData[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export default function DataPreviewTable({
  data,
  onConfirm,
  onCancel,
  isLoading = false,
  className = ''
}: DataPreviewTableProps) {
  if (data.length === 0) return null;

  const validCount = data.filter(d => d.validation?.valid).length;
  const errorCount = data.filter(d => !d.validation?.valid).length;
  const warningCount = data.reduce((sum, d) => sum + (d.validation?.warnings.length || 0), 0);

  const canConfirm = validCount > 0 && errorCount === 0;

  return (
    <div className={`fhr-card mb-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            Preview de Datos
          </h2>
          <p className="text-sm text-slate-400">
            Revisa la información antes de confirmar la carga
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onCancel}
            variant="ghost"
            className="fhr-btn-secondary"
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="fhr-btn-primary"
            disabled={!canConfirm || isLoading}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {isLoading ? 'Cargando...' : `Confirmar ${validCount} Métricas`}
          </Button>
        </div>
      </div>

      {/* Resumen Validación */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Válidas */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-300">Válidas</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{validCount}</p>
        </div>

        {/* Errores */}
        {errorCount > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-300">Errores</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{errorCount}</p>
          </div>
        )}

        {/* Advertencias */}
        {warningCount > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-300">Advertencias</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{warningCount}</p>
          </div>
        )}
      </div>

      {/* Tabla Preview */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Estado</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Centro Costos</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Período</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Rotación</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Ausentismo</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Denuncias</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">H. Extras</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Desempeño</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">% Metas</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const hasErrors = !row.validation?.valid;
              const hasWarnings = (row.validation?.warnings.length || 0) > 0;

              return (
                <tr 
                  key={index} 
                  className={`
                    border-b border-slate-800 hover:bg-slate-800/30 transition-colors
                    ${hasErrors ? 'bg-red-500/5' : ''}
                    ${hasWarnings && !hasErrors ? 'bg-yellow-500/5' : ''}
                  `}
                >
                  {/* Estado */}
                  <td className="py-3 px-4">
                    {hasErrors ? (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-400">Error</span>
                      </div>
                    ) : hasWarnings ? (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-yellow-400">Advertencia</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400">Válido</span>
                      </div>
                    )}
                  </td>

                  {/* Datos */}
                  <td className="py-3 px-4 text-sm text-white font-mono">
                    {row.costCenterCode}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {row.period}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-slate-300">
                    {row.turnoverRate !== undefined ? `${row.turnoverRate}%` : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-slate-300">
                    {row.absenceRate !== undefined ? `${row.absenceRate}%` : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-slate-300">
                    {row.issueCount !== undefined ? row.issueCount : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-slate-300">
                    {row.overtimeHoursTotal !== undefined ? `${row.overtimeHoursTotal}h` : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-slate-300">
                    {row.performanceScore !== undefined ? row.performanceScore.toFixed(1) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-slate-300">
                    {row.goalsAchievedRate !== undefined ? `${row.goalsAchievedRate}%` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mensajes Validación Detallados */}
      {(errorCount > 0 || warningCount > 0) && (
        <div className="mt-4 space-y-2">
          {data.map((row, index) => {
            const errors = row.validation?.errors || [];
            const warnings = row.validation?.warnings || [];
            
            if (errors.length === 0 && warnings.length === 0) return null;

            return (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  errors.length > 0 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <p className="text-sm font-semibold mb-1 text-white">
                  {row.costCenterCode} - {row.period}
                </p>
                
                {errors.length > 0 && (
                  <ul className="text-sm text-red-300 space-y-1">
                    {errors.map((error, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {warnings.length > 0 && (
                  <ul className="text-sm text-yellow-300 space-y-1 mt-1">
                    {warnings.map((warning, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}