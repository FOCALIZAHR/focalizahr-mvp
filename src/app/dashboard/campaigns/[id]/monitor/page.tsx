'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Users, 
  Clock, 
  TrendingUp,
  Eye,
  Mail,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import '../../../dashboard.css'; // Estilos corporativos (tres niveles arriba)

export default function CampaignMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
  }, [router]);

  // Mock data - en implementación real vendría de API
  const campaignData = {
    id: campaignId,
    name: 'Clima Organizacional Q4 2024',
    status: 'active',
    type: 'Pulso Express',
    startDate: '2024-12-01',
    endDate: '2024-12-15',
    totalInvited: 156,
    totalResponded: 89,
    participationRate: 57,
    remainingDays: 3,
    lastActivity: '2024-12-12 15:30'
  };

  const handleRefresh = () => {
    setLastUpdate(new Date());
    // En implementación real: refetch de datos
  };

  return (
    <div className="neural-dashboard">
      <DashboardNavigation currentCampaignId={campaignId} />
      
      <div className="lg:ml-64 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/campaigns')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Monitor de Campaña
                </h1>
                <p className="text-white/70">
                  {campaignData.name}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4">
                <Badge 
                  variant={campaignData.status === 'active' ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  {campaignData.status === 'active' ? 'Activa' : campaignData.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  Tipo: {campaignData.type}
                </span>
              </div>
              
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Resultados
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="professional-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Participación
                </CardTitle>
                <Users className="h-4 w-4 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{campaignData.participationRate}%</div>
                <p className="text-xs text-white/60">
                  {campaignData.totalResponded} de {campaignData.totalInvited}
                </p>
                <div className="progress-container bg-white/10 mt-2">
                  <div 
                    className="progress-fill bg-gradient-to-r from-cyan-500 to-purple-500" 
                    style={{ width: `${campaignData.participationRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Días Restantes
                </CardTitle>
                <Clock className="h-4 w-4 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{campaignData.remainingDays}</div>
                <p className="text-xs text-white/60">
                  Hasta {campaignData.endDate}
                </p>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Respuestas Hoy
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">12</div>
                <p className="text-xs text-white/60">
                  +8% vs ayer
                </p>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Última Actividad
                </CardTitle>
                <Activity className="h-4 w-4 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-white">Hace 2h</div>
                <p className="text-xs text-white/60">
                  {campaignData.lastActivity}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Actividad en Tiempo Real</CardTitle>
                <CardDescription>
                  Últimas respuestas recibidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium">Respuesta completada</p>
                        <p className="text-xs text-gray-500">Departamento: Marketing</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">14:35</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium">Respuesta completada</p>
                        <p className="text-xs text-gray-500">Departamento: IT</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">14:22</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium">Email abierto</p>
                        <p className="text-xs text-gray-500">Departamento: Ventas</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">14:18</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participación por Departamento</CardTitle>
                <CardDescription>
                  Progreso por área organizacional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Marketing</span>
                      <span className="text-sm text-gray-500">85% (17/20)</span>
                    </div>
                    <div className="progress-container bg-white/10">
                      <div 
                        className="progress-fill bg-green-500" 
                        style={{ width: '85%' }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">IT</span>
                      <span className="text-sm text-gray-500">72% (18/25)</span>
                    </div>
                    <div className="progress-container bg-white/10">
                      <div 
                        className="progress-fill bg-yellow-500" 
                        style={{ width: '72%' }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Ventas</span>
                      <span className="text-sm text-gray-500">45% (23/51)</span>
                    </div>
                    <div className="progress-container bg-white/10">
                      <div 
                        className="progress-fill bg-red-500" 
                        style={{ width: '45%' }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">RRHH</span>
                      <span className="text-sm text-gray-500">90% (9/10)</span>
                    </div>
                    <div className="progress-container bg-white/10">
                      <div 
                        className="progress-fill bg-green-500" 
                        style={{ width: '90%' }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alertas y Recomendaciones</CardTitle>
                <CardDescription>
                  Acciones sugeridas para mejorar participación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        Baja participación en Ventas
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Solo 45% de participación. Considera enviar recordatorio.
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        <Mail className="h-3 w-3 mr-1" />
                        Enviar Recordatorio
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Excelente participación en RRHH
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        90% de participación superó las expectativas.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>
                  Gestiona tu campaña activa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Recordatorio General
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Resultados Parciales
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Extender Plazo
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Configurar Metas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Last Update Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Última actualización: {lastUpdate.toLocaleTimeString()} • 
            <Button variant="link" className="p-0 h-auto ml-1" onClick={handleRefresh}>
              Actualizar ahora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}