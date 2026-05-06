'use client';

// Componente Nivel 1 — header editorial 60/40 con state machine de 5 estados.
// Plan sec "Componente 1 — ConvergenciaOrgHeader".
//
// Tesla line dinámica:
//   - sin_convergencia      → cyan default
//   - convergencia_multiple → cyan default
//   - teatro_detectado      → amber warning
//   - falla_ciclo_vida      → amber warning
//   - critical_by_manager   → cyan default (con UI especial agrupando deptos)
//   - nivelFinal critica_sistema → rojo con animate-pulse (ÚNICO uso sancionado de rojo)

import { GitBranch, Infinity as InfinityIcon, Activity, EyeOff, Eye, type LucideIcon } from 'lucide-react';

import { STATE_MACHINE_COPY } from './_shared/STATE_MACHINE_COPY';
import { CRITICAL_BY_MANAGER_COPY } from './_shared/CRITICAL_BY_MANAGER_COPY';
import type { HeaderState, MergedDept } from './_shared/helpers';

interface Props {
  state: HeaderState;
  deptos: MergedDept[];
  /** True si algún dept tiene nivelFinal === 'critica_sistema'. Tesla rojo + pulse. */
  hayCriticaSistema: boolean;
}

const STATE_ICON: Record<HeaderState, LucideIcon> = {
  critical_by_manager: GitBranch,
  falla_ciclo_vida: InfinityIcon,
  teatro_detectado: EyeOff,
  convergencia_multiple: Activity,
  sin_convergencia: Eye,
};

export default function ConvergenciaOrgHeader({
  state,
  deptos,
  hayCriticaSistema,
}: Props) {
  const copy = STATE_MACHINE_COPY[state];
  const Icon = STATE_ICON[state];

  // Tesla line dinámica
  const teslaConfig = (() => {
    if (hayCriticaSistema) {
      return {
        gradient:
          'linear-gradient(90deg, transparent, #EF4444 40%, #EF4444 60%, transparent)',
        glow: '0 0 12px rgba(239,68,68,0.55)',
        pulse: true,
      };
    }
    if (state === 'teatro_detectado' || state === 'falla_ciclo_vida') {
      return {
        gradient:
          'linear-gradient(90deg, transparent, #F59E0B 40%, #FCD34D 60%, transparent)',
        glow: '0 0 10px rgba(245,158,11,0.35)',
        pulse: false,
      };
    }
    return {
      gradient:
        'linear-gradient(90deg, transparent, #22D3EE 40%, #A78BFA 60%, transparent)',
      glow: '0 0 10px rgba(34,211,238,0.35)',
      pulse: false,
    };
  })();

  // Hero number — count de deptos con convergencia (≠ ninguna)
  const deptosConvergentes = deptos.filter(
    (d) => d.convergenciaInterna.nivelConvergencia !== 'ninguna'
  ).length;

  return (
    <div
      className="relative overflow-hidden rounded-[20px]"
      style={{
        background: '#0F172A',
        border: '0.5px solid #1e293b',
      }}
    >
      {/* Tesla line — color según estado */}
      <div
        className={`absolute top-0 left-0 right-0 h-px pointer-events-none ${
          teslaConfig.pulse ? 'animate-pulse' : ''
        }`}
        style={{
          background: teslaConfig.gradient,
          boxShadow: teslaConfig.glow,
        }}
        aria-hidden="true"
      />

      {/* MAIN 60/40 */}
      <div className="grid grid-cols-1 md:grid-cols-[60fr_40fr]">
        {/* LEFT 60% — narrativa editorial */}
        <div
          className="flex flex-col gap-5 px-7 py-8 md:pl-7 md:pr-8"
          style={{ borderRight: '0.5px solid #1e293b' }}
        >
          {/* Contexto tag */}
          <div className="flex items-center gap-2">
            <Icon
              className="w-4 h-4 text-slate-500"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {copy.contexto}
            </span>
          </div>

          {/* Titular editorial 44px word-split */}
          <div className="leading-[1.1]">
            <span
              className="block text-[44px] font-extralight"
              style={{ color: '#f1f5f9' }}
            >
              {copy.titularLine1}
            </span>
            <span
              className="block text-[44px] font-extralight fhr-title-gradient"
            >
              {copy.titularLine2}
            </span>
          </div>

          {/* Veredicto cursiva con border-l */}
          <p
            className="text-[13px] italic font-light leading-[1.6] pl-3"
            style={{
              color: '#64748b',
              borderLeft: '1px solid #1e293b',
            }}
          >
            {copy.veredicto}
          </p>

          {/* Lego narrativo */}
          <p
            className="text-sm font-light leading-[1.8]"
            style={{ color: '#cbd5e1' }}
          >
            {copy.lego}
          </p>

          {/* Cierre de urgencia — solo si existe */}
          {copy.cierre ? (
            <p
              className="text-sm font-light leading-[1.7] pt-2"
              style={{
                color: '#94a3b8',
                borderTop: '0.5px solid #1e293b',
              }}
            >
              {copy.cierre}
            </p>
          ) : null}
        </div>

        {/* RIGHT 40% — UI contextual según estado */}
        <div className="flex flex-col gap-3 px-7 py-8 justify-center">
          {state === 'sin_convergencia' ? null : (
            <>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
                {state === 'critical_by_manager'
                  ? 'Departamentos del grupo'
                  : 'Departamentos convergentes'}
              </span>
              <div className="flex items-baseline gap-3">
                <span
                  className="text-[64px] font-extralight tabular-nums leading-none"
                  style={{ color: '#A78BFA' }}
                >
                  {deptosConvergentes}
                </span>
                <span className="text-xs font-light text-slate-500">
                  {deptosConvergentes === 1 ? 'departamento' : 'departamentos'}
                </span>
              </div>

              {/* Privacy note solo en estado criticalByManager */}
              {state === 'critical_by_manager' ? (
                <p
                  className="text-[11px] font-light leading-[1.6] mt-2"
                  style={{ color: '#475569' }}
                >
                  {CRITICAL_BY_MANAGER_COPY.privacyNote}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
