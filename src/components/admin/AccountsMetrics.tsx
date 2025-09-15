// /components/admin/AccountsMetrics.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';

interface AccountsMetricsProps {
  totalAccounts: number;
  metrics?: {
    total: number;
    growthPercentage: number;
    activeAccounts: number;
    trialAccounts: number;
    suspendedAccounts: number;
  };
}

export default function AccountsMetrics({ totalAccounts, metrics }: AccountsMetricsProps) {
  // Asegurar que tenemos valores por defecto si metrics no viene o está incompleto
  const growthPercentage = metrics?.growthPercentage || 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Clientes
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAccounts}</div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {growthPercentage !== 0 ? (
              <>
                {growthPercentage > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={growthPercentage > 0 ? "text-green-500" : "text-red-500"}>
                  {growthPercentage > 0 ? '+' : ''}{growthPercentage}%
                </span>
                <span className="ml-1">vs mes anterior</span>
              </>
            ) : (
              <span className="text-muted-foreground">Sin cambios este mes</span>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Placeholder para futuras métricas - comentado por ahora */}
      {/* 
      <Card className="opacity-30">
        <CardHeader>
          <CardTitle className="text-sm">Cuentas Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.activeAccounts || '--'}</div>
          <p className="text-xs text-muted-foreground">Próximamente</p>
        </CardContent>
      </Card>
      
      <Card className="opacity-30">
        <CardHeader>
          <CardTitle className="text-sm">En Prueba</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.trialAccounts || '--'}</div>
          <p className="text-xs text-muted-foreground">Próximamente</p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}