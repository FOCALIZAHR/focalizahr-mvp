'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  variant?: 'default' | 'compact';
  showIcon?: boolean;
  className?: string;
}

export default function CampaignStatusBadge({
  status,
  variant = 'default',
  showIcon = true,
  className = ''
}: CampaignStatusBadgeProps) {

  const getStatusConfig = (status: CampaignStatus) => {
    const configs = {
      draft: {
        label: 'Borrador',
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-gray-600'
      },
      active: {
        label: 'Activa',
        variant: 'default' as const,
        icon: Activity,
        color: 'text-green-600'
      },
      completed: {
        label: 'Completada',
        variant: 'outline' as const,
        icon: CheckCircle,
        color: 'text-blue-600'
      },
      cancelled: {
        label: 'Cancelada',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-red-600'
      }
    };
    return configs[status] || configs.draft;
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center`}>
        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
      </div>
      <Badge variant={statusConfig.variant}>
        {statusConfig.label}
      </Badge>
    </div>
  );
}