// /app/dashboard/admin/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Activity, 
  TrendingUp,
  Building2,
  Shield,
  Zap,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

// Importar estilos premium si existen
import '@/styles/focalizahr-design-system.css';

// Función para obtener métricas reales
async function getAdminMetrics() {
  try {
    // TODO: Implementar fetch real con autenticación
    // const response = await fetch('/api/admin/metrics');
    // return await response.json();
    
    // Por ahora retornamos estructura esperada
    return {
      totalAccounts: 0,
      activeAccounts: 0,
      revenue: {
        mrr: 0,
        growth: 0
      },
      campaigns: {
        active: 0,
        completed: 0
      }
    };
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return null;
  }
}

export default async function AdminDashboardPage() {
  const metrics = await getAdminMetrics();
  
  return (
    <div className="p-8 space-y-8">
      {/* Header con gradiente premium */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-10" />
        <div className="relative p-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-2">
            Centro de control empresarial FocalizaHR
          </p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clientes
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAccounts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.activeAccounts || 0} activas
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              MRR
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.revenue?.mrr || 0}
            </div>
            <p className="text-xs text-green-500">
              +{metrics?.revenue?.growth || 0}% este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Campañas Activas
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.campaigns?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.campaigns?.completed || 0} completadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Performance
            </CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">
              Uptime del sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/admin/accounts">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Gestionar Cuentas
              </CardTitle>
              <CardDescription>
                Administra las empresas clientes
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/admin/accounts/new">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Crear Nueva Cuenta
              </CardTitle>
              <CardDescription>
                Registra una nueva empresa
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Analytics Global
            </CardTitle>
            <CardDescription>
              Próximamente
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Footer informativo */}
      <div className="text-center text-sm text-muted-foreground pt-8">
        <p>Sistema de Administración FocalizaHR v1.0</p>
        <p className="mt-1">Última actualización: {new Date().toLocaleDateString('es-CL')}</p>
      </div>
    </div>
  );
}