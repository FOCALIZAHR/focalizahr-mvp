'use client';

// Header C3 — paradigma "certezas ejecutivas".
//
// Layout:
//   1. Tesla line — color según worst nivelFinal cross-deptos.
//   2. Síntesis ejecutiva — veredicto + lego del LLM (con fallback genérico).
//   3. Panel de Triage — 3 chips estratégicos:
//        ¿Localizado o cultural? · ¿Hay nombre? · ¿Hay patrón?
//
// Cero state machine, cero hero number, cero word-split. La narrativa
// editorial vivía en STATE_MACHINE_COPY — la reemplazamos por la síntesis
// LLM (`sintesisEjecutiva`) más los 3 chips de diagnóstico.

import type { MergedDept } from './_shared/helpers';
import type { NivelFinal } from '@/lib/services/compliance/ConvergenciaEngine';
import type { SintesisEjecutivaOutput } from '@/lib/services/compliance/SintesisConvergenciaLLMService';
import type { PatronNombre } from '@/lib/services/compliance/complianceTypes';
import { PATRON_LABELS } from '@/lib/services/compliance/ComplianceNarrativeEngine';

interface Props {
  /** Deptos con convergencia (filter ya aplicado por el padre). */
  deptos: MergedDept[];
  /**
   * P2 — Universo total de departamentos del account con al menos una
   * persona activa (filtra `Department.isActive` y `Employee.isActive`,
   * sin threshold de privacidad). Es el denominador del CHIP 1
   * ("Afecta X de Y áreas"). Para AREA_MANAGER se filtra por jerarquía.
   */
  totalDeptosUniverso: number;
  /** Flag org-level del meta-LLM. */
  esProblemaCultural: boolean;
  /** Count de grupos. AREA_MANAGER siempre recibe 0 por privacy. */
  criticalByManagerCount: number;
  /** Slug del patrón cultural — `'ninguno' | PatronNombre`. */
  patronCulturalDominante: string;
  /** LLM síntesis — undefined cae a fallback genérico (decisión 2b). */
  sintesisEjecutiva?: SintesisEjecutivaOutput;
}

// ════════════════════════════════════════════════════════════════════════════
// Tesla line — mapeo nivelFinal → color
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
// Fallback genérico (decisión 2b) — sin reintroducir state machine.
// ════════════════════════════════════════════════════════════════════════════

const FALLBACK_VEREDICTO =
  'El cierre de este ciclo no incluyó síntesis ejecutiva.';
const FALLBACK_LEGO =
  'Las señales agregadas se resumen en el panel inferior.';

// ════════════════════════════════════════════════════════════════════════════
// Resolución de chips
// ════════════════════════════════════════════════════════════════════════════

type ChipHeroColor = 'amber' | 'purple' | 'neutral';

interface ChipData {
  eyebrow: string;
  hero: string;
  heroColor: ChipHeroColor;
  caption: string;
}

function resolveChip1(
  esCultural: boolean,
  convergentes: number,
  total: number,
): ChipData {
  // Pluralización por denominador (Y) — más estable que pluralizar por X.
  const palabraArea = total === 1 ? 'área' : 'áreas';
  const caption = `Afecta ${convergentes} de ${total} ${palabraArea}`;
  return esCultural
    ? {
        eyebrow: '¿Localizado o cultural?',
        hero: 'Riesgo sistémico',
        heroColor: 'amber',
        caption,
      }
    : {
        eyebrow: '¿Localizado o cultural?',
        hero: 'Foco localizado',
        heroColor: 'neutral',
        caption,
      };
}

function resolveChip2(count: number): ChipData {
  return count > 0
    ? {
        eyebrow: '¿Hay nombre?',
        hero: 'Patrón de liderazgo',
        heroColor: 'purple',
        caption: 'Mismo mando, realidades distintas',
      }
    : {
        eyebrow: '¿Hay nombre?',
        hero: 'Sin patrón jerárquico',
        heroColor: 'neutral',
        caption: 'Fricción distribuida',
      };
}

function resolveChip3(slug: string): ChipData {
  // Sentinel 'ninguno' o slug no reconocido → "Múltiples focos" (decisión 4).
  if (slug === 'ninguno' || !(slug in PATRON_LABELS)) {
    return {
      eyebrow: '¿Hay patrón?',
      hero: 'Múltiples focos',
      heroColor: 'neutral',
      caption: 'Sin patrón único',
    };
  }
  return {
    eyebrow: '¿Hay patrón?',
    hero: PATRON_LABELS[slug as PatronNombre],
    heroColor: 'purple',
    caption: 'Patrón dominante',
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Subcomponente — chip de triage
// ════════════════════════════════════════════════════════════════════════════

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
      <p className="text-xs font-light text-slate-500 leading-snug">
        {data.caption}
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
  esProblemaCultural,
  criticalByManagerCount,
  patronCulturalDominante,
  sintesisEjecutiva,
}: Props) {
  const worstNivel = computeWorstNivelFinal(deptos);
  const tesla = teslaForNivelFinal(worstNivel);

  const deptosConvergentesCount = deptos.filter(
    (d) => d.nivelFinal !== 'ninguna',
  ).length;

  // Invariante esperada: convergentes ≤ universo. Si se viola (datos sucios
  // o desactivación de empleado entre ciclos), no distorsionamos la UI —
  // logueamos para investigación. La caption renderiza los números crudos.
  if (deptosConvergentesCount > totalDeptosUniverso) {
    console.warn(
      '[ConvergenciaOrgHeader] convergentes > universo — posible inconsistencia de datos:',
      { deptosConvergentesCount, totalDeptosUniverso },
    );
  }

  const veredictoText = sintesisEjecutiva?.veredicto ?? FALLBACK_VEREDICTO;
  const legoText = sintesisEjecutiva?.lego_narrativo ?? FALLBACK_LEGO;

  const chip1 = resolveChip1(
    esProblemaCultural,
    deptosConvergentesCount,
    totalDeptosUniverso,
  );
  const chip2 = resolveChip2(criticalByManagerCount);
  const chip3 = resolveChip3(patronCulturalDominante);

  return (
    <div
      className="relative overflow-hidden rounded-[20px]"
      style={{
        background: '#0F172A',
        border: '0.5px solid #1e293b',
      }}
    >
      {/* 1. Tesla line */}
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
        {/* 2. Síntesis ejecutiva */}
        <div className="flex flex-col gap-5">
          <p
            className="text-[13px] italic font-light leading-[1.6] pl-3"
            style={{
              color: '#64748b',
              borderLeft: '1px solid #1e293b',
            }}
          >
            {veredictoText}
          </p>
          <p
            className="text-sm font-light leading-[1.8]"
            style={{ color: '#cbd5e1' }}
          >
            {legoText}
          </p>
        </div>

        {/* 3. Panel de triage */}
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
