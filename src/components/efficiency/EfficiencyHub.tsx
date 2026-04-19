// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY HUB — Orquestador del nuevo diseño aprobado
// src/components/efficiency/EfficiencyHub.tsx
// ════════════════════════════════════════════════════════════════════════════
// Layout:
//   · Header compacto: eyebrow + MisPlanesBtn (sin breadcrumb, sin stats)
//   · Rail horizontal: 3 tabs underline por familia (sin pills)
//   · Panel central 70% con AnimatePresence:
//       - Lobby (activeLenteId=null): ShockGlobalPortada con número 96px
//       - Lente activo: LenteNavegacion + componente L* específico
//   · Panel derecho 30%: PanelAcumuladores (empty state elegante si vacío)
//   · EfficiencyToolbar fixed right (3 tools por familia)
//   · CarritoBar fixed bottom
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEfficiencyWorkspace } from '@/hooks/useEfficiencyWorkspace'
import { EfficiencyRail } from './EfficiencyRail'
import { PanelAcumuladores } from './panel-acumuladores/PanelAcumuladores'
import { RiesgoAdopcionGuardarrail } from './guardarrail/RiesgoAdopcionGuardarrail'
import { CarritoBar } from './carrito/CarritoBar'
import { MisPlanesBtn } from './MisPlanesBtn'
import { ShockGlobalPortada } from './ShockGlobalPortada'
import { LenteNavegacion } from './LenteNavegacion'
import EfficiencyToolbar from './EfficiencyToolbar'

// Componentes específicos por lente
import { L1CostoInercia } from './lentes/L1CostoInercia'
import { L2TalentoZombie } from './lentes/L2TalentoZombie'
import { L4CargosFantasma } from './lentes/L4CargosFantasma'
import { L5BrechaProductividad } from './lentes/L5BrechaProductividad'
import { L7L8MapaTalento } from './lentes/L7L8MapaTalento'
import { L9PasivoLaboral } from './lentes/L9PasivoLaboral'

import type { LenteId } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import type { LenteComponentProps } from './lentes/_LentePlaceholder'

// ════════════════════════════════════════════════════════════════════════════
// ROUTER DE LENTES
// ════════════════════════════════════════════════════════════════════════════

const LENTE_COMPONENTS: Partial<Record<LenteId, React.FC<LenteComponentProps>>> = {
  l1_inercia: L1CostoInercia,
  l2_zombie: L2TalentoZombie,
  l4_fantasma: L4CargosFantasma,
  l5_brecha: L5BrechaProductividad,
  l7_fuga: L7L8MapaTalento,
  l9_pasivo: L9PasivoLaboral,
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function EfficiencyHub() {
  const ws = useEfficiencyWorkspace()

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

  // ── HUB principal ─────────────────────────────────────────────
  const activeLente = ws.activeLenteId ? ws.data.lentes[ws.activeLenteId] : null
  const ActiveComponent = ws.activeLenteId
    ? LENTE_COMPONENTS[ws.activeLenteId] ?? null
    : null

  return (
    <>
      <div className="fhr-bg-main h-screen flex flex-col overflow-hidden">
        {/* ── HEADER compacto: eyebrow + Mis planes ──────────────── */}
        <header className="flex-shrink-0 max-w-7xl mx-auto w-full px-4 pt-5 pb-2 md:px-8 md:pt-6 md:pb-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">
              Eficiencia{' '}
              <span className="text-slate-700">·</span>{' '}
              <span className="text-slate-400">Plan organizacional</span>
            </p>
            <MisPlanesBtn />
          </div>
        </header>

        {/* ── RAIL: 3 tabs underline ─────────────────────────────── */}
        <div className="flex-shrink-0 max-w-7xl mx-auto w-full px-4 md:px-8">
          <EfficiencyRail
            activeFamiliaId={ws.activeFamiliaId}
            familiasVisitadas={ws.familiasVisitadas}
            onSelect={ws.selectFamilia}
          />
        </div>

        {/* ── WORKSPACE 70/30 ────────────────────────────────────── */}
        <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 md:px-8 py-4 md:py-6 overflow-hidden">
          <div className="h-full grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 md:gap-6 min-h-0">
            {/* Panel activo 70% */}
            <div className="min-h-0 min-w-0">
              <AnimatePresence mode="wait">
                {!ws.activeLenteId ? (
                  <ShockGlobalPortada
                    key="lobby"
                    shockGlobalMonthly={ws.shockGlobalMonthly}
                  />
                ) : ActiveComponent && activeLente ? (
                  <motion.div
                    key={ws.activeLenteId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="h-full min-h-0 flex flex-col"
                  >
                    {ws.lenteIndexInFamilia !== null &&
                      ws.lentesCountInFamilia !== null && (
                        <LenteNavegacion
                          index={ws.lenteIndexInFamilia}
                          total={ws.lentesCountInFamilia}
                          tituloLenteActivo={activeLente.titulo}
                          onPrev={ws.prevLenteInFamilia}
                          onNext={ws.nextLenteInFamilia}
                        />
                      )}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ActiveComponent
                        lente={activeLente}
                        decisionesActuales={ws.decisionesDelLenteActivo}
                        onUpsert={ws.upsertDecision}
                        onRemove={ws.removeDecision}
                        onClearLente={() =>
                          ws.activeLenteId && ws.clearLente(ws.activeLenteId)
                        }
                        gerenciasExcluidas={ws.gerenciasExcluidas}
                        allLentes={ws.data.lentes}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-slate-500 font-light">
                      Lente no disponible.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Panel acumuladores 30% */}
            <div className="hidden md:block min-h-0">
              <PanelAcumuladores
                tituloLenteActivo={activeLente?.titulo ?? ''}
                decisionesDelLenteActivo={ws.decisionesDelLenteActivo}
                resumenGlobal={ws.resumenCarrito}
                onRemove={ws.removeDecision}
                onClearLente={() =>
                  ws.activeLenteId && ws.clearLente(ws.activeLenteId)
                }
              />
            </div>
          </div>
        </main>
      </div>

      {/* Toolbar lateral (fixed right) — siempre presente */}
      <EfficiencyToolbar data={ws.data} />

      {/* CarritoBar fixed bottom */}
      <CarritoBar
        decisiones={[...ws.carrito.values()]}
        onClear={ws.clearCarrito}
      />
    </>
  )
}
