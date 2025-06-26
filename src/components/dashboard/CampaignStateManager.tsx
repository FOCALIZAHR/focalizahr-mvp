'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCampaignsContext } from '@/context/CampaignsContext';
import { useCampaignState, StateTransition, CampaignForState } from '@/hooks/useCampaignState';
import { toast } from 'sonner';
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
  Shield,
} from 'lucide-react';
import type { Campaign } from '@/types';

// ✅ MODAL DE CONFIRMACIÓN MEJORADO
const ConfirmationModal: React.FC<{
  transition: StateTransition;
  campaign: CampaignForState;
  onConfirm: () => void;
  onCancel: () => void;
  isTransitioning: boolean;
  validationErrors: string[];
}> = ({ 
  transition, 
  campaign, 
  onConfirm, 
  onCancel, 
  isTransitioning, 
  validationErrors 
}) => {
  const ButtonIcon = transition.buttonIcon;
  
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
          <ButtonIcon className="h-4 w-4" />
          Confirmar: {transition.buttonText}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-orange-700 mb-3">
          {transition.description}
        </p>
        
        {/* ✅ VALIDACIONES EN TIEMPO REAL */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Requisitos pendientes:</p>
                <ul className="text-xs space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* ✅ REQUISITOS CUMPLIDOS */}
        {validationErrors.length === 0 && transition.validationRules.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-green-800 mb-1">Requisitos cumplidos:</p>
            <ul className="text-xs text-green-700 space-y-1">
              {transition.validationRules.map((rule, index) => (
                <li key={index} className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isTransitioning}
          >
            Cancelar
          </Button>
          <Button
            variant={transition.buttonVariant}
            onClick={onConfirm}
            disabled={isTransitioning} // Solo disabled durante transición
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
  );
};

// ✅ PROPS SIMPLIFICADAS CON CONTEXT
interface CampaignStateManagerProps {
  campaign: Campaign;
  onCampaignUpdate?: () => void;
}

const CampaignStateManager: React.FC<CampaignStateManagerProps> = ({
  campaign,
  onCampaignUpdate
}) => {
  // ✅ CONTEXT API INTEGRATION
  const { fetchCampaigns } = useCampaignsContext();
  
  // ✅ HOOK CON LÓGICA CORREGIDA
  const { 
    isTransitioning, 
    transitionError, 
    executeTransition, 
    getPossibleTransitions, 
    getStatusConfig,
    validateTransition 
 } = useCampaignState({ 
  onSuccess: onCampaignUpdate
});

  const [showConfirmation, setShowConfirmation] = useState<StateTransition | null>(null);

  // ✅ CONFIGURACIÓN VISUAL DEL ESTADO ACTUAL
  const statusConfig = getStatusConfig(campaign.status);
  const StatusIcon = statusConfig.icon;

  // ✅ TRANSICIONES POSIBLES CON VALIDACIÓN
  const possibleTransitions = getPossibleTransitions(campaign.status);

  // ✅ MANEJAR CONFIRMACIÓN CON VALIDACIÓN
  const handleActionClick = async (transition: StateTransition) => {
    const validation = validateTransition(campaign, transition);
    
    if (transition.requiresConfirmation) {
      setShowConfirmation(transition);
    } else {
      await executeTransition(campaign.id, transition);
    }
  };

  const handleConfirmAction = async () => {
    if (!showConfirmation) return;
    await executeTransition(campaign.id, showConfirmation);
    setShowConfirmation(null);
  };
  return (
    <div className="space-y-4">
      {/* ✅ MINICARD ESTADO ACTUAL - TU IDEA IMPLEMENTADA */}
      <Card className={`${statusConfig.bgColor} border-2`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} border-2 border-current flex items-center justify-center`}>
                <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Estado Actual</h3>
                  <Badge className={statusConfig.badgeClass}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.text}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
              </div>
            </div>

            {/* ✅ INDICADORES VISUALES CONTEXTUALES */}
            {campaign.status === 'active' && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">En vivo</span>
                </div>
                <div className="space-y-1 text-xs text-green-700">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{campaign.totalResponded}/{campaign.totalInvited} respuestas</span>
                  </div>
                  {campaign.daysRemaining !== undefined && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{campaign.daysRemaining > 0 ? `${campaign.daysRemaining} días restantes` : 'Expirada'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {campaign.status === 'draft' && (
              <div className="text-right text-xs text-yellow-700">
                {campaign.totalInvited >= 5 ? (
                  <div className="flex items-center gap-1 text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    <span>Lista para activar</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div>Faltan {5 - campaign.totalInvited} participantes</div>
                    <div className="text-yellow-600">Mínimo: 5 participantes</div>
                  </div>
                )}
              </div>
            )}

            {campaign.status === 'completed' && (
              <div className="text-right text-xs text-blue-700">
                <div className="flex items-center gap-1 mb-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>Resultados disponibles</span>
                </div>
                <div>{campaign.participationRate}% participación final</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ✅ ERROR DE TRANSICIÓN */}
      {transitionError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{transitionError}</AlertDescription>
        </Alert>
      )}

      {/* ✅ ACCIONES DISPONIBLES CON VALIDACIÓN */}
      {possibleTransitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Acciones Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {possibleTransitions.map((transition) => {
                const validation = validateTransition(campaign, transition);
                const ButtonIcon = transition.buttonIcon;
                
                return (
                  <div key={transition.action} className="space-y-2">
                    <Button
                      variant={transition.buttonVariant}
                      className="w-full justify-start"
                      onClick={() => handleActionClick(transition)}
                      disabled={isTransitioning || !validation.valid}
                    >
                      <ButtonIcon className="h-4 w-4 mr-2" />
                      <span>{transition.buttonText}</span>
                    </Button>
                    
                    {/* ✅ MOSTRAR ERRORES DE VALIDACIÓN */}
                    {!validation.valid && validation.errors && validation.errors.length > 0 && (
                       <Alert variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        <AlertDescription>
                          <ul className="space-y-1">
                            {validation.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ MODAL DE CONFIRMACIÓN CON VALIDACIÓN */}
      {showConfirmation && (
        <ConfirmationModal
          transition={showConfirmation}
          campaign={campaign}
          onConfirm={handleConfirmAction}
          onCancel={() => setShowConfirmation(null)}
          disabled={isTransitioning}
          validationErrors={validateTransition(campaign, showConfirmation).errors}
        />
      )}
    </div>
  );
};

export default CampaignStateManager;