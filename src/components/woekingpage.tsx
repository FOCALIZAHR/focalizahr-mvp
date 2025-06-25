'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BarChart3, 
  Search, 
  Plus,
  Eye,
  Play,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  AlertTriangle,
  Target,
  TrendingUp,
  Shield,
  Users,
  Activity,
  Settings,
  Calendar
} from 'lucide-react';
import CampaignStateManager from '@/components/dashboard/CampaignStateManager';
import type { Campaign } from '@/types';

interface CampaignsListProps {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function CampaignsList({
  campaigns,
  loading,
  error,
  lastUpdated,
  onRefresh
}: CampaignsListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const router = useRouter();

  // VERSIÓN ORIGINAL QUE FUNCIONABA PERFECTAMENTE
  const handleStateChange = async (campaignId: string, newStatus: string, action: string) => {
    try {
      console.log('🔄 Cambiando estado campaña:', { campaignId, newStatus, action });
      
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          toStatus: newStatus,
          action: action 
        })
      });

      if (response.ok) {
        console.log('✅ Estado actualizado exitosamente');
        await onRefresh(); // ESTO FUNCIONABA PERFECTAMENTE
        setSelectedCampaign(null); // ESTO FUNCIONABA PERFECTAMENTE
      } else {
        console.error('❌ Error al actualizar estado:', response.status);
        alert('Error al actualizar el estado de la campaña');
      }
    } catch (error) {
      console.error('❌ Error en handleStateChange:', error);
      alert('Error de conexión al actualizar estado');
    }
  };

  // Resto del código igual...
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string, riskLevel?: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' as const, icon: Clock },
      active: { label: 'Activa', variant: 'default' as const, icon: Activity },
      completed: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: AlertTriangle }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-2">
        <Badge variant={config.variant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
        {riskLevel && status === 'active' && (
          <Badge variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'secondary' : 'outline'}>
            <Shield className="h-3 w-3 mr-1" />
            Riesgo {riskLevel === 'high' ? 'Alto' : riskLevel === 'medium' ? 'Medio' : 'Bajo'}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <Card className="professional-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Gestión de Campañas</CardTitle>
              <CardDescription>
                Administra el estado y progreso de tus campañas
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button className="btn-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar campañas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as any)}
                className="form-input min-w-[120px]"
              >
                <option