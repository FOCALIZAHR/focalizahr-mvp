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
  CheckCircle,
  Activity,
  Target,
  BarChart3
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
  // Si no hay datos, mostrar estado vacío mejorado
  if (!leadershipAnalysis?.global?.hasData) {
    return (
      <Card className="fhr-card glass-card neural-glow backdrop-blur-xl border border-gray-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <CardTitle className="text-gray-100">Inteligencia Organizacional</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 leading-relaxed">
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
      case 'ACCELERATOR': return <Zap className="h-5 w-5 text-green-500" />;
      case 'BLOCKER': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  // Función para obtener el color de severidad mejorada
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      default: return 'default';
    }
  };

  // Función para obtener el estilo del badge de severidad
  const getSeverityBadgeStyle = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': 
        return 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse';
      case 'HIGH': 
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'MEDIUM': 
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default: 
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Análisis Global - Card Hero Mejorada WOW */}
      <Card className="fhr-card glass-card neural-glow backdrop-blur-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-blue-900/20 to-purple-900/10 relative overflow-hidden fhr-wow-glow">
        {/* Efecto de fondo decorativo premium */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/20 backdrop-blur-sm">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Inteligencia Organizacional Global
                </CardTitle>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Análisis automático de patrones de liderazgo</p>
              </div>
            </div>
            {data.global.pattern && (
              <Badge 
                variant={getSeverityColor(data.global.pattern.severity)}
                className={`px-3 py-1 ${getSeverityBadgeStyle(data.global.pattern.severity)} backdrop-blur-sm font-semibold`}
              >
                {data.global.pattern.type.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative">
          <p className="text-sm leading-relaxed text-gray-200 font-medium">
            {data.global.insight}
          </p>
          
          {data.global.pattern && (
            <div className="grid grid-cols-3 gap-4 p-5 glass-card rounded-xl border border-blue-500/20 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Índice Diversidad</p>
                </div>
                <div className="relative">
                  <Progress 
                    value={data.global.pattern.metrics.diversityIndex * 100} 
                    className="h-2.5 bg-gray-800/50 backdrop-blur-sm"
                  />
                  <p className="text-2xl font-bold text-blue-400 mt-2">
                    {(data.global.pattern.metrics.diversityIndex * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              
              <div className="text-center space-y-2 border-x border-gray-700/50">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Target className="h-4 w-4 text-purple-400" />
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Grupo Dominante</p>
                </div>
                <p className="text-2xl font-bold capitalize bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {data.global.pattern.metrics.dominantGroup}
                </p>
                <p className="text-sm text-gray-400">
                  {data.global.pattern.metrics.dominantPercentage.toFixed(0)}% del total
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Activity className="h-4 w-4 text-green-400" />
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Dimensión</p>
                </div>
                <p className="text-2xl font-bold text-gray-100">
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

      {/* Grid Estandarizada WOW de Departamentos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-auto">
        {/* Columna de Departamentos Prioritarios */}
        <Card className="fhr-card glass-card backdrop-blur-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-950/30 via-red-900/20 to-transparent fhr-wow-glow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-600/30 to-red-600/20 backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Acción Estratégica Recomendada
                </h3>
              </div>
              {data.criticalDepartments.length > 0 && (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/50">
                  {data.criticalDepartments.length} {data.criticalDepartments.length === 1 ? 'Departamento' : 'Departamentos'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.criticalDepartments.length > 0 ? (
              data.criticalDepartments.map((dept, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-lg border-l-4 border-l-red-500 border border-red-500/30 bg-gradient-to-r from-red-950/30 via-red-900/20 to-orange-900/10 relative overflow-hidden"
                >
                  {/* Indicador visual de urgencia */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500/20 to-transparent rounded-bl-full pointer-events-none" />
                  
                  <div className="space-y-2 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                        <span className="text-base font-bold text-red-200">
                          {dept.department}
                        </span>
                      </div>
                      <Badge 
                        variant="destructive" 
                        className={`${getSeverityBadgeStyle(dept.severity)} flex-shrink-0`}
                      >
                        {dept.severity}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-200 leading-relaxed">
                      {dept.insight}
                    </p>
                    
                    <div className="flex items-center gap-2 pt-2 border-t border-red-500/20">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {dept.issue.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3 opacity-50" />
                <p className="text-sm text-gray-400">No hay departamentos críticos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Columna de Departamentos Ejemplares */}
        <Card className="fhr-card glass-card backdrop-blur-xl border-2 border-green-500/30 bg-gradient-to-br from-green-950/30 via-emerald-900/20 to-transparent fhr-wow-glow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-600/30 to-emerald-600/20 backdrop-blur-sm">
                  <Trophy className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Liderazgo Ejemplar
                </h3>
              </div>
              {data.exemplaryDepartments.length > 0 && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                  {data.exemplaryDepartments.length} {data.exemplaryDepartments.length === 1 ? 'Departamento' : 'Departamentos'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.exemplaryDepartments.length > 0 ? (
              data.exemplaryDepartments.map((dept, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-lg border-l-4 border-l-green-500 border border-green-500/30 bg-gradient-to-br from-green-950/30 via-emerald-900/20 to-teal-900/10 relative overflow-hidden"
                >
                  {/* Indicador visual de excelencia */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full pointer-events-none" />
                  
                  <div className="space-y-2 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span className="text-base font-bold text-green-200">
                          {dept.department}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-bold text-green-300">
                          +{(dept.impactScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-200 leading-relaxed">
                      {dept.insight}
                    </p>
                    
                    <div className="mt-3 p-2 glass-card border border-green-500/30 rounded-lg bg-green-500/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-green-300">
                          Replicar prácticas en otros departamentos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-3 opacity-50" />
                <p className="text-sm text-gray-400">No hay departamentos ejemplares aún</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panel de Recomendaciones Accionables Mejorado WOW */}
      <Card className="fhr-card glass-card neural-glow backdrop-blur-xl bg-gradient-to-r from-purple-950/40 via-purple-900/30 to-pink-900/20 border-2 border-purple-500/30 relative overflow-hidden fhr-wow-glow">
        {/* Efecto decorativo de fondo premium */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
        
        <CardHeader className="relative pb-4">
          <CardTitle className="flex items-center gap-3 text-gray-100">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-600/20 backdrop-blur-sm">
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Plan de Acción Inmediato
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="space-y-4">
            {data.criticalDepartments.length > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-red-950/30 to-red-900/20 border border-red-500/20 backdrop-blur-sm">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600/40 to-red-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
                  <span className="text-sm font-bold text-red-300">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-100 mb-1">
                    Intervención en Departamentos Críticos
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Programar sesiones de feedback con líderes de {data.criticalDepartments[0].department} 
                    {data.criticalDepartments.length > 1 && ` y ${data.criticalDepartments.length - 1} departamento(s) más`}. 
                    Revisar prácticas de comunicación y autonomía.
                  </p>
                </div>
              </div>
            )}
            
            {data.exemplaryDepartments.length > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-green-950/30 to-green-900/20 border border-green-500/20 backdrop-blur-sm">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-600/40 to-green-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                  <span className="text-sm font-bold text-green-300">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-100 mb-1">
                    Documentar Mejores Prácticas
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Analizar y documentar las prácticas de {data.exemplaryDepartments[0].department}
                    {data.exemplaryDepartments.length > 1 && ` y ${data.exemplaryDepartments.length - 1} departamento(s) más`}. 
                    Crear programa de mentoría cross-departamental.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-blue-900/20 border border-blue-500/20 backdrop-blur-sm">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600/40 to-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <span className="text-sm font-bold text-blue-300">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-100 mb-1">
                  Monitoreo de Diversidad
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">
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