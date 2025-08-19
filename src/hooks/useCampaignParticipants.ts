// ====================================================================
// FOCALIZAHR CAMPAIGN PARTICIPANTS HOOK - IMPORT PATH UPDATED
// src/hooks/useCampaignParticipants.ts
// Chat 2: Foundation Schema + Services - ACTUALIZACIÓN IMPORT PATHS
// ====================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Participant, ParticipantsData } from '@/types'; // ✅ IMPORT CENTRALIZADO

export function useCampaignParticipants(campaignId: string, options?: { includeDetails?: boolean }) {
  const [data, setData] = useState<ParticipantsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!campaignId) {
      setError('Campaign ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('focalizahr_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('📋 Fetching participants for campaign:', campaignId);

      // ✅ AGREGAR PARÁMETRO include_details BASADO EN OPTIONS
      const includeDetails = options?.includeDetails ? 'true' : 'false';
      const response = await fetch(`/api/campaigns/${campaignId}/participants?include_details=${includeDetails}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        if (response.status === 404) {
          throw new Error('Campaign not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown API error');
      }

      console.log('✅ Participants data loaded:', {
        total: result.summary.total,
        responded: result.summary.responded,
        participationRate: result.summary.participationRate
      });

      // ✅ STRUCTURE RESPONSE AS ParticipantsData
      const participantsData: ParticipantsData = {
        participants: result.participants || [],
        summary: result.summary || {
          total: 0,
          responded: 0,
          pending: 0,
          participationRate: 0,
          byDepartment: {},
          byPosition: {},
          bySeniority: {},
          byLocation: {},
          reminders: { noReminders: 0, oneReminder: 0, multipleReminders: 0 }
        },
        analysis: result.analysis || {
          dataCompleteness: { department: 0, position: 0, seniority: 0, location: 0 },
          trends: { needsReminders: 0, highEngagement: false, readyForAnalysis: false }
        }
      };

      setData(participantsData);

    } catch (err) {
      console.error('❌ Error fetching participants:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, options?.includeDetails]);

  // ✅ AUTO-FETCH ON MOUNT
  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // ✅ REFRESH FUNCTION
  const refreshData = useCallback(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // ✅ ESTABILIZAR RETURN PARA EVITAR BUCLE INFINITO
  const stableReturn = useMemo(() => ({
    data,
    isLoading,
    error,
    refreshData
  }), [data, isLoading, error, refreshData]);

  return stableReturn;
}