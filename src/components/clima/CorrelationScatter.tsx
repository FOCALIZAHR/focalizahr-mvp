'use client';

// src/components/clima/CorrelationScatter.tsx
// Dispersión Engagement × Rotación por departamento (recharts) + totales de
// caso de negocio de compañía. Genérico cross-producto. Puntos coloreados por
// zona (anti-semáforo). Sin datos de rotación → estado explícito.

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { zoneColor, zoneFromFavorability } from './climaZonePalette';
import type { ClimaDepartmentInsight } from '@/types/clima';
import type { CompanyBusinessCaseTotal } from '@/lib/services/clima/PulseEngine';

interface CorrelationScatterProps {
  departments: ClimaDepartmentInsight[];
  businessCaseTotals: CompanyBusinessCaseTotal[];
}

const TYPE_LABEL: Record<CompanyBusinessCaseTotal['type'], string> = {
  clima_critico: 'Clima crítico',
  retencion_riesgo: 'Riesgo de retención',
  liderazgo_gap: 'Brecha de liderazgo',
};

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export default function CorrelationScatter({ departments, businessCaseTotals }: CorrelationScatterProps) {
  const points = useMemo(
    () =>
      departments
        .filter((d) => d.turnoverRateAtMeasurement !== null && d.engagementFavorability !== null)
        .map((d) => ({
          x: d.engagementFavorability as number,
          y: d.turnoverRateAtMeasurement as number,
          name: d.departmentName,
          color: zoneColor(zoneFromFavorability(d.engagementFavorability as number)),
        })),
    [departments]
  );

  return (
    <div className="space-y-5">
      {points.length >= 2 ? (
        <div className="rounded-2xl border border-slate-800/40 bg-slate-900/40 p-4">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.25)" />
              <XAxis
                type="number"
                dataKey="x"
                name="Engagement"
                unit="%"
                domain={[0, 100]}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                stroke="#475569"
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Rotación"
                unit="%"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                stroke="#475569"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  background: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#E2E8F0' }}
                formatter={(value: number, name: string) => [`${Math.round(value)}%`, name]}
              />
              <Scatter
                data={points}
                shape={(props: { cx?: number; cy?: number; payload?: { color: string } }) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={7}
                    fill={props.payload?.color ?? '#64748B'}
                    fillOpacity={0.9}
                    stroke="#0F172A"
                    strokeWidth={1.5}
                  />
                )}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-slate-500 font-light mt-2">
            Cada punto es un departamento · engagement (eje X) vs. rotación (eje Y)
          </p>
        </div>
      ) : (
        <p className="text-sm font-light text-slate-500 text-center py-8">
          Sin datos de rotación cargados (DepartmentMetric) para cruzar con el clima.
        </p>
      )}

      {/* Totales de caso de negocio de compañía */}
      {businessCaseTotals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {businessCaseTotals.map((bc) => (
            <div key={bc.type} className="rounded-2xl border border-slate-800/40 bg-slate-900/60 p-4">
              <p className="text-xs font-light text-white">{TYPE_LABEL[bc.type]}</p>
              <p className="text-xl font-extralight tabular-nums text-white mt-2">
                {clp.format(bc.potentialAnnualLossCLP)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {bc.peopleAtRisk} personas · {bc.deptCount} depto{bc.deptCount !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
