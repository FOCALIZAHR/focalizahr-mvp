'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Download,
  Trash2,
  Send,
  Clock,
  Activity
} from 'lucide-react';

// Tipos para el admin panel
interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  campaignType: {
    name: string;
    slug: string;
  };
  company: {
    name: string;
    admin_email: string;
  };
  totalInvited: number;
  startDate: string;
  endDate: string;
  created_at: string;
}

interface ParticipantUpload {
  email: string;
  name?: string;
  department?: string;
  position?: string;
  location?: string;
}

interface UploadResult {
  success: boolean;
  totalProcessed: number;
  validRecords: number;
  duplicates: number;
  errors: string[];
  participants: ParticipantUpload[];
}

// Componente principal del admin panel
export default function AdminParticipantsPage() {
  // Estados para gestión de campañas
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Estados para upload de archivo
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<ParticipantUpload[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar campañas draft sin participantes
  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/campaigns?status=draft&withoutParticipants=true');
      
      if (!response.ok) {
        throw new Error('Error cargando campañas');
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setUploadError('Error cargando campañas disponibles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar campañas al montar el componente
  React.useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Manejar selección de archivo
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setUploadError('Formato de archivo no válido. Usa CSV, Excel (.xlsx) o Excel (.xls)');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Archivo muy grande. Máximo 5MB permitido');
      return;
    }

    setUploadFile(file);
    setUploadError(null);
    setUploadResult(null);
    setPreviewData([]);
  }, []);

  // Procesar archivo para preview
  const handleFilePreview = useCallback(async () => {
    if (!uploadFile || !selectedCampaign) {
      setUploadError('Selecciona campaña y archivo primero');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('campaignId', selectedCampaign.id);
      formData.append('action', 'preview');

      const response = await fetch('/api/admin/participants', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error procesando archivo');
      }

      setUploadResult(result);
      setPreviewData(result.participants || []);

    } catch (error) {
      console.error('Error previewing file:', error);
      setUploadError(error instanceof Error ? error.message : 'Error procesando archivo');
    } finally {
      setUploading(false);
    }
  }, [uploadFile, selectedCampaign]);

  // Confirmar carga de participantes
  const handleConfirmUpload = useCallback(async () => {
    if (!uploadFile || !selectedCampaign || !uploadResult) {
      setUploadError('Datos incompletos para confirmar carga');
      return;
    }

    try {
      setProcessing(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('campaignId', selectedCampaign.id);
      formData.append('action', 'confirm');

      const response = await fetch('/api/admin/participants', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error confirmando carga');
      }

      // Actualizar campaña con nuevos participantes
      const updatedCampaign = { ...selectedCampaign, totalInvited: result.totalLoaded };
      setSelectedCampaign(updatedCampaign);
      
      // Remover campaña de la lista si ya tiene participantes
      setCampaigns(prev => prev.filter(c => c.id !== selectedCampaign.id));

      // Enviar email notificación al cliente
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'participants_loaded',
          campaignId: selectedCampaign.id,
          recipientEmail: selectedCampaign.company.admin_email,
          participantsCount: result.totalLoaded
        })
      });

      // Reset formulario
      setUploadFile(null);
      setUploadResult(null);
      setPreviewData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      alert(`✅ Participantes cargados exitosamente: ${result.totalLoaded}`);

    } catch (error) {
      console.error('Error confirming upload:', error);
      setUploadError(error instanceof Error ? error.message : 'Error confirmando carga');
    } finally {
      setProcessing(false);
    }
  }, [uploadFile, selectedCampaign, uploadResult]);

  // Limpiar formulario
  const handleClearForm = useCallback(() => {
    setUploadFile(null);
    setUploadResult(null);
    setPreviewData([]);
    setUploadError(null);
    setSelectedCampaign(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Renderizar estado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium">Cargando admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header del admin panel */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Panel - Carga Participantes
            </h1>
            <p className="text-gray-600 mt-2">
              Gestión de participantes para campañas FocalizaHR (Enfoque Concierge)
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity className="h-4 w-4" />
            <span>Admin: team@focalizahr.com</span>
          </div>
        </div>

        {/* Lista de campañas disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Campañas Pendientes de Participantes
            </CardTitle>
            <CardDescription>
              Campañas en estado 'draft' que necesitan carga de participantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay campañas pendientes</p>
                <p className="text-sm">Todas las campañas activas ya tienen participantes cargados</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedCampaign?.id === campaign.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        <p className="text-gray-600">{campaign.company.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Tipo: {campaign.campaignType.name}</span>
                          <span>Creada: {new Date(campaign.created_at).toLocaleDateString()}</span>
                          <span>Período: {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-2">
                          {campaign.status}
                        </Badge>
                        <p className="text-sm text-gray-500">
                          {campaign.totalInvited} participantes
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de carga de participantes */}
        {selectedCampaign && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Cargar Participantes: {selectedCampaign.name}
              </CardTitle>
              <CardDescription>
                Cliente: {selectedCampaign.company.name} ({selectedCampaign.company.admin_email})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Instrucciones */}
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Formato requerido:</strong> CSV o Excel con columnas: Email (obligatorio), 
                  Nombre, Departamento, Cargo, Ubicación (opcionales). 
                  Máximo 500 participantes por campaña.
                </AlertDescription>
              </Alert>

              {/* Selector de archivo */}
              <div className="space-y-4">
                <Label htmlFor="file-upload" className="text-base font-medium">
                  Seleccionar Archivo
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleFilePreview}
                    disabled={!uploadFile || uploading}
                    className="min-w-[120px]"
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
                
                {uploadFile && (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {/* Mostrar errores */}
              {uploadError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {/* Resultados del preview */}
              {uploadResult && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Resultado del Procesamiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {uploadResult.totalProcessed}
                        </div>
                        <div className="text-sm text-gray-600">Total procesados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {uploadResult.validRecords}
                        </div>
                        <div className="text-sm text-gray-600">Registros válidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {uploadResult.duplicates}
                        </div>
                        <div className="text-sm text-gray-600">Duplicados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {uploadResult.errors.length}
                        </div>
                        <div className="text-sm text-gray-600">Errores</div>
                      </div>
                    </div>

                    {uploadResult.errors.length > 0 && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium mb-2">Errores encontrados:</div>
                          <ul className="list-disc list-inside text-sm">
                            {uploadResult.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {uploadResult.errors.length > 5 && (
                              <li>... y {uploadResult.errors.length - 5} errores más</li>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Preview de participantes */}
                    {previewData.length > 0 && (
                      <div className="space-y-4">
                        <Separator />
                        <h4 className="font-medium">Preview Participantes (primeros 10)</h4>
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-2">Email</th>
                                <th className="text-left p-2">Nombre</th>
                                <th className="text-left p-2">Departamento</th>
                                <th className="text-left p-2">Cargo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.slice(0, 10).map((participant, index) => (
                                <tr key={index} className="border-b">
                                  <td className="p-2">{participant.email}</td>
                                  <td className="p-2">{participant.name || '-'}</td>
                                  <td className="p-2">{participant.department || '-'}</td>
                                  <td className="p-2">{participant.position || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {previewData.length > 10 && (
                            <p className="text-center text-gray-500 py-2">
                              ... y {previewData.length - 10} participantes más
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={handleClearForm}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Limpiar
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleConfirmUpload}
                          disabled={processing || uploadResult.validRecords === 0}
                          className="flex items-center gap-2"
                        >
                          {processing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Cargando...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Confirmar Carga ({uploadResult.validRecords} participantes)
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {/* Información de contacto */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Activity className="h-4 w-4" />
              <span className="font-medium">Workflow Concierge FocalizaHR</span>
            </div>
            <p className="text-blue-700 text-sm mt-2">
              1. Cliente envía CSV → 2. Procesamos datos → 3. Notificamos cliente → 
              4. Cliente activa campaña → 5. Emails automáticos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}