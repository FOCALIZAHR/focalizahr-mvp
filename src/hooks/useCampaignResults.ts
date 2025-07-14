// src/hooks/useCampaignResults.ts
// HOOK DEDICADO PARA LA LÓGICA DE LA PÁGINA DE RESULTADOS

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Definimos la interfaz para la data que devolverá el hook
export interface ResultsData {
  campaign: any;
  stats: any;
  analytics: any;
}

// Función segura para obtener el token de autenticación
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('focalizahr_token') || '';
  }
  return '';
};

export function useCampaignResults(campaignId: string) {
  const [data, setData] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!campaignId) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Ejecutamos ambas llamadas a las APIs que necesita la página
      const [statsRes, analyticsRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/campaigns/${campaignId}/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!statsRes.ok) {
        if (statsRes.status === 401) router.push('/login');
        const errorData = await statsRes.json();
        throw new Error(errorData.error || 'No se pudieron cargar las estadísticas de la campaña.');
      }

      const statsData = await statsRes.json();
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

      setData({
        campaign: statsData.campaign,
        stats: statsData.metrics,
        analytics: analyticsData?.metrics || null
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // El hook devuelve los datos, el estado de carga, el error y una función para refrescar
  return { data, isLoading, error, refreshData: fetchData };
}