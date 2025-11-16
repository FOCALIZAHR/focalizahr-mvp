// src/app/dashboard/onboarding/enroll-batch/page.tsx
// Carga Masiva Onboarding - Reutilizando componentes existentes

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Users,
  ArrowLeft,
  Loader2,
  Mail,
  Phone
} from 'lucide-react';
import { useOnboardingBatchUpload } from '@/hooks/useOnboardingBatchUpload';
import { CyanButton, NeutralButton, SuccessButton, PurpleButton } from '@/components/ui/MinimalistButton';
import Papa from 'papaparse';
import '@/styles/focalizahr-design-system.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface Department {
  id: string;
  displayName: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function OnboardingBatchUploadPage() {
  const router = useRouter();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentMap, setDepartmentMap] = useState<Map<string, string>>(new Map());
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  
  const {
    state,
    employees,
    uploadResult,
    error,
    uploadProgress,
    validCount,
    invalidCount,
    canUpload,
    parseFile,
    confirmUpload,
    reset
  } = useOnboardingBatchUpload({
    onSuccess: (result) => {
      console.log('✅ Upload exitoso:', result);
    },
    onError: (error) => {
      console.error('❌ Upload error:', error);
    }
  });
  
  // ============================================================================
  // CARGAR DEPARTAMENTOS
  // ============================================================================
  
  useEffect(() => {
    async function loadDepartments() {
      try {
        const response = await fetch('/api/departments', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Error cargando departamentos');
        }
        
        const data = await response.json();
        const depts = data.departments || [];
        setDepartments(depts);
        
        // Crear mapa nombre → id
        const map = new Map<string, string>();
        depts.forEach((dept: Department) => {
          map.set(dept.displayName.trim().toLowerCase(), dept.id);
        });
        setDepartmentMap(map);
        
      } catch (err) {
        console.error('Error loading departments:', err);
      } finally {
        setLoadingDepartments(false);
      }
    }
    
    loadDepartments();
  }, []);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleFileSelect = (file: File) => {
    parseFile(file, departmentMap);
  };
  
  const downloadTemplate = () => {
    const csvContent = [
      'RUT,Nombre,Email,Celular,Departamento,FechaIngreso,Cargo,Ubicacion,Genero,FechaNacimiento',
      '12345678-9,Juan Pérez,juan@empresa.cl,+56912345678,Ventas,2025-01-15,Ejecutivo,Santiago,M,1990-05-20',
      '98765432-1,María García,maria@empresa.cl,+56987654321,TI,2025-02-01,Developer,Valparaíso,F,1992-03-10'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_onboarding_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  
  // ============================================================================
  // LOADING STATE
  // ============================================================================
  
  if (loadingDepartments) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="fhr-bg-main fhr-bg-pattern min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-12">
          <NeutralButton
            icon={ArrowLeft}
            iconPosition="left"
            size="sm"
            onClick={() => router.back()}
          >
            Volver
          </NeutralButton>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl">
              <Upload className="h-7 w-7 text-cyan-400" />
            </div>
            <h1 className="fhr-title-gradient text-4xl font-bold">
              Carga Masiva Onboarding
            </h1>
          </div>
          
          <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
            Inscribe múltiples colaboradores al{' '}
            <span className="text-cyan-400 font-medium">Sistema Predictivo de Retención</span>.
            Cada uno recibirá 4 encuestas automáticas en días clave (1, 7, 30, 90).
          </p>
        </div>
        
        {/* Info Card Metodología */}
        <div className="fhr-card border-l-4 border-l-cyan-400 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-400/10 rounded-xl flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-cyan-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="fhr-subtitle text-lg mb-2">Metodología 4C Bauer</h3>
              <div className="text-sm text-slate-400 space-y-2">
                <p>
                  <span className="text-cyan-300 font-medium">Día 1:</span> Compliance (primera impresión)
                </p>
                <p>
                  <span className="text-cyan-300 font-medium">Día 7:</span> Clarification (claridad del rol)
                </p>
                <p>
                  <span className="text-cyan-300 font-medium">Día 30:</span> Culture (integración cultural)
                </p>
                <p>
                  <span className="text-cyan-300 font-medium">Día 90:</span> Connection (consolidación)
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* STEPS */}
        {state === 'idle' && (
          <UploadDropzone 
            onFileSelect={handleFileSelect}
            onDownloadTemplate={downloadTemplate}
          />
        )}
        
        {state === 'parsing' && <ParsingStep />}
        
        {state === 'preview' && (
          <PreviewStep
            employees={employees}
            validCount={validCount}
            invalidCount={invalidCount}
            canUpload={canUpload}
            onConfirm={confirmUpload}
            onCancel={reset}
          />
        )}
        
        {state === 'uploading' && (
          <UploadingStep progress={uploadProgress} />
        )}
        
        {state === 'complete' && uploadResult && (
          <CompleteStep
            result={uploadResult}
            onReset={reset}
            onContinue={() => router.push('/dashboard/onboarding/pipeline')}
          />
        )}
        
        {state === 'error' && error && (
          <ErrorStep
            error={error}
            onReset={reset}
            onCancel={() => router.back()}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: UPLOAD DROPZONE (Adaptado de ExcelDropzone)
// ============================================================================

function UploadDropzone({ 
  onFileSelect, 
  onDownloadTemplate 
}: {
  onFileSelect: (file: File) => void;
  onDownloadTemplate: () => void;
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          fhr-card border-2 border-dashed p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-cyan-400 bg-cyan-400/10' 
            : 'border-slate-600 hover:border-cyan-400/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          className="hidden"
        />
        
        <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Arrastra tu archivo CSV aquí
        </h3>
        <p className="text-slate-400">o haz clic para seleccionar</p>
      </div>
      
      {/* Botón Template */}
      <div className="flex justify-center">
        <PurpleButton
          icon={Download}
          iconPosition="left"
          size="md"
          onClick={onDownloadTemplate}
        >
          Descargar Template CSV
        </PurpleButton>
      </div>
      
      {/* Info Columnas */}
      <div className="fhr-card-simple">
        <h4 className="text-sm font-medium text-slate-300 mb-3">
          Columnas obligatorias:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {['RUT', 'Nombre', 'Email/Celular', 'Departamento', 'FechaIngreso'].map(col => (
            <div key={col} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-slate-400">{col}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: PARSING
// ============================================================================

function ParsingStep() {
  return (
    <div className="fhr-card text-center py-16">
      <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto mb-6" />
      <h3 className="text-xl font-semibold text-white mb-2">
        Procesando archivo...
      </h3>
    </div>
  );
}

// ============================================================================
// COMPONENTE: PREVIEW (Adaptado de DataPreviewTable)
// ============================================================================

function PreviewStep({
  employees,
  validCount,
  invalidCount,
  canUpload,
  onConfirm,
  onCancel
}: any) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="fhr-card-metric">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-400">Total</span>
          </div>
          <p className="text-3xl font-bold text-white">{employees.length}</p>
        </div>
        
        <div className="fhr-card-metric border-l-green-400">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-sm text-slate-400">Válidos</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{validCount}</p>
        </div>
        
        <div className="fhr-card-metric border-l-red-400">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-slate-400">Inválidos</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{invalidCount}</p>
        </div>
      </div>
      
      {/* Tabla Preview */}
      <div className="fhr-card">
        <h3 className="fhr-subtitle text-lg mb-4">
          Vista Previa ({employees.length} empleados)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">RUT</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Nombre</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Contacto</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Departamento</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Errores</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 50).map((emp: any, idx: number) => (
                <tr 
                  key={idx}
                  className={`border-b border-slate-800 ${!emp.isValid ? 'bg-red-900/10' : ''}`}
                >
                  <td className="py-3 px-4">
                    {emp.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-300">
                    {emp.nationalId}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {emp.fullName}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 text-xs">
                      {emp.participantEmail && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{emp.participantEmail}</span>
                        </div>
                      )}
                      {emp.phoneNumber && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Phone className="h-3 w-3" />
                          <span>{emp.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    {emp.departmentName || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {emp.errors.length > 0 && (
                      <div className="text-xs text-red-400">
                        {emp.errors.join(', ')}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {employees.length > 50 && (
            <div className="text-center py-4 text-sm text-slate-500">
              Mostrando primeros 50 de {employees.length}
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <NeutralButton
          icon={XCircle}
          iconPosition="left"
          size="md"
          onClick={onCancel}
        >
          Cancelar
        </NeutralButton>
        
        <CyanButton
          icon={Upload}
          iconPosition="left"
          size="md"
          onClick={onConfirm}
          disabled={!canUpload}
        >
          Confirmar Carga ({validCount} empleados)
        </CyanButton>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: UPLOADING
// ============================================================================

function UploadingStep({ progress }: { progress: number }) {
  return (
    <div className="fhr-card text-center py-16">
      <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto mb-6" />
      <h3 className="text-xl font-semibold text-white mb-4">
        Creando journeys de onboarding...
      </h3>
      <div className="max-w-md mx-auto">
        <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-slate-400">{progress}%</p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: COMPLETE
// ============================================================================

function CompleteStep({ result, onReset, onContinue }: any) {
  return (
    <div className="fhr-card border-green-400/30 text-center py-16">
      <div className="w-20 h-20 rounded-full bg-green-400/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-2">
        ¡Carga Exitosa!
      </h3>
      
      <p className="text-slate-400 mb-8">
        Los colaboradores han sido inscritos en el sistema de onboarding
      </p>
      
      <div className="max-w-md mx-auto bg-slate-800/50 rounded-lg p-6 mb-8">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Journeys creados:</span>
            <span className="font-semibold text-green-400">{result.successCount}</span>
          </div>
          {result.failureCount > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">Fallos:</span>
              <span className="font-semibold text-red-400">{result.failureCount}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4">
        <PurpleButton
          icon={Upload}
          iconPosition="left"
          size="md"
          onClick={onReset}
        >
          Cargar Más
        </PurpleButton>
        
        <CyanButton
          icon={CheckCircle}
          iconPosition="left"
          size="md"
          onClick={onContinue}
        >
          Ver Pipeline
        </CyanButton>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: ERROR
// ============================================================================

function ErrorStep({ error, onReset, onCancel }: any) {
  return (
    <div className="fhr-card border-red-400/30 text-center py-16">
      <div className="w-20 h-20 rounded-full bg-red-400/20 flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-400" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-2">
        Error en la Carga
      </h3>
      
      <p className="text-slate-400 mb-8 max-w-md mx-auto">
        {error}
      </p>
      
      <div className="flex items-center justify-center gap-4">
        <NeutralButton
          icon={ArrowLeft}
          iconPosition="left"
          size="md"
          onClick={onCancel}
        >
          Volver
        </NeutralButton>
        
        <CyanButton
          icon={Upload}
          iconPosition="left"
          size="md"
          onClick={onReset}
        >
          Intentar Nuevamente
        </CyanButton>
      </div>
    </div>
  );
}