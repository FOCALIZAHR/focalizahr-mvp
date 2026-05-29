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
import { cn } from '@/lib/utils';
import {
  ActSeparator,
  SubtleLink,
  Tooltip,
  LegalBadgePill,
  fadeIn,
  fadeInDelay,
} from './shared';
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
import {
  resolveDepartmentRiskNarrative,
  type DepartmentRiskNarrative,
} from '@/lib/services/compliance/DepartmentRiskNarrativeDictionary';
import type {
  ComplianceReportResponse,
  DepartmentRiskScore,
} from '@/types/compliance';

interface ActoCoberturaProps {
  data: ComplianceReportResponse;
}

export default memo(function ActoCobertura({ data }: ActoCoberturaProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const coverage = data.data.coverage;
  const country = data.company.country;
  const riskScores: DepartmentRiskScore[] = data.data.riskScores ?? [];

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

  // ─── Motor de voz del score: clasifica deptos por estado ──────────────────
  // El motor enriquece 3 piezas del Acto 0:
  //   FUEGO       → cards al tope del sub-hallazgo (si hay denuncia real)
  //                 o línea positiva (si métrica cargada con 0 confirmados)
  //                 o nada (si denuncias_12m=null en todos — null ≠ 0)
  //   HUMO        → cards en el cuerpo del sub-hallazgo, reemplazan la lista
  //                 anterior. Cross-ref con silencioConVozExterna por dept id.
  //   PUNTO_CIEGO → línea compacta DESPUÉS del sub-hallazgo con nombres.
  //   CONFIABLE   → no renderiza en este ciclo (diluiría el punch del hero).
  //   null        → no aparece acá (su voz vive en SectionConvergencia).
  const fuegoCards: Array<{ rs: DepartmentRiskScore; narrative: DepartmentRiskNarrative }> = [];
  const humoByDeptId = new Map<string, DepartmentRiskNarrative>();
  const puntoCiegoNames: string[] = [];
  let denunciaNullCount = 0;
  let denunciaLoadedZero = 0;
  let denunciaLoadedReal = 0;
  for (const rs of riskScores) {
    const d = rs.inputs.denuncias_12m;
    if (d === null) denunciaNullCount += 1;
    else if (d === 0) denunciaLoadedZero += 1;
    else if (d >= 1) denunciaLoadedReal += 1;
    const n = resolveDepartmentRiskNarrative(rs);
    if (!n) continue;
    if (n.state === 'FUEGO') fuegoCards.push({ rs, narrative: n });
    else if (n.state === 'HUMO') humoByDeptId.set(rs.departmentId, n);
    else if (n.state === 'PUNTO_CIEGO') puntoCiegoNames.push(rs.departmentName);
  }
  fuegoCards.sort((a, b) => b.rs.score - a.rs.score);
  puntoCiegoNames.sort((a, b) => a.localeCompare(b, 'es'));

  // FUEGO display mode (3 casos distinguidos por estado de la métrica):
  //   'cards'         → algún dept con denuncias_12m ≥ 1 → narrativa rica
  //   'positive_line' → métrica cargada en algún dept con 0 confirmados, sin reales
  //   'hidden'        → denuncias_12m=null en TODOS los deptos (métrica no cargada)
  let fuegoMode: 'cards' | 'positive_line' | 'hidden';
  if (denunciaLoadedReal > 0) fuegoMode = 'cards';
  else if (denunciaNullCount === riskScores.length) fuegoMode = 'hidden';
  else fuegoMode = 'positive_line';

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

  // Sub-hallazgo "El silencio que ya habla" — visible si:
  //   - hay frase de cruce (rama A), o
  //   - hay items de silencio con voz externa (HUMO cards), o
  //   - hay material de FUEGO para nombrar (cards o línea positiva).
  const showSubhallazgo =
    yaHabla.fraseCruce !== null ||
    yaHabla.lineas.length > 0 ||
    fuegoMode !== 'hidden';

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

        {/* Sub-hallazgo "EL SILENCIO QUE YA HABLA" — enriquecido con motor de voz */}
        {showSubhallazgo && (
          <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-8">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
              {SILENCIO_YA_HABLA_EYEBROW}
            </p>

            {/* FUEGO — al tope cuando hay denuncia real */}
            {fuegoMode === 'cards' && (
              <div className="space-y-3 mb-4">
                {fuegoCards.map(({ rs, narrative }) => (
                  <TerritorioCard
                    key={rs.departmentId}
                    deptName={rs.departmentName}
                    narrative={narrative}
                    country={country}
                  />
                ))}
              </div>
            )}
            {fuegoMode === 'positive_line' && (
              <p className="text-sm font-light text-slate-400 leading-relaxed mb-4 italic">
                0 denuncias formales confirmadas este ciclo.
              </p>
            )}

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

            {/* HUMO — cards per dept, reemplazo de la lista de <li> anterior.
                Cross-ref por departmentId: solo entran items cuyo riskScore
                resuelve a HUMO via el motor. Si el cross-ref falla → skip. */}
            {coverage.silencioConVozExterna.length > 0 && (
              <div className="space-y-3 mb-3">
                {coverage.silencioConVozExterna.map((item) => {
                  if (!item.departmentId) return null;
                  const narrative = humoByDeptId.get(item.departmentId);
                  if (!narrative) return null;
                  return (
                    <TerritorioCard
                      key={item.departmentId}
                      deptName={item.departmentName ?? 'Departamento sin nombre'}
                      narrative={narrative}
                      country={country}
                    />
                  );
                })}
              </div>
            )}

            {yaHabla.cierreSenales && (
              <p className="text-base font-light text-slate-400 leading-relaxed">
                {renderTokens(yaHabla.cierreSenales)}
              </p>
            )}
          </motion.div>
        )}

        {/* PUNTO_CIEGO — línea compacta DESPUÉS del sub-hallazgo */}
        {puntoCiegoNames.length > 0 && (
          <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-4">
            <p className="text-sm font-light text-slate-500 leading-relaxed">
              El resto del silencio ({puntoCiegoNames.length}{' '}
              {puntoCiegoNames.length === 1 ? 'área' : 'áreas'}) opera sin
              señales externas:{' '}
              <span className="text-slate-400">
                {puntoCiegoNames.join(', ')}
              </span>
              .
            </p>
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
// (Tooltip y LegalBadgePill se exportan desde ./shared para reuso cross-cascada
// y SectionConvergencia.)
// ════════════════════════════════════════════════════════════════════════════

/**
 * TerritorioCard — card per dept para FUEGO y HUMO dentro del sub-hallazgo.
 * Estados:
 *   FUEGO  → border ámbar pleno, chip solo con `Riesgo {score}`, LegalBadgePill.
 *   HUMO   → border ámbar atenuado, chip bimodal con Riesgo · Confiabilidad ·
 *            Alertas externas. LegalBadgePill SOLO cuando rama === 'A-legal'.
 * Estilo: card compacto rounded-12 con border-l ámbar (anti-semáforo: ámbar
 * para los dos territorios de alerta, distinguidos por opacidad).
 */
function TerritorioCard({
  deptName,
  narrative,
  country,
}: {
  deptName: string;
  narrative: DepartmentRiskNarrative;
  country: string | null | undefined;
}) {
  const isFuego = narrative.state === 'FUEGO';
  const isHumo = narrative.state === 'HUMO';
  const isALegal = isHumo && narrative.rama === 'A-legal';
  const showLegalPill = isFuego || isALegal;
  const showDrivers = isHumo;
  const borderClass = isFuego
    ? 'border-l-2 border-amber-400/90'
    : 'border-l-2 border-amber-400/50';
  return (
    <div
      className={cn('relative overflow-hidden rounded-[12px]', borderClass)}
      style={{
        background: '#0F172A',
        borderTop: '0.5px solid #1e293b',
        borderRight: '0.5px solid #1e293b',
        borderBottom: '0.5px solid #1e293b',
      }}
    >
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[14px] font-medium text-cyan-300">
            {deptName}
          </span>
          {showLegalPill && <LegalBadgePill country={country} />}
        </div>
        <p className="text-[13px] font-light text-slate-400 leading-relaxed">
          {narrative.narrativa}
        </p>
        <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 self-start px-2.5 py-1 rounded-sm bg-slate-900/60 border border-slate-700/60">
          <span className="text-[11px] font-mono text-slate-300">
            Riesgo{' '}
            <span className="text-purple-300 tabular-nums">
              {narrative.chip.score}
            </span>
          </span>
          {showDrivers && (
            <>
              <span className="text-[11px] font-mono text-slate-300">
                Confiabilidad{' '}
                <span className="text-purple-400 tabular-nums">
                  {narrative.chip.confiabilidad}
                </span>
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                Alertas externas{' '}
                <span className="text-purple-400 tabular-nums">
                  {narrative.chip.alertasExternas}
                </span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
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
