'use client';

// ════════════════════════════════════════════════════════════════════════════
// DECISION CONSOLE — Items del selector (columna izquierda + pills mobile)
// DecisionConsole.DimensionListItem.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bundle Claude Design (Decision Console.html, abril 2026):
//   - Nombre 16px font-light + meta `N áreas` mono 10px
//   - Meta opacity 0 → opacity 1 en hover/active
//   - Rail vertical 2px cyan en críticas (top:14px bottom:14px) con glow
//     box-shadow: 0 0 14px rgba(34,211,238,.55)
//   - Active = rail full-height + glow más fuerte + nombre brighter
//   - Padding 18px 32px 18px 30px (rail vive en left:0)
//
// La gravedad se siente por:
//   1. Presencia/ausencia del rail cyan (criticidad).
//   2. Glow del rail (atención visual).
//   3. Brillo del nombre (active vs idle).
//
// El sidebar NO muestra scores numéricos — el detail los pinta (124px mono).
//
// MOBILE (<768px): mismo dato, distinto chrome.
//   - DimensionPill / ResumenPill: rounded-full chip horizontal, snap-center.
//   - Crítica idle: dot cyan inline 4px + glow.
//   - Active: bg cyan-500/10 + border cyan-400/60 + shadow cyan glow.
//   - data-pill-key consumido por DecisionConsole para auto-scroll into view.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react';
import { ListChecks } from 'lucide-react';

import type { ComplianceDimensionKey } from '@/config/narratives/ComplianceNarrativeDictionary';

// ────────────────────────────────────────────────────────────────────────────
// PROPS
// ────────────────────────────────────────────────────────────────────────────

export interface DimensionListItemProps {
  dimensionKey: ComplianceDimensionKey;
  dimensionName: string;
  /** Score 0-100 (display). Solo para aria-label — no se muestra. */
  orgScore: number;
  /** Cantidad de deptos críticos (display < 50). Render como `N áreas`. */
  criticalDeptsCount: number;
  /** True si esta dim es crítica (rail cyan visible). */
  isCritical: boolean;
  isActive: boolean;
  /** True si ≥1 decisión registrada para esta dim — meta cambia copy. */
  isRegistered: boolean;
  onClick: () => void;
}

export interface ResumenListItemProps {
  isActive: boolean;
  decisionsCount: number;
  onClick: () => void;
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT — DimensionListItem
// ────────────────────────────────────────────────────────────────────────────

export const DimensionListItem = memo(function DimensionListItem({
  dimensionName,
  orgScore,
  criticalDeptsCount,
  isCritical,
  isActive,
  isRegistered,
  onClick,
}: DimensionListItemProps) {
  // Meta: priorizar `N áreas` si hay focos, sino estado de registro.
  const metaLabel =
    criticalDeptsCount > 0
      ? `${criticalDeptsCount} ${criticalDeptsCount === 1 ? 'área' : 'áreas'}`
      : isRegistered
        ? 'registrada'
        : 'estable';

  const ariaLabel = `${dimensionName}. Score ${orgScore} sobre 100. ${metaLabel}.`;

  // Rail style — bundle: top:14px bottom:14px en idle/critical, full-height en active
  const railClasses = [
    'absolute left-0 w-[2px] rounded-r-[2px]',
    'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
    isActive
      ? 'top-0 bottom-0 bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.7)]'
      : isCritical
        ? 'top-[14px] bottom-[14px] bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.55)]'
        : 'top-[14px] bottom-[14px] bg-transparent',
  ].join(' ');

  // Nombre — bundle: idle slate-400, critical slate-300, active white + medium
  const nameColor = isActive
    ? 'text-white font-normal'
    : isCritical
      ? 'text-slate-300 font-light'
      : 'text-slate-400 font-light';

  // Meta — opacity 0 idle / 1 hover/active
  const metaOpacity = isActive
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={isActive ? 'true' : undefined}
      className={`
        group relative flex items-center gap-4 w-full text-left
        pl-[30px] pr-8 py-[18px]
        transition-colors duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]
        focus:outline-none focus-visible:bg-slate-800/40
        ${isActive ? 'bg-cyan-500/[0.06]' : 'hover:bg-slate-800/30'}
      `}
    >
      <span className={railClasses} aria-hidden="true" />

      <span
        className={`
          flex-1 min-w-0 text-base leading-tight tracking-[-0.005em]
          transition-colors duration-[250ms] truncate
          ${nameColor}
        `}
      >
        {dimensionName}
      </span>

      <span
        className={`
          font-mono text-[10px] tracking-wider text-slate-600
          transition-opacity duration-300 shrink-0
          ${metaOpacity}
        `}
      >
        {metaLabel}
      </span>
    </button>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT — ResumenListItem
// ────────────────────────────────────────────────────────────────────────────
// Fila especial al final de la lista: abre el ResumenPanel.

export const ResumenListItem = memo(function ResumenListItem({
  isActive,
  decisionsCount,
  onClick,
}: ResumenListItemProps) {
  const subLabel =
    decisionsCount > 0
      ? `${decisionsCount} ${decisionsCount === 1 ? 'decisión' : 'decisiones'}`
      : null;

  const railClasses = [
    'absolute left-0 w-[2px] rounded-r-[2px]',
    'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
    isActive
      ? 'top-0 bottom-0 bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.7)]'
      : 'top-[14px] bottom-[14px] bg-transparent',
  ].join(' ');

  return (
    <>
      <div
        className="border-t border-slate-800/60 mx-[30px] my-2"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={onClick}
        aria-label={`Resumen del plan${subLabel ? `. ${subLabel}.` : ''}`}
        aria-current={isActive ? 'true' : undefined}
        className={`
          group relative flex items-center gap-3 w-full text-left
          pl-[30px] pr-8 py-[18px]
          transition-colors duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          focus:outline-none focus-visible:bg-slate-800/40
          ${isActive ? 'bg-cyan-500/[0.06]' : 'hover:bg-slate-800/30'}
        `}
      >
        <span className={railClasses} aria-hidden="true" />

        <ListChecks
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-cyan-400' : 'text-slate-500'
          }`}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p
            className={`
              text-base leading-tight tracking-[-0.005em] transition-colors truncate
              ${isActive ? 'text-white font-normal' : 'text-slate-400 font-light'}
            `}
          >
            Resumen del plan
          </p>
          {subLabel ? (
            <p className="text-slate-600 text-[10px] font-mono tracking-wider mt-0.5">
              {subLabel}
            </p>
          ) : null}
        </div>
      </button>
    </>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT — DimensionPill (variante mobile horizontal)
// ────────────────────────────────────────────────────────────────────────────

export interface DimensionPillProps {
  dimensionKey: ComplianceDimensionKey;
  dimensionName: string;
  isCritical: boolean;
  isActive: boolean;
  onClick: () => void;
}

export const DimensionPill = memo(function DimensionPill({
  dimensionKey,
  dimensionName,
  isCritical,
  isActive,
  onClick,
}: DimensionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-pill-key={dimensionKey}
      aria-current={isActive ? 'true' : undefined}
      className={`
        snap-center shrink-0
        inline-flex items-center gap-2
        rounded-full
        px-3.5 py-2
        text-xs font-light tracking-tight whitespace-nowrap
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40
        ${
          isActive
            ? 'bg-cyan-500/10 border border-cyan-400/60 text-white shadow-[0_0_12px_rgba(34,211,238,0.35)]'
            : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:border-slate-700'
        }
      `}
    >
      {isCritical && !isActive ? (
        <span
          className="w-1 h-1 rounded-full bg-cyan-400 shrink-0"
          style={{ boxShadow: '0 0 6px rgba(34,211,238,0.8)' }}
          aria-hidden="true"
        />
      ) : null}
      <span>{dimensionName}</span>
    </button>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT — ResumenPill (variante mobile horizontal del Resumen)
// ────────────────────────────────────────────────────────────────────────────

export const ResumenPill = memo(function ResumenPill({
  isActive,
  decisionsCount,
  onClick,
}: ResumenListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-pill-key="resumen"
      aria-current={isActive ? 'true' : undefined}
      className={`
        snap-center shrink-0
        inline-flex items-center gap-1.5
        rounded-full
        px-3.5 py-2
        text-xs font-light whitespace-nowrap
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40
        ${
          isActive
            ? 'bg-cyan-500/10 border border-cyan-400/60 text-white shadow-[0_0_12px_rgba(34,211,238,0.35)]'
            : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:border-slate-700'
        }
      `}
    >
      <ListChecks className="w-3.5 h-3.5" aria-hidden="true" />
      <span>Resumen</span>
      {decisionsCount > 0 ? (
        <span className="font-mono text-[10px] text-slate-500">
          ({decisionsCount})
        </span>
      ) : null}
    </button>
  );
});
