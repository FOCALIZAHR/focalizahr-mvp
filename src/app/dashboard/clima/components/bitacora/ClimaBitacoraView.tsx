'use client';

// src/app/dashboard/clima/components/bitacora/ClimaBitacoraView.tsx
// ════════════════════════════════════════════════════════════════════════════
// BITÁCORA DE ACCIONES DE CLIMA — la superficie del JEFE.
//
// Al aprobar un plan de clima, cada foco queda asignado al responsable del
// departamento y se le agenda un correo a los 30 días. Acá es donde esa persona
// registra qué hizo. Sin este registro, ActionEffectivenessService no tiene con
// qué emitir veredicto en la siguiente medición.
//
// NO es Tab 2. Tab 2 ("Atacar la causa") es la vista de consulta de RRHH y es
// read-only. Esta pantalla no comparte código, tipos ni carpeta con ella
// (decisión Victor 2026-08-03): carpeta propia, DTO propio en clima-bitacora.ts.
//
// Patrón: Landing Card (contexto antes del formulario). NO Cinema Mode — no hay
// identidad de persona que confirmar, el usuario ES la persona; el split 35/65
// con avatar sería el anti-patrón que la skill marca en su Gate 3.
//
// SIN color protagonista propio (D8). Chrome canónico idéntico a las otras 7
// superficies de clima: la skill asigna el violeta a métricas/inteligencia
// (MANIFIESTO:158) y a crisis (cascada-ejecutiva:201), y ya es el SecondaryButton.
// Esta pantalla se distingue por ESTRUCTURA: barra de píldoras con contador fijo,
// split 60/40, campo de escritura (único en todo Clima).
//
// ÚNICA fuente de datos: GET /api/clima/action-log?scope=mine. El servidor decide
// qué focos le tocan; el cliente no filtra ni elige nada.
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, Info, Loader2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PrimaryButton, GhostButton, SecondaryButton } from '@/components/ui/PremiumButton';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import { useToast } from '@/components/ui/toast-system';
import { dimensionLabel } from '@/lib/constants/climaDimensions';
import {
  BITACORA_SCREEN,
  BITACORA_PLAN,
  BITACORA_FORM,
  BITACORA_HISTORY,
  BITACORA_TOAST,
  BITACORA_TEXT_MAX,
  BITACORA_RECENT_HOURS,
  bitacoraCounter,
  bitacoraPill,
  bitacoraSeeAll,
  bitacoraDisclosure,
  bitacoraRecentNotice,
} from '@/lib/constants/climaBitacoraContent';
import type { ClimaBitacoraEntryDTO, ClimaBitacoraItemDTO } from '@/types/clima-bitacora';

interface Props {
  campaignId: string | null;
  onBack: () => void;
}

const HOUR_MS = 60 * 60 * 1000;

function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(d);
}

function haceCuanto(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return formatDistanceToNow(d, { locale: es });
}

export default function ClimaBitacoraView({ campaignId, onBack }: Props) {
  const { success, error: toastError } = useToast();

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [items, setItems] = useState<ClimaBitacoraItemDTO[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  /** Borrador POR foco: cambiar de píldora no puede perder lo que ya escribió. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  /** Solo mobile: la bitácora arranca colapsada (el foco es escribir). */
  const [historyOpen, setHistoryOpen] = useState(false);

  const load = useCallback(async () => {
    if (!campaignId) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch(`/api/clima/action-log?scope=mine&campaignId=${campaignId}`);
      const json = await res.json().catch(() => ({}) as Record<string, unknown>);
      if (!res.ok || !json.success) {
        setStatus('error');
        return;
      }
      const data = json.data as { items: ClimaBitacoraItemDTO[] };
      setItems(data.items ?? []);
      setActiveIdx(0);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  const active = items[activeIdx] ?? null;
  const draft = active ? (drafts[active.logId] ?? '') : '';
  const trimmed = draft.trim();
  const puedeRegistrar = !!active && trimmed.length > 0 && trimmed.length <= BITACORA_TEXT_MAX && !submitting;

  /** Aviso preventivo: alguien registró recién y no fui yo. Solo el hecho, sin instrucción. */
  const avisoReciente = useMemo(() => {
    const ultima = active?.entries?.[0];
    if (!ultima?.author) return null;
    const t = new Date(ultima.createdAt).getTime();
    if (isNaN(t) || Date.now() - t > BITACORA_RECENT_HOURS * HOUR_MS) return null;
    return bitacoraRecentNotice(ultima.author.name, haceCuanto(ultima.createdAt));
  }, [active]);

  /** Relee las entradas de UN foco desde el servidor (traen autor resuelto). */
  const refrescarEntradas = useCallback(async (logId: string) => {
    const res = await fetch(`/api/clima/action-log?scope=mine&logId=${logId}&offset=0&limit=3`);
    const json = await res.json().catch(() => ({}) as Record<string, unknown>);
    if (!res.ok || !json.success) return;
    const data = json.data as { entries: ClimaBitacoraEntryDTO[]; entriesCount: number };
    setItems((prev) =>
      prev.map((it) =>
        it.logId === logId
          ? { ...it, entries: data.entries ?? [], entriesCount: data.entriesCount ?? it.entriesCount }
          : it
      )
    );
  }, []);

  const onRegistrar = useCallback(async () => {
    if (!active || !puedeRegistrar) return;
    setSubmitting(true);
    try {
      // Espera REAL del servidor. Sin actualización optimista: una bitácora que muestra
      // algo que no se persistió es peor que una que tarda medio segundo.
      const res = await fetch('/api/clima/action-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ climaActionLogId: active.logId, text: trimmed }),
      });
      const json = await res.json().catch(() => ({}) as Record<string, unknown>);
      if (!res.ok || !json.success) {
        // El texto NO se pierde: el draft queda intacto y el botón vuelve a habilitarse.
        toastError(typeof json.error === 'string' ? json.error : BITACORA_TOAST.error);
        return;
      }
      await refrescarEntradas(active.logId);
      setDrafts((p) => ({ ...p, [active.logId]: '' }));
      setHistoryOpen(true); // en mobile, que vea dónde quedó lo que escribió
      success(BITACORA_TOAST.success);
    } catch {
      toastError(BITACORA_TOAST.error);
    } finally {
      setSubmitting(false);
    }
  }, [active, puedeRegistrar, trimmed, refrescarEntradas, success, toastError]);

  const onVerAnteriores = useCallback(async () => {
    if (!active) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/clima/action-log?scope=mine&logId=${active.logId}&offset=${active.entries.length}`
      );
      const json = await res.json().catch(() => ({}) as Record<string, unknown>);
      if (res.ok && json.success) {
        const data = json.data as { entries: ClimaBitacoraEntryDTO[]; entriesCount: number };
        setItems((prev) =>
          prev.map((it) =>
            it.logId === active.logId
              ? {
                  ...it,
                  entries: [...it.entries, ...(data.entries ?? [])],
                  entriesCount: data.entriesCount ?? it.entriesCount,
                }
              : it
          )
        );
      }
    } catch {
      /* silencioso: el historial ya visible sigue ahí */
    } finally {
      setLoadingMore(false);
    }
  }, [active]);

  // ── Chrome canónico (mismo que las otras superficies de clima) ────────────
  const shell = (children: ReactNode) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm">
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
            opacity: 0.7,
          }}
        />
        <div className="px-4 py-8 md:px-10 md:py-12">{children}</div>
      </div>
    </motion.div>
  );

  const header = (
    <header className="mb-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] font-light mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Volver
      </button>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
        {BITACORA_SCREEN.kicker}
      </p>
      <h2 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight">
        {BITACORA_SCREEN.titleWhite}{' '}
        <span className="fhr-title-gradient">{BITACORA_SCREEN.titleGradient}</span>
      </h2>
      <p className="text-sm md:text-base font-light text-slate-400 leading-relaxed mt-3 max-w-xl">
        {BITACORA_SCREEN.intro}
      </p>
    </header>
  );

  if (status === 'loading') {
    return shell(
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-cyan-400 animate-spin" />
        <p className="text-sm font-light text-slate-400">{BITACORA_SCREEN.loading}</p>
      </div>
    );
  }

  if (status === 'error') {
    return shell(
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <AlertTriangle className="w-8 h-8 text-slate-500" strokeWidth={1.5} />
        <div>
          <h3 className="text-slate-200 font-light text-base">{BITACORA_SCREEN.error.title}</h3>
          <p className="text-sm font-light text-slate-500 mt-1">
            {BITACORA_SCREEN.error.description}
          </p>
        </div>
        <PrimaryButton size="sm" onClick={load}>
          {BITACORA_SCREEN.error.retry}
        </PrimaryButton>
      </div>
    );
  }

  if (items.length === 0 || !active) {
    return shell(
      <>
        {header}
        {/* Estado vacío honesto. Hoy es el camino REAL de todos los usuarios: sin el
            vínculo con la nómina el servidor no tiene a quién reconocer y devuelve
            lista vacía. Ver el bloque de resolveViewerEmployeeId en el endpoint. */}
        <FHREmptyState
          type="pending"
          title={BITACORA_SCREEN.empty.title}
          description={BITACORA_SCREEN.empty.description}
          insight={BITACORA_SCREEN.empty.insight}
        />
      </>
    );
  }

  // ── Bitácora del foco activo (columna derecha en desktop) ─────────────────
  const historial = (
    <div>
      <p className="text-[10px] font-light uppercase tracking-wider text-slate-600 mb-3">
        {BITACORA_HISTORY.label}
      </p>
      {active.entries.length === 0 ? (
        <p className="text-[13px] font-light text-slate-500 leading-relaxed">
          {BITACORA_HISTORY.empty}
        </p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {active.entries.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="pl-3 border-l border-slate-700/40"
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[10px] font-light text-slate-600 tabular-nums">
                    {formatFecha(e.createdAt)}
                  </span>
                  {e.author && (
                    <span className="text-[11px] font-light text-slate-300">{e.author.name}</span>
                  )}
                </div>
                {/* Nombre y cargo, sin etiqueta de jerarquía (decisión Victor): el cargo
                    ya dice de dónde viene la entrada y un tag se lee como vigilancia. */}
                {e.author?.position && (
                  <p className="text-[10px] font-light text-slate-600 leading-tight">
                    {e.author.position}
                  </p>
                )}
                <p className="text-[13px] font-light text-slate-300 leading-relaxed mt-1.5">
                  {e.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {active.entries.length < active.entriesCount && (
            <GhostButton size="sm" onClick={onVerAnteriores} disabled={loadingMore}>
              {loadingMore ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> {BITACORA_HISTORY.loadingMore}
                </span>
              ) : (
                bitacoraSeeAll(active.entriesCount)
              )}
            </GhostButton>
          )}
        </div>
      )}
    </div>
  );

  return shell(
    <>
      {header}

      {/* ── Barra de píldoras: contador FIJO + píldoras con scroll-snap ──
          El contador no scrollea: en 320px el jefe tiene que saber cuántos focos
          tiene sin recorrer la barra. Sin "+N": ve todos, no se le esconde ninguno. */}
      <div className="flex items-center gap-3 mb-6">
        <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-slate-500 tabular-nums">
          {bitacoraCounter(activeIdx, items.length)}
        </span>
        <div
          className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth -mx-1 px-1"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((it, i) => (
            <button
              key={it.logId}
              onClick={() => {
                setActiveIdx(i);
                setHistoryOpen(false);
              }}
              style={{ scrollSnapAlign: 'start' }}
              className={cn(
                'shrink-0 min-h-[44px] px-3.5 py-2 rounded-full border text-[11px] font-light whitespace-nowrap transition-colors',
                i === activeIdx
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600/60'
              )}
            >
              {bitacoraPill(dimensionLabel(it.category), it.entriesCount)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cuerpo: 60/40 en desktop, una columna en 320px ── */}
      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Izquierda: el foco + el campo */}
        <div className="md:w-3/5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
            {active.departmentName}
          </p>
          <p className="text-[15px] md:text-base text-slate-200 font-light leading-[1.7]">
            {active.narrative}
          </p>

          {active.steps.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-light uppercase tracking-wider text-slate-600 mb-2">
                {BITACORA_PLAN.stepsLabel}
              </p>
              <ul className="space-y-1.5 pl-4">
                {active.steps.map((s, i) => (
                  <li key={i} className="text-[12px] text-slate-500 font-light leading-relaxed list-disc">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {active.ceoNotes && (
            <p className="text-[12px] font-light text-slate-400 mt-4 pl-3 border-l border-slate-700/40">
              <span className="text-slate-500">{BITACORA_PLAN.notesLabel}: </span>
              {active.ceoNotes}
            </p>
          )}

          {avisoReciente && (
            <div className="flex items-start gap-2 mt-5 rounded-lg border border-slate-700/30 bg-slate-800/20 px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[12px] font-light text-slate-400 leading-relaxed">{avisoReciente}</p>
            </div>
          )}

          {/* Campo */}
          <div className="mt-6">
            <textarea
              value={draft}
              onChange={(e) => setDrafts((p) => ({ ...p, [active.logId]: e.target.value.slice(0, BITACORA_TEXT_MAX) }))}
              disabled={submitting}
              rows={3}
              maxLength={BITACORA_TEXT_MAX}
              placeholder={BITACORA_FORM.placeholder}
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-3.5 py-3 text-[14px] font-light text-slate-200 placeholder:text-slate-600 leading-relaxed resize-none focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
            />
            <div className="flex items-center justify-between gap-3 mt-2">
              <span className="text-[10px] font-mono text-slate-600 tabular-nums">
                {draft.length}/{BITACORA_TEXT_MAX}
              </span>
              <PrimaryButton size="sm" onClick={onRegistrar} disabled={!puedeRegistrar}>
                {submitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> {BITACORA_FORM.submitting}
                  </span>
                ) : (
                  <>
                    <span className="md:hidden">{BITACORA_FORM.submitShort}</span>
                    <span className="hidden md:inline">{BITACORA_FORM.submit}</span>
                  </>
                )}
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Derecha (desktop): la bitácora siempre visible */}
        <div className="hidden md:block md:w-2/5 md:border-l md:border-slate-800/40 md:pl-8">
          {historial}
        </div>

        {/* Mobile: colapsada tras un disclosure con su contador */}
        <div className="md:hidden mt-8 border-t border-slate-800/40 pt-4">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="w-full min-h-[44px] flex items-center justify-between text-left"
          >
            <span className="text-[11px] font-light uppercase tracking-wider text-slate-500">
              {BITACORA_HISTORY.label} · {bitacoraDisclosure(active.entriesCount)}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-600 transition-transform',
                historyOpen ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>
          {historyOpen && <div className="mt-4">{historial}</div>}
        </div>
      </div>
    </>
  );
}
