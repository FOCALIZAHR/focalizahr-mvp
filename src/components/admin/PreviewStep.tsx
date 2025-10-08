// src/components/admin/PreviewStep.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Trash2, Eye, Send, AlertTriangle, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { 
  UploadResult, 
  ParticipantData, 
  DemographicsStats 
} from '@/hooks/useParticipantUpload/types';
import PreviewTable from '@/components/admin/PreviewTable';
import DemographicsStatsComponent from '@/components/admin/DemographicsStats';

interface PreviewStepProps {
  uploadResult: UploadResult;
  previewData: ParticipantData[];
  demographicsStats: DemographicsStats | null;
  uploadFile: File | null;
  maxParticipants: number;
  processing: boolean;
  mode?: 'admin' | 'client';
  onClearForm: () => void;
  onFilePreview: () => void;
  onConfirmUpload: () => void;
}

export default function PreviewStep({
  uploadResult,
  previewData,
  demographicsStats,
  uploadFile,
  maxParticipants,
  processing,
  mode = 'admin',
  onClearForm,
  onFilePreview,
  onConfirmUpload
}: PreviewStepProps) {
  
  return (
    <div className="space-y-6">
      {/* Sistema dual de alertas */}
      {uploadResult?.errors?.length === 0 ? (
        // Alert verde: Sin errores
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-green-200">✅ Archivo procesado exitosamente</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <span className="text-green-400 text-sm">Procesados:</span>
                  <span className="ml-2 text-white font-medium">{uploadResult.totalProcessed}</span>
                </div>
                <div>
                  <span className="text-green-400 text-sm">Válidos:</span>
                  <span className="ml-2 text-white font-medium">{uploadResult.validRecords}</span>
                </div>
                <div>
                  <span className="text-green-400 text-sm">Sin errores</span>
                  <span className="ml-2 text-green-400 font-medium">🎉</span>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        // Alert amarillo: Con errores
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <AlertDescription>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-yellow-300">
                  ⚠️ {uploadResult.errors.length} {uploadResult.errors.length === 1 ? 'advertencia' : 'advertencias'}
                </p>
                {uploadResult.validRecords > 0 && (
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                    ✅ {uploadResult.validRecords} válidas
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Procesadas:</span>
                  <span className="ml-2 text-white font-medium">{uploadResult?.totalProcessed || 0}</span>
                </div>
                <div>
                  <span className="text-green-400">Válidas:</span>
                  <span className="ml-2 text-white font-medium">{uploadResult?.validRecords || 0}</span>
                </div>
                {uploadResult?.duplicates > 0 && (
                  <div>
                    <span className="text-yellow-400">Duplicados:</span>
                    <span className="ml-2 text-white font-medium">{uploadResult.duplicates}</span>
                  </div>
                )}
                <div>
                  <span className="text-red-400">Omitidas:</span>
                  <span className="ml-2 text-white font-medium">{uploadResult.errors.length}</span>
                </div>
              </div>

              <ErrorsCollapsible 
                errors={uploadResult.errors}
                autoExpand={uploadResult.validRecords === 0}
              />

              <div className="mt-3 pt-3 border-t border-yellow-500/20 text-xs">
                {uploadResult.validRecords > 0 ? (
                  <p className="text-slate-300">
                    ✅ <span className="text-green-400 font-medium">{uploadResult.validRecords} participantes válidos</span> listos para cargar.
                    {uploadResult.duplicates > 0 && <> Duplicados omitidos automáticamente.</>}
                  </p>
                ) : (
                  <p className="text-slate-300">
                    ❌ <span className="text-red-400 font-medium">Ninguna fila válida.</span> Corrige los errores y vuelve a intentar.
                  </p>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas demográficas */}
      {demographicsStats && demographicsStats.withDemographics > 0 && (
        <DemographicsStatsComponent stats={demographicsStats} />
      )}

      {/* Tabla preview */}
      {previewData.length > 0 && (
        <PreviewTable 
          participants={previewData} 
          maxParticipants={maxParticipants}
          showDemographics={true}
          demographicsStats={demographicsStats}
        />
      )}

      {/* Botones acción */}
      <div className="flex justify-between items-center pt-6 border-t border-white/20">
        <Button
          variant="outline"
          onClick={onClearForm}
          className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
          disabled={processing}
        >
          <Trash2 className="h-4 w-4" />
          Limpiar
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onFilePreview}
            disabled={!uploadFile || processing}
            className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
          >
            <Eye className="h-4 w-4" />
            Re-procesar
          </Button>
          
          <Button
            onClick={onConfirmUpload}
            disabled={processing || uploadResult.validRecords < 5}
            className="flex items-center gap-2 btn-gradient"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Cargando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {uploadResult.validRecords < 5 
                  ? `Insuficientes (${uploadResult.validRecords}/5 mín.)`
                  : `Confirmar Carga (${uploadResult.validRecords})`
                }
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info admin */}
      {mode === 'admin' && (
        <div className="context-container-info mt-4">
          <div className="font-medium text-cyan-400 mb-1">Siguiente paso:</div>
          <p className="text-white/80 text-sm">
            Después de confirmar, se notificará al cliente para activar la campaña.
          </p>
        </div>
      )}
    </div>
  );
}

// ✅ COMPONENTE ERRORS COLLAPSIBLE - UX ENTERPRISE
function ErrorsCollapsible({ 
  errors, 
  autoExpand 
}: { 
  errors: string[]; 
  autoExpand: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(autoExpand);

  const downloadErrorReport = () => {
    const report = [
      'REPORTE DE ERRORES - CARGA DE PARTICIPANTES',
      `Fecha: ${new Date().toLocaleString('es-CL')}`,
      `Total de errores: ${errors.length}`,
      '',
      ...errors
    ].join('\n');
    
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errores-carga-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-3 border border-yellow-500/30 rounded-lg overflow-hidden bg-yellow-500/5">
      {/* Header clickeable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-yellow-500/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-yellow-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-yellow-400" />
          )}
          <span className="text-yellow-300 font-medium">
            {isExpanded ? 'Ocultar' : 'Ver'} detalle de {errors.length} {errors.length === 1 ? 'error' : 'errores'}
          </span>
        </div>
        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
          {errors.length}
        </Badge>
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="border-t border-yellow-500/30">
          {/* Lista de errores */}
          <div className="max-h-60 overflow-y-auto p-4 space-y-2">
            {errors.map((error, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded bg-slate-800/50 border border-yellow-500/20"
              >
                <span className="text-yellow-400 font-mono text-xs shrink-0 mt-0.5 bg-yellow-500/10 px-2 py-0.5 rounded">
                  {index + 1}
                </span>
                <span className="text-slate-200 text-sm leading-relaxed">
                  {error}
                </span>
              </div>
            ))}
          </div>

          {/* Footer con botón descarga */}
          <div className="border-t border-yellow-500/30 p-4 bg-yellow-500/5">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadErrorReport}
              className="w-full border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar reporte de errores
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}