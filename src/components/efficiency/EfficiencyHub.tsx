// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY HUB — Orquestador del nuevo diseño aprobado
// src/components/efficiency/EfficiencyHub.tsx
// ════════════════════════════════════════════════════════════════════════════
// Layout:
//   · Header compacto: eyebrow + MisPlanesBtn (sin breadcrumb, sin stats)
//   · Rail horizontal: 3 tabs underline por familia (sin pills)
//   · Panel central 70% con AnimatePresence:
//       - Lobby (activeLenteId=null): ShockGlobalPortada con número 96px
//       - Lente activo: componente L* + footer CTA al final
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
import { CarritoBar } from './carrito/CarritoBar'
import { MisPlanesBtn } from './MisPlanesBtn'
import { ShockGlobalPortada } from './ShockGlobalPortada'
import ActoAncla from './ActoAncla'
import { FamilyBriefing } from './FamilyBriefing'
import { LenteFooterNav } from './LenteFooterNav'
import EfficiencyToolbar from './EfficiencyToolbar'
import { LENTES_POR_FAMILIA } from '@/hooks/useEfficiencyWorkspace'
import { LENTES_META } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

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

  // ── HUB principal ─────────────────────────────────────────────
  const activeLente = ws.activeLenteId ? ws.data.lentes[ws.activeLenteId] : null
  const ActiveComponent = ws.activeLenteId
    ? LENTE_COMPONENTS[ws.activeLenteId] ?? null
    : null

  // Colores de familia para el CTA de footer nav
  const familiaAccent: Record<string, string> = {
    capital_en_riesgo: '#22D3EE',
    ruta_ejecucion: '#A78BFA',
    costo_esperar: '#F59E0B',
  }

  // Derivar títulos de lentes vecinos dentro de la familia para el footer nav
  let proximoLenteTitulo: string | undefined
  let anteriorLenteTitulo: string | undefined
  if (ws.activeLenteId && ws.activeFamiliaId && ws.lentesCountInFamilia) {
    const lentesFam = LENTES_POR_FAMILIA[ws.activeFamiliaId] ?? []
    const idx = ws.lenteIndexInFamilia ?? 0
    const nextIdx = (idx + 1) % lentesFam.length
    const prevIdx = (idx - 1 + lentesFam.length) % lentesFam.length
    proximoLenteTitulo = LENTES_META[lentesFam[nextIdx]]?.titulo
    if (lentesFam.length > 1 && prevIdx !== idx) {
      anteriorLenteTitulo = LENTES_META[lentesFam[prevIdx]]?.titulo
    }
  }

  // Panel derecho (PanelAcumuladores) aparece sólo cuando hay lente activo.
  // En lobby y briefing el panel derecho vive INLINE dentro del componente
  // (el briefing monta su propio "potencial quiet" en el grid 1fr/260px).
  const muestraPanelDerecho = ws.hubView === 'lente'

  return (
    <>
      <div className="fhr-bg-main h-screen flex flex-col overflow-hidden">
        {/* ── HEADER ultracompacto ─────────────────────────────────
            · lobby + ancla → eyebrow + Mis planes (sin rail)
            · briefing + lente → rail de familias + Mis planes
            El Acto Ancla es la primera vez que el CEO ve las 3 familias. */}
        <header className="flex-shrink-0 max-w-7xl mx-auto w-full px-4 md:px-8 border-b border-slate-800/40">
          <div className="flex items-center justify-between gap-4 py-3">
            {ws.hubView === 'lobby' || ws.hubView === 'ancla' ? (
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-light">
                Efficiency Intelligence
              </span>
            ) : (
              <EfficiencyRail
                activeFamiliaId={ws.activeFamiliaId}
                familiasVisitadas={ws.familiasVisitadas}
                onSelect={ws.selectFamilia}
              />
            )}
            <MisPlanesBtn />
          </div>
        </header>

        {/* ── WORKSPACE ──────────────────────────────────────────── */}
        <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 md:px-8 overflow-hidden">
          <div
            className={`h-full grid gap-4 md:gap-6 min-h-0 ${
              muestraPanelDerecho
                ? 'grid-cols-1 md:grid-cols-[1fr_320px]'
                : 'grid-cols-1'
            }`}
          >
            {/* Panel activo — overflow condicional:
                · lobby + ancla → above-the-fold sin scroll
                · briefing + lente → scroll vertical libre con padding
                  reservado para CarritoBar fixed bottom */}
            <div
              className={
                ws.hubView === 'lobby' || ws.hubView === 'ancla'
                  ? 'min-h-0 min-w-0 overflow-hidden pt-4 md:pt-5'
                  : 'min-h-0 min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pt-4 md:pt-5 pb-32'
              }
            >
              <AnimatePresence mode="wait">
                {ws.hubView === 'lobby' ? (
                  <ShockGlobalPortada
                    key="lobby"
                    shockGlobalMonthly={ws.shockGlobalMonthly}
                    onShowDiagnostico={ws.showAncla}
                  />
                ) : ws.hubView === 'ancla' ? (
                  <ActoAncla
                    key="ancla"
                    data={ws.data}
                    onSelectFamilia={ws.selectFamilia}
                    onBack={ws.returnToLobby}
                  />
                ) : ws.hubView === 'briefing' && ws.activeFamiliaId ? (
                  <motion.div
                    key={`briefing-${ws.activeFamiliaId}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <FamilyBriefing
                      familiaId={ws.activeFamiliaId}
                      lentes={ws.data.lentes}
                      onSelectLente={ws.selectLente}
                    />
                  </motion.div>
                ) : ActiveComponent && activeLente ? (
                  <motion.div
                    key={ws.activeLenteId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
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

                    {/* Footer nav: CTA grande al final del lente */}
                    {ws.lenteIndexInFamilia !== null &&
                      ws.lentesCountInFamilia !== null &&
                      ws.activeFamiliaId &&
                      proximoLenteTitulo && (
                        <LenteFooterNav
                          index={ws.lenteIndexInFamilia}
                          total={ws.lentesCountInFamilia}
                          proximoTitulo={proximoLenteTitulo}
                          anteriorTitulo={anteriorLenteTitulo}
                          accentColor={familiaAccent[ws.activeFamiliaId]}
                          onNext={ws.nextLenteInFamilia}
                          onPrev={ws.prevLenteInFamilia}
                          onBackToBriefing={ws.returnToBriefing}
                        />
                      )}
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

            {/* Panel acumuladores 30% — solo cuando hay lente activo */}
            {muestraPanelDerecho && (
              <div className="hidden md:block min-h-0 pt-4 md:pt-5 pb-32">
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
            )}
          </div>
        </main>
      </div>

      {/* Toolbar lateral (fixed right) — siempre presente */}
      <EfficiencyToolbar data={ws.data} />

      {/* CarritoBar fixed bottom — solo cuando el CEO ya está operando.
          En lobby/ancla no hay decisiones posibles, el carrito no tiene contexto. */}
      {(ws.hubView === 'briefing' || ws.hubView === 'lente') && (
        <CarritoBar
          decisiones={[...ws.carrito.values()]}
          onClear={ws.clearCarrito}
        />
      )}
    </>
  )
}
