// ARCHIVO: /src/components/monitor/ActivityFeed.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface ActivityItem {
  id: string;
  dept: string;
  participant: string;
  timestamp: string;
  status: string;
  action: string;
}

interface ActivityFeedProps {
  recentActivity: ActivityItem[];
}

export function ActivityFeed({ recentActivity }: ActivityFeedProps) {
  return (
    <Card className="glass-card neural-glow">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-400" />
          Actividad en Tiempo Real
        </CardTitle>
        <CardDescription className="text-white/60">
          Últimas respuestas recibidas por departamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <div className="text-sm font-medium text-white">
                    {activity.dept}
                  </div>
                  <div className="text-xs text-white/60">
                    {activity.action}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-white/80">
                  {activity.timestamp}
                </div>
                <Badge 
                  variant={activity.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs mt-1"
                >
                  {activity.status === 'completed' ? 'Completado' : 'En progreso'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}