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
// daría card-in-card. El ancho lo fija el shell (max-w-4xl).
//
// Reglas: anti-semáforo (emerald SOLO en el ícono); cero cifras; un solo CTA → Lobby
// (misma salida que el Checkout: onExitToLobby). Copy aprobado por Victor.
// ════════════════════════════════════════════════════════════════════════════

import { ShieldCheck, Zap } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';

interface ClimaSinFocosStateProps {
  /** Salida al Lobby (gauge + Zona Crítica) = hook.exitSubproducto. */
  onExitToLobby?: () => void;
}

export default function ClimaSinFocosState({ onExitToLobby }: ClimaSinFocosStateProps) {
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

      {/* Cuerpo */}
      <p className="text-base font-light text-slate-400 leading-relaxed mt-5 max-w-lg">
        Tu organización está en buen estado. Ningún equipo con datos suficientes
        requirió atención en este ciclo.
      </p>

      {/* Cierre */}
      <p className="text-sm font-light text-slate-500 leading-relaxed mt-4 max-w-lg">
        El próximo ciclo confirmará si las condiciones se sostienen.
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
