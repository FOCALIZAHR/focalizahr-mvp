import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  Square,
  CheckCircle,
  Eye,
  Settings,
  BarChart3,
  Loader2
} from 'lucide-react';

interface Campaign {
  id: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  totalInvited: number;
}

interface ActionButton {
  key: string;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  action: string;
  disabled?: boolean;
  loading?: boolean;
}

interface CampaignActionButtonsProps {
  campaign: Campaign;
  onAction: (action: string, campaignId: string) => void;
  availableActions?: string[];
  isLoading?: boolean;
  layout?: 'horizontal' | 'vertical' | 'dropdown';
}

const CampaignActionButtons: React.FC<CampaignActionButtonsProps> = ({
  campaign,
  onAction,
  availableActions,
  isLoading = false,
  layout = 'horizontal'
}) => {
  const getAvailableButtons = (): ActionButton[] => {
    const buttons: ActionButton[] = [];

    switch (campaign.status) {
      case 'draft':
        buttons.push({
          key: 'activate',
          label: 'Activar',
          icon: <Play className="h-4 w-4" />,
          variant: 'default',
          action: 'activate',
          disabled: campaign.totalInvited < 5
        });
        buttons.push({
          key: 'edit',
          label: 'Editar',
          icon: <Settings className="h-4 w-4" />,
          variant: 'outline',
          action: 'edit'
        });
        break;

      case 'active':
        buttons.push({
          key: 'monitor',
          label: 'Monitorear',
          icon: <Eye className="h-4 w-4" />,
          variant: 'outline',
          action: 'monitor'
        });
        buttons.push({
          key: 'complete',
          label: 'Completar',
          icon: <CheckCircle className="h-4 w-4" />,
          variant: 'outline',
          action: 'complete'
        });
        buttons.push({
          key: 'cancel',
          label: 'Cancelar',
          icon: <Square className="h-4 w-4" />,
          variant: 'destructive',
          action: 'cancel'
        });
        break;

      case 'completed':
        buttons.push({
          key: 'results',
          label: 'Ver Resultados',
          icon: <BarChart3 className="h-4 w-4" />,
          variant: 'default',
          action: 'results'
        });
        break;

      case 'cancelled':
        buttons.push({
          key: 'view',
          label: 'Ver Detalles',
          icon: <Eye className="h-4 w-4" />,
          variant: 'outline',
          action: 'view'
        });
        break;

      default:
        break;
    }

    // Filtrar por acciones disponibles si se especifican
    if (availableActions) {
      return buttons.filter(button => availableActions.includes(button.action));
    }

    return buttons;
  };

  const handleButtonClick = (action: string) => {
    if (isLoading) return;
    onAction(action, campaign.id);
  };

  const buttons = getAvailableButtons();

  if (buttons.length === 0) {
    return null;
  }

  const renderButton = (button: ActionButton) => (
    <Button
      key={button.key}
      variant={button.variant}
      size="sm"
      onClick={() => handleButtonClick(button.action)}
      disabled={button.disabled || isLoading}
      className="min-w-[100px]"
    >
      {isLoading && button.loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        button.icon
      )}
      <span className="ml-2">{button.label}</span>
    </Button>
  );

  if (layout === 'vertical') {
    return (
      <div className="flex flex-col gap-2">
        {buttons.map(renderButton)}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {buttons.map(renderButton)}
    </div>
  );
};

export default CampaignActionButtons;