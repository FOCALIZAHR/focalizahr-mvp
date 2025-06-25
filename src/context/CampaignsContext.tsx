'use client';
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { Campaign } from '@/types';

interface CampaignsContextType {
    campaigns: Campaign[];
    isLoading: boolean;
    error: string | null;
    fetchCampaigns: () => Promise<void>;
}

const CampaignsContext = createContext<CampaignsContextType | undefined>(undefined);

export const CampaignsProvider = ({ children }: { children: ReactNode }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCampaigns = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('focalizahr_token');
            const response = await fetch('/api/campaigns', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch campaigns');
            }
            const data = await response.json();
            setCampaigns(data.campaigns || []);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Carga inicial de las campañas cuando el proveedor se monta
        fetchCampaigns();
    }, [fetchCampaigns]);

    return (
        <CampaignsContext.Provider value={{ campaigns, isLoading, error, fetchCampaigns }}>
            {children}
        </CampaignsContext.Provider>
    );
};

export const useCampaignsContext = () => {
    const context = useContext(CampaignsContext);
    if (context === undefined) {
        throw new Error('useCampaignsContext must be used within a CampaignsProvider');
    }
    return context;
};