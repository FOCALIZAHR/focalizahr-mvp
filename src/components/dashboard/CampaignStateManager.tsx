import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Play,
  Pause,
  Square,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  BarChart3,
  Eye,
  Settings,
  Users,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react';

// Tipos extendidos del sistema existente
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

interface StateTransition {
  from: string;
  to: string;
  action: string;
  requiresConfirmation: boolean;
  validationRules: string[];
  buttonText: string;
  buttonIcon: React.ReactNode;
  buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary';
  description: string;
}

interface CampaignStateManagerProps {
  campaign: Campaign;
  onStateChange: (campaignId: string, newStatus: string, action: string) => Promise<void>;
  isLoading?: boolean;
}

const CampaignStateManager: React.FC<CampaignStateManagerProps> = ({
  campaign,
  onStateChange,
  isLoading = false
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<StateTransition | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Definir transiciones de estado válidas según reglas de negocio
  const stateTransitions: StateTransition[] = [
    {
      from: 'draft',
      to: 'active',
      action: 'activate',
      requiresConfirmation: true,
      validationRules: [
        'Debe tener al menos 5 participantes',
        'Fechas de campaña válidas',
        'Configuración completa'
      ],
      buttonText: 'Activar Campaña',
      buttonIcon: <Play className="h-4 w-4" />,
      buttonVariant: 'default',
      description: 'La campaña será enviada a todos los participantes y comenzará a recibir respuestas.'
    },
    {
      from: 'active',
      to: 'completed',
      action: 'complete',
      requiresConfirmation: true,
      validationRules: [
        'Campaña ha alcanzado fecha fin o criterios de completitud'
      ],
      buttonText: 'Marcar Completada',
      buttonIcon: <CheckCircle className="h-4 w-4" />,
      buttonVariant: 'outline',
      description: 'Finalizar la campaña manualmente y procesar resultados finales.'
    },
    {
      from: 'active',
      to: 'cancelled',
      action: 'cancel',
      requiresConfirmation: true,
      validationRules: [
        'Esta acción preservará las respuestas recibidas hasta ahora'
      ],
      buttonText: 'Cancelar Campaña',
      buttonIcon: <Square className="h-4 w-4" />,
      buttonVariant: 'destructive',
      description: 'Cancelar la campaña. Los datos recibidos se preservarán pero no se enviarán más invitaciones.'
    }
  ];

  // Obtener transiciones válidas para el estado actual
  const getAvailableTransitions = (): StateTransition[] => {
    return stateTransitions.filter(transition => transition.from === campaign.status);
  };

  // Validar si una transición es posible
  const validateTransition = (transition: StateTransition): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (transition.action === 'activate') {
      if (campaign.totalInvited < 5) {
        errors.push('Se requieren al menos 5 participantes para activar la campaña');
      }
      
      const startDate = new Date(campaign.startDate);
      const now = new Date();
      if (startDate < now) {
        errors.push('La fecha de inicio no puede ser en el pasado');
      }
      
      if (!campaign.canActivate) {
        errors.push('La campaña no cumple con los requisitos para ser activada');
      }
    }

    if (transition.action === 'complete') {
      const endDate = new Date(campaign.endDate);
      const now = new Date();
      if (endDate > now && campaign.participationRate < 50) {
        errors.push('Se recomienda esperar más respuestas antes de completar la campaña');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Ejecutar transición de estado
  const executeTransition = async (transition: StateTransition) => {
    setIsTransitioning(true);
    setTransitionError(null);

    try {
      // Validar transición
      const validation = validateTransition(transition);
      if (!validation.valid) {
        throw new Error(validation.errors.join('. '));
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
    <div className="space-y-4">
      
      {/* Estado Actual */}
      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center`}>
                <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Estado Actual</h3>
                  <Badge className={statusConfig.badge.class}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.badge.text}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
              </div>
            </div>

            {/* Información adicional del estado */}
            <div className="text-right text-sm text-muted-foreground">
              {campaign.status === 'active' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{campaign.participationRate.toFixed(1)}% participación</span>
                  </div>
                  {campaign.daysRemaining !== undefined && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{campaign.daysRemaining > 0 ? `${campaign.daysRemaining} días restantes` : 'Vencida'}</span>
                    </div>
                  )}
                </div>
              )}
              
              {campaign.status === 'completed' && (
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>Resultados disponibles</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Riesgo */}
      {campaign.riskLevel && campaign.riskLevel !== 'low' && campaign.status === 'active' && (
        <Alert className={`${
          campaign.riskLevel === 'high' ? 'border-destructive' : 'border-yellow-500'
        }`}>
          <AlertTriangle className={`h-4 w-4 ${
            campaign.riskLevel === 'high' ? 'text-destructive' : 'text-yellow-600'
          }`} />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Nivel de Riesgo: {campaign.riskLevel === 'high' ? 'Alto' : 'Medio'}</strong>
                <div className="text-sm mt-1">
                  {campaign.participationRate < 30 && 'Baja participación detectada'}
                  {campaign.isOverdue && 'Campaña vencida'}
                  {campaign.daysRemaining !== undefined && campaign.daysRemaining <= 2 && campaign.daysRemaining > 0 && 'Próxima a vencer'}
                </div>
              </div>
              <Badge variant={campaign.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                <Shield className="h-3 w-3 mr-1" />
                Riesgo {campaign.riskLevel === 'high' ? 'Alto' : 'Medio'}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Acciones Disponibles */}
      {availableTransitions.length > 0 && (
        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="text-lg">Acciones Disponibles</CardTitle>
            <CardDescription>
              Gestiona el estado de tu campaña
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableTransitions.map((transition) => {
              const validation = validateTransition(transition);
              
              return (
                <div key={`${transition.from}-${transition.to}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {transition.buttonIcon}
                      <span className="font-medium">{transition.buttonText}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{transition.description}</p>
                    
                    {!validation.valid && (
                      <div className="mt-2">
                        <Alert className="border-yellow-500 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-sm">
                            <div className="font-medium text-yellow-800 mb-1">Requisitos pendientes:</div>
                            <ul className="text-yellow-700 text-xs list-disc list-inside space-y-0.5">
                              {validation.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant={transition.buttonVariant}
                    onClick={() => handleTransitionClick(transition)}
                    disabled={!validation.valid || isTransitioning || isLoading}
                    className="ml-4 focus-ring"
                  >
                    {isTransitioning ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      transition.buttonIcon
                    )}
                    <span className="ml-2">{transition.buttonText}</span>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Error de Transición */}
      {transitionError && (
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error al cambiar estado:</strong> {transitionError}
          </AlertDescription>
        </Alert>
      )}

      {/* Modal de Confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="glass-card max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {showConfirmation.buttonIcon}
                Confirmar {showConfirmation.buttonText}
              </CardTitle>
              <CardDescription>
                {showConfirmation.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Requisitos */}
              <div>
                <h4 className="font-medium mb-2">Verificaciones:</h4>
                <ul className="text-sm space-y-1">
                  {showConfirmation.validationRules.map((rule, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Información adicional */}
              {showConfirmation.action === 'activate' && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Al activar la campaña, se enviarán emails de invitación a todos los participantes.
                    Esta acción no se puede deshacer.
                  </AlertDescription>
                </Alert>
              )}

              {showConfirmation.action === 'cancel' && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-sm">
                    Las respuestas recibidas hasta ahora se preservarán, pero no se podrán recopilar más datos.
                  </AlertDescription>
                </Alert>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(null)}
                  className="flex-1 focus-ring"
                  disabled={isTransitioning}
                >
                  Cancelar
                </Button>
                <Button
                  variant={showConfirmation.buttonVariant}
                  onClick={() => executeTransition(showConfirmation)}
                  disabled={isTransitioning}
                  className={`flex-1 focus-ring ${isTransitioning ? 'btn-loading' : ''}`}
                >
                  {isTransitioning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      <span className="btn-text">Procesando...</span>
                    </>
                  ) : (
                    <>
                      {showConfirmation.buttonIcon}
                      <span className="ml-2">Confirmar</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Información Adicional por Estado */}
      {campaign.status === 'active' && (
        <Card className="professional-card border-l-4 border-l-green-500">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignStateManager;