'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, Square, Eye, Settings } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  totalInvited: number;
  canActivate?: boolean;
  canViewResults?: boolean;
}

interface CampaignActionButtonsProps {
  campaign: Campaign;
  onAction: (actionId: string, campaignId: string, campaignName: string) => Promise<void>;
  isLoading?: boolean;
  variant?: 'default' | 'compact';
}

export default function CampaignActionButtons({
  campaign,
  onAction,
  isLoading = false,
  variant = 'default'
}: CampaignActionButtonsProps) {

  const getAvailableActions = () => {
    switch (campaign.status) {
      case 'draft':
        return [
          {
            id: 'activate',
            label: 'Activar',
            icon: Play,
            variant: 'default' as const,
            disabled: !campaign.canActivate || campaign.totalInvited < 5,
            primary: true
          },
          {
            id: 'edit',
            label: 'Editar',
            icon: Settings,
            variant: 'outline' as const,
            disabled: false,
            primary: false
          }
        ];
        
      case 'active':
        return [
          {
            id: 'complete',
            label: 'Completar',
            icon: CheckCircle,
            variant: 'default' as const,
            disabled: false,
            primary: true
          },
          {
            id: 'cancel',
            label: 'Cancelar',
            icon: Square,
            variant: 'destructive' as const,
            disabled: false,
            primary: false
          }
        ];
        
      case 'completed':
        return [
          {
            id: 'results',
            label: 'Ver Resultados',
            icon: Eye,
            variant: 'default' as const,
            disabled: !campaign.canViewResults,
            primary: true
          }
        ];
        
      case 'cancelled':
        return [
          {
            id: 'view',
            label: 'Ver Detalles',
            icon: Eye,
            variant: 'outline' as const,
            disabled: false,
            primary: true
          }
        ];
        
      default:
        return [];
    }
  };

  const actions = getAvailableActions();

  const handleAction = async (actionId: string) => {
    try {
      await onAction(actionId, campaign.id, campaign.name);
    } catch (error) {
      console.error(`Error ejecutando acción ${actionId}:`, error);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex gap-1">
        {actions.slice(0, 2).map((action) => {
          const ActionIcon = action.icon;
          return (
            <Button
              key={action.id}
              size="sm"
              variant={action.variant}
              disabled={action.disabled || isLoading}
              onClick={() => handleAction(action.id)}
              title={action.label}
            >
              <ActionIcon className="h-3 w-3" />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {actions.map((action) => {
        const ActionIcon = action.icon;
        return (
          <Button
            key={action.id}
            size="sm"
            variant={action.variant}
            disabled={action.disabled || isLoading}
            onClick={() => handleAction(action.id)}
            className={action.primary ? 'btn-gradient' : ''}
          >
            <ActionIcon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}