'use client';

// src/app/dashboard/clima/components/ClimaDimensionesView.tsx
// ════════════════════════════════════════════════════════════════════════════
// Card "Dimensiones" del Rail (v3 §3D) — Patrón G, clon estructural LITERAL de
// CompensationSplit.tsx (executive-hub/GoalsCorrelation/cascada). Responde
// "¿qué querés ver vos?": el CEO elige libremente cualquiera de las N dimensiones.
//
// Estructura COMPACTA (una sola tarjeta, sin Portada, sin gauge circular,
// aterriza en focus[0] — todo visible sin scroll largo):
//   Selector = tira VERTICAL de N íconos chicos (sin número ni color en los
//     no-seleccionados; el seleccionado se resalta con fondo, nada más).
//   Header INLINE — "{dimensión} · {banda} · {N} · vs. objetivo 75" en una línea
//     (el número + badge de zona reemplazan al gauge gráfico).
//   Split 50/50 — Narrativa izq (cruce + "O") · Evidencia der (unidades
//     expandibles, clon de PersonRow, guard n≥5).
//
// ── FUENTE DE EVIDENCIA — rollup (A2) RECURSIVO por jerarquía ─────────────────
// La evidencia se arma desde `gerencias`: las unidades de primer nivel del árbol
// (rollupClimaHierarchy, server-side en /api/clima/results), cada una con
// `children` recursivos (N≤4: gerencia→subgerencia→área). Cada UnitRow expande a
// sus hijas, también expandibles. Guard n≥5 por nivel sobre la n agregada.
//
// NARRATIVA (Principio 4): el cruce + "O" salen VERBATIM de CROSS_SIGNAL_CLAUSES
// (§7, Gate 4.5a). La observación base es lectura de dato. Donde no hay cruce,
// PROVISIONAL marcado (§7 pendiente, lo escribe Victor/Studio IA).
//
// SIN tabs de categoría de CompensationSplit (§3D: el Motor de Asociación cumple
// esa función en la narrativa). Reemplaza a ClimaDimensionDetail + ClimaDimensionModal.
// ════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import BusinessCaseCard from '@/components/clima/BusinessCaseCard';
import { zoneColor, ZONE_LABEL } from '@/components/clima/climaZonePalette';
import { CLIMA_DIMENSIONS, dimensionLabel } from '@/lib/constants/climaDimensions';
import {
  CLIMA_TARGET_FAVORABILITY,
  CLIMA_MIN_RESPONDENTS,
} from '@/lib/services/clima/climaThresholds';
import {
  CROSS_SIGNAL_CLAUSES,
  interpolate,
  type CrossSignalKey,
} from '@/lib/services/clima/ClimaNarrativeDictionary';
import type { ClimaDimensionAgg } from '@/lib/utils/aggregateClimaDimension';
import type { ClimaDepartmentInsight, ClimaDriverScore } from '@/types/clima';

interface ClimaDimensionesViewProps {
  dimensions: Record<string, ClimaDimensionAgg>;
  /** Unidades a nivel gerencia (rollup A). Fuente de la evidencia. */
  gerencias: ClimaDepartmentInsight[];
  /** Dimensión de entrada desde el Toolbar (§3E). Default = peor dimensión. */
  initialDriver?: string | null;
  onBack: () => void;
}

interface UnitRowData {
  insight: ClimaDepartmentInsight;
  score: ClimaDriverScore;
}

/** Cruce §7 aplicable a una unidad (Capa 2). Réplica de la lógica de la difunta
 *  ClimaDimensionDetail: exit (liderazgo) / onboarding (cualquier dim), SOLO si la
 *  dimensión es foco (fav < objetivo) ahí. bias/evaluador → 4.5b-ii. */
function crossClauseFor(
  driver: string,
  insight: ClimaDepartmentInsight,
  fav: number | null,
): { key: CrossSignalKey; gerencia: string } | null {
  if (fav === null || fav >= CLIMA_TARGET_FAVORABILITY) return null;
  const cs = insight.crossSignals;
  if (!cs) return null;
  if (driver === 'liderazgo' && cs.exitTopFactor?.mentionsManager) {
    return { key: 'exit', gerencia: insight.departmentName };
  }
  if (cs.onboardingAbandon) {
    return { key: 'onboarding', gerencia: insight.departmentName };
  }
  return null;
}

export default function ClimaDimensionesView({
  dimensions,
  gerencias,
  initialDriver,
  onBack,
}: ClimaDimensionesViewProps) {
  // Orden de foco rescatado de la difunta ClimaHallazgoCards:34-53 — peor
  // favorabilidad primero. focus[0] = dimensión más crítica (aterrizaje default).
  const focusOrder = useMemo(
    () =>
      CLIMA_DIMENSIONS.map((d) => dimensions[d.key])
        .filter((a): a is ClimaDimensionAgg => !!a && a.hasSufficientData)
        .filter(
          (a) =>
            a.classification === 'focus_area' ||
            (a.orgFav !== null && a.orgFav < CLIMA_TARGET_FAVORABILITY),
        )
        .sort((a, b) => (a.orgFav ?? 999) - (b.orgFav ?? 999)),
    [dimensions],
  );

  const firstWithData = useMemo(
    () => CLIMA_DIMENSIONS.find((d) => dimensions[d.key]?.hasSufficientData)?.key ?? null,
    [dimensions],
  );

  const defaultDriver =
    (initialDriver && dimensions[initialDriver]?.hasSufficientData ? initialDriver : null) ??
    focusOrder[0]?.driver ??
    firstWithData ??
    CLIMA_DIMENSIONS[0].key;

  const [selectedKey, setSelectedKey] = useState<string>(defaultDriver);
  const agg = dimensions[selectedKey] ?? null;
  const label = dimensionLabel(selectedKey);
  const accent = agg ? zoneColor(agg.zone) : '#64748B';

  // Unidades (gerencias) medidas para la dimensión (guard n≥5, sin carried), peor
  // primero. La n es la agregada de la gerencia (rollup A).
  const units = useMemo<UnitRowData[]>(() => {
    return gerencias
      .map((d) => {
        const s = d.driverScores?.[selectedKey];
        return s && !s.carried && s.n >= CLIMA_MIN_RESPONDENTS && s.fav !== null
          ? { insight: d, score: s }
          : null;
      })
      .filter((r): r is UnitRowData => r !== null)
      .sort((a, b) => (a.score.fav ?? 999) - (b.score.fav ?? 999));
  }, [gerencias, selectedKey]);

  // Narrativa Capa 2 a nivel dimensión = cruce de la peor unidad (si aplica).
  const dimCross = useMemo(() => {
    const worst = units[0];
    return worst ? crossClauseFor(selectedKey, worst.insight, worst.score.fav) : null;
  }, [units, selectedKey]);
  const clause = dimCross ? CROSS_SIGNAL_CLAUSES[dimCross.key] : null;
  const clauseCtx: Record<string, string> = dimCross ? { gerencia: dimCross.gerencia } : {};

  return (
    <div className="w-full max-w-4xl">
      <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        {/* Tesla line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
            opacity: 0.7,
          }}
        />

        <div className="px-5 py-5 md:px-6 md:py-6">
          {/* Top bar — breadcrumb persistente (patrón CompensationSplit) */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] font-light"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
            <span className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider">
              Dimensiones
            </span>
          </div>

          {/* Cuerpo: tira vertical de íconos (selector) + contenido */}
          <div className="flex gap-4">
            {/* Selector — íconos verticales chicos. No-seleccionado: solo ícono
                gris. Seleccionado: fondo resaltado, nada más. */}
            <div className="flex flex-col gap-1 shrink-0">
              {CLIMA_DIMENSIONS.map((dim) => {
                const a = dimensions[dim.key];
                const hasData = !!a && a.hasSufficientData;
                const active = dim.key === selectedKey;
                const Icon = dim.icon;
                return (
                  <button
                    key={dim.key}
                    onClick={() => hasData && setSelectedKey(dim.key)}
                    disabled={!hasData}
                    title={dim.label}
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center border transition-all',
                      !hasData && 'opacity-30 cursor-not-allowed',
                      active
                        ? 'bg-cyan-500/10 border-cyan-500/25'
                        : 'border-transparent hover:bg-slate-800/40',
                    )}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: active ? '#22D3EE' : '#64748B' }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Contenido de la dimensión seleccionada */}
            <div className="flex-1 min-w-0">
              {!agg || !agg.hasSufficientData ? (
                <p className="text-sm font-light text-slate-500 py-10">
                  {label}: sin base suficiente para reportar — menos de {CLIMA_MIN_RESPONDENTS}{' '}
                  respuestas en toda la campaña.
                </p>
              ) : (
                <>
                  {/* Header INLINE — el NÚMERO es protagonista (blanco, grande);
                      nombre + badge de zona = contexto. Regla del sistema: el
                      color vive en el badge, NUNCA en el número (CompensationPortada). */}
                  <div className="flex items-center gap-2.5 flex-wrap mb-5">
                    <h3 className="text-xl font-light text-white tracking-tight">{label}</h3>
                    {agg.zone && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ color: accent, background: `${accent}1a` }}
                      >
                        {ZONE_LABEL[agg.zone]}
                      </span>
                    )}
                    <span className="text-[40px] font-extralight tabular-nums text-white leading-none">
                      {agg.orgFav != null ? Math.round(agg.orgFav) : '—'}
                    </span>
                    <span className="text-sm text-slate-500 font-light">
                      vs. objetivo {CLIMA_TARGET_FAVORABILITY}
                    </span>
                  </div>

                  {/* Split 50/50 — Narrativa · Evidencia */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* ── Narrativa ── */}
                    <div className="rounded-xl border border-slate-800/30 bg-slate-900/30 p-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />

                      {clause ? (
                        <>
                          <p className="text-xs text-slate-300 font-medium tracking-wide mb-1.5">
                            Lo que dice el cruce
                          </p>
                          <p className="text-[13px] text-slate-400 font-light leading-[1.7]">
                            {interpolate(clause.convergence, clauseCtx)}
                          </p>
                          {clause.hypotheses && (
                            <div
                              className="mt-3 pl-3"
                              style={{
                                borderLeft: '1.5px solid',
                                borderImage: 'linear-gradient(180deg, #22D3EE30, #A78BFA20) 1',
                              }}
                            >
                              <p className="text-[13px] text-slate-500 font-light leading-[1.7]">
                                {interpolate(clause.hypotheses, clauseCtx)}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        // Sin cruce cableado → contenido interpretativo pendiente (§7).
                        <p className="text-[11px] text-slate-600 font-light italic">
                          PROVISIONAL · narrativa interpretativa por dimensión pendiente de
                          contenido (Victor / Studio IA).
                        </p>
                      )}

                      {/* Capa 3a — costo CLP (si existe) */}
                      {agg.businessCase && (
                        <div className="mt-4">
                          <BusinessCaseCard businessCase={agg.businessCase} />
                        </div>
                      )}
                    </div>

                    {/* ── Evidencia — unidades expandibles (fuente C, ver cabecera) ── */}
                    <div className="rounded-xl border border-slate-800/30 bg-slate-900/30 p-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent" />

                      <p className="text-[9px] uppercase tracking-[1.5px] text-slate-700 font-medium mb-3">
                        {units.length} unidad{units.length !== 1 ? 'es' : ''} medida
                        {units.length !== 1 ? 's' : ''}
                      </p>

                      {units.length === 0 ? (
                        <p className="text-xs text-slate-600 font-light">
                          Ninguna unidad alcanza el mínimo de {CLIMA_MIN_RESPONDENTS} respuestas
                          para esta dimensión.
                        </p>
                      ) : (
                        <div className="space-y-0.5">
                          {units.map((u, idx) => (
                            <UnitRow
                              key={u.insight.departmentId}
                              driver={selectedKey}
                              row={u}
                              index={idx}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// UNIT ROW — fila colapsada que expande al cruce de datos de esa unidad.
// Clon de PersonRow (CompensationSplit). Guard n≥5 ya aplicado por el caller.
// (Unidad = gerencia cuando exista el rollup A; hoy, departamento-de-participante.)
// ════════════════════════════════════════════════════════════════════════════

function UnitRow({
  driver,
  row,
  index,
  depth = 0,
}: {
  driver: string;
  row: UnitRowData;
  index: number;
  /** Profundidad en el árbol (0 = primer nivel). Solo para no repetir contenido. */
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { insight, score } = row;
  const zone = insight.riskZone;
  const rowAccent = zone ? zoneColor(zone) : '#475569';
  const cross = crossClauseFor(driver, insight, score.fav);
  const clause = cross ? CROSS_SIGNAL_CLAUSES[cross.key] : null;
  const needsAttention = clause !== null;

  // Drill-down RECURSIVO: unidades hijas con base n≥5 para esta dimensión, peor
  // primero. Las hijas <5 suman al agregado (privacy) pero no se muestran.
  const childRows = (insight.children ?? [])
    .map((c) => {
      const s = c.driverScores?.[driver];
      return s && !s.carried && s.fav !== null && s.n >= CLIMA_MIN_RESPONDENTS
        ? { insight: c, score: s }
        : null;
    })
    .filter((r): r is UnitRowData => r !== null)
    .sort((a, b) => (a.score.fav ?? 999) - (b.score.fav ?? 999));
  const totalChildren = (insight.children ?? []).filter((c) => {
    const s = c.driverScores?.[driver];
    return s && !s.carried && s.fav !== null;
  }).length;
  const hiddenChildren = totalChildren - childRows.length;
  // Ocultar la sección si el único "hijo" es la unidad misma (huérfano).
  const showChildren =
    childRows.length > 0 &&
    !(childRows.length === 1 && childRows[0].insight.departmentId === insight.departmentId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="relative"
    >
      {/* Tesla line purple — solo unidades con cruce confirmado */}
      {needsAttention && (
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)',
            boxShadow: '0 0 12px #A78BFA50',
          }}
        />
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'w-full text-left py-2.5 px-1.5 rounded-lg transition-colors hover:bg-slate-800/20',
          expanded && 'bg-slate-800/20',
        )}
      >
        {/* Línea 1: rank + nombre + fav + chevron */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-600 w-4 text-right flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-light text-slate-200 truncate flex-1">
            {insight.departmentName}
          </span>
          <span className="text-[11px] font-mono tabular-nums" style={{ color: rowAccent }}>
            {score.fav != null ? Math.round(score.fav) : '—'}
          </span>
          <ChevronDown
            className={cn(
              'w-3 h-3 text-slate-700 transition-transform flex-shrink-0',
              expanded && 'rotate-180',
            )}
          />
        </div>
        {/* Línea 2: zona + tag de cruce */}
        <div className="flex items-center gap-2 mt-1 pl-6">
          <span className="text-[10px] font-light" style={{ color: rowAccent }}>
            {zone ? ZONE_LABEL[zone] : 'Sin zona'}
          </span>
          {clause && (
            <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
              {cross!.key === 'exit' ? 'Señal de salida' : 'Abandono temprano'}
            </span>
          )}
        </div>
      </button>

      {/* Expansión: el cruce de datos específico de esta unidad (VERBATIM §7) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-7 pr-2 pb-3 pt-1 space-y-2">
              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
                <span>fav {score.fav != null ? Math.round(score.fav) : '—'}</span>
                {score.mean != null && <span>· media {score.mean.toFixed(1)}</span>}
                <span>· n {score.n}</span>
              </div>

              {/* Hoja (sin desglose): el cruce específico de esta unidad (§7). En
                  niveles intermedios no se repite — el badge de línea 2 ya lo marca. */}
              {!showChildren &&
                (clause ? (
                  <p className="text-[11px] font-light text-slate-400 leading-relaxed">
                    {interpolate(clause.convergence, { gerencia: insight.departmentName })}
                  </p>
                ) : (
                  <p className="text-[11px] font-light text-slate-600 leading-relaxed">
                    Sin señal cruzada confirmada para esta unidad en esta dimensión.
                  </p>
                ))}

              {/* Drill-down RECURSIVO: cada hija es a su vez expandible (N≤4). */}
              {showChildren && (
                <div className="mt-2 pl-2.5 border-l border-slate-800/40 space-y-0.5">
                  <p className="text-[9px] uppercase tracking-wider text-slate-700 font-medium mb-1">
                    Desglose ({childRows.length})
                  </p>
                  {childRows.map((cr, i) => (
                    <UnitRow
                      key={cr.insight.departmentId}
                      driver={driver}
                      row={cr}
                      index={i}
                      depth={depth + 1}
                    />
                  ))}
                  {hiddenChildren > 0 && (
                    <p className="text-[10px] text-slate-600 font-light pt-1">
                      {hiddenChildren} con base insuficiente (n&lt;{CLIMA_MIN_RESPONDENTS}),
                      incluidas en el agregado.
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
