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

export default function CampaignMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  // La única lógica es llamar al hook refactorizado
  const monitorData = useCampaignMonitor(campaignId);

  if (monitorData.error) {
    return (
      <div className="neural-dashboard main-layout min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-white">Error cargando datos: {monitorData.error}</p>
          </div>
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
        
        {/* Footer con información de actualización */}
        <div className="text-center text-sm text-white/40">
          Última actualización: {monitorData.lastRefresh.toLocaleTimeString()} • 
          Próxima actualización automática en {60 - new Date().getSeconds()} segundos
        </div>
      </div>
    </div>
  );
}
