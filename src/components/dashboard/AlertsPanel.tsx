'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Bell } from 'lucide-react';
import type { Alert as AlertType } from '@/types';

interface AlertsPanelProps {
  alerts: AlertType[];
}

// ✅ ENTERPRISE FIX: Normalizar timestamp a Date object
function getAlertTime(timestamp: Date | string): string {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Error parsing alert timestamp:', timestamp, error);
    return 'Hora no disponible';
  }
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) return null;

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
        {alerts.slice(0, 3).map((alert) => (
          <Alert key={alert.id} className={`${
            alert.type === 'warning' ? 'border-yellow-200' :
            alert.type === 'success' ? 'border-green-200' :
            'border-blue-200'
          }`}>
            <AlertTriangle className={`h-4 w-4 ${
              alert.type === 'warning' ? 'text-yellow-600' :
              alert.type === 'success' ? 'text-green-600' :
              'text-blue-600'
            }`} />
            <div className="layout-between items-start">
              <div>
                <div className="font-medium">{alert.title}</div>
                <AlertDescription className="text-sm">{alert.message}</AlertDescription>
              </div>
              <span className="text-xs text-muted-foreground">
                {getAlertTime(alert.timestamp)}
              </span>
            </div>
          </Alert>
        ))}
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