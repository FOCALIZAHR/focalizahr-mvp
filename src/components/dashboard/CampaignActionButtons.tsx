'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Eye, 
  BarChart3, 
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';

// Tipos basados en el sistema existente
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

interface CampaignActionButtonsProps {
  campaign: Campaign;
  onActivateCampaign: (campaignId: string, campaignName: string) => Promise<void>;
  onCampaignAction: (campaignId: string, action: string, campaignName: string) => Promise<void>;
}

export default function CampaignActionButtons({ 
  campaign, 
  onActivateCampaign, 
  onCampaignAction 
}: CampaignActionButtonsProps) {
  
  // Función para obtener badge de estado
  const getStatusBadge = (status: string, riskLevel?: string) => {
    const statusMap = {
      draft: { label: 'Borrador', variant: 'secondary' as const, icon: Clock },
      active: { label: 'Activa', variant: 'default' as const, icon: Play },
      completed: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: AlertTriangle }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    const Icon = statusInfo.icon;

    return (
      <div className="flex items-center gap-2">
        <Badge variant={statusInfo.variant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {statusInfo.label}
        </Badge>
        
        {riskLevel && status === 'active' && (
          <Badge variant={
            riskLevel === 'high' ? 'destructive' :
            riskLevel === 'medium' ? 'secondary' : 'outline'
          }>
            <Shield className="h-3 w-3 mr-1" />
            Riesgo {riskLevel === 'high' ? 'Alto' : riskLevel === 'medium' ? 'Medio' : 'Bajo'}
          </Badge>
        )}
      </div>
    );
  };

  // Función para obtener botón de acción principal
  const getActionButton = () => {
    switch (campaign.status) {
      case 'draft':
        return (
          <div className="space-y-3">
            <Button 
              size="sm" 
              disabled={!campaign.canActivate}
              onClick={() => onActivateCampaign(campaign.id, campaign.name)}
              className="btn-gradient focus-ring w-full"
              title={!campaign.canActivate ? 'Se requieren al menos 5 participantes para activar' : 'Activar campaña y enviar invitaciones'}
            >
              <Play className="h-3 w-3 mr-1" />
              Activar Campaña
            </Button>
            
            {/* Info adicional para draft */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${campaign.totalInvited >= 5 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{campaign.totalInvited} participantes {campaign.totalInvited >= 5 ? '✓' : '(mín. 5)'}</span>
              </div>
              {!campaign.canActivate && (
                <div className="text-amber-600 text-xs mt-1 p-2 bg-amber-50 rounded">
                  💡 Completa la configuración para activar la campaña
                </div>
              )}
            </div>
          </div>
        );
        
      case 'active':
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => onCampaignAction(campaign.id, 'monitor', campaign.name)}
                className="focus-ring flex-1"
              >
                <Eye className="h-3 w-3 mr-1" />
                Monitorear
              </Button>
              {campaign.participationRate > 20 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onCampaignAction(campaign.id, 'preview-results', campaign.name)}
                  className="focus-ring flex-1"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Vista Previa
                </Button>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progreso: {campaign.participationRate}%</span>
                {campaign.daysRemaining && campaign.daysRemaining > 0 && (
                  <span>{campaign.daysRemaining} días restantes</span>
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    campaign.participationRate >= 70 ? 'bg-green-500' :
                    campaign.participationRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(campaign.participationRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
        
      case 'completed':
        return (
          <Button 
            size="sm" 
            disabled={!campaign.canViewResults}
            onClick={() => onCampaignAction(campaign.id, 'view-results', campaign.name)}
            className="focus-ring w-full"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Ver Resultados
          </Button>
        );
        
      case 'cancelled':
        return (
          <Badge variant="secondary" className="text-xs w-full justify-center py-2">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      {getStatusBadge(campaign.status, campaign.riskLevel)}

      {/* Action Button */}
      <div>
        {getActionButton()}
      </div>
    </div>
  );
}