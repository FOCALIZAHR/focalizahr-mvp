// ARCHIVO: /src/lib/utils/monitor-utils.ts
import type { CampaignResultsData } from '@/hooks/useCampaignResults';

// Define las interfaces que la UI espera
export interface DailyResponse { 
  day: string; 
  responses: number; 
  date: string; 
}

export interface DepartmentMonitorData { 
  invited: number; 
  responded: number; 
  rate: number; 
}

// Función PURA para transformar los datos de departamento a lo que la UI espera
export function transformScoresToByDepartment(analytics: CampaignResultsData['analytics']): Record<string, DepartmentMonitorData> {
    const byDepartment: Record<string, DepartmentMonitorData> = {};
    
    if (!analytics?.departmentScoresDisplay || !analytics.segmentationData) {
        return byDepartment;
    }

    for (const segment of analytics.segmentationData) {
        const deptName = segment.segment;
        if (analytics.departmentScoresDisplay[deptName] !== undefined) {
            const invited = segment.count;
            // La API de analytics no provee respondidos por depto, lo estimamos
            const responded = Math.round(invited * (analytics.participationRate / 100));
            byDepartment[deptName] = {
                invited: invited,
                responded: responded,
                rate: invited > 0 ? Math.round((responded / invited) * 100) : 0
            };
        }
    }
    
    return byDepartment;
}

// Función PURA para calcular días restantes
export function calculateDaysRemaining(endDate: string | Date): number {
    const end = endDate ? new Date(endDate) : new Date();
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// Función PURA para formatear fechas locales
export function formatLocalDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('es-CL');
}

// Función PURA para formatear fecha y hora locales
export function formatLocalDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('es-CL');
}

// Función PURA para obtener color de participación
export function getParticipationColor(rate: number): string {
    if (rate >= 70) return 'from-green-500 to-emerald-500';
    if (rate >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
}

// Función PURA para procesar datos de respuestas diarias
export function processDailyResponses(trendData: any[]): DailyResponse[] {
    if (!Array.isArray(trendData)) return [];
    
    return trendData.map(item => ({
        day: item.day || new Date(item.date).toLocaleDateString('es-CL', { weekday: 'short' }),
        responses: Number(item.responses) || 0,
        date: item.date ? new Date(item.date).toLocaleDateString('es-CL', { 
            month: '2-digit', 
            day: '2-digit' 
        }) : ''
    }));
}