'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Loader2 } from 'lucide-react';

// Importar componentes especializados
import CampaignStatusBadge from './CampaignStatusBadge';
import CampaignActionButtons from './CampaignActionButtons';
import CampaignStateValidator from './CampaignStateValidator';

type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';
type RiskLevel = 'low' | 'medium' | 'high';

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
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
  riskLevel?: RiskLevel;
  lastActivity?: string;
  completionTrend?: 'up' | 'down' | 'stable';
}

interface CampaignStateTransitionProps {
  campaign: Campaign;
  onStateChange: (campaignId: string, newStatus: string, action: string) => Promise<void>;
  variant?: 'default' | 'compact' | 'detailed';
  showValidation?: boolean;
  isLoading?: boolean;
}

const CampaignStateTransition: React.FC<CampaignStateTransitionProps> = ({
  campaign,
  onStateChange,
  variant = 'default',
  showValidation = true,
  isLoading = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({
    isValid: true,
    errors: [],
    warnings: []
  });

  // ✅ MANEJAR CAMBIO DE ESTADO CON VALIDACIÓN
  const handleStateChange = useCallback(async (actionId: string, campaignId: string, campaignName: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Mapear acción a estado
      const actionToStatusMap: Record<string, string> = {
        'activate': 'active',
        'complete': 'completed',
        'cancel': 'cancelled',
        'draft': 'draft'
      };

      const newStatus = actionToStatusMap[actionId];
      
      if (!newStatus) {
        // Para acciones que no cambian estado (view, edit, monitor, results)
        handleViewAction(actionId, campaignId);
        return;
      }

      // Validación pre-ejecución para estados críticos
      if (actionId === 'activate' && !validationState.isValid) {
        throw new Error('La campaña no cumple con los requisitos para ser activada');
      }

      console.log(`🔄 Ejecutando transición: ${campaign.status} → ${newStatus} (${actionId})`);
      
      // Ejecutar cambio de estado
      await onStateChange(campaignId, newStatus, actionId);
      
      console.log('✅ Transición de estado completada exitosamente');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en transición de estado:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [campaign.status, onStateChange, validationState.isValid]);

  // ✅ MANEJAR ACCIONES DE VISUALIZACIÓN
  const handleViewAction = (actionId: string, campaignId: string) => {
    const routes: Record<string, string> = {
      'view': campaign.status === 'completed' ? `/dashboard/campaigns/${campaignId}/results` : `/dashboard/campaigns/${campaignId}/config`,
      'edit': `/dashboard/campaigns/${campaignId}/edit`,
      'monitor': `/dashboard/campaigns/${campaignId}/monitor`,
      'results': `/dashboard/campaigns/${campaignId}/results`,
      'config': `/dashboard/campaigns/${campaignId}/config`
    };

    const route = routes[actionId];
    if (route && typeof window !== 'undefined') {
      window.location.href = route;
    }
  };

  // ✅ MANEJAR RESULTADO VALIDACIÓN
  const handleValidationResult = useCallback((isValid: boolean, errors: string[], warnings: string[]) => {
    setValidationState({ isValid, errors, warnings });
  }, []);

  // ✅ VARIANT COMPACT
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between gap-4 p-3 border rounded-lg">
        <CampaignStatusBadge 
          status={campaign.status} 
          variant="compact"
          riskLevel={campaign.riskLevel}
        />
        
        <div className="flex items-center gap-2">
          {showValidation && (
            <CampaignStateValidator
              campaign={campaign}
              variant="compact"
              onValidate={handleValidationResult}
            />
          )}
          
          <CampaignActionButtons
            campaign={campaign}
            onAction={handleStateChange}
            variant="compact"
            isLoading={isLoading || isProcessing}
            showLabels={false}
          />
        </div>

        {error && (
          <Alert className="mt-2 bg-red-500/10 border-red-500/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200 text-xs">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // ✅ VARIANT DETAILED
  if (variant === 'detailed') {
    return (
      <div className="space-y-4">
        {/* Estado y Información */}
        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <CampaignStatusBadge 
                  status={campaign.status} 
                  variant="detailed"
                  riskLevel={campaign.riskLevel}
                />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="ml-2 font-medium">{campaign.campaignType.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Participantes:</span>
                    <span className="ml-2 font-medium">{campaign.totalInvited}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Respuestas:</span>
                    <span className="ml-2 font-medium">{campaign.totalResponded}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Participación:</span>
                    <span className="ml-2 font-medium">{campaign.participationRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validación */}
        {showValidation && (
          <CampaignStateValidator
            campaign={campaign}
            variant="default"
            onValidate={handleValidationResult}
          />
        )}

        {/* Acciones */}
        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Acciones Disponibles</h4>
              
              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Procesando cambio de estado...</span>
                </div>
              )}
              
              <CampaignActionButtons
                campaign={campaign}
                onAction={handleStateChange}
                variant="default"
                isLoading={isLoading || isProcessing}
                showLabels={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // ✅ VARIANT DEFAULT
  return (
    <Card className="professional-card">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header con Estado */}
          <div className="flex items-center justify-between">
            <CampaignStatusBadge 
              status={campaign.status} 
              variant="default"
              riskLevel={campaign.riskLevel}
            />
            
            {isProcessing && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Procesando...</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Validación Inline */}
          {showValidation && (
            <CampaignStateValidator
              campaign={campaign}
              variant="inline"
              onValidate={handleValidationResult}
            />
          )}

          {/* Acciones */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {campaign.totalInvited} participante{campaign.totalInvited !== 1 ? 's' : ''} • 
              {campaign.totalResponded} respuesta{campaign.totalResponded !== 1 ? 's' : ''}
            </div>
            
            <CampaignActionButtons
              campaign={campaign}
              onAction={handleStateChange}
              variant="default"
              isLoading={isLoading || isProcessing}
              showLabels={true}
            />
          </div>

          {/* Error */}
          {error && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignStateTransition;