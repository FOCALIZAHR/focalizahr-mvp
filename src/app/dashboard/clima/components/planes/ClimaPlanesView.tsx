'use client';

// src/app/dashboard/clima/components/planes/ClimaPlanesView.tsx
// ════════════════════════════════════════════════════════════════════════════
// Subproducto "Planes de Acción" (5ª card del Rail, Gate 5D). Shell Cinema Mode
// con 2 tabs internos:
//   - departamento (Tab 1): portada → carrusel de 4 caminos → workspace de camino.
//   - seguimiento  (Tab 3): tracking + matriz de efectividad (GROUP C).
// Tab 2 (por persona / doble CTA) es 5D-ii, fuera de este componente.
//
// El shell SE CORRE (modo `bare`) cuando el usuario está dentro de un camino: ese
// workspace trae su propio card (Split de Contexto de Categoría, clon de
// SpotlightCard) y anidarlo daría card-in-card. Se hace con classNames
// condicionales sobre los MISMOS nodos — devolver otro árbol remontaría
// ClimaPlanDeptTab y resetearía su estado en loop.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import ClimaPlanDeptTab, { type ClimaPlanDeptView } from './ClimaPlanDeptTab';

type PlanesTab = 'departamento' | 'seguimiento';

const TABS: { id: PlanesTab; label: string }[] = [
  { id: 'departamento', label: 'Por departamento' },
  { id: 'seguimiento', label: 'Seguimiento' },
];

interface ClimaPlanesViewProps {
  campaignId: string | null;
  onBack: () => void;
}

export default function ClimaPlanesView({ campaignId, onBack }: ClimaPlanesViewProps) {
  const [tab, setTab] = useState<PlanesTab>('departamento');
  const [deptView, setDeptView] = useState<ClimaPlanDeptView>('carrusel');

  // Dentro de la portada o de un camino, la vista interna trae su PROPIO container
  // (portada = molde CompensationPortada; workspace = Split de Contexto de Categoría)
  // → el shell se corre para no anidar card dentro de card. Equivale a `!showTabs`.
  // La salida de esas pantallas es el Rail fijo de abajo (un solo control por vista).
  const bare = tab === 'departamento' && deptView !== 'carrusel';

  return (
    <div
      className={cn(
        'w-full',
        // Cada vista pide el ancho que su layout necesita: el Workspace usa 1024px por
        // su split 35/65; la Portada es una columna centrada y a ese ancho queda
        // flotando en el vacío (texto angosto + card ancha = 50% de uso).
        deptView === 'path' ? 'max-w-5xl' : 'max-w-4xl'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden',
          !bare && 'rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm'
        )}
      >
        {/* Tesla line del shell (se oculta en modo bare: el workspace trae la suya) */}
        {!bare && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
              opacity: 0.7,
            }}
          />
        )}

        <div className={cn(!bare && 'px-5 py-5 md:px-6 md:py-6')}>
          {/* Top bar — breadcrumb: Volver + tabs DISCRETOS (mono 10px). Los tabs viven
              acá, fuera del bloque de las 4 cards, para no competir con ellas en
              jerarquía. Oculto entero en modo bare. */}
          {!bare && (
            <div className="flex items-center justify-between gap-4 mb-6">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] font-light"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
              <div className="flex items-center gap-4">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'text-[10px] font-mono uppercase tracking-wider transition-colors',
                      tab === t.id ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cuerpo del tab */}
          {tab === 'departamento' ? (
            <ClimaPlanDeptTab
              campaignId={campaignId}
              onViewChange={setDeptView}
              onExitToLobby={onBack}
            />
          ) : (
            <FHREmptyState
              type="pending"
              title="Seguimiento del plan"
              description="El seguimiento y la matriz de efectividad aparecen aquí una vez que hay un plan aprobado y su próxima medición de clima cierra."
            />
          )}
        </div>
      </div>
    </div>
  );
}
