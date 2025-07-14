"use client";
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { useSidebar } from '@/hooks/useSidebar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  Share, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Mail,
  Eye,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data para el dashboard
const mockAnalyticsData = {
  crossCampaignMetrics: {
    totalCampaigns: 12,
    activeCampaigns: 3,
    totalParticipants: 1247,
    totalResponses: 1034,
    avgParticipationRate: 82.9,
    avgScoreOverall: 4.1,
    monthlyGrowth: 15.3,
    weeklyResponses: 89
  },
  campaignComparison: [
    { name: 'Retención Q4', type: 'retention', score: 4.2, participation: 84.7, responses: 127 },
    { name: 'Pulso Enero', type: 'pulse', score: 3.8, participation: 85.9, responses: 73 },
    { name: 'Experiencia 2024', type: 'experience', score: 4.0, participation: 84.0, responses: 168 },
    { name: 'Clima Laboral', type: 'pulse', score: 3.9, participation: 78.2, responses: 95 },
    { name: 'Desarrollo Q1', type: 'experience', score: 4.3, participation: 89.1, responses: 142 }
  ],
  industryBenchmark: {
    technology: { participation: 72.0, score: 3.9 },
    finance: { participation: 68.0, score: 3.7 },
    healthcare: { participation: 75.0, score: 4.0 }
  },
  trendData: [
    { month: 'Sep', responses: 234, score: 3.8 },
    { month: 'Oct', responses: 289, score: 3.9 },
    { month: 'Nov', responses: 312, score: 4.0 },
    { month: 'Dic', responses: 356, score: 4.1 },
    { month: 'Ene', responses: 423, score: 4.2 }
  ],
  typeDistribution: [
    { name: 'Retención', value: 35, color: '#3b82f6' },
    { name: 'Pulso', value: 40, color: '#10b981' },
    { name: 'Experiencia', value: 25, color: '#f59e0b' }
  ]
};

export default function ExportAnalyticsEnterprise() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedExport, setSelectedExport] = useState<'csv' | 'excel' | 'pdf' | 'link' | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [sharingConfig, setSharingConfig] = useState({
    enablePublicLink: false,
    expirationDays: 30,
    requireAuth: true
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#0D1117'}}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Analytics
          </h2>
        </div>
      </div>
    );
  }

  // Simulación de export process
  const handleExport = async (type: 'csv' | 'excel' | 'pdf' | 'link') => {
    setIsExporting(true);
    setSelectedExport(type);
    setExportProgress(0);

    // Simulación progreso
    const progressSteps = [20, 45, 70, 90, 100];
    for (let step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setExportProgress(step);
    }

    // Simulación generación archivo según tipo
    switch (type) {
      case 'pdf':
        generatePDFReport();
        break;
      case 'excel':
        generateExcelExport();
        break;
      case 'csv':
        generateCSVExport();
        break;
      case 'link':
        generateShareableLink();
        break;
    }

    setTimeout(() => {
      setIsExporting(false);
      setSelectedExport(null);
      setExportProgress(0);
    }, 1000);
  };

  const generatePDFReport = () => {
    // Simulación PDF generation
    console.log('Generating PDF Report...');
    const pdfData = {
      title: 'Informe Ejecutivo FocalizaHR',
      company: 'TechCorp Chile',
      date: new Date().toLocaleDateString('es-CL'),
      metrics: mockAnalyticsData.crossCampaignMetrics,
      campaigns: mockAnalyticsData.campaignComparison,
      benchmark: mockAnalyticsData.industryBenchmark
    };
    console.log('PDF Data prepared:', pdfData);
    alert('📄 PDF Ejecutivo generado exitosamente\n\n• 8 páginas con análisis completo\n• Gráficos y métricas incluidas\n• Branding FocalizaHR aplicado');
  };

  const generateExcelExport = () => {
    // Simulación Excel generation with worksheets
    console.log('Generating Excel Export...');
    const excelStructure = {
      worksheets: [
        {
          name: 'Resumen Ejecutivo',
          data: mockAnalyticsData.crossCampaignMetrics
        },
        {
          name: 'Datos Raw',
          data: mockAnalyticsData.campaignComparison
        },
        {
          name: 'Análisis Temporal',
          data: mockAnalyticsData.trendData
        },
        {
          name: 'Tablas Dinámicas',
          data: 'Preparadas para análisis profundo'
        }
      ]
    };
    console.log('Excel structure:', excelStructure);
    alert('📊 Excel generado exitosamente\n\n• 4 hojas con datos estructurados\n• Tablas dinámicas preparadas\n• Fórmulas para análisis automático');
  };

  const generateCSVExport = () => {
    // Simulación CSV generation
    const csvData = mockAnalyticsData.campaignComparison.map(campaign => ({
      campaign: campaign.name,
      tipo: campaign.type,
      score: campaign.score,
      participacion: campaign.participation,
      respuestas: campaign.responses
    }));
    console.log('CSV Data:', csvData);
    alert('📋 CSV generado exitosamente\n\n• Datos limpios para análisis\n• Headers descriptivos\n• Compatible con herramientas BI');
  };

  const generateShareableLink = () => {
    const linkConfig = {
      url: `https://focalizahr.com/shared/dashboard/${Math.random().toString(36).substr(2, 9)}`,
      expiresIn: `${sharingConfig.expirationDays} días`,
      requiresAuth: sharingConfig.requireAuth,
      permissions: ['view', 'download']
    };
    console.log('Shareable link:', linkConfig);
    alert(`🔗 Link público generado\n\n• URL: ${linkConfig.url}\n• Expira en: ${linkConfig.expiresIn}\n• Autenticación: ${linkConfig.requiresAuth ? 'Requerida' : 'No requerida'}`);
  };

  const getBenchmarkComparison = (userValue: number, benchmarkValue: number) => {
    const diff = userValue - benchmarkValue;
    const percentage = ((Math.abs(diff) / benchmarkValue) * 100).toFixed(1);
    return {
      difference: diff.toFixed(1),
      percentage,
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      significance: Math.abs(diff) > 0.3 ? 'significant' : 'minor'
    };
  };

  const participationComparison = getBenchmarkComparison(
    mockAnalyticsData.crossCampaignMetrics.avgParticipationRate,
    mockAnalyticsData.industryBenchmark.technology.participation
  );

  const scoreComparison = getBenchmarkComparison(
    mockAnalyticsData.crossCampaignMetrics.avgScoreOverall,
    mockAnalyticsData.industryBenchmark.technology.score
  );

  return (
    <div className="min-h-screen" style={{background: '#0D1117'}}>
      <DashboardNavigation 
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      />
      
      <div className={`min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <main className="p-6 lg:p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-sm border border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Analytics + Export Enterprise</h1>
                  <p className="text-slate-300 mt-1">Dashboard comparativo y exportación profesional</p>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Chat 5: 90% → 95%
                </Badge>
              </div>
            </div>

            {/* Métricas Principales Cross-Campaign */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50 border-l-4 border-l-cyan-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Total Campañas</p>
                      <p className="text-2xl font-bold text-white">{mockAnalyticsData.crossCampaignMetrics.totalCampaigns}</p>
                    </div>
                    <div className="bg-cyan-500/20 p-2 rounded-lg">
                      <Target className="h-5 w-5 text-cyan-400" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-400 mr-1" />
                    <span className="text-green-400">{mockAnalyticsData.crossCampaignMetrics.activeCampaigns} activas</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50 border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Participación Global</p>
                      <p className="text-2xl font-bold text-white">{mockAnalyticsData.crossCampaignMetrics.avgParticipationRate}%</p>
                    </div>
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUp className="h-3 w-3 text-green-400 mr-1" />
                    <span className="text-green-400">+{participationComparison.percentage}% vs industry</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50 border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Score Promedio</p>
                      <p className="text-2xl font-bold text-white">{mockAnalyticsData.crossCampaignMetrics.avgScoreOverall}</p>
                    </div>
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUp className="h-3 w-3 text-green-400 mr-1" />
                    <span className="text-green-400">+{scoreComparison.percentage}% vs benchmark</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50 border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Crecimiento Mensual</p>
                      <p className="text-2xl font-bold text-white">{mockAnalyticsData.crossCampaignMetrics.monthlyGrowth}%</p>
                    </div>
                    <div className="bg-orange-500/20 p-2 rounded-lg">
                      <Calendar className="h-5 w-5 text-orange-400" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                    <span className="text-green-400">{mockAnalyticsData.crossCampaignMetrics.weeklyResponses} esta semana</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comparison Chart */}
              <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart3 className="h-5 w-5 text-cyan-400" />
                    Comparativo Campañas por Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockAnalyticsData.campaignComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 5]} />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'score' ? `${value}/5.0` : `${value}%`,
                          name === 'score' ? 'Score' : 'Participación'
                        ]}
                      />
                      <Bar dataKey="score" fill="#3b82f6" name="score" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-2 bg-cyan-500/10 border border-cyan-500/20 rounded">
                      <div className="text-cyan-400 font-medium">Mejor Score</div>
                      <div className="text-slate-300">Desarrollo Q1 (4.3)</div>
                    </div>
                    <div className="text-center p-2 bg-green-500/10 border border-green-500/20 rounded">
                      <div className="text-green-400 font-medium">Mejor Participación</div>
                      <div className="text-slate-300">Desarrollo Q1 (89.1%)</div>
                    </div>
                    <div className="text-center p-2 bg-purple-500/10 border border-purple-500/20 rounded">
                      <div className="text-purple-400 font-medium">Más Respuestas</div>
                      <div className="text-slate-300">Experiencia (168)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Analysis */}
              <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    Tendencia Temporal (5 meses)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockAnalyticsData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" domain={[0, 500]} />
                      <YAxis yAxisId="right" orientation="right" domain={[3.5, 4.5]} />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="responses" fill="#10b981" name="Respuestas" />
                      <Line yAxisId="right" type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={3} name="Score Promedio" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex justify-between text-sm">
                    <div className="text-green-400">
                      <span className="font-medium">+81%</span> respuestas últimos 5 meses
                    </div>
                    <div className="text-orange-400">
                      <span className="font-medium">+0.4</span> puntos mejora en score
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Section */}
            <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Download className="h-5 w-5 text-cyan-400" />
                  Exportación Profesional + Sharing Enterprise
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isExporting && (
                  <Alert className="mb-6 bg-cyan-500/10 border-cyan-500/30">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Generando {selectedExport?.toUpperCase()}... {exportProgress}%</span>
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${exportProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Button 
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white border-none" 
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                  >
                    <FileText className="h-6 w-6 text-white" />
                    <span className="text-sm font-medium">PDF Ejecutivo</span>
                    <span className="text-xs text-cyan-100">8 páginas completas</span>
                  </Button>

                  <Button 
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border-none" 
                    onClick={() => handleExport('excel')}
                    disabled={isExporting}
                  >
                    <BarChart3 className="h-6 w-6 text-white" />
                    <span className="text-sm font-medium">Excel Avanzado</span>
                    <span className="text-xs text-green-100">4 hojas + dinámicas</span>
                  </Button>

                  <Button 
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-none" 
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                  >
                    <Download className="h-6 w-6 text-white" />
                    <span className="text-sm font-medium">CSV Raw Data</span>
                    <span className="text-xs text-blue-100">Datos limpios</span>
                  </Button>

                  <Button 
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white border-none" 
                    onClick={() => handleExport('link')}
                    disabled={isExporting}
                  >
                    <Share className="h-6 w-6 text-white" />
                    <span className="text-sm font-medium">Link Público</span>
                    <span className="text-xs text-purple-100">Acceso controlado</span>
                  </Button>
                </div>

                <Separator className="my-6" />

                {/* Features Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-700/30 border border-slate-600/30 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-3 text-red-400" />
                    <h3 className="font-medium text-white mb-2">PDF Profesional</h3>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Executive summary diferenciado</li>
                      <li>• Gráficos y visualizaciones</li>
                      <li>• Branding FocalizaHR</li>
                      <li>• Insights automáticos</li>
                    </ul>
                  </div>

                  <div className="text-center p-4 bg-slate-700/30 border border-slate-600/30 rounded-lg">
                    <BarChart3 className="h-8 w-8 mx-auto mb-3 text-green-400" />
                    <h3 className="font-medium text-white mb-2">Excel Estructurado</h3>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Múltiples worksheets</li>
                      <li>• Tablas dinámicas preparadas</li>
                      <li>• Fórmulas automáticas</li>
                      <li>• Raw data + analytics</li>
                    </ul>
                  </div>

                  <div className="text-center p-4 bg-slate-700/30 border border-slate-600/30 rounded-lg">
                    <Share className="h-8 w-8 mx-auto mb-3 text-purple-400" />
                    <h3 className="font-medium text-white mb-2">Sharing Enterprise</h3>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Links públicos seguros</li>
                      <li>• Control de expiración</li>
                      <li>• Autenticación opcional</li>
                      <li>• Email directo stakeholders</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benchmark Comparison */}
            <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="h-5 w-5 text-cyan-400" />
                  Benchmarking Sectorial vs Industria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Technology Sector */}
                  <div className="p-4 border border-cyan-500/30 bg-cyan-500/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-cyan-400">Tecnología</h3>
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40">Tu Sector</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Participación</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{mockAnalyticsData.crossCampaignMetrics.avgParticipationRate}%</span>
                          <div className="flex items-center text-green-400">
                            <ArrowUp className="h-3 w-3" />
                            <span className="text-xs">+{participationComparison.percentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Score Promedio</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{mockAnalyticsData.crossCampaignMetrics.avgScoreOverall}/5.0</span>
                          <div className="flex items-center text-green-400">
                            <ArrowUp className="h-3 w-3" />
                            <span className="text-xs">+{scoreComparison.percentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-cyan-500/30">
                        <span className="text-xs text-cyan-400 font-medium">🏆 TOP 25% del sector</span>
                      </div>
                    </div>
                  </div>

                  {/* Finance Comparison */}
                  <div className="p-4 border border-slate-600/30 bg-slate-700/20 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-300">Finanzas</h3>
                      <Badge variant="outline" className="border-slate-600 text-slate-400">Benchmark</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Participación</span>
                        <span className="text-sm text-slate-300">{mockAnalyticsData.industryBenchmark.finance.participation}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Score Promedio</span>
                        <span className="text-sm text-slate-300">{mockAnalyticsData.industryBenchmark.finance.score}/5.0</span>
                      </div>
                      <div className="pt-2 border-t border-slate-600/30">
                        <span className="text-xs text-slate-400">Promedio sectorial</span>
                      </div>
                    </div>
                  </div>

                  {/* Healthcare Comparison */}
                  <div className="p-4 border border-slate-600/30 bg-slate-700/20 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-300">Salud</h3>
                      <Badge variant="outline" className="border-slate-600 text-slate-400">Benchmark</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Participación</span>
                        <span className="text-sm text-slate-300">{mockAnalyticsData.industryBenchmark.healthcare.participation}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Score Promedio</span>
                        <span className="text-sm text-slate-300">{mockAnalyticsData.industryBenchmark.healthcare.score}/5.0</span>
                      </div>
                      <div className="pt-2 border-t border-slate-600/30">
                        <span className="text-xs text-slate-400">Promedio sectorial</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="mt-6 bg-green-500/10 border-green-500/30">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-slate-300">
                    <strong className="text-white">Destacado rendimiento:</strong> Tu empresa supera el benchmark tecnológico en +{participationComparison.percentage}% participación y +{scoreComparison.percentage}% en score promedio, posicionándote en el <strong className="text-green-400">TOP 25%</strong> del sector.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5 text-purple-400" />
                    Distribución por Tipo de Estudio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={mockAnalyticsData.typeDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {mockAnalyticsData.typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Distribución']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {mockAnalyticsData.typeDistribution.map((type, index) => (
                      <div key={index} className="text-center p-2 bg-slate-700/30 border border-slate-600/30 rounded">
                        <div 
                          className="w-4 h-4 rounded mx-auto mb-1" 
                          style={{ backgroundColor: type.color }}
                        ></div>
                        <div className="text-sm font-medium text-white">{type.name}</div>
                        <div className="text-xs text-slate-400">{type.value}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Insights */}
              <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                    Insights Automáticos + Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-green-400">Fortaleza Detectada</h4>
                          <p className="text-sm text-slate-300">Desarrollo Q1 supera benchmarks en +0.4 puntos. Replicar metodología en otras áreas.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-cyan-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-cyan-400">Tendencia Positiva</h4>
                          <p className="text-sm text-slate-300">Crecimiento sostenido 81% en respuestas últimos 5 meses. Momentum favorable para próximas campañas.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Eye className="h-5 w-5 text-orange-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-orange-400">Oportunidad de Mejora</h4>
                          <p className="text-sm text-slate-300">Pulso Express con menor score (3.8). Considerar profundizar análisis factores específicos.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-purple-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-purple-400">Acción Recomendada</h4>
                          <p className="text-sm text-slate-300">Programar campaña seguimiento en Q2 para validar mejoras implementadas.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Email Integration Preview */}
            <Card className="bg-slate-800/50 backdrop-blur-sm shadow-sm border border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="h-5 w-5 text-cyan-400" />
                  Integración Email Automation (Chat 4 Completado)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-cyan-500/30 bg-cyan-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-cyan-400">Templates Diferenciados</span>
                    </div>
                    <p className="text-xs text-slate-300">Email automation por campaign_type funcionando: Retención, Pulso, Experiencia</p>
                  </div>

                  <div className="p-4 border border-green-500/30 bg-green-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">Variables Dinámicas</span>
                    </div>
                    <p className="text-xs text-slate-300">Personalización automática: {'{company_name}'}, {'{participant_name}'}, {'{deadline}'}</p>
                  </div>

                  <div className="p-4 border border-purple-500/30 bg-purple-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-purple-400">Toast Notifications</span>
                    </div>
                    <p className="text-xs text-slate-300">Sistema notificaciones real-time + colores corporativos funcionando</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Alert className="bg-slate-800/30 border-slate-700/50">
              <Clock className="h-4 w-4 text-slate-400" />
              <AlertDescription>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-white">Export Performance</div>
                    <div className="text-green-400">PDF &lt;15s • Excel &lt;10s</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-white">Analytics Response</div>
                    <div className="text-green-400">APIs &lt;200ms</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-white">Dashboard Load</div>
                    <div className="text-green-400">&lt;3s completo</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-white">Mobile Optimized</div>
                    <div className="text-green-400">375px+ responsive</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
      
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </div>
  );
}