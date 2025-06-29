import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Info, 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Clock
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  startDate: string;
  endDate: string;
  canActivate?: boolean;
  canViewResults?: boolean;
  daysRemaining?: number;
}

interface CampaignStatusGuideProps {
  campaign: Campaign;
  className?: string;
}

export default function CampaignStatusGuide({ campaign, className = '' }: CampaignStatusGuideProps) {
  
  // Función para determinar el mensaje de guía basado en el estado
  const getStatusGuide = (campaign: Campaign) => {
    const { status, totalInvited, totalResponded, participationRate, daysRemaining } = campaign;
    
    switch (status) {
      case 'draft':
        if (totalInvited === 0) {
          return {
            icon: <Users className="h-5 w-5 text-blue-400" />,
            title: "En Borrador - Esperando Participantes",
            message: "Estado: En Borrador. Siguiente paso: Envíe la lista de participantes al equipo FocalizaHR.",
            actionText: "El equipo cargará los participantes por usted",
            variant: "info" as const,
            priority: "medium" as const
          };
        } else {
          return {
            icon: <CheckCircle className="h-5 w-5 text-green-400" />,
            title: "Lista para Activar",
            message: `Estado: Lista para Activar. Se cargaron ${totalInvited} participantes exitosamente.`,
            actionText: "Ya puede activar la campaña cuando esté listo",
            variant: "success" as const,
            priority: "high" as const
          };
        }
        
      case 'active':
        return {
          icon: <Clock className="h-5 w-5 text-orange-400" />,
          title: "Campaña Activa",
          message: `Estado: Campaña Activa. ${totalResponded} de ${totalInvited} respuestas recibidas (${participationRate}%).`,
          actionText: daysRemaining ? `${daysRemaining} días restantes` : "Finalizando pronto",
          variant: "warning" as const,
          priority: "high" as const
        };
        
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
          title: "Campaña Completada",
          message: `Estado: Completada exitosamente. Recibió ${totalResponded} respuestas (${participationRate}% participación).`,
          actionText: "Resultados y análisis disponibles",
          variant: "success" as const,
          priority: "low" as const
        };
        
      case 'cancelled':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
          title: "Campaña Cancelada", 
          message: `Estado: Cancelada. Se preservaron ${totalResponded} respuestas recibidas antes de la cancelación.`,
          actionText: "Datos disponibles para análisis parcial",
          variant: "destructive" as const,
          priority: "low" as const
        };
        
      default:
        return {
          icon: <Info className="h-5 w-5 text-gray-400" />,
          title: "Estado Desconocido",
          message: "Estado de la campaña no reconocido.",
          actionText: "Contacte soporte técnico",
          variant: "info" as const,
          priority: "medium" as const
        };
    }
  };

  const statusGuide = getStatusGuide(campaign);

  // Determinar el color del borde basado en la prioridad
  const getBorderColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-green-500';
      case 'medium': return 'border-l-blue-500';
      case 'low': return 'border-l-gray-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <Card className={`${className} ${getBorderColor(statusGuide.priority)} border-l-4`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {statusGuide.icon}
          {statusGuide.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Alert className="border-0 p-0 bg-transparent">
          <AlertDescription className="text-sm">
            <div className="space-y-2">
              <p className="font-medium">{statusGuide.message}</p>
              <p className="text-xs text-muted-foreground">{statusGuide.actionText}</p>
            </div>
          </AlertDescription>
        </Alert>
        
        {/* Mostrar métricas adicionales para campañas activas */}
        {campaign.status === 'active' && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-muted">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{campaign.totalInvited} invitados</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>{campaign.totalResponded} respondieron</span>
            </div>
            <Badge 
              variant={campaign.participationRate >= 70 ? "default" : campaign.participationRate >= 50 ? "secondary" : "destructive"} 
              className="text-xs"
            >
              {campaign.participationRate}%
            </Badge>
          </div>
        )}
        
        {/* Mostrar información de participantes para borradores */}
        {campaign.status === 'draft' && campaign.totalInvited > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-muted">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {campaign.totalInvited} participantes cargados
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Listo para activar
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}