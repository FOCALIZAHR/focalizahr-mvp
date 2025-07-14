// PÁGINA RESULTADOS CAMPAÑA - ARQUITECTURA ESCALABLE v5.0 + KIT COMUNICACIÓN
// src/app/dashboard/campaigns/[id]/results/page.tsx
// FocalizaHR MVP - Sistema completo navegación + export + widgets + Kit Comunicación Maestro v3.0

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import KitComunicacionComponent from '@/components/dashboard/KitComunicacionComponent';

import { 
  ArrowLeft,
  BarChart3,
  FileText,
  Download,
  Share,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Eye,
  Clock,
  Target,
  Info,
  MessageSquare,
  Copy,
  Edit,
  Save,
  X,
  CheckCircle2,
  Award,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

// IMPORTAR WIDGET EN UBICACIÓN CORRECTA
import DashboardWidget_ExitInsights from '@/components/dashboard/DashboardWidget_ExitInsights';

// ✅ INTERFACES CAMPAÑA
interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  description?: string;
  createdAt: Date;
  endDate?: Date;
  company: {
    name: string;
    industry?: string;
  };
  participants: Array<{
    id: string;
    email: string;
    name?: string;
    department?: string;
    position?: string;
    responseDate?: Date;
  }>;
  campaignType: {
    name: string;
    displayName: string;
  };
}

// ✅ INTERFACES ANALYTICS
interface CampaignAnalytics {
  participationRate: number;
  averageScore: number;
  completionTime: number;
  responseRate: number;
  categoryScores: Record<string, number>;
  responsesByDay: Record<string, number>;
  segmentationData: Array<{
    segment: string;
    count: number;
    avgScore: number;
    percentage: number;
  }>;
  trendData: Array<{
    date: string;
    responses: number;
    cumulativeParticipation: number;
  }>;
  demographicBreakdown: Array<{
    segment: string;
    count: number;
    avgScore: number;
    percentage: number;
  }>;
  lastUpdated: string;
}

// ✅ INTERFACES KIT COMUNICACIÓN
interface CommunicationTemplate {
  id: string;
  type: 'fortaleza' | 'oportunidad' | 'benchmark_superior' | 'benchmark_inferior' | 'participacion_alta' | 'participacion_media' | 'participacion_baja' | 'excelencia_general';
  category: string;
  text: string;
  priority: number;
  variables?: { [key: string]: any };
}

interface CampaignResults {
  overall_score: number;
  participation_rate: number;
  total_responses: number;
  total_invited: number;
  company_name: string;
  industry: string;
  industry_benchmark: number;
  category_scores: {
    liderazgo: number;
    ambiente: number;
    desarrollo: number;
    bienestar: number;
  };
  confidence_level: 'high' | 'medium' | 'low';
  created_date: string;
  campaign_type: string;
}

export default function CampaignResultsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  // ✅ ESTADOS PRINCIPALES
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [campaignResults, setCampaignResults] = useState<CampaignResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);

  // ✅ ESTADOS KIT COMUNICACIÓN
  const [selectedTemplates, setSelectedTemplates] = useState<CommunicationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // ✅ FUNCIÓN OBTENER TOKEN - FIX CRÍTICO
  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('focalizahr_token') || '';
    }
    return '';
  }, []);

  // ✅ FUNCIÓN CARGAR DATOS CAMPAÑA
  const fetchCampaignData = useCallback(async () => {
    if (!campaignId) return;

    try {
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Cargar datos básicos de campaña
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}/stats`, {
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json',
       },
      });
      
      if (!campaignResponse.ok) {
        if (campaignResponse.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Campaña no encontrada');
      }
      
      const campaignData = await campaignResponse.json();
      setCampaign(campaignData.campaign);
      setStats(campaignData.metrics);

      // Cargar analytics si la campaña está completada
      if (campaignData.campaign.status === 'completed') {
        try {
          const analyticsResponse = await fetch(`/api/campaigns/${campaignId}/analytics`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            setAnalytics(analyticsData.metrics);
            
            // ✅ CONSTRUIR DATOS PARA KIT COMUNICACIÓN
            const results: CampaignResults = {
              overall_score: analyticsData.metrics.averageScore || 0,
              participation_rate: analyticsData.metrics.participationRate || 0,
              total_responses: analyticsData.meta?.totalResponses || 0,
              total_invited: campaignData.campaign.participants?.length || 0,
              company_name: campaignData.campaign.company?.name || 'Empresa',
              industry: campaignData.campaign.company?.industry || 'General',
              industry_benchmark: 3.2, // Benchmark fijo para MVP
              category_scores: analyticsData.metrics.categoryScores || {
                liderazgo: 0,
                ambiente: 0,
                desarrollo: 0,
                bienestar: 0
              },
              confidence_level: analyticsData.metrics.participationRate >= 75 ? 'high' : 
                               analyticsData.metrics.participationRate >= 50 ? 'medium' : 'low',
              created_date: campaignData.campaign.createdAt,
              campaign_type: campaignData.campaign.campaignType?.displayName || campaignData.campaign.type
            };
            setCampaignResults(results);
          }
        } catch (analyticsError) {
          console.warn('Analytics not available:', analyticsError);
        }
      }

    } catch (err) {
      console.error('Error fetching campaign data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [campaignId, getAuthToken, router]);

  // ✅ FUNCIÓN SELECCIONAR TEMPLATES AUTOMÁTICAMENTE
  const selectCommunicationTemplates = useCallback((results: CampaignResults): CommunicationTemplate[] => {
    const templates: CommunicationTemplate[] = [];
    const benchmark = results.industry_benchmark || 3.2;
    
    // 1. FORTALEZAS (score >= 4.0)
    Object.entries(results.category_scores).forEach(([category, score]) => {
      if (score >= 4.0) {
        templates.push({
          id: `fortaleza-${category}`,
          type: 'fortaleza',
          category: category,
          text: `Su equipo destaca en ${category} (${score.toFixed(1)}/5.0)`,
          priority: 10,
          variables: { category, score }
        });
      }
    });
    
    // 2. OPORTUNIDADES (score < 3.0)
    Object.entries(results.category_scores).forEach(([category, score]) => {
      if (score < 3.0) {
        templates.push({
          id: `oportunidad-${category}`,
          type: 'oportunidad',
          category: category,
          text: `Oportunidad inmediata en ${category} (${score.toFixed(1)}/5.0)`,
          priority: 10,
          variables: { category, score }
        });
      }
    });
    
    // 3. PARTICIPACIÓN
    if (results.participation_rate >= 75) {
      templates.push({
        id: 'participacion-alta',
        type: 'participacion_alta',
        category: 'general',
        text: `Excelente participación (${Math.round(results.participation_rate)}%) indica engagement alto del equipo`,
        priority: 6,
        variables: { participation: results.participation_rate }
      });
    } else if (results.participation_rate >= 50) {
      templates.push({
        id: 'participacion-media',
        type: 'participacion_media',
        category: 'general',
        text: `Buena participación (${Math.round(results.participation_rate)}%) permite análisis confiable`,
        priority: 5,
        variables: { participation: results.participation_rate }
      });
    } else {
      templates.push({
        id: 'participacion-baja',
        type: 'participacion_baja',
        category: 'general',
        text: `Baja participación (${Math.round(results.participation_rate)}%) sugiere revisar comunicación del proceso`,
        priority: 8,
        variables: { participation: results.participation_rate }
      });
    }
    
    // 4. BENCHMARK COMPARISONS
    Object.entries(results.category_scores).forEach(([category, score]) => {
      const difference = score - benchmark;
      if (difference > 0.3) {
        templates.push({
          id: `benchmark-superior-${category}`,
          type: 'benchmark_superior',
          category: category,
          text: `Su empresa supera benchmark sectorial en ${category} por +${difference.toFixed(1)} puntos`,
          priority: 7,
          variables: { category, difference }
        });
      } else if (difference < -0.3) {
        templates.push({
          id: `benchmark-inferior-${category}`,
          type: 'benchmark_inferior',
          category: category,
          text: `Área de mejora vs benchmark sectorial: ${category} (-${Math.abs(difference).toFixed(1)} puntos)`,
          priority: 7,
          variables: { category, difference: Math.abs(difference) }
        });
      }
    });
    
    // 5. EXCELENCIA GENERAL
    if (results.overall_score >= 4.0) {
      templates.push({
        id: 'excelencia-general',
        type: 'excelencia_general',
        category: 'general',
        text: `Su organización alcanza nivel de excelencia (${results.overall_score.toFixed(1)}/5.0)`,
        priority: 9,
        variables: { overall_score: results.overall_score }
      });
    }

    // 6. TEMPLATES ADICIONALES FOCALIZAHR
    if (results.campaign_type.includes('Retención')) {
      templates.push({
        id: 'retencion-insight',
        type: 'fortaleza',
        category: 'retencion',
        text: `Análisis predictivo de retención completado con ${results.total_responses} respuestas de ${results.company_name}`,
        priority: 8,
        variables: { total_responses: results.total_responses, company_name: results.company_name }
      });
    }

    if (results.confidence_level === 'high') {
      templates.push({
        id: 'confianza-alta',
        type: 'participacion_alta',
        category: 'general',
        text: `Resultados de alta confiabilidad con ${results.total_responses} participantes (nivel de confianza: ${results.confidence_level})`,
        priority: 7,
        variables: { total_responses: results.total_responses, confidence_level: results.confidence_level }
      });
    }
    
    // Ordenar por prioridad y retornar top 5
    return templates
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
  }, []);

  // ✅ CARGAR TEMPLATES AL CAMBIAR RESULTADOS
  useEffect(() => {
    if (campaignResults) {
      setTemplatesLoading(true);
      try {
        const templates = selectCommunicationTemplates(campaignResults);
        setSelectedTemplates(templates);
      } catch (error) {
        console.error('Error selecting templates:', error);
      } finally {
        setTemplatesLoading(false);
      }
    }
  }, [campaignResults, selectCommunicationTemplates]);

  // ✅ FUNCIÓN TRACKING TEMPLATE USAGE
  const handleTemplateUsed = useCallback(async (templateId: string, finalText: string) => {
    try {
      const token = getAuthToken();
      
      // Enviar tracking al backend
      await fetch('/api/templates/usage', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          templateId, 
          finalText, 
          campaignId,
          companyName: campaignResults?.company_name,
          industry: campaignResults?.industry,
          usedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Error tracking template usage:', error);
    }
  }, [campaignId, campaignResults, getAuthToken]);

  // ✅ FUNCIONES KIT COMUNICACIÓN
  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'fortaleza':
        return <Award className="h-4 w-4 text-green-400" />;
      case 'oportunidad':
        return <Target className="h-4 w-4 text-orange-400" />;
      case 'benchmark_superior':
        return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case 'benchmark_inferior':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'participacion_alta':
      case 'participacion_media':
      case 'participacion_baja':
        return <Users className="h-4 w-4 text-purple-400" />;
      case 'excelencia_general':
        return <Award className="h-4 w-4 text-cyan-400" />;
      default:
        return <Lightbulb className="h-4 w-4 text-gray-400" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'fortaleza':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'oportunidad':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'benchmark_superior':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'benchmark_inferior':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'participacion_alta':
      case 'participacion_media':
      case 'participacion_baja':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'excelencia_general':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const handleCopyTemplate = async (template: CommunicationTemplate) => {
    const textToCopy = editingTemplate === template.id ? editedText : template.text;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedTemplate(template.id);
      setTimeout(() => setCopiedTemplate(null), 3000);
      
      // Tracking usage
      await handleTemplateUsed(template.id, textToCopy);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const startEditing = (template: CommunicationTemplate) => {
    setEditingTemplate(template.id);
    setEditedText(template.text);
  };

  const saveEdit = () => {
    setSelectedTemplates(prev => 
      prev.map(template => 
        template.id === editingTemplate 
          ? { ...template, text: editedText }
          : template
      )
    );
    setEditingTemplate(null);
    setEditedText('');
  };

  const cancelEdit = () => {
    setEditingTemplate(null);
    setEditedText('');
  };

  // ✅ CARGAR DATOS AL MONTAR
  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  // ✅ NAVEGACIÓN
  const handleNavigation = useCallback((destination: string) => {
    switch (destination) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'campaigns':
        router.push('/dashboard/campaigns');
        break;
      default:
        router.push('/dashboard');
    }
  }, [router]);

  // ✅ REFRESH
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCampaignData();
  }, [fetchCampaignData]);

  // ✅ BADGES DE ESTADO
  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-500/20 text-gray-300 border-gray-500',
      active: 'bg-blue-500/20 text-blue-300 border-blue-500',
      completed: 'bg-green-500/20 text-green-300 border-green-500',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500'
    };

    const labels = {
      draft: 'Borrador',
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };

    return (
      <Badge className={`${styles[status as keyof typeof styles]} border`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
          <span className="text-lg text-gray-300">Cargando resultados...</span>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error || !campaign) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertDescription className="text-red-200">
            <strong>Error:</strong> {error || 'Campaña no encontrada'}
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button onClick={() => router.push('/dashboard/campaigns')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Campañas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ✅ HEADER CON BREADCRUMBS */}
      <div className="space-y-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-400">
          <button 
            onClick={() => handleNavigation('dashboard')}
            className="hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <span>{'>'}</span>
          <button 
            onClick={() => handleNavigation('campaigns')}
            className="hover:text-white transition-colors"
          >
            Campañas
          </button>
          <span>{'>'}</span>
          <span className="text-white font-medium">{campaign.name}</span>
          <span>{'>'}</span>
          <span className="text-cyan-400">Resultados</span>
        </nav>

        {/* Header Principal */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigation('campaigns')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Campañas
              </Button>
              {getStatusBadge(campaign.status)}
            </div>
            <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
            <p className="text-gray-400">
              {campaign.description || `Resultados del análisis organizacional tipo ${campaign.campaignType?.displayName || campaign.type}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
            {analytics && (
              <>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  Compartir
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ✅ MÉTRICAS PRINCIPALES */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Participación</p>
                  <p className="text-2xl font-bold text-white">{analytics.participationRate}%</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Score Promedio</p>
                  <p className="text-2xl font-bold text-white">{analytics.averageScore.toFixed(1)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Respuestas</p>
                  <p className="text-2xl font-bold text-white">{campaignResults?.total_responses || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Confiabilidad</p>
                  <p className="text-2xl font-bold text-white">
                    {campaignResults?.confidence_level === 'high' ? 'Alta' : 
                     campaignResults?.confidence_level === 'medium' ? 'Media' : 'Baja'}
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ✅ SCORES POR CATEGORÍA */}
      {analytics?.categoryScores && Object.keys(analytics.categoryScores).length > 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              Scores por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(analytics.categoryScores).map(([category, score]) => (
                <div key={category} className="text-center p-4 bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">
                    {score.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">{category}</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        score >= 4.0 ? 'bg-green-500' : 
                        score >= 3.0 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ KIT COMUNICACIÓN MAESTRO v3.0 */}
      {campaignResults && campaign.status === 'completed' && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              Cómo comunicar estos resultados
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Frases personalizadas basadas en sus datos - Listas para usar en presentaciones, emails o reportes
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {templatesLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-gray-400">Generando templates personalizados...</div>
                </div>
              ) : selectedTemplates.length === 0 ? (
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-200">
                    No se pudieron generar templates automáticos con los datos disponibles.
                  </AlertDescription>
                </Alert>
              ) : (
                selectedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-slate-600 rounded-lg p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getTemplateIcon(template.type)}
                        <Badge className={`text-xs ${getBadgeColor(template.type)}`}>
                          {template.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Prioridad: {template.priority}
                        </span>
                      </div>
                    </div>

                    {editingTemplate === template.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="min-h-[80px] bg-slate-700 border-slate-600 text-white resize-none"
                          placeholder="Edita el mensaje..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={saveEdit}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-white text-sm leading-relaxed">
                          {template.text}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyTemplate(template)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            {copiedTemplate === template.id ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" />
                                ¡Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(template)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Personalizar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer informativo */}
            <Alert className="border-cyan-500/50 bg-cyan-500/10 mt-6">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-cyan-200">
                <strong>Kit Comunicación FocalizaHR:</strong> Templates generados automáticamente 
                basados en sus scores por categoría, participación y comparación con benchmark sectorial. 
                Personalice el mensaje y cópielo para usar en sus comunicaciones.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* ✅ INSIGHTS WIDGET - RETENCIÓN PREDICTIVA */}
      {campaign.campaignType?.name === 'retencion_predictiva' && campaign.status === 'completed' && (
        <DashboardWidget_ExitInsights
          campaignId={campaignId}
          insights={[]} // Se cargarán desde el widget
          onInsightAction={(insightId, action) => {
            console.log(`Insight action: ${action} for ${insightId}`);
            // Aquí puedes implementar acciones específicas
          }}
        />
      )}

      {/* ✅ SEGMENTACIÓN Y ANÁLISIS ADICIONAL */}
      {analytics?.segmentationData && analytics.segmentationData.length > 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              Análisis por Segmento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.segmentationData.map((segment) => (
                <div key={segment.segment} className="p-4 bg-slate-800 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">{segment.segment}</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Participantes:</span>
                      <span className="text-white">{segment.count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Score Promedio:</span>
                      <span className="text-white">{segment.avgScore}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">% del Total:</span>
                      <span className="text-white">{segment.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ INFORMACIÓN CAMPAÑA */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="h-5 w-5 text-cyan-400" />
            Información de la Campaña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm">Empresa:</span>
                <p className="text-white font-medium">{campaign.company?.name}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Tipo de Análisis:</span>
                <p className="text-white font-medium">{campaign.campaignType?.displayName || campaign.type}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Fecha de Creación:</span>
                <p className="text-white font-medium">
                  {new Date(campaign.createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm">Participantes Invitados:</span>
                <p className="text-white font-medium">{stats?.totalParticipants || 0}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Respuestas Recibidas:</span>
                <p className="text-white font-medium">{stats?.respondedParticipants || 0}</p>
              </div>
              {campaign.endDate && (
                <div>
                  <span className="text-gray-400 text-sm">Fecha de Finalización:</span>
                  <p className="text-white font-medium">
                    {new Date(campaign.endDate).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ ESTADO CAMPAÑA NO COMPLETADA */}
      {campaign.status !== 'completed' && (
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Clock className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200">
            <strong>Campaña en curso:</strong> Los resultados y analytics completos estarán disponibles 
            cuando la campaña esté completada. Mientras tanto, puede monitorear el progreso de participación.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}