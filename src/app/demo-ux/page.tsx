'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Users, 
  Play, 
  Square, 
  TestTube,
  Clock,
  AlertTriangle
} from 'lucide-react';

// ✅ IMPORTS CORRECTOS CON RUTAS ABSOLUTAS
import { useToast } from '@/components/ui/toast-system';
import { useConfirmationDialog, confirmationActions } from '@/components/ui/confirmation-dialog';
import CampaignStatusGuide from '@/components/ui/campaign-status-guide';

// Mock data para testing
const mockCampaigns = [
  {
    id: '1',
    name: 'Pulso Clima Q2 2025',
    status: 'draft' as const,
    campaignType: { name: 'Pulso Express', slug: 'pulso-express' },
    totalInvited: 0,
    totalResponded: 0,
    participationRate: 0,
    startDate: '2025-07-01',
    endDate: '2025-07-15',
    canActivate: false,
    canViewResults: false,
    daysRemaining: 15
  },
  {
    id: '2', 
    name: 'Experiencia Colaborador 2025',
    status: 'draft' as const,
    campaignType: { name: 'Experiencia Full', slug: 'experiencia-full' },
    totalInvited: 45,
    totalResponded: 0,
    participationRate: 0,
    startDate: '2025-07-01',
    endDate: '2025-07-15',
    canActivate: true,
    canViewResults: false,
    daysRemaining: 15
  },
  {
    id: '3',
    name: 'Evaluación Liderazgo IT',
    status: 'active' as const,
    campaignType: { name: 'Pulso Express', slug: 'pulso-express' },
    totalInvited: 32,
    totalResponded: 23,
    participationRate: 72,
    startDate: '2025-06-15',
    endDate: '2025-06-30',
    canActivate: false,
    canViewResults: false,
    daysRemaining: 5
  }
];

export default function DemoUXPage() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { success, error, warning, info } = useToast();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // Simular carga de participantes
  const simulateParticipantsLoaded = () => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === '1' 
        ? { ...campaign, totalInvited: 25, canActivate: true }
        : campaign
    ));
    success('Se cargaron 25 participantes en "Pulso Clima Q2 2025"', '¡Éxito!');
    addTestResult('✅ COMPONENTE 2: Notificación asíncrona funcionando');
  };

  // Simular activación con confirmación
  const simulateActivateCampaign = () => {
    const campaign = campaigns.find(c => c.id === '2');
    if (!campaign) return;

    const confirmAction = confirmationActions.activateCampaign(campaign.name, campaign.totalInvited);
    
    showConfirmation(confirmAction, async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCampaigns(prev => prev.map(c => 
        c.id === '2' 
          ? { ...c, status: 'active' as const, canActivate: false }
          : c
      ));
      
      success(`✅ Campaña "${campaign.name}" activada exitosamente!`);
      addTestResult('✅ COMPONENTE 3 y 4: Confirmación + Success Toast');
    });
  };

  // Test diferentes toasts
  const testDifferentToasts = () => {
    info('Esta es una notificación informativa', 'Info');
    setTimeout(() => warning('Advertencia: Baja participación detectada', 'Alerta'), 1000);
    setTimeout(() => error('Error de conexión simulado', 'Error'), 2000);
    addTestResult('✅ COMPONENTE 2: Tipos de notificaciones funcionando');
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const resetTest = () => {
    setCampaigns(mockCampaigns);
    setTestResults([]);
    success('Test reiniciado correctamente');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header de testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-500" />
            Testing UX Guiada - 4 Componentes Implementados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={simulateParticipantsLoaded} variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-sm font-medium">Test Participantes</div>
              </div>
            </Button>
            
            <Button onClick={simulateActivateCampaign} variant="default" className="h-auto p-4">
              <div className="text-center">
                <Play className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Test Activación</div>
              </div>
            </Button>
            
            <Button onClick={testDifferentToasts} variant="secondary" className="h-auto p-4">
              <div className="text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Test Notificaciones</div>
              </div>
            </Button>
            
            <Button onClick={resetTest} variant="outline" className="h-auto p-4">
              <div className="text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Reiniciar</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ Resultados del Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <Alert key={index} className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{result}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de campañas con UX */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Campañas con UX Guiada</h2>
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">{campaign.campaignType.name}</p>
                  </div>
                  <Badge variant={
                    campaign.status === 'active' ? 'default' :
                    campaign.status === 'draft' ? 'secondary' : 'outline'
                  }>
                    {campaign.status === 'active' ? 'Activa' :
                     campaign.status === 'draft' ? 'Borrador' : 'Completada'}
                  </Badge>
                </div>

                {/* Panel Estado Guía */}
                <CampaignStatusGuide 
                  campaign={campaign}
                  className="bg-muted/50"
                />

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-lg">{campaign.totalInvited}</div>
                    <div className="text-muted-foreground">Participantes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{campaign.participationRate}%</div>
                    <div className="text-muted-foreground">Participación</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{campaign.daysRemaining}</div>
                    <div className="text-muted-foreground">Días Restantes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de confirmación */}
      <ConfirmationDialog />
    </div>
  );
}