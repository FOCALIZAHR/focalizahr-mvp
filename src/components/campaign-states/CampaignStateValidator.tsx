import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info, Users, Calendar, Settings } from 'lucide-react';

interface Campaign {
  id: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  totalInvited: number;
  startDate: string;
  endDate: string;
  campaignType?: {
    name: string;
    slug: string;
  };
}

interface ValidationRule {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  icon: React.ReactNode;
  check: (campaign: Campaign) => boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
  infos: ValidationRule[];
}

interface CampaignStateValidatorProps {
  campaign: Campaign;
  targetState: 'active' | 'completed' | 'cancelled';
  onValidate?: (result: ValidationResult) => void;
  showDetails?: boolean;
}

const CampaignStateValidator: React.FC<CampaignStateValidatorProps> = ({
  campaign,
  targetState,
  onValidate,
  showDetails = true
}) => {
  const validationRules: Record<string, ValidationRule[]> = {
    active: [
      {
        id: 'min_participants',
        message: 'Debe tener al menos 5 participantes para activar la campaña',
        type: 'error',
        icon: <Users className="h-4 w-4" />,
        check: (c) => c.totalInvited >= 5
      },
      {
        id: 'valid_dates',
        message: 'Las fechas de inicio y fin deben ser válidas',
        type: 'error',
        icon: <Calendar className="h-4 w-4" />,
        check: (c) => {
          const start = new Date(c.startDate);
          const end = new Date(c.endDate);
          return start < end && start >= new Date();
        }
      },
      {
        id: 'campaign_type',
        message: 'Debe tener un tipo de campaña configurado',
        type: 'error',
        icon: <Settings className="h-4 w-4" />,
        check: (c) => !!c.campaignType?.slug
      },
      {
        id: 'optimal_participants',
        message: 'Se recomienda tener al menos 10 participantes para mejores resultados',
        type: 'warning',
        icon: <Users className="h-4 w-4" />,
        check: (c) => c.totalInvited >= 10
      },
      {
        id: 'duration_warning',
        message: 'Campañas de más de 30 días pueden tener menor participación',
        type: 'warning',
        icon: <Calendar className="h-4 w-4" />,
        check: (c) => {
          const start = new Date(c.startDate);
          const end = new Date(c.endDate);
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 30;
        }
      }
    ],
    completed: [
      {
        id: 'campaign_active',
        message: 'Solo se pueden completar campañas activas',
        type: 'error',
        icon: <AlertTriangle className="h-4 w-4" />,
        check: (c) => c.status === 'active'
      },
      {
        id: 'has_participants',
        message: 'La campaña debe tener participantes invitados',
        type: 'error',
        icon: <Users className="h-4 w-4" />,
        check: (c) => c.totalInvited > 0
      },
      {
        id: 'completion_timing',
        message: 'Se recomienda esperar al menos 3 días después del inicio',
        type: 'info',
        icon: <Info className="h-4 w-4" />,
        check: (c) => {
          const start = new Date(c.startDate);
          const now = new Date();
          const diffDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 3;
        }
      }
    ],
    cancelled: [
      {
        id: 'not_completed',
        message: 'No se pueden cancelar campañas ya completadas',
        type: 'error',
        icon: <AlertTriangle className="h-4 w-4" />,
        check: (c) => c.status !== 'completed'
      },
      {
        id: 'cancellation_impact',
        message: 'Cancelar una campaña activa perderá todos los datos de respuestas',
        type: 'warning',
        icon: <AlertTriangle className="h-4 w-4" />,
        check: (c) => c.status !== 'active'
      }
    ]
  };

  const validateCampaign = (): ValidationResult => {
    const rules = validationRules[targetState] || [];
    const errors: ValidationRule[] = [];
    const warnings: ValidationRule[] = [];
    const infos: ValidationRule[] = [];

    rules.forEach(rule => {
      const isValid = rule.check(campaign);
      
      if (!isValid) {
        switch (rule.type) {
          case 'error':
            errors.push(rule);
            break;
          case 'warning':
            warnings.push(rule);
            break;
          case 'info':
            infos.push(rule);
            break;
        }
      }
    });

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos
    };

    if (onValidate) {
      onValidate(result);
    }

    return result;
  };

  const result = validateCampaign();

  if (!showDetails) {
    return null;
  }

  const renderValidationMessages = (items: ValidationRule[], type: 'error' | 'warning' | 'info') => {
    if (items.length === 0) return null;

    const alertVariant = type === 'error' ? 'destructive' : 'default';

    return items.map(item => (
      <Alert key={item.id} variant={alertVariant} className="mb-2">
        <div className="flex items-center gap-2">
          {item.icon}
          <AlertDescription>{item.message}</AlertDescription>
        </div>
      </Alert>
    ));
  };

  return (
    <div className="space-y-2">
      {result.errors.length > 0 && (
        <div>
          {renderValidationMessages(result.errors, 'error')}
        </div>
      )}
      
      {result.warnings.length > 0 && (
        <div>
          {renderValidationMessages(result.warnings, 'warning')}
        </div>
      )}
      
      {result.infos.length > 0 && (
        <div>
          {renderValidationMessages(result.infos, 'info')}
        </div>
      )}

      {result.isValid && result.warnings.length === 0 && result.infos.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            La campaña cumple todos los requisitos para {targetState === 'active' ? 'activarse' : targetState === 'completed' ? 'completarse' : 'cancelarse'}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CampaignStateValidator;