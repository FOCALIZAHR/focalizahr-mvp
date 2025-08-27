// src/components/admin/ParticipantUploader.tsx
// COMPONENTE ORQUESTADOR FINAL - REFACTORIZACIÓN COMPLETA
'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

// Importar el hook con TODA la lógica
import { useParticipantUpload } from '@/hooks/useParticipantUpload';
import { ParticipantUploaderProps } from '@/hooks/useParticipantUpload/types';

// Importar componentes UI especializados (MISMA CARPETA)
import PreviewTable from '@/components/admin/PreviewTable';
import DemographicsStats from '@/components/admin/DemographicsStats';
import UploadStep from '@/components/admin/UploadStep';
import PreviewStep from '@/components/admin/PreviewStep';
import LoadingStep from '@/components/admin/LoadingStep';

export default function ParticipantUploader(props: ParticipantUploaderProps) {
  const {
    campaignName,
    maxParticipants = 500,
  } = props;

  // TODO EL ESTADO Y LÓGICA EN EL HOOK
  const {
    uploadFile,
    uploading,
    processing,
    uploadResult,
    previewData,
    uploadError,
    uploadProgress,
    departments,
    selectedDepartmentId,
    demographicsStats,
    currentStep,
    fileInputRef,
    handleFileSelect,
    handleDownloadTemplate,
    handleFilePreview,
    handleConfirmUpload,
    handleClearForm,
    setSelectedDepartment,
    setDepartments
  } = useParticipantUpload(
    props.campaignId,
    props.campaignName,
    props.onUploadComplete,
    props.onError,
    props.maxParticipants,
    props.allowedFormats
  );

  // Cargar departamentos al montar
  useEffect(() => {
    const fetchDepartments = async () => {
      const token = localStorage.getItem('focalizahr_token');
      if (!token) return;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const accountId = payload.accountId;
        
        if (accountId) {
          const response = await fetch(`/api/departments?accountId=${accountId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.departments) {
              setDepartments(data.departments);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    
    fetchDepartments();
  }, [setDepartments]);

  // RENDERIZADO CONDICIONAL SIMPLE POR PASO
  return (
    <Card className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-cyan-400" />
          <span className="focalizahr-gradient-text">Cargar Participantes</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Campaña: <strong className="text-white">{campaignName}</strong> • 
          Máximo {maxParticipants} participantes • 
          <span className="text-cyan-400">Incluye datos demográficos</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* ORQUESTACIÓN SIMPLE DE COMPONENTES */}
        {(currentStep === 'idle' || currentStep === 'uploading') && (
          <UploadStep
            uploadFile={uploadFile}
            uploading={uploading}
            uploadProgress={uploadProgress}
            uploadError={uploadError}
            departments={departments}
            selectedDepartmentId={selectedDepartmentId}
            fileInputRef={fileInputRef}
            allowedFormats={props.allowedFormats || ['.csv', '.xlsx', '.xls']}
            onFileSelect={handleFileSelect}
            onDownloadTemplate={handleDownloadTemplate}
            onFilePreview={handleFilePreview}
            onDepartmentChange={setSelectedDepartment}
          />
        )}
        
        {currentStep === 'preview' && uploadResult && (
          <PreviewStep
            uploadResult={uploadResult}
            previewData={previewData}
            demographicsStats={demographicsStats}
            uploadFile={uploadFile}
            maxParticipants={maxParticipants}
            processing={processing}
            mode={props.mode}
            onClearForm={handleClearForm}
            onFilePreview={handleFilePreview}
            onConfirmUpload={handleConfirmUpload}
          />
        )}
        
        {currentStep === 'confirming' && (
          <LoadingStep message="Cargando participantes..." />
        )}
        
        {currentStep === 'complete' && (
          <LoadingStep 
            message="¡Participantes cargados exitosamente!" 
            isSuccess={true}
            uploadResult={uploadResult}
            demographicsStats={demographicsStats}
          />
        )}
        
        {currentStep === 'error' && uploadError && (
          <LoadingStep 
            message={uploadError} 
            isError={true}
          />
        )}
      </CardContent>
    </Card>
  );
}