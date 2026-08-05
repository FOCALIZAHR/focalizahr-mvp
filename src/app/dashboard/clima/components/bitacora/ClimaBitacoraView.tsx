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
// ── DOS ESTADOS, MISMO CONTENEDOR ─────────────────────────────────────────
//
// PORTADA (primer estado): título word-split, número hero en BLANCO como respaldo
// del título, dos frases y UN CTA. Sin identidad de persona, sin salida propia
// (SKILL.md Gate 1). Molde CompensationPortada, NO el PATRÓN 5 de
// page-patterns.md:211-270, que trae caja de misión, gauge y grilla.
//
// FOCOS (segundo estado): cuatro bloques, sin scroll. Antes ocupaba tres pantallas
// de alto, once bloques apilados y dos scrolls para llegar a lo único que la
// persona vino a hacer.
//
//   1. rótulo + salida + identidad                36px
//   2. contador fijo + píldoras monolínea         44px
//   3. UNA caja: depto, problema, pasos, CAMPO   ~380px
//   4. bitácora: un renglón que se abre, o una línea si no hay registros
//
// El rótulo de pantalla y el título de la portada dicen lo MISMO que la card del
// Rail por la que se entra. Un nombre distinto para la misma superficie obliga a
// reaprender la navegación. La persona entra cada varios meses, por un
// recordatorio, y tiene un minuto.
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
  ArrowRight,
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
  BITACORA_PORTADA,
  BITACORA_PLAN,
  BITACORA_FORM,
  BITACORA_HISTORY,
  BITACORA_TOAST,
  BITACORA_TEXT_MAX,
  BITACORA_RECENT_HOURS,
  bitacoraCounter,
  bitacoraPortadaSuffix,
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
  /**
   * Motor de dos estados dentro del MISMO contenedor: portada, clic en el CTA, y el
   * cuerpo pasa al carrusel. Sin scroll y sin cambiar de ruta.
   */
  const [vista, setVista] = useState<'portada' | 'focos'>('portada');
  /** Solo móvil: los pasos se colapsan para que el campo entre en 568px de alto. */
  const [stepsOpen, setStepsOpen] = useState(false);
  const pillsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Cierra el overlay y devuelve el cursor al campo, que es a lo que la persona vino. */
  const cerrarHistorial = useCallback(() => {
    setHistoryOpen(false);
    textareaRef.current?.focus();
  }, []);

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
      const nuevos = data.items ?? [];
      setItems(nuevos);
      setViewer(data.viewer ?? null);
      // ⛔ NO se toca `vista` acá. Tenía `setVista('portada')` y cualquier cosa que
      // re-ejecutara este load devolvía al usuario a la portada de golpe: si estaba
      // escribiendo, perdía el contexto del foco y el borrador quedaba en un foco que
      // ya no estaba mirando. Un refresco en segundo plano NUNCA mueve al usuario de
      // donde está. El primer estado sigue siendo la portada por el useState inicial.
      //
      // El índice solo se corrige si quedó fuera de rango (la lista se achicó): si no,
      // sigue donde estaba, por lo mismo.
      setActiveIdx((i) => (i < nuevos.length ? i : 0));
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
    // `vista` entra en las deps porque la barra NO existe en la portada: sin él, el
    // ref sería null al montar y las flechas nunca se medirían.
  }, [medirDesborde, status, items.length, vista]);

  /**
   * Escape cierra el overlay de la bitácora. Mismo patrón que el resto del sistema
   * (`ResolvedAlertDetailModal.tsx:138-144`): listener en window mientras está abierto.
   */
  useEffect(() => {
    if (!historyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrarHistorial();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [historyOpen, cerrarHistorial]);

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

  // ── PORTADA — primer estado. Molde CompensationPortada: número hero en BLANCO,
  //    narrativa, un solo CTA. Sin identidad de persona, sin split (SKILL.md Gate 1). ──
  if (vista === 'portada') {
    const equipos = new Set(items.map((i) => i.departmentId)).size;
    // SIN barraSuperior: la portada NO lleva identidad de persona ni salida
    // (SKILL.md Gate 1: "mensaje corto más 1 CTA, sin identidad de persona"). El
    // nombre, el "Volver a Clima" y el rótulo de pantalla son encabezado del
    // carrusel y aparecen recién ahí. Desde la portada la salida es el Rail, que
    // está fijo abajo: no hay que inventar una, ya se está dentro de Clima.
    return shell(
      /* ALTURA — medida token por token, no a ojo. Antes sumaba ~594px de card y con
         el header de Clima, el padding del stage y el Rail colapsado se pasaba de un
         viewport de laptop (768px), que es donde el CTA quedaba fuera.

           py del bloque   96 → 48   (py-8 md:py-12 → py-4 md:py-6)
           título h2       45 → 37   (4xl → 3xl)
           título h3       37 → 30   (3xl → 2xl)
           narrativa      104 → 78   (max-w-xl → 2xl: 4 líneas pasan a 3)
           mt sueltos      64 → 44   (número, narrativa y CTA)
                          ─────────
           card          ~594 → ~485

         El ancho mayor no es cosmético: es lo que saca una línea entera de narrativa. */
      <div className="flex flex-col items-center text-center py-4 md:py-6 max-w-2xl mx-auto">
          {/* Título ARRIBA, número debajo como respaldo. Es el orden del molde: primero
              qué pantalla es, después el dato que la sostiene. Sin kicker: con el título
              puesto repetía lo mismo y gastaba altura. */}
          <h2 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight">
            {BITACORA_PORTADA.titleWhite}
          </h2>
          <h3 className="text-xl md:text-2xl font-light tracking-tight leading-tight fhr-title-gradient">
            {BITACORA_PORTADA.titleGradient}
          </h3>

          {/* Número en blanco, NO cian: el cian es del CTA y no deben competir. */}
          <p className="text-[56px] md:text-[64px] font-extralight tabular-nums text-white leading-[0.9] mt-4">
            {items.length}
          </p>
          <p className="text-sm font-light text-slate-500 mt-1">
            {bitacoraPortadaSuffix(items.length, equipos)}
          </p>
          <p className="text-base font-light text-slate-300 leading-relaxed mt-5">
            {BITACORA_PORTADA.narrative}
          </p>
          <p className="text-sm font-light text-slate-500 leading-relaxed mt-3">
            {BITACORA_PORTADA.consequence}
          </p>
          <div className="mt-6">
            <PrimaryButton
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => setVista('focos')}
            >
              {BITACORA_PORTADA.cta}
            </PrimaryButton>
          </div>
      </div>
    );
  }

  // ── FOCOS — UNA SOLA CAJA ────────────────────────────────────────────────
  // Cabecera (flechas fijas + pestañas), contexto y campo comparten lienzo,
  // separados por líneas internas. Antes eran dos cajas con dos bordes y el
  // carrusel flotaba afuera: lo que se selecciona arriba es lo que se despliega
  // abajo, y tiene que verse como una sola cosa.
  return shell(
    <>
      {barraSuperior}

      <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/30 overflow-hidden">
        {/* ── CABECERA: flechas como BLOQUES FIJOS en los extremos ──
            Antes eran botones superpuestos sobre el área de scroll y pisaban el
            texto. Ancladas a los extremos con borde propio, el carrusel se desliza
            en el medio y es estructuralmente imposible que se pisen.
            Se apagan del lado sin recorrido; `invisible` reserva el ancho para que
            la cabecera no salte. No se sacan: la rueda no funciona en este carrusel
            y son la única forma de navegarlo con mouse. */}
        <div className="flex items-stretch border-b border-slate-800/60">
          <button
            onClick={() => desplazarPildoras(-1)}
            aria-label="Focos anteriores"
            className={cn(
              'hidden md:flex shrink-0 w-9 items-center justify-center border-r border-slate-800/60 bg-slate-900/40 hover:bg-slate-800 transition-colors',
              !canLeft && 'invisible pointer-events-none'
            )}
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </button>

          <div
            ref={pillsRef}
            className="flex-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            style={{ scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch' }}
          >
            {/* Riel + pestañas: patrón de Performance (MomentContent.tsx:162-180),
                clonado con fidelidad. Activa cian sólida con texto oscuro; inactivas
                TRANSPARENTES sobre el riel, que es lo que da la sensación de sólido.
                No se inventa una variante con fondo propio por pestaña: esa no
                existe en el sistema. */}
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 m-2 w-max">
              {items.map((it, i) => (
                <button
                  key={it.logId}
                  onClick={() => {
                    setActiveIdx(i);
                    setHistoryOpen(false);
                  }}
                  style={{ scrollSnapAlign: 'start' }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                    i === activeIdx ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-white'
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

          <button
            onClick={() => desplazarPildoras(1)}
            aria-label="Focos siguientes"
            className={cn(
              'hidden md:flex shrink-0 w-9 items-center justify-center border-l border-slate-800/60 bg-slate-900/40 hover:bg-slate-800 transition-colors',
              !canRight && 'invisible pointer-events-none'
            )}
          >
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* `relative` acota el overlay de la bitácora a contexto + campo: la
            cabecera queda visible detrás, así no se pierde en qué foco se está. */}
        <div className="relative">
          {/* ── CONTEXTO ──
              SIN el nombre del departamento: la pestaña activa ya lo dice, y antes
              aparecía dos veces. */}
          <div className="px-4 py-3 md:px-5 md:py-4 border-b border-slate-800/60">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] text-slate-200 font-light leading-[1.6]">
                {active.narrative}
              </p>
              {/* Acceso a la bitácora. Si el foco no tiene registros, NO EXISTE. */}
              {active.entriesCount > 0 && (
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {bitacoraDisclosure(active.entriesCount)}
                </button>
              )}
            </div>

            {active.steps.length > 0 && (
              <div className="mt-3">
                {/* En móvil los pasos se colapsan: con el texto real del diccionario
                    y dos pasos, el campo quedaba fuera de un viewport de 568px. En
                    escritorio quedan visibles. El problema se ve completo siempre. */}
                <button
                  onClick={() => setStepsOpen((v) => !v)}
                  className="md:hidden flex items-center gap-1 text-[11px] font-light text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {BITACORA_PLAN.stepsLabel}
                  <ChevronDown
                    className={cn('w-3 h-3 transition-transform', stepsOpen ? 'rotate-180' : '')}
                  />
                </button>
                <p className="hidden md:block text-[11px] font-light text-slate-500 mb-1">
                  {BITACORA_PLAN.stepsLabel}
                </p>
                <ul className={cn('space-y-1 pl-4 mt-1', !stepsOpen && 'hidden md:block')}>
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
          </div>

          {/* ── EL CAMPO ──
              Gate por canWrite: el POST revalida por su cuenta, así que sin permiso
              no se pinta un campo que iba a devolver 403. */}
          {active.canWrite && (
            <div className="px-4 py-3 md:px-5 md:py-4">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) =>
                  setDrafts((p) => ({ ...p, [active.logId]: e.target.value.slice(0, BITACORA_TEXT_MAX) }))
                }
                disabled={submitting}
                rows={3}
                maxLength={BITACORA_TEXT_MAX}
                placeholder={BITACORA_FORM.placeholder}
                className="w-full rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2 text-[14px] font-light text-slate-200 placeholder:text-slate-600 leading-relaxed resize-none focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
              />
              <div className="flex items-center justify-between gap-3 mt-2">
                <span className="text-[10px] font-mono text-slate-600 tabular-nums shrink-0">
                  {draft.length}/{BITACORA_TEXT_MAX}
                </span>
                <PrimaryButton size="sm" onClick={onRegistrar} disabled={!puedeRegistrar}>
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> {BITACORA_FORM.submitting}
                    </span>
                  ) : (
                    BITACORA_FORM.submit
                  )}
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* ── OVERLAY DE LA BITÁCORA ──
              Contenido DENTRO de la card, cubriendo contexto y campo. Cierra con
              clic fuera del panel o con Escape, y devuelve el cursor al campo.

              ⚠️ Construido acotado a ESTA pantalla porque el sistema NO tiene un
              overlay contextual: lo que hay son modales de pantalla completa
              (FocalizaIntelligenceModal.tsx:194-204,
              ResolvedAlertDetailModal.tsx:138-144) y el Dialog de Radix. Si otro
              módulo necesita este patrón, se EXTRAE a components/ui en vez de
              clonarlo acá. */}
          <AnimatePresence>
            {historyOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={cerrarHistorial}
                className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-3 overflow-y-auto"
              >
                <motion.div
                  initial={{ y: 8 }}
                  animate={{ y: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-900 p-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      {BITACORA_HISTORY.label}
                    </p>
                    <button
                      onClick={cerrarHistorial}
                      className="text-[11px] font-light text-slate-500 hover:text-white transition-colors"
                    >
                      {BITACORA_HISTORY.close}
                    </button>
                  </div>

                  {active.entries.length === 0 ? (
                    <p className="text-[13px] font-light text-slate-400 leading-relaxed">
                      {BITACORA_HISTORY.invite}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {active.entries.map((e) => (
                        <div key={e.id} className="rounded-md bg-slate-800/60 px-3 py-2.5">
                          {/* El texto es el protagonista; la firma va debajo, secundaria. */}
                          <p className="text-[13px] text-slate-100 leading-relaxed">{e.text}</p>
                          <p className="text-[10px] text-slate-400 mt-1.5">
                            {formatFecha(e.createdAt)}
                            {e.author && ` · ${e.author.name}`}
                            {e.author?.position && ` · ${e.author.position}`}
                          </p>
                        </div>
                      ))}
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
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

