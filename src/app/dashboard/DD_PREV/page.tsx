"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";

// ─── Design System FocalizaHR ────────────────────────────────────────────────
import "@/styles/focalizahr-design-system.css";
import "./dd-prev.css"; // Clases auxiliares específicas de esta demo
import { 
  PrimaryButton, 
  SecondaryButton, 
  GhostButton 
} from "@/components/ui/PremiumButton";

import {
  PERSONAS,
  BANDA_COLORS,
  ACCION_CONFIG,
  calcularCR,
  calcularTargetUSD,
  calcularSalarioNuevo,
  type Persona,
  type Banda,
} from "./personas";
import { NARRATIVAS, getNarrativa, type Narrativa } from "./narrativas";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS LOCALES
// ─────────────────────────────────────────────────────────────────────────────
type Vista = "lider" | "colaborador";
type TabConversacion = "guia" | "mensaje" | "preguntas";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatUSD(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function pctPosition(value: number, min: number, max: number): number {
  return Math.max(2, Math.min(98, ((value - min) / (max - min)) * 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────

// Header
function Header({ vista, setVista }: { vista: Vista; setVista: (v: Vista) => void }) {
  return (
    <header className="fhr-header sticky top-0 z-50">
      {/* Línea Tesla */}
      <div className="fhr-tesla-line" />
      
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="fhr-logo-mark">F</div>
          <div>
            <div className="fhr-subtitle text-sm">FocalizaHR · Derechos Digitales</div>
            <div className="fhr-text-muted text-xs">Sistema de Compensaciones 2026 · Fichas 1:1</div>
          </div>
        </div>

        {/* Toggle Vista */}
        <div className="flex items-center gap-3">
          <span className="fhr-text-muted mr-2 text-xs font-medium uppercase tracking-wider">Vista:</span>
          <div className="flex gap-2">
            <GhostButton
              size="sm"
              icon={Eye}
              onClick={() => setVista("lider")}
              glow={vista === "lider"}
            >
              Líder
            </GhostButton>
            <GhostButton
              size="sm"
              icon={EyeOff}
              onClick={() => setVista("colaborador")}
              glow={vista === "colaborador"}
            >
              Colaborador/a
            </GhostButton>
          </div>
        </div>
      </div>
    </header>
  );
}

// Card de persona en el rail
function PersonaCard({
  persona,
  isActive,
  onClick,
}: {
  persona: Persona;
  isActive: boolean;
  onClick: () => void;
}) {
  const accion = ACCION_CONFIG[persona.accion];
  const bandaColor = BANDA_COLORS[persona.banda];
  const cr = calcularCR(persona);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`fhr-card relative min-w-[170px] p-4 text-left ${
        isActive ? "fhr-card-active" : ""
      }`}
    >
      {/* Línea Tesla dinámica */}
      {isActive && (
        <div 
          className="fhr-tesla-line-dynamic"
          style={{ "--dynamic-color": "var(--focalizahr-cyan)" } as React.CSSProperties}
        />
      )}

      {/* Indicador de acción */}
      <div
        className="fhr-status-dot absolute right-3 top-3"
        style={{ backgroundColor: accion.color, boxShadow: `0 0 8px ${accion.color}60` }}
      />

      {/* Nombre */}
      <div className="fhr-subtitle mb-1 pr-6 text-sm">{persona.nombre}</div>

      {/* Cargo */}
      <div className="fhr-text-muted mb-3 text-[11px] leading-snug">
        {persona.cargo} · {persona.pais}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className="fhr-badge"
          style={{ backgroundColor: `${bandaColor}20`, color: bandaColor, borderColor: `${bandaColor}40` }}
        >
          {persona.banda}
        </span>
        <span className="fhr-badge-draft">
          {persona.nivel}
        </span>
      </div>

      {/* CR */}
      <div className="fhr-text-muted mt-2 text-[11px]">
        CR {cr.toFixed(2)}x
      </div>
    </motion.button>
  );
}

// Rail de personas
function PersonasRail({
  bandaFiltro,
  setBandaFiltro,
  personaActiva,
  setPersonaActiva,
}: {
  bandaFiltro: Banda | "all";
  setBandaFiltro: (b: Banda | "all") => void;
  personaActiva: string | null;
  setPersonaActiva: (id: string) => void;
}) {
  const personasFiltradas = useMemo(() => {
    if (bandaFiltro === "all") return PERSONAS;
    return PERSONAS.filter((p) => p.banda === bandaFiltro);
  }, [bandaFiltro]);

  const bandas: Array<{ key: Banda | "all"; label: string }> = [
    { key: "all", label: "Todos" },
    { key: "B1", label: "B1 · Dirección" },
    { key: "B2", label: "B2 · Direcciones" },
    { key: "B3", label: "B3 · Coord." },
    { key: "B4", label: "B4 · Analistas" },
  ];

  return (
    <div className="fhr-section-bg px-6 py-5">
      <div className="mx-auto max-w-7xl">
        {/* Título */}
        <h2 className="fhr-title-gradient mb-1 text-xl">
          Fichas de Conversación Individual
        </h2>
        <div className="fhr-text-muted mb-4 text-sm">
          Selecciona una persona ·{" "}
          <span className="fhr-text-accent">15 colaboradores · 4 bandas</span>
        </div>

        {/* Tabs de banda */}
        <div className="mb-4 flex flex-wrap gap-2">
          {bandas.map((b) => (
            <button
              key={b.key}
              onClick={() => setBandaFiltro(b.key)}
              className={`fhr-tab ${bandaFiltro === b.key ? "fhr-tab-active" : ""}`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Grid de personas */}
        <div className="fhr-scroll-container flex gap-3 overflow-x-auto pb-2">
          {personasFiltradas.map((p) => (
            <PersonaCard
              key={p.id}
              persona={p}
              isActive={personaActiva === p.id}
              onClick={() => setPersonaActiva(p.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Journey salarial tipo "estaciones de metro"
function JourneySalarial({ persona, vista }: { persona: Persona; vista: Vista }) {
  const salarioNuevo = calcularSalarioNuevo(persona);
  const targetUSD = calcularTargetUSD(persona);
  const cr = calcularCR(persona);
  const crNuevo = salarioNuevo / targetUSD; // ✅ Corregido: vs target propio, no vs midpoint
  const pctTotal = persona.pctBase + persona.pctMerito;
  const bandaColor = BANDA_COLORS[persona.banda];
  const accion = ACCION_CONFIG[persona.accion];

  // Posiciones en la línea (0-100%)
  const posHoy = pctPosition(persona.salario, persona.minBanda, persona.maxBanda);
  const posNuevo = pctPosition(salarioNuevo, persona.minBanda, persona.maxBanda);
  const posTarget = pctPosition(targetUSD, persona.minBanda, persona.maxBanda);

  // Estaciones del journey — exactamente 4 puntos
  const estaciones = [
    {
      id: "hoy",
      label: "Hoy",
      valor: persona.salario,
      sub: `CR ${cr.toFixed(2)}x`,
      pos: posHoy,
      alcanzado: true,
      color: "slate",
    },
    {
      id: "nuevo",
      label: "Después del ajuste",
      valor: salarioNuevo,
      sub: pctTotal > 0 ? `+${pctTotal.toFixed(1)}%` : "Sin ajuste",
      pos: posNuevo,
      alcanzado: pctTotal > 0,
      color: "cyan",
      soloLider: true,
    },
    {
      id: "target",
      label: "Tu objetivo",
      valor: targetUSD,
      sub: `CR ${persona.targetCR.toFixed(2)}x`,
      pos: posTarget,
      alcanzado: salarioNuevo >= targetUSD,
      color: "amber",
      destacado: true,
    },
    {
      id: "max",
      label: "Techo de banda",
      valor: persona.maxBanda,
      sub: `Máximo ${persona.banda}`,
      pos: 98,
      alcanzado: salarioNuevo >= persona.maxBanda,
      color: "slate",
    },
  ].filter((e) => !(e.soloLider && vista === "colaborador"));

  // Calcular insight
  const pctDeReferencia = (salarioNuevo / targetUSD) * 100;
  const faltaUSD = Math.max(0, targetUSD - salarioNuevo);

  return (
    <div className="fhr-card relative p-6">
      {/* Línea Tesla */}
      <div className="fhr-tesla-line" />
      
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="fhr-label mb-1">
            Journey Salarial · Banda {persona.banda}
          </div>
          <div className="fhr-text-muted text-sm">
            Midpoint de referencia = {formatUSD(persona.midpoint)} USD
          </div>
        </div>
        {/* Status badge */}
        <div
          className="fhr-badge-status flex items-center gap-2"
          style={{
            borderColor: `${accion.color}40`,
            backgroundColor: `${accion.color}10`,
          }}
        >
          <span className="text-lg">{accion.icon}</span>
          <div>
            <div className="text-xs font-semibold" style={{ color: accion.color }}>
              {accion.label}
            </div>
            <div className="text-[10px] opacity-70" style={{ color: accion.color }}>
              {accion.sub}
            </div>
          </div>
        </div>
      </div>

      {/* Línea de metro - ALTURA AUMENTADA para etiquetas arriba Y abajo */}
      <div className="relative mb-20 mt-24">
        {/* Línea base */}
        <div className="fhr-progress-track absolute left-0 right-0 top-1/2 -translate-y-1/2" />

        {/* Línea de progreso (hasta el nuevo salario) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${posNuevo}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fhr-progress-fill absolute left-0 top-1/2 -translate-y-1/2"
        />

        {/* Estaciones */}
        {estaciones.map((est, idx) => {
          const colors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
            slate: { bg: "fhr-station-inactive", border: "fhr-station-border", text: "fhr-text-muted", glow: "" },
            cyan: { bg: "fhr-station-cyan", border: "fhr-station-cyan-border", text: "fhr-text-accent", glow: "fhr-glow-cyan" },
            amber: { bg: "fhr-station-amber", border: "fhr-station-amber-border", text: "fhr-text-warning", glow: "fhr-glow-amber" },
            purple: { bg: "fhr-station-purple", border: "fhr-station-purple-border", text: "fhr-text-purple", glow: "fhr-glow-purple" },
          };
          const c = colors[est.color] || colors.slate;

          // Colores inline como fallback (las clases fhr-station-* pueden no existir)
          const colorMap: Record<string, { bg: string; border: string; textColor: string; shadow: string }> = {
            slate: { bg: "#334155", border: "#475569", textColor: "#94a3b8", shadow: "" },
            cyan: { bg: "#22d3ee", border: "#06b6d4", textColor: "#22d3ee", shadow: "0 0 12px rgba(34,211,238,0.5)" },
            amber: { bg: "#f59e0b", border: "#d97706", textColor: "#f59e0b", shadow: "0 0 12px rgba(245,158,11,0.5)" },
            purple: { bg: "#a78bfa", border: "#8b5cf6", textColor: "#a78bfa", shadow: "0 0 12px rgba(167,139,250,0.5)" },
          };
          const cm = colorMap[est.color] || colorMap.slate;

          // ═══ ALTERNANCIA: ARRIBA = salarios persona (hoy/nuevo), ABAJO = benchmarks (target/max) ═══
          const etiquetaArriba = est.id === "hoy" || est.id === "nuevo";

          return (
            <motion.div
              key={est.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${est.pos}%` }}
            >
              {/* Etiqueta ARRIBA (hoy / después del ajuste) */}
              {etiquetaArriba && (
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                  <div 
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: cm.textColor }}
                  >
                    {est.label}
                  </div>
                  <div className="fhr-subtitle text-sm font-bold">
                    {formatUSD(est.valor)}
                  </div>
                  <div className="fhr-text-muted text-[10px]">{est.sub}</div>
                </div>
              )}

              {/* Punto de estación */}
              <div
                className="fhr-station-dot relative flex h-7 w-7 items-center justify-center rounded-full border-[3px]"
                style={{
                  backgroundColor: est.alcanzado ? cm.bg : "#0f172a",
                  borderColor: cm.border,
                  boxShadow: est.alcanzado && est.destacado ? cm.shadow : undefined,
                }}
              >
                {est.alcanzado && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>

              {/* Etiqueta ABAJO (tu objetivo / techo de banda) */}
              {!etiquetaArriba && (
                <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                  <div 
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: cm.textColor }}
                  >
                    {est.label}
                  </div>
                  <div className="fhr-subtitle text-sm font-bold">
                    {formatUSD(est.valor)}
                  </div>
                  <div className="fhr-text-muted text-[10px]">{est.sub}</div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Insight resumen */}
      <div className="fhr-card-inner px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="fhr-icon-box">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <div className="fhr-subtitle text-sm">
                Después del ajuste estarás al <span className="fhr-text-accent">{pctDeReferencia.toFixed(0)}%</span> de tu objetivo
              </div>
              <div className="fhr-text-muted text-xs">
                {faltaUSD > 0 ? (
                  <>Faltarán <span className="fhr-text-warning">{formatUSD(faltaUSD)}</span> para llegar a tu objetivo de <span className="fhr-text-accent">{formatUSD(targetUSD)}</span></>
                ) : (
                  <span className="fhr-text-success">¡Ya alcanzaste tu objetivo de {formatUSD(targetUSD)}!</span>
                )}
              </div>
            </div>
          </div>

          {vista === "lider" && pctTotal > 0 && (
            <div className="fhr-kpi-group flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="fhr-label">Base</div>
                <div className="fhr-subtitle font-semibold">{persona.pctBase.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="fhr-label">Mérito</div>
                <div className="fhr-text-purple font-semibold">{persona.pctMerito.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="fhr-label">Total</div>
                <div className="fhr-text-accent font-bold">{pctTotal.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="fhr-label">Δ Anual</div>
                <div className="fhr-text-success font-semibold">
                  +{formatUSD((salarioNuevo - persona.salario) * 12)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simulador de conversación con tabs
function SimuladorConversacion({
  persona,
  narrativa,
  vista,
}: {
  persona: Persona;
  narrativa: Narrativa;
  vista: Vista;
}) {
  const [tabActivo, setTabActivo] = useState<TabConversacion>("mensaje");
  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(0);
  const [copiado, setCopiado] = useState(false);

  const copiarTexto = useCallback(async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  }, []);

  // Tabs disponibles según vista
  const tabs: Array<{ key: TabConversacion; label: string; icon: string; soloLider?: boolean }> = [
    { key: "guia", label: "Guía Líder", icon: "📋", soloLider: true },
    { key: "mensaje", label: "Mensaje 1:1", icon: "💬" },
    { key: "preguntas", label: "Preguntas Difíciles", icon: "⚠️", soloLider: true },
  ];

  const tabsVisibles = tabs.filter((t) => !(t.soloLider && vista === "colaborador"));

  // Contenido según tab
  const renderContenido = () => {
    switch (tabActivo) {
      case "guia":
        if (vista === "colaborador") return null;
        return (
          <div className="space-y-4">
            <div className="fhr-label flex items-center gap-2 fhr-text-purple">
              <span>◈</span> Guía para el Líder — No mostrar al colaborador/a
            </div>
            <div className="fhr-body whitespace-pre-wrap text-sm leading-relaxed">
              {narrativa.guiaLider}
            </div>
          </div>
        );

      case "mensaje":
        return (
          <div className="space-y-4">
            <div className="fhr-label flex items-center gap-2 fhr-text-accent">
              <span>◇</span> Mensaje para {persona.nombre.split(" ")[0]}
            </div>
            <div className="fhr-body whitespace-pre-wrap text-sm leading-relaxed">
              {narrativa.mensajeColaborador}
            </div>
          </div>
        );

      case "preguntas":
        if (vista === "colaborador") return null;
        return (
          <div className="space-y-3">
            <div className="fhr-label flex items-center gap-2 fhr-text-warning">
              <span>⚠</span> Preguntas difíciles anticipadas
            </div>
            {narrativa.preguntas.map((p, idx) => (
              <div key={idx} className="fhr-accordion overflow-hidden">
                <button
                  onClick={() => setPreguntaAbierta(preguntaAbierta === idx ? null : idx)}
                  className="fhr-accordion-header flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <ChevronRight 
                    className={`fhr-accordion-icon h-4 w-4 transition-transform ${
                      preguntaAbierta === idx ? "rotate-90" : ""
                    }`}
                  />
                  <span className="fhr-subtitle text-sm">{p.q}</span>
                </button>
                <AnimatePresence>
                  {preguntaAbierta === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="fhr-accordion-content px-4 py-3 pl-10">
                        <div className="fhr-body text-sm leading-relaxed">{p.a}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const textoActual = tabActivo === "guia" ? narrativa.guiaLider : narrativa.mensajeColaborador;

  return (
    <div className="fhr-card relative">
      {/* Línea Tesla */}
      <div className="fhr-tesla-line" />

      {/* Tabs */}
      <div className="fhr-tabs-container flex border-b">
        {tabsVisibles.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTabActivo(tab.key)}
            className={`fhr-tab-button flex items-center gap-2 px-5 py-4 text-sm font-medium ${
              tabActivo === tab.key ? "fhr-tab-button-active" : ""
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.soloLider && (
              <span className="fhr-badge-active text-[9px] font-bold">
                LÍDER
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="relative p-6">
        {renderContenido()}

        {/* Botón copiar con Premium Button */}
        {(tabActivo === "guia" || tabActivo === "mensaje") && (
          <div className="absolute right-6 top-6">
            <GhostButton
              size="sm"
              icon={copiado ? Check : Copy}
              onClick={() => copiarTexto(textoActual)}
              glow={copiado}
            >
              {copiado ? "Copiado" : "Copiar"}
            </GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}

// Nota de alerta
function NotaAlerta({ nota }: { nota: string }) {
  return (
    <div className="fhr-alert-warning flex items-center gap-3 px-4 py-3">
      <span className="text-lg">⚡</span>
      <span className="fhr-text-warning text-sm">{nota}</span>
    </div>
  );
}

// Estado vacío
function EstadoVacio() {
  return (
    <div className="fhr-empty-state flex flex-col items-center justify-center py-20 text-center">
      <div className="fhr-empty-icon mb-4 text-5xl opacity-30">◎</div>
      <div className="fhr-text-muted text-lg">Selecciona una persona para ver su ficha de conversación</div>
    </div>
  );
}

// Ficha completa de una persona
function FichaPersona({ persona, vista }: { persona: Persona; vista: Vista }) {
  const narrativa = getNarrativa(persona.id);
  const bandaColor = BANDA_COLORS[persona.banda];

  if (!narrativa) {
    return <div className="fhr-text-muted text-center">No se encontró narrativa para esta persona.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header de persona */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="fhr-avatar flex h-14 w-14 items-center justify-center rounded-2xl border text-xl"
            style={{
              backgroundColor: `${bandaColor}15`,
              borderColor: `${bandaColor}40`,
              color: bandaColor,
            }}
          >
            {persona.banda}
          </div>
          <div>
            <h1 className="fhr-title-gradient text-2xl">{persona.nombre}</h1>
            <div className="fhr-text-muted text-sm">
              {persona.cargo} · {persona.pais} · Nivel {persona.nivel} · {persona.antiguedad} años
            </div>
          </div>
        </div>
      </div>

      {/* Nota si existe */}
      {persona.nota && <NotaAlerta nota={persona.nota} />}

      {/* Journey salarial */}
      <JourneySalarial persona={persona} vista={vista} />

      {/* Simulador de conversación */}
      <SimuladorConversacion persona={persona} narrativa={narrativa} vista={vista} />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function DDPrevPage() {
  const [vista, setVista] = useState<Vista>("lider");
  const [bandaFiltro, setBandaFiltro] = useState<Banda | "all">("all");
  const [personaActiva, setPersonaActiva] = useState<string | null>(null);

  const personaSeleccionada = useMemo(() => {
    if (!personaActiva) return null;
    return PERSONAS.find((p) => p.id === personaActiva) || null;
  }, [personaActiva]);

  return (
    <div className="fhr-bg-main min-h-screen">
      {/* Patrón de fondo sutil */}
      <div className="fhr-bg-pattern" />

      <div className="relative">
        {/* Header con toggle de vista */}
        <Header vista={vista} setVista={setVista} />

        {/* Rail de personas */}
        <PersonasRail
          bandaFiltro={bandaFiltro}
          setBandaFiltro={setBandaFiltro}
          personaActiva={personaActiva}
          setPersonaActiva={setPersonaActiva}
        />

        {/* Contenido principal */}
        <main className="mx-auto max-w-7xl px-6 py-8">
          <AnimatePresence mode="wait">
            {personaSeleccionada ? (
              <FichaPersona key={personaSeleccionada.id} persona={personaSeleccionada} vista={vista} />
            ) : (
              <EstadoVacio />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}