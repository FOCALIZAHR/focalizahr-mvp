// src/app/dashboard/admin/participants/page.tsx
// VERSIÓN MINIMALISTA - Consistente con el resto del sistema
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import '@/app/dashboard/dashboard.css';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  AlertTriangle, 
  Clock,
  Activity,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

import ParticipantUploader from '@/components/admin/ParticipantUploader';
import { useCampaignsContext } from '@/context/CampaignsContext';

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

      const response = await fetch('/api/admin/campaigns/pending?status=draft&withoutParticipants=true', {
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

export default function AdminParticipantsPage() {
  const router = useRouter();
  const { campaigns, loading, error, lastUpdated, refetch } = usePendingCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { fetchCampaigns: syncGlobal } = useCampaignsContext();

  const handleUploadComplete = useCallback((result: { totalLoaded: number; participants: any[] }) => {
    toast.success(`✅ ${result.totalLoaded} participantes cargados exitosamente`, {
      description: "Redirigiendo al dashboard principal...",
      duration: 3000,
    });
    
    if (selectedCampaign) {
      refetch();
      syncGlobal();
      setSelectedCampaign(null);
    }

    setTimeout(() => {
      router.push('/dashboard');
    }, 5000);
  }, [selectedCampaign, refetch, syncGlobal, router]);

  const handleUploadError = useCallback((error: string) => {
    console.error('Upload error:', error);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center neural-dashboard">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-white">Cargando admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neural-dashboard">
      {/* Header con jerarquía visual */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              
              <Separator orientation="vertical" className="h-8 bg-gray-800" />
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-light bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Carga de Participantes
                  </h1>
                  {campaigns.length > 0 && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-3 py-1">
                      {campaigns.length} {campaigns.length === 1 ? 'campaña pendiente' : 'campañas pendientes'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Enfoque Concierge • Admin Panel
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                className="text-cyan-400 hover:text-cyan-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Activity className="h-3 w-3" />
                <span>team@focalizahr.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-6 space-y-6">
        
        {/* Error */}
        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Lista de campañas pendientes */}
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-cyan-400" />
              <div>
                <h2 className="text-lg font-light text-white">Campañas Pendientes</h2>
                <p className="text-xs text-gray-500">Estado 'draft' sin participantes</p>
              </div>
            </div>
            {campaigns.length > 0 && (
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {campaigns.length}
              </Badge>
            )}
          </div>

          {/* Lista */}
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-base text-gray-400">No hay campañas pendientes</p>
              <p className="text-xs text-gray-600 mt-2">
                Todas las campañas ya tienen participantes cargados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCampaign?.id === campaign.id
                      ? 'border-cyan-400 bg-cyan-400/5'
                      : 'border-gray-800 hover:border-gray-700 hover:bg-white/5'
                  }`}
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">
                        {campaign.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {campaign.company.name}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>{campaign.campaignType.name}</span>
                        <span>•</span>
                        <span>{new Date(campaign.created_at).toLocaleDateString('es-CL')}</span>
                        <span>•</span>
                        <span>{campaign.company.admin_email}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs mb-2">
                        {campaign.status}
                      </Badge>
                      {selectedCampaign?.id === campaign.id && (
                        <div className="mt-2">
                          <Badge className="bg-cyan-400/20 text-cyan-400 border-cyan-400/30 text-xs">
                            Seleccionada
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Uploader */}
        {selectedCampaign && (
          <div className="space-y-6">
            <Separator className="bg-gray-800" />
            
            <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-base font-medium text-white">
                  Cargar Participantes
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedCampaign.name} • {selectedCampaign.company.name}
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
          </div>
        )}

        {/* Workflow info - Minimalista */}
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-white/80" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-4">
                Workflow Concierge
              </h3>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center text-xs font-medium">1</div>
                  <span>Cliente crea campaña → estado 'draft'</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/5 text-gray-400 flex items-center justify-center text-xs font-medium">2</div>
                  <span>Cliente envía CSV por email</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/5 text-gray-400 flex items-center justify-center text-xs font-medium">3</div>
                  <span>Admin procesa y carga (este panel)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/5 text-gray-400 flex items-center justify-center text-xs font-medium">4</div>
                  <span>Sistema notifica automáticamente</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/5 text-gray-400 flex items-center justify-center text-xs font-medium">5</div>
                  <span>Cliente activa → emails automáticos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        {lastUpdated && (
          <div className="text-center text-xs text-gray-600">
            Última actualización: {lastUpdated.toLocaleTimeString('es-CL')}
          </div>
        )}
      </div>
    </div>
  );
}