import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, CheckCircle, Eye, Settings, BarChart3, Loader2, AlertTriangle } from 'lucide-react';

type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  canActivate?: boolean;
  canViewResults?: boolean;
}

interface ActionDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  requiresConfirmation: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
  validationRules?: string[];
  disabled?: boolean;
  disabledReason?: string;
}

interface CampaignActionButtonsProps {
  campaign: Campaign;
  onAction: (actionId: string, campaignId: string, campaignName: string) => Promise<void>;
  variant?: 'default' | 'compact' | 'dropdown';
  isLoading?: boolean;
  showLabels?: boolean;
}

const CampaignActionButtons: React.FC<CampaignActionButtonsProps> = ({
  campaign,
  onAction,
  variant = 'default',
  isLoading = false,
  showLabels = true
}) => {
  const [showConfirmation, setShowConfirmation] = useState<ActionDefinition | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // ✅ DEFINICIÓN ACCIONES POR ESTADO
  const getAvailableActions = (status: CampaignStatus, campaign: Campaign): ActionDefinition[] => {
    const baseActions: Record<CampaignStatus, ActionDefinition[]> = {
      draft: [
        {
          id: 'activate',
          label: 'Activar Campaña',
          icon: Play,
          variant: 'default',
          requiresConfirmation: true,
          confirmationTitle: 'Activar Campaña',
          confirmationDescription: 'La campaña será enviada a todos los participantes y comenzará a recibir respuestas.',
          validationRules: [
            'Debe tener al menos 5 participantes',
            'Fechas de campaña válidas',
            'Configuración completa'
          ],
          disabled: !campaign.canActivate || campaign.totalInvited < 5,
          disabledReason: campaign.totalInvited < 5 
            ? 'Se requieren al menos 5 participantes' 
            : !campaign.canActivate 
              ? 'Configuración incompleta' 
              : undefined
        },
        {
          id: 'edit',
          label: 'Configurar',
          icon: Settings,
          variant: 'outline',
          requiresConfirmation: false
        }
      ],
      active: [
        {
          id: 'monitor',
          label: 'Monitorear',
          icon: BarChart3,
          variant: 'outline',
          requiresConfirmation: false
        },
        {
          id: 'complete',
          label: 'Completar',
          icon: CheckCircle,
          variant: 'outline',
          requiresConfirmation: true,
          confirmationTitle: 'Completar Campaña',
          confirmationDescription: 'Finalizar la campaña manualmente y procesar resultados finales.',
          validationRules: ['Se preservarán todas las respuestas recibidas']
        },
        {
          id: 'cancel',
          label: 'Cancelar',
          icon: Square,
          variant: 'destructive',
          requiresConfirmation: true,
          confirmationTitle: 'Cancelar Campaña',
          confirmationDescription: 'Cancelar la campaña. Los datos recibidos se preservarán pero no se enviarán más invitaciones.',
          validationRules: ['Esta acción preservará las respuestas recibidas hasta ahora']
        }
      ],
      completed: [
        {
          id: 'results',
          label: 'Ver Resultados',
          icon: Eye,
          variant: 'default',
          requiresConfirmation: false,
          disabled: !campaign.canViewResults,
          disabledReason: 'Resultados en procesamiento'
        }
      ],
      cancelled: [
        {
          id: 'view',
          label: 'Ver Detalles',
          icon: Eye,
          variant: 'outline',
          requiresConfirmation: false
        }
      ]
    };

    return baseActions[status] || [];
  };

  // ✅ VALIDACIÓN ACCIÓN
  const validateAction = (action: ActionDefinition): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (action.id === 'activate') {
      if (campaign.totalInvited < 5) {
        errors.push('Se requieren al menos 5 participantes para activar la campaña');
      }
      if (!campaign.canActivate) {
        errors.push('La campaña no cumple con los requisitos para ser activada');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // ✅ EJECUTAR ACCIÓN
  const executeAction = async (action: ActionDefinition) => {
    setIsExecuting(true);
    setExecutionError(null);

    try {
      // Validar acción
      const validation = validateAction(action);
      if (!validation.valid) {
        throw new Error(validation.errors.join('. '));
      }

      // Ejecutar acción
      await onAction(action.id, campaign.id, campaign.name);
      
      // Limpiar confirmación
      setShowConfirmation(null);
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsExecuting(false);
    }
  };

  // ✅ MANEJAR CLICK ACCIÓN
  const handleActionClick = (action: ActionDefinition) => {
    if (action.disabled) return;
    
    if (action.requiresConfirmation) {
      setShowConfirmation(action);
    } else {
      executeAction(action);
    }
  };

  const availableActions = getAvailableActions(campaign.status, campaign);

  // ✅ VARIANT COMPACT
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        {availableActions.slice(0, 2).map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              size="sm"
              variant={action.variant}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled || isLoading || isExecuting}
              title={action.disabledReason || action.label}
            >
              <Icon className="h-3 w-3" />
              {showLabels && <span className="ml-1">{action.label}</span>}
            </Button>
          );
        })}
      </div>
    );
  }

  // ✅ VARIANT DEFAULT
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {availableActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              size="sm"
              variant={action.variant}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled || isLoading || isExecuting}
              className="focus-ring"
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Icon className="h-4 w-4 mr-1" />
              )}
              {showLabels && action.label}
            </Button>
          );
        })}
      </div>

      {/* ✅ DIALOG CONFIRMACIÓN */}
      {showConfirmation && (
        <Dialog open={!!showConfirmation} onOpenChange={() => setShowConfirmation(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{showConfirmation.confirmationTitle}</DialogTitle>
              <DialogDescription>
                {showConfirmation.confirmationDescription}
              </DialogDescription>
            </DialogHeader>
            
            {showConfirmation.validationRules && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Consideraciones:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {showConfirmation.validationRules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {executionError && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  {executionError}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(null)}
                disabled={isExecuting}
              >
                Cancelar
              </Button>
              <Button
                variant={showConfirmation.variant}
                onClick={() => executeAction(showConfirmation)}
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <showConfirmation.icon className="h-4 w-4 mr-2" />
                    Confirmar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CampaignActionButtons;