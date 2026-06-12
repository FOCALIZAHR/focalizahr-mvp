'use client';

// src/components/compliance/cascada/ActoTriage.tsx
// Beat 2 de la Cascada — "El Triage" · GATE 2a (grupos narrativos).
//
// El zoom del "pero" del titular: pone nombre a lo que la Apertura apuntó.
// Nivel narrativo = GERENCIA (rollup autoritativo de buildGerenciaRollup).
// La narrativa pertenece al TIPO, no a la gerencia: misma lectura → se narra
// UNA vez con todas las instancias nombradas; lecturas distintas → grupos
// hermanos bajo la misma familia. Sin cards: kickers, tipografía, líneas, aire.
//
// Toda la lógica vive en `buildTriageGroups` (pure, testeada). El componente
// solo pinta. Excepción de vocabulario ("denuncia"/"Ley Karin") autorizada en
// FUEGO y HUMO/A-legal — narrativas verbatim del dictionary.
//
// Bandas Sexta + OTRO MUNDO se conservan debajo como contexto neutro (existían
// pre-2a). [DEUDA 2a — visto Victor: confirmar si se mantienen junto a grupos.]
// Links de grupo abren el modal 2b — INERTES hasta que 2b se construya.

import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActSeparator, fadeIn, fadeInDelay } from './shared';
import {
  buildTriageGroups,
  type TriageFamily,
  type TriageLecturaKey,
} from '@/lib/services/compliance/buildTriageGroups';
import TriageDetailModal from './TriageDetailModal';
import { formatDepartmentName } from '@/lib/utils/formatName';
import type { ComplianceReportResponse } from '@/types/compliance';

interface ActoTriageProps {
  data: ComplianceReportResponse;
}

// Color por familia — único portador de severidad (número + composición).
// El resto permanece uniforme (anti-semáforo: sin bordes/bg de color).
const FAMILY_TEXT: Record<TriageFamily, string> = {
  FUEGO: 'text-red-400',
  HUMO: 'text-amber-400',
  PUNTO_CIEGO: 'text-slate-400',
  CONFIABLE: 'text-cyan-400',
};

/** Quita la flecha textual del link — SubtleLink ya pinta el ícono. */
function linkLabel(link: string): string {
  return link.replace(/\s*→$/, '');
}

export default memo(function ActoTriage({ data }: ActoTriageProps) {
  const acto = useMemo(() => buildTriageGroups(data), [data]);
  // Modal "ver más" 2b — qué lectura está abierta (null = cerrado).
  const [openKey, setOpenKey] = useState<TriageLecturaKey | null>(null);

  // Sexta + OTRO MUNDO ya deduplicadas contra los grupos (decisión Victor).
  const sextaItems = acto.sexta;
  const otroMundoItems = acto.otroMundo;

  if (
    acto.groups.length === 0 &&
    sextaItems.length === 0 &&
    otroMundoItems.length === 0
  ) {
    return null;
  }

  // Color del hero / separador — silencio o presencia de fuego ⇒ violeta.
  const coverageGapPct = 100 - (data.data.coverage?.pctCobertura ?? 100);
  const isPeligro = coverageGapPct >= 50 || acto.counts.fuego > 0;
  const heroColor = isPeligro ? 'text-violet-400' : 'text-amber-400';

  return (
    <>
      <ActSeparator label="El Triage" color={isPeligro ? 'purple' : 'amber'} />
      <div>
        {/* Hero — coverageGapPct (dept-level). */}
        <motion.div {...fadeInDelay} className="text-center mb-8">
          <p className={cn('text-7xl md:text-8xl font-extralight tracking-tight', heroColor)}>
            {acto.hero.number}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {acto.hero.label}
          </p>
          {acto.hero.sub && (
            <p className="text-xs text-slate-500 mt-2 tracking-wider">{acto.hero.sub}</p>
          )}
        </motion.div>

        {/* Intro conectora — personResponseRate (person-level). */}
        <motion.p
          {...fadeIn}
          className="max-w-2xl mx-auto text-center text-base font-light text-slate-400 leading-relaxed mb-10"
        >
          {acto.intro}
        </motion.p>

        {/* Grupos por lectura — sin cards. Más aire ENTRE grupos (§3). */}
        {acto.groups.length > 0 && (
          <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-14">
            {acto.groups.map((g) => (
              <div key={g.key}>
                {/* Kicker — color de familia, peso 500, un punto más grande (§3).
                    Homogéneo: número factorizado al kicker (§2). */}
                <p
                  className={cn(
                    'text-xs uppercase tracking-widest font-medium mb-3',
                    FAMILY_TEXT[g.family],
                  )}
                >
                  {g.homogeneous
                    ? `${g.kicker} · ${g.count} gerencias · riesgo ${g.sharedScore} de 100 cada una`
                    : g.kicker}
                </p>

                {/* Instancias (§1/§2) */}
                {g.homogeneous ? (
                  // Línea corrida de nombres — el score ya está en el kicker.
                  <p className="text-sm font-light text-slate-300 leading-relaxed mb-4">
                    {g.instances
                      .map((inst) =>
                        inst.viaWorstDept
                          ? `${formatDepartmentName(inst.gerenciaName)} (foco: ${formatDepartmentName(inst.viaWorstDept)})`
                          : formatDepartmentName(inst.gerenciaName),
                      )
                      .join(', ')}
                  </p>
                ) : (
                  <div className="space-y-1.5 mb-4">
                    {g.instances.map((inst) => (
                      <p
                        key={inst.gerenciaId}
                        className="text-sm leading-relaxed tabular-nums"
                      >
                        <span className="font-medium text-slate-200">
                          {formatDepartmentName(inst.gerenciaName)}
                        </span>
                        <span className={cn('font-light', FAMILY_TEXT[g.family])}>
                          {' · riesgo '}
                          {inst.score}
                          {' de 100'}
                        </span>
                        {inst.viaWorstDept && (
                          <span className="font-light text-slate-500">
                            {' — el foco: '}
                            {formatDepartmentName(inst.viaWorstDept)}
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                )}

                {/* Narrativa del tipo — UNA vez (verbatim / plural adaptado). */}
                <p className="text-sm font-light text-slate-300 leading-relaxed">
                  {g.narrativa}
                </p>

                {/* Link al modal 2b — atenuado (slate), flecha cyan (§3). */}
                <button
                  onClick={() => setOpenKey(g.key)}
                  className="group mt-3 inline-flex items-center gap-1.5 text-sm font-light text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {linkLabel(g.link)}
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Extremos — "no es parejo" (guard: no se emite en el caso real). */}
        {acto.extremosLine && (
          <motion.p
            {...fadeIn}
            className="max-w-2xl mx-auto text-center text-sm font-light text-slate-400 leading-relaxed mt-10"
          >
            {acto.extremosLine}
          </motion.p>
        )}

        {/* Sexta + OTRO MUNDO — contexto neutro conservado (pre-2a). */}
        {(sextaItems.length > 0 || otroMundoItems.length > 0) && (
          <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-10 space-y-3">
            {sextaItems.length > 0 && (
              <div className="border-t border-slate-800/40 pt-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                  El silencio que ya habla
                </p>
                {sextaItems.map((s, i) => (
                  <p
                    key={`sexta-${s.departmentId ?? i}`}
                    className="text-sm font-light text-slate-300 leading-relaxed"
                  >
                    {s.narrativa}
                  </p>
                ))}
              </div>
            )}
            {otroMundoItems.length > 0 && (
              <div className="border-t border-slate-800/40 pt-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                  Otro mundo (no invitados con rastro externo)
                </p>
                {otroMundoItems.map((o, i) => (
                  <p
                    key={`otromundo-${o.departmentId ?? i}`}
                    className="text-sm font-light text-slate-300 leading-relaxed"
                  >
                    <span className="font-medium text-slate-200">
                      {formatDepartmentName(o.departmentName)}
                    </span>
                    {' · '}
                    {o.signalsCount === 1
                      ? '1 señal externa sin participar del estudio'
                      : `${o.signalsCount} señales externas sin participar del estudio`}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Modal "ver más" 2b */}
      {openKey && (
        <TriageDetailModal
          data={data}
          lecturaKey={openKey}
          onClose={() => setOpenKey(null)}
        />
      )}
    </>
  );
});
