// ARCHIVO: /src/components/monitor/DepartmentParticipation.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Send } from 'lucide-react';
import type { DepartmentMonitorData } from '@/lib/utils/monitor-utils';

interface DepartmentParticipationProps {
  byDepartment: Record<string, DepartmentMonitorData>;
  handleSendDepartmentReminder: (department: string) => void;
  getParticipationColor: (rate: number) => string;
}

export function DepartmentParticipation({
  byDepartment,
  handleSendDepartmentReminder,
  getParticipationColor
}: DepartmentParticipationProps) {
  return (
    <Card className="glass-card neural-glow">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-cyan-400" />
          Participación por Departamento
        </CardTitle>
        <CardDescription className="text-white/60">
          Progreso de respuestas por área organizacional
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(byDepartment)
          .sort(([,a], [,b]) => b.rate - a.rate)
          .map(([dept, data]) => (
          <div key={dept} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {dept}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    data.rate >= 70 ? 'border-green-500 text-green-400' :
                    data.rate >= 50 ? 'border-yellow-500 text-yellow-400' :
                    'border-red-500 text-red-400'
                  }`}
                >
                  {data.rate}%
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">
                  {data.responded}/{data.invited}
                </span>
                {data.rate < 50 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendDepartmentReminder(dept)}
                    className="h-6 px-2 text-xs bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Recordar
                  </Button>
                )}
              </div>
            </div>
            
            <div className="progress-container bg-white/10">
              <div 
                className={`progress-fill bg-gradient-to-r ${getParticipationColor(data.rate)}`}
                style={{ width: `${data.rate}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}