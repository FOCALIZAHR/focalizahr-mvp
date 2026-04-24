// src/hooks/useComplianceCampaigns.ts
// Lista de campañas Ambiente Sano del account. Fetch simple al mount.

import { useCallback, useEffect, useState } from 'react';
import type {
  ComplianceCampaignSummary,
  ComplianceCampaignsResponse,
} from '@/types/compliance';

export interface UseComplianceCampaignsReturn {
  campaigns: ComplianceCampaignSummary[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useComplianceCampaigns(): UseComplianceCampaignsReturn {
  const [campaigns, setCampaigns] = useState<ComplianceCampaignSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/compliance/campaigns', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errJson?.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as ComplianceCampaignsResponse;
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
