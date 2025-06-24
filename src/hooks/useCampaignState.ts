// src/hooks/useCampaignState.tsx
import { useState, useMemo } from 'react';
import { Play, Square, Clock, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

// Definiciones de Tipos
export interface StateTransition {
  to: string;
  action: string;
  buttonText: string;
  buttonIcon: React.ReactNode;
  buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary';
  description: string;
  requiresConfirmation: boolean;
  validationRules: string[];
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  daysRemaining?: number;
}

export const useCampaignState = ({ 
  onSuccess 
}: { 
  onSuccess: () => Promise<void> | void 
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const executeTransition = async (campaignId: string, transition: StateTransition) => {
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
        throw new Error(errorData.error || 'Failed to change campaign state');
      }

      await onSuccess(); // Llama al callback de éxito para que el padre refresque los datos
      
    } catch (error) {
      setTransitionError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsTransitioning(false);
    }
  };

  // ALTERNATIVA SIN JSX: Retornar strings de iconos para evitar problemas
  const getPossibleTransitions = useMemo(() => (status: string): StateTransition[] => {
    const allTransitions: Record<string, StateTransition[]> = {
      draft: [{
        to: 'active', 
        action: 'activate', 
        buttonText: 'Activar', 
        buttonIcon: Play,  // Retornamos el componente, no JSX
        buttonVariant: 'default', 
        description: 'Inicia la campaña y envía invitaciones.',
        requiresConfirmation: true, 
        validationRules: [
          'La campaña debe tener participantes.', 
          'Las fechas de inicio y fin deben ser válidas.'
        ]
      }],
      active: [{
        to: 'cancelled', 
        action: 'cancel', 
        buttonText: 'Cancelar', 
        buttonIcon: Square,  // Componente sin JSX
        buttonVariant: 'destructive', 
        description: 'Finaliza la recolección de datos.',
        requiresConfirmation: true, 
        validationRules: [
          'No se podrán recopilar más respuestas.', 
          'La acción es irreversible.'
        ]
      }, {
        to: 'completed', 
        action: 'complete', 
        buttonText: 'Completar', 
        buttonIcon: CheckCircle,  // Componente sin JSX
        buttonVariant: 'outline', 
        description: 'Cierra la campaña y procesa los resultados.',
        requiresConfirmation: true, 
        validationRules: ['Los resultados serán definitivos.']
      }]
    };
    return allTransitions[status] || [];
  }, []);

  const getStatusConfig = useMemo(() => (status: string) => {
    const configs = {
      draft: { text: 'Borrador', icon: Clock, badgeClass: 'badge-gradient-draft' },
      active: { text: 'Activa', icon: Activity, badgeClass: 'badge-gradient-active' },
      completed: { text: 'Completada', icon: CheckCircle, badgeClass: 'badge-gradient-completed' },
      cancelled: { text: 'Cancelada', icon: Square, badgeClass: 'badge-gradient-cancelled' }
    };
    return configs[status as keyof typeof configs] || { 
      text: 'Desconocido', 
      icon: AlertTriangle, 
      badgeClass: 'bg-gray-500' 
    };
  }, []);

  return {
    isTransitioning,
    transitionError,
    executeTransition,
    getPossibleTransitions,
    getStatusConfig
  };
};