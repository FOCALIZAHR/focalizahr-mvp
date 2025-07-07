'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestAnalytics() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [campaignId, setCampaignId] = useState<string>('');

  const getToken = () => {
    return localStorage.getItem('focalizahr_token') || 
           localStorage.getItem('token') || 
           sessionStorage.getItem('focalizahr_token') ||
           sessionStorage.getItem('token');
  };

  // TEST 1: Campaña con respuestas
  const testWithResponses = async () => {
    setLoading(true);
    try {
      const authToken = getToken();
      const response = await fetch(`/api/campaigns/${campaignId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      setResult({ test: 'Con respuestas', data });
    } catch (error) {
      setResult({ test: 'Con respuestas', error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // TEST 2: Campaña inexistente
  const testNotFound = async () => {
    setLoading(true);
    try {
      const authToken = getToken();
      const response = await fetch('/api/campaigns/fake-id-123/analytics', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      setResult({ test: 'Campaña inexistente', data });
    } catch (error) {
      setResult({ test: 'Campaña inexistente', error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // TEST 3: Sin autenticación
  const testNoAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/analytics`);
      const data = await response.json();
      setResult({ test: 'Sin autenticación', data });
    } catch (error) {
      setResult({ test: 'Sin autenticación', error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // TEST 4: Ver estructura campaña
  const testCampaignStructure = async () => {
    setLoading(true);
    try {
      const authToken = getToken();
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      setResult({ test: 'Estructura campaña', data });
    } catch (error) {
      setResult({ test: 'Estructura campaña', error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-2">Test API Analytics Completo</h2>
        <input
          type="text"
          placeholder="ID de campaña activa"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <p className="text-sm text-gray-600">
          Usa el ID de tu campaña activa que tiene respuestas
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={testWithResponses} disabled={loading || !campaignId}>
          Test 1: Con Respuestas
        </Button>
        
        <Button onClick={testNotFound} disabled={loading}>
          Test 2: Campaña Inexistente
        </Button>
        
        <Button onClick={testNoAuth} disabled={loading || !campaignId}>
          Test 3: Sin Auth
        </Button>
        
        <Button onClick={testCampaignStructure} disabled={loading || !campaignId}>
          Test 4: Ver Estructura
        </Button>
      </div>
      
      {result && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Resultado - {result.test}:</h3>
          <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
  
}