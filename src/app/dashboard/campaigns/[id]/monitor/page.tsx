'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  Calendar, 
  Eye,
  ArrowLeft,
  Building2,
  TrendingUp,
  Bell,
  UserCheck
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data específico para la campaña
const mockData = {
  id: 'c1',
  name: 'Clima Organizacional Q4 2024',
  type: 'Pulso Express',
  status: 'active',
  participationRate: 57,
  totalInvited: 156,
  totalResponded: 89,
  daysRemaining: 3,
  lastActivity: '2024-12-12 15:30',
  startDate: '2024-12-07',
  endDate: '2024-12-15',
  dailyResponses: [
    { day: 'Lun', responses: 8, date: '07/12' },
    { day: 'Mar', responses: 12, date: '08/12' },
    { day: 'Mié', responses: 15, date: '09/12' },
    { day: 'Jue', responses: 18, date: '10/12' },
    { day: 'Vie', responses: 14, date: '11/12' },
    { day: 'Sáb', responses: 11, date: '12/12' },
    { day: 'Dom', responses: 7, date: '13/12' }
  ],
  // Datos de segmentación por departamento
  byDepartment: {
    'Marketing': { responded: 17, invited: 20, rate: 85 },
    'IT': { responded: 18, invited: 25, rate: 72 },
    'Ventas': { responded: 23, invited: 51, rate: 45 },
    'RRHH': { responded: 9, invited: 10, rate: 90 },
    'Finanzas': { responded: 12, invited: 20, rate: 60 },
    'Operaciones': { responded: 10, invited: 30, rate: 33 }
  },
  // Actividad en tiempo real
  recentActivity: [
    { id: 'ra1', dept: 'Marketing', participant: 'Ana García', timestamp: '14:35', status: 'completed', action: 'Completó encuesta' },
    { id: 'ra2', dept: 'IT', participant: 'Carlos López', timestamp: '14:22', status: 'completed', action: 'Completó encuesta' },
    { id: 'ra3', dept: 'Ventas', participant: 'María Silva', timestamp: '14:18', status: 'started', action: 'Inició encuesta' },
    { id: 'ra4', dept: 'RRHH', participant: 'Pedro Ruiz', timestamp: '14:05', status: 'completed', action: 'Completó encuesta' },
    { id: 'ra5', dept: 'Finanzas', participant: 'Lucia Torres', timestamp: '13:45', status: 'started', action: 'Inició encuesta' }
  ],
  // Alertas actualizadas con segmentación
  alerts: [
    {
      id: 'a1',
      type: 'warning',
      message: 'Baja participación en Ventas (45%)',
      department: 'Ventas',
      timestamp: '15:30',
      priority: 'high'
    },
    {
      id: 'a2',
      type: 'warning', 
      message: 'Participación muy baja en Operaciones (33%)',
      department: 'Operaciones',
      timestamp: '15:25',
      priority: 'high'
    },
    {
      id: 'a3',
      type: 'success',
      message: 'Excelente participación en RRHH (90%)',
      department: 'RRHH',
      timestamp: '14:50',
      priority: 'low'
    },
    {
      id: 'a4',
      type: 'info',
      message: 'Recordatorio automático enviado a 67 participantes',
      timestamp: '09:00',
      priority: 'medium'
    }
  ]
};

export default function CampaignMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const [campaignData, setCampaignData] = useState(mockData);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Simulación auto-refresh cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Aquí se conectaría a la API en Etapa 4
      console.log('Auto-refresh datos campaña:', params.id);
    }, 60000);

    return () => clearInterval(interval);
  }, [params.id]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulación de actualización
    setTimeout(() => {
      setLastRefresh(new Date());
      setIsLoading(false);
      // En Etapa 4: await fetch(`/api/campaigns/${params.id}/metrics`)
    }, 1000);
  };

  const handleSendReminder = () => {
    alert('Funcionalidad de recordatorio será implementada en Etapa 4');
  };

  const handleExtendCampaign = () => {
    alert('Funcionalidad de extensión será implementada en Etapa 4');
  };

  const handleSendDepartmentReminder = (department: string) => {
    alert(`Funcionalidad de recordatorio para ${department} será implementada en Etapa 4`);
  };

  const getParticipationColor = (rate: number) => {
    if (rate >= 70) return 'from-green-500 to-emerald-500';
    if (rate >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getParticipationStatus = (rate: number) => {
    if (rate >= 70) return { text: 'Excelente', color: 'bg-green-500' };
    if (rate >= 50) return { text: 'Regular', color: 'bg-yellow-500' };
    return { text: 'Bajo', color: 'bg-red-500' };
  };

  return (
    <div className="neural-dashboard main-layout min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        
        {/* Header con breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="btn-gradient focus-ring flex items-center gap-2"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
            </div>
            
            <h1 className="text-3xl font-bold focalizahr-gradient-text">
              {campaignData.name}
            </h1>
            
            <div className="flex items-center gap-4 mt-2">
              <Badge 
                variant={campaignData.status === 'active' ? 'default' : 'secondary'}
                className="text-sm"
              >
                <Activity className="h-3 w-3 mr-1" />
                {campaignData.status === 'active' ? 'Activa' : campaignData.status}
              </Badge>
              <span className="text-sm text-white/60">
                Tipo: {campaignData.type}
              </span>
              <span className="text-sm text-white/60">
                Período: {campaignData.startDate} - {campaignData.endDate}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button size="sm" className="btn-gradient">
              <Eye className="h-4 w-4 mr-2" />
              Ver Resultados
            </Button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="metrics-grid">
          {/* Participación */}
          <Card className="glass-card neural-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Participación
              </CardTitle>
              <Users className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {campaignData.participationRate}%
              </div>
              <p className="text-xs text-white/60 mb-3">
                {campaignData.totalResponded} de {campaignData.totalInvited} participantes
              </p>
              
              <div className="progress-container bg-white/10">
                <div 
                  className={`progress-fill bg-gradient-to-r ${getParticipationColor(campaignData.participationRate)}`}
                  style={{ width: `${campaignData.participationRate}%` }}
                />
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${getParticipationStatus(campaignData.participationRate).color}`} />
                <span className="text-xs text-white/80">
                  {getParticipationStatus(campaignData.participationRate).text}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Respuestas */}
          <Card className="glass-card neural-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Respuestas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {campaignData.totalResponded}
              </div>
              <p className="text-xs text-white/60">
                Respuestas completadas
              </p>
              <div className="text-sm text-cyan-400 mt-2">
                +7 hoy
              </div>
            </CardContent>
          </Card>

          {/* Días restantes */}
          <Card className="glass-card neural-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Tiempo Restante
              </CardTitle>
              <Clock className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {campaignData.daysRemaining}
              </div>
              <p className="text-xs text-white/60">
                Días restantes
              </p>
              <div className="text-sm text-orange-400 mt-2">
                Finaliza {campaignData.endDate}
              </div>
            </CardContent>
          </Card>

          {/* Última actividad */}
          <Card className="glass-card neural-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Última Actividad
              </CardTitle>
              <Activity className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">
                {campaignData.lastActivity.split(' ')[1]}
              </div>
              <p className="text-xs text-white/60">
                {campaignData.lastActivity.split(' ')[0]}
              </p>
              <div className="text-sm text-green-400 mt-2">
                Actualizado hace {Math.round((Date.now() - lastRefresh.getTime()) / 60000)} min
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participación por Departamento */}
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
            {Object.entries(campaignData.byDepartment)
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

        {/* Actividad en Tiempo Real */}
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
              {campaignData.recentActivity.map((activity) => (
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

        {/* Gráfico de respuestas por día */}
        <Card className="glass-card neural-glow">
          <CardHeader>
            <CardTitle className="text-white">Progreso Diario</CardTitle>
            <CardDescription className="text-white/60">
              Respuestas recibidas por día durante la campaña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={campaignData.dailyResponses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="day" 
                    stroke="rgba(255,255,255,0.6)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.6)"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(71, 85, 105, 0.3)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responses" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Panel de alertas segmentadas */}
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
            {campaignData.alerts.map((alert) => (
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

        {/* Botones de acción contextuales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            onClick={handleSendReminder}
            className="btn-gradient"
          >
            <Send className="h-4 w-4 mr-2" />
            Recordatorio General
          </Button>
          
          <Button 
            onClick={() => handleSendDepartmentReminder('Ventas')}
            variant="outline"
            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Urgente: Ventas
          </Button>
          
          <Button 
            onClick={handleExtendCampaign}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Extender Campaña
          </Button>
          
          <Button 
            onClick={() => alert('Analytics por departamento será implementado en Etapa 4')}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Eye className="h-4 w-4 mr-2" />
            Análisis por Depto
          </Button>
        </div>

        {/* Footer con información de actualización */}
        <div className="text-center text-sm text-white/40">
          Última actualización: {lastRefresh.toLocaleTimeString()} • 
          Próxima actualización automática en {60 - new Date().getSeconds()} segundos
        </div>
      </div>
    </div>
  );
}