'use client';

// src/components/clima/HeatmapGrid.tsx
// Mapa de calor drivers × departamentos. Genérico cross-producto. Cada celda =
// favorabilidad del driver en ese depto, coloreada por zona (anti-semáforo).
// Drivers carried (arrastrados de una medición anterior) en gris con indicador
// de origen. Click en la columna de un depto → deep-link a su SpotlightCard.

import { useMemo } from 'react';
import { zoneColor, zoneFromFavorability } from './climaZonePalette';
import type { ClimaDepartmentInsight } from '@/types/clima';

interface HeatmapGridProps {
  departments: ClimaDepartmentInsight[];
  onSelectDepartment: (id: string) => void;
}

export default function HeatmapGrid({ departments, onSelectDepartment }: HeatmapGridProps) {
  // Universo de drivers = unión de categorías medidas en cualquier depto.
  const drivers = useMemo(() => {
    const set = new Set<string>();
    for (const d of departments) {
      for (const k of Object.keys(d.driverScores ?? {})) set.add(k);
    }
    return Array.from(set).sort();
  }, [departments]);

  if (drivers.length === 0 || departments.length === 0) {
    return (
      <p className="text-sm font-light text-slate-500 text-center py-8">
        Sin dimensiones medidas para construir el mapa.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
      <table className="border-separate border-spacing-1 min-w-full">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-[#0F172A] text-left text-[10px] uppercase tracking-wider text-slate-500 font-light px-2 py-1">
              Dimensión
            </th>
            {departments.map((d) => (
              <th key={d.departmentId} className="px-1 py-1 align-bottom">
                <button
                  onClick={() => onSelectDepartment(d.departmentId)}
                  className="text-[10px] font-light text-slate-400 hover:text-white transition-colors max-w-[80px] truncate block"
                  title={d.departmentName}
                >
                  {d.departmentName}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver) => (
            <tr key={driver}>
              <td className="sticky left-0 z-10 bg-[#0F172A] text-xs font-light text-slate-300 capitalize px-2 py-1 whitespace-nowrap">
                {driver}
              </td>
              {departments.map((d) => {
                const score = d.driverScores?.[driver];
                const fav = score?.fav ?? null;
                const carried = score?.carried ?? false;
                const color =
                  fav === null ? 'transparent' : carried ? '#475569' : zoneColor(zoneFromFavorability(fav));
                return (
                  <td key={d.departmentId} className="p-0">
                    <button
                      onClick={() => onSelectDepartment(d.departmentId)}
                      className="w-full min-w-[52px] h-9 rounded flex items-center justify-center text-[11px] font-medium tabular-nums transition-transform hover:scale-105"
                      style={{
                        backgroundColor: fav === null ? 'rgba(30,41,59,0.4)' : `${color}${carried ? '55' : 'E6'}`,
                        color: fav === null ? '#475569' : carried ? '#94A3B8' : '#0F172A',
                      }}
                      title={
                        fav === null
                          ? 'sin dato'
                          : carried
                            ? `${Math.round(fav)}% · dato de ${score?.sourceDate ?? 'medición anterior'}`
                            : `${Math.round(fav)}%`
                      }
                    >
                      {fav === null ? '—' : Math.round(fav)}
                      {carried && <span className="ml-0.5 text-[8px]">·</span>}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-slate-500 font-light mt-3">
        Color = zona de la dimensión · gris = dato arrastrado de una medición anterior · click para abrir el departamento
      </p>
    </div>
  );
}
