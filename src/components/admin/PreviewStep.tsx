// src/components/admin/PreviewStep.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Trash2, Eye, Send } from 'lucide-react';
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
      {/* Alert resultado */}
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-green-200">Archivo procesado exitosamente</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div>
                <span className="text-green-400 text-sm">Procesados:</span>
                <span className="ml-2 text-white font-medium">{uploadResult.totalProcessed}</span>
              </div>
              <div>
                <span className="text-green-400 text-sm">Válidos:</span>
                <span className="ml-2 text-white font-medium">{uploadResult.validRecords}</span>
              </div>
              <div>
                <span className="text-yellow-400 text-sm">Duplicados:</span>
                <span className="ml-2 text-white font-medium">{uploadResult.duplicates}</span>
              </div>
              <div>
                <span className="text-red-400 text-sm">Errores:</span>
                <span className="ml-2 text-white font-medium">{uploadResult.errors.length}</span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

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