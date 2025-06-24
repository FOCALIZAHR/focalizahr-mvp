'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Activity, 
  CheckCircle, 
  Square, 
  AlertTriangle,
  Play,
  Pause,
  BarChart3,
  X
} from 'lucide-react';

// Tipos
interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  daysRemaining?: number;
}

interface StateTransition {
  to: string;
  action: string;
  buttonText: string;
  buttonIcon: React.ReactNode;
  description: string;
  requiresConfirmation: boolean;
  validationRules: string[];
}

// Componente Modal Separado
const ConfirmationModal = ({ 
  showConfirmation, 
  onConfirm, 
  onCancel, 
  isTransitioning 
}: {
  showConfirmation: StateTransition | null;
  onConfirm: () => void;
  onCancel: () => void;
  isTransitioning: boolean;
}) => {
  if (!showConfirmation) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="glass-card max-w-md w-full mx-4 animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {showConfirmation.buttonIcon}
              Confirmar {showConfirmation.buttonText}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isTransitioning}
              className="h-6 w-6 p-0 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {showConfirmation.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          
          {/* Verificaciones */}
          <div>
            <h4 className="font-medium mb-2">Verificaciones:</h4>
            <ul className="text-sm space-y-1">
              {showConfirmation.validationRules.map((rule, index) => (
                <li key={index} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {/* Información específica por acción */}
          {showConfirmation.action === 'activate' && (
            <Alert className="context-container-info">
              <div className="context-content">
                <p className="text-sm">
                  Al activar la campaña, se enviarán emails de invitación a todos los participantes.
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </Alert>
          )}

          {showConfirmation.action === 'cancel' && (
            <div className="context-container-warning">
              <AlertTriangle className="context-icon flex-shrink-0" />
              <div className="context-content">
                <p className="text-sm">
                  Las respuestas recibidas hasta ahora se preservarán, pero no se podrán recopilar más datos.
                </p>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center gap-3 pt-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isTransitioning}
              className="flex-1"
            >
              Cerrar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isTransitioning}
              className={`flex-1 ${
                showConfirmation.action === 'cancel' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'btn-gradient'
              }`}
            >
              {isTransitioning ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  {showConfirmation.buttonIcon}
                  <span className="ml-2">
                    {showConfirmation.action === 'cancel' ? 'Sí, cancelar campaña' : 'Confirmar'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente Principal
const CampaignStateManager = ({ 
  campaign, 
  onStateChange 
}: { 
  campaign: Campaign; 
  onStateChange: (campaignId: string, newStatus: string, action: string) => Promise<void>; 
}) => {
  const [showConfirmation, setShowConfirmation] = useState<StateTransition | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Obtener transiciones disponibles según estado actual
  const getAvailableTransitions = (): StateTransition[] => {
    const transitions: Record<string, StateTransition[]> = {
      draft: [
        {
          to: 'active',
          action: 'activate',
          buttonText: 'Activar Campaña',
          buttonIcon: <Play className="h-4 w-4" />,
          description: 'Activar la campaña para comenzar a recibir respuestas.',
          requiresConfirmation: true,
          validationRules: [
            'La campaña tiene participantes configurados',
            'Las fechas de inicio y fin están establecidas',
            'El contenido de la encuesta está completo'
          ]
        }
      ],
      active: [
        {
          to: 'completed',
          action: 'complete',
          buttonText: 'Completar Campaña',
          buttonIcon: <CheckCircle className="h-4 w-4" />,
          description: 'Finalizar la campaña y generar resultados finales.',
          requiresConfirmation: true,
          validationRules: [
            'Se han recibido suficientes respuestas',
            'Los resultados serán definitivos'
          ]
        },
        {
          to: 'cancelled',
          action: 'cancel',
          buttonText: 'Cancelar Campaña',
          buttonIcon: <Square className="h-4 w-4" />,
          description: 'Cancelar la campaña activa.',
          requiresConfirmation: true,
          validationRules: [
            'Esta acción preservará las respuestas recibidas hasta ahora',
            'No se podrán recopilar más datos'
          ]
        }
      ]
    };

    return transitions[campaign.status] || [];
  };

  // Ejecutar transición de estado
  const executeTransition = async (transition: StateTransition) => {
    setIsTransitioning(true);
    setTransitionError(null);

    try {
      // Validaciones adicionales si es necesario
      if (transition.action === 'activate' && campaign.totalInvited === 0) {
        throw new Error('No se puede activar una campaña sin participantes');
      }

      // Ejecutar cambio de estado
      await onStateChange(campaign.id, transition.to, transition.action);
      
      // Limpiar confirmación
      setShowConfirmation(null);
    } catch (error) {
      setTransitionError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsTransitioning(false);
    }
  };

  // Manejar click en botón de transición
  const handleTransitionClick = (transition: StateTransition) => {
    if (transition.requiresConfirmation) {
      setShowConfirmation(transition);
    } else {
      executeTransition(transition);
    }
  };

  // Obtener configuración visual del estado
  const getStatusConfig = (status: string) => {
    const configs = {
      draft: {
        badge: { variant: 'secondary' as const, icon: Clock, text: 'Borrador', class: 'badge-gradient-draft' },
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        description: 'Campaña en preparación'
      },
      active: {
        badge: { variant: 'default' as const, icon: Activity, text: 'Activa', class: 'badge-gradient-active' },
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Recibiendo respuestas'
      },
      completed: {
        badge: { variant: 'outline' as const, icon: CheckCircle, text: 'Completada', class: 'badge-gradient-completed' },
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Resultados disponibles'
      },
      cancelled: {
        badge: { variant: 'destructive' as const, icon: Square, text: 'Cancelada', class: 'badge-gradient-cancelled' },
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: 'Campaña cancelada'
      }
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const statusConfig = getStatusConfig(campaign.status);
  const StatusIcon = statusConfig.badge.icon;
  const availableTransitions = getAvailableTransitions();

  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center`}>
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span>{campaign.name}</span>
              <Badge variant={statusConfig.badge.variant} className={statusConfig.badge.class}>
                {statusConfig.badge.text}
              </Badge>
            </div>
            <CardDescription className="mt-1">{statusConfig.description}</CardDescription>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error de Transición */}
        {transitionError && (
          <Alert className="border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error al cambiar estado:</strong> {transitionError}
            </AlertDescription>
          </Alert>
        )}

        {/* Transiciones Disponibles */}
        {availableTransitions.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Acciones Disponibles:</h4>
            {availableTransitions.map((transition, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {transition.buttonIcon}
                  <div>
                    <div className="font-medium">{transition.buttonText}</div>
                    <div className="text-sm text-muted-foreground">{transition.description}</div>
                  </div>
                </div>
                <Button
                  onClick={() => handleTransitionClick(transition)}
                  disabled={isTransitioning}
                  variant={transition.action === 'cancel' ? 'destructive' : 'default'}
                  className={`${transition.action !== 'cancel' ? 'btn-gradient' : ''} ${isTransitioning ? 'btn-loading' : ''}`}
                >
                  {isTransitioning ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    transition.buttonIcon
                  )}
                  <span className="ml-2">{transition.buttonText}</span>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No hay acciones disponibles para esta campaña.</p>
          </div>
        )}

        {/* Información Adicional por Estado */}
        {campaign.status === 'active' && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/20">
            <h4 className="font-medium mb-3">Estadísticas Actuales</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{campaign.totalResponded}</div>
                <div className="text-sm text-muted-foreground">Respuestas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{campaign.participationRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Participación</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{campaign.totalInvited}</div>
                <div className="text-sm text-muted-foreground">Invitados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {campaign.daysRemaining !== undefined ? Math.max(0, campaign.daysRemaining) : '-'}
                </div>
                <div className="text-sm text-muted-foreground">Días Restantes</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal de Confirmación */}
      <ConfirmationModal
        showConfirmation={showConfirmation}
        onConfirm={() => showConfirmation && executeTransition(showConfirmation)}
        onCancel={() => setShowConfirmation(null)}
        isTransitioning={isTransitioning}
      />
    </Card>
  );
};

export default CampaignStateManager;