'use client';
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Clock, Users, Calendar, Settings } from 'lucide-react';

type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  startDate: string;
  endDate: string;
  canActivate?: boolean;
  canViewResults?: boolean;
}

interface ValidationRule {
  id: string;
  label: string;
  description: string;
  isValid: boolean;
  isRequired: boolean;
  severity: 'error' | 'warning' | 'info';
  icon: React.ComponentType<any>;
  action?: string;
}

interface CampaignStateValidatorProps {
  campaign: Campaign;
  targetState?: CampaignStatus;
  onValidate?: (isValid: boolean, errors: string[], warnings: string[]) => void;
  variant?: 'default' | 'compact' | 'inline';
  showSuccessState?: boolean;
}

const CampaignStateValidator: React.FC<CampaignStateValidatorProps> = ({
  campaign,
  targetState,
  onValidate,
  variant = 'default',
  showSuccessState = true
}) => {
  const [validationResults, setValidationResults] = useState<ValidationRule[]>([]);

  // ✅ REGLAS VALIDACIÓN POR ESTADO OBJETIVO
  const getValidationRules = (campaign: Campaign, targetState?: CampaignStatus): ValidationRule[] => {
    const baseRules: ValidationRule[] = [
      {
        id: 'has_name',
        label: 'Nombre de campaña',
        description: 'La campaña debe tener un nombre válido',
        isValid: Boolean(campaign.name && campaign.name.trim().length > 0),
        isRequired: true,
        severity: 'error',
        icon: Settings
      },
      {
        id: 'has_participants',
        label: 'Participantes cargados',
        description: 'Debe tener participantes para poder activar',
        isValid: campaign.totalInvited > 0,
        isRequired: true,
        severity: 'error',
        icon: Users,
        action: 'Cargar participantes'
      }
    ];

    // ✅ REGLAS ESPECÍFICAS PARA ACTIVACIÓN
    if (targetState === 'active' || !targetState) {
      baseRules.push(
        {
          id: 'min_participants',
          label: 'Participantes mínimos',
          description: 'Se requieren al menos 5 participantes para resultados estadísticamente válidos',
          isValid: campaign.totalInvited >= 5,
          isRequired: true,
          severity: 'error',
          icon: Users,
          action: 'Agregar más participantes'
        },
        {
          id: 'valid_dates',
          label: 'Fechas válidas',
          description: 'Las fechas de inicio y fin deben ser válidas',
          isValid: isValidDateRange(campaign.startDate, campaign.endDate),
          isRequired: true,
          severity: 'error',
          icon: Calendar
        },
        {
          id: 'future_start_date',
          label: 'Fecha de inicio',
          description: 'La fecha de inicio debe ser futura o presente',
          isValid: new Date(campaign.startDate) >= new Date(),
          isRequired: false,
          severity: 'warning',
          icon: Calendar
        },
        {
          id: 'adequate_duration',
          label: 'Duración recomendada',
          description: 'Se recomienda al menos 7 días para una buena participación',
          isValid: getDurationInDays(campaign.startDate, campaign.endDate) >= 7,
          isRequired: false,
          severity: 'info',
          icon: Clock
        }
      );
    }

    // ✅ REGLAS ESPECÍFICAS PARA COMPLETAR
    if (targetState === 'completed') {
      baseRules.push(
        {
          id: 'has_responses',
          label: 'Respuestas recibidas',
          description: 'La campaña debe tener al menos algunas respuestas',
          isValid: campaign.totalResponded > 0,
          isRequired: true,
          severity: 'error',
          icon: CheckCircle
        },
        {
          id: 'adequate_participation',
          label: 'Participación adecuada',
          description: 'Se recomienda al menos 30% de participación para resultados confiables',
          isValid: campaign.participationRate >= 30,
          isRequired: false,
          severity: 'warning',
          icon: Users
        }
      );
    }

    // ✅ REGLAS ESPECÍFICAS PARA VER RESULTADOS
    if (targetState === 'completed' || campaign.status === 'completed') {
      baseRules.push(
        {
          id: 'results_available',
          label: 'Resultados disponibles',
          description: 'Los resultados han sido procesados y están listos',
          isValid: campaign.canViewResults || false,
          isRequired: true,
          severity: 'error',
          icon: CheckCircle
        }
      );
    }

    return baseRules;
  };

  // ✅ FUNCIONES AUXILIARES
  const isValidDateRange = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end && !isNaN(start.getTime()) && !isNaN(end.getTime());
  };

  const getDurationInDays = (startDate: string, endDate: string): number => {
    if (!isValidDateRange(startDate, endDate)) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  // ✅ VALIDACIÓN EN TIEMPO REAL
  useEffect(() => {
    const rules = getValidationRules(campaign, targetState);
    setValidationResults(rules);

    // Notificar resultado de validación
    if (onValidate) {
      const errors = rules.filter(rule => !rule.isValid && rule.isRequired && rule.severity === 'error');
      const warnings = rules.filter(rule => !rule.isValid && rule.severity === 'warning');
      
      onValidate(
        errors.length === 0,
        errors.map(rule => rule.description),
        warnings.map(rule => rule.description)
      );
    }
  }, [campaign, targetState, onValidate]);

  // ✅ CALCULAR ESTADO GENERAL
  const getOverallStatus = () => {
    const errors = validationResults.filter(rule => !rule.isValid && rule.isRequired && rule.severity === 'error');
    const warnings = validationResults.filter(rule => !rule.isValid && rule.severity === 'warning');
    
    if (errors.length > 0) return 'error';
    if (warnings.length > 0) return 'warning';
    return 'success';
  };

  const overallStatus = getOverallStatus();

  // ✅ VARIANT COMPACT
  if (variant === 'compact') {
    const errorCount = validationResults.filter(rule => !rule.isValid && rule.isRequired).length;
    const warningCount = validationResults.filter(rule => !rule.isValid && rule.severity === 'warning').length;

    if (errorCount === 0 && warningCount === 0 && showSuccessState) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Listo para activar</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {errorCount > 0 && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{errorCount} error{errorCount !== 1 ? 'es' : ''}</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{warningCount} advertencia{warningCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    );
  }

  // ✅ VARIANT INLINE
  if (variant === 'inline') {
    const criticalErrors = validationResults.filter(rule => !rule.isValid && rule.isRequired && rule.severity === 'error');
    
    if (criticalErrors.length === 0) return null;

    return (
      <Alert className="bg-red-500/10 border-red-500/20">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {criticalErrors.length === 1 
            ? criticalErrors[0].description
            : `${criticalErrors.length} requisitos pendientes para continuar`
          }
        </AlertDescription>
      </Alert>
    );
  }

  // ✅ VARIANT DEFAULT
  return (
    <Card className="professional-card">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Estado de Validación</h4>
            <div className={`flex items-center gap-1 text-sm ${
              overallStatus === 'success' ? 'text-green-600' :
              overallStatus === 'warning' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {overallStatus === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>
                {overallStatus === 'success' ? 'Validación exitosa' :
                 overallStatus === 'warning' ? 'Con advertencias' :
                 'Requiere atención'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {validationResults.map((rule) => {
              const Icon = rule.icon;
              return (
                <div 
                  key={rule.id}
                  className={`flex items-start gap-3 p-2 rounded-lg ${
                    rule.isValid ? 'bg-green-50' : 
                    rule.severity === 'error' ? 'bg-red-50' :
                    rule.severity === 'warning' ? 'bg-yellow-50' :
                    'bg-blue-50'
                  }`}
                >
                  <div className={`mt-0.5 ${
                    rule.isValid ? 'text-green-600' :
                    rule.severity === 'error' ? 'text-red-600' :
                    rule.severity === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {rule.isValid ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        rule.isValid ? 'text-green-800' :
                        rule.severity === 'error' ? 'text-red-800' :
                        rule.severity === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {rule.label}
                      </span>
                      {rule.isRequired && !rule.isValid && (
                        <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                          Requerido
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-xs mt-1 ${
                      rule.isValid ? 'text-green-600' :
                      rule.severity === 'error' ? 'text-red-600' :
                      rule.severity === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {rule.description}
                    </p>
                    
                    {rule.action && !rule.isValid && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 {rule.action}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignStateValidator;