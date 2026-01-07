// src/app/dashboard/exit/register-batch/page.tsx
// Carga Masiva Exit Intelligence - Registro de salidas masivo

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
  Phone,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  UserMinus,
  FileText
} from 'lucide-react';
import { useExitBatchUpload, EXIT_REASON_LABELS, type ExitEmployee, type ExitReason } from '@/hooks/useExitBatchUpload';
import { CyanButton, NeutralButton, SuccessButton, PurpleButton } from '@/components/ui/MinimalistButton';
import '@/styles/focalizahr-design-system.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface Department {
  id: string;
  displayName: string;
}

interface FailureDetail {
  nationalId: string;
  fullName: string;
  error: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ExitBatchUploadPage() {
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
    downloadTemplate,
    reset
  } = useExitBatchUpload({
    onSuccess: (result) => {
      console.log('✅ Exit batch upload exitoso:', result);
    },
    onError: (error) => {
      console.error('❌ Exit batch upload error:', error);
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
  
  const handleFileSelect = async (file: File) => {
    await parseFile(file, departmentMap);
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (loadingDepartments) {
    return (
      <div className="min-h-screen fhr-bg-main flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400">Cargando departamentos...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen fhr-bg-main p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
              <UserMinus className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Registro Masivo de Salidas
              </h1>
              <p className="text-slate-400">
                Carga múltiples registros de salida desde un archivo CSV
              </p>
            </div>
          </div>
        </div>
        
        {/* INFO CARD */}
        <div className="fhr-card mb-6 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-300 text-sm">
                <strong className="text-white">Campos obligatorios:</strong> RUT, Nombre, Departamento, Fecha Salida, y al menos Email o Celular.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                El motivo de salida es opcional pero recomendado para análisis comparativo con encuesta.
              </p>
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
            onContinue={() => router.push('/dashboard/exit/records')}
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
// COMPONENTE: UPLOAD DROPZONE
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
            ? 'border-red-400 bg-red-400/10' 
            : 'border-slate-600 hover:border-red-400/50'
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
        
        <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-red-400' : 'text-slate-500'}`} />
        
        <p className="text-white font-medium mb-2">
          Arrastra tu archivo CSV aquí
        </p>
        <p className="text-slate-400 text-sm">
          o haz clic para seleccionar
        </p>
      </div>
      
      {/* Download Template Button */}
      <div className="flex justify-center">
        <NeutralButton
          onClick={(e) => {
            e.stopPropagation();
            onDownloadTemplate();
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar Plantilla CSV
        </NeutralButton>
      </div>
      
      {/* Campos Info */}
      <div className="fhr-card p-4">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          Formato del archivo
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-2 rounded bg-slate-800/50">
            <span className="text-red-400">*</span> RUT
          </div>
          <div className="p-2 rounded bg-slate-800/50">
            <span className="text-red-400">*</span> Nombre
          </div>
          <div className="p-2 rounded bg-slate-800/50">
            <span className="text-red-400">*</span> Departamento
          </div>
          <div className="p-2 rounded bg-slate-800/50">
            <span className="text-red-400">*</span> Fecha Salida
          </div>
          <div className="p-2 rounded bg-slate-800/50">
            <span className="text-yellow-400">†</span> Email
          </div>
          <div className="p-2 rounded bg-slate-800/50">
            <span className="text-yellow-400">†</span> Celular
          </div>
          <div className="p-2 rounded bg-slate-800/50 text-slate-400">
            Motivo
          </div>
          <div className="p-2 rounded bg-slate-800/50 text-slate-400">
            Cargo
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          <span className="text-red-400">*</span> Obligatorio &nbsp;|&nbsp; 
          <span className="text-yellow-400">†</span> Al menos uno requerido
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: PARSING STEP
// ============================================================================

function ParsingStep() {
  return (
    <div className="fhr-card p-12 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-red-400 mx-auto mb-4" />
      <p className="text-white font-medium">Procesando archivo...</p>
      <p className="text-slate-400 text-sm mt-2">
        Validando datos y verificando departamentos
      </p>
    </div>
  );
}

// ============================================================================
// COMPONENTE: PREVIEW STEP
// ============================================================================

function PreviewStep({
  employees,
  validCount,
  invalidCount,
  canUpload,
  onConfirm,
  onCancel
}: {
  employees: ExitEmployee[];
  validCount: number;
  invalidCount: number;
  canUpload: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [showInvalid, setShowInvalid] = useState(true);
  const [showValid, setShowValid] = useState(false);
  
  const invalidEmployees = employees.filter(e => !e.isValid);
  const validEmployees = employees.filter(e => e.isValid);
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="fhr-card p-4 text-center">
          <Users className="h-6 w-6 text-slate-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{employees.length}</p>
          <p className="text-slate-400 text-sm">Total registros</p>
        </div>
        <div className="fhr-card p-4 text-center border-green-500/30">
          <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-400">{validCount}</p>
          <p className="text-slate-400 text-sm">Válidos</p>
        </div>
        <div className="fhr-card p-4 text-center border-red-500/30">
          <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-400">{invalidCount}</p>
          <p className="text-slate-400 text-sm">Con errores</p>
        </div>
      </div>
      
      {/* Invalid Records */}
      {invalidCount > 0 && (
        <div className="fhr-card overflow-hidden">
          <button
            onClick={() => setShowInvalid(!showInvalid)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-400" />
              <span className="text-white font-medium">
                Registros con errores ({invalidCount})
              </span>
            </div>
            {showInvalid ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </button>
          
          {showInvalid && (
            <div className="border-t border-slate-700 max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left text-slate-400">RUT</th>
                    <th className="p-3 text-left text-slate-400">Nombre</th>
                    <th className="p-3 text-left text-slate-400">Errores</th>
                  </tr>
                </thead>
                <tbody>
                  {invalidEmployees.map((emp, idx) => (
                    <tr key={idx} className="border-t border-slate-700/50">
                      <td className="p-3 text-white font-mono text-xs">
                        {emp.nationalId || '-'}
                      </td>
                      <td className="p-3 text-slate-300">
                        {emp.fullName || '-'}
                      </td>
                      <td className="p-3">
                        <ul className="text-red-400 text-xs space-y-1">
                                  {emp.errors.map((err, i) => (
                                      <li key={i}>• {err}</li>
                                  ))}
                              </ul>
                          </td>
                      </tr>
                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          )}

          {/* Valid Records */}
          {validCount > 0 && (
              <div className="fhr-card overflow-hidden">
                  <button
                      onClick={() => setShowValid(!showValid)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
                  >
                      <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <span className="text-white font-medium">
                              Registros válidos ({validCount})
                          </span>
                      </div>
                      {showValid ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </button>

                  {showValid && (
                      <div className="border-t border-slate-700 max-h-64 overflow-y-auto">
                          <table className="w-full text-sm">
                              <thead className="bg-slate-800/50 sticky top-0">
                                  <tr>
                                      <th className="p-3 text-left text-slate-400">RUT</th>
                                      <th className="p-3 text-left text-slate-400">Nombre</th>
                                      <th className="p-3 text-left text-slate-400">Departamento</th>
                                      <th className="p-3 text-left text-slate-400">Fecha Salida</th>
                                      <th className="p-3 text-left text-slate-400">Contacto</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {validEmployees.map((emp, idx) => (
                                      <tr key={idx} className="border-t border-slate-700/50">
                                          <td className="p-3 text-white font-mono text-xs">
                                              {emp.nationalId}
                                          </td>
                                          <td className="p-3 text-slate-300">
                                              {emp.fullName}
                                          </td>
                                          <td className="p-3 text-slate-400 text-xs">
                                              {emp.departmentName || emp.departmentId.slice(0, 8)}
                                          </td>
                                          <td className="p-3 text-slate-400 text-xs">
                                              {emp.exitDate}
                                          </td>
                                          <td className="p-3">
                                              <div className="flex gap-2">
                                                  {emp.email && (
                                                      <span title={emp.email}>
                                                          <Mail className="h-4 w-4 text-cyan-400" />
                                                      </span>
                                                  )}
                                                  {emp.phoneNumber && (
                                                      <span title={emp.phoneNumber}>
                                                          <Phone className="h-4 w-4 text-green-400" />
                                                      </span>
                                                  )}
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <NeutralButton onClick={onCancel}>
          Cancelar
        </NeutralButton>
        <PurpleButton 
          onClick={onConfirm}
          disabled={!canUpload}
        >
          <Upload className="h-4 w-4 mr-2" />
          Registrar {validCount} salida{validCount !== 1 ? 's' : ''}
        </PurpleButton>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: UPLOADING STEP
// ============================================================================

function UploadingStep({ progress }: { progress: number }) {
  return (
    <div className="fhr-card p-12 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-red-400 mx-auto mb-4" />
      <p className="text-white font-medium mb-4">Registrando salidas...</p>
      
      <div className="w-full max-w-md mx-auto bg-slate-700 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-slate-400 text-sm mt-2">{progress}%</p>
    </div>
  );
}

// ============================================================================
// COMPONENTE: COMPLETE STEP
// ============================================================================

function CompleteStep({
  result,
  onReset,
  onContinue
}: {
  result: {
    success: boolean;
    total: number;
    processed: number;
    failed: number;
    results: Array<{ nationalId: string; success: boolean; error?: string }>;
  };
  onReset: () => void;
  onContinue: () => void;
}) {
  const [showFailures, setShowFailures] = useState(false);
  const failures = result.results.filter(r => !r.success);
  
  return (
    <div className="space-y-6">
      {/* Success Card */}
      <div className="fhr-card p-8 text-center border-green-500/30">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          ¡Registro Completado!
        </h2>
        <p className="text-slate-400">
          Se registraron {result.processed} de {result.total} salidas exitosamente
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="fhr-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{result.total}</p>
          <p className="text-slate-400 text-sm">Total procesados</p>
        </div>
        <div className="fhr-card p-4 text-center border-green-500/30">
          <p className="text-2xl font-bold text-green-400">{result.processed}</p>
          <p className="text-slate-400 text-sm">Exitosos</p>
        </div>
        <div className="fhr-card p-4 text-center border-red-500/30">
          <p className="text-2xl font-bold text-red-400">{result.failed}</p>
          <p className="text-slate-400 text-sm">Fallidos</p>
        </div>
      </div>
      
      {/* Failures Detail */}
      {failures.length > 0 && (
        <div className="fhr-card overflow-hidden">
          <button
            onClick={() => setShowFailures(!showFailures)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-medium">
                Registros no procesados ({failures.length})
              </span>
            </div>
            {showFailures ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </button>
          
          {showFailures && (
            <div className="border-t border-slate-700 max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left text-slate-400">RUT</th>
                    <th className="p-3 text-left text-slate-400">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {failures.map((f, idx) => (
                    <tr key={idx} className="border-t border-slate-700/50">
                      <td className="p-3 text-white font-mono text-xs">
                        {f.nationalId}
                      </td>
                      <td className="p-3 text-red-400 text-xs">
                        {f.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <NeutralButton onClick={onReset}>
          Cargar Más
        </NeutralButton>
        <SuccessButton onClick={onContinue}>
          Ver Registros de Salida
        </SuccessButton>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: ERROR STEP
// ============================================================================

function ErrorStep({
  error,
  onReset,
  onCancel
}: {
  error: string;
  onReset: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="fhr-card p-8 text-center border-red-500/30">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Error en el proceso
        </h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto whitespace-pre-line">
          {error}
        </p>
      </div>
      
      <div className="flex justify-center gap-3">
        <NeutralButton onClick={onCancel}>
          Cancelar
        </NeutralButton>
        <CyanButton onClick={onReset}>
          Reintentar
        </CyanButton>
      </div>
    </div>
  );
}