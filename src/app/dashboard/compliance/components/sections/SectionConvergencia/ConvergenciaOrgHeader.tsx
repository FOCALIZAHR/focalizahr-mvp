'use client';

// Header C3 — paradigma "State Machine determinista".
// El copy viene de STATE_MACHINE_COPY (5 estados editoriales fijos). La
// síntesis ejecutiva LLM fue deprecada — ver ComplianceAnalysisOrchestrator.
//
// Layout (en orden vertical):
//   1. Tesla line — color según worst nivelFinal (ortogonal al estado).
//   2. Contexto eyebrow + Titular word-split + Veredicto + Lego + Cierre —
//      todo del State Machine (STATE_MACHINE_COPY).
//   3. Cuerpo específico — cruceNarrativa (Motor 2) + criticalByManagerNarrativa
//      (Motor 3). Orden fijo Motor 2 → Motor 3 (decisión 4 de la sesión).
//   4. 3 chips de triage — sin captions; Chip 1 con threshold del scope.

import {
  classifyHeaderState,
  classifyConvergenciaScope,
  type ConvergenciaScope,
  type MergedDept,
} from './_shared/helpers';
import { STATE_MACHINE_COPY } from './_shared/STATE_MACHINE_COPY';
import type { NivelFinal } from '@/lib/services/compliance/ConvergenciaEngine';
import type { PatronNombre } from '@/lib/services/compliance/complianceTypes';
import { PATRON_LABELS } from '@/lib/services/compliance/ComplianceNarrativeEngine';

interface Props {
  /** Deptos con convergencia (filter ya aplicado por el padre). */
  deptos: MergedDept[];
  /**
   * P2 — Universo total de departamentos del account con al menos una
   * persona activa. Denominador del Chip 1. Para AREA_MANAGER se filtra
   * por jerarquía.
   */
  totalDeptosUniverso: number;
  /** Count de grupos. AREA_MANAGER siempre recibe 0 por privacy. */
  criticalByManagerCount: number;
  /** Slug del patrón cultural — `'ninguno' | PatronNombre`. */
  patronCulturalDominante: string;
  /**
   * Motor 2 — narrativa org-level del cruce cross-instrumento. Renderiza
   * en el cuerpo específico cuando produce. Optional: undefined si hay
   * <2 fuentes activas o sin material narrativo.
   */
  cruceNarrativa?: string;
  /**
   * Motor 3 — narrativa org-level del patrón de liderazgo. Renderiza en
   * el cuerpo específico debajo de Motor 2. Optional: route.ts la suprime
   * para AREA_MANAGER, undefined si no hay grupos criticalByManager.
   */
  criticalByManagerNarrativa?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Tesla line — mapeo nivelFinal → color (sin cambios, ortogonal al estado)
// ════════════════════════════════════════════════════════════════════════════

const NIVEL_FINAL_RANK: Record<NivelFinal, number> = {
  ninguna: 0,
  interna_solo: 1,
  externa_solo: 2,
  confirmada: 3,
  amplificada: 4,
  critica_sistema: 5,
};

interface TeslaConfig {
  gradient: string;
  glow: string;
  pulse: boolean;
}

function computeWorstNivelFinal(deptos: MergedDept[]): NivelFinal {
  let worst: NivelFinal = 'ninguna';
  for (const d of deptos) {
    if (NIVEL_FINAL_RANK[d.nivelFinal] > NIVEL_FINAL_RANK[worst]) {
      worst = d.nivelFinal;
    }
  }
  return worst;
}

function teslaForNivelFinal(nivel: NivelFinal): TeslaConfig {
  if (nivel === 'critica_sistema') {
    return {
      gradient:
        'linear-gradient(90deg, transparent, #EF4444 40%, #EF4444 60%, transparent)',
      glow: '0 0 12px rgba(239,68,68,0.55)',
      pulse: true,
    };
  }
  if (nivel === 'amplificada') {
    return {
      gradient:
        'linear-gradient(90deg, transparent, #F59E0B 40%, #FCD34D 60%, transparent)',
      glow: '0 0 10px rgba(245,158,11,0.35)',
      pulse: false,
    };
  }
  return {
    gradient:
      'linear-gradient(90deg, transparent, #22D3EE 40%, #A78BFA 60%, transparent)',
    glow: '0 0 10px rgba(34,211,238,0.35)',
    pulse: false,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Chips de triage — sub-líneas removidas (sesión 2026-05-10)
// ════════════════════════════════════════════════════════════════════════════

type ChipHeroColor = 'amber' | 'purple' | 'neutral';

interface ChipData {
  eyebrow: string;
  hero: string;
  heroColor: ChipHeroColor;
}

const SCOPE_HERO: Record<ConvergenciaScope, { hero: string; color: ChipHeroColor }> = {
  localizado: { hero: 'Localizado', color: 'neutral' },
  distribuido: { hero: 'Distribuido', color: 'purple' },
  sistemico: { hero: 'Sistémico', color: 'amber' },
};

function resolveChip1(convergentes: number, total: number): ChipData {
  const scope = classifyConvergenciaScope(convergentes, total);
  const { hero, color } = SCOPE_HERO[scope];
  return { eyebrow: '¿Localizado o cultural?', hero, heroColor: color };
}

function resolveChip2(count: number): ChipData {
  return count > 0
    ? { eyebrow: '¿Hay nombre?', hero: 'Patrón de liderazgo', heroColor: 'purple' }
    : { eyebrow: '¿Hay nombre?', hero: 'Sin patrón jerárquico', heroColor: 'neutral' };
}

function resolveChip3(slug: string): ChipData {
  if (slug === 'ninguno' || !(slug in PATRON_LABELS)) {
    return { eyebrow: '¿Hay patrón?', hero: 'Múltiples focos', heroColor: 'neutral' };
  }
  return {
    eyebrow: '¿Hay patrón?',
    hero: PATRON_LABELS[slug as PatronNombre],
    heroColor: 'purple',
  };
}

function ChipTriage({ data }: { data: ChipData }) {
  const heroClass =
    data.heroColor === 'amber'
      ? 'text-amber-400'
      : data.heroColor === 'purple'
        ? 'text-purple-400'
        : 'text-slate-200';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {data.eyebrow}
      </span>
      <p className={`text-base font-light leading-tight ${heroClass}`}>
        {data.hero}
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Componente principal
// ════════════════════════════════════════════════════════════════════════════

export default function ConvergenciaOrgHeader({
  deptos,
  totalDeptosUniverso,
  criticalByManagerCount,
  patronCulturalDominante,
  cruceNarrativa,
  criticalByManagerNarrativa,
}: Props) {
  const worstNivel = computeWorstNivelFinal(deptos);
  const tesla = teslaForNivelFinal(worstNivel);

  const deptosConvergentesCount = deptos.filter(
    (d) => d.nivelFinal !== 'ninguna',
  ).length;

  // Invariante esperada: convergentes ≤ universo. Si se viola (datos sucios
  // o desactivación de empleado entre ciclos), logueamos para investigación.
  if (deptosConvergentesCount > totalDeptosUniverso) {
    console.warn(
      '[ConvergenciaOrgHeader] convergentes > universo — posible inconsistencia de datos:',
      { deptosConvergentesCount, totalDeptosUniverso },
    );
  }

  // State Machine — clasificación con precedencia + lookup de copy aprobado.
  const state = classifyHeaderState(deptos);
  const copy = STATE_MACHINE_COPY[state];

  const chip1 = resolveChip1(deptosConvergentesCount, totalDeptosUniverso);
  const chip2 = resolveChip2(criticalByManagerCount);
  const chip3 = resolveChip3(patronCulturalDominante);

  const hasCuerpoEspecifico = Boolean(cruceNarrativa || criticalByManagerNarrativa);

  return (
    <div
      className="relative overflow-hidden rounded-[20px]"
      style={{
        background: '#0F172A',
        border: '0.5px solid #1e293b',
      }}
    >
      {/* 1. Tesla line — gobernada por worstNivelFinal, no por el estado del header */}
      <div
        className={`absolute top-0 left-0 right-0 h-px pointer-events-none ${
          tesla.pulse ? 'animate-pulse' : ''
        }`}
        style={{
          background: tesla.gradient,
          boxShadow: tesla.glow,
        }}
        aria-hidden="true"
      />

      <div className="px-7 py-8 flex flex-col gap-7">
        {/* 2. State Machine — contexto + titular + veredicto + lego + cierre */}
        <div className="flex flex-col gap-5">
          {/* Contexto eyebrow */}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {copy.contexto}
          </span>

          {/* Titular word-split (mobile-first: 3xl → 44px en md+) */}
          <div className="flex flex-col gap-0">
            <h2 className="text-3xl md:text-[44px] font-extralight text-white tracking-tight leading-tight">
              {copy.titularLine1}
            </h2>
            <p className="text-3xl md:text-[44px] font-extralight tracking-tight leading-tight fhr-title-gradient">
              {copy.titularLine2}
            </p>
          </div>

          {/* Veredicto italic */}
          <p
            className="text-[13px] italic font-light leading-[1.6] pl-3"
            style={{
              color: '#64748b',
              borderLeft: '1px solid #1e293b',
            }}
          >
            {copy.veredicto}
          </p>

          {/* Lego */}
          <p
            className="text-sm font-light leading-[1.8]"
            style={{ color: '#cbd5e1' }}
          >
            {copy.lego}
          </p>

          {/* Cierre (Regla 6) — párrafo aparte, italic para marcar el cierre */}
          {copy.cierre ? (
            <p
              className="text-sm italic font-light leading-[1.8]"
              style={{ color: '#cbd5e1' }}
            >
              {copy.cierre}
            </p>
          ) : null}
        </div>

        {/* 3. Cuerpo específico — Motor 2 (cruce) → Motor 3 (criticalByManager) */}
        {hasCuerpoEspecifico ? (
          <div
            className="flex flex-col gap-5 pt-6"
            style={{ borderTop: '0.5px solid #1e293b' }}
          >
            {cruceNarrativa ? (
              <p
                className="text-sm font-light leading-[1.8]"
                style={{ color: '#cbd5e1' }}
              >
                {cruceNarrativa}
              </p>
            ) : null}
            {criticalByManagerNarrativa ? (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Mismo mando, áreas distintas
                </span>
                <p
                  className="text-sm font-light leading-[1.8]"
                  style={{ color: '#cbd5e1' }}
                >
                  {criticalByManagerNarrativa}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 4. Panel de triage — 3 chips sin captions */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6"
          style={{ borderTop: '0.5px solid #1e293b' }}
        >
          <ChipTriage data={chip1} />
          <ChipTriage data={chip2} />
          <ChipTriage data={chip3} />
        </div>
      </div>
    </div>
  );
}
