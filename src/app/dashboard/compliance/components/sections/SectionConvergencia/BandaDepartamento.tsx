'use client';

// Componente Nivel 2 — banda de dept con acordeón inline.
// Plan sec "Componente 2" + "Componente 3 — Acordeón inline".
//
// Patrón de acordeón heredado de SectionPatrones.BandaPatron: el padre
// pasa `isExpanded` + `onToggle`. Click en banda → expansión hacia abajo
// empuja la lista. Solo una banda expandida a la vez (single-expansion).

import { ChevronDown, GitBranch, Infinity as InfinityIcon } from 'lucide-react';

import SelloForense from './SelloForense';
import AmplificadorChip from './AmplificadorChip';
import AlertaComplianceChip from './AlertaComplianceChip';
import { AMPLIFICADOR_LABELS, resolveAlertLabel } from './_shared/ALERT_LABELS';
import { getCombinatoriaNarrative } from './_shared/CombinatoriaDictionary';
import type { MergedDept } from './_shared/helpers';
import type { AlertaNarrative } from '@/lib/services/compliance/ComplianceNarrativeEngine';

interface Props {
  dept: MergedDept;
  isExpanded: boolean;
  onToggle: () => void;
  /**
   * Map de alertType → AlertaNarrative completa (titulo + contexto +
   * consecuencia + intervencion) desde `report.narratives.artefacto4_alertas`.
   * Construido una vez en el padre con `useMemo` y prop-drilled.
   * Uso: chip colapsado consume `.consecuencia`; Bloque 5 expandido consume
   * los 4 campos. Optional: campañas legacy sin artefacto4_alertas degradan
   * a chip/bloque sin contenido.
   */
  narrativaByAlertType?: Map<string, AlertaNarrative>;
  /**
   * Narrativa estructural per-banda — Motor 1 (`buildConvergencia`).
   * Lookup desde `report.narratives.artefacto3_convergencia` por
   * `departmentId`. Se renderiza en colapsado arriba de la combinatoria
   * conductual (Motor 6). Optional: si Motor 1 no produjo nada para este
   * dept (filtrado por nivelFinal='ninguna' o legacy sin payload), la
   * fila no renderiza.
   */
  narrativaEstructural?: string;
}

// Borde lateral según nivel — peso, no color (spec).
function getBorderClass(nivel: string): string {
  if (nivel === 'critica') return 'border-l-4 border-slate-400/90';
  if (nivel === 'multiple') return 'border-l-[3px] border-slate-500/70';
  if (nivel === 'simple') return 'border-l-2 border-slate-600/50';
  return 'border-l border-slate-700/50';
}

export default function BandaDepartamento({
  dept,
  isExpanded,
  onToggle,
  narrativaByAlertType,
  narrativaEstructural,
}: Props) {
  const interna = dept.convergenciaInterna;
  const externa = dept.convergenciaExterna;
  const isaScore = dept.isaScore;
  const isA5 = interna.casosActivos.includes('A5');

  const borderClass = getBorderClass(interna.nivelConvergencia);
  const combinatoriaNarrative = getCombinatoriaNarrative(dept);

  return (
    <div
      className={`relative overflow-hidden rounded-[12px] ${borderClass}`}
      style={{
        background: '#0F172A',
        borderTop: '0.5px solid #1e293b',
        borderRight: '0.5px solid #1e293b',
        borderBottom: '0.5px solid #1e293b',
      }}
    >
      {/* HEADER de la banda — clickeable */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Col 1 — narrativa */}
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            {/* Nombre dept */}
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-normal text-cyan-300 truncate">
                {dept.departmentName}
              </span>
            </div>

            {/* Sellos forenses A1-A5 */}
            {interna.casosActivos.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {interna.casosActivos.map((caso) => (
                  <SelloForense key={caso} caso={caso} />
                ))}
              </div>
            ) : null}

            {/* Conector A4 — partner del grupo criticalByManager */}
            {dept.a4Partner ? (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <GitBranch className="w-3 h-3 text-purple-400" strokeWidth={1.5} />
                <span>
                  Mismo liderazgo —{' '}
                  <span className="text-purple-400 font-mono">
                    {dept.a4Partner.deltaIsa} puntos
                  </span>{' '}
                  de diferencia
                </span>
              </div>
            ) : null}

            {/* Amplificadores Motor B */}
            {externa.scoreTotal > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-[10px] text-slate-600 uppercase tracking-widest">
                  Amplificado por
                </span>
                {externa.exoSignal > 0 ? (
                  <AmplificadorChip
                    variant="onboarding"
                    label={`${AMPLIFICADOR_LABELS.onboarding.base} ${
                      externa.exoSignal === 1
                        ? AMPLIFICADOR_LABELS.onboarding.intensidad.atencion
                        : AMPLIFICADOR_LABELS.onboarding.intensidad.critico
                    }`}
                  />
                ) : null}
                {externa.eisSignal > 0 ? (
                  <AmplificadorChip
                    variant="salidas"
                    label={`${AMPLIFICADOR_LABELS.salidas.base} ${
                      externa.eisSignal === 1
                        ? AMPLIFICADOR_LABELS.salidas.intensidad.atencion
                        : AMPLIFICADOR_LABELS.salidas.intensidad.critico
                    }`}
                  />
                ) : null}
                {externa.alertasConsideradas
                  .filter((a) => a.factorDecaimiento === 1.0)
                  .slice(0, 3)
                  .map((a) => (
                    <AmplificadorChip
                      key={a.id}
                      variant="alerta_externa"
                      label={resolveAlertLabel(a.alertType)}
                    />
                  ))}
              </div>
            ) : null}

            {/* Flag fallaCicloDeVida */}
            {externa.fallaCicloDeVida ? (
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                <InfinityIcon
                  className="w-3 h-3 text-slate-500"
                  strokeWidth={1.5}
                />
                <span>El problema atraviesa todo el ciclo del empleado</span>
              </div>
            ) : null}

            {/* Narrativa estructural — Motor 1 (buildConvergencia).
                Fundamento del diagnóstico: qué fuentes coinciden + caso. */}
            {narrativaEstructural ? (
              <p className="text-sm font-light text-slate-300 leading-[1.6] mt-2">
                {narrativaEstructural}
              </p>
            ) : null}

            {/* Frase de combinatoria — Motor 6 (getCombinatoriaNarrative).
                Interpretación conductual del patrón. */}
            {combinatoriaNarrative !== null ? (
              <p className="text-sm font-light text-slate-300 leading-[1.6] mt-2">
                {combinatoriaNarrative}
              </p>
            ) : null}

            {/* Alertas Compliance activas */}
            {dept.complianceAlerts.length > 0 ? (
              <div className="flex flex-wrap gap-3 mt-2">
                {dept.complianceAlerts.map((a) => (
                  <AlertaComplianceChip
                    key={a.id}
                    alert={a}
                    consecuencia={narrativaByAlertType?.get(a.alertType)?.consecuencia}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* Col 2 — ISA hero + chevron */}
          <div className="flex items-start gap-3 shrink-0">
            {/* Tratamiento especial A5 — ISA con anotación tachada */}
            {isA5 && isaScore !== null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-[36px] font-extralight tabular-nums text-white leading-none">
                  {isaScore}
                </span>
                <div className="flex flex-col gap-0.5 items-start">
                  <span className="text-[10px] text-slate-600 line-through tracking-wide">
                    declarado
                  </span>
                  <span className="text-[10px] text-slate-400 tracking-wide">
                    no verificado
                  </span>
                </div>
              </div>
            ) : isaScore !== null ? (
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest text-slate-600">
                  ISA
                </span>
                <span
                  className="text-[32px] font-extralight tabular-nums leading-none"
                  style={{ color: '#A78BFA' }}
                >
                  {isaScore}
                </span>
              </div>
            ) : null}
            <ChevronDown
              className="w-4 h-4 text-slate-600 mt-2 transition-transform duration-200"
              strokeWidth={1.5}
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </button>

      {/* CUERPO EXPANDIDO — bloques inline */}
      {isExpanded ? (
        <div
          className="px-5 pb-5 pt-1"
          style={{ borderTop: '0.5px solid #1e293b' }}
        >
          <BloquesExpandidos dept={dept} narrativaByAlertType={narrativaByAlertType} />
        </div>
      ) : null}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Bloques expandidos (2-5) — solo se renderizan al click
// ════════════════════════════════════════════════════════════════════════════

function BloquesExpandidos({
  dept,
  narrativaByAlertType,
}: {
  dept: MergedDept;
  narrativaByAlertType?: Map<string, AlertaNarrative>;
}) {
  const interna = dept.convergenciaInterna;
  const externa = dept.convergenciaExterna;
  const dims = dept.dimensionScores;
  const isaScore = dept.isaScore;
  const previousIsa = dept.previousIsaScore;

  // Bloque 2 — narrativas Motor A por caso activo (Spec sec "Bloque 2")
  const narrativasCasos: Record<string, string> = {
    A1: `El score (${isaScore ?? '—'}) y lo que las personas escribieron señalan lo mismo de manera independiente. Dos lecturas que no se conocen llegaron a la misma conclusión. Eso no es coincidencia.`,
    A2: `El ISA es ${isaScore ?? '—'}. Lo que las personas escribieron lo contradice. O el equipo aprendió a responder lo que se espera. O hay algo que no está llegando a la encuesta. La brecha existe — aunque las causas no sean visibles todavía.`,
    A3: `El lenguaje que circula en este departamento tiene sesgo. La seguridad psicológica está en ${
      dims.P2_seguridad?.toFixed(1) ?? '—'
    }/5. Cuando el lenguaje normaliza la exclusión, el ambiente que lo permite ya existe.`,
    A4: dept.a4Partner
      ? `ISA ${isaScore ?? '—'}. Otro departamento bajo el mismo liderazgo tiene ISA ${dept.a4Partner.isaScore}. La diferencia es de ${dept.a4Partner.deltaIsa} puntos. Con equipos distintos y el mismo mando, la variable constante es el liderazgo.`
      : `ISA ${isaScore ?? '—'}. Este departamento forma parte de un grupo bajo el mismo liderazgo con dispersión de ISA. Con equipos distintos y el mismo mando, la variable constante es el liderazgo.`,
    A5: `ISA ${isaScore ?? '—'} — clasificación Sano. Lo que las personas escribieron dice otra cosa. Esto no es un score bajo — es un score que no refleja lo que ocurre. Es el escenario más difícil de gestionar.`,
  };

  return (
    <div className="flex flex-col gap-5 mt-3">
      {/* Bloque 2 — Narrativas casos Motor A */}
      {interna.casosActivos.length > 0 ? (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Hallazgos detectados
          </span>
          {interna.casosActivos.map((caso) => (
            <p
              key={caso}
              className="text-sm font-light leading-[1.7]"
              style={{ color: '#cbd5e1' }}
            >
              {narrativasCasos[caso]}
            </p>
          ))}
        </div>
      ) : null}

      {/* Bloque 3 — Señales externas */}
      {externa.scoreTotal > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Fuentes que confirman este departamento
          </span>
          <div className="flex flex-col gap-1 text-sm font-light text-slate-400">
            {externa.exoSignal > 0 ? (
              <div>
                <span className="text-slate-500 text-[12px] uppercase tracking-wide mr-2">
                  Onboarding
                </span>
                <span className="text-slate-300 font-mono">
                  {externa.exoSignal === 1 ? 'Atención' : 'Crítico'}
                </span>
              </div>
            ) : null}
            {externa.eisSignal > 0 ? (
              <div>
                <span className="text-slate-500 text-[12px] uppercase tracking-wide mr-2">
                  Salidas
                </span>
                <span className="text-slate-300 font-mono">
                  {externa.eisSignal === 1 ? 'Atención' : 'Crítico'}
                </span>
              </div>
            ) : null}
            {externa.alertasConsideradas
              .filter((a) => a.factorDecaimiento === 1.0)
              .map((a) => (
                <div key={a.id}>
                  <span className="text-slate-500 text-[12px] uppercase tracking-wide mr-2">
                    Alerta
                  </span>
                  <span className="text-slate-300 font-mono">
                    {resolveAlertLabel(a.alertType)}
                  </span>
                  <span className="text-slate-600 mx-2">·</span>
                  <span className="text-slate-500 text-[11px]">
                    peso {a.pesoEfectivo.toFixed(1)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {/* Bloque 4 — Contexto histórico */}
      {previousIsa !== null && isaScore !== null ? (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Contexto histórico
          </span>
          <div className="flex items-baseline gap-6 text-sm">
            <div>
              <span className="text-[10px] uppercase tracking-wide text-slate-600 block">
                Ciclo anterior
              </span>
              <span
                className="text-[24px] font-extralight tabular-nums"
                style={{ color: '#A78BFA' }}
              >
                {previousIsa}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wide text-slate-600 block">
                Este ciclo
              </span>
              <span
                className="text-[24px] font-extralight tabular-nums"
                style={{ color: '#A78BFA' }}
              >
                {isaScore}
              </span>
            </div>
            <div className="text-[12px] font-light text-slate-400 self-end pb-1">
              {dept.deltaVsAnterior !== null
                ? dept.deltaVsAnterior > 0
                  ? `+${dept.deltaVsAnterior} mejoró`
                  : dept.deltaVsAnterior < 0
                    ? `${dept.deltaVsAnterior} empeoró`
                    : 'sin cambio'
                : ''}
            </div>
          </div>
        </div>
      ) : null}

      {/* Bloque 5 — Narrativa expandida de alertas (Motor 4 — buildAlertas).
          Por cada ComplianceAlert del dept que tenga AlertaNarrative en el
          map, render titulo + contexto + intervencion. La consecuencia ya
          se mostró en el chip colapsado, no se repite. */}
      {(() => {
        if (!narrativaByAlertType || dept.complianceAlerts.length === 0) return null;
        const alertasConNarrativa = dept.complianceAlerts
          .map((a) => ({ alert: a, narrativa: narrativaByAlertType.get(a.alertType) }))
          .filter((x): x is { alert: typeof x.alert; narrativa: AlertaNarrative } =>
            x.narrativa !== undefined,
          );
        if (alertasConNarrativa.length === 0) return null;
        return (
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Alertas activas — análisis ejecutivo
            </span>
            {alertasConNarrativa.map(({ alert, narrativa }) => (
              <div key={alert.id} className="flex flex-col gap-2">
                <p className="text-sm font-normal text-slate-200 leading-[1.5]">
                  {narrativa.titulo}
                </p>
                <p className="text-sm font-light leading-[1.7]" style={{ color: '#cbd5e1' }}>
                  {narrativa.contexto}
                </p>
                <p className="text-sm font-light leading-[1.7] text-slate-400">
                  {narrativa.intervencion}
                </p>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
