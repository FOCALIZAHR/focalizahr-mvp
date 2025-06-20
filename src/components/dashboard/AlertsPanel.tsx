'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

// Interfaz para alertas (extraída de page.tsx)
interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  campaignId?: string;
}

// Props del componente
interface AlertsPanelProps {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return null;
  }

  // Función para obtener ícono según tipo de alerta
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      case 'info':
      default:
        return Info;
    }
  };

  // Función para obtener clases CSS según tipo
  const getAlertClasses = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return {
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          bg: 'bg-yellow-50'
        };
      case 'success':
        return {
          border: 'border-green-200',
          icon: 'text-green-600',
          bg: 'bg-green-50'
        };
      case 'info':
      default:
        return {
          border: 'border-blue-200',
          icon: 'text-blue-600',
          bg: 'bg-blue-50'
        };
    }
  };

  return (
    <Card className="professional-card border-l-4 border-l-yellow-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 layout-center">
            <Bell className="h-5 w-5 text-yellow-600" />
          </div>
          <CardTitle className="text-lg">Alertas del Sistema</CardTitle>
          <Badge variant="secondary">{alerts.length}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {alerts.slice(0, 3).map((alert) => {
          const AlertIcon = getAlertIcon(alert.type);
          const classes = getAlertClasses(alert.type);
          
          return (
            <Alert 
              key={alert.id} 
              className={`${classes.border} ${classes.bg}`}
            >
              <AlertIcon className={`h-4 w-4 ${classes.icon}`} />
              <div className="layout-between items-start">
                <div>
                  <div className="font-medium">{alert.title}</div>
                  <AlertDescription className="text-sm">
                    {alert.message}
                  </AlertDescription>
                </div>
                <span className="text-xs text-muted-foreground">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </Alert>
          );
        })}
        
        {alerts.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm" className="focus-ring">
              Ver todas las alertas ({alerts.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}