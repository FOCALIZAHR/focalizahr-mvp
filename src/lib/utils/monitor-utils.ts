// ====================================================================
// FOCALIZAHR MONITOR UTILS - MOTOR DE CÁLCULOS REALES
// src/lib/utils/monitor-utils.ts  
// Chat 2: Foundation Schema + Services - REPARACIÓN QUIRÚRGICA
// ====================================================================

import type { Participant, DepartmentMonitorData, DailyResponse, ActivityItem } from '@/types';

// ✅ NUEVA FUNCIÓN CERTIFICADA para calcular la participación real por departamento
export function calculateDepartmentParticipation(participants: Participant[]): Record<string, DepartmentMonitorData> {
  const deptStats: Record<string, { invited: number; responded: number }> = {};

  participants.forEach(p => {
    const dept = p.department || 'Sin Departamento Asignado';
    if (!deptStats[dept]) {
      deptStats[dept] = { invited: 0, responded: 0 };
    }
    deptStats[dept].invited++;
    if (p.hasResponded) {
      deptStats[dept].responded++;
    }
  });

  // Convertir a formato esperado por UI
  const result: Record<string, DepartmentMonitorData> = {};
  Object.entries(deptStats).forEach(([dept, data]) => {
    result[dept] = {
      invited: data.invited,
      responded: data.responded,
      rate: data.invited > 0 ? Math.round((data.responded / data.invited) * 100) : 0
    };
  });

  return result;
}

// ✅ NUEVA FUNCIÓN CERTIFICADA para obtener la actividad real y reciente
export function calculateRecentActivity(participants: Participant[]): ActivityItem[] {
  return participants
    .filter(p => p.hasResponded && p.responseDate)
    .sort((a, b) => new Date(b.responseDate!).getTime() - new Date(a.responseDate!).getTime())
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      dept: p.department || 'Sin Depto.',
      participant: `Participante (${p.department || 'N/A'})`,
      timestamp: new Date(p.responseDate!).toLocaleTimeString('es-CL'),
      status: 'completed',
      action: 'Completó encuesta',
    }));
}

// ✅ NUEVA FUNCIÓN CERTIFICADA para obtener la fecha de la última respuesta real
export function getLastActivityDate(participants: Participant[]): Date | null {
  const responseDates = participants
    .map(p => p.responseDate ? new Date(p.responseDate).getTime() : 0)
    .filter(t => t > 0);

  if (responseDates.length === 0) return null;
  
  return new Date(Math.max(...responseDates));
}

// ✅ FUNCIONES PURAS EXISTENTES PRESERVADAS
export function calculateDaysRemaining(endDate: string | Date): number {
  const end = endDate ? new Date(endDate) : new Date();
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function formatLocalDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-CL');
}

export function formatLocalDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('es-CL');
}

export function getParticipationColor(rate: number): string {
  if (rate >= 70) return 'from-green-500 to-emerald-500';
  if (rate >= 50) return 'from-yellow-500 to-orange-500';
  return 'from-red-500 to-pink-500';
}

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

// ✅ FUNCIÓN LEGACY DEPRECADA - MANTENER PARA BACKWARD COMPATIBILITY
/**
 * @deprecated - Usar calculateDepartmentParticipation() con datos reales
 */
export function transformScoresToByDepartment(analytics: any): Record<string, DepartmentMonitorData> {
  console.warn('⚠️ transformScoresToByDepartment() is deprecated. Use calculateDepartmentParticipation() with real participants data.');
  
  const byDepartment: Record<string, DepartmentMonitorData> = {};
  
  if (!analytics?.departmentScoresDisplay || !analytics.segmentationData) {
    return byDepartment;
  }

  for (const segment of analytics.segmentationData) {
    const deptName = segment.segment;
    if (analytics.departmentScoresDisplay[deptName] !== undefined) {
      const invited = segment.count;
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