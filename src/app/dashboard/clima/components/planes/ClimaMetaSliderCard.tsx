'use client';

// src/app/dashboard/clima/components/planes/ClimaMetaSliderCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// EX Clima — Gate 5D Fase 3 (Grupo C). Una slider-card de ClimaFixMetaScreen.
// Clon de la mecánica de rc-slider de src/components/survey/renderers/NPSScaleRenderer.tsx
// (rail/track/handle), PERO sin su semáforo por clasificación (rojo/slate/cyan) — track
// SIEMPRE cyan→purple neutro; la banda la canta la etiqueta de texto + el número, no el color.
//
// Acordeón single-open (lo controla el padre): colapsada = resumen "Hoy X → meta Y";
// expandida = número grande del target (text-5xl/6xl, un escalón bajo el hero 72px de Portada)
// + slider + etiqueta de orientación viva. Tokens de CompensationPortada (slate-900, no Cinema).
// ════════════════════════════════════════════════════════════════════════════

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TAB2_META_SCREEN, tab2MetaTodayTarget, tab2MetaBandLabel, tab2MetaBandLabelShort } from '@/lib/constants/climaTab2Content';

interface ClimaMetaSliderCardProps {
  questionText: string;
  current: number; // mean actual del reactivo ("hoy")
  tier: number; // mean objetivo del reactivo (para la banda de orientación)
  target: number; // target elegido
  min: number;
  max: number;
  step: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (target: number) => void;
}

export default function ClimaMetaSliderCard({
  questionText,
  current,
  tier,
  target,
  min,
  max,
  step,
  expanded,
  onToggle,
  onChange,
}: ClimaMetaSliderCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800/40 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
      {/* Cabecera: siempre clickeable (abre/cierra el slider). Tap target ≥44px. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left min-h-[56px]"
      >
        <div className="min-w-0">
          <p className="text-sm md:text-base font-light text-slate-200 leading-relaxed">{questionText}</p>
          {!expanded && (
            <p className="text-xs font-light text-slate-500 tabular-nums mt-1.5">
              {tab2MetaTodayTarget(current, target)} · {tab2MetaBandLabelShort(target, current, tier)}
            </p>
          )}
        </div>
        <span className="text-slate-500 shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Cuerpo expandido: número grande (target real) + banda + slider */}
      {expanded && (
        <div className="px-5 pb-6 pt-1">
          <div className="flex flex-col items-center text-center mb-6">
            <p className="text-5xl md:text-6xl font-extralight text-white leading-[0.9] tabular-nums">
              {target.toFixed(1)}
            </p>
            <p className="text-sm font-light text-slate-400 mt-3">{tab2MetaBandLabel(target, current, tier)}</p>
            <p className="text-xs font-light text-slate-500 tabular-nums mt-1">
              {tab2MetaTodayTarget(current, target)}
            </p>
          </div>

          <div className="relative rounded-xl bg-slate-900/20 backdrop-blur-sm border border-white/5 p-4 max-w-xl mx-auto">
            <Slider
              min={min}
              max={max}
              step={step}
              value={target}
              onChange={(value) => onChange(value as number)}
              railStyle={{
                height: 6,
                borderRadius: 3,
                background: 'rgba(51, 65, 85, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
              trackStyle={{
                height: 6,
                borderRadius: 3,
                // Track SIEMPRE cyan→purple neutro (anti-semáforo: sin color por severidad).
                background: 'linear-gradient(90deg, #22D3EE, #A78BFA)',
                boxShadow: '0 0 12px rgba(34, 211, 238, 0.2)',
                transition: 'all 0.4s ease',
              }}
              handleStyle={{
                width: 20,
                height: 20,
                marginTop: -7,
                background: '#ffffff',
                border: '2px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(167, 139, 250, 0.15)',
                opacity: 1,
                cursor: 'pointer',
              }}
              dotStyle={{ display: 'none' }}
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-light mt-2 px-1 uppercase tracking-wider">
              <span>{TAB2_META_SCREEN.bands.min.split(',')[0]}</span>
              <span>{TAB2_META_SCREEN.bands.ambitious}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
