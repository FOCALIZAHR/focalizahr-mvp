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

import { useState } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { SecondaryButton } from '@/components/ui/PremiumButton'
import { useEfficiencyWorkspace } from '@/hooks/useEfficiencyWorkspace'
import { PanelAcumuladores } from './panel-acumuladores/PanelAcumuladores'
import { CarritoBar } from './carrito/CarritoBar'
import type { LenteActo } from './lentes/LenteLayout'
import { ShockGlobalPortada } from './ShockGlobalPortada'
import ActoAncla from './ActoAncla'
import { FamilyAccordion } from './FamilyAccordion'
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

// Lentes migrados al molde maestro LenteLayout — su CTA "Siguiente" vive
// en el totalizador del checkpoint (PrimaryButton canónico), por lo que
// el LenteFooterNav legacy debe ocultarse para evitar duplicación.
// Los lentes que aún usan LenteCard sí lo necesitan.
const LENTES_CON_LAYOUT: Set<LenteId> = new Set(['l1_inercia', 'l2_zombie'])

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function EfficiencyHub() {
  const ws = useEfficiencyWorkspace()
  // Acto del lente activo (reportado por LenteLayout vía onActChange).
  // Se usa para atenuar el PanelAcumuladores durante el Acto Silencio,
  // donde el número hero debe respirar sin competencia visual.
  const [lenteActo, setLenteActo] = useState<LenteActo | null>(null)

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
      <div className="fhr-bg-main min-h-screen">
        {/* ── WORKSPACE ─────────────────────────────────────────────
            Patrón A: page scroll natural. Sin header sticky — "Efficiency
            Intelligence" + "Mis planes" viven en el CarritoBar (fixed
            bottom, solo visible en briefing/lente). En lobby/ancla el
            CEO está en modo contemplativo, no necesita navegación global.
            · pb-32 reserva espacio bajo el CarritoBar.
            · El componente activo decide su altura natural; las vistas
              above-the-fold (lobby, ancla) usan min-h-[calc(100vh-Xpx)]. */}
        <main className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-32">
          <div
            className={`grid gap-4 md:gap-6 ${
              muestraPanelDerecho
                ? 'grid-cols-1 md:grid-cols-[1fr_320px]'
                : 'grid-cols-1'
            }`}
          >
            {/* Panel activo — altura natural, sin overflow propio */}
            <div className="min-w-0 pt-4 md:pt-5">
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
                    key="briefing-accordion"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <FamilyAccordion
                      activeFamiliaId={ws.activeFamiliaId}
                      lentes={ws.data.lentes}
                      onSelectLente={ws.selectLente}
                      onSelectFamilia={ws.selectFamilia}
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
                    {/* Header del lente — botón "Volver al menú" arriba-derecha.
                        Acceso sin scroll al briefing (las 3 cards expansibles),
                        complementa al LenteFooterNav que vive al pie. */}
                    <div className="flex justify-end mb-4 md:mb-6">
                      <SecondaryButton
                        icon={ArrowLeft}
                        iconPosition="left"
                        onClick={ws.returnToBriefing}
                        size="sm"
                      >
                        Volver al menú
                      </SecondaryButton>
                    </div>

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
                      onNextLente={ws.nextLenteInFamilia}
                      proximoLenteTitulo={proximoLenteTitulo}
                      onActChange={setLenteActo}
                    />

                    {/* Footer nav legacy — solo para lentes que aún usan
                        LenteCard. Los migrados a LenteLayout tienen su CTA
                        canónico en el checkpoint del molde. */}
                    {ws.activeLenteId &&
                      !LENTES_CON_LAYOUT.has(ws.activeLenteId) &&
                      ws.lenteIndexInFamilia !== null &&
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

            {/* Panel acumuladores 30% — sticky lateral, siempre visible
                mientras se opera el lente. top-4 = sin header encima.
                Atenuado durante el Acto Silencio para no competir con
                el número hero protagonista. */}
            {muestraPanelDerecho && (
              <div
                className={`hidden md:block pt-4 md:pt-5 transition-opacity duration-500 ${
                  lenteActo === 'silencio'
                    ? 'opacity-30 pointer-events-none'
                    : 'opacity-100'
                }`}
              >
                <div className="sticky top-4">
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
