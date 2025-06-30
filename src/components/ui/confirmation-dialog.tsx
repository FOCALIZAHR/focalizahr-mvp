'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Mail,
  Clock,
  Shield
} from 'lucide-react';

interface ConfirmationAction {
  id: string;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'destructive' | 'secondary';
  icon: React.ReactNode;
  details?: string[];
  warnings?: string[];
  consequences?: string[];
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  action: ConfirmationAction | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({ 
  isOpen, 
  action, 
  onConfirm, 
  onCancel, 
  isLoading = false 
}: ConfirmationDialogProps) {
  if (!action) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action.icon}
            <span dangerouslySetInnerHTML={{
              __html: action.title
                // Destacar nombre campaña entre comillas en el título
                .replace(/"([^"]+)"/g, '<span style="font-weight: bold; font-size: 1.25rem; color: #22D3EE;">$1</span>')
            }} />
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            <span dangerouslySetInnerHTML={{
              __html: action.description
                .replace(/(la campaña\s)"([^"]+)"/gi, '<span style="font-weight: bold; font-size: 1.25rem; color: #22D3EE;">$1$2</span>')
            }} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Detalles - Destacar participantes */}
          {action.details && action.details.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Detalles:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {action.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{
                      __html: detail
                        .replace(/(\d+)\s+(participantes?)/gi, '<span style="font-weight: bold; font-size: 1.25rem; color: #A78BFA;">$1 $2</span>')
                        .replace(/(\d+)\s+(respuestas?)/gi, '<span style="font-weight: bold; font-size: 1.25rem; color: #A78BFA;">$1 $2</span>')
                    }} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Advertencias - Colores corporativos mejorados */}
          {action.warnings && action.warnings.length > 0 && (
            <Alert className="border-l-4 border-cyan-400 pl-4 bg-gradient-to-r from-cyan-200 to-blue-200 p-3 rounded-r-lg">
              <AlertTriangle className="h-4 w-4 text-cyan-700" />
              <AlertDescription>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-cyan-900">Importante:</span>
                  {action.warnings.map((warning, index) => (
                    <p key={index} className="text-sm text-slate-900 font-medium">{warning}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Consecuencias - Estilo corporativo mejorado para cancelar */}
          {action.consequences && action.consequences.length > 0 && (
            <div className="border-l-4 border-red-400 pl-4 bg-gradient-to-r from-red-200 to-pink-200 p-3 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-red-700" />
                <span className="text-sm font-medium text-red-900">Importante:</span>
              </div>
              <div className="space-y-1">
                {action.consequences.map((consequence, index) => (
                  <p key={index} className="text-sm text-red-900 font-medium">{consequence}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {action.cancelText}
          </Button>
          <Button
            variant={action.variant}
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              action.confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook para gestionar diálogos de confirmación
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<ConfirmationAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => Promise<void>) | null>(null);

  const showConfirmation = (action: ConfirmationAction, callback: () => Promise<void>) => {
    setCurrentAction(action);
    setPendingCallback(() => callback);
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (pendingCallback) {
      setIsLoading(true);
      try {
        await pendingCallback();
        setIsOpen(false);
      } catch (error) {
        console.error('Error executing confirmed action:', error);
        // Error will be handled by the calling component
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setCurrentAction(null);
    setPendingCallback(null);
    setIsLoading(false);
  };

  return {
    isOpen,
    currentAction,
    isLoading,
    showConfirmation,
    handleConfirm,
    handleCancel,
    ConfirmationDialog: () => (
      <ConfirmationDialog
        isOpen={isOpen}
        action={currentAction}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    )
  };
}

// Configuraciones predefinidas para acciones comunes
export const confirmationActions = {
  activateCampaign: (campaignName: string, participantCount: number): ConfirmationAction => ({
    id: 'activate',
    title: '¿Activar Campaña?',
    description: `¿Está seguro que desea activar la campaña "${campaignName}"?`,
    confirmText: 'Sí, Activar Campaña',
    cancelText: 'Cancelar',
    variant: 'default' as const,
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    details: [
      `Se enviarán emails de invitación a ${participantCount} participantes`,
      'Los participantes recibirán links únicos para responder',
      'Podrá monitorear el progreso en tiempo real'
    ],
    warnings: [
      'Esta acción no se puede deshacer',
      'Los emails se enviarán inmediatamente'
    ]
  }),

  cancelCampaign: (campaignName: string, responseCount: number): ConfirmationAction => ({
    id: 'cancel',
    title: '¿Cancelar Campaña?',
    description: `¿Está seguro que desea cancelar la campaña "${campaignName}"?`,
    confirmText: 'Sí, Cancelar',
    cancelText: 'No, Mantener Activa',
    variant: 'destructive' as const,
    icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
    details: [
      'La campaña se marcará como cancelada',
      `Se preservarán las ${responseCount} respuestas ya recibidas`,
      'No se enviarán más recordatorios'
    ],
    consequences: [
      'No se podrán recopilar más respuestas',
      'Esta acción no se puede deshacer'
    ]
  }),

  completeCampaign: (campaignName: string, participationRate: number): ConfirmationAction => ({
    id: 'complete',
    title: '¿Completar Campaña?',
    description: `¿Está seguro que desea completar la campaña "${campaignName}"?`,
    confirmText: 'Sí, Completar',
    cancelText: 'Cancelar',
    variant: 'secondary' as const,
    icon: <Clock className="h-5 w-5 text-blue-600" />,
    details: [
      `Participación final: ${participationRate}%`,
      'Se procesarán los resultados finales',
      'Los análisis estarán disponibles inmediatamente'
    ],
    warnings: [
      'No se aceptarán más respuestas después de completar',
      'Esta acción es irreversible'
    ]
  })
};

export default ConfirmationDialog;