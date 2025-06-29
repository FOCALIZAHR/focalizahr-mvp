'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

// Importar componentes especializados
import CampaignStatusBadge from './CampaignStatusBadge';
import CampaignActionButtons from './CampaignActionButtons';
import CampaignStateValidator from './CampaignStateValidator';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  totalInvited: number;
  canActivate?: boolean;
  canViewResults?: boolean;
  startDate: string;
  endDate: string;
}

interface CampaignStateTransitionProps {
  campaign: Campaign;
  onStateChange: (campaignId: string, newStatus: string, action: string) => Promise<void>;
  variant?: 'default' | 'compact';
  showValidation?: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function CampaignStateTransition({
  campaign,
  onStateChange,
  variant = 'default',
  showValidation = true,
  isLoading = false,
  className = ''
}: CampaignStateTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapear acciones a estados
  const actionStateMap = {
    'activate': 'active',
    'complete': 'completed',
    'cancel': 'cancelled'
  };

  // Manejar acciones con confirmación
  const handleAction = async (actionId: string, campaignId: string, campaignName: string) => {
    // Acciones que requieren confirmación
    const confirmationActions = ['activate', 'complete', 'cancel'];
    
    if (confirmationActions.includes(actionId)) {
      const confirmMessages = {
        activate: `¿Activar la campaña "${campaignName}"?\n\nSe enviarán emails a ${campaign.totalInvited} participantes.`,
        complete: `¿Completar la campaña "${campaignName}"?\n\nSe procesarán los resultados finales.`,
        cancel: `¿Cancelar la campaña "${campaignName}"?\n\nLos datos recibidos se preservarán.`
      };
      
      const confirmed = window.confirm(confirmMessages[actionId as keyof typeof confirmMessages]);
      if (!confirmed) return;
    }

    try {
      setIsTransitioning(true);
      setError(null);

      const newStatus = actionStateMap[actionId as keyof typeof actionStateMap];
      
      if (newStatus) {
        await onStateChange(campaignId, newStatus, actionId);
      } else {
        // Otras acciones que no cambian estado (edit, view, results)
        console.log(`Acción ejecutada: ${actionId} para campaña ${campaignName}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsTransitioning(false);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <CampaignStatusBadge 
          status={campaign.status}
          variant="compact"
        />
        
        <CampaignActionButtons
          campaign={campaign}
          onAction={handleAction}
          isLoading={isTransitioning || isLoading}
          variant="compact"
        />

        {showValidation && (
          <CampaignStateValidator
            campaign={campaign}
            targetAction={campaign.status === 'draft' ? 'activate' : undefined}
            showDetails={false}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Estado actual */}
      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold mb-2">Estado de la Campaña</h3>
              <CampaignStatusBadge 
                status={campaign.status}
                variant="default"
              />
            </div>
          </div>

          {/* Validaciones */}
          {showValidation && (
            <div className="mb-4">
              <CampaignStateValidator
                campaign={campaign}
                targetAction={campaign.status === 'draft' ? 'activate' : undefined}
                showDetails={true}
              />
            </div>
          )}

          {/* Acciones disponibles */}
          <div className="flex items-center justify-between">
            <CampaignActionButtons
              campaign={campaign}
              onAction={handleAction}
              isLoading={isTransitioning || isLoading}
              variant="default"
            />
            
            {(isTransitioning || isLoading) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Procesando...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error handling */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}