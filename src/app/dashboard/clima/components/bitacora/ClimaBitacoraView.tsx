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
// read-only. Esta pantalla no comparte código, tipos ni carpeta con ella.
//
// ── LAYOUT: UNA COLUMNA (rediseño 2026-08-04) ──────────────────────────────
// Antes era un split 60/40 que ponía el campo de escritura a competir con un
// historial casi siempre vacío. Escribir es a lo que la persona vino, así que
// ahora es un flujo vertical y el campo es el centro:
//
//   salida → título → quién sos → píldoras → el foco → EL CAMPO → bitácora
//
// La bitácora va al final y COLAPSADA en todos los breakpoints: es respaldo, no
// protagonista.
//
// SIN color protagonista propio. Chrome canónico idéntico a las otras superficies
// de clima; esta pantalla se distingue por estructura, no por color.
//
// ÚNICA fuente de datos: GET /api/clima/action-log?scope=mine. El servidor decide
// qué focos le tocan y con qué identidad; el cliente no filtra ni elige nada.
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, Info, Loader2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton';
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
  bitacoraPillCount,
  bitacoraSeeAll,
  bitacoraDisclosure,
  bitacoraRecentNotice,
} from '@/lib/constants/climaBitacoraContent';
import type {
  ClimaBitacoraEntryDTO,
  ClimaBitacoraItemDTO,
  ClimaBitacoraViewerDTO,
} from '@/types/clima-bitacora';

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
  const [viewer, setViewer] = useState<ClimaBitacoraViewerDTO | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  /** Borrador POR foco: cambiar de píldora no puede perder lo que ya escribió. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  /** La bitácora arranca colapsada en TODOS los breakpoints: el foco es escribir. */
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
      const data = json.data as { items: ClimaBitacoraItemDTO[]; viewer: ClimaBitacoraViewerDTO | null };
      setItems(data.items ?? []);
      setViewer(data.viewer ?? null);
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
  const puedeRegistrar =
    !!active && active.canWrite && trimmed.length > 0 && trimmed.length <= BITACORA_TEXT_MAX && !submitting;

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
      setHistoryOpen(true); // que vea dónde quedó lo que escribió
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

  // ── Chrome canónico. Columna única y angosta: es una pantalla de lectura corta
  //    más un campo, no un dashboard. ───────────────────────────────────────
  const shell = (children: ReactNode) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-2xl mx-auto"
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

  // Salida al lobby. El control ya existía pero en slate-600 sobre slate-900/60 era
  // ilegible y se leía como "no hay forma de volver". Divergencia deliberada del
  // token del módulo (ClimaPlanesView usa slate-600): acá la salida tiene que verse.
  const salida = (
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 min-h-[44px] text-slate-400 hover:text-white transition-colors text-xs font-light"
    >
      <ArrowLeft className="w-4 h-4" /> {BITACORA_SCREEN.back}
    </button>
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
      <>
        {salida}
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
      </>
    );
  }

  const header = (
    <header className="mb-7">
      {salida}
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-6 mb-2">
        {BITACORA_SCREEN.kicker}
      </p>
      <h2 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight">
        {BITACORA_SCREEN.titleWhite}{' '}
        <span className="fhr-title-gradient">{BITACORA_SCREEN.titleGradient}</span>
      </h2>
      <p className="text-sm md:text-base font-light text-slate-400 leading-relaxed mt-3">
        {BITACORA_SCREEN.intro}
      </p>
    </header>
  );

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

  return shell(
    <>
      {header}

      {/* ── Quién está mirando. Identidad resuelta EN EL SERVIDOR: es la que va a
          quedar firmando lo que escriba. Nombre y cargo, sin etiqueta. ── */}
      {viewer && (
        <div className="pb-5 mb-6 border-b border-slate-800/40">
          <p className="text-sm font-light text-slate-200 leading-tight">{viewer.name}</p>
          {viewer.position && (
            <p className="text-[11px] font-light text-slate-500 leading-tight mt-0.5">
              {viewer.position}
            </p>
          )}
        </div>
      )}

      {/* ── Píldoras de DOS LÍNEAS: departamento arriba, dimensión abajo. El contador
          "1 de N" queda FIJO fuera del scroll para que en 320px se sepa cuántos focos
          hay sin recorrer la barra. Sin "+N": se ven todos. ── */}
      <div className="flex items-start gap-3 mb-7">
        <span className="shrink-0 mt-4 text-[10px] font-mono uppercase tracking-wider text-slate-500 tabular-nums">
          {bitacoraCounter(activeIdx, items.length)}
        </span>
        <div
          className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth -mx-1 px-1 py-1"
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
                'shrink-0 w-[132px] min-h-[56px] px-3 py-2 rounded-xl border text-left transition-colors',
                i === activeIdx
                  ? 'border-cyan-500/40 bg-cyan-500/10'
                  : 'border-slate-700/40 hover:border-slate-600/60'
              )}
            >
              <span
                className={cn(
                  'block text-[9px] uppercase tracking-wider font-light truncate',
                  i === activeIdx ? 'text-cyan-400/70' : 'text-slate-500'
                )}
              >
                {it.departmentName}
              </span>
              <span className="flex items-baseline gap-1">
                <span
                  className={cn(
                    'text-[12px] font-light truncate',
                    i === activeIdx ? 'text-cyan-300' : 'text-slate-300'
                  )}
                >
                  {dimensionLabel(it.category)}
                </span>
                <span className="text-[10px] font-light text-slate-500 tabular-nums shrink-0">
                  {bitacoraPillCount(it.entriesCount)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── El foco. El departamento ya viaja en la píldora, así que no se repite. ── */}
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

      {/* ── EL CENTRO DE LA PANTALLA ──
          Gate por canWrite: el servidor decide quién escribe y el POST revalida por su
          cuenta. Sin permiso no se pinta un campo que iba a devolver 403. */}
      {active.canWrite && (
        <div className="mt-7">
          <textarea
            value={draft}
            onChange={(e) =>
              setDrafts((p) => ({ ...p, [active.logId]: e.target.value.slice(0, BITACORA_TEXT_MAX) }))
            }
            disabled={submitting}
            rows={4}
            maxLength={BITACORA_TEXT_MAX}
            placeholder={BITACORA_FORM.placeholder}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-3.5 py-3 text-[14px] font-light text-slate-200 placeholder:text-slate-600 leading-relaxed resize-none focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
          />
          <div className="flex items-center justify-between gap-3 mt-2.5">
            <span className="text-[10px] font-mono text-slate-600 tabular-nums shrink-0">
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
      )}

      {/* ── La bitácora, al final y colapsada. Respaldo, no protagonista. ── */}
      <div className="mt-8 border-t border-slate-800/40 pt-4">
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          className="w-full min-h-[44px] flex items-center justify-between text-left"
        >
          <span className="text-[11px] font-light uppercase tracking-wider text-slate-500">
            {BITACORA_HISTORY.label} · {bitacoraDisclosure(active.entriesCount)}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-600 transition-transform shrink-0',
              historyOpen ? 'rotate-180' : 'rotate-0'
            )}
          />
        </button>

        {historyOpen && (
          <div className="mt-4">
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
                          <span className="text-[11px] font-light text-slate-300">
                            {e.author.name}
                          </span>
                        )}
                      </div>
                      {/* Nombre y cargo, sin etiqueta de jerarquía (decisión Victor): el
                          cargo ya dice de dónde viene la entrada. */}
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
        )}
      </div>
    </>
  );
}
