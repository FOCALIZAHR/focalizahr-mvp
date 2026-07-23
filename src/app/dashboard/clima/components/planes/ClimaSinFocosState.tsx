'use client';

// src/app/dashboard/clima/components/planes/ClimaSinFocosState.tsx
// ════════════════════════════════════════════════════════════════════════════
// Empty-state POSITIVO del Tab 1 (Gate 5D-i) — se muestra cuando el plan no tiene
// focos: generate devuelve decisiones=0 Y departamentosSinDatos=0 (clima sano).
// Reemplaza al FHREmptyState genérico SOLO en este caso; el componente compartido
// queda intacto (lo usan Metas/Vitals).
//
// LAYOUT: renderiza SOLO su contenido, SIN card/Tesla/padding pesado propios. En el
// caso vacío el shell (ClimaPlanesView) está en modo NO-bare y ya provee card +
// Tesla line + top bar + padding (ClimaPlanesView.tsx:56-72). Traer una card propia
// daría card-in-card — el mismo patrón que ClimaPathCarousel, que también dibuja su
// contenido directo dentro del shell. El ancho lo fija el shell (max-w-4xl).
//
// Reglas respetadas:
//   · Anti-semáforo (MANIFIESTO v5): color (emerald) SOLO en el ícono/su borde.
//   · Regla del "O": cero cifras — no hay número de favorabilidad limpio en este
//     contexto (el gauge del Lobby ya lo muestra). Copy 100% cualitativo.
//   · Copy scope-neutral ("esta medición") — respeta el filtrado RBAC del Tab 1.
//   · Un solo CTA → Lobby (misma salida que el Checkout: onExitToLobby).
// ════════════════════════════════════════════════════════════════════════════

import { ShieldCheck, Zap } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import { dimensionLabel } from '@/lib/constants/climaDimensions';

/** Fortaleza de mayor priority del scope (de generate). `null` si no hay ninguna
 *  de alto impacto. `transversal`=true si TODOS los deptos visibles la comparten.
 *  `departmentName` solo viene si es un destaque de un subconjunto (scope>1). */
export interface ScopeTopStrength {
  dimension: string;
  departmentName: string | null;
  transversal: boolean;
}

interface ClimaSinFocosStateProps {
  /** Salida al Lobby (gauge + Zona Crítica) = hook.exitSubproducto. */
  onExitToLobby?: () => void;
  /** Reconocimiento cualitativo (sin cifra). Fallback a copy genérico si es null. */
  topStrength?: ScopeTopStrength | null;
}

export default function ClimaSinFocosState({
  onExitToLobby,
  topStrength,
}: ClimaSinFocosStateProps) {
  // Reconocimiento primero cuando hay fortaleza; si no, dos líneas genéricas.
  // Sufijo: transversal (todos comparten) → sin nombre; destaque → nombre del depto.
  const sufijoFortaleza = topStrength?.transversal
    ? ' — transversal en todos los equipos medidos'
    : topStrength?.departmentName
      ? ` — ${topStrength.departmentName}`
      : '';
  const lineas = topStrength
    ? [
        `Lo más sólido esta medición: ${dimensionLabel(topStrength.dimension)}${sufijoFortaleza}.`,
        'Ningún foco superó el umbral de atención.',
      ]
    : [
        'Ningún foco superó el umbral de atención.',
        'Los equipos con datos quedaron sobre su vara.',
      ];

  return (
    <div className="py-6 md:py-8 flex flex-col items-center text-center">
      {/* Ícono — emerald SOLO acá (anti-semáforo) */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-slate-900/40">
        <ShieldCheck size={32} strokeWidth={1.5} className="text-emerald-400" />
      </div>

      {/* Título word-split */}
      <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
        Sin focos
      </h2>
      <p className="text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
        de acción
      </p>

      {/* Subtítulo */}
      <p className="text-base font-light text-slate-400 leading-relaxed mt-5 max-w-lg">
        Ningún reactivo cruzó su umbral de atención en esta medición.
      </p>

      {/* Panel — Lectura del ciclo (cualitativo, sin cifras) */}
      <div className="mt-8 w-full max-w-xl rounded-xl border border-slate-800/40 bg-slate-900/40 px-5 py-5 text-left">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          Lectura del ciclo
        </span>
        <ul className="mt-3 space-y-2">
          {lineas.map((linea) => (
            <li
              key={linea}
              className="flex gap-2 text-sm font-light text-slate-400 leading-relaxed"
            >
              <span className="text-slate-600 mt-[2px]">·</span>
              {linea}
            </li>
          ))}
        </ul>
      </div>

      {/* Cierre — consecuencia sin instrucción (narrativas Regla 6) */}
      <p className="text-sm font-light text-slate-500 leading-relaxed mt-6 max-w-lg">
        El sistema sigue midiendo. Si algo cambia en la próxima medición, aparecerá acá.
      </p>

      {/* CTA único → Lobby */}
      {onExitToLobby && (
        <div className="mt-8 w-full max-w-xs">
          <PrimaryButton fullWidth icon={Zap} onClick={onExitToLobby}>
            Volver al Lobby
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
