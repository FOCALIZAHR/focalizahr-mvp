'use client';

// src/components/compliance/cascada/ActoCobertura.tsx
// ────────────────────────────────────────────────────────────────────────────
// Acto 0 — "La Cobertura" de la Cascada Ejecutiva (Ambiente Sano).
// Molde visual: PLTalentExecutiveBriefing.tsx (Acto 1 + tooltips de fuente).
//
// Hero dinámico:
//   silencio ≥ conVoz → silencio% + "ÁREAS EN SILENCIO" + violet (crisis)
//   voz > silencio    → conVoz%  + "ÁREAS CON VOZ CONFIABLE" + cyan
//
// Refuerzo visual (siguiendo P&L y design tokens del system):
//   · Nombres de área en font-medium text-slate-200.
//   · %s protagonistas en text-violet-400 (ecoa el ancla en silence-dominant)
//     o text-cyan-400 (voice-dominant).
//   · Badge ONBOARDING/EXIT al inicio de cada línea del sub-hallazgo, con
//     tooltip explicando el producto (clon del patrón TOOLTIP_ITEMS de PLTalent).
//   · Badge legal inline junto a "ambiente no seguro" en amber, con label
//     dinámico por país (legalBadgeForCountry).
//   · "onboarding" y "salida" en coaching y frase del cruce son tooltipables.
// ────────────────────────────────────────────────────────────────────────────

import { memo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActSeparator, SubtleLink, fadeIn, fadeInDelay } from './shared';
import ActoCoberturaModal from './ActoCoberturaModal';
import {
  ACT_LABEL,
  HERO_LABEL_SILENCIO,
  HERO_LABEL_VOZ,
  SUBTLE_LINK,
  SILENCIO_YA_HABLA_EYEBROW,
  SOURCE_TOOLTIPS,
  legalBadgeForCountry,
  buildNarrativaPrincipal,
  buildSilencioYaHabla,
  buildCoachingTip,
  type CoveragePayload,
  type NarrativeToken,
} from '@/lib/services/compliance/CoverageNarrativeDictionary';
import type { ComplianceReportResponse } from '@/types/compliance';

interface ActoCoberturaProps {
  data: ComplianceReportResponse;
}

export default memo(function ActoCobertura({ data }: ActoCoberturaProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const coverage = data.data.coverage;
  const country = data.company.country;

  if (coverage.totalDeptos === 0) return null;

  const silencio = coverage.totalDeptos - coverage.deptosConVoz;
  const pctVoz = coverage.pctCobertura;
  const pctSilencio = 100 - pctVoz;
  const payload: CoveragePayload = {
    total: coverage.totalDeptos,
    conVoz: coverage.deptosConVoz,
    silencio,
    pctVoz,
    pctSilencio,
  };

  // Hero dinámico — silence vs voice dominant.
  const silenceDominant = silencio >= coverage.deptosConVoz && silencio > 0;
  const heroPct = silenceDominant ? pctSilencio : pctVoz;
  const heroLabel = silenceDominant ? HERO_LABEL_SILENCIO : HERO_LABEL_VOZ;
  const heroColorClass = silenceDominant
    ? 'text-violet-400'
    : 'text-cyan-400';
  const sepTier: 'cyan' | 'purple' = silenceDominant ? 'purple' : 'cyan';
  const borderColor = silenceDominant
    ? 'border-purple-500/30'
    : 'border-cyan-500/30';
  // Color de acento para los %s del cuerpo — ecoa el ancla.
  const pctAccentClass = heroColorClass;

  // Narrativas.
  const { p1, p2 } = buildNarrativaPrincipal(payload);
  const yaHabla = buildSilencioYaHabla({
    items: coverage.silencioConVozExterna,
    incluirCruce: coverage.rama === 'A',
  });
  const coachingTokens = buildCoachingTip(
    payload,
    coverage.silencioConVozExterna.length,
  );

  const showSubhallazgo =
    yaHabla.fraseCruce !== null || yaHabla.lineas.length > 0;

  // Render helper de tokens — comparte la lógica para todos los bloques.
  const renderTokens = (tokens: NarrativeToken[]): ReactNode =>
    tokens.map((t, i) => {
      if (t.type === 'pct') {
        return (
          <span key={i} className={cn('font-medium', pctAccentClass)}>
            {t.value}
          </span>
        );
      }
      if (t.type === 'bold') {
        return (
          <strong key={i} className="font-medium text-slate-200">
            {t.value}
          </strong>
        );
      }
      if (t.type === 'tooltip') {
        return (
          <TooltipText key={i} content={SOURCE_TOOLTIPS[t.tooltipKey]}>
            {t.value}
          </TooltipText>
        );
      }
      if (t.type === 'legal') {
        return <LegalBadgePill key={i} country={country} />;
      }
      // text — string plano
      return <span key={i}>{t.value}</span>;
    });

  return (
    <>
      <ActSeparator label={ACT_LABEL} color={sepTier} />
      <div>
        {/* Ancla — hero dinámico */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p
            className={cn(
              'text-7xl md:text-8xl font-extralight tracking-tight',
              heroColorClass,
            )}
          >
            {heroPct}%
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {heroLabel}
          </p>
        </motion.div>

        {/* Narrativa principal — protagonista + expansión */}
        <motion.div {...fadeIn} className="space-y-4 max-w-2xl mx-auto">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            {renderTokens(p1)}
          </p>
          <p className="text-base font-light text-slate-400 leading-relaxed">
            {renderTokens(p2)}
          </p>
        </motion.div>

        {/* Sub-hallazgo "EL SILENCIO QUE YA HABLA" */}
        {showSubhallazgo && (
          <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-8">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
              {SILENCIO_YA_HABLA_EYEBROW}
            </p>

            {yaHabla.fraseCruce && (
              <p className="text-base font-light text-slate-400 leading-relaxed mb-4">
                {renderTokens(yaHabla.fraseCruce)}
              </p>
            )}

            {yaHabla.aperturaSenales && (
              <p className="text-base font-light text-slate-400 leading-relaxed mb-3">
                {renderTokens(yaHabla.aperturaSenales)}
              </p>
            )}

            {yaHabla.lineas.length > 0 && (
              <ul className="space-y-2 mb-3 list-none">
                {yaHabla.lineas.map((linea, idx) => (
                  <li
                    key={idx}
                    className="text-base font-light text-slate-400 leading-relaxed"
                  >
                    <SourceBadge tipo={linea.tipoSenal} />
                    {' '}
                    {renderTokens(linea.tokens)}
                  </li>
                ))}
              </ul>
            )}

            {yaHabla.cierreSenales && (
              <p className="text-base font-light text-slate-400 leading-relaxed">
                {renderTokens(yaHabla.cierreSenales)}
              </p>
            )}
          </motion.div>
        )}

        {/* Coaching tip */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-8">
          <div className={cn('border-l-2 pl-4', borderColor)}>
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              {renderTokens(coachingTokens)}
            </p>
          </div>
        </motion.div>

        {/* SubtleLink → modal */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-6">
          <SubtleLink onClick={() => setModalOpen(true)}>
            {SUBTLE_LINK}
          </SubtleLink>
        </motion.div>
      </div>

      <ActoCoberturaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        coverage={coverage}
      />
    </>
  );
});

// ════════════════════════════════════════════════════════════════════════════
// PRIMITIVOS LOCALES — clonan el patrón de tooltips del PLTalent briefing
// ════════════════════════════════════════════════════════════════════════════

/**
 * Tooltip universal — onClick toggle (mobile tap) + hover (desktop).
 * Clon del patrón TOOLTIP_ITEMS de PLTalentExecutiveBriefing.tsx (líneas 67-72,
 * 266-294). El contenedor es inline-flex para no romper el flujo de texto.
 */
function Tooltip({
  content,
  children,
}: {
  content: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-baseline align-middle">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-baseline cursor-help"
        aria-label="Más información"
      >
        {children}
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 shadow-xl z-50 pointer-events-none">
          <span className="block text-xs font-light text-slate-300 leading-relaxed normal-case tracking-normal">
            {content}
          </span>
        </span>
      )}
    </span>
  );
}

/** Pill con label de fuente (ONBOARDING / EXIT) + ícono de info + tooltip. */
function SourceBadge({ tipo }: { tipo: 'exit' | 'onboarding' | 'otra' }) {
  if (tipo === 'otra') return null;
  const label = tipo === 'exit' ? 'EXIT' : 'ONBOARDING';
  const content = tipo === 'exit' ? SOURCE_TOOLTIPS.exit : SOURCE_TOOLTIPS.onboarding;
  return (
    <Tooltip content={content}>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900/60 text-[9px] uppercase tracking-wider text-slate-400">
        {label}
        <HelpCircle className="w-2.5 h-2.5" strokeWidth={1.5} />
      </span>
    </Tooltip>
  );
}

/** Pill amber con label legal por país + ícono + tooltip. */
function LegalBadgePill({ country }: { country: string | null | undefined }) {
  const config = legalBadgeForCountry(country);
  return (
    <Tooltip content={config.tooltip}>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-[9px] uppercase tracking-wider text-amber-300">
        {config.label}
        <HelpCircle className="w-2.5 h-2.5" strokeWidth={1.5} />
      </span>
    </Tooltip>
  );
}

/** Texto inline tooltipable — palabra con underline punteado discreto + tooltip. */
function TooltipText({
  content,
  children,
}: {
  content: string;
  children: ReactNode;
}) {
  return (
    <Tooltip content={content}>
      <span className="underline decoration-dotted decoration-slate-600 underline-offset-2 hover:decoration-slate-400 transition-colors">
        {children}
      </span>
    </Tooltip>
  );
}
