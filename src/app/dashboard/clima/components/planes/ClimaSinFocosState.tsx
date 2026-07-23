'use client';

// src/app/dashboard/clima/components/planes/ClimaSinFocosState.tsx
// ════════════════════════════════════════════════════════════════════════════
// Empty-state POSITIVO del Tab 1 (Gate 5D-i) — se muestra cuando el plan no tiene
// focos: generate devuelve decisiones=0 Y departamentosSinDatos=0 (clima sano).
// Reemplaza al FHREmptyState genérico SOLO en este caso; el componente compartido
// queda intacto (lo usan Metas/Vitals). Patrón Portada (mensaje + 1 CTA), tokens
// canónicos de CompensationPortada.
//
// Reglas respetadas:
//   · Anti-semáforo (MANIFIESTO v5): color (emerald) SOLO en el ícono/su borde;
//     la card y su borde son neutros. Cero fondo semántico por severidad.
//   · Regla del "O": cero cifras — no hay número de favorabilidad limpio en este
//     contexto (el gauge del Lobby ya lo muestra). Copy 100% cualitativo.
//   · Copy scope-neutral ("esta medición") — respeta el filtrado RBAC del Tab 1.
//   · Un solo CTA → Lobby (misma salida que el Checkout: onExitToLobby).
// ════════════════════════════════════════════════════════════════════════════

import { ShieldCheck, Zap } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';

interface ClimaSinFocosStateProps {
  /** Salida al Lobby (gauge + Zona Crítica) = hook.exitSubproducto. */
  onExitToLobby?: () => void;
}

export default function ClimaSinFocosState({ onExitToLobby }: ClimaSinFocosStateProps) {
  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-12 md:px-10 md:py-16 flex flex-col items-center text-center">
        {/* Ícono — emerald SOLO acá (anti-semáforo: card neutra) */}
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
        <p className="text-base font-light text-slate-400 leading-relaxed mt-5 max-w-md">
          Ningún reactivo cruzó su umbral de atención en esta medición.
        </p>

        {/* Panel — Lectura del ciclo (cualitativo, sin cifras) */}
        <div className="mt-8 w-full max-w-md rounded-xl border border-slate-800/40 bg-slate-900/40 px-5 py-5 text-left">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            Lectura del ciclo
          </span>
          <ul className="mt-3 space-y-2">
            <li className="flex gap-2 text-sm font-light text-slate-400 leading-relaxed">
              <span className="text-slate-600 mt-[2px]">·</span>
              Ningún foco superó el umbral de atención.
            </li>
            <li className="flex gap-2 text-sm font-light text-slate-400 leading-relaxed">
              <span className="text-slate-600 mt-[2px]">·</span>
              Los equipos con datos quedaron sobre su vara.
            </li>
          </ul>
        </div>

        {/* Cierre — consecuencia sin instrucción (narrativas Regla 6) */}
        <p className="text-sm font-light text-slate-500 leading-relaxed mt-6 max-w-md">
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
    </div>
  );
}
