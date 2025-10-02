// ============================================
// COMPONENTE: UploadHistoryTable
// Histórico de cargas con filtros
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { History, TrendingUp, TrendingDown, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UploadHistory {
  id: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  periodType: string;
  uploadedBy: string;
  uploadedAt: Date;
  uploadMethod: string;
  dataQuality: string;
  department: {
    displayName: string;
    costCenterCode: string;
  };
  turnoverRate?: number;
  absenceRate?: number;
  issueCount?: number;
  overtimeHoursTotal?: number;
}

interface UploadHistoryTableProps {
  data: UploadHistory[];
  isLoading: boolean;
  isAdmin?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export default function UploadHistoryTable({
  data,
  isLoading,
  isAdmin = false,
  onRefresh,
  className = ''
}: UploadHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<UploadHistory[]>(data);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(data);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = data.filter(item => 
      item.period.toLowerCase().includes(term) ||
      item.department.displayName.toLowerCase().includes(term) ||
      item.department.costCenterCode.toLowerCase().includes(term) ||
      item.uploadedBy.toLowerCase().includes(term)
    );
    setFilteredData(filtered);
  }, [searchTerm, data]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPeriodTypeBadge = (type: string) => {
    const badges = {
      quarterly: { label: 'Trimestral', className: 'fhr-badge-info' },
      monthly: { label: 'Mensual', className: 'fhr-badge-success' },
      yearly: { label: 'Anual', className: 'fhr-badge-warning' },
      semester: { label: 'Semestral', className: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
    };

    const badge = badges[type as keyof typeof badges] || { label: type, className: 'bg-slate-500/20 text-slate-300' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className={`fhr-card ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-slate-400">Cargando histórico...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`fhr-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <History className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Histórico de Cargas
            </h2>
            <p className="text-sm text-slate-400">
              {filteredData.length} registro{filteredData.length !== 1 ? 's' : ''} encontrado{filteredData.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="ghost"
            className="fhr-btn-secondary"
          >
            Actualizar
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por período, departamento o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Tabla */}
      {filteredData.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            {searchTerm ? 'No se encontraron resultados' : 'Aún no hay métricas cargadas'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Período</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Departamento</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Rotación</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Ausentismo</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Denuncias</th>
                {isAdmin && (
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Cargado Por</th>
                )}
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr 
                  key={item.id}
                  className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Período */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-white">
                        {item.period}
                      </span>
                      {getPeriodTypeBadge(item.periodType)}
                    </div>
                  </td>

                  {/* Departamento */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-white">
                        {item.department.displayName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {item.department.costCenterCode}
                      </span>
                    </div>
                  </td>

                  {/* Rotación */}
                  <td className="py-3 px-4 text-right">
                    {item.turnoverRate !== undefined && item.turnoverRate !== null ? (
                      <div className="flex items-center justify-end gap-1">
                        {item.turnoverRate > 15 ? (
                          <TrendingUp className="w-4 h-4 text-red-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-400" />
                        )}
                        <span className={`text-sm font-semibold ${
                          item.turnoverRate > 15 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {item.turnoverRate}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">-</span>
                    )}
                  </td>

                  {/* Ausentismo */}
                  <td className="py-3 px-4 text-right">
                    {item.absenceRate !== undefined && item.absenceRate !== null ? (
                      <div className="flex items-center justify-end gap-1">
                        {item.absenceRate > 10 ? (
                          <TrendingUp className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-400" />
                        )}
                        <span className={`text-sm font-semibold ${
                          item.absenceRate > 10 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {item.absenceRate}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">-</span>
                    )}
                  </td>

                  {/* Denuncias */}
                  <td className="py-3 px-4 text-right">
                    {item.issueCount !== undefined && item.issueCount !== null ? (
                      <span className={`text-sm font-semibold ${
                        item.issueCount > 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {item.issueCount}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">-</span>
                    )}
                  </td>

                  {/* Usuario (solo admin) */}
                  {isAdmin && (
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {item.uploadedBy}
                    </td>
                  )}

                  {/* Fecha */}
                  <td className="py-3 px-4 text-sm text-slate-400">
                    {formatDate(item.uploadedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}