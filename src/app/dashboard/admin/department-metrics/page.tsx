// ============================================
// PÁGINA: Department Metrics Upload (Admin)
// Ruta: /dashboard/admin/department-metrics
// ✅ FIX: Empty state ahora es clickeable
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Building2, Database } from 'lucide-react';
import { useMetricsUpload } from '@/hooks/useMetricsUpload';
import AccountSelector from '@/components/admin/AccountSelector';
import ExcelTemplateGenerator from '@/components/metrics/ExcelTemplateGenerator';
import ExcelDropzone from '@/components/metrics/ExcelDropzone';
import DataPreviewTable from '@/components/metrics/DataPreviewTable';
import UploadHistoryTable from '@/components/metrics/UploadHistoryTable';

export default function AdminDepartmentMetricsPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedAccountName, setSelectedAccountName] = useState<string>('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false); // ✅ NUEVO

  const {
    isLoading,
    isLoadingHistory,
    previewData,
    history,
    previewMetrics,
    confirmUpload,
    cancelPreview,
    fetchHistory
  } = useMetricsUpload(selectedAccountId, 'FOCALIZAHR_ADMIN');

  // Recargar histórico cuando cambia cuenta seleccionada
  useEffect(() => {
    if (selectedAccountId) {
      fetchHistory(selectedAccountId);
    }
  }, [selectedAccountId, fetchHistory]);

  const handleFileProcessed = async (data: any[]) => {
    await previewMetrics(data);
  };

  const handleAccountChange = (accountId: string, accountName: string) => {
    setSelectedAccountId(accountId);
    setSelectedAccountName(accountName);
  };

  // ✅ NUEVO: Función para abrir el selector
  const handleOpenSelector = () => {
    // Buscar el input del AccountSelector y hacer focus
    const input = document.querySelector<HTMLInputElement>('[placeholder*="Buscar empresa"]');
    if (input) {
      input.focus();
      input.click();
    }
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
                Servicio Concierge - Carga datos crudos para clientes
              </p>
            </div>
          </div>
        </div>

        {/* Account Selector */}
        <div className="fhr-card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">
              Seleccionar Empresa Cliente
            </h2>
          </div>
          
          <AccountSelector
            value={selectedAccountId}
            onChange={handleAccountChange}
            placeholder="Buscar empresa por nombre o email..."
            onOpenChange={setIsSelectorOpen} // ✅ NUEVO: Recibir estado
          />
          
          {selectedAccountId && (
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm text-cyan-300">
                📊 Cargando métricas para: <span className="font-semibold">{selectedAccountName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Mostrar el resto solo si hay empresa seleccionada */}
        {selectedAccountId ? (
          <>
            {/* Template Generator */}
            <ExcelTemplateGenerator accountId={selectedAccountId} />

            {/* Upload Section */}
            <ExcelDropzone
              accountId={selectedAccountId}
              accountName={selectedAccountName}
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
              isAdmin={true}
              onRefresh={() => fetchHistory(selectedAccountId)}
            />
          </>
        ) : (
          // ✅ EMPTY STATE - SOLO SE MUESTRA SI DROPDOWN CERRADO
          !isSelectorOpen && (
            <div 
              className="fhr-card text-center py-16 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-200"
              onClick={handleOpenSelector}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleOpenSelector();
                }
              }}
            >
              <Database className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2 font-semibold">
                👆 Haz clic aquí para seleccionar una empresa
              </p>
              <p className="text-slate-500 text-sm">
                O usa el buscador de arriba
              </p>
              
              {/* Hint visual */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300 text-sm">
                  Servicio concierge: Carga datos para tus clientes
                </span>
              </div>
            </div>
          )
        )}
        
      </div>
    </div>
  );
}