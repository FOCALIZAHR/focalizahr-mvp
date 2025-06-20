'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';

// Hooks externos (fuente de verdad única)
import { useCampaigns } from '@/hooks/useCampaigns';
import { useMetrics } from '@/hooks/useMetrics';

// Componentes extraídos
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import CampaignStateManager from '@/components/dashboard/CampaignStateManager';
import MetricsCards from '@/components/dashboard/MetricsCards';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import CampaignsList from '@/components/dashboard/CampaignsList';

import './dashboard.css';

// Interfaces (mantener compatibilidad)
interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  campaignType: {
    name: string;
    slug: string;
  };
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  startDate: string;
  endDate: string;
  canActivate?: boolean;
  canViewResults?: boolean;
  isOverdue?: boolean;
  daysRemaining?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  lastActivity?: string;
  completionTrend?: 'up' | 'down' | 'stable';
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  campaignId?: string;
}

// Hook para alertas (SIMPLIFICADO - usando campaigns externos)
function useAlerts(campaigns: Campaign[]) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const generateAlerts = () => {
      const newAlerts: Alert[] = [];

      campaigns.forEach(campaign => {
        // Alerta de baja participación
        if (campaign.status === 'active' && campaign.participationRate < 30) {
          newAlerts.push({
            id: `low-participation-${campaign.id}`,
            type: 'warning',
            title: 'Baja Participación',
            message: `${campaign.name} tiene solo ${campaign.participationRate.toFixed(1)}% de participación`,
            timestamp: new Date(),
            campaignId: campaign.id
          });
        }

        // Alerta de campaña próxima a vencer
        if (campaign.status === 'active' && campaign.daysRemaining !== undefined && campaign.daysRemaining <= 2) {
          newAlerts.push({
            id: `expiring-${campaign.id}`,
            type: 'warning',
            title: 'Campaña Próxima a Vencer',
            message: `${campaign.name} vence en ${campaign.daysRemaining} días`,
            timestamp: new Date(),
            campaignId: campaign.id
          });
        }

        // Alerta de alta participación (positiva)
        if (campaign.status === 'active' && campaign.participationRate > 80) {
          newAlerts.push({
            id: `high-participation-${campaign.id}`,
            type: 'success',
            title: 'Excelente Participación',
            message: `${campaign.name} alcanzó ${campaign.participationRate.toFixed(1)}% de participación`,
            timestamp: new Date(),
            campaignId: campaign.id
          });
        }
      });

      setAlerts(newAlerts);
    };

    generateAlerts();
  }, [campaigns]);

  return { alerts, setAlerts };
}

// Componente Principal del Dashboard (REFACTORIZADO)
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedCampaignForStateManager, setSelectedCampaignForStateManager] = useState<Campaign | null>(null);

  // Hooks externos (fuente de verdad única)
  const {
    campaigns,
    loading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns
  } = useCampaigns();

  const {
    metrics,
    loading: metricsLoading,
    error: metricsError,
    lastUpdated: metricsLastUpdated,
    refetch: refetchMetrics
  } = useMetrics();

  // Hook alertas usando campaigns externos
  const { alerts, setAlerts } = useAlerts(campaigns);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    setMounted(true);
  }, [router]);

  // Handler para cambio de estado campañas
  const handleStateChange = async (campaignId: string, newStatus: string, action: string) => {
    try {
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, action })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar estado');
      }

      // Cerrar modal y refrescar datos
      setSelectedCampaignForStateManager(null);
      refetchCampaigns(); // Refrescar lista campañas
      refetchMetrics(); // Refrescar métricas
      
      // Mostrar alerta de éxito
      const successAlert = {
        id: Date.now().toString(),
        type: 'success' as const,
        title: 'Estado actualizado',
        message: `La campaña se ha actualizado exitosamente.`,
        timestamp: new Date()
      };
      setAlerts(prev => [successAlert, ...prev.slice(0, 4)]);
      
      // Auto-remover alerta después de 5 segundos
      setTimeout(() => {
        setAlerts(prev => prev.filter(alert => alert.id !== successAlert.id));
      }, 5000);
      
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      
      const errorAlert = {
        id: Date.now().toString(),
        type: 'warning' as const,
        title: 'Error al actualizar estado',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date()
      };
      setAlerts(prev => [errorAlert, ...prev.slice(0, 4)]);
      
      // Auto-remover alerta después de 5 segundos
      setTimeout(() => {
        setAlerts(prev => prev.filter(alert => alert.id !== errorAlert.id));
      }, 5000);
    }
  };

  // Handler para gestionar estado (abrir modal)
  const handleManageState = (campaign: Campaign) => {
    setSelectedCampaignForStateManager(campaign);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen layout-center">
        <div className="layout-column items-center layout-gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegación Integrada */}
      <DashboardNavigation 
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      />
      
      {/* Contenido Principal con Offset para Navegación */}
      <div className="lg:ml-64">
        <div className="neural-dashboard main-layout min-h-screen">      
          <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
            
            {/* Header */}
            <div className="layout-between">
              <div>
                <h1 className="text-4xl font-bold focalizahr-gradient-text">
                  Dashboard FocalizaHR
                </h1>
                <p className="text-muted-foreground mt-2 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Inteligencia organizacional en tiempo real
                </p>
              </div>
            </div>

            {/* Métricas Cards */}
            <MetricsCards
              metrics={metrics}
              loading={metricsLoading}
              error={metricsError}
              lastUpdated={metricsLastUpdated}
              onRefresh={refetchMetrics}
            />

            {/* Alertas Panel */}
            <AlertsPanel alerts={alerts} />

            {/* Campañas List */}
            <CampaignsList
              campaigns={campaigns}
              loading={campaignsLoading}
              error={campaignsError}
              onManageState={handleManageState}
              onRefresh={refetchCampaigns}
            />
          </div>
        </div>
      </div>

      {/* Modal Gestión Estado Campañas */}
      {selectedCampaignForStateManager && (
        <Dialog 
          open={!!selectedCampaignForStateManager} 
          onOpenChange={(open) => !open && setSelectedCampaignForStateManager(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestionar Estado - {selectedCampaignForStateManager.name}
              </DialogTitle>
            </DialogHeader>
            
            <CampaignStateManager 
              campaign={selectedCampaignForStateManager} 
              onStateChange={handleStateChange}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}