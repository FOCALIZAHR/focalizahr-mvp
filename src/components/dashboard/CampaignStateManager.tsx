// ✅ SOLUCIÓN GEMINI APLICADA AL ARCHIVO CORRECTO
// COPY-PASTE ESTE CÓDIGO COMPLETO EN: src/components/dashboard/CampaignStateManager.tsx

'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCampaignsContext } from '@/context/CampaignsContext';
import { useCampaignState, StateTransition } from '@/hooks/useCampaignState';
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
  campaign: Campaign;
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
            disabled={isTransitioning || validationErrors.length > 0}
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

// ✅ INTERFACE CORREGIDA - SOLUCIÓN GEMINI EXACTA
interface CampaignStateManagerProps {
  campaign: Campaign;
  onClose?: () => void;
  onCampaignUpdate?: () => void; // ← ESTA ES LA LÍNEA QUE GEMINI DIAGNOSTICÓ QUE FALTABA!
}

const CampaignStateManager: React.FC<CampaignStateManagerProps> = ({
  campaign,
  onClose,
  onCampaignUpdate // ✅ RECIBIR EL CALLBACK DE CampaignsList
}) => {
  // ✅ CONTEXT API INTEGRATION
  const { fetchCampaigns } = useCampaignsContext();
  
  // ✅ HOOK CON SOLUCIÓN GEMINI APLICADA
  const { 
    isTransitioning, 
    transitionError, 
    executeTransition, 
    getPossibleTransitions, 
    getStatusConfig,
    validateTransition 
  } = useCampaignState({ 
    onSuccess: async () => {
      toast.success('Estado actualizado con éxito.');
      
      // ✅ SOLUCIÓN GEMINI: Usar onCampaignUpdate estabilizado con useCallback
      if (onCampaignUpdate) {
        console.log('🔄 Usando handleCampaignUpdate estabilizado de CampaignsList');
        onCampaignUpdate(); // ← ESTA LÍNEA EJECUTA EL CALLBACK CORRECTO
      } else {
        console.log('🔄 Fallback: usando fetchCampaigns del contexto');
        await fetchCampaigns();
      }
      
      if (onClose) onClose();
    }
  });

  const [showConfirmation, setShowConfirmation] = useState<StateTransition | null>(null);

  // ✅ CONFIGURACIÓN VISUAL DEL ESTADO ACTUAL
  const statusConfig = getStatusConfig(campaign.status);
  const StatusIcon = statusConfig.icon;

  // ✅ TRANSICIONES POSIBLES CON VALIDACIÓN
  const possibleTransitions = getPossibleTransitions(campaign.status);

  // ✅ MANEJAR CONFIRMACIÓN CON VALIDACIÓN CORREGIDA
  const handleActionClick = async (transition: StateTransition) => {
    const validation = validateTransition(campaign, transition);
    
    if (transition.requiresConfirmation) {
      setShowConfirmation(transition);
    } else {
      console.log('✅ Executing transition with campaignId:', campaign.id);
      await executeTransition(campaign.id, transition);
    }
  };

  const handleConfirmAction = async () => {
    if (!showConfirmation) return;
    console.log('✅ Confirming transition with campaignId:', campaign.id);
    await executeTransition(campaign.id, showConfirmation);
    setShowConfirmation(null);
  };

  return (
    <div className="space-y-4">
      {/* ✅ MINICARD ESTADO ACTUAL */}
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
                <p className="text-sm text-muted-foreground mt-1">
                  {statusConfig.description}
                </p>
              </div>
            </div>
          </div>

          {/* ✅ INFORMACIÓN ADICIONAL DE LA CAMPAÑA */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span><strong>{campaign.totalInvited}</strong> participantes</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span><strong>{campaign.participationRate}%</strong> participación</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ ERROR HANDLING */}
      {transitionError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error al cambiar estado:</strong> {transitionError}
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ MODAL DE CONFIRMACIÓN */}
      {showConfirmation && (
        <ConfirmationModal
          transition={showConfirmation}
          campaign={campaign}
          onConfirm={handleConfirmAction}
          onCancel={() => setShowConfirmation(null)}
          isTransitioning={isTransitioning}
          validationErrors={validateTransition(campaign, showConfirmation)}
        />
      )}

      {/* ✅ ACCIONES DISPONIBLES */}
      {!showConfirmation && possibleTransitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Disponibles</CardTitle>
            <CardDescription>
              Selecciona una acción para cambiar el estado de la campaña
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {possibleTransitions.map((transition) => {
              const TransitionIcon = transition.buttonIcon;
              const validationErrors = validateTransition(campaign, transition);
              const isValid = validationErrors.length === 0;
              
              return (
                <div key={`${transition.from}-${transition.to}`} className="space-y-2">
                  <Button
                    variant={transition.buttonVariant}
                    className="w-full justify-start"
                    onClick={() => handleActionClick(transition)}
                    disabled={isTransitioning || !isValid}
                  >
                    <TransitionIcon className="h-4 w-4 mr-2" />
                    {transition.buttonText}
                  </Button>
                  
                  {!isValid && (
                    <div className="text-xs text-muted-foreground ml-6">
                      Requisitos: {validationErrors.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ✅ SIN ACCIONES DISPONIBLES */}
      {!showConfirmation && possibleTransitions.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-2">No hay acciones disponibles</h3>
            <p className="text-sm text-muted-foreground">
              Esta campaña está en un estado final y no puede ser modificada.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignStateManager;