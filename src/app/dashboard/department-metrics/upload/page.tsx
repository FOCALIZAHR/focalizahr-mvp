// ============================================
// PÁGINA: Department Metrics Upload (Cliente)
// Ruta: /dashboard/department-metrics/upload
// ============================================

'use client';

import { useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { useMetricsUpload } from '@/hooks/useMetricsUpload';
import ExcelTemplateGenerator from '@/components/metrics/ExcelTemplateGenerator';
import ExcelDropzone from '@/components/metrics/ExcelDropzone';
import DataPreviewTable from '@/components/metrics/DataPreviewTable';
import UploadHistoryTable from '@/components/metrics/UploadHistoryTable';

export default function DepartmentMetricsUploadPage() {
  const user = getCurrentUser();
  
  const {
    isLoading,
    isLoadingHistory,
    previewData,
    history,
    previewMetrics,
    confirmUpload,
    cancelPreview,
    fetchHistory
  } = useMetricsUpload(user?.id);

  // Cargar histórico al montar
  useEffect(() => {
    if (user?.id) {
      fetchHistory(user.id);
    }
  }, [user?.id, fetchHistory]);

  const handleFileProcessed = async (data: any[]) => {
    await previewMetrics(data);
  };

  return (
    <div className="fhr-bg-main min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="fhr-title-gradient text-3xl">
                Métricas Departamentales
              </h1>
              <p className="text-slate-400 mt-1">
                Carga datos crudos RRHH para análisis predictivo
              </p>
            </div>
          </div>
        </div>

        {/* Template Generator */}
        <ExcelTemplateGenerator accountId={user?.id} />

        {/* Upload Section */}
        <ExcelDropzone
          accountId={user?.id || ''}
          accountName={user?.companyName}
          onFileProcessed={handleFileProcessed}
        />

        {/* Preview Table */}
        {previewData.length > 0 && (
          <DataPreviewTable
            data={previewData}
            onConfirm={confirmUpload}
            onCancel={cancelPreview}
            isLoading={isLoading}
          />
        )}

        {/* History Table */}
        <UploadHistoryTable
          data={history}
          isLoading={isLoadingHistory}
          isAdmin={false}
          onRefresh={() => fetchHistory(user?.id)}
        />
        
      </div>
    </div>
  );
}