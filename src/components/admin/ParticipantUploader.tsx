// src/components/admin/ParticipantUploader.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  BarChart3
} from 'lucide-react';

// Tipos para el componente
interface ParticipantData {
  email: string;
  name?: string;
  department?: string;
  position?: string;
  location?: string;
}

interface Department {
  id: string;
  displayName: string;
  standardCategory: string | null;
  isActive: boolean;
}

interface UploadResult {
  success: boolean;
  totalProcessed: number;
  validRecords: number;
  duplicates: number;
  errors: string[];
  participants: ParticipantData[];
}

interface ParticipantUploaderProps {
  campaignId: string;
  campaignName: string;
  onUploadComplete?: (result: { totalLoaded: number; participants: ParticipantData[] }) => void;
  onError?: (error: string) => void;
  maxParticipants?: number;
  allowedFormats?: string[];
  showPreview?: boolean;
  mode?: 'admin' | 'client';
}

export default function ParticipantUploader({
  campaignId,
  campaignName,
  onUploadComplete,
  onError,
  maxParticipants = 500,
  allowedFormats = ['.csv', '.xlsx', '.xls'],
  showPreview = true,
  mode = 'admin'
}: ParticipantUploaderProps) {
  
  // Estados del componente original
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<ParticipantData[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // ✅ NUEVOS ESTADOS DEPARTMENTS
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ FETCH DEPARTMENTS EFFECT
  useEffect(() => {
    const token = localStorage.getItem('focalizahr_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const accountIdFromToken = payload.accountId || payload.account?.id || payload.userId || payload.id;
        
        if (accountIdFromToken) {
          setLoadingDepartments(true);
          
          fetch('/api/departments', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch departments');
            return response.json();
          })
          .then(data => setDepartments(data.departments || []))
          .catch(error => {
            console.error('Error fetching departments:', error);
            setDepartments([]);
          })
          .finally(() => setLoadingDepartments(false));
        }
      } catch (error) {
        console.error('Error parsing JWT token:', error);
        setDepartments([]);
      }
    }
  }, []);

  // Validar archivo seleccionado
  const validateFile = useCallback((file: File): string | null => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const hasValidType = validTypes.includes(file.type) || 
                        allowedFormats.some(format => file.name.toLowerCase().endsWith(format));
    
    if (!hasValidType) {
      return `Formato no válido. Formatos permitidos: ${allowedFormats.join(', ')}`;
    }

    if (file.size > 10 * 1024 * 1024) {
      return 'Archivo muy grande. Máximo 10MB permitido';
    }

    if (file.name.length > 100) {
      return 'Nombre de archivo muy largo';
    }

    return null;
  }, [allowedFormats]);

  // Manejar selección de archivo
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadFile(file);
    setUploadError(null);
    setUploadResult(null);
    setPreviewData([]);
    setUploadProgress(0);
  }, [validateFile]);

  // Procesar archivo para preview
  const handleFilePreview = useCallback(async () => {
    if (!uploadFile || !campaignId) {
      setUploadError('Faltan datos requeridos para el preview');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      // Simular progreso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('campaignId', campaignId);
      formData.append('action', 'preview');
      
      // ✅ AGREGAR selectedDepartmentId al context
      if (selectedDepartmentId && selectedDepartmentId !== 'none') {
        formData.append('defaultDepartmentId', selectedDepartmentId);
      }
      
      const token = localStorage.getItem('focalizahr_token');

      const response = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error procesando archivo');
      }

      setUploadResult(result);
      setPreviewData(result.participants || []);

    } catch (error) {
      console.error('Error previewing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error procesando archivo';
      setUploadError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [uploadFile, campaignId, selectedDepartmentId, onError]);

  // Confirmar carga definitiva
  const handleConfirmUpload = useCallback(async () => {
    if (!uploadFile || !campaignId || !uploadResult) {
      setUploadError('Datos incompletos para confirmar carga');
      return;
    }

    try {
      setProcessing(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('campaignId', campaignId);
      formData.append('action', 'confirm');

      // ✅ AGREGAR selectedDepartmentId al context
      if (selectedDepartmentId && selectedDepartmentId !== 'none') {
        formData.append('defaultDepartmentId', selectedDepartmentId);
      }

      const token = localStorage.getItem('focalizahr_token');

      const response = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error confirmando carga');
      }

      // Limpiar formulario
      handleClearForm();
      
      // Notificar éxito
      onUploadComplete?.({
        totalLoaded: result.totalLoaded,
        participants: uploadResult.participants
      });

    } catch (error) {
      console.error('Error confirming upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error confirmando carga';
      setUploadError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
  }, [uploadFile, campaignId, uploadResult, selectedDepartmentId, onUploadComplete, onError]);

  // Limpiar formulario
  const handleClearForm = useCallback(() => {
    setUploadFile(null);
    setUploadResult(null);
    setPreviewData([]);
    setUploadError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Descargar template CSV
  const handleDownloadTemplate = useCallback(() => {
    const csvContent = [
      'Email,Nombre,Departamento,Cargo,Ubicacion',
      'juan.perez@empresa.com,Juan Pérez,Ventas,Ejecutivo Comercial,Santiago',
      'maria.gonzalez@empresa.com,María González,RRHH,Analista,Valparaíso',
      'carlos.lopez@empresa.com,Carlos López,TI,Desarrollador,Santiago'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_participantes_${campaignName.replace(/\s+/g, '_')}.csv`;
    link.click();
  }, [campaignName]);

  return (
    <Card className="professional-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Upload className="h-5 w-5 text-cyan-400" />
          Cargar Participantes
        </CardTitle>
        <CardDescription className="text-white/70">
          Campaña: <strong className="text-white">{campaignName}</strong> • Máximo {maxParticipants} participantes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Instrucciones y template */}
        <div className="space-y-4">
          <Alert className="context-container-info">
            <FileText className="h-4 w-4 text-cyan-400" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Formato requerido:</strong> CSV o Excel con las siguientes columnas:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><strong>Email</strong> (obligatorio) - Email único de cada participante</li>
                  <li><strong>Nombre</strong> (opcional) - Nombre completo</li>
                  <li><strong>Departamento</strong> (opcional) - Área de trabajo</li>
                  <li><strong>Cargo</strong> (opcional) - Posición en la empresa</li>
                  <li><strong>Ubicación</strong> (opcional) - Ciudad o sucursal</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex justify-between items-center">
            <div className="text-sm text-white/70">
              ¿Necesitas un ejemplo? Descarga nuestro template
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              Descargar Template
            </Button>
          </div>
        </div>

        {/* ✅ DROPDOWN DEPARTMENTS (NUEVO) */}
        {departments.length > 0 && (
          <div className="space-y-2 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Label htmlFor="defaultDepartment" className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Departamento por defecto (opcional)
            </Label>
            <Select 
              value={selectedDepartmentId} 
              onValueChange={setSelectedDepartmentId}
              disabled={loadingDepartments}
            >
              <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700">
                <SelectValue placeholder="Si CSV no tiene columna departamento..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin departamento específico</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              💡 Se aplicará a participantes sin departamento especificado en CSV
            </p>
            {selectedDepartmentId && selectedDepartmentId !== 'none' && (
              <p className="text-xs text-green-600 dark:text-green-400">
                ✅ Departamento seleccionado: {departments.find(d => d.id === selectedDepartmentId)?.displayName}
              </p>
            )}
          </div>
        )}

        {/* Selector de archivo */}
        <div className="space-y-4">
         <Label htmlFor="file-upload" className="text-white/80 text-base font-medium">
            Seleccionar Archivo
          </Label>
          
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept={allowedFormats.join(',')}
              onChange={handleFileSelect}
              className="flex-1 bg-white/5 border-white/30 text-white file:bg-white/20 file:text-white file:border-0 file:rounded-md"
              disabled={uploading || processing}
            />
            
            <Button
              onClick={handleFilePreview}
              disabled={!uploadFile || uploading || processing}
              className="min-w-[120px] btn-gradient focus-ring"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </div>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
          </div>
          
          {/* Progreso de upload */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/70">
                <span>Procesando archivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress-container bg-white/20">
                <div 
                  className="progress-fill bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {uploadFile && !uploading && (
            <div className="text-sm text-white/70 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>

        {/* Mensaje de error validación mínimo participantes */}
        {uploadResult && uploadResult.validRecords > 0 && uploadResult.validRecords < 5 && (
          <Alert className="context-container-warning">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <div className="font-medium">Participantes insuficientes</div>
              <div className="text-sm mt-1">
                Se requiere un mínimo de 5 participantes para activar la campaña. 
                Actualmente hay {uploadResult.validRecords} participante{uploadResult.validRecords !== 1 ? 's' : ''} válido{uploadResult.validRecords !== 1 ? 's' : ''}.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Mostrar errores */}
        {uploadError && (
          <Alert className="context-container-error">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Resultados del preview */}
        {uploadResult && showPreview && (
          <Card className="professional-card border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Resultado del Procesamiento
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {/* Estadísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {uploadResult.totalProcessed}
                  </div>
                  <div className="text-sm text-white/70">Total procesados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">
                    {uploadResult.validRecords}
                  </div>
                  <div className="text-sm text-white/70">Registros válidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {uploadResult.duplicates}
                  </div>
                  <div className="text-sm text-white/70">Duplicados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {uploadResult.errors.length}
                  </div>
                  <div className="text-sm text-white/70">Errores</div>
                </div>
              </div>

              {/* Mostrar errores si los hay */}
              {uploadResult.errors.length > 0 && (
                <Alert className="context-container-error mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Errores encontrados:</div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {uploadResult.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <li className="text-white/60">
                          ... y {uploadResult.errors.length - 5} errores más
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview de participantes */}
              {previewData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2 text-cyan-400">
                      <Users className="h-4 w-4" />
                      Preview Participantes
                    </h4>
                    <Badge className="badge-gradient-active">
                      Mostrando {Math.min(previewData.length, 10)} de {previewData.length}
                    </Badge>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto border rounded border-white/20">
                    <table className="w-full text-sm">
                      <thead className="bg-white/10 sticky top-0">
                        <tr>
                          <th className="text-left p-3 font-medium text-white/90">Email</th>
                          <th className="text-left p-3 font-medium text-white/90">Nombre</th>
                          <th className="text-left p-3 font-medium text-white/90">Departamento</th>
                          <th className="text-left p-3 font-medium text-white/90">Cargo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 10).map((participant, index) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            <td className="p-3 text-white/80">{participant.email}</td>
                            <td className="p-3 text-white/80">{participant.name || '-'}</td>
                            <td className="p-3 text-white/80">{participant.department || '-'}</td>
                            <td className="p-3 text-white/80">{participant.position || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {previewData.length > 10 && (
                      <div className="text-center text-white/60 py-3 bg-white/5">
                        ... y {previewData.length - 10} participantes más
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Análisis de segmentación */}
              {previewData.length > 0 && (
                <div className="context-container-info mt-4">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />
                  <div>
                    <h4 className="font-medium text-cyan-400 mb-2">Análisis de Segmentación</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-cyan-400 font-medium">Departamentos únicos:</span>
                        <span className="ml-2 text-white/80">
                          {new Set(previewData.filter(p => p.department).map(p => p.department)).size}
                        </span>
                      </div>
                      <div>
                        <span className="text-cyan-400 font-medium">Cargos únicos:</span>
                        <span className="ml-2 text-white/80">
                          {new Set(previewData.filter(p => p.position).map(p => p.position)).size}
                        </span>
                      </div>
                      <div>
                        <span className="text-cyan-400 font-medium">Con info completa:</span>
                        <span className="ml-2 text-white/80">
                          {previewData.filter(p => p.name && p.department && p.position).length}
                        </span>
                      </div>
                      <div>
                        <span className="text-cyan-400 font-medium">Solo email:</span>
                        <span className="ml-2 text-white/80">
                          {previewData.filter(p => !p.name && !p.department && !p.position).length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-cyan-400">
                      💡 Más información demográfica permite análisis más detallados
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-between items-center pt-6 border-t border-white/20">
                <Button
                  variant="outline"
                  onClick={handleClearForm}
                  className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
                  disabled={processing}
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleFilePreview}
                    disabled={!uploadFile || uploading || processing}
                    className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
                  >
                    <Eye className="h-4 w-4" />
                    Re-procesar
                  </Button>
                  
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={processing || uploadResult.validRecords === 0 || uploadResult.validRecords < 5}
                    className="flex items-center gap-2 btn-gradient focus-ring"
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
                          ? `Insuficientes participantes (${uploadResult.validRecords}/5 mín.)`
                          : `Confirmar Carga (${uploadResult.validRecords} participantes)`
                        }
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Información adicional para modo admin */}
              {mode === 'admin' && (
                <div className="context-container-info mt-4">
                  <div>
                    <div className="font-medium text-cyan-400 mb-1">Siguiente paso:</div>
                    <p className="text-white/80 text-sm">
                      Después de confirmar la carga, se enviará una notificación automática al cliente 
                      para que pueda revisar y activar la campaña desde su dashboard.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Información de ayuda */}
        {!uploadResult && (
          <Card className="professional-card border-cyan-500/30">
            <CardContent className="p-4">
              <div className="context-container-info">
                <FileText className="h-4 w-4 text-cyan-400" />
                <div>
                  <h4 className="font-medium text-cyan-400">Consejos para mejores resultados:</h4>
                  <ul className="text-sm text-white/80 space-y-1 mt-2">
                    <li>• Asegúrate que todos los emails sean válidos y únicos</li>
                    <li>• Incluye departamento y cargo para análisis segmentado</li>
                    <li>• Usa formato consistente en nombres y departamentos</li>
                    <li>• Revisa que no haya espacios extra o caracteres especiales</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}