// src/components/admin/UploadStep.tsx
// VERSIÓN MEJORADA - Balance Minimalismo + Estructura
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Eye, Upload } from 'lucide-react';
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
      
      {/* Formato Requerido - Con estructura */}
      <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <FileText className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white mb-3">
              Formato requerido: CSV o Excel con estas columnas:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                <span className="text-gray-300">Email</span>
                <span className="text-gray-500">(obligatorio)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                <span className="text-gray-400">Nombre, Departamento, Cargo, Ubicación</span>
                <span className="text-gray-600">(opcionales)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                <span className="text-cyan-400">FechaNacimiento</span>
                <span className="text-gray-500">(DD/MM/AAAA)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                <span className="text-cyan-400">Genero</span>
                <span className="text-gray-500">(M/F/No binario)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Template dentro del mismo card */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-800">
          <span className="text-sm text-gray-400">¿Necesitas un ejemplo?</span>
          <button
            onClick={onDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Descargar Template</span>
          </button>
        </div>
      </div>

      {/* Selector Departamento - Card separado */}
      {departments.length > 0 && (
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
          <Label className="text-sm font-medium text-white mb-3 block">
            Departamento por defecto (opcional)
          </Label>
          <Select
            value={selectedDepartmentId}
            onValueChange={onDepartmentChange}
          >
            <SelectTrigger className="bg-slate-900/50 border-gray-700 text-white hover:border-gray-600 focus:border-cyan-400 h-11">
              <SelectValue placeholder="Si CSV no tiene departamento..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="none" className="text-gray-400">
                No asignar departamento
              </SelectItem>
              {departments.map((dept) => (
                <SelectItem 
                  key={dept.id} 
                  value={dept.id}
                  className="text-white hover:bg-slate-800"
                >
                  {dept.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-2">
            Solo se usa si el CSV no especifica departamento
          </p>
        </div>
      )}

      {/* File Upload Area - Destacado */}
      <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
        <Label className="text-sm font-medium text-white mb-4 block">
          Seleccionar Archivo
        </Label>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative p-10 border-2 border-dashed rounded-lg cursor-pointer
            transition-all duration-300
            ${uploadFile 
              ? 'border-cyan-400 bg-cyan-400/10' 
              : 'border-gray-700 hover:border-cyan-500/50 hover:bg-white/5'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedFormats.join(',')}
            onChange={onFileSelect}
            className="hidden"
          />

          {!uploadFile ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                <Upload className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-base text-white font-medium mb-2">
                Arrastra tu archivo aquí
              </p>
              <p className="text-sm text-gray-400 mb-1">
                o haz click para seleccionar
              </p>
              <p className="text-xs text-gray-600">
                CSV, XLSX, XLS • Máximo 10MB
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-400/20">
                  <FileText className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    {uploadFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              
              {!uploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilePreview();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition-all"
                >
                  <Eye className="h-4 w-4" />
                  <span>Vista Previa</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white font-medium">Subiendo archivo...</span>
            <span className="text-sm text-cyan-400">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Error Display */}
      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-400 text-xs">✕</span>
            </div>
            <p className="text-sm text-red-400 flex-1">{uploadError}</p>
          </div>
        </div>
      )}
      
    </div>
  );
}