'use client';

// src/app/dashboard/clima/components/planes/ClimaFindingCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Tarjeta del Modo Táctico (diseño v2 §3.2): UN registro de bitácora con su
// clasificación, como evidencia auditable.
//
// La jerarquía de lectura es deliberada y está en §3.3:
//   1. la ETIQUETA arriba, en texto plano — qué tipo de registro es
//   2. la CITA textual, con borde izquierdo cyan — la evidencia
//   3. el ÍNDICE en purple — la lectura del motor
//   4. el AUTOR al pie, en cyan — metadato de autoría
//   5. el CONTEXTO en mono slate — dónde ocurrió
//
// ⛔ NUNCA SE TITULA CON EL NOMBRE DEL JEFE (§3.3, regla ética §9). El nombre va
// al PIE, después de la evidencia. Titular con la persona convertiría la tarjeta
// en un expediente sobre alguien; titulada por la etiqueta, es un registro sobre
// una táctica. Es la diferencia entre "Juan Pérez no cumplió" y "Promesa de Acción".
//
// ── DISTINCIÓN VISUAL SIN SEMÁFORO ───────────────────────────────────────────
// Las tres etiquetas se distinguen de un vistazo, pero NO por color semántico: el
// canal es el BORDE de la tarjeta, y la escala es de PRESENCIA, no de valencia.
//
//   Ejecución Comprobable   → borde cyan      (cyan = dato/acción en el sistema)
//   Promesa de Acción       → borde slate tenue
//   Observación sin Ejecución → sin borde
//
// Rojo y verde quedan afuera: serían un semáforo, y encima aplicado a personas con
// nombre y apellido listadas ahí mismo. Cyan no significa "bien" — es el color con
// que TODO el sistema marca los datos reales; que la ejecución comprobable lo tenga
// y la promesa no, dice "acá hay un hecho" y "acá todavía no", que es exactamente
// la diferencia. El borde de "sin ejecución" es transparente y no ausente, para que
// las tres tarjetas midan igual y la lista no se desalinee.
//
// La ETIQUETA en sí sigue en texto plano, sin color y sin emoji (§3.2).
//
// ⛔ EL TEXTO VA VERBATIM. Sin normalizar mayúsculas, sin corregir ortografía. Un
// registro en MAYÚSCULAS con errores de tipeo se muestra así: es evidencia, no un
// reporte que alguien redactó para ser leído.
//
// La densidad NO aparece (§3.3): ya está adentro del Índice de Confiabilidad.
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { tacticoContexto, tacticoFecha } from '@/lib/constants/climaHubContent';
import type { ClimaTacticalCardDTO } from '@/types/clima-hub';

/** Grupos que asigna el servidor: 0 ejecución · 1 promesa · 2 observación. */
const BORDE_POR_GRUPO: Record<number, string> = {
  0: 'border-cyan-500/40',
  1: 'border-slate-700/40',
  2: 'border-transparent',
};

export default function ClimaFindingCard({
  card,
  index,
}: {
  card: ClimaTacticalCardDTO;
  index: number;
}) {
  const borde = BORDE_POR_GRUPO[card.groupOrder] ?? 'border-slate-800/40';

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-slate-900/40 backdrop-blur-sm p-4',
        borde
      )}
    >
      {/* 1 · Etiqueta — texto plano, sin color semántico, sin emoji.
             La Tesla line se retiró de la tarjeta: ahora vive en el HALLAZGO que
             las contiene. Repetirla en cada tarjeta de evidencia le sacaba peso al
             que manda y llenaba la lista de firmas de marca. */}
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-400 mt-1 mb-3">
        {card.label}
      </p>

      {/* 2 · La cita, VERBATIM. `whitespace-pre-wrap` conserva los saltos de línea
             que el jefe escribió; `break-words` evita que un pegote sin espacios
             rompa el layout en 320px. */}
      <blockquote className="border-l-2 border-cyan-400/60 pl-3 py-0.5">
        <p className="text-[13px] font-light text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
          {card.text}
        </p>
      </blockquote>

      {/* 3 · Índice de Confiabilidad — purple, porque es lectura del motor */}
      <p className="text-[11px] font-light mt-3" style={{ color: '#A78BFA' }}>
        Índice de Confiabilidad: {card.confidenceLabel}
      </p>

      {/* 4 · Autoría al pie — cyan, como metadato. Nunca encabezado. */}
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[11px] font-light text-cyan-400">
          — {card.authorName ?? 'Autor no identificado'}
          {card.authorPosition ? ` · ${card.authorPosition}` : ''}
        </span>
        <span className="text-[10px] font-light text-slate-500">{tacticoFecha(card.createdAt)}</span>
      </div>

      {/* 5 · Contexto — dónde ocurrió */}
      <p className="text-[10px] font-mono text-slate-600 mt-1.5">
        {tacticoContexto(card.dimension, card.departmentName)}
      </p>
    </motion.article>
  );
}
