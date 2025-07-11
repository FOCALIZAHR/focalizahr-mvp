// FOCALIZAHR - useEmailAutomation React Hook
// Archivo: src/hooks/useEmailAutomation.ts
// SEPARADO: Hook React con useState del archivo original

'use client';

import { useState, useCallback } from 'react';

// Interfaces para el hook
interface EmailMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

interface EmailAutomationHook {
  isLoading: boolean;
  metrics: EmailMetrics | null;
  activateAutomation: (campaignId: string) => Promise<void>;
  sendTestEmail: (campaignType: string) => Promise<void>;
  getMetrics: (campaignId: string) => Promise<void>;
  resetMetrics: () => void;
}

export function useEmailAutomation(): EmailAutomationHook {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);

  const activateAutomation = useCallback(async (campaignId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/email-automation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
        console.log('✅ Email automation activated:', data.message);
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('❌ Email automation error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendTestEmail = useCallback(async (campaignType: string) => {
    setIsLoading(true);
    try {
      // Simular envío test por ahora
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log(`📧 Email de prueba enviado con template "${campaignType}"`);
      
    } catch (error) {
      console.error('❌ Error al enviar email de prueba:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMetrics = useCallback(async (campaignId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/email-metrics`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('❌ Error al cargar métricas de email:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics(null);
  }, []);

  return {
    isLoading,
    metrics,
    activateAutomation,
    sendTestEmail,
    getMetrics,
    resetMetrics
  };
}