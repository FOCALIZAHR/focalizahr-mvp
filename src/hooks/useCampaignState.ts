import { useState, useMemo, useCallback } from 'react';
import { Play, Square, Clock, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

// Definiciones de Tipos Expandidas
export interface StateTransition {
  from: string;
  to: string;
  action: string;
  buttonText: string;
  buttonIcon: React.ElementType; // Componente del ícono, no JSX
  buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary';
  description: string;
  requiresConfirmation: boolean;
  validationRules: string[];
}

export interface Campaign {
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

// TYPES ADICIONALES RESTAURADOS
export interface CampaignForState {
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

// HOOK PRINCIPAL CONSOLIDADO - COMPATIBLE CON AMBAS VERSIONES
export const useCampaignState = ({ 
  onSuccess 
}: { 
  onSuccess: () => Promise<void> | void 
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // FUNCIÓN DE VALIDACIÓN ROBUSTA
  const validateTransition = useCallback((campaign: Campaign, transition: StateTransition): { valid: boolean; errors: string[] } => {
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

    if (transition.action === 'cancel') {
      if (campaign.status === 'active' && campaign.participationRate > 0) {
        // Advertencia, pero no error bloqueante
        errors.push('Se preservarán las respuestas recibidas hasta ahora');
      }
    }

    return {
      valid: errors.length === 0 || (transition.action === 'cancel' && errors.length === 1),
      errors
    };
  }, []);

  // FUNCIÓN DE EJECUCIÓN DE TRANSICIONES
  const executeTransition = useCallback(async (campaignId: string, transition: StateTransition) => {
    setIsTransitioning(true);
    setTransitionError(null);

    try {
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toStatus: transition.to,
          action: transition.action
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar estado de campaña');
      }

      await onSuccess(); // Callback para actualizar UI padre

    } catch (error) {
      setTransitionError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsTransitioning(false);
    }
  }, [onSuccess]);

  // TRANSICIONES DISPONIBLES POR ESTADO - COMPLETAMENTE RESTAURADAS
  const getPossibleTransitions = useMemo(() => (status: string): StateTransition[] => {
    const allTransitions: Record<string, StateTransition[]> = {
      draft: [{
        from: 'draft',
        to: 'active',
        action: 'activate',
        buttonText: 'Activar Campaña',
        buttonIcon: Play,
        buttonVariant: 'default',
        description: 'Inicia la campaña y envía invitaciones a todos los participantes.',
        requiresConfirmation: true,
        validationRules: [
          'Debe tener al menos 5 participantes',
          'Fechas de campaña válidas',
          'Configuración completa'
        ]
      }],
      active: [
        {
          from: 'active',
          to: 'completed',
          action: 'complete',
          buttonText: 'Marcar Completada',
          buttonIcon: CheckCircle,
          buttonVariant: 'outline',
          description: 'Finalizar la campaña manualmente y procesar resultados finales.',
          requiresConfirmation: true,
          validationRules: [
            'Campaña ha alcanzado fecha fin o criterios de completitud'
          ]
        },
        {
          from: 'active',
          to: 'cancelled',
          action: 'cancel',
          buttonText: 'Cancelar Campaña',
          buttonIcon: Square,
          buttonVariant: 'destructive',
          description: 'Cancelar la campaña. Los datos recibidos se preservarán pero no se enviarán más invitaciones.',
          requiresConfirmation: true,
          validationRules: [
            'Esta acción preservará las respuestas recibidas hasta ahora'
          ]
        }
      ]
    };

    return allTransitions[status] || [];
  }, []);

  // VERSIÓN ALTERNATIVA MEMOIZADA TAMBIÉN DISPONIBLE
  const getPossibleTransitionsAlt = useMemo((): ((status: CampaignForState['status']) => StateTransition[]) => (status) => {
    const allTransitions: Record<string, StateTransition[]> = {
      draft: [{ 
        from: 'draft',
        to: 'active', 
        action: 'activate', 
        buttonText: 'Activar Campaña', 
        buttonIcon: Play, 
        buttonVariant: 'default', 
        description: 'La campaña será enviada a todos los participantes y comenzará a recibir respuestas.', 
        requiresConfirmation: true, 
        validationRules: [
          'Debe tener al menos 5 participantes',
          'Fechas de campaña válidas',
          'Configuración completa'
        ] 
      }],
      active: [
        { 
          from: 'active',
          to: 'completed', 
          action: 'complete', 
          buttonText: 'Marcar Completada', 
          buttonIcon: CheckCircle, 
          buttonVariant: 'outline', 
          description: 'Finalizar la campaña manualmente y procesar resultados finales.', 
          requiresConfirmation: true, 
          validationRules: [
            'Campaña ha alcanzado fecha fin o criterios de completitud'
          ] 
        },
        { 
          from: 'active',
          to: 'cancelled', 
          action: 'cancel', 
          buttonText: 'Cancelar Campaña', 
          buttonIcon: Square, 
          buttonVariant: 'destructive', 
          description: 'Cancelar la campaña. Los datos recibidos se preservarán pero no se enviarán más invitaciones.',
          requiresConfirmation: true, 
          validationRules: [
            'Esta acción preservará las respuestas recibidas hasta ahora'
          ]
        }
      ]
    };

    return allTransitions[status] || [];
  }, []);

  // CONFIGURACIÓN VISUAL DE ESTADOS
  const getStatusConfig = useMemo(() => (status: string) => {
    const configs = {
      draft: {
        text: 'Borrador',
        icon: Clock,
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        description: 'Campaña en preparación'
      },
      active: {
        text: 'Activa',
        icon: Activity,
        badgeClass: 'bg-green-100 text-green-700 border-green-300',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Recibiendo respuestas'
      },
      completed: {
        text: 'Completada',
        icon: CheckCircle,
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Resultados disponibles'
      },
      cancelled: {
        text: 'Cancelada',
        icon: Square,
        badgeClass: 'bg-red-100 text-red-700 border-red-300',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: 'Campaña cancelada'
      }
    };

    return configs[status as keyof typeof configs] || configs.draft;
  }, []);

  return {
    isTransitioning,
    transitionError,
    executeTransition,
    getPossibleTransitions,
    getPossibleTransitionsAlt, // VERSIÓN ALTERNATIVA DISPONIBLE
    getStatusConfig,
    validateTransition
  };
};