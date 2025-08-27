// src/components/admin/ParticipantUploader/UploadStep.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Eye, AlertTriangle } from 'lucide-react';
import { Department } from '@/hooks/useParticipantUpload/types';

interface UploadStepProps {
  uploadFile: File | null;
  uploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  departments: Department[];
  selectedDepartmentId: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  allowedFormats: string[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  onFilePreview: () => void;
  onDepartmentChange: (value: string) => void;
}

export default function UploadStep({
  uploadFile,
  uploading,
  uploadProgress,
  uploadError,
  departments,
  selectedDepartmentId,
  fileInputRef,
  allowedFormats,
  onFileSelect,
  onDownloadTemplate,
  onFilePreview,
  onDepartmentChange
}: UploadStepProps) {
  
  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <Alert className="context-container-info">
        <FileText className="h-4 w-4 text-cyan-400" />
        <AlertDescription>
          <div className="space-y-2">
            <p><strong>Formato requerido:</strong> CSV o Excel con estas columnas:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Email</strong> (obligatorio)</li>
              <li>Nombre, Departamento, Cargo, Ubicación (opcionales)</li>
              <li className="text-cyan-400"><strong>FechaNacimiento</strong> (DD/MM/AAAA)</li>
              <li className="text-cyan-400"><strong>Genero</strong> (M/F/No binario)</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Template */}
      <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
        <span className="text-sm text-white/70">¿Necesitas un ejemplo?</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onDownloadTemplate}
          className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Descargar Template
        </Button>
      </div>

      {/* Selector departamento */}
      {departments.length > 0 && (
        <div className="space-y-2 p-4 bg-blue-900/20 rounded-lg border border-blue-800">
          <Label className="text-sm font-medium text-blue-100">
            Departamento por defecto (opcional)
          </Label>
          <Select value={selectedDepartmentId} onValueChange={onDepartmentChange}>
            <SelectTrigger className="w-full bg-gray-800">
              <SelectValue placeholder="Si CSV no tiene departamento..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin departamento</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Input archivo */}
      <div className="space-y-4">
        <Label htmlFor="file-upload" className="text-white/80">Seleccionar Archivo</Label>
        <div className="flex items-center gap-4">
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept={allowedFormats.join(',')}
            onChange={onFileSelect}
            className="flex-1 bg-white/5 border-white/30 text-white"
            disabled={uploading}
          />
          <Button
            onClick={onFilePreview}
            disabled={!uploadFile || uploading}
            className="btn-gradient"
          >
            {uploading ? 'Procesando...' : <><Eye className="h-4 w-4 mr-2" />Vista Previa</>}
          </Button>
        </div>
        
        {uploadFile && (
          <p className="text-sm text-cyan-400">
            📎 {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Progress */}
      {uploading && uploadProgress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Procesando...</span>
            <span className="text-cyan-400">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200">{uploadError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}