'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Target,
  Users,
  Activity,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import '../dashboard.css'; // Estilos corporativos

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
  }, [router]);

  return (
    <div className="neural-dashboard">
      <DashboardNavigation />
      
      <div className="lg:ml-64 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Analytics y Reportes
                </h1>
                <p className="text-white/70">
                  Analiza los resultados de tus campañas de clima organizacional.
                </p>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </div>

          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="professional-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Campañas Analizadas
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">12</div>
                <p className="text-xs text-white/60">
                  +2 este mes
                </p>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Participación Promedio
                </CardTitle>
                <Users className="h-4 w-4 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">87%</div>
                <p className="text-xs text-white/60">
                  +5% vs mes anterior
                </p>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Score Promedio
                </CardTitle>
                <Target className="h-4 w-4 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">7.8</div>
                <p className="text-xs text-white/60">
                  Sobre 10 puntos
                </p>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Tendencia Mensual
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">↗ +12%</div>
                <p className="text-xs text-white/60">
                  Mejora continua
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-white">Participación por Departamento</CardTitle>
                <CardDescription className="text-white/70">
                  Análisis de engagement organizacional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-white/5 rounded">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-white/40 mx-auto mb-2" />
                    <p className="text-sm text-white/60">
                      Gráfico de participación se cargará aquí
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-white">Evolución Temporal</CardTitle>
                <CardDescription className="text-white/70">
                  Tendencias de clima laboral
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-white/5 rounded">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-white/40 mx-auto mb-2" />
                    <p className="text-sm text-white/60">
                      Gráfico temporal se cargará aquí
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Campaigns Analysis */}
          <Card className="professional-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Campañas Recientes</CardTitle>
                  <CardDescription className="text-white/70">
                    Resultados de las últimas mediciones
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => router.push('/dashboard/campaigns')}
                  variant="outline"
                  size="sm"
                >
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Campaign Analytics Item */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Clima Q4 2024</h4>
                      <p className="text-sm text-white/60">
                        Completed • 156 participantes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary" className="bg-white/20 text-white">8.2/10</Badge>
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Download className="h-4 w-4 mr-1" />
                      Exportar
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Pulso Express Nov</h4>
                      <p className="text-sm text-white/60">
                        Completed • 89 participantes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary" className="bg-white/20 text-white">7.8/10</Badge>
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Download className="h-4 w-4 mr-1" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6 professional-card border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-cyan-400">
                    ¿Necesitas un reporte personalizado?
                  </h3>
                  <p className="text-sm text-white/70 mt-1">
                    Genera reportes ejecutivos y análisis detallados.
                  </p>
                </div>
                <Button className="btn-gradient">
                  Generar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}