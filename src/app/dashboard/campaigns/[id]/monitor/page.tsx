// ARCHIVO: page.tsx de la página de monitoreo (VERSIÓN FINAL CERTIFICADA)
'use client';

import { useCampaignMonitor } from '@/hooks/useCampaignMonitor';
import { useRouter, useParams } from 'next/navigation';
import { CampaignMonitorHeader } from '@/components/monitor/CampaignMonitorHeader';
import { CampaignMetricsGrid } from '@/components/monitor/CampaignMetricsGrid';
import { DepartmentParticipation } from '@/components/monitor/DepartmentParticipation';
import { ActivityFeed } from '@/components/monitor/ActivityFeed';
import { DailyChart } from '@/components/monitor/DailyChart';
import { AlertsPanel } from '@/components/monitor/AlertsPanel';
import { ActionButtons } from '@/components/monitor/ActionButtons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function CampaignMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const monitorData = useCampaignMonitor(campaignId);

  // GUARDIÁN DE CARGA: Previene el error TypeError
  if (monitorData.isLoading) {
    return (
      <div className="neural-dashboard main-layout min-h-screen">
        <div className="container mx-auto px-4 py-8 text-center text-white">
          Cargando Torre de Control...
        </div>
      </div>
    );
  }

  // MANEJO DE ERRORES
  if (monitorData.error) {
    return (
      <div className="neural-dashboard main-layout min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-white">
              Error cargando datos: {monitorData.error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="neural-dashboard main-layout min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        <CampaignMonitorHeader {...monitorData} router={router} />
        <CampaignMetricsGrid {...monitorData} />
        <DepartmentParticipation {...monitorData} />
        <ActivityFeed {...monitorData} />
        <DailyChart {...monitorData} />
        <AlertsPanel {...monitorData} />
        <ActionButtons {...monitorData} />
        
        <div className="text-center text-sm text-white/40">
          Última actualización: {monitorData.lastRefresh.toLocaleTimeString()} • 
          Próxima actualización automática en {60 - new Date().getSeconds()} segundos
        </div>
      </div>
    </div>
  );
}