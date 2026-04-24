'use client';

// src/app/dashboard/compliance/components/DepartmentParticipationRanking.tsx
// Lista de participación por departamento para el Estado 1 (campaña en curso).
// Fetch ligero al endpoint existente /api/campaigns/[id]/participants.
//
// Específico de compliance — pequeño, presentacional, no compartido con Torre
// de Control (que tiene su propia visualización en tiempo real).

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface DepartmentSlice {
  name: string;
  total: number;
  responded: number;
  rate: number;
}

interface DepartmentParticipationRankingProps {
  campaignId: string;
}

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function DepartmentParticipationRanking({
  campaignId,
}: DepartmentParticipationRankingProps) {
  const [rows, setRows] = useState<DepartmentSlice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/campaigns/${campaignId}/participants?include_details=false`,
          { headers: getAuthHeaders() }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          summary: { byDepartment: Record<string, { total: number; responded: number }> };
        };
        const byDept = json.summary?.byDepartment ?? {};
        const sliced: DepartmentSlice[] = Object.entries(byDept).map(
          ([name, { total, responded }]) => ({
            name,
            total,
            responded,
            rate: total > 0 ? Math.round((responded / total) * 100) : 0,
          })
        );
        sliced.sort((a, b) => b.rate - a.rate || b.total - a.total);
        if (!cancelled) setRows(sliced);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error cargando participación');
          setRows([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (isLoading) {
    return (
      <div className="relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] p-6 animate-pulse">
        <div className="h-4 w-48 bg-slate-800 rounded" />
        <div className="space-y-3 mt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 bg-slate-800/50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] p-6">
        <p className="text-xs text-slate-500 font-light">
          No pudimos cargar el ranking por ahora.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
        Participación por departamento
      </p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 text-sm">
            <span className="w-32 md:w-48 truncate text-slate-300 font-light">
              {r.name}
            </span>
            <div className="flex-1 h-2 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all rounded-full',
                  r.rate >= 70
                    ? 'bg-cyan-400'
                    : r.rate >= 40
                      ? 'bg-cyan-600'
                      : 'bg-slate-600'
                )}
                style={{ width: `${Math.max(3, r.rate)}%` }}
              />
            </div>
            <span className="w-14 text-right tabular-nums text-slate-400 text-xs font-mono">
              {r.rate}%
            </span>
            <span className="w-16 text-right text-slate-600 text-[11px] font-mono">
              {r.responded}/{r.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
