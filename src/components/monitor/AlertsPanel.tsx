// ARCHIVO: /src/components/monitor/AlertsPanel.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Bell,
  Send
} from 'lucide-react';

interface AlertItem {
  id: string;
  type: string;
  message: string;
  department?: string;
  timestamp: string;
  priority: string;
}

interface AlertsPanelProps {
  alerts: AlertItem[];
  handleSendDepartmentReminder: (department: string) => void;
}

export function AlertsPanel({ alerts, handleSendDepartmentReminder }: AlertsPanelProps) {
  return (
    <Card className="glass-card neural-glow">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Alertas y Notificaciones Segmentadas
        </CardTitle>
        <CardDescription className="text-white/60">
          Notificaciones automáticas por departamento y métricas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <Alert key={alert.id} className={`bg-white/5 border-white/10 ${
            alert.priority === 'high' ? 'border-l-4 border-l-red-500' :
            alert.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
            'border-l-4 border-l-green-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {alert.type === 'info' && <Bell className="h-4 w-4 text-blue-500" />}
                
                <div>
                  <AlertDescription className="text-white/90 font-medium">
                    {alert.message}
                  </AlertDescription>
                  {alert.department && (
                    <div className="text-xs text-white/60 mt-1">
                      Departamento: {alert.department}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-xs text-white/60">{alert.timestamp}</span>
                {alert.department && alert.type === 'warning' && (
                  <div className="mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendDepartmentReminder(alert.department!)}
                      className="h-6 px-2 text-xs bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Actuar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}