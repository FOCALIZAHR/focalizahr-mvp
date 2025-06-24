'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useCampaignState, StateTransition, Campaign } from '@/hooks/useCampaignState';

// --- COMPONENTE MODAL DEDICADO ---
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="professional-card max-w-md w-full mx-4 animate-fade-in border-l-4 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar {showConfirmation.buttonText}
          </CardTitle>
          <CardDescription>
            {showConfirmation.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4 space-y-4">
          <div className="context-container-warning">
            <AlertTriangle className="context-icon flex-shrink-0" />
            <div className="context-content">
              <p className="text-sm">
                Esta acción puede tener consecuencias importantes. Revise los detalles antes de confirmar.
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-sm">Verificaciones:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {showConfirmation.validationRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onCancel} disabled={isTransitioning}>
            Cerrar
          </Button>
          <Button 
            variant={showConfirmation.buttonVariant} 
            onClick={onConfirm} 
            disabled={isTransitioning} 
            className={isTransitioning ? 'btn-loading' : ''}
          >
            {isTransitioning ? 'Procesando...' : `Sí, ${showConfirmation.buttonText}`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
interface CampaignStateManagerProps {
  campaign: Campaign;
  onSuccess: () => Promise<void> | void;
}

const CampaignStateManager: React.FC<CampaignStateManagerProps> = ({ 
  campaign, 
  onSuccess
}) => {
  const [showConfirmation, setShowConfirmation] = useState<StateTransition | null>(null);
  const { 
    isTransitioning, 
    transitionError, 
    executeTransition, 
    getPossibleTransitions, 
    getStatusConfig 
  } = useCampaignState({ onSuccess });

  const availableTransitions = getPossibleTransitions(campaign.status);
  const statusConfig = getStatusConfig(campaign.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Card className="professional-card">
        <CardHeader>
          <CardTitle>Gestionar Campaña</CardTitle>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm font-medium text-muted-foreground">Estado Actual:</span>
            <Badge className={statusConfig.badgeClass}>
              <StatusIcon className="h-3 w-3 mr-1.5" />
              {statusConfig.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableTransitions.length > 0 ? (
            availableTransitions.map((transition) => (
              <div key={transition.action} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <transition.buttonIcon className="h-4 w-4" />
                    {transition.buttonText}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{transition.description}</p>
                </div>
                <Button 
                  onClick={() => setShowConfirmation(transition)} 
                  variant={transition.buttonVariant} 
                  disabled={isTransitioning}
                >
                  {transition.buttonText}
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No hay acciones de estado disponibles para esta campaña.</p>
            </div>
          )}

          {transitionError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{transitionError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        showConfirmation={showConfirmation}
        onConfirm={() => showConfirmation && executeTransition(campaign.id, showConfirmation)}
        onCancel={() => setShowConfirmation(null)}
        isTransitioning={isTransitioning}
      />
    </>
  );
};

export default CampaignStateManager;