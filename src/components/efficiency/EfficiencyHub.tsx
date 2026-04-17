// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY HUB — Orquestador workspace 70/30 del Efficiency Intelligence Hub
// src/components/efficiency/EfficiencyHub.tsx
// ════════════════════════════════════════════════════════════════════════════
// Responsabilidades:
//  · Consumir el hook useEfficiencyWorkspace (single source of truth)
//  · Flujo: guardarraíl → hub
//  · Layout: header + rail + (panel activo 70% | panel acumuladores 30%)
//  · Router: activeLenteId → componente L* específico
//  · CarritoBar fixed bottom (siempre visible)
//
// Patrón de estado: prop drilling desde este componente padre (canónico en
// el proyecto, igual que TACCinemaOrchestrator).
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { Loader2 } from 'lucide-react'
import { useEfficiencyWorkspace } from '@/hooks/useEfficiencyWorkspace'
import { EfficiencyRail } from './EfficiencyRail'
import { PanelAcumuladores } from './panel-acumuladores/PanelAcumuladores'
import { RiesgoAdopcionGuardarrail } from './guardarrail/RiesgoAdopcionGuardarrail'
import { CarritoBar } from './carrito/CarritoBar'

// Componentes específicos por lente — placeholder por ahora (cada uno se
// reemplaza en tareas 8..13 con su implementación real).
import { L1CostoInercia } from './lentes/L1CostoInercia'
import { L2TalentoZombie } from './lentes/L2TalentoZombie'
import { L4CargosFantasma } from './lentes/L4CargosFantasma'
import { L5BrechaProductividad } from './lentes/L5BrechaProductividad'
import { L7L8MapaTalento } from './lentes/L7L8MapaTalento'
import { L9PasivoLaboral } from './lentes/L9PasivoLaboral'

import type { LenteId } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import type { LenteComponentProps } from './lentes/_LentePlaceholder'

// ════════════════════════════════════════════════════════════════════════════
// ROUTER DE LENTES — mapea activeLenteId al componente específico
// ════════════════════════════════════════════════════════════════════════════

const LENTE_COMPONENTS: Partial<Record<LenteId, React.FC<LenteComponentProps>>> = {
  l1_inercia: L1CostoInercia,
  l2_zombie: L2TalentoZombie,
  l4_fantasma: L4CargosFantasma,
  l5_brecha: L5BrechaProductividad,
  l7_fuga: L7L8MapaTalento, // L7+L8 fusionados
  l9_pasivo: L9PasivoLaboral,
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function EfficiencyHub() {
  const ws = useEfficiencyWorkspace()

  // ── Loading ────────────────────────────────────────────────────
  if (ws.loading) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-sm font-light">Analizando la organización…</p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────
  if (ws.error || !ws.data) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center px-6">
        <div className="fhr-card p-8 max-w-md text-center">
          <h2 className="text-xl font-light text-white mb-2">
            No pudimos cargar el diagnóstico
          </h2>
          <p className="text-sm text-slate-400">
            {ws.error ?? 'Intenta recargar la página.'}
          </p>
        </div>
      </div>
    )
  }

  // ── Guardarraíl pre-Hub ────────────────────────────────────────
  if (ws.step === 'guardarrail') {
    return (
      <RiesgoAdopcionGuardarrail
        gerenciasCriticas={ws.gerenciasCriticasL3}
        gerenciasExcluidas={ws.gerenciasExcluidas}
        onToggleExclusion={ws.toggleGerenciaExclusion}
        onAccept={ws.acceptGuardarrail}
      />
    )
  }

  // ── HUB: workspace 70/30 ───────────────────────────────────────
  const activeLente = ws.data.lentes[ws.activeLenteId]
  const ActiveComponent = LENTE_COMPONENTS[ws.activeLenteId] ?? null

  return (
    <>
      <div className="fhr-bg-main h-screen flex flex-col overflow-hidden">
        {/* HEADER compacto */}
        <header className="flex-shrink-0 max-w-7xl mx-auto w-full px-4 pt-5 pb-3 md:px-8 md:pt-6 md:pb-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-extralight text-white leading-tight">
                Efficiency{' '}
                <span className="fhr-title-gradient">Intelligence Hub</span>
              </h1>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                9 lentes · 3 familias · Un plan listo para el directorio.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-6 text-right text-xs">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-500">
                  Personas analizadas
                </p>
                <p className="text-sm font-light text-white mt-0.5">
                  {ws.data.meta.enrichedCount.toLocaleString('es-CL')} /{' '}
                  {ws.data.meta.totalEmployees.toLocaleString('es-CL')}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-500">
                  Exposición IA promedio
                </p>
                <p className="text-sm font-light text-cyan-300 mt-0.5">
                  {Math.round(ws.data.meta.avgExposure * 100)}%
                </p>
              </div>
              {ws.gerenciasExcluidas.size > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">
                    Excluidas L3
                  </p>
                  <p className="text-sm font-light text-red-300 mt-0.5">
                    {ws.gerenciasExcluidas.size} gerencia
                    {ws.gerenciasExcluidas.size === 1 ? '' : 's'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* RAIL DE LENTES */}
        <div className="flex-shrink-0 max-w-7xl mx-auto w-full border-y border-slate-800/60 py-3">
          <EfficiencyRail
            activeLenteId={ws.activeLenteId}
            onSelect={ws.setActiveLenteId}
            lentesVisitados={ws.lentesVisitados}
            lentes={ws.data.lentes}
          />
        </div>

        {/* WORKSPACE 70/30 */}
        <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 md:px-8 py-4 md:py-6 overflow-hidden">
          <div className="h-full grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 md:gap-6 min-h-0">
            {/* Panel activo 70% */}
            <div className="min-h-0 min-w-0">
              {ActiveComponent ? (
                <ActiveComponent
                  lente={activeLente}
                  decisionesActuales={ws.decisionesDelLenteActivo}
                  onUpsert={ws.upsertDecision}
                  onRemove={ws.removeDecision}
                  onClearLente={() => ws.clearLente(ws.activeLenteId)}
                  gerenciasExcluidas={ws.gerenciasExcluidas}
                  allLentes={ws.data.lentes}
                />
              ) : (
                <div className="h-full flex items-center justify-center fhr-card">
                  <p className="text-sm text-slate-400 font-light">
                    Lente no disponible.
                  </p>
                </div>
              )}
            </div>

            {/* Panel acumuladores 30% */}
            <div className="hidden md:block min-h-0">
              <PanelAcumuladores
                tituloLenteActivo={activeLente?.titulo ?? ''}
                decisionesDelLenteActivo={ws.decisionesDelLenteActivo}
                resumenGlobal={ws.resumenCarrito}
                onRemove={ws.removeDecision}
                onClearLente={() => ws.clearLente(ws.activeLenteId)}
              />
            </div>
          </div>
        </main>
      </div>

      {/* CARRITO BAR fixed bottom — ancla psicológica, nunca desaparece */}
      <CarritoBar
        decisiones={[...ws.carrito.values()]}
        onClear={ws.clearCarrito}
      />
    </>
  )
}
