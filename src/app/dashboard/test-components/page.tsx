'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ✅ IMPORTAR TODOS LOS COMPONENTES ESPECIALIZADOS
import CampaignStatusBadge from '@/components/dashboard/CampaignStatusBadge';
import CampaignActionButtons from '@/components/dashboard/CampaignActionButtons';
import CampaignStateValidator from '@/components/dashboard/CampaignStateValidator';
import CampaignStateTransition from '@/components/dashboard/CampaignStateTransition';

// ✅ DATOS DE PRUEBA
const testCampaigns = [
  {
    id: '1',
    name: 'Campaña Draft - Sin Participantes',
    status: 'draft' as const,
    campaignType: { name: 'Pulso Express', slug: 'pulso-express' },
    totalInvited: 0,
    totalResponded: 0,
    participationRate: 0,
    startDate: '2025-07-01',
    endDate: '2025-07-15',
    canActivate: false,
    canViewResults: false,
    riskLevel: undefined
  },
  {
    id: '2',
    name: 'Campaña Draft - Lista para Activar',
    status: 'draft' as const,
    campaignType: { name: 'Experiencia Full', slug: 'experiencia-full' },
    totalInvited: 25,
    totalResponded: 0,
    participationRate: 0,
    startDate: '2025-07-01',
    endDate: '2025-07-21',
    canActivate: true,
    canViewResults: false,
    riskLevel: undefined
  },
  {
    id: '3',
    name: 'Campaña Activa - Baja Participación',
    status: 'active' as const,
    campaignType: { name: 'Pulso Express', slug: 'pulso-express' },
    totalInvited: 50,
    totalResponded: 8,
    participationRate: 16,
    startDate: '2025-06-20',
    endDate: '2025-07-05',
    canActivate: true,
    canViewResults: false,
    riskLevel: 'high' as const,
    daysRemaining: 5
  },
  {
    id: '4',
    name: 'Campaña Activa - Buena Participación',
    status: 'active' as const,
    campaignType: { name: 'Experiencia Full', slug: 'experiencia-full' },
    totalInvited: 100,
    totalResponded: 78,
    participationRate: 78,
    startDate: '2025-06-15',
    endDate: '2025-07-10',
    canActivate: true,
    canViewResults: false,
    riskLevel: 'low' as const,
    daysRemaining: 12
  },
  {
    id: '5',
    name: 'Campaña Completada - Resultados Listos',
    status: 'completed' as const,
    campaignType: { name: 'Pulso Express', slug: 'pulso-express' },
    totalInvited: 75,
    totalResponded: 62,
    participationRate: 82.7,
    startDate: '2025-05-01',
    endDate: '2025-05-15',
    canActivate: false,
    canViewResults: true,
    riskLevel: 'low' as const
  },
  {
    id: '6',
    name: 'Campaña Cancelada',
    status: 'cancelled' as const,
    campaignType: { name: 'Experiencia Full', slug: 'experiencia-full' },
    totalInvited: 30,
    totalResponded: 12,
    participationRate: 40,
    startDate: '2025-06-01',
    endDate: '2025-06-20',
    canActivate: false,
    canViewResults: false,
    riskLevel: undefined
  }
];

const TestCampaignComponents: React.FC = () => {
  // ✅ FUNCIÓN MOCK PARA CAMBIO ESTADO
  const handleStateChange = async (campaignId: string, newStatus: string, action: string) => {
    console.log(`🧪 TEST: Cambio estado ${action} para campaña ${campaignId} → ${newStatus}`);
    // Simular delay API
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Cambio de estado simulado:\nCampaña: ${campaignId}\nAcción: ${action}\nNuevo Estado: ${newStatus}`);
  };

  return (
    <div className="main-layout">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold focalizahr-gradient-text mb-2">
            Test Componentes Especializados v3.0
          </h1>
          <p className="text-muted-foreground">
            Validación arquitectura escalable con separación de responsabilidades
          </p>
        </div>

        {/* ✅ TEST 1: STATUS BADGES */}
        <Card className="professional-card mb-8">
          <CardHeader>
            <CardTitle>1. CampaignStatusBadge - Variantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Variant Compact */}
            <div>
              <h4 className="font-medium mb-3">Variant: Compact</h4>
              <div className="flex flex-wrap gap-4">
                {testCampaigns.map(campaign => (
                  <CampaignStatusBadge 
                    key={`compact-${campaign.id}`}
                    status={campaign.status}
                    variant="compact"
                    riskLevel={campaign.riskLevel}
                  />
                ))}
              </div>
            </div>

            {/* Variant Default */}
            <div>
              <h4 className="font-medium mb-3">Variant: Default</h4>
              <div className="grid grid-cols-2 gap-4">
                {testCampaigns.slice(0, 4).map(campaign => (
                  <CampaignStatusBadge 
                    key={`default-${campaign.id}`}
                    status={campaign.status}
                    variant="default"
                    riskLevel={campaign.riskLevel}
                  />
                ))}
              </div>
            </div>

            {/* Variant Detailed */}
            <div>
              <h4 className="font-medium mb-3">Variant: Detailed</h4>
              <div className="grid grid-cols-3 gap-4">
                {testCampaigns.slice(0, 3).map(campaign => (
                  <CampaignStatusBadge 
                    key={`detailed-${campaign.id}`}
                    status={campaign.status}
                    variant="detailed"
                    riskLevel={campaign.riskLevel}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ TEST 2: ACTION BUTTONS */}
        <Card className="professional-card mb-8">
          <CardHeader>
            <CardTitle>2. CampaignActionButtons - Estados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {testCampaigns.map(campaign => (
              <div key={`actions-${campaign.id}`} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{campaign.name}</h4>
                    <p className="text-sm text-muted-foreground">Estado: {campaign.status}</p>
                  </div>
                  <CampaignStatusBadge 
                    status={campaign.status}
                    variant="compact"
                    riskLevel={campaign.riskLevel}
                  />
                </div>
                <CampaignActionButtons
                  campaign={campaign}
                  onAction={async (actionId, campaignId, campaignName) => {
                    await handleStateChange(campaignId, '', actionId);
                  }}
                  variant="default"
                  isLoading={false}
                  showLabels={true}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ✅ TEST 3: STATE VALIDATOR */}
        <Card className="professional-card mb-8">
          <CardHeader>
            <CardTitle>3. CampaignStateValidator - Validaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Draft Campaigns - Validation Test */}
            <div>
              <h4 className="font-medium mb-3">Validación Draft → Active</h4>
              <div className="grid grid-cols-2 gap-4">
                {testCampaigns.filter(c => c.status === 'draft').map(campaign => (
                  <div key={`validator-${campaign.id}`}>
                    <CampaignStateValidator
                      campaign={campaign}
                      targetState="active"
                      variant="default"
                      showSuccessState={true}
                      onValidate={(isValid, errors, warnings) => {
                        console.log(`Validación ${campaign.name}:`, { isValid, errors, warnings });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Compact Validator */}
            <div>
              <h4 className="font-medium mb-3">Variant: Compact</h4>
              <div className="flex flex-wrap gap-4">
                {testCampaigns.map(campaign => (
                  <div key={`validator-compact-${campaign.id}`} className="flex items-center gap-3 p-2 border rounded">
                    <span className="text-sm font-medium">{campaign.name}</span>
                    <CampaignStateValidator
                      campaign={campaign}
                      variant="compact"
                      showSuccessState={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ TEST 4: STATE TRANSITION - COMPONENTE ORQUESTADOR */}
        <Card className="professional-card mb-8">
          <CardHeader>
            <CardTitle>4. CampaignStateTransition - Orquestador Completo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Variant Compact */}
            <div>
              <h4 className="font-medium mb-3">Variant: Compact</h4>
              <div className="space-y-3">
                {testCampaigns.slice(0, 3).map(campaign => (
                  <CampaignStateTransition
                    key={`transition-compact-${campaign.id}`}
                    campaign={campaign}
                    onStateChange={handleStateChange}
                    variant="compact"
                    showValidation={true}
                    isLoading={false}
                  />
                ))}
              </div>
            </div>

            {/* Variant Default */}
            <div>
              <h4 className="font-medium mb-3">Variant: Default</h4>
              <div className="grid grid-cols-2 gap-4">
                {testCampaigns.slice(0, 4).map(campaign => (
                  <CampaignStateTransition
                    key={`transition-default-${campaign.id}`}
                    campaign={campaign}
                    onStateChange={handleStateChange}
                    variant="default"
                    showValidation={campaign.status === 'draft'}
                    isLoading={false}
                  />
                ))}
              </div>
            </div>

            {/* Variant Detailed */}
            <div>
              <h4 className="font-medium mb-3">Variant: Detailed</h4>
              <div className="space-y-6">
                {testCampaigns.slice(0, 2).map(campaign => (
                  <CampaignStateTransition
                    key={`transition-detailed-${campaign.id}`}
                    campaign={campaign}
                    onStateChange={handleStateChange}
                    variant="detailed"
                    showValidation={true}
                    isLoading={false}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ TESTING SUMMARY */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle>✅ Resumen Testing Arquitectura v3.0</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-600">✅ Componentes Implementados</h4>
                <ul className="space-y-2 text-sm">
                  <li>• CampaignStatusBadge (3 variantes)</li>
                  <li>• CampaignActionButtons (especializado)</li>
                  <li>• CampaignStateValidator (validaciones tiempo real)</li>
                  <li>• CampaignStateTransition (orquestador)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">🎯 Principios v3.0 Cumplidos</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Separación responsabilidades clara</li>
                  <li>• Componentes reutilizables escalables</li>
                  <li>• Testing aislado posible</li>
                  <li>• Performance optimizada React.memo</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestCampaignComponents;