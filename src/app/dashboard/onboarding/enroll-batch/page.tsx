// src/app/dashboard/onboarding/enroll-batch/page.tsx
// Carga Masiva Onboarding - Con validación de ventana de fechas

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
  Clock,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useOnboardingBatchUpload } from '@/hooks/useOnboardingBatchUpload';
import { CyanButton, NeutralButton, SuccessButton, PurpleButton } from '@/components/ui/MinimalistButton';
import { parseEnrollmentError, validateHireDateWindow, type ParsedEnrollmentError } from '@/lib/utils/enrollment-error-parser';
import Papa from 'papaparse';
import '@/styles/focalizahr-design-system.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface Department {
  id: string;
  displayName: string;
}

interface FailureDetail {
  index: number;
  nationalId: string;
  fullName: string;
  error: string;
  parsedError: ParsedEnrollmentError;
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
    // Calcular fechas de ejemplo dentro de la ventana válida
    const today = new Date();
    const validPastDate = new Date(today);
    validPastDate.setDate(validPastDate.getDate() - 3); // 3 días atrás (válido)
    const validFutureDate = new Date(today);
    validFutureDate.setDate(validFutureDate.getDate() + 5); // 5 días adelante (válido)
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    const csvContent = [
      'RUT,Nombre,Email,Celular,Departamento,FechaIngreso,Cargo,Ubicacion,Genero,FechaNacimiento',
      `12345678-9,Juan Pérez,juan@empresa.cl,+56912345678,Ventas,${formatDate(validPastDate)},Ejecutivo,Santiago,M,1990-05-20`,
      `98765432-1,María García,maria@empresa.cl,+56987654321,TI,${formatDate(validFutureDate)},Developer,Valparaíso,F,1992-03-10`
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
          
          <div className="flex items-center gap-4 mb-4 mt-6">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl">
              <Upload className="h-7 w-7 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-light text-white">
              Carga{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Masiva Onboarding
              </span>
            </h1>
          </div>
          
          <p className="text-lg text-slate-400 font-light leading-relaxed max-w-3xl">
            Inscribe múltiples colaboradores al{' '}
            <span className="text-cyan-400 font-normal">Sistema Predictivo de Retención</span>.
            Cada uno recibirá 4 encuestas automáticas en días clave (1, 7, 30, 90).
          </p>
        </div>
        
        {/* Info Card Metodología + Ventana */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Card Metodología */}
          <div className="fhr-card border-l-4 border-l-cyan-400">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-400/10 rounded-xl flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-cyan-400" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Metodología 4C Bauer</h3>
                <div className="text-sm text-slate-400 space-y-1">
                  <p><span className="text-cyan-400 font-medium">Día 1:</span> Compliance</p>
                  <p><span className="text-cyan-400 font-medium">Día 7:</span> Clarification</p>
                  <p><span className="text-cyan-400 font-medium">Día 30:</span> Culture</p>
                  <p><span className="text-cyan-400 font-medium">Día 90:</span> Connection</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Card Ventana de Inscripción */}
          <div className="fhr-card border-l-4 border-l-amber-400">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-400/10 rounded-xl flex-shrink-0">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Ventana de Inscripción</h3>
                <div className="text-sm text-slate-300 space-y-2">
                  <p>
                    La fecha de ingreso debe estar dentro de{' '}
                    <span className="text-cyan-400 font-medium">±7 días</span> desde hoy.
                  </p>
                  <p className="text-slate-400 text-xs">
                    Esto asegura que la percepción del onboarding se capture en el momento óptimo.
                  </p>
                </div>
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
      <div className="fhr-card">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">
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
// COMPONENTE: PREVIEW (Con validación de fechas)
// ============================================================================

function PreviewStep({
  employees,
  validCount,
  invalidCount,
  canUpload,
  onConfirm,
  onCancel
}: any) {
  // Calcular estadísticas de fechas
  const dateStats = React.useMemo(() => {
    let windowExpired = 0;
    let tooEarly = 0;
    let validDates = 0;
    
    employees.forEach((emp: any) => {
      if (emp.hireDate) {
        const dateError = validateHireDateWindow(emp.hireDate);
        if (!dateError) {
          validDates++;
        } else if (dateError.type === 'window_expired') {
          windowExpired++;
        } else if (dateError.type === 'too_early') {
          tooEarly++;
        }
      }
    });
    
    return { windowExpired, tooEarly, validDates };
  }, [employees]);
  
  const hasDateWarnings = dateStats.windowExpired > 0 || dateStats.tooEarly > 0;
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="fhr-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-400">Total</span>
          </div>
          <p className="text-3xl font-semibold text-white">{employees.length}</p>
        </div>
        
        <div className="fhr-card p-4 border-l-4 border-l-green-400">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-sm text-slate-400">Válidos</span>
          </div>
          <p className="text-3xl font-semibold text-green-400">{validCount}</p>
        </div>
        
        <div className="fhr-card p-4 border-l-4 border-l-red-400">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-slate-400">Inválidos</span>
          </div>
          <p className="text-3xl font-semibold text-red-400">{invalidCount}</p>
        </div>
      </div>
      
      {/* Warning de fechas fuera de ventana */}
      {hasDateWarnings && (
        <div className="fhr-card border-l-4 border-l-amber-400 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-200 mb-1">
                Fechas fuera de ventana detectadas
              </h4>
              <p className="text-sm text-slate-300">
                {dateStats.windowExpired > 0 && (
                  <span className="block">
                    <span className="text-amber-400 font-medium">{dateStats.windowExpired}</span> con fecha de ingreso expirada (&gt;7 días pasado)
                  </span>
                )}
                {dateStats.tooEarly > 0 && (
                  <span className="block">
                    <span className="text-cyan-400 font-medium">{dateStats.tooEarly}</span> con fecha muy lejana (&gt;7 días futuro)
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Estos registros serán rechazados por el sistema. Revisa la columna "Fecha" en la tabla.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabla Preview */}
      <div className="fhr-card">
        <h3 className="text-lg font-semibold text-white mb-4">
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
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Fecha Ingreso</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 50).map((emp: any, idx: number) => {
                const dateError = emp.hireDate ? validateHireDateWindow(emp.hireDate) : null;
                const hasDateError = dateError !== null;
                const rowHasError = !emp.isValid || hasDateError;
                
                return (
                  <tr 
                    key={idx}
                    className={`border-b border-slate-800 ${
                      rowHasError ? 'bg-red-900/10' : ''
                    } ${hasDateError && emp.isValid ? 'bg-amber-900/10' : ''}`}
                  >
                    <td className="py-3 px-4">
                      {emp.isValid && !hasDateError ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : hasDateError && emp.isValid ? (
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
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
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${hasDateError ? (dateError.color === 'amber' ? 'text-amber-400' : 'text-cyan-400') : 'text-slate-400'}`}>
                          {emp.hireDate || '-'}
                        </span>
                        {hasDateError && (
                          dateError.type === 'window_expired' ? (
                            <Clock className="h-3 w-3 text-amber-400" />
                          ) : (
                            <Calendar className="h-3 w-3 text-cyan-400" />
                          )
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs space-y-1">
                        {emp.errors.length > 0 && (
                          <div className="text-red-400">
                            {emp.errors.join(', ')}
                          </div>
                        )}
                        {hasDateError && (
                          <div className={dateError.color === 'amber' ? 'text-amber-400' : 'text-cyan-400'}>
                            {dateError.message}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
        
        <div className="flex items-center gap-3">
          {hasDateWarnings && (
            <span className="text-xs text-amber-400">
              {dateStats.windowExpired + dateStats.tooEarly} serán rechazados
            </span>
          )}
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
// COMPONENTE: COMPLETE (Con tabla de fallos detallada)
// ============================================================================

function CompleteStep({ result, onReset, onContinue }: any) {
  const [showFailures, setShowFailures] = useState(true);
  
  // Parsear errores de los fallos
  const failures: FailureDetail[] = React.useMemo(() => {
    if (!result.results) return [];
    
    return result.results
      .filter((r: any) => !r.success)
      .map((r: any) => ({
        index: r.index,
        nationalId: r.nationalId,
        fullName: r.fullName,
        error: r.error,
        parsedError: parseEnrollmentError(r.error || 'Error desconocido')
      }));
  }, [result.results]);
  
  const hasFailures = failures.length > 0;
  
  // Agrupar fallos por tipo
  const failuresByType = React.useMemo(() => {
    const groups = {
      window_expired: [] as FailureDetail[],
      too_early: [] as FailureDetail[],
      validation: [] as FailureDetail[],
      generic: [] as FailureDetail[]
    };
    
    failures.forEach(f => {
      groups[f.parsedError.type].push(f);
    });
    
    return groups;
  }, [failures]);
  
  return (
    <div className="space-y-6">
      {/* Card Principal de Éxito */}
      <div className={`fhr-card text-center py-12 ${hasFailures ? 'border-amber-400/30' : 'border-green-400/30'}`}>
        <div className={`w-20 h-20 rounded-full ${hasFailures ? 'bg-amber-400/20' : 'bg-green-400/20'} flex items-center justify-center mx-auto mb-6`}>
          {hasFailures ? (
            <AlertTriangle className="w-10 h-10 text-amber-400" />
          ) : (
            <CheckCircle className="w-10 h-10 text-green-400" />
          )}
        </div>
        
        <h3 className="text-2xl font-semibold text-white mb-2">
          {hasFailures ? 'Carga Parcialmente Exitosa' : '¡Carga Exitosa!'}
        </h3>
        
        <p className="text-slate-400 mb-8">
          {hasFailures 
            ? 'Algunos colaboradores no pudieron ser inscritos'
            : 'Todos los colaboradores han sido inscritos en el sistema de onboarding'
          }
        </p>
        
        {/* Stats Grid */}
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Journeys creados</p>
            <p className="text-3xl font-semibold text-green-400">{result.successCount}</p>
          </div>
          {hasFailures && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">No procesados</p>
              <p className="text-3xl font-semibold text-amber-400">{result.failureCount}</p>
            </div>
          )}
        </div>
        
        {/* Botones principales */}
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
      
      {/* Tabla de Fallos Detallada */}
      {hasFailures && (
        <div className="fhr-card">
          <button
            onClick={() => setShowFailures(!showFailures)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">
                Detalle de Errores ({failures.length})
              </h3>
            </div>
            {showFailures ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>
          
          {showFailures && (
            <div className="mt-6 space-y-4">
              {/* Resumen por tipo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {failuresByType.window_expired.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-amber-300">
                      {failuresByType.window_expired.length} ventana expirada
                    </span>
                  </div>
                )}
                {failuresByType.too_early.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <Calendar className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-cyan-300">
                      {failuresByType.too_early.length} fecha muy lejana
                    </span>
                  </div>
                )}
                {(failuresByType.validation.length + failuresByType.generic.length) > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-300">
                      {failuresByType.validation.length + failuresByType.generic.length} otros errores
                    </span>
                  </div>
                )}
              </div>
              
              {/* Tabla detallada */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">RUT</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Nombre</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failures.map((failure, idx) => (
                      <tr key={idx} className="border-b border-slate-800">
                        <td className="py-3 px-4 font-mono text-xs text-slate-300">
                          {failure.nationalId}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {failure.fullName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {failure.parsedError.icon === 'clock' && <Clock className="h-4 w-4 text-amber-400" />}
                            {failure.parsedError.icon === 'calendar' && <Calendar className="h-4 w-4 text-cyan-400" />}
                            {failure.parsedError.icon === 'alert' && <AlertCircle className="h-4 w-4 text-red-400" />}
                            {failure.parsedError.icon === 'x' && <XCircle className="h-4 w-4 text-red-400" />}
                            <span className={`text-sm ${
                              failure.parsedError.color === 'amber' ? 'text-amber-300' :
                              failure.parsedError.color === 'cyan' ? 'text-cyan-300' :
                              'text-red-300'
                            }`}>
                              {failure.parsedError.message}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Tip para errores de ventana */}
              {(failuresByType.window_expired.length > 0 || failuresByType.too_early.length > 0) && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">¿Por qué importa la ventana de inscripción?</strong>
                  </p>
                  <ul className="text-sm text-slate-400 mt-2 space-y-1">
                    <li>• La percepción del onboarding se forma en los <span className="text-cyan-400">primeros días</span></li>
                    <li>• Inscribir a tiempo permite <span className="text-cyan-400">detectar alertas</span> y corregir oportunamente</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
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
      
      <h3 className="text-2xl font-semibold text-white mb-2">
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