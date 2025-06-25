'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  Users, 
  Activity, 
  TrendingUp, 
  Search, 
  Plus,
  Eye,
  Play,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  AlertTriangle,
  Bell,
  Calendar,
  Target,
  Zap,
  Shield,
  Award
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import CampaignActionButtons from '@/components/dashboard/CampaignActionButtons';
import { useCampaigns, useMetrics } from '@/hooks';
import useAlerts from '@/hooks/useAlerts';
import MetricsCards from '@/components/dashboard/MetricsCards';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import CampaignsList from '@/components/dashboard/CampaignsList';
import './dashboard.css'; // Solo estilos de layout

// Tipos básicos (MANTENIDOS EXACTOS)
interface DashboardMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  draftCampaigns: number;
  cancelledCampaigns: number;
  globalParticipationRate: number;
  totalResponses: number;
  totalParticipants: number;
  recentResponses?: number; // Puede no haber respuestas recientes
  
  // Estos campos pueden ser nulos o no existir, por eso llevan '?'
  weeklyGrowth?: number;
  monthlyGrowth?: number;
  averageCompletionTime?: number | null;
  topPerformingCampaign?: string | null;
}

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

// Todos los hooks y componentes ahora son externos - archivo limpio como orquestador

// Componente Principal del Dashboard (🔥 ACTUALIZADO CON NAVEGACIÓN)
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Hooks para datos del dashboard - ahora externos
  const { metrics, loading: metricsLoading, error: metricsError, lastUpdated, refetch: refetchMetrics } = useMetrics();
  const { campaigns, loading: campaignsLoading, error: campaignsError, refetch: refetchCampaigns } = useCampaigns();
  const { alerts } = useAlerts(campaigns || []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen layout-center">
        <div className="layout-column items-center layout-gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium mt-4">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔥 NAVEGACIÓN INTEGRADA */}
      <DashboardNavigation 
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      />
      
      {/* 🔥 CONTENIDO PRINCIPAL CON OFFSET PARA NAVEGACIÓN */}
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
                  <Activity className="h-4 w-4 text-primary" />
                  Inteligencia organizacional en tiempo real
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Card className="glass-card">
                  <CardContent className="status-widget-layout p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Sistema Activo</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-muted-foreground">{new Date().toLocaleDateString()}</span>
                  </CardContent>
                </Card>
                
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/dashboard/settings')}
                  className="focus-ring hidden lg:flex"
                >
                  Configuración
                </Button>
              </div>
            </div>

            {/* Métricas Cards */}
            <MetricsCards metrics={metrics} loading={metricsLoading} error={metricsError} lastUpdated={lastUpdated} />

            {/* Alertas */}
            <AlertsPanel alerts={alerts} />

            {/* Separador */}
            <div className="separator-layout bg-border"></div>

            {/* Lista de Campañas */}
            <CampaignsList campaigns={campaigns} loading={campaignsLoading} error={campaignsError} onRefresh={refetchCampaigns} />

            {/* Footer del Dashboard */}
            <Card className="glass-card">
              <CardContent className="layout-center p-4">
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>© {new Date().getFullYear()} FocalizaHR</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span>Versión 1.0.0</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span>Inteligencia Organizacional</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}