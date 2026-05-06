'use client';

// Sub-vista — Condición 1 (solo 1 fuente activa).
// Layout 60/40: izq narrativa, der 1 tarjeta sólida (instrumento activo) +
// 3 tarjetas fantasma dashed (instrumentos faltantes).
//
// Tokens canónicos compliance: bg #0F172A + border 0.5px + rounded 20px.
// Tesla line slate (sin glow) — sub-vista más sobria, no es diagnóstico crítico.

import { SOURCE_LABEL_NARRATIVE } from '@/config/compliance/sourceLabels';
import { INSTRUMENTOS_AUSENTES } from './_shared/INSTRUMENTOS_AUSENTES';
import { deriveInactiveSources } from './_shared/helpers';
import { formatCyclePeriod } from '../SectionDimensiones/_shared/helpers';
import type { ComplianceReportResponse } from '@/types/compliance';
import type { ComplianceSource } from '@/config/complianceAlertConfig';

interface Props {
  report: ComplianceReportResponse;
}

export default function VisionParcial({ report }: Props) {
  const activeSources = report.data.convergencia.activeSources;
  const inactiveSources = deriveInactiveSources(activeSources);
  const cyclePeriod = formatCyclePeriod({
    startDate: report.campaign.startDate,
    endDate: report.campaign.endDate,
  });
  const fuenteUnica: ComplianceSource | null = activeSources[0] ?? null;

  return (
    <div
      className="relative overflow-hidden rounded-[20px]"
      style={{
        background: '#0F172A',
        border: '0.5px solid #1e293b',
      }}
    >
      {/* Tesla slate — sin glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, #334155 40%, #475569 60%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* STATUS BAR */}
      <div
        className="flex items-center gap-2 px-7 py-3"
        style={{ borderBottom: '0.5px solid #1e293b' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: '#475569' }}
          aria-hidden="true"
        />
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
          Cobertura
        </span>
        <span className="text-[10px] text-slate-500 font-normal">
          Visión parcial · 1 fuente activa{cyclePeriod ? ` · ${cyclePeriod}` : ''}
        </span>
      </div>

      {/* MAIN 60/40 */}
      <div className="grid grid-cols-1 md:grid-cols-[60fr_40fr] min-h-[460px]">
        {/* LEFT 60% — narrativa */}
        <div
          className="flex flex-col gap-5 px-7 py-8 md:pl-7 md:pr-8"
          style={{ borderRight: '0.5px solid #1e293b' }}
        >
          {/* Editorial title */}
          <div className="leading-[1.1]">
            <span
              className="block text-[44px] font-extralight"
              style={{ color: '#f1f5f9' }}
            >
              Operando con visión
            </span>
            <span
              className="block text-[44px] font-extralight"
              style={{ color: '#cbd5e1' }}
            >
              parcial del riesgo.
            </span>
          </div>

          {/* Veredicto cursiva */}
          <p
            className="text-[13px] italic font-light leading-[1.6] pl-3"
            style={{
              color: '#64748b',
              borderLeft: '1px solid #1e293b',
            }}
          >
            La convergencia exige al menos dos lentes que se confirmen entre sí.
            Hoy el sistema opera con uno solo.
          </p>

          {/* Lego texto */}
          <div className="space-y-3">
            <p
              className="text-sm font-light leading-[1.8]"
              style={{ color: '#cbd5e1' }}
            >
              Una sola fuente puede detectar señales — pero no puede confirmarlas.
              Cuando dos lentes independientes coinciden, el hallazgo deja de ser
              una hipótesis y se convierte en un dato.
            </p>
            <p
              className="text-sm font-light leading-[1.8]"
              style={{ color: '#cbd5e1' }}
            >
              Cada instrumento que falta es un punto ciego. La organización está
              tomando decisiones sobre el ambiente sin contraste con lo que
              dicen las salidas, las nuevas incorporaciones o el clima sostenido
              en el tiempo.
            </p>
            <p
              className="text-sm font-light leading-[1.8]"
              style={{ color: '#94a3b8' }}
            >
              El próximo ciclo confirmará si esta lectura era correcta — o si
              algo importante quedó fuera de cuadro.
            </p>
          </div>
        </div>

        {/* RIGHT 40% — tarjetas */}
        <div className="flex flex-col gap-3 px-7 py-8">
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600 mb-1">
            Instrumentos
          </span>

          {/* Tarjeta sólida — fuente activa */}
          {fuenteUnica ? (
            <div
              className="rounded-[12px] p-4"
              style={{
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid #1e293b',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: '#22D3EE' }}
                  aria-hidden="true"
                />
                <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-cyan-300">
                  Activo
                </span>
              </div>
              <p className="text-[15px] font-normal text-slate-200">
                {SOURCE_LABEL_NARRATIVE[fuenteUnica]}
              </p>
              <p className="text-[11px] font-light text-slate-500 mt-1 leading-[1.5]">
                Única fuente con datos este ciclo.
              </p>
            </div>
          ) : null}

          {/* Tarjetas fantasma — fuentes inactivas */}
          {inactiveSources.map((src) => {
            const copy = INSTRUMENTOS_AUSENTES[src];
            return (
              <div
                key={src}
                className="rounded-[12px] p-4"
                style={{
                  background: 'transparent',
                  border: '1.5px dashed #334155',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: '#475569' }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
                    Sin data
                  </span>
                </div>
                <p className="text-[15px] font-normal text-slate-400">
                  {copy.nombreLegible}
                </p>
                <p className="text-[12px] font-light text-slate-500 mt-2 leading-[1.6]">
                  {copy.queRevelaria}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
