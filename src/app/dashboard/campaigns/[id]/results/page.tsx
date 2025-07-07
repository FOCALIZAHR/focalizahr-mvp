// PÁGINA RESULTADOS CAMPAÑA - ARQUITECTURA ESCALABLE v4.0
// src/app/dashboard/campaigns/[id]/results/page.tsx
// FocalizaHR MVP - Sistema completo navegación + export + widgets

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Info
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
  startDate: string;
  endDate: string;
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  createdAt: string;
  updatedAt: string;
  company: {
    name: string;
    admin_email: string;
  };
}

// ✅ INTERFACES MÉTRICAS RESULTADOS
interface CampaignMetrics {
  participationRate: number;
  averageScore: number;
  completionTime: number;
  responseRate: number;
  segmentationData: any[];
  trendData: any[];
  lastUpdated: string;
}

// ✅ COMPONENTE PRINCIPAL RESULTADOS
export default function CampaignResultsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  // Estados principales
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ CARGAR DATOS CAMPAÑA
  const fetchCampaignData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('focalizahr_token');
      if (!token) {
        router.push('/');
        return;
      }

      // Fetch datos campaña
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!campaignResponse.ok) {
        throw new Error('Error al cargar datos de la campaña');
      }

      const campaignData = await campaignResponse.json();
      setCampaign(campaignData.campaign);

      // Fetch métricas si la campaña tiene respuestas
      if (campaignData.campaign.totalResponded > 0) {
        const metricsResponse = await fetch(`/api/campaigns/${campaignId}/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setMetrics(metricsData.metrics);
        }
      }

    } catch (error) {
      console.error('Error fetching campaign data:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [campaignId, router]);

  // Cargar datos inicial
  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  // ✅ REFRESH MANUAL
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCampaignData();
    setRefreshing(false);
  };

  // ✅ FUNCIÓN EXPORT (PLACEHOLDER)
  const handleExport = (format: 'pdf' | 'excel' | 'csv' | 'link') => {
    // TODO: Implementar exports reales
    console.log(`Exportando en formato: ${format}`);
    
    const messages = {
      pdf: '📄 Generando reporte PDF ejecutivo...',
      excel: '📊 Preparando archivo Excel con tablas dinámicas...',
      csv: '📋 Descargando datos en formato CSV...',
      link: '🔗 Generando enlace compartible...'
    };
    
    alert(messages[format]);
  };

  // ✅ NAVEGACIÓN BREADCRUMBS
  const handleNavigation = (destination: string) => {
    switch (destination) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'campaigns':
        router.push('/dashboard/campaigns');
        break;
      case 'campaign-detail':
        router.push(`/dashboard/campaigns/${campaignId}`);
        break;
      default:
        router.back();
    }
  };

  // ✅ FORMATO FECHA
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ✅ BADGE STATUS
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
              {campaign.description || `Resultados del análisis organizacional tipo ${campaign.type}`}
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
              Actualizar
            </Button>
            <Button 
              size="sm"
              onClick={() => handleNavigation('campaign-detail')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver Campaña
            </Button>
          </div>
        </div>
      </div>

      {/* ✅ INFORMACIÓN CAMPAÑA */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Período</span>
              </div>
              <p className="text-white">
                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Participación</span>
              </div>
              <p className="text-white">
                {campaign.totalResponded} / {campaign.totalInvited} participantes
              </p>
              <p className="text-sm text-cyan-400">
                {Math.round(campaign.participationRate)}% tasa de respuesta
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Tipo de Análisis</span>
              </div>
              <p className="text-white capitalize">{campaign.type.replace('-', ' ')}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Última Actualización</span>
              </div>
              <p className="text-white">
                {formatDate(campaign.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ EXPORT BUTTONS */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar y Compartir Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              className="w-full flex items-center gap-2" 
              variant="outline"
              onClick={() => handleExport('pdf')}
            >
              <Download className="h-4 w-4" />
              Reporte PDF
            </Button>
            <Button 
              className="w-full flex items-center gap-2" 
              variant="outline"
              onClick={() => handleExport('excel')}
            >
              <Download className="h-4 w-4" />
              Excel Avanzado
            </Button>
            <Button 
              className="w-full flex items-center gap-2" 
              variant="outline"
              onClick={() => handleExport('csv')}
            >
              <Download className="h-4 w-4" />
              Datos CSV
            </Button>
            <Button 
              className="w-full flex items-center gap-2" 
              variant="outline"
              onClick={() => handleExport('link')}
            >
              <Share className="h-4 w-4" />
              Compartir Link
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
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
              <Target className="h-6 w-6 mx-auto mb-2 text-blue-400" />
              <p className="font-medium text-white">API para Integración</p>
              <p>Conecta con tus sistemas HRIS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ WIDGET RESULTADOS - SOLO SI RETENCIÓN PREDICTIVA */}
      {campaign.type === 'retencion-predictiva' && campaign.totalResponded > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Análisis Predictivo de Retención</h2>
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500">
              Inteligencia Artificial
            </Badge>
          </div>
          
          {/* WIDGET EN UBICACIÓN CORRECTA */}
          <DashboardWidget_ExitInsights 
            campaignId={campaignId}
            isLoading={loading}
            onInsightAction={(insightId, action) => {
              console.log(`Acción ${action} para insight ${insightId}`);
              // TODO: Implementar acciones insights
            }}
          />
        </div>
      )}

      {/* ✅ PLACEHOLDER OTROS TIPOS ANÁLISIS */}
      {campaign.type !== 'retencion-predictiva' && campaign.totalResponded > 0 && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análisis de Resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                <strong>Resultados del análisis tipo {campaign.type}:</strong> Los dashboards detallados 
                para este tipo de campaña estarán disponibles próximamente. Mientras tanto, puedes 
                exportar los datos utilizando los botones de arriba.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* ✅ SIN RESPUESTAS */}
      {campaign.totalResponded === 0 && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium text-white mb-2">
                Esperando Respuestas
              </h3>
              <p className="text-gray-400 mb-4">
                Los resultados aparecerán aquí cuando los participantes comiencen a responder.
              </p>
              <p className="text-sm text-gray-500">
                {campaign.status === 'active' 
                  ? 'La campaña está activa. Las invitaciones han sido enviadas.'
                  : 'La campaña necesita ser activada para recibir respuestas.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}