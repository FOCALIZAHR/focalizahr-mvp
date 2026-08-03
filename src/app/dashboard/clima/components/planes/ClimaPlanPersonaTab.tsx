'use client';

// src/app/dashboard/clima/components/planes/ClimaPlanPersonaTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Tab 2 — POR PERSONA (Gate 5D-ii). Orquestador: datos (by-person) + máquina de
// vistas Portada → Carrusel de responsables → Workspace, clonando el PATRÓN de
// navegación de Tab 1 con tokens CANÓNICOS (nunca los prohibidos de Tab 1).
//
// Unidad del carrusel = RESPONSABLE (Opción A, Victor): cada card = un líder con
// TODOS sus equipos juntos → integridad "por persona". El Workspace trae el Landing
// Card (contexto antes de la decisión) que arregla el anti-patrón del clic ciego.
//
// CERO literal: todo copy/umbral en climaTab2Content.ts.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, ArrowRight, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton';
import {
  TAB2_PORTADA,
  TAB2_CTA,
  TAB2_CARD,
  TAB2_CAROUSEL_COMPANION,
  TAB2_STATE_COPY,
  TAB2_META_GATE,
  TAB2_PDI_GATE,
  tab2DeptHeadline,
  tab2Synthesis,
  tab2TeamsSuffix,
} from '@/lib/constants/climaTab2Content';
import ClimaPersonaWorkspace, {
  type ResponsableGroup,
  type DeptFinding,
  type Tab2Action,
} from './ClimaPersonaWorkspace';
import ClimaFixMetaScreen from './ClimaFixMetaScreen';
import ClimaAtacarCausaScreen from './ClimaAtacarCausaScreen';

interface ByPersonData {
  responsables: ResponsableGroup[];
  stats: { responsablesConHallazgos: number; conCtaHabilitado: number; gateadosSinEmployee: number };
}

export type ClimaPlanPersonaView = 'portada' | 'carrusel' | 'workspace' | 'fixmeta' | 'atacarcausa';

interface Props {
  campaignId: string | null;
  /** Reporta la vista interna al shell (para ocultar su chrome en el Workspace/pantalla meta). */
  onViewChange?: (view: ClimaPlanPersonaView) => void;
}

const groupKeyOf = (g: ResponsableGroup) =>
  g.source === 'responsable' ? `emp:${g.employeeId}` : 'account_admin';

/** Prioridad: patrón extendido pesa más; luego, más focos primero. */
const groupPriority = (g: ResponsableGroup) => {
  const hasSystemic = g.departamentos.some((d) => d.route === 'ESTADO_B_PDI');
  return (hasSystemic ? 1_000_000 : 0) + g.departamentos.reduce((s, d) => s + d.belowTierCount, 0);
};
const deptPriority = (d: DeptFinding) => (d.route === 'ESTADO_B_PDI' ? 1_000_000 : 0) + d.belowTierCount;

export default function ClimaPlanPersonaTab({ campaignId, onViewChange }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ByPersonData | null>(null);
  const [view, setView] = useState<ClimaPlanPersonaView>('portada');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Fase 3 (Grupo D): plan de clima APROBADO de la campaña (§3.5) → sourceActionPlanId de la
  // meta. Su ausencia gatea el CTA meta (no rompe la vista). metaCtx = depto en curso; reloadKey
  // refresca by-person tras crear metas.
  const [approvedPlanId, setApprovedPlanId] = useState<string | null>(null);
  const [metaCtx, setMetaCtx] = useState<{ departmentId: string } | null>(null);
  const [pdiCtx, setPdiCtx] = useState<{ departmentId: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleAction: Tab2Action = (departmentId, _route, kind) => {
    if (kind === 'meta' && approvedPlanId) {
      setMetaCtx({ departmentId });
      setView('fixmeta');
    } else if (kind === 'pdi' && approvedPlanId) {
      // "Atacar la causa" (V2): abre la vista del responsable sobre el plan aprobado.
      setPdiCtx({ departmentId });
      setView('atacarcausa');
    }
  };

  useEffect(() => {
    if (!campaignId) {
      setStatus('error');
      setError('Seleccioná una campaña en el Rail para ver su plan por persona.');
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus('loading');
      setError(null);
      try {
        // by-person (hallazgos) + plan aprobado (sourceActionPlanId) en paralelo.
        const [bpRes, planRes] = await Promise.all([
          fetch(`/api/clima/action-plan/by-person?campaignId=${campaignId}`),
          fetch(`/api/action-plans?moduleType=clima&campaignId=${campaignId}&estado=aprobado`),
        ]);
        const json = await bpRes.json();
        if (cancelled) return;
        if (!json.success) {
          setStatus('error');
          setError(json.error ?? TAB2_STATE_COPY.error.description);
          return;
        }
        setData(json.data as ByPersonData);
        // El plan aprobado es opcional para la VISTA (solo gatea el CTA meta): su fallo no rompe.
        try {
          const planJson = await planRes.json();
          setApprovedPlanId(planJson?.success && planJson.data?.[0]?.id ? planJson.data[0].id : null);
        } catch {
          setApprovedPlanId(null);
        }
        setStatus('ready');
      } catch {
        if (!cancelled) {
          setStatus('error');
          setError(TAB2_STATE_COPY.error.description);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, reloadKey]);

  const ordered = useMemo(() => {
    const list = [...(data?.responsables ?? [])];
    list.sort((a, b) => groupPriority(b) - groupPriority(a));
    for (const g of list) g.departamentos.sort((a, b) => deptPriority(b) - deptPriority(a));
    return list;
  }, [data]);

  const synthesis = useMemo(() => {
    if (!data) return '';
    const total = data.responsables.length;
    const teamsTotal = data.responsables.reduce((s, g) => s + g.departamentos.length, 0);
    const gated = data.responsables.filter((g) => !g.ctaEnabled).length;
    const withSystemic = data.responsables.filter((g) =>
      g.departamentos.some((d) => d.route === 'ESTADO_B_PDI')
    ).length;
    return tab2Synthesis({ total, teamsTotal, gated, withSystemic, choiceOnly: total - withSystemic });
  }, [data]);

  // Reporta la vista al shell (bare en Workspace).
  useEffect(() => {
    onViewChange?.(view);
  }, [view, onViewChange]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-light">{TAB2_STATE_COPY.loading}</span>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <FHREmptyState type="requires" title={TAB2_STATE_COPY.error.title} description={error ?? TAB2_STATE_COPY.error.description} />
    );
  }
  if (ordered.length === 0) {
    return <FHREmptyState type="clear" title={TAB2_STATE_COPY.empty.title} description={TAB2_STATE_COPY.empty.description} />;
  }

  const selected = ordered.find((g) => groupKeyOf(g) === selectedKey) ?? null;

  // ── Pantalla de fijar meta (bare: trae su propio contenedor) — Fase 3 Grupo C/D ──
  if (view === 'fixmeta' && metaCtx && campaignId && approvedPlanId) {
    return (
      <ClimaFixMetaScreen
        campaignId={campaignId}
        departmentId={metaCtx.departmentId}
        sourceActionPlanId={approvedPlanId}
        onClose={() => {
          setMetaCtx(null);
          setView('workspace');
        }}
        onSuccess={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  // ── Pantalla "Atacar la causa" (bare: trae su propio contenedor) — V2 ──
  if (view === 'atacarcausa' && pdiCtx && approvedPlanId) {
    // Nombre del depto y del responsable para el header protagonista (RRHH debe saber
    // de quién es el plan). `selected` es el grupo abierto (selectedKey sigue seteado).
    const pdiDept = selected?.departamentos.find((d) => d.departmentId === pdiCtx.departmentId);
    return (
      <ClimaAtacarCausaScreen
        planId={approvedPlanId}
        departmentId={pdiCtx.departmentId}
        departmentName={pdiDept?.departmentName ?? ''}
        responsableName={selected?.name ?? ''}
        onClose={() => {
          setPdiCtx(null);
          setView('workspace');
        }}
      />
    );
  }

  // ── Workspace (bare: trae su propio contenedor) ──
  if (view === 'workspace' && selected) {
    return (
      <ClimaPersonaWorkspace
        group={selected}
        onAction={handleAction}
        metaEnabled={!!approvedPlanId}
        pdiEnabled={!!approvedPlanId}
        metaGateReason={approvedPlanId ? undefined : TAB2_META_GATE.needsApprovedPlan}
        pdiGateReason={approvedPlanId ? undefined : TAB2_PDI_GATE.needsApprovedPlan}
        onBack={() => {
          setSelectedKey(null);
          setView('carrusel');
        }}
      />
    );
  }

  // ── Portada (Estado 1): síntesis + 1 CTA ──
  if (view === 'portada') {
    return (
      <div className="py-6 md:py-10 flex flex-col items-center text-center max-w-2xl mx-auto">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-6">{TAB2_PORTADA.kicker}</span>
        <p className="text-[64px] md:text-[72px] font-extralight tabular-nums text-white leading-[0.9]">
          {ordered.length}
        </p>
        <p className="text-sm font-light text-slate-500 mb-5">
          {ordered.length === 1 ? 'responsable' : 'responsables'} {TAB2_PORTADA.heroSuffix}
        </p>
        <h2 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight">
          {TAB2_PORTADA.titleWhite} <span className="fhr-title-gradient">{TAB2_PORTADA.titleGradient}</span>
        </h2>
        <p className="text-base font-light text-slate-400 leading-relaxed mt-4 mb-8">{synthesis}</p>
        <PrimaryButton size="md" icon={ArrowRight} iconPosition="right" onClick={() => setView('carrusel')}>
          {TAB2_CTA.enterFromPortada}
        </PrimaryButton>
      </div>
    );
  }

  // ── Carrusel de responsables (Estado 2) ──
  const openWorkspace = (g: ResponsableGroup) => {
    setSelectedKey(groupKeyOf(g));
    setView('workspace');
  };
  // N=1 por FALLBACK admin (gated) → card + companion. N=1 real → solo card centrada.
  const showCompanion = ordered.length === 1 && !ordered[0].ctaEnabled;

  return (
    <div>
      <p className="text-[13px] font-light text-slate-400 leading-relaxed mb-5">{synthesis}</p>
      {showCompanion ? (
        <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
          <ResponsableCarouselCard group={ordered[0]} onOpen={() => openWorkspace(ordered[0])} />
          <CarouselCompanion />
        </div>
      ) : (
        // Centrado adaptativo: 1-3 se centran (negativo simétrico), 4+ arma grilla natural.
        <div className={cn('flex flex-wrap gap-4', ordered.length > 3 ? 'justify-start' : 'justify-center')}>
          {ordered.map((g) => (
            <ResponsableCarouselCard key={groupKeyOf(g)} group={g} onOpen={() => openWorkspace(g)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Card del carrusel (un responsable) — peso visual, acento NEUTRO (anti-semáforo) ──
function ResponsableCarouselCard({ group, onOpen }: { group: ResponsableGroup; onOpen: () => void }) {
  const top = group.departamentos[0]; // ya ordenado por prioridad
  const headline = tab2DeptHeadline(top.departmentName, top.route, top.belowTierDimensions);
  const hasSystemic = group.departamentos.some((d) => d.route === 'ESTADO_B_PDI');
  const count = group.departamentos.length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="group w-[320px] max-w-full text-left rounded-2xl border border-slate-800 bg-[#0F172A]/60 backdrop-blur-md p-5 relative overflow-hidden hover:border-slate-700 transition-colors"
    >
      {/* Tesla solo-cyan (canónico Cinema Mode, acento neutro — sin color por severidad) */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)' }}
      />
      {/* Ícono en cuadro (peso, como Tab 1) */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-slate-800/40">
        <Users className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-[10px] font-light uppercase tracking-wider text-slate-500 mb-1">{TAB2_CARD.kicker}</p>
      <p className="text-base font-light text-white leading-snug">{group.name}</p>
      {/* Número prominente */}
      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-2xl font-extralight tabular-nums text-white">{count}</span>
        <span className="text-xs text-slate-500">{tab2TeamsSuffix(count)}</span>
      </div>
      <div className="flex gap-1.5 mt-2 flex-wrap">
        {hasSystemic && (
          <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
            {TAB2_CARD.tagSystemic}
          </span>
        )}
        {!group.ctaEnabled && (
          <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-500/60 border border-slate-700/20 font-light">
            {TAB2_CARD.tagGated}
          </span>
        )}
      </div>
      <p className="text-[12px] font-light text-slate-500 leading-relaxed mt-2.5 line-clamp-2">{headline}</p>
      {/* Affordance de interactividad — la card no tenía señal de "clickeable" (el
          companion sí tiene su botón). Acento cyan + flecha, se refuerza en hover. */}
      <div className="flex items-center gap-1 mt-3 text-[11px] font-light text-cyan-400/80 group-hover:text-cyan-300 transition-colors">
        {TAB2_CARD.openCta} <ArrowRight className="w-3 h-3" />
      </div>
    </motion.button>
  );
}

// ── Companion del carrusel — SOLO N=1 por fallback admin (convierte el vacío en acción) ──
function CarouselCompanion() {
  return (
    <div className="w-[320px] max-w-full rounded-2xl border border-slate-800 bg-[#0F172A]/60 backdrop-blur-md p-5 flex flex-col">
      <p className="text-[10px] font-light uppercase tracking-wider text-slate-500 mb-2">
        {TAB2_CAROUSEL_COMPANION.kicker}
      </p>
      <p className="text-[13px] font-light text-slate-400 leading-relaxed flex-1">{TAB2_CAROUSEL_COMPANION.body}</p>
      <div className="mt-4">
        {/* Asignar responsable vive fuera de clima (org/nómina) → inerte acá por ahora. */}
        <SecondaryButton size="sm" icon={UserPlus} disabled>
          {TAB2_CTA.assign}
        </SecondaryButton>
      </div>
    </div>
  );
}
