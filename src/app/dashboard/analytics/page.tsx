'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, Users, Star, TrendingUp, Download, Copy, 
  Filter, RefreshCw, Calendar, Building2, Target,
  FileText, Share, Settings, ChevronDown, Info,
  Gauge, PieChart, Zap, Award, AlertTriangle,
  CheckCircle, Clock, Eye
} from 'lucide-react';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Sector,
  RadialBarChart, RadialBar, Legend
} from 'recharts';

// Mock Data - Estructura real para conectar APIs futuras
const campaignData = {
  id: "camp_001",
  name: "Pulso Organizacional Q1 2025",
  type: "pulso_express",
  status: "completed",
  company: "TechCorp Chile",
  startDate: "2025-01-15",
  endDate: "2025-01-30",
  description: "Diagnóstico rápido clima laboral primer trimestre",
  
  metrics: {
    participation: 87, // %
    overall_score: 4.2, // /5.0
    total_responses: 156,
    total_invited: 179,
    completion_rate: 94, // %
    avg_completion_time: 4.3, // minutos
    benchmark_difference: +0.8, // vs 3.4 sector
    confidence_level: "high"
  },
  
  category_scores: {
    "Liderazgo": 4.5,
    "Ambiente": 4.2, 
    "Desarrollo": 3.8,
    "Bienestar": 4.0
  },
  
  segmentation: {
    "IT": { score: 4.3, responses: 42 },
    "Ventas": { score: 3.9, responses: 38 },
    "RRHH": { score: 4.6, responses: 18 },
    "Operaciones": { score: 4.1, responses: 35 },
    "Marketing": { score: 4.4, responses: 23 }
  },
  
  trends: {
    vs_previous: +0.3,
    vs_sector: +0.8,
    improvement_areas: ["Desarrollo", "Comunicación interna"],
    strengths: ["Liderazgo", "Ambiente colaborativo"]
  }
};

// Mock communication templates data
const communicationTemplates = [
  {
    type: "fortaleza",
    title: "Su equipo destaca en Liderazgo",
    text: "Su equipo muestra fortaleza destacada en Liderazgo con 4.5/5.0 puntos, superando el benchmark sectorial significativamente.",
    category: "liderazgo",
    priority: 10,
    actionable: true
  },
  {
    type: "benchmark_superior", 
    title: "Supera promedio sectorial",
    text: "TechCorp Chile supera el benchmark sectorial en +0.8 puntos (4.2 vs 3.4), posicionándose en el top 25% de empresas tecnológicas.",
    category: "general",
    priority: 9,
    actionable: true
  },
  {
    type: "oportunidad",
    title: "Oportunidad en Desarrollo",
    text: "Desarrollo profesional presenta oportunidad inmediata (3.8/5.0). Invertir aquí puede incrementar significativamente el engagement.",
    category: "desarrollo", 
    priority: 8,
    actionable: true
  },
  {
    type: "participacion_alta",
    title: "Excelente participación",
    text: "Participación del 87% indica alto engagement del equipo y validez estadística robusta de los resultados.",
    category: "general",
    priority: 7,
    actionable: false
  }
];

// Colors for charts
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981', 
  warning: '#f59e0b',
  danger: '#ef4444',
  categories: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
};

export default function AnalyticsDashboardMock() {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedTemplate, setCopiedTemplate] = useState<number | null>(null)

  // Preparar datos para visualizaciones
  const categoryData = Object.entries(campaignData.category_scores)
    .map(([name, score]) => ({ name, score, fill: COLORS.categories[Object.keys(campaignData.category_scores).indexOf(name)] }))
    .sort((a, b) => b.score - a.score);

  const participationData = [
    { name: 'Respondieron', value: campaignData.metrics.total_responses, fill: COLORS.success },
    { name: 'No respondieron', value: campaignData.metrics.total_invited - campaignData.metrics.total_responses, fill: '#e5e7eb' }
  ];

  const segmentationData = Object.entries(campaignData.segmentation)
    .map(([dept, data]) => ({ 
      department: dept, 
      score: data.score, 
      responses: data.responses,
      fill: data.score >= 4.0 ? COLORS.success : data.score >= 3.5 ? COLORS.warning : COLORS.danger
    }));

  const handleCopyTemplate = (index: number) => {
    const template = communicationTemplates[index];
    navigator.clipboard.writeText(template.text);
    setCopiedTemplate(index);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-6">
      {/* Header Información Campaña */}
      <div className="mb-8">
        <Card className="professional-card border-gray-700 bg-gradient-to-r from-[#1a2332] to-[#232938]">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completada
                  </Badge>
                  <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                    {campaignData.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-white mb-1">
                  {campaignData.name}
                </CardTitle>
                <p className="text-gray-400 text-sm mb-3">{campaignData.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {campaignData.company}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {campaignData.startDate} a {campaignData.endDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Completado en {campaignData.metrics.avg_completion_time} min promedio
                  </div>
                </div>
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
          </CardHeader>
        </Card>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Participación
            </CardTitle>
            <Users className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{campaignData.metrics.participation}%</div>
            <p className="text-xs text-white/60">
              {campaignData.metrics.total_responses} de {campaignData.metrics.total_invited} invitados
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                Excelente
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Score General
            </CardTitle>
            <Star className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{campaignData.metrics.overall_score}/5.0</div>
            <p className="text-xs text-white/60">
              Promedio todas las respuestas
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                Sobre expectativa
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              vs Benchmark
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">+{campaignData.metrics.benchmark_difference}</div>
            <p className="text-xs text-white/60">
              vs sector tecnología (3.4)
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                Top 25%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Confiabilidad
            </CardTitle>
            <Award className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{campaignData.metrics.completion_rate}%</div>
            <p className="text-xs text-white/60">
              Tasa de completación
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                Alta confianza
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizaciones Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gauge Chart Score General */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Score General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{score: campaignData.metrics.overall_score * 20}]}>
                    <RadialBar dataKey="score" cornerRadius={10} fill={campaignData.metrics.overall_score >= 4.0 ? COLORS.success : campaignData.metrics.overall_score >= 3.5 ? COLORS.warning : COLORS.danger} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-white">{campaignData.metrics.overall_score}</div>
                  <div className="text-sm text-gray-400">de 5.0</div>
                </div>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-400">
                {campaignData.metrics.overall_score >= 4.0 ? "Excelente desempeño organizacional" : 
                 campaignData.metrics.overall_score >= 3.5 ? "Buen desempeño con áreas de mejora" : 
                 "Requiere atención inmediata"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart Categorías */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resultados por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsBarChart data={categoryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" domain={[0, 5]} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`${value}/5.0`, 'Score']}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Participación y Segmentación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Donut Participación */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Participación por Respuesta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={participationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {participationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="text-center mt-4">
              <div className="text-2xl font-bold text-white">{campaignData.metrics.participation}%</div>
              <p className="text-sm text-gray-400">Tasa de participación</p>
            </div>
          </CardContent>
        </Card>

        {/* Heatmap Segmentación */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5" />
              Análisis por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsBarChart data={segmentationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="department" stroke="#9ca3af" />
                <YAxis domain={[0, 5]} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value, name, props) => [
                    `${value}/5.0 (${props.payload.responses} respuestas)`, 
                    'Score'
                  ]}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Kit Comunicación */}
      <Card className="professional-card mb-8">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Kit de Comunicación - Insights Listos para Usar
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Templates generados automáticamente basados en sus resultados específicos
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communicationTemplates.map((template, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-600">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className={`${
                        template.type === 'fortaleza' ? 'bg-green-500/20 text-green-400' :
                        template.type === 'oportunidad' ? 'bg-yellow-500/20 text-yellow-400' :
                        template.type === 'benchmark_superior' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {template.actionable && (
                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                          Accionable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-sm font-medium text-white">
                    {template.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-300 mb-3 line-height-relaxed">
                    {template.text}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCopyTemplate(index)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copiedTemplate === index ? 'Copiado!' : 'Copiar'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                      <Eye className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Alert className="mt-6 border-blue-500/50 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              <strong>Próximamente:</strong> Más templates contextuales serán generados automáticamente conforme tengamos más datos históricos de su empresa.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Export y Acciones */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar y Compartir Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Datos CSV
            </Button>
            <Button className="w-full" variant="outline">
              <Share className="h-4 w-4 mr-2" />
              Compartir Link
            </Button>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-red-400" />
              <p className="font-medium text-white">Reporte PDF Ejecutivo</p>
              <p>8 páginas con insights completos</p>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-green-400" />
              <p className="font-medium text-white">Excel con Tablas Dinámicas</p>
              <p>Análisis preparado para profundizar</p>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <Settings className="h-6 w-6 mx-auto mb-2 text-blue-400" />
              <p className="font-medium text-white">API para Integración</p>
              <p>Conecta con tus sistemas HRIS</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}