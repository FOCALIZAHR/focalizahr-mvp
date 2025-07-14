// src/components/dashboard/ResultsPageHeader.tsx
// PASO 3.1: Header de la Página - Reutiliza DashboardNavigation

import React from 'react';
import { ArrowLeft, Calendar, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

interface ResultsPageHeaderProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    campaignType: {
      name: string;
      slug: string;
    };
    startDate: string;
    endDate: string;
    totalInvited: number;
    totalResponded: number;
  };
  stats: {
    participationRate: number;
    averageScore: number;
    totalResponded: number;
    totalInvited: number;
  };
  onBack?: () => void;
}

export default function ResultsPageHeader({ campaign, stats, onBack }: ResultsPageHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getParticipationColor = (rate: number) => {
    if (rate >= 70) return 'text-green-400';
    if (rate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      {/* Integración con DashboardNavigation existente */}
      <DashboardNavigation currentCampaignId={campaign.id} />
      
      {/* Header específico de resultados */}
      <div className="relative overflow-hidden">
        {/* Background gradient sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30" />
        
        <div className="relative px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Navigation breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="hover:bg-gray-100 p-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al Dashboard
              </Button>
              <span>/</span>
              <span>Campañas</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Resultados</span>
            </div>

            {/* Campaign header info */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {campaign.name}
                  </h1>
                  <Badge className={`${getStatusColor(campaign.status)} border`}>
                    {campaign.status}
                  </Badge>
                </div>
                
                <p className="text-lg text-gray-600 mb-4">
                  {campaign.campaignType.name}
                </p>
                
                {/* Key metrics inline */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {stats?.totalResponded || 0} / {stats?.totalInvited || 0} participantes
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <span className={`font-semibold ${getParticipationColor(stats?.participationRate || 0)}`}>
                      {stats?.participationRate?.toFixed(1) || '0'}% participación
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="flex items-center gap-3">
                {stats?.participationRate && stats.participationRate < 50 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700 font-medium">
                      Participación baja
                    </span>
                  </div>
                )}
                
                <Button variant="outline" size="sm">
                  Exportar Datos
                </Button>
                
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Generar Reporte
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}