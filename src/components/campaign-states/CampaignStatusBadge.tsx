import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
  Pause,
  Eye
} from 'lucide-react';

interface CampaignStatusBadgeProps {
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'paused';
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
}

const CampaignStatusBadge: React.FC<CampaignStatusBadgeProps> = ({
  status,
  variant = 'default',
  showIcon = true
}) => {
  const statusConfig = {
    draft: {
      label: 'Borrador',
      variant: 'secondary' as const,
      icon: Clock,
      className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
    },
    active: {
      label: 'Activa',
      variant: 'default' as const,
      icon: Activity,
      className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
    },
    completed: {
      label: 'Completada',
      variant: 'outline' as const,
      icon: CheckCircle,
      className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    },
    cancelled: {
      label: 'Cancelada',
      variant: 'destructive' as const,
      icon: AlertTriangle,
      className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
    },
    paused: {
      label: 'Pausada',
      variant: 'secondary' as const,
      icon: Pause,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
    }
  };

  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <Badge 
        variant={config.variant}
        className={`px-2 py-1 text-xs ${config.className}`}
      >
        {showIcon && <Icon className="h-3 w-3 mr-1" />}
        {config.label}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={config.variant}
          className={`px-3 py-1.5 ${config.className}`}
        >
          {showIcon && <Icon className="h-4 w-4 mr-2" />}
          {config.label}
        </Badge>
        {status === 'active' && (
          <div className="flex items-center text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
            En progreso
          </div>
        )}
      </div>
    );
  }

  return (
    <Badge 
      variant={config.variant}
      className={`flex items-center gap-1 ${config.className}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};

export default CampaignStatusBadge;