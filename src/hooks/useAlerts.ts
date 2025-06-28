'use client';

import { useState, useEffect } from 'react';
import type { Alert, Campaign } from '@/types';

export default function useAlerts(campaigns: Campaign[] | undefined) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const generateAlerts = () => {
      const newAlerts: Alert[] = [];
  if (!campaigns || campaigns.length === 0) {
        setAlerts([]);
        return;
      }
      // Alertas por campañas que vencen pronto
      campaigns.forEach(campaign => {
        if (campaign.status === 'active' && campaign.daysRemaining !== undefined && campaign.daysRemaining <= 3 && campaign.daysRemaining > 0) {
          newAlerts.push({
            id: `expiring-${campaign.id}`,
            type: 'warning',
            title: 'Campaña próxima a vencer',
            message: `La campaña "${campaign.name}" vence en ${campaign.daysRemaining} día${campaign.daysRemaining === 1 ? '' : 's'}`,
            timestamp: new Date(),
            campaignId: campaign.id
          });
        }

        // Alertas por campañas vencidas
        if (campaign.isOverdue) {
          newAlerts.push({
            id: `overdue-${campaign.id}`,
            type: 'warning',
            title: 'Campaña vencida',
            message: `La campaña "${campaign.name}" ha superado su fecha límite`,
            timestamp: new Date(),
            campaignId: campaign.id
          });
        }

        // Alertas por baja participación
        if (campaign.participationRate < 30 && campaign.status === 'active') {
          newAlerts.push({
            id: `low-participation-${campaign.id}`,
            type: 'warning',
            title: 'Baja participación',
            message: `La campaña "${campaign.name}" tiene solo ${campaign.participationRate.toFixed(1)}% de participación`,
            timestamp: new Date(),
            campaignId: campaign.id
          });
        }

        // Alertas por alta participación
        if (campaign.participationRate >= 75 && campaign.status === 'active') {
          newAlerts.push({
            id: `high-participation-${campaign.id}`,
            type: 'success',
            title: 'Excelente participación',
            message: `La campaña "${campaign.name}" alcanzó ${campaign.participationRate.toFixed(1)}% de participación`,
            timestamp: new Date(),
            campaignId: campaign.id
          });
        }
      });

      // Alerta general del sistema
      if (campaigns.length > 0) {
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        if (activeCampaigns === 0) {
          newAlerts.push({
            id: 'no-active-campaigns',
            type: 'info',
            title: 'Sin campañas activas',
            message: 'No tienes campañas activas en este momento',
            timestamp: new Date()
          });
        }
      }

      setAlerts(newAlerts);
    };

    generateAlerts();
  }, [campaigns]);

  return { alerts };
}