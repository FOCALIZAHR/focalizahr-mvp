'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import ParticipantUploader from '@/components/admin/ParticipantUploader';
import { isAuthenticated } from '@/lib/auth';

interface CampaignParticipantsPageProps {
  params: {
    id: string;
  };
}

export default function CampaignParticipantsPage({ params }: CampaignParticipantsPageProps) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('focalizahr_token');
        
        const response = await fetch(`/api/campaigns/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar la campaña');
        }

        const data = await response.json();
        setCampaign(data.campaign);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [params.id, router]);

  const handleUploadComplete = (result: any) => {
    console.log('Upload exitoso:', result);
    router.push('/dashboard');
  };

  const handleError = (error: string) => {
    console.error('Error en carga:', error);
    setError(error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1e293b] to-[#0f172a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
      
      {/* Header Mínimo Superior */}
      <div className="px-6 py-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-16">
        
        {/* HERO HEADER - Estilo Encuestas */}
        <div className="text-center py-12 mb-16">
          {/* Ícono Grande */}
          <div className="flex justify-center mb-6">
            <Users className="h-12 w-12 text-cyan-400" />
          </div>

          {/* Título GIGANTE */}
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4 leading-tight">
            Gestionar Participantes
          </h1>

          {/* Campaña - Subtítulo */}
          {campaign && (
            <p className="text-base text-gray-400">
              {campaign.name}
            </p>
          )}

          {/* Descripción sutil */}
          <p className="text-sm text-gray-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Sube tu archivo con la información de los participantes.
            Los datos serán{' '}
            <span className="text-cyan-400">validados automáticamente</span>{' '}
            antes de guardarlos.
          </p>
        </div>

        {/* Componente de Carga */}
        <ParticipantUploader
          campaignId={params.id}
          campaignName={campaign?.name || 'Campaña'}
          onUploadComplete={handleUploadComplete}
          onError={handleError}
        />

      </div>
    </div>
  );
}