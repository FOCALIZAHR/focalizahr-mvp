'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface Campaign {
  id: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  totalInvited: number;
  canActivate?: boolean;
  startDate: string;
  endDate: string;
}

interface CampaignStateValidatorProps {
  campaign: Campaign;
  targetAction?: string;
  showDetails?: boolean;
  className?: string;
}

export default function CampaignStateValidator({
  campaign,
  targetAction,
  showDetails = true,
  className = ''
}: CampaignStateValidatorProps) {

  const getValidationRules = (action?: string) => {
    const rules = {
      activate: [
        {
          id: 'has-participants',
          label: 'Mínimo 5 participantes',
          check: () => campaign.totalInvited >= 5,
          required: true,
          message: `Actual: ${campaign.totalInvited} participantes`
        },
        {
          id: 'can-activate',
          label: 'Configuración completa',
          check: () => campaign.canActivate === true,
          required: true,
          message: 'Verificar configuración de campaña'
        },
        {
          id: 'valid-dates',
          label: 'Fechas válidas',
          check: () => {
            const start = new Date(campaign.startDate);
            const end = new Date(campaign.endDate);
            return end > start;
          },
          required: true,
          message: 'Fecha fin debe ser posterior a inicio'
        }
      ],
      complete: [
        {
          id: 'is-active',
          label: 'Campaña activa',
          check: () => campaign.status === 'active',
          required: true,
          message: 'Solo campañas activas pueden completarse'
        }
      ],
      cancel: [
        {
          id: 'is-active',
          label: 'Campaña activa',
          check: () => campaign.status === 'active',
          required: true,
          message: 'Solo campañas activas pueden cancelarse'
        }
      ]
    };

    return action ? rules[action as keyof typeof rules] || [] : [];
  };

  const validationRules = getValidationRules(targetAction);
  const validations = validationRules.map(rule => ({
    ...rule,
    passed: rule.check()
  }));

  const requiredValidations = validations.filter(v => v.required);
  const passedRequired = requiredValidations.filter(v => v.passed);
  const failedRequired = requiredValidations.filter(v => !v.passed);

  const canProceed = failedRequired.length === 0;
  const hasIssues = failedRequired.length > 0;

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {canProceed ? (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Listo
          </Badge>
        ) : (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {failedRequired.length} pendiente{failedRequired.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    );
  }

  if (validationRules.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Estado general */}
      <div className="flex items-center gap-2">
        {canProceed ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Requisitos cumplidos</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Requisitos pendientes</span>
          </div>
        )}
      </div>

      {/* Detalles de validación */}
      <div className="space-y-2">
        {requiredValidations.map((validation) => (
          <div key={validation.id} className="flex items-center gap-2 text-sm">
            {validation.passed ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
            <span className={validation.passed ? 'text-green-700' : 'text-red-700'}>
              {validation.label}
            </span>
            {!validation.passed && (
              <span className="text-xs text-muted-foreground">
                - {validation.message}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Alerta si no puede proceder */}
      {hasIssues && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Completa los requisitos obligatorios antes de continuar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}