// 🎯 PROVEEDOR ESPECIALISTA - SOLO METADATOS DE CAMPAÑA
// Archivo: src/hooks/useCampaignDetails.ts

import useSWR from 'swr';
import { useMemo } from 'react';

// 🚀 FETCHER SIMPLE
const fetcher = (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null;
  
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  });
};

// 🎭 HOOK ESPECIALISTA - UNA SOLA RESPONSABILIDAD
export function useCampaignDetails(campaignId: string) {
  const { data, error, isLoading } = useSWR(
    campaignId ? `/api/campaigns/${campaignId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Cache 30s
    }
  );

  // 🔍 DEBUG LOG
  if (data?.campaign) {
    console.log('✅ [useCampaignDetails] Metadatos obtenidos:', {
      campaignId,
      name: data.campaign.name,
      endDate: data.campaign.endDate,
      startDate: data.campaign.startDate,
      status: data.campaign.status
    });
  }

  // ✅ ESTABILIZAR RETURN PARA EVITAR BUCLE INFINITO
  const stableReturn = useMemo(() => ({
    campaignDetails: data?.campaign,
    isLoading,
    error
  }), [data?.campaign, isLoading, error]);

  return stableReturn;
}