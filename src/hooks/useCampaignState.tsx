import { useState, useCallback, useMemo } from 'react';
import { Play, CheckCircle, Square, Clock, Activity } from 'lucide-react';

export interface StateTransition {
  from: string;
  to: string;
  action: string;
  buttonText: string;
  buttonIcon: any;
  buttonVariant: 'default' | 'outline' | 'destructive';
  description: string;
  requiresConfirmation: boolean;
  validationRules: string[];
}

interface CampaignForState {
  id: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  participant_count?: number;
  start_date?: string;
  end_date?: string;
}

interface UseCampaignStateProps {
  onSuccess?: () => void;
}

export const useCampaignState = ({ onSuccess }: UseCampaignStateProps = {}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // VALIDACIONES MEJORADAS
  const validateTransition = useCallback((campaign: CampaignForState, transition: StateTransition): string[] => {
    const errors: string[] = [];
    
    // Validaciones específicas por transición
    if (transition.action === 'activate') {
      if (!campaign.participant_count || campaign.participant_count < 5) {
        errors.push('La campaña debe tener al menos 5 participantes para ser activada');
      }
      
      if (!campaign.start_date || !campaign.end_date) {
        errors.push('Las fechas de inicio y fin deben estar definidas');
      }
      
      if (campaign.start_date && campaign.end_date) {
        const startDate = new Date(campaign.start_date);
        const endDate = new Date(campaign.end_date);
        const now = new Date();
        
        if (startDate < now) {
          errors.push('La fecha de inicio no puede ser en el pasado');
        }
        
        if (endDate <= startDate) {
          errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }
    }
    
    if (transition.action === 'complete') {
      if (campaign.status !== 'active') {
        errors.push('Solo se pueden completar campañas activas');
      }
    }
    
    return errors;
  }, []);

  // ✅ EJECUCIÓN DE TRANSICIÓN CORREGIDA - FIRMA DESACOPLADA + URL CORREGIDA
  const executeTransition = useCallback(async (
    campaignId: string, 
    transition: StateTransition
  ): Promise<boolean> => {
    console.log('✅ executeTransition - campaignId received:', campaignId);
    console.log('✅ executeTransition - transition action:', transition.action);
    setIsTransitioning(true);
    setTransitionError(null);

    try {
      // ✅ URL CORREGIDA: /status en lugar de /transition
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PUT', // ✅ MÉTODO CORREGIDO según el endpoint existente
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('focalizahr_token')}` // ✅ AUTH HEADER
        },
        body: JSON.stringify({
          toStatus: transition.to,  // ✅ PAYLOAD CORREGIDO según endpoint
          action: transition.action
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al ejecutar transición');
      }

      // Ejecutar callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setTransitionError(errorMessage);
      return false;
    } finally {
      setIsTransitioning(false);
    }
  }, [onSuccess]);

  // TRANSICIONES DISPONIBLES - LÓGICA CORREGIDA
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
          buttonText: 'Completar',
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
          buttonText: 'Cancelar',
          buttonIcon: Square,
          buttonVariant: 'destructive',
          description: 'Cancelar la campaña. Los datos recibidos se preservarán.',
          requiresConfirmation: true,
          validationRules: [
            'Esta acción preservará las respuestas recibidas hasta ahora'
          ]
        }
      ],
      // Estados terminales no tienen transiciones disponibles
      completed: [],
      cancelled: []
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
        bgColor: 'bg-gray-50',
        description: 'Campaña en preparación'
      },
      active: {
        text: 'Activa',
        icon: Activity,
        badgeClass: 'bg-green-100 text-green-700 border-green-300',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'Recibiendo respuestas'
      },
      completed: {
        text: 'Completada',
        icon: CheckCircle,
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Resultados disponibles'
      },
      cancelled: {
        text: 'Cancelada',
        icon: Square,
        badgeClass: 'bg-red-100 text-red-700 border-red-300',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
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
    getStatusConfig,
    validateTransition
  };
};