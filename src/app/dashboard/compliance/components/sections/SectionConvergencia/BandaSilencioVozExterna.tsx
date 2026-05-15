'use client';

// Banda dedicada para la sexta alerta `silencio_con_voz_externa`.
// Doc maestro CONVERGENCIA_AMBIENTE_SANO_v3 §6.2.
//
// Componente aislado — NO reutiliza MergedDept. Recibe solo los 3 datos
// que la sexta alerta necesita: nombre del depto, narrativa ejecutiva ya
// interpolada, y cantidad de señales externas que la dispararon.
//
// El depto no tiene ComplianceAnalysis (sin cobertura de Ambiente Sano o
// participación < 50%), así que no hay ISA, dimensiones ni casos forenses
// que mostrar — solo el hallazgo: silencio cruzado con voz externa.
//
// Chrome clonado de BandaDepartamento (mismo background #0F172A, rounded-12,
// border 0.5px) para coherencia visual con las bandas hermanas de la sección.

import { EarOff } from 'lucide-react';
import type { SilencioVozExternaItem } from '@/types/compliance';

interface Props {
  item: SilencioVozExternaItem;
}

export default function BandaSilencioVozExterna({ item }: Props) {
  const deptName = item.departmentName ?? 'Departamento sin nombre';
  const signalLabel =
    item.signalsCount === 1 ? '1 señal externa' : `${item.signalsCount} señales externas`;

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

        {/* Narrativa ejecutiva (ya interpolada con el nombre del depto) */}
        <p className="text-[13px] font-light text-slate-400 leading-relaxed">
          {item.narrativa}
        </p>

        {/* Chip de la sexta alerta — señal sin alarmar */}
        <div className="inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-sm bg-slate-900/60 border border-slate-700/60">
          <EarOff className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
          <span className="text-[11px] font-mono text-slate-300">
            Señales sin medición · {signalLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
