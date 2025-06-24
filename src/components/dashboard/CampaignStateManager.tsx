'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  CheckCircle, 
  Clock, 
  Activity, 
  AlertTriangle,
  Eye,
  BarChart3,
  Users,
  Calendar
} from 'lucide-react';
import { useCampaignState } from '@/hooks/useCampaignState';

// Interfaces
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

interface CampaignStateManagerProps {
  campaign: Campaign;
  onCampaignUpdate: () => void;
}

// Modal de confirmación simple
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  transition,
  isTransitioning 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transition: any;
  isTransitioning: boolean;
}) => {
  if (!isOpen || !transition) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-lg">{transition.buttonText}</CardTitle>
          <CardDescription>{transition.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transition.action === 'cancel' && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                Las respuestas recibidas hasta ahora se preservarán, pero no se podrán recopilar más datos.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isTransitioning}
            >
              Cancelar
            </Button>
            <Button
              variant={transition.buttonVariant}
              onClick={onConfirm}
              disabled={isTransitioning}
              className="flex-1"
            >
              {isTransitioning ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                `Sí, ${transition.buttonText}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function CampaignStateManager({ 
  campaign, 
  onCampaignUpdate
}: CampaignStateManagerProps) {
  const [showConfirmation, setShowConfirmation] = useState<any>(null);

  // ✅ ARQUITECTURA CORRECTA: Usar el hook centralizado
  const { 
    isTransitioning, 
    transitionError, 
    executeTransition, 
    getPossibleTransitions, 
    getStatusConfig 
  } = useCampaignState({ 
    onSuccess: onCampaignUpdate
  });

  // Obtener configuración visual del estado
  const statusConfig = getStatusConfig(campaign.status);
  const StatusIcon = statusConfig.icon;

  // Obtener transiciones posibles
  const possibleTransitions = getPossibleTransitions(campaign.status);

  // Manejar clic en acción
  const handleActionClick = async (transition: any) => {
    if (transition.action === 'cancel' || transition.action === 'activate') {
      setShowConfirmation(transition);
    } else {
      // Otras acciones sin confirmación
      await executeTransition(campaign.id, transition);
    }
  };

  // Confirmar acción
  const handleConfirmAction = async () => {
    if (!showConfirmation) return;
    await executeTransition(campaign.id, showConfirmation);
    setShowConfirmation(null);
  };

  // Renderizar botones de acción según estado (FLUJO ORIGINAL)
  const renderActionButtons = () => {
    switch (campaign.status) {
      case 'draft':
        return (
          <Button 
            size="sm" 
            disabled={!campaign.canActivate || isTransitioning}
            onClick={() => {
              const activateTransition = possibleTransitions.find(t => t.action === 'activate');
              if (activateTransition) handleActionClick(activateTransition);
            }}
            className="btn-gradient focus-ring"
            title={!campaign.canActivate ? 'Se requieren al menos 5 participantes para activar' : 'Activar campaña'}
          >
            <Play className="h-3 w-3 mr-1" />
            Activar Campaña
          </Button>
        );

      case 'active':
        return (
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => window.open(`/dashboard/campaigns/${campaign.id}/monitor`, '_blank')}
              className="focus-ring"
            >
              <Eye className="h-3 w-3 mr-1" />
              Monitorear
            </Button>
            {campaign.participationRate > 20 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(`/dashboard/campaigns/${campaign.id}/preview-results`, '_blank')}
                className="focus-ring"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Vista Previa
              </Button>
            )}
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => {
                const cancelTransition = possibleTransitions.find(t => t.action === 'cancel');
                if (cancelTransition) handleActionClick(cancelTransition);
              }}
              disabled={isTransitioning}
              className="focus-ring"
            >
              <Square className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        );

      case 'completed':
        return (
          <Button 
            size="sm" 
            disabled={!campaign.canViewResults}
            onClick={() => window.open(`/dashboard/campaigns/${campaign.id}/results`, '_blank')}
            className="focus-ring"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Ver Resultados
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card className="professional-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                {campaign.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {campaign.campaignType.name}
              </CardDescription>
            </div>
            <Badge className={statusConfig.badgeClass}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.text}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Información del estado actual */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>
                {campaign.totalResponded}/{campaign.totalInvited} respuestas
                {campaign.totalInvited > 0 && (
                  <span className="text-gray-500 ml-1">
                    ({campaign.participationRate}%)
                  </span>
                )}
              </span>
            </div>
            
            {campaign.daysRemaining !== undefined && campaign.status === 'active' && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>
                  {campaign.daysRemaining > 0 
                    ? `${campaign.daysRemaining} días restantes`
                    : campaign.daysRemaining === 0 
                    ? 'Termina hoy'
                    : 'Vencida'
                  }
                </span>
              </div>
            )}
          </div>

          {/* Alertas de riesgo */}
          {campaign.riskLevel && campaign.riskLevel !== 'low' && campaign.status === 'active' && (
            <Alert className={
              campaign.riskLevel === 'high' 
                ? 'border-red-500 bg-red-50' 
                : 'border-yellow-500 bg-yellow-50'
            }>
              <AlertTriangle className={`h-4 w-4 ${
                campaign.riskLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <AlertDescription className="text-sm">
                {campaign.riskLevel === 'high' 
                  ? 'Baja participación detectada. Se recomienda enviar recordatorios.'
                  : 'Participación moderada. Considere enviar recordatorios si es necesario.'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Error de transición */}
          {transitionError && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-700">
                {transitionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Botones de acción */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Acciones disponibles:</span>
              {renderActionButtons()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={!!showConfirmation}
        onClose={() => setShowConfirmation(null)}
        onConfirm={handleConfirmAction}
        transition={showConfirmation}
        isTransitioning={isTransitioning}
      />
    </>
  );
}