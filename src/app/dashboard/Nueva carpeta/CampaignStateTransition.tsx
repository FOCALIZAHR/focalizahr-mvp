import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import CampaignStatusBadge from './CampaignStatusBadge';
import CampaignActionButtons from './CampaignActionButtons';
import CampaignStateValidator from './CampaignStateValidator';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  totalInvited: number;
  startDate: string;
  endDate: string;
  campaignType?: {
    name: string;
    slug: string;
  };
}

interface CampaignStateTransitionProps {
  campaign: Campaign;
  onStateChange: (campaignId: string, newStatus: string, action: string) => Promise<void>;
  layout?: 'card' | 'inline' | 'compact';
  showValidation?: boolean;
  onActivateCampaign?: (campaignId: string, campaignName: string) => Promise<void>;
  onCampaignAction?: (action: string, campaignId: string, campaign?: Campaign) => void;
}

interface PendingAction {
  action: string;
  targetState: 'active' | 'completed' | 'cancelled';
  title: string;
  description: string;
}

const CampaignStateTransition: React.FC<CampaignStateTransitionProps> = ({
  campaign,
  onStateChange,
  layout = 'card',
  showValidation = true,
  onActivateCampaign,
  onCampaignAction
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const actionConfig = {
    activate: {
      targetState: 'active' as const,
      title: 'Activar Campaña',
      description: 'La campaña será enviada a todos los participantes y comenzará a recibir respuestas.'
    },
    complete: {
      targetState: 'completed' as const,
      title: 'Completar Campaña',
      description: 'La campaña se marcará como completada y se procesarán los resultados finales.'
    },
    cancel: {
      targetState: 'cancelled' as const,
      title: 'Cancelar Campaña',
      description: 'La campaña se cancelará y no se podrán recibir más respuestas.'
    }
  };

  const handleAction = async (action: string, campaignId: string) => {
    const config = actionConfig[action as keyof typeof actionConfig];
    
    if (!config) {
      // Acciones que no requieren confirmación (view, edit, monitor, results)
      if (onCampaignAction) {
        onCampaignAction(action, campaignId, campaign);
      }
      return;
    }

    // Acción especial: activar campaña
    if (action === 'activate' && onActivateCampaign) {
      try {
        setIsLoading(true);
        await onActivateCampaign(campaignId, campaign.name);
        // onActivateCampaign ya maneja el refresh
      } catch (error) {
        console.error('Error activating campaign:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Acciones que requieren confirmación
    setPendingAction({
      action,
      ...config
    });
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || !validationResult?.isValid) return;

    setIsLoading(true);
    try {
      await onStateChange(campaign.id, pendingAction.targetState, pendingAction.action);
      setPendingAction(null);
    } catch (error) {
      console.error('Error changing campaign state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setValidationResult(null);
  };

  const renderContent = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CampaignStatusBadge 
            status={campaign.status} 
            variant={layout === 'compact' ? 'compact' : 'default'}
          />
          {layout !== 'compact' && (
            <div>
              <h3 className="font-medium">{campaign.name}</h3>
              <p className="text-sm text-muted-foreground">
                {campaign.totalInvited} participantes
              </p>
            </div>
          )}
        </div>
        
        <CampaignActionButtons
          campaign={campaign}
          onAction={handleAction}
          isLoading={isLoading}
          layout={layout === 'compact' ? 'horizontal' : 'horizontal'}
        />
      </div>
    </>
  );

  if (layout === 'inline') {
    return (
      <>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          {renderContent()}
        </div>

        {/* Dialog de confirmación */}
        <Dialog open={!!pendingAction} onOpenChange={handleCancelAction}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pendingAction?.title}</DialogTitle>
              <DialogDescription>
                {pendingAction?.description}
              </DialogDescription>
            </DialogHeader>

            {pendingAction && showValidation && (
              <div className="my-4">
                <CampaignStateValidator
                  campaign={campaign}
                  targetState={pendingAction.targetState}
                  onValidate={setValidationResult}
                  showDetails={true}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelAction}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={!validationResult?.isValid || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (layout === 'compact') {
    return (
      <>
        <div className="flex items-center gap-2">
          <CampaignStatusBadge status={campaign.status} variant="compact" />
          <CampaignActionButtons
            campaign={campaign}
            onAction={handleAction}
            isLoading={isLoading}
            layout="horizontal"
          />
        </div>

        {/* Dialog de confirmación */}
        <Dialog open={!!pendingAction} onOpenChange={handleCancelAction}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pendingAction?.title}</DialogTitle>
              <DialogDescription>
                {pendingAction?.description}
              </DialogDescription>
            </DialogHeader>

            {pendingAction && showValidation && (
              <div className="my-4">
                <CampaignStateValidator
                  campaign={campaign}
                  targetState={pendingAction.targetState}
                  onValidate={setValidationResult}
                  showDetails={true}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelAction}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={!validationResult?.isValid || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Layout por defecto: card
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gestión de Estado</CardTitle>
          <CardDescription>
            Administra el ciclo de vida de la campaña
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog open={!!pendingAction} onOpenChange={handleCancelAction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingAction?.title}</DialogTitle>
            <DialogDescription>
              {pendingAction?.description}
            </DialogDescription>
          </DialogHeader>

          {pendingAction && showValidation && (
            <div className="my-4">
              <CampaignStateValidator
                campaign={campaign}
                targetState={pendingAction.targetState}
                onValidate={setValidationResult}
                showDetails={true}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAction}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={!validationResult?.isValid || isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CampaignStateTransition;