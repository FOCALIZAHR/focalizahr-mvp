"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";

// ─── Design System FocalizaHR ────────────────────────────────────────────────
import "@/styles/focalizahr-design-system.css";
import "./dd-prev.css";
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
function Header({ vista, setVista, userEmail }: { vista: Vista; setVista: (v: Vista) => void; userEmail?: string }) {
  return (
    <header className="fhr-header sticky top-0 z-50">
      {/* Línea Tesla */}
      <div className="fhr-tesla-line" />
      
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo oficial FocalizaHR */}
        <div className="flex items-center gap-4">
          <img 
            src="/images/focalizahr-logo_palabra.svg" 
            alt="FocalizaHR" 
            className="h-8 w-auto"
          />
          <div className="h-6 w-px bg-slate-700" />
          <div>
            <div className="fhr-subtitle text-sm">Derechos Digitales</div>
            <div className="fhr-text-muted text-xs">Compensaciones 2026 · Fichas 1:1</div>
          </div>
        </div>

        {/* Usuario + Toggle Vista */}
        <div className="flex items-center gap-6">
          {/* Usuario conectado */}
          {userEmail && (
            <div className="flex items-center gap-2 text-xs">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-white font-semibold text-[10px]">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="fhr-text-muted">{userEmail}</span>
            </div>
          )}
          
          <div className="h-6 w-px bg-slate-700" />
          
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

// Journey salarial — DISEÑO SIMPLIFICADO: 3 puntos, 1 flecha
function JourneySalarial({ persona, vista }: { persona: Persona; vista: Vista }) {
  const salarioNuevo = calcularSalarioNuevo(persona);
  const targetUSD = calcularTargetUSD(persona);
  const cr = calcularCR(persona);
  const crNuevo = salarioNuevo / targetUSD;
  const pctTotal = persona.pctBase + persona.pctMerito;
  const accion = ACCION_CONFIG[persona.accion];
  const deltaUSD = salarioNuevo - persona.salario;

  // Posiciones en la línea (0-100%) — con padding visual
  const posHoy = pctPosition(persona.salario, persona.minBanda, persona.maxBanda);
  const posNuevo = pctPosition(salarioNuevo, persona.minBanda, persona.maxBanda);
  const posTarget = pctPosition(targetUSD, persona.minBanda, persona.maxBanda);

  // Porcentajes de avance
  const pctHoy = (cr * 100);
  const pctNuevo = (crNuevo * 100);

  // ¿Ya alcanzó o superó el objetivo?
  const alcanzoObjetivo = salarioNuevo >= targetUSD;
  const faltaUSD = Math.max(0, targetUSD - salarioNuevo);

  return (
    <div className="fhr-card relative p-6">
      {/* Línea Tesla */}
      <div className="fhr-tesla-line" />
      
      {/* Header — TU OBJETIVO como protagonista */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="fhr-label mb-2">Tu objetivo personal</div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-amber-400">
              {formatUSD(targetUSD)}
            </span>
            <span className="text-sm text-slate-500">
              Según tu perfil y trayectoria · Banda {persona.banda}
            </span>
          </div>
        </div>
        {/* Status badge — usa ACCION_CONFIG que ya tiene mensajes por situación */}
        <div
          className="fhr-badge-status flex items-center gap-2 max-w-xs"
          style={{
            borderColor: `${accion.color}40`,
            backgroundColor: `${accion.color}10`,
          }}
        >
          <span className="text-lg">{accion.icon}</span>
          <div>
            <div className="text-xs font-semibold leading-tight" style={{ color: accion.color }}>
              {accion.label}
            </div>
            <div className="text-[10px] opacity-70 leading-tight mt-0.5" style={{ color: accion.color }}>
              {accion.sub}
            </div>
          </div>
        </div>
      </div>

      {/* BARRA SIMPLIFICADA — 3 puntos + etiquetas claras */}
      <div className="relative mb-4 mt-2">
        
        {/* Etiquetas de rango (min / max) */}
        <div className="flex justify-between text-[11px] text-slate-600 mb-2">
          <span>{formatUSD(persona.minBanda)}</span>
          <span>{formatUSD(persona.maxBanda)} (techo)</span>
        </div>

        {/* Barra */}
        <div className="relative h-3">
          {/* Línea base completa */}
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-800" />

          {/* Progreso hasta NUEVO (o hasta HOY si vista colaborador) */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${vista === "lider" ? posNuevo : posHoy}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
            style={{ background: "linear-gradient(90deg, #22d3ee, #a78bfa)" }}
          />

          {/* PUNTO 1: HOY (gris sólido) */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${posHoy}%` }}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-500 border-2 border-slate-400">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
          </motion.div>

          {/* PUNTO 2: NUEVO (cyan sólido) — solo vista líder */}
          {vista === "lider" && pctTotal > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${posNuevo}%` }}
            >
              <div 
                className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400 border-2 border-cyan-300"
                style={{ boxShadow: "0 0 12px rgba(34, 211, 238, 0.5)" }}
              >
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            </motion.div>
          )}

          {/* PUNTO 3: META (amber outline, vacío si no alcanzado) */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${posTarget}%` }}
          >
            <div 
              className={`flex h-6 w-6 items-center justify-center rounded-full border-3 ${
                alcanzoObjetivo 
                  ? "bg-amber-400 border-amber-300" 
                  : "bg-transparent border-amber-400"
              }`}
              style={{ 
                borderWidth: "3px",
                boxShadow: alcanzoObjetivo ? "0 0 12px rgba(245, 158, 11, 0.5)" : undefined 
              }}
            >
              {alcanzoObjetivo && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </motion.div>
        </div>

        {/* Etiquetas debajo de cada punto — con más separación */}
        <div className="relative h-16 mt-4">
          {/* HOY */}
          <div 
            className="absolute top-0 -translate-x-1/2 text-center"
            style={{ left: `${posHoy}%` }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hoy</div>
            <div className="text-sm font-bold text-slate-200">{formatUSD(persona.salario)}</div>
            <div className="text-[10px] text-slate-500">{pctHoy.toFixed(0)}%</div>
          </div>

          {/* NUEVO — solo vista líder */}
          {vista === "lider" && pctTotal > 0 && (
            <div 
              className="absolute top-0 -translate-x-1/2 text-center"
              style={{ left: `${posNuevo}%` }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Nuevo</div>
              <div className="text-sm font-bold text-cyan-300">{formatUSD(salarioNuevo)}</div>
              <div className="text-[10px] text-cyan-500">{pctNuevo.toFixed(0)}%</div>
            </div>
          )}

          {/* META */}
          <div 
            className="absolute top-0 -translate-x-1/2 text-center"
            style={{ left: `${posTarget}%` }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Meta</div>
            <div className="text-sm font-bold text-amber-300">{formatUSD(targetUSD)}</div>
            <div className="text-[10px] text-amber-500">100%</div>
          </div>
        </div>
      </div>

      {/* FLECHA DE PROGRESO — el delta de este año */}
      {vista === "lider" && pctTotal > 0 && (
        <div className="flex items-center justify-center gap-4 py-4 my-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Ajuste</div>
            <div className="text-lg font-bold text-cyan-400">+{pctTotal.toFixed(1)}%</div>
          </div>
          <div className="text-2xl text-slate-600">→</div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Aumento</div>
            <div className="text-lg font-bold text-emerald-400">+{formatUSD(deltaUSD)}/mes</div>
          </div>
          <div className="text-2xl text-slate-600">→</div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Anual</div>
            <div className="text-lg font-bold text-emerald-400">+{formatUSD(deltaUSD * 12)}</div>
          </div>
        </div>
      )}

      {/* INSIGHT — La conclusión clara */}
      <div className="fhr-card-inner px-5 py-4 mt-4">
        <div className="flex items-center gap-3">
          <div className="fhr-icon-box">
            <span className="text-lg">{alcanzoObjetivo ? "🎯" : "💡"}</span>
          </div>
          <div>
            {vista === "lider" ? (
              alcanzoObjetivo ? (
                <div className="fhr-subtitle text-sm">
                  <span className="fhr-text-success">¡Con el ajuste de este año alcanzarás tu objetivo!</span>
                </div>
              ) : (
                <>
                  <div className="fhr-subtitle text-sm">
                    Después del ajuste estarás al <span className="fhr-text-accent">{pctNuevo.toFixed(0)}%</span> de tu objetivo
                  </div>
                  <div className="fhr-text-muted text-xs">
                    Faltarán <span className="fhr-text-warning">{formatUSD(faltaUSD)}</span> para llegar a <span className="fhr-text-accent">{formatUSD(targetUSD)}</span>
                  </div>
                </>
              )
            ) : (
              <>
                <div className="fhr-subtitle text-sm">
                  Hoy estás al <span className="fhr-text-accent">{pctHoy.toFixed(0)}%</span> de tu objetivo
                </div>
                <div className="fhr-text-muted text-xs">
                  Tu objetivo personal es <span className="fhr-text-accent">{formatUSD(targetUSD)}</span>
                </div>
              </>
            )}
          </div>
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

  const tabs: Array<{ key: TabConversacion; label: string; icon: string; soloLider?: boolean }> = [
    { key: "guia", label: "Guía Líder", icon: "📋", soloLider: true },
    { key: "mensaje", label: "Mensaje 1:1", icon: "💬" },
    { key: "preguntas", label: "Preguntas Difíciles", icon: "⚠️", soloLider: true },
  ];

  const tabsVisibles = tabs.filter(t => !(t.soloLider && vista === "colaborador"));

  return (
    <div className="fhr-card relative p-6">
      {/* Línea Tesla */}
      <div className="fhr-tesla-line" />

      {/* Header */}
      <div className="mb-5">
        <div className="fhr-label mb-1">Simulador de Conversación</div>
        <div className="fhr-text-muted text-sm">
          Material preparado para la conversación individual
        </div>
      </div>

      {/* Tabs */}
      <div className="fhr-tabs-container mb-5 flex gap-1 border-b border-slate-700/50 pb-px">
        {tabsVisibles.map((t) => (
          <button
            key={t.key}
            onClick={() => setTabActivo(t.key)}
            className={`fhr-tab-button flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              tabActivo === t.key ? "fhr-tab-button-active" : ""
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.soloLider && (
              <span className="fhr-badge-draft ml-1 text-[9px]">LÍDER</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido de tabs */}
      <AnimatePresence mode="wait">
        {tabActivo === "guia" && vista === "lider" && (
          <motion.div
            key="guia"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="fhr-card-inner p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="fhr-label">Guía para el Líder</div>
              <GhostButton
                size="sm"
                icon={copiado ? Check : Copy}
                onClick={() => copiarTexto(narrativa.guiaLider)}
              >
                {copiado ? "Copiado" : "Copiar"}
              </GhostButton>
            </div>
            <div className="fhr-body whitespace-pre-wrap text-sm leading-relaxed">
              {narrativa.guiaLider}
            </div>
          </motion.div>
        )}

        {tabActivo === "mensaje" && (
          <motion.div
            key="mensaje"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="fhr-card-inner p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="fhr-label">
                Mensaje para {persona.nombre.split(" ")[0]}
              </div>
              <GhostButton
                size="sm"
                icon={copiado ? Check : Copy}
                onClick={() => copiarTexto(narrativa.mensajeColaborador)}
              >
                {copiado ? "Copiado" : "Copiar"}
              </GhostButton>
            </div>
            <div className="fhr-body whitespace-pre-wrap text-sm leading-relaxed">
              {narrativa.mensajeColaborador}
            </div>
          </motion.div>
        )}

        {tabActivo === "preguntas" && vista === "lider" && (
          <motion.div
            key="preguntas"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3"
          >
            {narrativa.preguntas.map((p, idx) => (
              <div key={idx} className="fhr-accordion">
                <button
                  onClick={() => setPreguntaAbierta(preguntaAbierta === idx ? null : idx)}
                  className="fhr-accordion-header flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="fhr-accordion-icon text-lg">⚠️</span>
                    <span className="fhr-subtitle text-sm">{p.q}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: preguntaAbierta === idx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </motion.div>
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
                      <div className="fhr-accordion-content p-4">
                        <div className="fhr-body text-sm leading-relaxed">
                          {p.a}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Nota de alerta
function NotaAlerta({ nota }: { nota: string }) {
  return (
    <div className="fhr-alert-warning flex items-start gap-3 p-4">
      <span className="text-lg">⚠️</span>
      <div>
        <div className="fhr-label mb-1 text-amber-400">Nota especial</div>
        <div className="fhr-body text-sm">{nota}</div>
      </div>
    </div>
  );
}

// Estado vacío
function EstadoVacio() {
  return (
    <div className="fhr-empty-state flex flex-col items-center justify-center py-24 text-center">
      <img 
        src="/images/focalizahr-logo_palabra.svg" 
        alt="FocalizaHR" 
        className="h-10 w-auto mb-6 opacity-40"
      />
      <div className="fhr-subtitle text-lg mb-2">Fichas de Conversación 1:1</div>
      <div className="fhr-text-muted text-sm max-w-md">
        Selecciona una persona del panel superior para ver su ficha de compensaciones, 
        journey salarial y guía de conversación personalizada.
      </div>
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
            className="fhr-avatar flex h-14 w-14 items-center justify-center rounded-xl text-xl text-white"
            style={{ backgroundColor: bandaColor }}
          >
            {persona.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h2 className="fhr-title-gradient text-2xl">{persona.nombre}</h2>
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
// COMPONENTE PRINCIPAL (EXPORTADO)
// ─────────────────────────────────────────────────────────────────────────────
export default function DDPrevClient({ userEmail }: { userEmail?: string }) {
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
        <Header vista={vista} setVista={setVista} userEmail={userEmail} />

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
