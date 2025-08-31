import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  Trophy, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface LeadershipAnalysis {
  byDepartment: Record<string, any>;
  global: {
    pattern: any;
    anomaly: any;
    insight: string;
    hasData: boolean;
  };
  criticalDepartments: Array<{
    department: string;
    issue: string;
    severity: string;
    insight: string;
  }>;
  exemplaryDepartments: Array<{
    department: string;
    impactScore: number;
    insight: string;
  }>;
}

interface LeadershipFingerprintPanelProps {
  leadershipAnalysis?: LeadershipAnalysis;
}

export default function LeadershipFingerprintPanel({ leadershipAnalysis }: LeadershipFingerprintPanelProps) {
  // Si no hay datos, mostrar estado vacío
  if (!leadershipAnalysis?.global?.hasData) {
    return (
      <Card className="fhr-card glass-card neural-glow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle>Inteligencia Organizacional</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {leadershipAnalysis?.global?.insight || 'Sin datos suficientes para análisis de patrones organizacionales.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = leadershipAnalysis;

  // Función para obtener el ícono según el tipo de impacto
  const getImpactIcon = (impact: string) => {
    switch(impact) {
      case 'ACCELERATOR': return <Zap className="h-5 w-5 text-green-600" />;
      case 'BLOCKER': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  // Función para obtener el color de severidad
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Análisis Global */}
      <Card className="fhr-card glass-card neural-glow border-2 border-blue-500/20 bg-gradient-to-br from-blue-900/20 via-blue-800/10 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-lg font-semibold text-gray-100">Inteligencia Organizacional Global</CardTitle>
            </div>
            {data.global.pattern && (
              <Badge 
                variant={getSeverityColor(data.global.pattern.severity)}
                className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30"
              >
                {data.global.pattern.type.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-300">{data.global.insight}</p>
          
          {data.global.pattern && (
            <div className="grid grid-cols-3 gap-4 p-4 glass-card rounded-lg border border-blue-500/10">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Índice Diversidad</p>
                <div className="relative">
                  <Progress 
                    value={data.global.pattern.metrics.diversityIndex * 100} 
                    className="h-2 bg-gray-700"
                  />
                  <p className="text-lg font-bold text-blue-400 mt-1">
                    {(data.global.pattern.metrics.diversityIndex * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Grupo Dominante</p>
                <p className="text-lg font-bold capitalize text-gray-100">
                  {data.global.pattern.metrics.dominantGroup}
                </p>
                <p className="text-xs text-gray-400">
                  {data.global.pattern.metrics.dominantPercentage.toFixed(0)}% del total
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Dimensión</p>
                <p className="text-lg font-bold text-gray-100">
                  {data.global.pattern.dimension === 'GENDER' ? 'Género' :
                   data.global.pattern.dimension === 'AGE' ? 'Generacional' :
                   data.global.pattern.dimension === 'SENIORITY' ? 'Antigüedad' : 
                   data.global.pattern.dimension}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de Departamentos Críticos y Ejemplares */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departamentos Críticos */}
        {data.criticalDepartments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <h3 className="text-lg font-semibold text-gray-100">Atención Urgente Requerida</h3>
            </div>
            {data.criticalDepartments.map((dept, index) => (
              <Alert key={index} variant="destructive" className="fhr-card glass-card border-red-500/30 bg-gradient-to-r from-red-900/20 to-orange-900/10">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <AlertTitle className="text-base text-red-300">{dept.department}</AlertTitle>
                    <Badge variant="destructive" className="ml-2 bg-red-600/20 border-red-500/30">
                      {dept.severity}
                    </Badge>
                  </div>
                  <AlertDescription className="text-sm text-gray-300">
                    {dept.insight}
                  </AlertDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="text-xs font-medium text-gray-400">
                      Tipo: {dept.issue.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Departamentos Ejemplares */}
        {data.exemplaryDepartments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-gray-100">Liderazgo Ejemplar</h3>
            </div>
            {data.exemplaryDepartments.map((dept, index) => (
              <Card key={index} className="fhr-card glass-card neural-glow border-green-500/30 bg-gradient-to-br from-green-900/20 via-emerald-800/10 to-transparent">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-gray-100">{dept.department}</CardTitle>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-lg font-bold text-green-400">
                        +{(dept.impactScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    {dept.insight}
                  </p>
                  <div className="mt-3 p-2 glass-card border border-green-500/20 rounded-md">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span className="text-xs font-medium text-green-300">
                        Replicar prácticas en otros departamentos
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Panel de Recomendaciones Accionables */}
      <Card className="fhr-card glass-card neural-glow bg-gradient-to-r from-purple-900/20 via-purple-800/10 to-pink-900/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Zap className="h-5 w-5 text-purple-400" />
            Acciones Recomendadas Inmediatas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.criticalDepartments.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-red-600/30 to-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-red-400">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">Intervención en Departamentos Críticos</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Programar sesiones de feedback con líderes de {data.criticalDepartments[0].department} 
                    {data.criticalDepartments.length > 1 && ` y ${data.criticalDepartments.length - 1} departamento(s) más`}. 
                    Revisar prácticas de comunicación y autonomía.
                  </p>
                </div>
              </div>
            )}
            
            {data.exemplaryDepartments.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-600/30 to-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-green-400">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">Documentar Mejores Prácticas</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Analizar y documentar las prácticas de {data.exemplaryDepartments[0].department}
                    {data.exemplaryDepartments.length > 1 && ` y ${data.exemplaryDepartments.length - 1} departamento(s) más`}. 
                    Crear programa de mentoría cross-departamental.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-600/30 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-400">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100">Monitoreo de Diversidad</p>
                <p className="text-xs text-gray-400 mt-1">
                  Implementar métricas de diversidad e inclusión en evaluaciones futuras. 
                  Establecer KPIs específicos para equilibrio demográfico y participación equitativa.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}