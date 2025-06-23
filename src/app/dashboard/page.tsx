'use client';

// Imports de React y Next.js (que tú ya habías preparado)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Imports de Lógica y Autenticación (que tú ya habías preparado)
import { isAuthenticated } from '@/lib/auth';

// Imports de los Componentes Externos (que tú ya habías preparado)
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import MetricsCards from '@/components/dashboard/MetricsCards';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import CampaignsList from '@/components/dashboard/CampaignsList';

// Imports de los Hooks Externos (que tú ya habías preparado)
import { useCampaigns } from '@/hooks/useCampaigns';
import { useMetrics } from '@/hooks/useMetrics';
import useAlerts from '@/hooks/useAlerts';

// Imports de UI y CSS (que tú ya habías preparado)
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import './dashboard.css';

// --- Componente Principal del Dashboard (Ensamblado Final) ---
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // --- Lógica de Autenticación (Preservada) ---
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    } else {
      setMounted(true);
    }
  }, [router]);

  // --- CONEXIÓN DE HOOKS EXTERNOS (La pieza lógica que faltaba) ---
  const { 
    metrics, 
    loading: metricsLoading, 
    error: metricsError, 
    refetch: refetchMetrics, 
    lastUpdated 
  } = useMetrics({ autoRefresh: true });

  const { 
    campaigns, 
    loading: campaignsLoading, 
    error: campaignsError, 
    refresh: refetchCampaigns 
  } = useCampaigns();

  const { alerts } = useAlerts(campaigns || []);

  // --- Estado de Carga Inicial ---
  if (!mounted) {
    return (
      <div className="min-h-screen layout-center bg-gray-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- RENDERIZADO DEL LAYOUT Y COMPONENTES CONECTADOS (El JSX final) ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <DashboardNavigation />
      
      {/* Contenido principal con el margen correcto para la navegación */}
      <main className="lg:ml-64">
        <div className="main-layout min-h-screen p-4 sm:p-6 lg:p-8">
          <div className="space-y-8">
            {/* Header del Dashboard */}
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

            {/* --- INTEGRACIÓN DE COMPONENTES CON PROPS --- */}
            <MetricsCards 
              metrics={metrics} 
              loading={metricsLoading} 
              error={metricsError} 
              lastUpdated={lastUpdated}
              onRefresh={refetchMetrics} 
            />

            <AlertsPanel alerts={alerts} />

            <div className="separator-layout bg-border"></div>

            <CampaignsList 
              campaigns={campaigns || []} 
              loading={campaignsLoading} 
              error={campaignsError}
              lastUpdated={lastUpdated}
              onRefresh={refetchCampaigns}
            />

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
      </main>
    </div>
  );
}
