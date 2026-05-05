'use client';

// ════════════════════════════════════════════════════════════════════════════
// SECTION PATRONES — "La Voz" (inteligencia cualitativa LLM)
// SectionPatrones.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bundle Claude Design: la_voz_refinada.html (Nivel 1) + la_voz_nivel2_final.html (Nivel 2).
//
// 2 ramas de render:
//   - patrones[]>0  → Nivel1Card (con patrón) + Nivel2Bandas
//   - patrones=[]   → Nivel1SinPatrones (ESCENARIO_A | _B) + Nivel2Bandas
//   Edge: data estructural vacía → return null (defensivo).
//
// Alerta género (Ley Karin): banda de sistema PRIMERA en el flujo (encima del
// Nivel 1) cuando alertasGenero.length > 0. Sin sticky — vive en el flujo normal.
// Tesla line amber + bg amber + border-top 2px. NO va embebida dentro del Nivel 1.
//
// ESCENARIO_A vs B se decide en `detectEscenario()`:
//   A = totalTextResponses>=30 + sanos>ciegos (logro de gestión).
//   B = otherwise (silencio estructural).
//   Fallback legacy (totalTextResponses=null) usa bucketDepartments() puro.
//
// Sin SectionShell — el bundle define su propio chrome (bg #0F172A border 0.5px,
// rounded 20px, tesla gradient purple→cyan). SectionShell duplica chrome y rompe
// la replicación literal del HTML.
//
// Cross-imports (TODO: extraer a sections/_shared/ cuando un 3er consumidor lo
// necesite):
//   - ORIGEN_LABELS desde SectionDimensiones/_shared/constants
//   - formatCyclePeriod desde SectionDimensiones/_shared/helpers
// ════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { Brain, ChevronDown } from 'lucide-react';

import {
  PATRONES_LLM,
  PATRONES_SIN_DATOS,
  type PatronCultural,
  type PatronesSinDatosEscenario,
} from '@/config/narratives/ComplianceNarrativeDictionary';
import { PATRON_LABELS } from '@/lib/services/compliance/ComplianceNarrativeEngine';
import { getGenderEscalationProtocol } from '@/config/compliance/genderEscalationConfig';

import { ORIGEN_LABELS } from './SectionDimensiones/_shared/constants';
import { formatCyclePeriod } from './SectionDimensiones/_shared/helpers';

import type {
  ComplianceReportDepartment,
  ComplianceReportDepartmentPatrones,
  GenderAlertDetail,
  MetaAnalysisOutput,
  PatronNarrative,
} from '@/types/compliance';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Divide un texto por "." seguido de espacio, preservando el punto en cada
 * fragmento. Mantiene el ritmo visual del bundle (4 párrafos para la mayoría
 * de los patrones; miedo_represalias produce 4 en vez de 3 — drift menor).
 */
function splitParagraphs(text: string): string[] {
  return text
    .split(/(?<=\.) /)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Heurística confianza ORG: ≥80% deptos del patrón con confianza='alta' → "Alta". */
function deriveOrgConfidence(
  patrones: PatronNarrative[],
  departments: ComplianceReportDepartment[],
): { label: string; isHigh: boolean } {
  if (patrones.length === 0) {
    return { label: 'Confianza media', isHigh: false };
  }
  const deptNamesInPattern = new Set(patrones[0].departments);
  const matching = departments.filter((d) =>
    deptNamesInPattern.has(d.departmentName),
  );
  if (matching.length === 0) {
    return { label: 'Confianza media', isHigh: false };
  }
  const altaCount = matching.filter(
    (d) => d.patrones?.confianza_analisis === 'alta',
  ).length;
  const ratio = altaCount / matching.length;
  return ratio >= 0.8
    ? { label: 'Alta confianza', isHigh: true }
    : { label: 'Confianza media', isHigh: false };
}

/** Confianza por DEPTO → label + color de dot. */
function deptConfidenceLabel(
  confianza: ComplianceReportDepartmentPatrones['confianza_analisis'],
): { label: string; dotColor: string } {
  switch (confianza) {
    case 'alta':
      return { label: 'Alta confianza', dotColor: '#34d399' };
    case 'media':
      return { label: 'Confianza media', dotColor: '#fbbf24' };
    case 'baja':
      return { label: 'Confianza baja', dotColor: '#f87171' };
    case 'insuficiente_data':
      return { label: 'Datos insuficientes', dotColor: '#475569' };
  }
}

/** Buckets para el orden estricto de bandas (Nivel 2). */
interface DeptBuckets {
  conPatron: ComplianceReportDepartment[];
  ciegos: ComplianceReportDepartment[];
  sanos: ComplianceReportDepartment[];
}

function bucketDepartments(
  departments: ComplianceReportDepartment[],
): DeptBuckets {
  const conPatron: ComplianceReportDepartment[] = [];
  const ciegos: ComplianceReportDepartment[] = [];
  const sanos: ComplianceReportDepartment[] = [];

  for (const d of departments) {
    const senal = d.patrones?.senal_dominante;
    const dominante = d.patrones?.patron_dominante;

    if (dominante) {
      conPatron.push(d);
    } else if (
      senal === 'datos_insuficientes' ||
      d.patrones === undefined // legacy/sin análisis → punto ciego (decisión 4a)
    ) {
      ciegos.push(d);
    } else if (senal === 'ambiente_sano') {
      sanos.push(d);
    } else {
      // Estado raro: patrones=[] sin senal_dominante explícita. Conservador → ciego.
      ciegos.push(d);
    }
  }

  conPatron.sort(
    (a, b) =>
      (b.patrones?.patron_dominante?.intensidad ?? 0) -
      (a.patrones?.patron_dominante?.intensidad ?? 0),
  );

  return { conPatron, ciegos, sanos };
}

/**
 * Decide ESCENARIO_A (logro de gestión) vs ESCENARIO_B (silencio estructural)
 * para el branch sin patrones. En este branch `conPatron.length === 0` por
 * definición (si hubiera patrón org-level, no estaríamos acá), así que la
 * comparación `sanos > ciegos` equivale a "mayoría sano".
 *
 * Path nuevo (totalTextResponses != null) usa el agregado backend post-deploy.
 * Fallback legacy usa solo el bucketing de departamentos.
 */
function detectEscenario(
  totalTextResponses: number | null,
  departments: ComplianceReportDepartment[],
): PatronesSinDatosEscenario {
  if (totalTextResponses !== null) {
    const sanos = departments.filter(
      (d) => d.patrones?.senal_dominante === 'ambiente_sano',
    ).length;
    const ciegos = departments.filter(
      (d) =>
        d.patrones?.senal_dominante === 'datos_insuficientes' ||
        d.patrones === undefined,
    ).length;
    return totalTextResponses >= 30 && sanos > ciegos
      ? 'ESCENARIO_A'
      : 'ESCENARIO_B';
  }
  const buckets = bucketDepartments(departments);
  return buckets.sanos.length > buckets.ciegos.length
    ? 'ESCENARIO_A'
    : 'ESCENARIO_B';
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIP — component local + diccionarios de copy
// ════════════════════════════════════════════════════════════════════════════

/**
 * Tooltip premium sin librería externa. Aparece encima del trigger al hover.
 * Tokens: bg-slate-900 + border-slate-700 + text-slate-300 (canónico ejecutivo).
 */
function Tooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show ? (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 z-50 pointer-events-none whitespace-normal text-left font-light leading-[1.4] shadow-xl"
          style={{ width: 'max-content', maxWidth: 220 }}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}

const PATRON_TOOLTIPS: Record<PatronCultural, string> = {
  silencio_organizacional:
    'El equipo conoce los problemas pero no los nombra. La información no llega donde debe llegar.',
  hostilidad_normalizada:
    'El trato duro se normalizó. Lo que el equipo describe como habitual, un externo lo llamaría maltrato.',
  favoritismo_implicito:
    'Las decisiones no responden al desempeño. El equipo percibe que las reglas no aplican igual para todos.',
  resignacion_aprendida:
    'El equipo dejó de creer que reportar produce cambio. Las encuestas se perciben como trámite.',
  miedo_represalias:
    'El equipo cree que hablar tiene consecuencias personales. El silencio es estratégico, no cultural.',
};

const CONFIANZA_TOOLTIPS: Record<
  'alta' | 'media' | 'baja' | 'insuficiente_data',
  string
> = {
  alta: 'Volumen suficiente para un análisis concluyente.',
  media:
    'Textos breves. Las señales son válidas pero el volumen no permite conclusión definitiva.',
  baja: 'Pocos respondentes escribieron texto. Las señales son indicativas, no concluyentes.',
  insuficiente_data: 'Datos por debajo del umbral mínimo para análisis.',
};

const INTENSIDAD_TOOLTIP =
  'Qué tan presente está este patrón en las respuestas. A mayor porcentaje, más personas lo expresaron de distintas formas.';

const ALCANCE_CULTURAL_TOOLTIP =
  'El patrón se repite en más de la mitad de las áreas. No es un problema localizado — está en el ambiente.';

const BRAIN_TOOLTIP =
  'Patrón detectado por análisis de inteligencia artificial sobre texto libre anónimo.';

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT — default export
// ════════════════════════════════════════════════════════════════════════════

export default function SectionPatrones({
  hook,
}: {
  hook: UseComplianceDataReturn;
}) {
  const report = hook.report;
  if (!report) return null;

  const patrones = report.narratives.artefacto2_patrones;
  const alertasGenero = report.narratives.alertasGenero;
  const meta = report.data.metaAnalysis;
  const departments = report.data.departments;
  const cyclePeriod = formatCyclePeriod(report.campaign);
  const totalTextResponses = report.data.totalTextResponses;
  const totalRespondents = report.data.totalRespondents;
  const country = report.company.country ?? null;

  // ─── Edge: data estructural vacía ───────────────────────────────────────
  if (
    departments.length === 0 &&
    patrones.length === 0 &&
    alertasGenero.length === 0
  ) {
    return null;
  }

  const hasPatron = patrones.length > 0;

  return (
    <div className="space-y-6">
      {/* Banda de sistema Ley Karin — primera en el flujo si existe */}
      {alertasGenero.length > 0 ? (
        <AlertaGeneroBanda alertas={alertasGenero} country={country} />
      ) : null}

      {hasPatron ? (
        <Nivel1Card
          patron={patrones[0]}
          meta={meta}
          departments={departments}
          cyclePeriod={cyclePeriod}
        />
      ) : (
        <Nivel1SinPatrones
          escenario={detectEscenario(totalTextResponses, departments)}
          departments={departments}
          totalTextResponses={totalTextResponses}
          totalRespondents={totalRespondents}
          cyclePeriod={cyclePeriod}
        />
      )}

      {departments.length > 0 ? <Nivel2Bandas departments={departments} /> : null}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NIVEL 1 — Card 60/40
// ════════════════════════════════════════════════════════════════════════════

function Nivel1Card({
  patron,
  meta,
  departments,
  cyclePeriod,
}: {
  patron: PatronNarrative;
  meta: MetaAnalysisOutput | null;
  departments: ComplianceReportDepartment[];
  cyclePeriod: string | null;
}) {
  // Editorial title + bloque central — confiamos en el tipo (decisión 7c)
  const patronKey = patron.nombre as PatronCultural;
  const titulo = PATRONES_LLM.titulares[patronKey];
  const bloqueCentral = PATRONES_LLM.bloquesCentrales[patronKey];

  const origenOrg = meta?.origen_organizacional ?? null;
  const bloqueOrigen = origenOrg ? PATRONES_LLM.bloquesOrigen[origenOrg] : undefined;
  // Skip pill "Origen" cuando es indeterminado/null — sin información que mostrar.
  const origenLabel =
    origenOrg && origenOrg !== 'indeterminado' ? ORIGEN_LABELS[origenOrg] : undefined;

  const esCultural = meta?.es_problema_cultural === true;
  const cierre = esCultural
    ? PATRONES_LLM.cierres.cultural
    : PATRONES_LLM.cierres.localizado;

  const confidence = deriveOrgConfidence([patron], departments);
  const totalRespondents = departments.reduce(
    (sum, d) => sum + (d.respondentCount ?? 0),
    0,
  );

  const intensidadPct = Math.round(patron.intensidad * 100);
  const alcanceLabel = esCultural
    ? `Riesgo cultural · ${patron.departments.length} ${patron.departments.length === 1 ? 'área' : 'áreas'}`
    : `Foco localizado · ${patron.departments.length} ${patron.departments.length === 1 ? 'área' : 'áreas'}`;

  const fragmentos = patron.fragmentos.slice(0, 3);
  const paragraphs = splitParagraphs(bloqueCentral);

  const statusValueParts: string[] = [];
  statusValueParts.push(`${totalRespondents} ${totalRespondents === 1 ? 'respuesta analizada' : 'respuestas analizadas'}`);
  if (cyclePeriod) statusValueParts.push(cyclePeriod);

  return (
    <div
      className="relative overflow-hidden rounded-[20px]"
      style={{
        background: '#0F172A',
        border: '0.5px solid #1e293b',
      }}
    >
      {/* Tesla line — gradient purple→cyan */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, #A78BFA 40%, #22D3EE 60%, transparent)',
          boxShadow: '0 0 10px rgba(167,139,250,0.35)',
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
          style={{
            background: confidence.isHigh ? '#34d399' : '#fbbf24',
          }}
          aria-hidden="true"
        />
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
          Señal
        </span>
        <span className="text-[10px] text-slate-500 font-normal">
          <Tooltip text={CONFIANZA_TOOLTIPS[confidence.isHigh ? 'alta' : 'media']}>
            <span className="cursor-help underline decoration-dotted decoration-slate-700 underline-offset-2">
              {confidence.label}
            </span>
          </Tooltip>
          {' '}· {statusValueParts.join(' · ')}
        </span>
      </div>

      {/* MAIN 60/40 */}
      <div className="grid grid-cols-1 md:grid-cols-[60fr_40fr] min-h-[460px]">
        {/* LEFT 60% */}
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
              {titulo.primera}
            </span>
            <span
              className="block text-[44px] font-extralight"
              style={{ color: '#A78BFA' }}
            >
              {titulo.segunda}
            </span>
          </div>

          {/* Veredicto LLM (cursiva con border-left) — skip si meta null */}
          {meta?.hallazgo_narrativo_portada ? (
            <p
              className="text-[13px] italic font-light leading-[1.6] pl-3"
              style={{
                color: '#64748b',
                borderLeft: '1px solid #1e293b',
              }}
            >
              &ldquo;{meta.hallazgo_narrativo_portada}&rdquo;
            </p>
          ) : null}

          {/* Legos en flujo continuo */}
          <div className="flex flex-col">
            <div
              className="text-sm font-light leading-[1.8]"
              style={{ color: '#cbd5e1' }}
            >
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={i < paragraphs.length - 1 ? 'mb-3' : ''}
                >
                  {p}
                </p>
              ))}
              {bloqueOrigen ? <p className="mt-3">{bloqueOrigen}</p> : null}
            </div>

            {/* Cierre — peso 400, mismo color */}
            <p
              className="text-sm font-normal leading-[1.8] mt-3"
              style={{ color: '#cbd5e1' }}
            >
              {cierre}
            </p>
          </div>
        </div>

        {/* RIGHT 40% */}
        <div
          className="flex flex-col gap-6 px-6 py-7"
          style={{ background: 'rgba(10,16,30,0.4)' }}
        >
          {/* Radar */}
          <div className="flex flex-col gap-3.5">
            <RadarItem label="Patrón">
              <span className="inline-flex items-center gap-1.5">
                <Tooltip text={BRAIN_TOOLTIP}>
                  <Brain
                    size={14}
                    strokeWidth={1.5}
                    className="cursor-help shrink-0"
                    style={{ color: '#A78BFA' }}
                    aria-hidden="true"
                  />
                </Tooltip>
                <Tooltip text={PATRON_TOOLTIPS[patronKey]}>
                  <span
                    className="text-[13px] font-light cursor-help"
                    style={{ color: '#A78BFA' }}
                  >
                    {patron.nombreLegible}
                  </span>
                </Tooltip>
              </span>
            </RadarItem>
            <RadarItem label="Intensidad">
              <Tooltip text={INTENSIDAD_TOOLTIP}>
                <span className="cursor-help">
                  <span
                    className="text-[28px] font-extralight tabular-nums leading-none"
                    style={{ color: '#A78BFA' }}
                  >
                    {intensidadPct}
                  </span>
                  <span
                    className="text-xs font-light"
                    style={{ color: '#334155' }}
                  >
                    {' '}
                    %
                  </span>
                </span>
              </Tooltip>
            </RadarItem>
            <RadarItem label="Alcance">
              {esCultural ? (
                <Tooltip text={ALCANCE_CULTURAL_TOOLTIP}>
                  <span className="cursor-help">
                    <Pill variant="purple">{alcanceLabel}</Pill>
                  </span>
                </Tooltip>
              ) : (
                <Pill variant="purple">{alcanceLabel}</Pill>
              )}
            </RadarItem>
            {origenLabel ? (
              <RadarItem label="Origen">
                <Pill variant="slate">{origenLabel}</Pill>
              </RadarItem>
            ) : null}
          </div>

          <div className="h-px" style={{ background: '#1e293b' }} />

          {/* Fragmentos */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2.5"
              style={{ color: '#334155' }}
            >
              Lo que escuchamos
            </p>
            <div className="flex flex-col gap-1.5">
              {fragmentos.map((f, i) => (
                <FragmentoBox key={i} text={f} />
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NIVEL 1 — Card 60/40 sin patrones (ESCENARIO_A / ESCENARIO_B)
// ════════════════════════════════════════════════════════════════════════════

function Nivel1SinPatrones({
  escenario,
  departments,
  totalTextResponses,
  totalRespondents,
  cyclePeriod,
}: {
  escenario: PatronesSinDatosEscenario;
  departments: ComplianceReportDepartment[];
  totalTextResponses: number | null;
  totalRespondents: number | null;
  cyclePeriod: string | null;
}) {
  const narrativa = PATRONES_SIN_DATOS[escenario];
  const isA = escenario === 'ESCENARIO_A';

  const buckets = useMemo(() => bucketDepartments(departments), [departments]);

  // Volumen para el stat de A y para el status bar.
  // Prioridad: totalTextResponses (backend nuevo) → totalRespondents → sum dept.
  const respuestasProcesadas =
    totalTextResponses ??
    totalRespondents ??
    departments.reduce((sum, d) => sum + (d.respondentCount ?? 0), 0);

  const paragraphs = splitParagraphs(narrativa.lego);

  // Status bar: A celebra el volumen, B reporta inconcluso.
  const statusParts: string[] = isA
    ? [
        `${respuestasProcesadas} ${respuestasProcesadas === 1 ? 'respuesta analizada' : 'respuestas analizadas'}`,
      ]
    : ['Análisis no concluyente'];
  if (cyclePeriod) statusParts.push(cyclePeriod);

  // Tesla por escenario.
  const teslaBg = isA
    ? 'linear-gradient(90deg, transparent, #A78BFA 40%, #22D3EE 60%, transparent)'
    : 'linear-gradient(90deg, transparent, #334155 40%, #475569 60%, transparent)';
  const teslaShadow = isA ? '0 0 10px rgba(167,139,250,0.35)' : 'none';

  // Status dot por escenario.
  const dotColor = isA ? '#34d399' : '#475569';
  const statusEyebrow = isA ? 'Estado' : 'Señal';

  return (
    <div
      className="relative overflow-hidden rounded-[20px]"
      style={{
        background: '#0F172A',
        border: '0.5px solid #1e293b',
      }}
    >
      {/* Tesla line — variante por escenario */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: teslaBg,
          boxShadow: teslaShadow,
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
          style={{ background: dotColor }}
          aria-hidden="true"
        />
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
          {statusEyebrow}
        </span>
        <span className="text-[10px] text-slate-500 font-normal">
          {statusParts.join(' · ')}
        </span>
      </div>

      {/* MAIN 60/40 */}
      <div className="grid grid-cols-1 md:grid-cols-[60fr_40fr] min-h-[460px]">
        {/* LEFT 60% */}
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
              {narrativa.titular.primera}
            </span>
            <span
              className="block text-[44px] font-extralight"
              style={{ color: '#A78BFA' }}
            >
              {narrativa.titular.segunda}
            </span>
          </div>

          {/* Veredicto (cursiva con border-left) */}
          <p
            className="text-[13px] italic font-light leading-[1.6] pl-3"
            style={{
              color: '#475569',
              borderLeft: '1px solid #1e293b',
            }}
          >
            &ldquo;{narrativa.veredicto}&rdquo;
          </p>

          {/* Lego + cierre como sentencia firme */}
          <div className="flex flex-col">
            <div
              className="text-sm font-light leading-[1.8]"
              style={{ color: '#cbd5e1' }}
            >
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={i < paragraphs.length - 1 ? 'mb-3' : ''}
                >
                  {p}
                </p>
              ))}
            </div>
            <p
              className="text-sm font-normal leading-[1.8] mt-3"
              style={{ color: '#cbd5e1' }}
            >
              {narrativa.cierre}
            </p>
          </div>
        </div>

        {/* RIGHT 40% */}
        {isA ? (
          <ColumnaDerechaSano
            respuestas={respuestasProcesadas}
            sanos={buckets.sanos}
          />
        ) : (
          <ColumnaDerechaCiego ciegos={buckets.ciegos} />
        )}
      </div>

    </div>
  );
}

// ─── Sub-components Nivel1SinPatrones ───────────────────────────────────────

function ColumnaDerechaSano({
  respuestas,
  sanos,
}: {
  respuestas: number;
  sanos: ComplianceReportDepartment[];
}) {
  return (
    <div
      className="flex flex-col gap-6 px-6 py-7"
      style={{ background: 'rgba(10,16,30,0.4)' }}
    >
      <StatHero
        valor={respuestas}
        label={respuestas === 1 ? 'respuesta procesada' : 'respuestas procesadas'}
      />
      <div className="h-px" style={{ background: '#1e293b' }} />
      <StatHero valor={0} label="marcadores de riesgo" />
      <div className="h-px" style={{ background: '#1e293b' }} />
      <div>
        <p
          className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2.5"
          style={{ color: '#334155' }}
        >
          Áreas analizadas
        </p>
        {sanos.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {sanos.map((d) => (
              <PillDeptSano key={d.departmentId} name={d.departmentName} />
            ))}
          </div>
        ) : (
          <p className="text-xs font-light" style={{ color: '#334155' }}>
            Sin áreas con análisis sano confirmado.
          </p>
        )}
      </div>
    </div>
  );
}

function ColumnaDerechaCiego({
  ciegos,
}: {
  ciegos: ComplianceReportDepartment[];
}) {
  return (
    <div
      className="flex flex-col gap-6 px-6 py-7"
      style={{
        background: `repeating-linear-gradient(
          45deg,
          rgba(10,15,28,0.4),
          rgba(10,15,28,0.4) 4px,
          rgba(15,23,42,0.2) 4px,
          rgba(15,23,42,0.2) 8px
        )`,
      }}
    >
      <div>
        <p
          className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2"
          style={{ color: '#334155' }}
        >
          Tasa de participación
        </p>
        <p
          className="text-base font-light leading-tight"
          style={{ color: '#64748b' }}
        >
          Insuficiente
        </p>
      </div>
      <div className="h-px" style={{ background: '#1e293b' }} />
      <div>
        <p
          className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2.5"
          style={{ color: '#334155' }}
        >
          Áreas sin material
        </p>
        {ciegos.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {ciegos.map((d) => (
              <PillDeptCiego key={d.departmentId} name={d.departmentName} />
            ))}
          </div>
        ) : (
          <p className="text-xs font-light" style={{ color: '#334155' }}>
            Sin áreas registradas como punto ciego.
          </p>
        )}
      </div>
    </div>
  );
}

function StatHero({ valor, label }: { valor: number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[28px] font-extralight tabular-nums leading-none"
        style={{ color: '#34d399' }}
      >
        {valor}
      </span>
      <span className="text-xs font-light" style={{ color: '#64748b' }}>
        {label}
      </span>
    </div>
  );
}

function PillDeptSano({ name }: { name: string }) {
  return (
    <span
      className="inline-flex px-2.5 py-[3px] rounded-[20px] text-[10px] font-bold tracking-[0.1em] uppercase"
      style={{
        background: 'rgba(52,211,153,0.06)',
        border: '0.5px solid rgba(52,211,153,0.15)',
        color: '#34d399',
      }}
    >
      {name}
    </span>
  );
}

function PillDeptCiego({ name }: { name: string }) {
  return (
    <span
      className="inline-flex px-2.5 py-[3px] rounded-[20px] text-[10px] font-bold tracking-[0.1em] uppercase"
      style={{
        background: 'rgba(71,85,105,0.15)',
        border: '0.5px solid rgba(71,85,105,0.3)',
        color: '#475569',
      }}
    >
      {name}
    </span>
  );
}

// ─── Sub-components Nivel 1 ─────────────────────────────────────────────────

function RadarItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="text-[10px] uppercase tracking-[0.15em] font-bold w-[70px] shrink-0"
        style={{ color: '#334155' }}
      >
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Pill({
  variant,
  children,
}: {
  variant: 'purple' | 'slate';
  children: React.ReactNode;
}) {
  const styles =
    variant === 'purple'
      ? {
          background: 'rgba(167,139,250,0.08)',
          border: '0.5px solid rgba(167,139,250,0.2)',
          color: '#A78BFA',
        }
      : {
          background: 'rgba(100,116,139,0.08)',
          border: '0.5px solid rgba(100,116,139,0.2)',
          color: '#64748b',
        };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-[20px] text-[11px] font-light"
      style={styles}
    >
      {children}
    </span>
  );
}

function FragmentoBox({ text }: { text: string }) {
  // Resaltar [CENSURADO] en color más tenue
  const parts = text.split(/(\[CENSURADO\])/g);
  return (
    <div
      className="px-3 py-2.5 rounded-lg font-mono italic text-xs leading-[1.5]"
      style={{
        background: '#070d1a',
        border: '0.5px solid rgba(167,139,250,0.12)',
        color: '#64748b',
      }}
    >
      &ldquo;
      {parts.map((p, i) =>
        p === '[CENSURADO]' ? (
          <span key={i} style={{ color: '#334155' }}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
      &rdquo;
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NIVEL 2 — Bandas tácticas por departamento
// ════════════════════════════════════════════════════════════════════════════

function Nivel2Bandas({
  departments,
}: {
  departments: ComplianceReportDepartment[];
}) {
  const buckets = useMemo(() => bucketDepartments(departments), [departments]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((curr) => (curr === id ? null : id));

  // Total bandas (para detectar la última y omitir border-bottom)
  const allBandasIds = [
    ...buckets.conPatron.map((d) => d.departmentId),
    ...buckets.ciegos.map((d) => d.departmentId),
    ...buckets.sanos.map((d) => d.departmentId),
  ];
  const lastBandaId = allBandasIds[allBandasIds.length - 1];

  return (
    <div
      className="rounded-[20px] overflow-hidden"
      style={{
        background: '#0F172A',
        border: '0.5px solid #1e293b',
      }}
    >
      {/* Section header */}
      <div
        className="px-7 py-3.5"
        style={{ borderBottom: '0.5px solid #1e293b' }}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold"
          style={{ color: '#334155' }}
        >
          Desglose táctico por área
        </span>
      </div>

      {/* Bandas patrón */}
      {buckets.conPatron.map((dept) => (
        <BandaPatron
          key={dept.departmentId}
          dept={dept}
          isExpanded={expandedId === dept.departmentId}
          isLast={lastBandaId === dept.departmentId}
          onToggle={() => toggle(dept.departmentId)}
        />
      ))}

      {/* Bandas ciego */}
      {buckets.ciegos.map((dept) => (
        <BandaCiego
          key={dept.departmentId}
          dept={dept}
          isLast={lastBandaId === dept.departmentId}
        />
      ))}

      {/* Bandas sano */}
      {buckets.sanos.map((dept) => (
        <BandaSano
          key={dept.departmentId}
          dept={dept}
          isLast={lastBandaId === dept.departmentId}
        />
      ))}
    </div>
  );
}

// ─── Bandas ─────────────────────────────────────────────────────────────────

function BandaPatron({
  dept,
  isExpanded,
  isLast,
  onToggle,
}: {
  dept: ComplianceReportDepartment;
  isExpanded: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  const dominante = dept.patrones?.patron_dominante;
  if (!dominante) return null;

  // Skip render del sub-label cuando origen es indeterminado — sin valor diagnóstico.
  const origenLabel =
    dominante.origen_percibido !== 'indeterminado'
      ? ORIGEN_LABELS[dominante.origen_percibido] ?? null
      : null;
  const intensidadPct = Math.round(dominante.intensidad * 100);
  const fragmentoPreview = dominante.fragmentos[0] ?? '';
  const fragmentosExtra = dominante.fragmentos.slice(1, 3);

  const confianza = dept.patrones?.confianza_analisis;
  const confInfo = confianza ? deptConfidenceLabel(confianza) : null;

  const respondentCount = dept.respondentCount ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full grid grid-cols-[1fr] md:grid-cols-[200px_160px_1fr] items-center gap-3 md:gap-5 px-7 py-4 cursor-pointer text-left transition-colors duration-150 hover:bg-white/[0.02]"
        style={{
          background: isExpanded
            ? 'rgba(10,15,28,0.7)'
            : 'rgba(10,15,28,0.4)',
          borderBottom: isLast && !isExpanded ? 'none' : '0.5px solid #0d1520',
        }}
      >
        <div>
          <div
            className="text-[13px] font-normal mb-0.5"
            style={{ color: '#e2e8f0' }}
          >
            {dept.departmentName}
          </div>
          {origenLabel ? (
            <div
              className="text-[10px] font-light tracking-[0.05em]"
              style={{ color: '#334155' }}
            >
              {origenLabel}
            </div>
          ) : null}
        </div>

        <div>
          <div
            className="text-[28px] font-extralight tabular-nums leading-none"
            style={{ color: '#A78BFA' }}
          >
            {intensidadPct}
            <span className="text-sm" style={{ color: '#334155' }}>
              %
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 mt-0.5"
            style={{ color: '#7c6ab5' }}
          >
            <Tooltip text={BRAIN_TOOLTIP}>
              <Brain
                size={14}
                strokeWidth={1.5}
                className="cursor-help shrink-0"
                style={{ color: '#A78BFA' }}
                aria-hidden="true"
              />
            </Tooltip>
            <Tooltip text={PATRON_TOOLTIPS[dominante.nombre as PatronCultural]}>
              <span className="text-[11px] font-light cursor-help">
                {dominante.nombreLegible}
              </span>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <div
            className="font-mono italic text-xs leading-[1.5] truncate"
            style={{ color: '#64748b' }}
          >
            {renderFragmentWithCensored(fragmentoPreview)}
          </div>
          <ChevronDown
            className="w-3.5 h-3.5 shrink-0 ml-auto transition-transform duration-200"
            style={{
              color: '#334155',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Banda expandida */}
      {isExpanded ? (
        <div
          className="flex flex-col gap-2 px-7 pb-4"
          style={{
            background: 'rgba(10,15,28,0.7)',
            borderBottom: isLast ? 'none' : '0.5px solid #0d1520',
          }}
        >
          {fragmentosExtra.map((f, i) => (
            <div
              key={i}
              className="px-3 py-2 rounded-lg font-mono italic text-[11px]"
              style={{
                background: '#070d1a',
                border: '0.5px solid rgba(167,139,250,0.1)',
                color: '#64748b',
              }}
            >
              {renderFragmentWithCensored(f)}
            </div>
          ))}
          {confInfo && confianza ? (
            <div
              className="inline-flex items-center gap-1.5 mt-1 text-[10px] uppercase tracking-[0.1em]"
              style={{ color: '#334155' }}
            >
              <span
                className="w-[5px] h-[5px] rounded-full shrink-0"
                style={{ background: confInfo.dotColor }}
                aria-hidden="true"
              />
              <Tooltip text={CONFIANZA_TOOLTIPS[confianza]}>
                <span className="cursor-help underline decoration-dotted decoration-slate-700 underline-offset-2">
                  {confInfo.label}
                </span>
              </Tooltip>
              {' '}· {respondentCount}{' '}
              {respondentCount === 1 ? 'respuesta' : 'respuestas'}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function BandaCiego({
  dept,
  isLast,
}: {
  dept: ComplianceReportDepartment;
  isLast: boolean;
}) {
  const hasAnalysis = dept.patrones !== undefined;
  const explainText = hasAnalysis
    ? 'El volumen de participación no superó el umbral mínimo. La baja respuesta puede ser en sí misma una señal.'
    : 'Sin análisis disponible para este departamento en este ciclo.';

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[200px_160px_1fr] items-center gap-3 md:gap-5 px-7 py-4"
      style={{
        background: `repeating-linear-gradient(
          45deg,
          rgba(10,15,28,0.4),
          rgba(10,15,28,0.4) 4px,
          rgba(15,23,42,0.2) 4px,
          rgba(15,23,42,0.2) 8px
        )`,
        borderBottom: isLast ? 'none' : '0.5px solid #0d1520',
      }}
    >
      <div>
        <div
          className="text-[13px] font-normal mb-0.5"
          style={{ color: '#475569' }}
        >
          {dept.departmentName}
        </div>
        <div
          className="text-[10px] font-light tracking-[0.05em]"
          style={{ color: '#334155' }}
        >
          Sin datos suficientes
        </div>
      </div>

      <div>
        <span
          className="inline-flex px-2.5 py-[3px] rounded-[20px] text-[10px] font-bold tracking-[0.1em] uppercase"
          style={{
            background: 'rgba(71,85,105,0.15)',
            border: '0.5px solid rgba(71,85,105,0.3)',
            color: '#475569',
          }}
        >
          Punto ciego
        </span>
      </div>

      <div
        className="text-xs font-light leading-[1.5]"
        style={{ color: '#334155' }}
      >
        {explainText}
      </div>
    </div>
  );
}

function BandaSano({
  dept,
  isLast,
}: {
  dept: ComplianceReportDepartment;
  isLast: boolean;
}) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[200px_160px_1fr] items-center gap-3 md:gap-5 px-7 py-4"
      style={{
        opacity: 0.45,
        borderBottom: isLast ? 'none' : '0.5px solid #0d1520',
      }}
    >
      <div>
        <div className="text-[13px] font-normal mb-0.5"
          style={{ color: '#e2e8f0' }}
        >
          {dept.departmentName}
        </div>
        <div
          className="text-[10px] font-light tracking-[0.05em]"
          style={{ color: '#334155' }}
        >
          Sin focos detectados
        </div>
      </div>

      <div>
        <span
          className="inline-flex px-2.5 py-[3px] rounded-[20px] text-[10px] font-bold tracking-[0.1em] uppercase"
          style={{
            background: 'rgba(52,211,153,0.06)',
            border: '0.5px solid rgba(52,211,153,0.15)',
            color: '#34d399',
          }}
        >
          Ambiente sano
        </span>
      </div>

      <div className="text-xs font-light"
        style={{ color: '#334155' }}
      >
        Sin patrones de riesgo en el análisis de texto libre.
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ALERTA GÉNERO — card por alerta con header + body 2 cols + footer escalación
// ════════════════════════════════════════════════════════════════════════════

function AlertaGeneroBanda({
  alertas,
  country,
}: {
  alertas: GenderAlertDetail[];
  country: string | null;
}) {
  return (
    <div className="space-y-3">
      {alertas.map((a) => (
        <AlertaGeneroCard key={a.departmentName} alerta={a} country={country} />
      ))}
    </div>
  );
}

/** Strip quotes que el LLM agrega en evidencia_genero — evita doble-wrap con renderFragmentWithCensored. */
function stripWrappingQuotes(text: string): string {
  return text.trim().replace(/^["“”]+|["“”]+$/g, '');
}

function AlertaGeneroCard({
  alerta,
  country,
}: {
  alerta: GenderAlertDetail;
  country: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const evidenciaClean = stripWrappingQuotes(alerta.evidenciaGenero ?? '');
  const hasEvidencia = evidenciaClean.length > 0;
  const analisis = alerta.analisisGenero ?? alerta.contextoGenero ?? '';
  const protocolo = getGenderEscalationProtocol(country);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: '#0F172A',
        border: '0.5px solid rgba(245,158,11,0.25)',
      }}
    >
      {/* Tesla amber */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, #F59E0B 40%, #D97706 60%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Header — clickeable expand/collapse */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-2.5 px-5 py-3.5 cursor-pointer select-none transition-colors hover:bg-[rgba(245,158,11,0.03)]"
      >
        <span
          className="relative flex h-2.5 w-2.5 flex-shrink-0"
          aria-hidden="true"
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
        </span>
        <span
          className="flex-1 text-[12px] uppercase tracking-[0.12em] font-bold text-left"
          style={{ color: '#fbbf24' }}
        >
          Hallazgo de género detectado en{' '}
          <strong style={{ color: '#fde68a', fontWeight: 700 }}>
            {alerta.departmentName}
          </strong>
          {alerta.parentDepartmentName ? (
            <>
              {' '}
              ·{' '}
              <strong style={{ color: '#fde68a', fontWeight: 700 }}>
                {alerta.parentDepartmentName}
              </strong>
            </>
          ) : null}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className={`shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          style={{ color: '#475569' }}
          aria-hidden="true"
        />
      </button>

      {/* Body — expandible */}
      {expanded ? (
        <div style={{ borderTop: '0.5px solid rgba(245,158,11,0.1)' }}>
          <div
            className={`grid gap-4 px-5 py-4 ${
              hasEvidencia ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {hasEvidencia ? (
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2"
                  style={{ color: '#64748b' }}
                >
                  Fragmento literal
                </p>
                <div
                  className="px-3 py-2.5 rounded-lg font-mono italic text-xs leading-[1.5]"
                  style={{
                    background: '#070d1a',
                    border: '0.5px solid rgba(245,158,11,0.15)',
                    color: '#fde68a',
                  }}
                >
                  {renderFragmentWithCensored(evidenciaClean)}
                </div>
              </div>
            ) : null}
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2"
                style={{ color: '#64748b' }}
              >
                Lectura del análisis
              </p>
              <p
                className="text-xs italic font-light leading-[1.7]"
                style={{ color: '#cbd5e1' }}
              >
                {analisis}
              </p>
            </div>
          </div>

          {/* Footer escalación */}
          <div
            className="px-5 py-2.5"
            style={{
              borderTop: '0.5px solid rgba(245,158,11,0.08)',
              background: 'rgba(245,158,11,0.03)',
            }}
          >
            <p
              className="text-[11px] font-light leading-[1.6]"
              style={{ color: '#94a3b8' }}
            >
              Este hallazgo queda registrado como señal preventiva. Si converge
              con otras fuentes escalará automáticamente a{' '}
              <span style={{ color: '#fbbf24' }}>Las Señales</span> con{' '}
              {protocolo}.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// HELPER — render fragmento con [CENSURADO] en tono más tenue
// ════════════════════════════════════════════════════════════════════════════

function renderFragmentWithCensored(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\[CENSURADO\])/g);
  return (
    <>
      &ldquo;
      {parts.map((p, i) =>
        p === '[CENSURADO]' ? (
          <span key={i} style={{ color: '#475569' }}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
      &rdquo;
    </>
  );
}
