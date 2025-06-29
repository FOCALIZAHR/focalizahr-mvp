import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, CheckCircle, AlertTriangle, Users, Calendar } from 'lucide-react';

type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';
type RiskLevel = 'low' | 'medium' | 'high' | undefined;

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  riskLevel?: RiskLevel;
  className?: string;
}

const CampaignStatusBadge: React.FC<CampaignStatusBadgeProps> = ({
  status,
  variant = 'default',
  showIcon = true,
  riskLevel,
  className = ''
}) => {
  // ✅ CONFIGURACIÓN VISUAL ESPECIALIZADA
  const getStatusConfig = (status: CampaignStatus) => {
    const configs = {
      draft: {
        label: 'Borrador',
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        gradientClass: 'badge-gradient-draft',
        description: 'Campaña en preparación'
      },
      active: {
        label: 'Activa',
        variant: 'default' as const,
        icon: Activity,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        gradientClass: 'badge-gradient-active',
        description: 'Recibiendo respuestas'
      },
      completed: {
        label: 'Completada',
        variant: 'outline' as const,
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        gradientClass: 'badge-gradient-completed',
        description: 'Resultados disponibles'
      },
      cancelled: {
        label: 'Cancelada',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        gradientClass: 'badge-gradient-cancelled',
        description: 'Campaña cancelada'
      }
    };
    return configs[status] || configs.draft;
  };

  // ✅ CONFIGURACIÓN RIESGO (PARA VARIANT DETAILED)
  const getRiskConfig = (riskLevel: RiskLevel) => {
    if (!riskLevel) return null;
    
    const riskConfigs = {
      low: { 
        label: 'Bajo Riesgo', 
        color: 'text-green-500', 
        bgColor: 'bg-green-50',
        icon: '🟢'
      },
      medium: { 
        label: 'Riesgo Medio', 
        color: 'text-yellow-500', 
        bgColor: 'bg-yellow-50',
        icon: '🟡'
      },
      high: { 
        label: 'Alto Riesgo', 
        color: 'text-red-500', 
        bgColor: 'bg-red-50',
        icon: '🔴'
      }
    };
    return riskConfigs[riskLevel];
  };

  const statusConfig = getStatusConfig(status);
  const riskConfig = getRiskConfig(riskLevel);
  const StatusIcon = statusConfig.icon;

  // ✅ VARIANTES RENDERIZADO
  if (variant === 'compact') {
    return (
      <Badge 
        variant={statusConfig.variant} 
        className={`flex items-center gap-1 ${className}`}
      >
        {showIcon && <StatusIcon className="h-3 w-3" />}
        {statusConfig.label}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <Badge 
          variant={statusConfig.variant} 
          className="flex items-center gap-1 w-fit"
        >
          {showIcon && <StatusIcon className="h-3 w-3" />}
          {statusConfig.label}
        </Badge>
        
        {riskConfig && (
          <div className="flex items-center gap-1 text-xs">
            <span className={riskConfig.color}>
              {riskConfig.icon}
            </span>
            <span className={`${riskConfig.color} font-medium`}>
              {riskConfig.label}
            </span>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          {statusConfig.description}
        </p>
      </div>
    );
  }

  // ✅ VARIANT DEFAULT
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-8 h-8 rounded-lg ${statusConfig.bgColor} flex items-center justify-center`}>
        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
      </div>
      <div className="flex flex-col">
        <Badge variant={statusConfig.variant} className="w-fit">
          {statusConfig.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {statusConfig.description}
        </span>
      </div>
    </div>
  );
};

export default CampaignStatusBadge;