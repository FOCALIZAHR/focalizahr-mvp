'use client';

// src/app/dashboard/clima/components/planes/ClimaEfectividadHallazgos.tsx
// ════════════════════════════════════════════════════════════════════════════
// CONTENIDO de la Cápsula 3 — la pantalla a la que lleva el CTA de la portada.
//
// PANTALLA APARTE, no un bloque debajo: cuando esto se ve, la portada ya no está
// (ver la máquina de estados en `ClimaEfectividadView`). Acá crece todo lo que la
// cápsula va a mostrar; la portada no se toca nunca.
//
// Hoy es un solo estado: todavía no cerró la medición que da el veredicto.
//
// Hoja de ruta de este archivo (plan maestro §2.1):
//   · H2 — Estado A: cobertura de registro por gerencia + cadencia táctica.
//     Ambos salen de datos que ya existen (`departmentId` y los timestamps de
//     `ClimaActionLogEntry`), sin LLM y sin esperar nada.
//   · H3 — Estado B: Acto Ancla (delta + multiplicador + cuadrantes) y la cascada
//     de hallazgos con su evidencia. Se enciende solo cuando hay veredicto.
//
// La transición entre estados es automática: la manda el dato, no un control del
// usuario. Por eso este componente decide qué mostrar y la portada nunca cambia.
//
// ⛔ SIN LENGUAJE DE ROADMAP. El estado vacío nombra la condición del NEGOCIO que
// falta —que vuelva a medirse el clima—, no la pantalla que falta construir. Eso
// seguiría siendo verdad aunque H3 ya estuviera terminado, y es la diferencia
// entre informar y pedir disculpas. Regla del proyecto: cero "en construcción".
// ════════════════════════════════════════════════════════════════════════════

import { FHREmptyState } from '@/components/ui/FHREmptyState';
import { HUB_EFECTIVIDAD_PENDIENTE } from '@/lib/constants/climaHubContent';

export default function ClimaEfectividadHallazgos() {
  // FHREmptyState ya trae su propio contenedor con borde: envolverlo en otra card
  // daría card-in-card, que es anti-patrón del proyecto.
  return (
    <FHREmptyState
      type="pending"
      title={HUB_EFECTIVIDAD_PENDIENTE.title}
      description={HUB_EFECTIVIDAD_PENDIENTE.description}
    />
  );
}
