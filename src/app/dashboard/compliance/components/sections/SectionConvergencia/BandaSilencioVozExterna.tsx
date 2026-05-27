'use client';

// Banda dedicada para la sexta alerta `silencio_con_voz_externa`.
// Doc maestro CONVERGENCIA_AMBIENTE_SANO_v3 §6.2.
//
// Componente aislado — NO reutiliza MergedDept. Recibe solo los datos que
// la sexta alerta necesita: nombre del depto + narrativa ejecutiva.
//
// El depto no tiene ComplianceAnalysis (sin cobertura de Ambiente Sano o
// participación < 50%), así que no hay ISA, dimensiones ni casos forenses
// que mostrar — solo el hallazgo: silencio cruzado con voz externa.
//
// Chrome clonado de BandaDepartamento (mismo background #0F172A, rounded-12,
// border 0.5px) para coherencia visual con las bandas hermanas de la sección.
//
// Gate 2 voz del score: cuando el dept resuelve a state === 'HUMO' (la
// mayoría de los items de esta banda), el backend adjunta `riskNarrativa` +
// `riskChip` con los componentes 0-100 del score. La banda muestra esa voz
// en lugar de la narrativa de alerta + el conteo de señales. Si los campos
// no vienen (FUEGO, dept sin lookup, etc.), cae al render legacy.

import { EarOff } from 'lucide-react';
import type { SilencioVozExternaItem } from '@/types/compliance';

interface Props {
  item: SilencioVozExternaItem;
}

export default function BandaSilencioVozExterna({ item }: Props) {
  const deptName = item.departmentName ?? 'Departamento sin nombre';
  const hasRiskNarrative = Boolean(item.riskNarrativa && item.riskChip);

  return (
    <div
      className="relative overflow-hidden rounded-[12px] border-l-2 border-slate-500/70"
      style={{
        background: '#0F172A',
        borderTop: '0.5px solid #1e293b',
        borderRight: '0.5px solid #1e293b',
        borderBottom: '0.5px solid #1e293b',
      }}
    >
      <div className="px-5 py-4 flex flex-col gap-3">
        {/* Eyebrow + nombre depto */}
        <div className="flex flex-col gap-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Sin medición · con voz externa
          </p>
          <span className="text-[14px] font-normal text-cyan-300">
            {deptName}
          </span>
        </div>

        {/* Narrativa ejecutiva — voz del score (HUMO) o legacy fallback. */}
        <p className="text-[13px] font-light text-slate-400 leading-relaxed">
          {hasRiskNarrative ? item.riskNarrativa : item.narrativa}
        </p>

        {/* Chip — solo score (FUEGO) o score+drivers (HUMO) o legacy. La
            ausencia de drivers comunica el estado sin exponerlo al wire. */}
        {hasRiskNarrative && item.riskChip ? (
          <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 self-start px-2.5 py-1 rounded-sm bg-slate-900/60 border border-slate-700/60">
            <span className="text-[11px] font-mono text-slate-300">
              Riesgo{' '}
              <span className="text-purple-300 tabular-nums">
                {item.riskChip.score}
              </span>
            </span>
            {item.riskChip.confiabilidad !== undefined && (
              <span className="text-[11px] font-mono text-slate-300">
                Confiabilidad{' '}
                <span className="text-purple-400 tabular-nums">
                  {item.riskChip.confiabilidad}
                </span>
              </span>
            )}
            {item.riskChip.alertasExternas !== undefined && (
              <span className="text-[11px] font-mono text-slate-300">
                Alertas externas{' '}
                <span className="text-purple-400 tabular-nums">
                  {item.riskChip.alertasExternas}
                </span>
              </span>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-sm bg-slate-900/60 border border-slate-700/60">
            <EarOff className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
            <span className="text-[11px] font-mono text-slate-300">
              Señales sin medición ·{' '}
              {item.signalsCount === 1
                ? '1 señal externa'
                : `${item.signalsCount} señales externas`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
