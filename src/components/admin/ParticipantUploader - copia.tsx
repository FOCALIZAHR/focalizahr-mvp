// ====================================================================
// FOCALIZAHR PARTICIPANTUPLOADER v2.0 - COMPONENTE TONTO
// src/components/admin/ParticipantUploader.tsx  
// FASE 2.3: UI Component - 100% Sin Lógica de Negocio
// ====================================================================

'use client';

import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Download,
  Trash2,
  Send,
  Users,
  UserCheck,
  Calendar,
  MapPin
} from 'lucide-react';

import { useParticipantUploader, UseParticipantUploaderProps } from '@/hooks/useParticipantUploader';

// ✅ PROPS INTERFACE - SIMPLIFICADA
interface ParticipantUploaderProps extends UseParticipantUploaderProps {
  allowedFormats?: string[];
  showPreview?: boolean;
  mode?: 'admin' | 'client';
}

// ✅ COMPONENTE PRINCIPAL - 100% TONTO
export default function ParticipantUploader({
  campaignId,
  campaignName,
  onUploadComplete,
  onError,
  maxParticipants = 500,
  autoResolveConflicts = true,
  allowedFormats = ['.csv', '.xlsx', '.xls'],
  showPreview = true,
  mode = 'admin'
}: ParticipantUploaderProps) {
  
  // ✅ HOOK CEREBRO - ÚNICA FUENTE DE LÓGICA
  const {
    state,
    uploadFile,
    resolveConflict,
    confirmUpload,
    resetUploader,
    isLoading,
    hasConflicts,
    isReady,
    isComplete,
    hasError,
    progress,
    conflicts,
    participants,
    result,
    error,
    departments,
    loadingDepartments,
    demographicsDetected
  } = useParticipantUploader({
    campaignId,
    campaignName,
    onUploadComplete,
    onError,
    maxParticipants,
    autoResolveConflicts
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ HANDLERS TONTOS - SOLO DELEGACIÓN
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleReset = () => {
    resetUploader();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'email,name,department,position,location,dateOfBirth,gender',
      'juan.perez@empresa.com,Juan Pérez,Desarrollo,Developer,Santiago,1990-05-15,MALE',
      'maria.gonzalez@empresa.com,María González,Recursos Humanos,Manager,Valparaíso,1985-09-22,FEMALE',
      'alex.smith@empresa.com,Alex Smith,Marketing,Coordinator,,1995-03-10,NON_BINARY'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_participantes_v2.csv';
    link.click();
  };

  // ✅ RENDER WIZARD DE 5 PASOS
  return (
    <div className="space-y-6">
      {/* HEADER CON INFO CAMPAÑA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Carga de Participantes v2.0</h2>
            <p className="text-blue-100">
              Campaña: <span className="font-semibold">{campaignName}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{maxParticipants}</div>
              <div className="text-sm text-blue-200">Máximo</div>
            </div>
            <Users className="h-12 w-12 text-blue-200" />
          </div>
        </div>
        
        {/* PROGRESS BAR WIZARD */}
        <div className="mt-4">
          <WizardProgress state={state} />
        </div>
      </div>

      {/* PASO 1: SELECCIÓN ARCHIVO */}
      {state.status === 'idle' && (
        <FileSelectionStep 
          allowedFormats={allowedFormats}
          onFileSelect={handleFileSelect}
          onDownloadTemplate={downloadTemplate}
          fileInputRef={fileInputRef}
        />
      )}

      {/* PASO 2: UPLOADING/PROCESSING */}
      {(state.status === 'uploading' || state.status === 'processing') && (
        <ProcessingStep 
          status={state.status}
          progress={progress}
          fileName={state.file?.name}
        />
      )}

      {/* PASO 3: RESOLUCIÓN CONFLICTOS */}
      {hasConflicts && (
        <ConflictResolutionStep 
          conflicts={conflicts}
          departments={departments}
          onResolveConflict={resolveConflict}
        />
      )}

      {/* PASO 4: PREVIEW Y CONFIRMACIÓN */}
      {isReady && (
        <PreviewAndConfirmStep 
          participants={participants}
          demographicsDetected={demographicsDetected}
          showPreview={showPreview}
          onConfirm={confirmUpload}
          onReset={handleReset}
        />
      )}

      {/* PASO 5: CONFIRMANDO */}
      {state.status === 'confirming' && (
        <ConfirmingStep progress={progress} />
      )}

      {/* RESULTADO FINAL */}
      {isComplete && result && (
        <CompletionStep 
          result={result}
          onReset={handleReset}
        />
      )}

      {/* ERROR STATE */}
      {hasError && (
        <ErrorStep 
          error={error}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

// ✅ SUBCOMPONENTES TONTOS ESPECIALIZADOS

function WizardProgress({ state }: { state: any }) {
  const steps = [
    { name: 'Seleccionar', status: state.status },
    { name: 'Procesar', status: state.status },
    { name: 'Conflictos', status: state.status },
    { name: 'Preview', status: state.status },
    { name: 'Completar', status: state.status }
  ];
  
  const currentStep = 
    state.status === 'idle' ? 0 :
    state.status === 'uploading' || state.status === 'processing' ? 1 :
    state.status === 'conflicts' ? 2 :
    state.status === 'ready' ? 3 :
    state.status === 'confirming' || state.status === 'complete' ? 4 : 0;

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.name} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${index <= currentStep 
              ? 'bg-white text-blue-600' 
              : 'bg-blue-500 text-blue-200'}
          `}>
            {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
          </div>
          <span className="ml-2 text-sm font-medium">{step.name}</span>
          {index < steps.length - 1 && (
            <div className={`
              w-16 h-1 mx-4 rounded
              ${index < currentStep ? 'bg-white' : 'bg-blue-500'}
            `} />
          )}
        </div>
      ))}
    </div>
  );
}

function FileSelectionStep({ 
  allowedFormats, 
  onFileSelect, 
  onDownloadTemplate, 
  fileInputRef 
}: {
  allowedFormats: string[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <Card className="border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Upload className="h-6 w-6" />
          Seleccionar Archivo de Participantes
        </CardTitle>
        <CardDescription>
          Formatos soportados: {allowedFormats.join(', ')} • Máximo 10MB • ✨ Ahora con demografía
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="btn-gradient focus-ring"
            size="lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            Subir Archivo
          </Button>
          
          <Button
            variant="outline"
            onClick={onDownloadTemplate}
            size="lg"
          >
            <Download className="h-5 w-5 mr-2" />
            Descargar Template v2.0
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={allowedFormats.join(',')}
          onChange={onFileSelect}
          className="hidden"
        />

        {/* NUEVAS CARACTERÍSTICAS v2.0 */}
        <Alert className="bg-blue-50 border-blue-200">
          <UserCheck className="h-4 w-4" />
          <AlertDescription>
            <strong>Nuevo en v2.0:</strong> Soporte para campos demográficos opcionales:
            <ul className="list-disc list-inside mt-2 text-sm">
              <li><strong>Fecha de Nacimiento:</strong> Para análisis generacionales</li>
              <li><strong>Género:</strong> Para métricas de diversidad e inclusión</li>
              <li><strong>Smart Matching:</strong> Departamentos automáticamente reconocidos</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

function ProcessingStep({ 
  status, 
  progress, 
  fileName 
}: {
  status: string;
  progress: number;
  fileName?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          {status === 'uploading' ? 'Subiendo archivo...' : 'Procesando participantes...'}
        </CardTitle>
        <CardDescription>
          {fileName && `Archivo: ${fileName}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          <div className="text-center text-sm text-gray-600">
            {status === 'uploading' && 'Verificando archivo y estructura...'}
            {status === 'processing' && 'Analizando participantes y detectando demografía...'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConflictResolutionStep({ 
  conflicts, 
  departments, 
  onResolveConflict 
}: {
  conflicts: any[];
  departments: any[];
  onResolveConflict: (email: string, department: string) => void;
}) {
  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <AlertTriangle className="h-6 w-6" />
          Resolver Conflictos de Departamentos
        </CardTitle>
        <CardDescription>
          Se encontraron {conflicts.length} departamentos no reconocidos que requieren tu atención.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conflicts.map((conflict, index) => (
            <div key={index} className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{conflict.participantEmail}</p>
                  <p className="text-sm text-gray-600">
                    Departamento original: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {conflict.originalDepartment}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="mt-3">
                <Label className="text-sm font-medium">Seleccionar departamento correcto:</Label>
                <Select onValueChange={(value) => onResolveConflict(conflict.participantEmail, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.displayName}>
                        {dept.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewAndConfirmStep({ 
  participants, 
  demographicsDetected, 
  showPreview, 
  onConfirm, 
  onReset 
}: {
  participants: any[];
  demographicsDetected: any;
  showPreview: boolean;
  onConfirm: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* STATS DEMOGRÁFICOS */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Análisis Completado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{participants.length}</div>
              <div className="text-sm text-gray-600">Participantes</div>
            </div>
            
            {demographicsDetected?.hasDateOfBirth && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.values(demographicsDetected.ageRanges || {}).reduce((a: number, b: any) => a + b, 0)}
                </div>
                <div className="text-sm text-gray-600">Con Edad</div>
              </div>
            )}
            
            {demographicsDetected?.hasGender && (
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.values(demographicsDetected.genderDistribution || {}).reduce((a: number, b: any) => a + b, 0)}
                </div>
                <div className="text-sm text-gray-600">Con Género</div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {participants.filter(p => p.department).length}
              </div>
              <div className="text-sm text-gray-600">Con Depto</div>
            </div>
          </div>

          {/* DISTRIBUCIONES */}
          {demographicsDetected?.hasGender && (
            <div className="mt-4 p-3 bg-white rounded border">
              <h4 className="font-medium mb-2">Distribución por Género:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(demographicsDetected.genderDistribution || {}).map(([gender, count]) => (
                  <Badge key={gender} variant="secondary">
                    {gender}: {count as number}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PREVIEW TABLA */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Participantes</CardTitle>
            <CardDescription>
              Primeros {Math.min(5, participants.length)} participantes de {participants.length} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Nombre</th>
                    <th className="text-left py-2">Departamento</th>
                    <th className="text-left py-2">Cargo</th>
                    {demographicsDetected?.hasDateOfBirth && <th className="text-left py-2">Edad</th>}
                    {demographicsDetected?.hasGender && <th className="text-left py-2">Género</th>}
                  </tr>
                </thead>
                <tbody>
                  {participants.slice(0, 5).map((participant, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-mono text-xs">{participant.email}</td>
                      <td className="py-2">{participant.name || '-'}</td>
                      <td className="py-2">
                        {participant.departmentSuggestion || participant.department || '-'}
                      </td>
                      <td className="py-2">{participant.position || '-'}</td>
                      {demographicsDetected?.hasDateOfBirth && (
                        <td className="py-2">
                          {participant.dateOfBirth 
                            ? new Date().getFullYear() - participant.dateOfBirth.getFullYear()
                            : '-'}
                        </td>
                      )}
                      {demographicsDetected?.hasGender && (
                        <td className="py-2">{participant.gender || '-'}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BOTONES ACCIÓN */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onReset}>
          <Trash2 className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        
        <Button onClick={onConfirm} className="btn-gradient focus-ring" size="lg">
          <Send className="h-4 w-4 mr-2" />
          Confirmar Carga ({participants.length} participantes)
        </Button>
      </div>
    </div>
  );
}

function ConfirmingStep({ progress }: { progress: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          Cargando participantes a la base de datos...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="w-full" />
        <p className="text-center text-sm text-gray-600 mt-2">
          Guardando datos demográficos y configurando encuestas...
        </p>
      </CardContent>
    </Card>
  );
}

function CompletionStep({ result, onReset }: { result: any; onReset: () => void }) {
  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-6 w-6" />
          ¡Carga Completada Exitosamente!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className="bg-white border-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {result.message}
            </AlertDescription>
          </Alert>

          {/* STATS FINALES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.totalLoaded}</div>
              <div className="text-sm text-gray-600">Cargados</div>
            </div>
            
            {result.duplicatesInDB > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{result.duplicatesInDB}</div>
                <div className="text-sm text-gray-600">Duplicados</div>
              </div>
            )}
            
            {result.demographicsStats.withDateOfBirth > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.demographicsStats.withDateOfBirth}</div>
                <div className="text-sm text-gray-600">Con Demografía</div>
              </div>
            )}
            
            {result.demographicsStats.withGender > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{result.demographicsStats.withGender}</div>
                <div className="text-sm text-gray-600">Con Género</div>
              </div>
            )}
          </div>

          {/* DISTRIBUCIÓN DEMOGRÁFICA FINAL */}
          {Object.keys(result.demographicsStats.genderDistribution || {}).length > 0 && (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Análisis Demográfico Final
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Distribución por Género:</h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.demographicsStats.genderDistribution || {}).map(([gender, count]) => (
                      <Badge key={gender} variant="secondary">
                        {gender === 'MALE' ? '♂️ Masculino' :
                         gender === 'FEMALE' ? '♀️ Femenino' :
                         gender === 'NON_BINARY' ? '⚧ No Binario' :
                         '❓ Prefiere no decir'}: {count as number}
                      </Badge>
                    ))}
                  </div>
                </div>

                {Object.keys(result.demographicsStats.ageDistribution || {}).length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Distribución por Edad:</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.demographicsStats.ageDistribution || {}).map(([range, count]) => (
                        <Badge key={range} variant="outline">
                          {range} años: {count as number}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button onClick={onReset} size="lg">
              <Upload className="h-4 w-4 mr-2" />
              Cargar Más Participantes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorStep({ error, onReset }: { error: string | null; onReset: () => void }) {
  return (
    <Card className="bg-red-50 border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-6 w-6" />
          Error en la Carga
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="bg-white border-red-300 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={onReset} variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Intentar de Nuevo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}