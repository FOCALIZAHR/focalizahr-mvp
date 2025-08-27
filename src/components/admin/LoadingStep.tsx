// src/components/admin/ParticipantUploader/LoadingStep.tsx
'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { UploadResult, DemographicsStats } from '@/hooks/useParticipantUpload/types';

interface LoadingStepProps {
  message: string;
  isSuccess?: boolean;
  isError?: boolean;
  uploadResult?: UploadResult | null;
  demographicsStats?: DemographicsStats | null;
}

export default function LoadingStep({
  message,
  isSuccess = false,
  isError = false,
  uploadResult,
  demographicsStats
}: LoadingStepProps) {
  
  // Loading state
  if (!isSuccess && !isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="h-12 w-12 text-cyan-400 animate-spin mb-4" />
        <p className="text-lg font-medium text-white">{message}</p>
        <p className="text-sm text-white/60 mt-2">Por favor espere...</p>
      </div>
    );
  }
  
  // Success state
  if (isSuccess) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-green-200 text-lg">{message}</p>
            {uploadResult && (
              <p className="text-white/80">
                Se han cargado {uploadResult.validRecords} participantes exitosamente.
              </p>
            )}
            {demographicsStats && demographicsStats.withDemographics > 0 && (
              <p className="text-cyan-400 text-sm mt-2">
                ✨ {demographicsStats.withDemographics} participantes con datos demográficos.
              </p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <Alert className="border-red-500/50 bg-red-500/10">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription>
          <p className="font-medium text-red-200">{message}</p>
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}