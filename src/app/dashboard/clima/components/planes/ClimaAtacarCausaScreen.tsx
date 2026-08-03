'use client';

// src/app/dashboard/clima/components/planes/ClimaAtacarCausaScreen.tsx
// ════════════════════════════════════════════════════════════════════════════
// EX Clima Gate 5C — "Atacar la causa" (Tab 2). Vista READ-ONLY de RRHH: a qué
// responsable quedó derivado el plan aprobado de un departamento, y lo que esa
// persona reportó. Solo lectura, sin editar.
//
// Layout: molde CompensationPortada (portada ejecutiva) — header PROTAGONISTA
// (departamento + responsable + número hero de focos + título word-split) y los
// hallazgos como secciones jerarquizadas, no una lista plana de cards iguales.
// Chrome (Tesla cyan+purple + glassmorphism) clonado de ClimaFixMetaScreen.
//
// ÚNICA fuente de datos: GET /api/clima/action-log (V1). NO llama a /api/action-plans
// ni by-person. Muestra, NO evalúa: sin veredicto/score/semáforo. Copy del diccionario
// (TAB2_ATACAR_SCREEN) PROVISIONAL — no se toca acá.
//
// DEUDA (junto con lo del contenido PROVISIONAL): el header ya es portada ejecutiva,
// pero el CUERPO sigue siendo una lista donde los N hallazgos pesan igual. Rediseñar
// la jerarquía del cuerpo CUANDO los textos del diccionario sean los reales — con
// contenido definitivo la jerarquía se lee distinta. No rediseñar antes.
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import { TAB2_ATACAR_SCREEN } from '@/lib/constants/climaTab2Content';
import type {
  ClimaAtacarCausaDecisionDTO,
  ClimaAtacarCausaEntryDTO,
  ClimaAtacarCausaLogDTO,
} from '@/types/clima-atacar-causa';

interface Props {
  planId: string;
  departmentId: string;
  departmentName: string;
  responsableName: string;
  onClose: () => void;
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export default function ClimaAtacarCausaScreen({
  planId,
  departmentId,
  departmentName,
  responsableName,
  onClose,
}: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [decisiones, setDecisiones] = useState<ClimaAtacarCausaDecisionDTO[]>([]);
  const [logsByTrigger, setLogsByTrigger] = useState<Record<string, ClimaAtacarCausaLogDTO>>({});
  const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch(`/api/clima/action-log?planId=${planId}&departmentId=${departmentId}`);
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok || !json.success) {
        setStatus('error');
        return;
      }
      const data = json.data as { decisiones: ClimaAtacarCausaDecisionDTO[]; logs: ClimaAtacarCausaLogDTO[] };
      setDecisiones(data.decisiones ?? []);
      const map: Record<string, ClimaAtacarCausaLogDTO> = {};
      for (const l of data.logs ?? []) map[l.triggerRef] = l;
      setLogsByTrigger(map);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [planId, departmentId]);

  useEffect(() => {
    load();
  }, [load]);

  // Historial read-only: paginación de "Ver todas" (V1 modo entradas). Sin escritura.
  const onLoadMore = useCallback(
    async (triggerRef: string) => {
      const log = logsByTrigger[triggerRef];
      if (!log) return;
      setLoadingMore((p) => ({ ...p, [triggerRef]: true }));
      try {
        const res = await fetch(`/api/clima/action-log?logId=${log.id}&offset=${log.entries.length}`);
        const json = await res.json().catch(() => ({} as Record<string, unknown>));
        if (res.ok && json.success) {
          const data = json.data as { entries: ClimaAtacarCausaEntryDTO[]; entriesCount: number };
          setLogsByTrigger((p) => {
            const cur = p[triggerRef];
            if (!cur) return p;
            return { ...p, [triggerRef]: { ...cur, entries: [...cur.entries, ...(data.entries ?? [])], entriesCount: data.entriesCount } };
          });
        }
      } catch {
        /* noop */
      } finally {
        setLoadingMore((p) => ({ ...p, [triggerRef]: false }));
      }
    },
    [logsByTrigger]
  );

  // Chrome canónico (clon de ClimaFixMetaScreen): Tesla cyan+purple + glassmorphism.
  const shell = (children: ReactNode) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
            opacity: 0.7,
          }}
        />
        <button
          onClick={onClose}
          className="absolute top-5 left-5 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" /> {TAB2_ATACAR_SCREEN.cancel}
        </button>
        <div className="px-6 py-14 md:px-10 md:py-16">{children}</div>
      </div>
    </motion.div>
  );

  if (status === 'loading') {
    return shell(
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-cyan-400 animate-spin" />
        <p className="text-sm font-light text-slate-400">{TAB2_ATACAR_SCREEN.loading}</p>
      </div>
    );
  }
  if (status === 'error') {
    return shell(
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <AlertTriangle className="w-8 h-8 text-slate-500" strokeWidth={1.5} />
        <div>
          <h3 className="text-slate-200 font-light text-base">{TAB2_ATACAR_SCREEN.error.title}</h3>
          <p className="text-sm font-light text-slate-500 mt-1">{TAB2_ATACAR_SCREEN.error.description}</p>
        </div>
        <PrimaryButton size="sm" onClick={load}>
          {TAB2_ATACAR_SCREEN.error.retry}
        </PrimaryButton>
      </div>
    );
  }
  if (decisiones.length === 0) {
    return shell(
      <FHREmptyState
        type="clear"
        title={TAB2_ATACAR_SCREEN.empty.title}
        description={TAB2_ATACAR_SCREEN.empty.description}
        cta={{ label: TAB2_ATACAR_SCREEN.cancel, onClick: onClose }}
      />
    );
  }

  const n = decisiones.length;

  return shell(
    <div>
      {/* ── Header protagonista (molde CompensationPortada) ── */}
      <header className="mb-10 md:mb-12">
        {/* Contexto: de quién es el plan (depto + responsable, sin guión) */}
        {(departmentName || responsableName) && (
          <div className="mb-4 space-y-1">
            {departmentName && (
              <p className="text-[11px] uppercase tracking-widest text-slate-400">{departmentName}</p>
            )}
            {responsableName && (
              <p className="text-[11px] font-light text-slate-500">
                Responsable · <span className="text-slate-300">{responsableName}</span>
              </p>
            )}
          </div>
        )}
        <div className="flex items-baseline gap-3">
          <span className="text-[64px] md:text-[72px] font-extralight tabular-nums text-white leading-[0.9]">
            {n}
          </span>
          <span className="text-sm font-light text-slate-500">{n === 1 ? 'foco' : 'focos'}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight mt-4">
          {TAB2_ATACAR_SCREEN.titleWhite}{' '}
          <span className="fhr-title-gradient">{TAB2_ATACAR_SCREEN.titleGradient}</span>
        </h2>
        <p className="text-base font-light text-slate-400 leading-relaxed mt-3 max-w-xl">
          {TAB2_ATACAR_SCREEN.intro}
        </p>
      </header>

      {/* ── Hallazgos como secciones jerarquizadas ── */}
      <div className="space-y-5">
        {decisiones.map((d) => {
          const log = logsByTrigger[d.triggerRef];
          const showHistory = !!log && log.entriesCount > 0;
          const hasMore = !!log && log.entries.length < log.entriesCount;

          return (
            <section key={d.triggerRef} className="relative pl-4 border-l border-slate-800/60">
              {/* Problema — texto primario del bloque */}
              <p className="text-[15px] text-slate-200 font-light leading-[1.7]">{d.narrative}</p>

              {/* Pasos — secundario */}
              {d.steps.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-light uppercase tracking-wider text-slate-600 mb-1.5">
                    {TAB2_ATACAR_SCREEN.stepsLabel}
                  </p>
                  <ul className="space-y-1 pl-4">
                    {d.steps.map((s, i) => (
                      <li key={i} className="text-[12px] text-slate-500 font-light leading-relaxed list-disc">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nota de RRHH — terciario */}
              {d.ceoNotes && (
                <p className="text-[12px] font-light text-slate-400 mt-3 pl-3 border-l border-slate-700/40">
                  <span className="text-slate-500">{TAB2_ATACAR_SCREEN.notesLabel}: </span>
                  {d.ceoNotes}
                </p>
              )}

              {/* Historial read-only — lo que reportó el responsable */}
              {showHistory && (
                <div className="mt-4 rounded-xl border border-slate-800/40 bg-slate-900/40 p-3.5 space-y-2">
                  <p className="text-[10px] font-light uppercase tracking-wider text-slate-600">
                    {TAB2_ATACAR_SCREEN.historyLabel}
                  </p>
                  <AnimatePresence initial={false}>
                    {log!.entries.map((e) => (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-3 border-l border-slate-700/40"
                      >
                        <p className="text-[13px] font-light text-slate-300 leading-relaxed">{e.text}</p>
                        <p className="text-[10px] font-light text-slate-600 mt-0.5">{formatFecha(e.createdAt)}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {hasMore && (
                    <GhostButton size="sm" onClick={() => onLoadMore(d.triggerRef)} disabled={loadingMore[d.triggerRef]}>
                      {loadingMore[d.triggerRef] ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" /> {TAB2_ATACAR_SCREEN.loadingMore}
                        </span>
                      ) : (
                        TAB2_ATACAR_SCREEN.seeAll(log!.entriesCount)
                      )}
                    </GhostButton>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
