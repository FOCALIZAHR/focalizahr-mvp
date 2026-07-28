'use client';

// src/app/dashboard/clima/components/planes/ClimaFixMetaScreen.tsx
// ════════════════════════════════════════════════════════════════════════════
// EX Clima — Gate 5D Fase 3 (Grupo C). Pantalla "Fijar meta sobre reactivo(s)".
// SPEC_UI_META_REACTIVO_v1 §1/§2 · patrón Wizard Aislado (Gate 0/1 aprobados).
//
// Se entra SOLO desde la elección del Workspace con kind='meta' (Paso 0 y Estado B ya viven
// en ClimaPersonaWorkspace → acá no se repiten). Es puramente el flujo de slider-cards.
// Tokens de CompensationPortada (slate-900/60 + Tesla cyan+purple), NO Cinema Mode: es un
// Wizard que reemplaza el contexto, no una inmersión avatar-por-avatar.
//
// Datos: GET /api/clima/action-plan/reactives (Grupo A). Submit: POST create-meta (Grupo B).
// Anti-semáforo: cero color por severidad. El número real es protagonista (herramienta de
// calibración; el %-de-avance es de la card de seguimiento, otra superficie — §3.3).
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import { CLIMA_GOAL_TARGET_MIN_DELTA } from '@/lib/services/clima/climaThresholds';
import {
  TAB2_META_SCREEN,
  TAB2_STATE_COPY,
  tab2MetaTitle,
  tab2MetaConfirmCta,
  tab2MetaSuccessBody,
} from '@/lib/constants/climaTab2Content';
import ClimaMetaSliderCard from './ClimaMetaSliderCard';

interface ReactiveDetail {
  reactive: string;
  category: string;
  mean: number;
  tier: number;
  questionText: string | null;
}

interface ClimaFixMetaScreenProps {
  campaignId: string;
  departmentId: string;
  sourceActionPlanId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const STEP = CLIMA_GOAL_TARGET_MIN_DELTA; // 0.2
const MAX_CARDS = 3; // ESTADO A: hasta 3 (SPEC_UI §1)
const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Rango del slider por reactivo (§2): min = hoy+delta, max = min(5, hoy+1.6), techo PROVISIONAL. */
function sliderBounds(mean: number): { min: number; max: number } {
  const min = round1(mean + STEP);
  const max = round1(Math.min(5, mean + 1.6));
  return { min, max: Math.max(max, min) };
}

function authHeaders(json = false): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null;
  return {
    ...(json ? { 'content-type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function ClimaFixMetaScreen({
  campaignId,
  departmentId,
  sourceActionPlanId,
  onClose,
  onSuccess,
}: ClimaFixMetaScreenProps) {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [reactives, setReactives] = useState<ReactiveDetail[]>([]);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [phase, setPhase] = useState<'calibrate' | 'success'>('calibrate');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch(
        `/api/clima/action-plan/reactives?campaignId=${encodeURIComponent(campaignId)}&departmentId=${encodeURIComponent(departmentId)}`,
        { headers: authHeaders(), credentials: 'include' }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'fetch');

      // Solo reactivos con texto de pregunta resuelto: sin él no hay description (kpiSource OWN
      // la exige) — se filtran defensivamente. Tope de 3 (ESTADO A).
      const list: ReactiveDetail[] = (json.data?.reactives ?? [])
        .filter((r: ReactiveDetail) => !!r.questionText)
        .slice(0, MAX_CARDS);

      const initialTargets: Record<string, number> = {};
      for (const r of list) initialTargets[r.reactive] = sliderBounds(r.mean).min;

      setReactives(list);
      setTargets(initialTargets);
      setExpanded(list[0]?.reactive ?? null); // arranca expandida la más crítica (primera)
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [campaignId, departmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback((reactive: string) => {
    setExpanded((cur) => (cur === reactive ? null : reactive)); // acordeón single-open
  }, []);

  const setTarget = useCallback((reactive: string, value: number) => {
    setTargets((cur) => ({ ...cur, [reactive]: value }));
  }, []);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/clima/action-plan/create-meta', {
        method: 'POST',
        headers: authHeaders(true),
        credentials: 'include',
        body: JSON.stringify({
          campaignId,
          departmentId,
          sourceActionPlanId,
          metas: reactives.map((r) => ({
            reactive: r.reactive,
            title: tab2MetaTitle(r.questionText as string),
            description: r.questionText as string,
            startValue: round1(r.mean),
            targetValue: targets[r.reactive],
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || TAB2_META_SCREEN.submitError);
      setCreatedCount(json.data?.count ?? reactives.length);
      setPhase('success');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : TAB2_META_SCREEN.submitError);
    } finally {
      setSubmitting(false);
    }
  }, [campaignId, departmentId, sourceActionPlanId, reactives, targets]);

  const n = reactives.length;

  // Chrome canónico (CompensationPortada): Tesla cyan+purple + glassmorphism slate.
  const shell = (children: ReactNode) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
            opacity: 0.7,
          }}
        />
        <button
          onClick={onClose}
          className="absolute top-5 left-5 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" /> {TAB2_META_SCREEN.cancel}
        </button>
        <div className="px-4 py-12 md:px-10 md:py-14">{children}</div>
      </div>
    </motion.div>
  );

  // ── Estados de carga / error / vacío ──
  if (status === 'loading') {
    return shell(
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-cyan-400 animate-spin" />
        <p className="text-sm font-light text-slate-400">{TAB2_META_SCREEN.loading}</p>
      </div>
    );
  }

  if (status === 'error') {
    return shell(
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <AlertTriangle className="w-8 h-8 text-slate-500" strokeWidth={1.5} />
        <div>
          <h3 className="text-slate-200 font-light text-base">{TAB2_META_SCREEN.error.title}</h3>
          <p className="text-sm font-light text-slate-500 mt-1">{TAB2_META_SCREEN.error.description}</p>
        </div>
        <PrimaryButton size="sm" onClick={load}>
          {TAB2_META_SCREEN.error.retry}
        </PrimaryButton>
      </div>
    );
  }

  if (n === 0) {
    return shell(
      <FHREmptyState
        type="clear"
        title={TAB2_STATE_COPY.empty.title}
        description={TAB2_STATE_COPY.empty.description}
        cta={{ label: TAB2_META_SCREEN.cancel, onClick: onClose }}
      />
    );
  }

  // ── Pantalla de éxito (Mandamiento 9: cierra y apunta a la siguiente) ──
  if (phase === 'success') {
    return shell(
      <div className="flex flex-col items-center text-center py-6">
        <CheckCircle2 className="w-10 h-10 text-cyan-400 mb-5" strokeWidth={1.5} />
        <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
          {TAB2_META_SCREEN.success.title}
        </h2>
        <p className="text-base font-light text-slate-400 leading-relaxed mt-4 max-w-md">
          {tab2MetaSuccessBody(createdCount)}
        </p>
        <div className="mt-10">
          <PrimaryButton
            onClick={() => {
              onSuccess?.();
              onClose();
            }}
          >
            {TAB2_META_SCREEN.success.cta}
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // ── Calibración: título + intro + N slider-cards + confirmar ──
  return shell(
    <div className="pt-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
          {TAB2_META_SCREEN.titleWhite}
        </h2>
        <p className="text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
          {TAB2_META_SCREEN.titleGradient}
        </p>
        <p className="text-base font-light text-slate-400 leading-relaxed mt-5 max-w-md mx-auto">
          {TAB2_META_SCREEN.intro}
        </p>
      </div>

      <div className="space-y-3">
        {reactives.map((r) => {
          const { min, max } = sliderBounds(r.mean);
          return (
            <ClimaMetaSliderCard
              key={r.reactive}
              questionText={r.questionText as string}
              current={r.mean}
              tier={r.tier}
              target={targets[r.reactive]}
              min={min}
              max={max}
              step={STEP}
              expanded={expanded === r.reactive}
              onToggle={() => toggle(r.reactive)}
              onChange={(v) => setTarget(r.reactive, v)}
            />
          );
        })}
      </div>

      {submitError && (
        <div className="flex items-start gap-2 mt-5 rounded-lg border border-slate-700/40 bg-slate-800/40 px-3 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[12px] font-light text-slate-300 leading-relaxed">{submitError}</p>
        </div>
      )}

      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-end gap-3 mt-8">
        <GhostButton onClick={onClose} disabled={submitting}>
          {TAB2_META_SCREEN.cancel}
        </GhostButton>
        <PrimaryButton onClick={submit} isLoading={submitting}>
          {tab2MetaConfirmCta(n)}
        </PrimaryButton>
      </div>
    </div>
  );
}
