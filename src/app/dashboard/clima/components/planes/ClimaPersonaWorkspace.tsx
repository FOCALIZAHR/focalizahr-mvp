'use client';

// src/app/dashboard/clima/components/planes/ClimaPersonaWorkspace.tsx
// ════════════════════════════════════════════════════════════════════════════
// Tab 2 — Workspace de un responsable (Gate 5D-ii). Clon del canónico Cinema Mode:
// src/components/evaluator/cinema/SpotlightCard.tsx (FUENTE PRIMARIA, confirmada
// contra MAESTRO_EX_CLIMA). Split #0F172A/90 + backdrop-blur-2xl + rounded-[24px] +
// Tesla solo-cyan 1px con glow + panel derecho gradiente #0F172A→#162032. Mismos
// tokens que Tab 1 (ClimaPathWorkspace) usa correctamente — NO son deuda.
//
// intro       = LANDING CARD (contexto antes de la decisión). Left-aligned + breadcrumb
//               (FIX 3) → se distingue de la Portada, que es columna centrada.
// decisiones  = WIZARD uno-por-vez (FIX 1): "Equipo X de Y" + Anterior/Siguiente manual
//               (clon de ClimaCaseReview:132-166; nav manual porque los CTA son inertes
//               hasta Fase 3, no hay decisión que persista para auto-avanzar). N=1 → sin
//               wizard, solo la card.
// Izquierda   = contexto persistente del responsable.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users, UserX, Target, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton';
import {
  TAB2_CTA,
  TAB2_CARD,
  TAB2_WIZARD,
  TAB2_STATE_COPY,
  TAB2_ROUTE_COPY,
  TAB2_CHOICE,
  tab2DeptHeadline,
  tab2ResponsableIntro,
  tab2ReviewCta,
  tab2Breadcrumb,
  tab2WizardProgress,
  tab2TeamsSuffix,
} from '@/lib/constants/climaTab2Content';

// ── Tipos del payload (espejo de by-person/route.ts) — fuente única para Tab 2 ──
export type Tab2Route = 'ESTADO_A_CHOICE' | 'ESTADO_B_PDI';

export interface DeptFinding {
  departmentId: string;
  departmentName: string;
  route: Tab2Route;
  belowTierCount: number;
  belowTierDimensions: string[];
}
export interface ResponsableGroup {
  source: 'responsable' | 'account_admin';
  employeeId: string | null;
  name: string;
  ctaEnabled: boolean;
  ctaGatedReason: string | null;
  departamentos: DeptFinding[];
}

/** Fase 3: destino real del CTA. Ausente hoy → CTA inerte (gating + sin cablear). */
export type Tab2Action = (departmentId: string, route: Tab2Route, kind: 'meta' | 'pdi') => void;

interface Props {
  group: ResponsableGroup;
  onBack: () => void;
  onAction?: Tab2Action;
}

type Sub = 'intro' | 'decisiones';

export default function ClimaPersonaWorkspace({ group, onBack, onAction }: Props) {
  const [sub, setSub] = useState<Sub>('intro');
  const [step, setStep] = useState(0);
  const { name, ctaEnabled, departamentos } = group;
  const total = departamentos.length;

  const withSystemic = departamentos.filter((d) => d.route === 'ESTADO_B_PDI').length;
  const intro = tab2ResponsableIntro(name, {
    teams: total,
    withSystemic,
    choiceOnly: total - withSystemic,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-4xl"
    >
      {/* Contenedor canónico Cinema Mode (SpotlightCard.tsx, fuente primaria) */}
      <div className="relative overflow-hidden rounded-[24px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row">
        {/* Tesla solo-cyan + glow (1px), como SpotlightCard */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-20"
          style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)', boxShadow: '0 0 15px #22D3EE' }}
        />

        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" /> {TAB2_CTA.backToCarousel}
        </button>

        {/* IZQUIERDA — contexto persistente del responsable */}
        <div className="w-full md:w-[240px] md:flex-shrink-0 bg-slate-900/50 p-6 pt-16 md:pt-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-slate-800/40">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-[10px] font-light uppercase tracking-wider text-slate-500 mb-1">{TAB2_CARD.kicker}</p>
          <p className="text-sm font-light text-white leading-snug">{name}</p>
          <span className="mt-4 text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
            {total} {tab2TeamsSuffix(total)}
          </span>
          {!ctaEnabled && (
            <span className="mt-2 text-[9px] px-2 py-0.5 rounded-full text-slate-500/60 border border-slate-700/20 font-light">
              {TAB2_CARD.tagGatedLong}
            </span>
          )}
        </div>

        {/* DERECHA — breadcrumb (FIX 3) + intro (Landing Card) → wizard (decisiones) */}
        {/* Gradiente canónico del panel derecho (SpotlightCard:103) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-[380px] p-6 md:p-8 pt-14 md:pt-14 bg-gradient-to-br from-[#0F172A] to-[#162032]">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-5">{tab2Breadcrumb(name)}</p>

          {sub === 'intro' ? (
            // Landing Card — left-aligned (la Portada es centrada → se distinguen)
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight mb-3">
                {intro.title}
              </h3>
              <p className="text-base font-light text-slate-400 leading-relaxed mb-8 max-w-xl">{intro.mission}</p>
              <div>
                <PrimaryButton size="md" icon={ArrowRight} iconPosition="right" onClick={() => setSub('decisiones')}>
                  {tab2ReviewCta(total)}
                </PrimaryButton>
              </div>
            </div>
          ) : (
            // Wizard uno-por-vez
            <div className="flex-1 flex flex-col">
              {!ctaEnabled && (
                <div className="flex items-start gap-2 mb-4 rounded-lg border border-slate-700/30 bg-slate-800/30 px-3 py-2.5">
                  <UserX className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] font-light text-slate-400 leading-relaxed">{TAB2_STATE_COPY.gatedNotice}</p>
                </div>
              )}

              {/* Progreso (solo con >1 equipo) */}
              {total > 1 && (
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[11px] font-mono text-slate-500 shrink-0">{tab2WizardProgress(step + 1, total)}</p>
                  <div className="flex-1 flex gap-1">
                    {departamentos.map((_, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          'h-1 flex-1 rounded-full',
                          idx === step ? 'bg-cyan-500/50' : idx < step ? 'bg-slate-600' : 'bg-slate-800'
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Equipo actual (uno por vez) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={departamentos[step].departmentId}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                >
                  <DeptRow dept={departamentos[step]} ctaEnabled={ctaEnabled} onAction={onAction} />
                </motion.div>
              </AnimatePresence>

              {/* Navegación */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/30">
                {total > 1 ? (
                  <>
                    <SecondaryButton size="sm" icon={ArrowLeft} disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                      {TAB2_WIZARD.prev}
                    </SecondaryButton>
                    <SecondaryButton
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                      disabled={step === total - 1}
                      onClick={() => setStep((s) => s + 1)}
                    >
                      {TAB2_WIZARD.next}
                    </SecondaryButton>
                  </>
                ) : (
                  <SecondaryButton size="sm" icon={ArrowLeft} onClick={onBack}>
                    {TAB2_CTA.backToCarousel}
                  </SecondaryButton>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Fila de un departamento (una ruta) ──
function DeptRow({ dept, ctaEnabled, onAction }: { dept: DeptFinding; ctaEnabled: boolean; onAction?: Tab2Action }) {
  const actionable = ctaEnabled && !!onAction;
  const routeCopy = TAB2_ROUTE_COPY[dept.route];

  return (
    <div className="rounded-lg border border-slate-800/30 bg-slate-900/30 px-3 py-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[13px] font-light text-slate-200">
          {tab2DeptHeadline(dept.departmentName, dept.route, dept.belowTierDimensions)}
        </span>
        <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light shrink-0">
          {routeCopy.tag}
        </span>
      </div>

      <p className="text-[12px] font-light text-slate-400 leading-relaxed mt-2">{routeCopy.explanation}</p>

      {dept.route === 'ESTADO_B_PDI' ? (
        <div className="flex justify-end mt-3">
          <SecondaryButton size="sm" disabled={!actionable} onClick={() => onAction?.(dept.departmentId, dept.route, 'pdi')}>
            {TAB2_CTA.pdiMandatory}
          </SecondaryButton>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-[11px] font-light text-slate-500 mb-2">{TAB2_CHOICE.prompt}</p>
          <div className="flex flex-col md:flex-row gap-2">
            <ChoicePath
              icon={Compass}
              title={TAB2_CHOICE.pdi.title}
              body={TAB2_CHOICE.pdi.body}
              cta={TAB2_CTA.pdi}
              disabled={!actionable}
              onClick={() => onAction?.(dept.departmentId, dept.route, 'pdi')}
            />
            <ChoicePath
              icon={Target}
              title={TAB2_CHOICE.meta.title}
              body={TAB2_CHOICE.meta.body}
              cta={TAB2_CTA.meta}
              disabled={!actionable}
              onClick={() => onAction?.(dept.departmentId, dept.route, 'meta')}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Camino de la elección Estado A ──
function ChoicePath({
  icon: Icon,
  title,
  body,
  cta,
  disabled,
  onClick,
}: {
  icon: typeof Target;
  title: string;
  body: string;
  cta: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex-1 rounded-lg border border-slate-800/30 bg-slate-900/30 p-3 flex flex-col">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <p className="text-[12px] font-light text-slate-200">{title}</p>
      </div>
      <p className="text-[11px] font-light text-slate-500 leading-relaxed mt-1 flex-1">{body}</p>
      <div className="mt-2.5">
        <SecondaryButton size="sm" disabled={disabled} onClick={onClick}>
          {cta}
        </SecondaryButton>
      </div>
    </div>
  );
}
