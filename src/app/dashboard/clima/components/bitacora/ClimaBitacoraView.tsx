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
// ── LAYOUT: CUATRO BLOQUES, SIN SCROLL (rediseño 2026-08-04) ───────────────
// Antes ocupaba tres pantallas de alto: once bloques apilados antes del campo,
// dos scrolls para llegar a lo único que la persona vino a hacer. Ahora:
//
//   1. salida + identidad, mismo renglón          36px
//   2. contador fijo + píldoras monolínea         44px
//   3. UNA caja: depto, problema, pasos, CAMPO   ~380px
//   4. bitácora: un renglón que se abre, o una línea si no hay registros
//
// Se eliminaron kicker, título y bajada: la persona entra desde la card del Rail
// que ya dice "Bitácora de Acciones", así que repetían lo que acababa de tocar.
// Entra cada varios meses, por un recordatorio, y tiene un minuto.
//
// Píldoras: patrón canónico de la skill (focalizahr-design →
// references/page-patterns.md:107-131, PATRÓN 2), NO el carrusel de cards de
// ClimaRail que se había clonado por error. Monolínea, whitespace-nowrap, 4
// visibles más scroll horizontal.
//
// ÚNICA fuente de datos: GET /api/clima/action-log?scope=mine. El servidor decide
// qué focos le tocan y con qué identidad; el cliente no filtra ni elige nada.
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
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
  bitacoraPill,
  bitacoraAbreviarDepartamentos,
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const pillsRef = useRef<HTMLDivElement>(null);

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

  /** Abreviaturas anti-colisión, calculadas sobre los departamentos de ESTA vista. */
  const abreviaturas = useMemo(
    () => bitacoraAbreviarDepartamentos(items.map((i) => i.departmentName)),
    [items]
  );

  /**
   * El mapa está keyeado por nombre único de departamento, así que su tamaño ES la
   * cantidad de departamentos distintos en la vista. Uno solo => la abreviatura sale
   * de las píldoras (ver bitacoraPill).
   */
  const unSoloDepartamento = abreviaturas.size === 1;

  /**
   * Flechas del carrusel. Reemplazan al listener de rueda, que se intentó dos veces y
   * nunca movió la barra en escritorio (táctil y arrastre sí funcionaban).
   *
   * Un clic no depende de interceptar un evento del navegador ni de pelear con
   * `scroll-snap`: es lo que hace cualquier carrusel de escritorio, y resuelve el
   * problema real, que era que con mouse había píldoras a las que no se podía llegar.
   *
   * `canLeft`/`canRight` existen para ocultar la flecha del lado sin recorrido: una
   * flecha que no hace nada es peor que no tenerla.
   */
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const medirDesborde = useCallback(() => {
    const el = pillsRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // Tolerancia de 1px: los anchos son fraccionarios y el extremo nunca da exacto.
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft < max - 1);
  }, []);

  /**
   * Depende de `status` e `items.length` porque la barra no existe en loading, en
   * error ni en el estado vacío: corriendo una sola vez al montar, el ref estaría en
   * null y nunca se engancharía.
   */
  useEffect(() => {
    const el = pillsRef.current;
    if (!el) return;
    medirDesborde();
    el.addEventListener('scroll', medirDesborde, { passive: true });
    window.addEventListener('resize', medirDesborde);
    return () => {
      el.removeEventListener('scroll', medirDesborde);
      window.removeEventListener('resize', medirDesborde);
    };
  }, [medirDesborde, status, items.length]);

  /** Corre ~80% del ancho visible: deja una píldora de contexto entre salto y salto. */
  const desplazarPildoras = useCallback((direccion: 1 | -1) => {
    const el = pillsRef.current;
    if (!el) return;
    el.scrollBy({ left: direccion * Math.max(el.clientWidth * 0.8, 120), behavior: 'smooth' });
  }, []);

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

  // ── Chrome canónico. Padding contenido: la pantalla tiene que entrar sin scroll. ──
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
        <div className="px-4 py-5 md:px-6 md:py-6">{children}</div>
      </div>
    </motion.div>
  );

  // ── BLOQUE 1 — nombre de la pantalla + salida e identidad en el mismo renglón ──
  const barraSuperior = (
    <>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
        {BITACORA_SCREEN.screenName}
      </p>
      <div className="flex items-center justify-between gap-3 min-h-[36px]">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-light shrink-0"
      >
        <ArrowLeft className="w-4 h-4" /> {BITACORA_SCREEN.back}
      </button>
      {viewer && (
        // Identidad resuelta EN EL SERVIDOR: es la que va a quedar firmando lo que
        // escriba. Nombre y cargo en un renglón, sin etiqueta.
        <p className="text-[11px] font-light text-slate-400 truncate text-right">
          {viewer.name}
          {viewer.position && <span className="text-slate-600"> · {viewer.position}</span>}
        </p>
      )}
      </div>
    </>
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
        {barraSuperior}
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
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

  if (items.length === 0 || !active) {
    return shell(
      <>
        {barraSuperior}
        {/* Estado vacío honesto. Hoy es el camino REAL de casi todos los usuarios: sin
            el vínculo con la nómina el servidor no tiene a quién reconocer y devuelve
            lista vacía. Ver el bloque de resolveViewerEmployeeId en el endpoint. */}
        <div className="mt-5">
          <FHREmptyState
            type="pending"
            title={BITACORA_SCREEN.empty.title}
            description={BITACORA_SCREEN.empty.description}
          />
        </div>
      </>
    );
  }

  return shell(
    <>
      {barraSuperior}

      {/* ── BLOQUE 2 — contador FIJO + píldoras monolínea ──
          Patrón canónico de pills (page-patterns.md:107-131): whitespace-nowrap,
          rounded-lg, scroll horizontal. El contador no scrollea, para saber cuántos
          focos hay sin recorrer la barra. */}
      <div className="flex items-center gap-3 mt-4 min-h-[44px]">
        <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-slate-500 tabular-nums">
          {bitacoraCounter(activeIdx, items.length)}
        </span>
        {/* `min-w-0` NO es cosmético: sin él este div es un hijo flex con
            `min-width: auto`, o sea que no puede encogerse por debajo del ancho de su
            contenido. Con 8 focos crecía hasta las 8 píldoras, nunca desbordaba, nunca
            había scroll, y el `overflow-hidden` de la card cortaba la cuarta contra el
            borde sin forma de llegar a las que faltaban.

            El degradado del borde derecho es la señal de que la lista sigue. Va inline
            porque Tailwind no trae utilidad de máscara y no es color: es un recorte de
            opacidad. Queda fijo aunque se llegue al final (apagarlo pide un listener de
            scroll; decisión de Victor 2026-08-04: no vale el estado).

            El `min-w-0` se mudó a este wrapper: las flechas van absolutas sobre la barra
            y necesitan un ancestro `relative` que no sea el contenedor que scrollea. */}
        <div className="relative flex-1 min-w-0">
          {/* Flechas: patrón del módulo (ClimaRail.tsx:125-131), más chicas porque acá la
              barra mide 44px y no 100+. Dos diferencias deliberadas con ese patrón:
              no se revelan en hover (esconder la única forma de llegar a las píldoras
              detrás de un hover recrea el problema que vinieron a resolver), y se ocultan
              del lado sin recorrido. Solo en escritorio: en táctil el arrastre funciona y
              acá taparían píldoras en 320px. */}
          {canLeft && (
            <button
              onClick={() => desplazarPildoras(-1)}
              aria-label="Focos anteriores"
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full bg-slate-800/90 border border-slate-700 hover:bg-slate-700 transition-colors shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          )}
          {canRight && (
            <button
              onClick={() => desplazarPildoras(1)}
              aria-label="Focos siguientes"
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full bg-slate-800/90 border border-slate-700 hover:bg-slate-700 transition-colors shadow-lg"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          )}
          <div
            ref={pillsRef}
            className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth -mx-1 px-1 py-1"
            style={{
              scrollSnapType: 'x proximity',
              WebkitOverflowScrolling: 'touch',
              maskImage: 'linear-gradient(to right, #000 calc(100% - 28px), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 28px), transparent)',
            }}
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
                'shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-light whitespace-nowrap transition-colors border',
                i === activeIdx
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
              )}
            >
              {bitacoraPill(
                unSoloDepartamento ? null : (abreviaturas.get(it.departmentName) ?? it.departmentName),
                dimensionLabel(it.category)
              )}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* ── BLOQUE 3 — UNA caja: contexto y acción juntos ── */}
      <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/30 p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
          {active.departmentName}
        </p>

        <p className="text-[15px] text-slate-200 font-light leading-[1.6]">{active.narrative}</p>

        {active.steps.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] font-light text-slate-500 mb-1">{BITACORA_PLAN.stepsLabel}</p>
            <ul className="space-y-1 pl-4">
              {active.steps.map((s, i) => (
                <li key={i} className="text-[12px] text-slate-500 font-light leading-relaxed list-disc">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {active.ceoNotes && (
          <p className="text-[12px] font-light text-slate-400 mt-3 pl-3 border-l border-slate-700/40">
            <span className="text-slate-500">{BITACORA_PLAN.notesLabel}: </span>
            {active.ceoNotes}
          </p>
        )}

        {avisoReciente && (
          <div className="flex items-start gap-2 mt-3 rounded-lg border border-slate-700/30 bg-slate-800/20 px-3 py-2">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-[12px] font-light text-slate-400 leading-relaxed">{avisoReciente}</p>
          </div>
        )}

        {/* El campo, dentro de la misma caja que el contexto que lo justifica.
            Gate por canWrite: el POST revalida por su cuenta, así que sin permiso no
            se pinta un campo que iba a devolver 403. */}
        {active.canWrite && (
          <div className="mt-4">
            <textarea
              value={draft}
              onChange={(e) =>
                setDrafts((p) => ({ ...p, [active.logId]: e.target.value.slice(0, BITACORA_TEXT_MAX) }))
              }
              disabled={submitting}
              rows={3}
              maxLength={BITACORA_TEXT_MAX}
              placeholder={BITACORA_FORM.placeholder}
              className="w-full rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2.5 text-[14px] font-light text-slate-200 placeholder:text-slate-600 leading-relaxed resize-none focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
            />
            <div className="flex items-center justify-between gap-3 mt-2">
              <span className="text-[10px] font-mono text-slate-600 tabular-nums shrink-0">
                {draft.length}/{BITACORA_TEXT_MAX}
              </span>
              {/* Único CTA de la pantalla => `lg` + glow, el tier que la skill reserva
                  para la acción principal (focalizahr-design →
                  references/premium-components.md:316, tabla de decisiones). Estaba en
                  `sm`, que es el tier de acciones dentro de tablas y listas: 32px de
                  alto, por debajo del mínimo de 44px de tap target, y se leía fantasma.
                  Sin `fullWidth` (decisión de Victor): el contador se queda en su lugar.
                  El spinner sale de la prop `isLoading` del propio componente, no de un
                  Loader2 a mano (premium-components.md:344). */}
              <PrimaryButton
                size="lg"
                glow
                isLoading={submitting}
                onClick={onRegistrar}
                disabled={!puedeRegistrar}
              >
                {submitting ? BITACORA_FORM.submitting : BITACORA_FORM.submit}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>

      {/* ── BLOQUE 4 — un renglón. Colapsado NO reserva altura. ──
          Dos formas, no dos bloques: con registros es un disclosure que se abre; sin
          registros es una línea sola. Un disclosure vacío era un renglón muerto con
          una flecha que no llevaba a ningún lado. */}
      <div className="mt-3">
        {active.entriesCount === 0 ? (
          <p className="py-2 text-[12px] font-light text-slate-500 leading-relaxed">
            {BITACORA_HISTORY.invite}
          </p>
        ) : (
          <>
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 py-2 text-left group"
            >
              <span className="text-[11px] font-light text-slate-500 group-hover:text-slate-400 transition-colors">
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
              <div className="mt-2 pb-1">
                <div className="space-y-3">
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
                        <p className="text-[13px] font-light text-slate-300 leading-relaxed mt-1">
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
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
