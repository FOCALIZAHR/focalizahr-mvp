// src/components/onboarding/AlertFilters.tsx

'use client';

import React from 'react';
import { Filter } from 'lucide-react';

interface AlertFiltersProps {
  severity: string;
  status: string;
  slaStatus: string;
  onSeverityChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSlaStatusChange: (value: string) => void;
}

export const AlertFilters: React.FC<AlertFiltersProps> = ({
  severity,
  status,
  slaStatus,
  onSeverityChange,
  onStatusChange,
  onSlaStatusChange
}) => {
  return (
    <div className="fhr-card mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Filter className="h-5 w-5 text-cyan-400" />
        <h3 className="text-base font-semibold text-white">Filtros</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FILTRO: Severidad */}
        <div>
          <label className="block text-xs text-slate-400 font-medium mb-2">
            Severidad
          </label>
          <select
            value={severity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="
              w-full px-4 py-2.5 rounded-lg
              bg-slate-800/50 border border-slate-700
              text-sm text-slate-300
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
              transition-all
            "
          >
            <option value="">Todas las severidades</option>
            <option value="critical">🔴 Crítico</option>
            <option value="high">🟠 Alto</option>
            <option value="medium">🟡 Medio</option>
            <option value="low">🟢 Bajo</option>
          </select>
        </div>
        
        {/* FILTRO: Estado */}
        <div>
          <label className="block text-xs text-slate-400 font-medium mb-2">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="
              w-full px-4 py-2.5 rounded-lg
              bg-slate-800/50 border border-slate-700
              text-sm text-slate-300
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
              transition-all
            "
          >
            <option value="">Todos los estados</option>
            <option value="pending">⏳ Pendiente</option>
            <option value="acknowledged">✓ Accionada</option>
            <option value="resolved">✅ Resuelta</option>
          </select>
        </div>
        
        {/* FILTRO: SLA Status */}
        <div>
          <label className="block text-xs text-slate-400 font-medium mb-2">
            Estado SLA
          </label>
          <select
            value={slaStatus}
            onChange={(e) => onSlaStatusChange(e.target.value)}
            className="
              w-full px-4 py-2.5 rounded-lg
              bg-slate-800/50 border border-slate-700
              text-sm text-slate-300
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
              transition-all
            "
          >
            <option value="">Todos los SLA</option>
            <option value="violated">🔴 Violado</option>
            <option value="at_risk">🟡 En Riesgo</option>
            <option value="on_time">🟢 A Tiempo</option>
          </select>
        </div>
      </div>
      
      {/* ACTIVE FILTERS COUNT */}
      {(severity || status || slaStatus) && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {[severity, status, slaStatus].filter(Boolean).length} filtro(s) activo(s)
            </p>
            <button
              onClick={() => {
                onSeverityChange('');
                onStatusChange('');
                onSlaStatusChange('');
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};