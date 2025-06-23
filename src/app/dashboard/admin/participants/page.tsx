// src/app/dashboard/admin/participants/page.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import '@/app/dashboard/dashboard.css';
import { toast } from 'sonner';
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
  Activity,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

// Importar el componente ParticipantUploader reutilizable
import ParticipantUploader from '@/components/admin/ParticipantUploader';

// Tipos para el admin panel
// ESTA ES LA INTERFACE CORRECTA QUE SOLUCIONA EL PROBLEMA
interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  campaignType: {
    name: string;
    slug: string;
  };
  company: { // <--- Correcto
    name: string; // <--- Correcto
    admin_email: string; // <--- Correcto
  };
  totalInvited: number;
  startDate: string;
  endDate: string;
  created_at: string;
}

// Hook para gestionar campañas pendientes
function usePendingCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('focalizahr_token');
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      const response = await fetch('/api/admin/participants?status=draft&withoutParticipants=true', {

        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filtrar campañas draft sin participantes
      const pendingCampaigns = (data.campaigns || []).filter((campaign: any) => 
        campaign.status === 'draft' && campaign.totalInvited === 0
      );
      
      setCampaigns(pendingCampaigns);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setError(error instanceof Error ? error.message : 'Error cargando campañas');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return { campaigns, loading, error, lastUpdated, refetch: fetchCampaigns };
}

// Componente principal del admin panel
export default function AdminParticipantsPage() {
  const router = useRouter();
  const { campaigns, loading, error, lastUpdated, refetch } = usePendingCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  

  // Manejar éxito de upload
  const handleUploadComplete = useCallback((result: { totalLoaded: number; participants: any[] }) => {
  // Mostrar toast de éxito (profesional y visible)
  toast.success(`✅ ${result.totalLoaded} participantes cargados exitosamente`, {
    description: "Redirigiendo al dashboard principal...",
    duration: 3000,
  });
  
  // Remover campaña de la lista ya que ya tiene participantes
  if (selectedCampaign) {
    refetch(); // Refrescar lista de campañas
    setSelectedCampaign(null); // Limpiar selección
  }

  // Redirección automática al dashboard después de 2.5 segundos
  setTimeout(() => {
    router.push('/dashboard');
  }, 5000);
}, [selectedCampaign, refetch, router]);

  // Manejar errores de upload
  const handleUploadError = useCallback((error: string) => {
    console.error('Upload error:', error);
    // El error ya se maneja en el componente ParticipantUploader
  }, []);

  // Renderizar estado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center neural-dashboard">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium">Cargando admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neural-dashboard">
      {/* Header del admin panel - como Card */}
      <div className="max-w-6xl mx-auto px-6">
        <Card className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="btn-gradient flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4 text-cyan-400" />
                  Volver al Dashboard
                </Button>
                
                <div>
                  <h1 className="text-3xl font-bold focalizahr-gradient-text">
                    Admin Panel - Carga Participantes
                  </h1>
                  <p className="text-gray-300 mt-1">
                    Gestión de participantes para campañas FocalizaHR (Enfoque Concierge)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  className="flex items-center gap-2 border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualizar
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Activity className="h-4 w-4" />
                  <span>Admin: team@focalizahr.com</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* Mostrar mensaje de éxito global */}
      

        {/* Mostrar error global */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Lista de campañas disponibles */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              Campañas Pendientes de Participantes
              {campaigns.length > 0 && (
                <Badge variant="secondary">{campaigns.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Campañas en estado 'draft' que necesitan carga de participantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-cyan-400/50" />
                <p className="text-lg font-medium">No hay campañas pendientes</p>
                <p className="text-sm mt-2">
                  Todas las campañas activas ya tienen participantes cargados
                </p>
                <Button
                  onClick={refetch}
                  className="mt-4 btn-gradient flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualizar Lista
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedCampaign?.id === campaign.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {campaign.name}
                        </h3>
                        <p className="text-gray-600 font-medium">
                         {campaign.company.name}
                        </p>
                        <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Tipo:</span>
                            <span>{campaign.campaignType.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Creada:</span>
                            <span>{new Date(campaign.created_at).toLocaleDateString('es-CL')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Período:</span>
                            <span>
                              {new Date(campaign.startDate).toLocaleDateString('es-CL')} - 
                              {new Date(campaign.endDate).toLocaleDateString('es-CL')}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Email cliente:</span> {campaign.company.admin_email}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {campaign.status}
                        </Badge>
                        <p className="text-sm text-gray-500">
                          {campaign.totalInvited} participantes
                        </p>
                        {selectedCampaign?.id === campaign.id && (
                          <div className="mt-2">
                            <Badge variant="default" className="text-xs">
                              ✓ Seleccionada
                            </Badge>
                          </div>
                        )}
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
          <div className="space-y-6">
            <Separator />
            
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Cargar Participantes para: {selectedCampaign.name}
              </h2>
              <p className="text-gray-600">
                Cliente: {selectedCampaign.company.name} ({selectedCampaign.company.admin_email})
              </p>
            </div>

            <ParticipantUploader
              campaignId={selectedCampaign.id}
              campaignName={selectedCampaign.name}
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
              maxParticipants={500}
              allowedFormats={['.csv', '.xlsx', '.xls']}
              showPreview={true}
              mode="admin"
            />
          </div>
        )}

        {/* Información del workflow concierge */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">
                  Workflow Concierge FocalizaHR
                </h3>
                <div className="space-y-2 text-gray-300 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white flex items-center justify-center text-xs font-semibold shadow-lg">1</div>
                    <span>Cliente crea campaña via wizard → queda en estado 'draft'</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-white flex items-center justify-center text-xs font-semibold">2</div>
                    <span>Cliente envía CSV participantes por email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">3</div>
                    <span><strong>FocalizaHR procesa y carga participantes (este panel)</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-white flex items-center justify-center text-xs font-semibold">4</div>
                    <span>Sistema notifica cliente automáticamente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-white flex items-center justify-center text-xs font-semibold">5</div>
                    <span>Cliente activa campaña → emails automáticos</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de actualización */}
        {lastUpdated && (
          <div className="text-center text-sm text-gray-500">
            Última actualización: {lastUpdated.toLocaleTimeString('es-CL')}
          </div>
        )}
      </div>
    </div>
  );
}