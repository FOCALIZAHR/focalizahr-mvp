'use client';

// src/app/dashboard/clima/components/planes/ClimaHallazgoCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// ACTO 3, NIVEL 1 — el hallazgo protagonista (diseño v3 §2).
//
// PIRÁMIDE DE MINTO: la conclusión arriba, la evidencia abajo y colapsada. El CEO
// lee el hallazgo; si quiere saber de dónde salió, expande.
//
// ── ES LA COLUMNA DERECHA DEL SPLIT, NO UNA CARD ─────────────────────────────
// Sin borde, sin fondo y sin Tesla line propios: todo eso vive en el contenedor
// (`ClimaEfectividadHallazgos`, molde `SpotlightCard`). Acá adentro solo va lo que
// en el molde original es la narrativa sobre la persona.
//
// La jerarquía la da la tipografía, no el chrome:
//   · headline `text-xl md:text-2xl` extralight — lo primero que el ojo agarra
//   · soporte `text-sm` slate-400 — el argumento, subordinado
//   · chevron al pie — la evidencia, a un clic
//
// 🕐 Fue una card con su propio borde y su Tesla line, cuando el bloque de
// hallazgos era un 30/70 con dos columnas de contenido. Al clonar el SpotlightCard
// perdió el chrome: una card adentro de otra card es el card-in-card que el
// proyecto prohíbe.
//
// ⛔ EL HEADLINE HABLA DEL PATRÓN, NUNCA DE UNA PERSONA (regla ética v3 §8).
// "6 de 8 líderes registran lo que van a hacer" describe una conducta agregada;
// "6 líderes no cumplieron" sería un juicio sobre gente con nombre y apellido, que
// además está listada justo ahí abajo.
//
// ⛔ EL CHEVRON ES LA AFORDANCIA, NO UN LINK (v3, corrección 8). Sin texto
// clickeable que parezca navegación: acá no se navega a ningún lado, el contenedor
// crece. Misma mecánica que `ClimaCoberturaGerencias` —`AnimatePresence` +
// `height: 0 → auto` + chevron que rota— para que expandir se sienta igual en
// toda la cápsula.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, BrainCircuit, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipContext } from '@/components/ui/TooltipContext';
import ClimaFindingCard from './ClimaFindingCard';
import {
  hallazgoHeadline,
  IA_TITULO,
  IA_TOOLTIP,
  EVIDENCIA_HEADER,
  EVIDENCIA_VISIBLE_MAX,
  evidenciaVerRestantes,
} from '@/lib/constants/climaHubContent';
import type { ClimaFindingsDTO, ClimaNarrativeDTO } from '@/types/clima-hub';

/** Grupo de orden que el servidor asigna a las promesas de acción (intención). */
const GRUPO_PROMESA = 1;

/** Color de la inteligencia (v3 §7). Mismo valor que usa el panel que lo contiene. */
const ACCENT_IA = '#A78BFA';

export default function ClimaHallazgoCard({
  data,
  narrative,
}: {
  data: ClimaFindingsDTO;
  /**
   * Narrativa de Sonnet. Llega DESPUÉS que el resto de la pantalla (~15 s) y por
   * su propio endpoint. `null` mientras carga, o para siempre si no hubo patrón o
   * si la validación la descartó.
   */
  narrative?: ClimaNarrativeDTO | null;
}) {
  const [expanded, setExpanded] = useState(false);
  // Se resetea al colapsar y volver a abrir: cerrar la evidencia es cerrarla, no
  // dejarla a medio desplegar esperando.
  const [verTodas, setVerTodas] = useState(false);

  if (data.cards.length === 0) return null;

  const visibles = verTodas ? data.cards : data.cards.slice(0, EVIDENCIA_VISIBLE_MAX);
  const restantes = data.cards.length - visibles.length;

  // Las promesas se cuentan sobre las tarjetas YA clasificadas por el servidor.
  // No se reclasifica nada acá: el cliente solo agrupa lo que le llegó resuelto.
  const promesas = data.cards.filter((c) => c.groupOrder === GRUPO_PROMESA).length;

  // El template NO es un estado de carga: es el piso. Si la narrativa nunca llega,
  // lo que queda es correcto — menos interesante, pero nunca falso.
  const headline = narrative?.headline ?? hallazgoHeadline(data.entriesAnalyzed, promesas);

  return (
    // Sin chrome propio: este componente ES la columna derecha del split, y su
    // contenedor —con su borde y su Tesla line— vive en `ClimaEfectividadHallazgos`.
    // Una card adentro de otra card daría el card-in-card que el proyecto prohíbe.
    <div>
      {/* ─── TÍTULO DEL PANEL ───
          Word-split canónico (skill → "Word Split en Títulos"): primera parte en
          blanco extralight, segunda en `fhr-title-gradient`. MISMO tamaño y peso
          que "Cobertura de Registro" en la pantalla anterior — las dos pantallas
          son del mismo producto y tienen que verse así.

          🕐 Fue un rótulo uppercase de 10px, después de 12px, clonado del label
          "ADECUACIÓN AL CARGO". Ese es el molde de un micro-label DENTRO de una
          card; éste titula la pantalla, y a ese peso quedaba subordinado a su
          propio contenido.

          "IA" va aparte y en púrpura: declara que lo de abajo salió de un motor.
          El tooltip cuelga del ícono de info, no del título entero: apuntar un
          título completo para leer una definición es un blanco difuso. */}
      <div className="flex items-center gap-2.5 mb-5">
        <BrainCircuit className="w-5 h-5 flex-shrink-0" style={{ color: ACCENT_IA }} />
        <h3 className="text-2xl font-extralight text-white tracking-tight leading-tight">
          <span className="font-light" style={{ color: ACCENT_IA }}>
            {IA_TITULO.badge}
          </span>
          <span className="text-slate-600 mx-1.5">·</span>
          {IA_TITULO.first}{' '}
          <span className="fhr-title-gradient">{IA_TITULO.second}</span>
        </h3>
        <TooltipContext
          title=""
          explanation={IA_TOOLTIP}
          position="bottom"
          plain
          usePortal
          variant="neutral"
        >
          <Info className="w-4 h-4 text-slate-600 hover:text-slate-400 transition-colors cursor-help flex-shrink-0" />
        </TooltipContext>
      </div>

      {/* ─── NIVEL 1 · el hallazgo ─── */}
      <button
        onClick={() => {
          setExpanded((v) => !v);
          if (expanded) setVerTodas(false);
        }}
        className="w-full text-left group"
      >
        {/* LA CONCLUSIÓN, y nada más.
            El rótulo de contexto, el conteo y el argumento de soporte viven en el
            panel del 30% (v3, corrección 5). Repetirlos acá los duplicaba a diez
            centímetros de distancia y le sacaba fuerza a lo único que esta card
            tiene que decir. Peso de título, no de párrafo. */}
        {/* El cambio de template a narrativa se anima: sin transición, el texto
            salta de golpe a los 15 segundos y parece un error de carga. */}
        <AnimatePresence mode="wait">
          <motion.h4
            key={narrative ? 'narrativa' : 'template'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-xl md:text-2xl font-extralight text-white leading-snug tracking-tight max-w-2xl"
          >
            {headline}
          </motion.h4>
        </AnimatePresence>

        {/* El argumento que sostiene la conclusión. Solo existe con narrativa: el
            template no lo tiene, y su conteo ya está en la columna izquierda. */}
        {narrative?.soporte && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-sm font-light text-slate-400 leading-relaxed mt-4"
          >
            {narrative.soporte}
          </motion.p>
        )}

        {/* Pie: solo el chevron. ES la afordancia — sin texto que parezca link. */}
        <div className="flex items-center justify-end mt-6">
          <span
            className={cn(
              'w-7 h-7 rounded-full border flex items-center justify-center transition-all',
              expanded
                ? 'border-slate-600 bg-slate-800/60'
                : 'border-slate-700/50 hover:border-slate-600'
            )}
          >
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-400 transition-transform',
                expanded && 'rotate-180'
              )}
            />
          </span>
        </div>
      </button>

      {/* ─── NIVEL 2 · la evidencia, colapsada por defecto ─── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-6 border-t border-slate-800/40">
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-600 mb-3">
                {EVIDENCIA_HEADER}
              </p>

              {/* El orden lo decide el servidor (§2, Acto 3): ejecución, promesa,
                  observación. Acá no se reordena — dos fuentes de verdad para el
                  mismo criterio terminan desincronizadas.
                  Tope de 10: más allá de eso la evidencia deja de leerse y pasa a
                  scrollearse. Las que faltan siguen estando, a un clic. */}
              <div className="space-y-2">
                {visibles.map((c, i) => (
                  <ClimaFindingCard key={c.entryId} card={c} index={i} />
                ))}
              </div>

              {restantes > 0 && (
                <button
                  onClick={() => setVerTodas(true)}
                  className="mt-3 text-[11px] font-light text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {evidenciaVerRestantes(restantes)}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
