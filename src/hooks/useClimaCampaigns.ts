// src/hooks/useClimaCampaigns.ts
// Lista de campañas de clima (Pulso Express / Experiencia Full) del account.
// Fetch simple al mount. Clon de useComplianceCampaigns.

import { useCallback, useEffect, useState } from 'react';
import type {
  ClimaCampaignSummary,
  ClimaCampaignsResponse,
} from '@/types/clima';

export interface UseClimaCampaignsReturn {
  campaigns: ClimaCampaignSummary[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useClimaCampaigns(): UseClimaCampaignsReturn {
  const [campaigns, setCampaigns] = useState<ClimaCampaignSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clima/campaigns', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errJson?.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as ClimaCampaignsResponse;
      setCampaigns(json.campaigns ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando campañas');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { campaigns, isLoading, error, reload: load };
}
