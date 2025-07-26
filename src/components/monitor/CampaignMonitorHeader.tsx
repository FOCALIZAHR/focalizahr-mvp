// ARCHIVO: /src/components/monitor/CampaignMonitorHeader.tsx

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  RefreshCw, 
  Eye,
  ArrowLeft
} from 'lucide-react';

interface CampaignMonitorHeaderProps {
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  isLoading: boolean;
  handleRefresh: () => void;
  router: any;
}

export function CampaignMonitorHeader({
  name,
  type,
  status,
  startDate,
  endDate,
  isLoading,
  handleRefresh,
  router
}: CampaignMonitorHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button 
            onClick={() => router.push('/dashboard')}
            className="btn-gradient focus-ring flex items-center gap-2"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold focalizahr-gradient-text">
          {name}
        </h1>
        
        <div className="flex items-center gap-4 mt-2">
          <Badge 
            variant={status === 'active' ? 'default' : 'secondary'}
            className="text-sm"
          >
            <Activity className="h-3 w-3 mr-1" />
            {status === 'active' ? 'Activa' : status}
          </Badge>
          <span className="text-sm text-white/60">
            Tipo: {type}
          </span>
          <span className="text-sm text-white/60">
            Período: {startDate} - {endDate}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
        <Button size="sm" className="btn-gradient">
          <Eye className="h-4 w-4 mr-2" />
          Ver Resultados
        </Button>
      </div>
    </div>
  );
}