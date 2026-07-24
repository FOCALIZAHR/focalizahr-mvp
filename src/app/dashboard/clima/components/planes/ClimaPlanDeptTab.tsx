'use client';

// src/app/dashboard/clima/components/planes/ClimaPlanDeptTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Tab 1 — POR DEPARTAMENTO (Gate 5D-i). Orquestador: conserva TODA la lógica de
// datos (preview-first, POST lazy, PUT autosave/aprobar, manejo 409) y monta la
// capa visual de carrusel de 4 caminos ↔ pantalla completa 35/65 de un camino.
//
// Flujo de datos (sin cambios respecto a la lista plana):
//   - Al abrir: GET generate (0 writes) + GET lista de planes clima.
//   - Borrador → se edita; aprobado → read-only; ninguno → preview (sin fila).
//   - Borrador lazy con la 1ª decisión (POST). Carrera → 409 → adopta existingPlanId.
//   - Aprobar → PUT estado='aprobado' → read-only.
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import {
  groupDecisionsByBlock,
  type ClimaPlanBlock,
} from '@/lib/services/clima/climaPlanRouting';
import { CLIMA_PLAN_PATH_ORDER } from '@/lib/constants/climaPlanPaths';
import type { ClimaDecisionItem, CeoDecision } from '@/types/clima-planes';
import ClimaPlanPortada from './ClimaPlanPortada';
import ClimaPathCarousel from './ClimaPathCarousel';
import ClimaPathWorkspace from './ClimaPathWorkspace';
import ClimaCheckout from './ClimaCheckout';
import ClimaSinFocosState from './ClimaSinFocosState';
import type { BlockStatus } from './ClimaPathChaining';

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

interface DeptSinDatos {
  departmentId: string;
  departmentName: string;
}
interface ActionPlanRow {
  id: string;
  estado: string;
  decisiones: unknown;
}

export type ClimaPlanDeptView = 'portada' | 'carrusel' | 'path';

/** Resultado de una escritura. NUNCA se descarta en silencio. */
export type PersistResult = { ok: true } | { ok: false; error: string };

/** Traduce el fallo a lenguaje humano (anti-patrón: nunca mensajes técnicos en pantalla). */
function humanError(status: number, serverMsg?: string): string {
  if (status === 403) return 'No tenés permisos para guardar cambios en este plan.';
  if (status === 404) return 'El plan ya no existe. Recargá la página.';
  if (status === 0) return 'Sin conexión con el servidor.';
  return serverMsg || 'No se pudo guardar. Intentá de nuevo.';
}

interface ClimaPlanDeptTabProps {
  campaignId: string | null;
  /** Reporta la vista interna al shell (para que oculte sus tabs fuera del carrusel). */
  onViewChange?: (view: ClimaPlanDeptView) => void;
  /** Salida al Lobby (gauge + Zona Crítica). = `hook.exitSubproducto` del orquestador,
   *  el mismo destino que el "Volver" del breadcrumb. Lo usa el CTA del Checkout. */
  onExitToLobby?: () => void;
}

export default function ClimaPlanDeptTab({
  campaignId,
  onViewChange,
  onExitToLobby,
}: ClimaPlanDeptTabProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [decisiones, setDecisiones] = useState<ClimaDecisionItem[]>([]);
  const [sinDatos, setSinDatos] = useState<DeptSinDatos[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [estado, setEstado] = useState<'borrador' | 'aprobado' | null>(null);
  const [saving, setSaving] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<ClimaPlanBlock | null>(null);
  const [entered, setEntered] = useState(false);
  // Acto 4 (Checkout Ejecutivo): se abre al aprobar el plan; su CTA vuelve al carrusel.
  const [showCheckout, setShowCheckout] = useState(false);

  const readOnly = estado === 'aprobado';

  // ── Carga inicial: preview + chequeo de borrador/aprobado ──
  useEffect(() => {
    if (!campaignId) {
      setStatus('error');
      setError('Selecciona una campaña en el Rail para ver su plan de acción.');
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus('loading');
      setError(null);
      try {
        const [genRes, listRes] = await Promise.all([
          fetch(`/api/clima/action-plan/generate?campaignId=${campaignId}`),
          fetch(`/api/action-plans?moduleType=clima&campaignId=${campaignId}`),
        ]);
        const genJson = await genRes.json();
        const listJson = await listRes.json();
        if (cancelled) return;
        if (!genJson.success) {
          setStatus('error');
          setError(genJson.error ?? 'No se pudo generar el plan.');
          return;
        }
        const preview: ClimaDecisionItem[] = genJson.data.decisiones ?? [];
        setSinDatos(genJson.data.departamentosSinDatos ?? []);

        const planes: ActionPlanRow[] = listJson.success ? listJson.data ?? [] : [];
        const borrador = planes.find((p) => p.estado === 'borrador');
        const aprobado = planes.find((p) => p.estado === 'aprobado');
        const active = borrador ?? aprobado ?? null;

        if (active) {
          setPlanId(active.id);
          setEstado(active.estado === 'aprobado' ? 'aprobado' : 'borrador');
          setDecisiones((active.decisiones as ClimaDecisionItem[]) ?? preview);
        } else {
          setPlanId(null);
          setEstado(null);
          setDecisiones(preview);
        }
        setStatus('ready');
      } catch {
        if (!cancelled) {
          setStatus('error');
          setError('Error de red al cargar el plan de acción.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  // ── Persistencia: crea el borrador lazy (POST) o autosave (PUT) ──
  const persist = useCallback(
    async (next: ClimaDecisionItem[]): Promise<PersistResult> => {
      // Snapshot para rollback: el update es optimista, pero si el servidor rechaza
      // hay que revertirlo o la UI miente (la barra de progreso contaría una decisión
      // que nunca se guardó).
      const prev = decisiones;
      setDecisiones(next);

      if (readOnly || !campaignId) {
        setDecisiones(prev);
        return { ok: false, error: 'No hay una campaña seleccionada.' };
      }

      setSaving(true);
      try {
        if (planId === null) {
          const res = await fetch('/api/action-plans', {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({ moduleType: 'clima', campaignId, decisiones: next }),
          });
          const json = await res.json().catch(() => ({} as Record<string, unknown>));

          if (res.status === 409 && json.existingPlanId) {
            setPlanId(json.existingPlanId as string);
            setEstado('borrador');
            const putRes = await fetch(`/api/action-plans/${json.existingPlanId}`, {
              method: 'PUT',
              headers: JSON_HEADERS,
              body: JSON.stringify({ decisiones: next }),
            });
            if (!putRes.ok) {
              const pj = await putRes.json().catch(() => ({} as Record<string, unknown>));
              setDecisiones(prev);
              return { ok: false, error: humanError(putRes.status, pj.error as string) };
            }
            return { ok: true };
          }

          if (res.ok && json.success) {
            setPlanId((json.data as { id: string }).id);
            setEstado('borrador');
            return { ok: true };
          }

          setDecisiones(prev);
          return { ok: false, error: humanError(res.status, json.error as string) };
        }

        const putRes = await fetch(`/api/action-plans/${planId}`, {
          method: 'PUT',
          headers: JSON_HEADERS,
          body: JSON.stringify({ decisiones: next }),
        });
        if (!putRes.ok) {
          const pj = await putRes.json().catch(() => ({} as Record<string, unknown>));
          setDecisiones(prev);
          return { ok: false, error: humanError(putRes.status, pj.error as string) };
        }
        return { ok: true };
      } catch {
        setDecisiones(prev);
        return { ok: false, error: humanError(0) };
      } finally {
        setSaving(false);
      }
    },
    [campaignId, planId, readOnly, decisiones]
  );

  const handleDecision = useCallback(
    (triggerRef: string, decision: CeoDecision, notes?: string): Promise<PersistResult> =>
      persist(
        decisiones.map((d) =>
          d.triggerRef === triggerRef
            ? // `ceoNotes` solo se escribe si viene: Aceptar/Rechazar no lo tocan y una
              // nota previa no se pisa con undefined.
              { ...d, ceoDecision: decision, ...(notes !== undefined ? { ceoNotes: notes } : {}) }
            : d
        )
      ),
    [decisiones, persist]
  );

  // Lote (Bloque 3): aprueba ('aceptar') o pospone ('pospuesto') un sub-batch entero en
  // un autosave atómico. 'pospuesto' cuenta como decidido (gate) pero no genera log/recordatorio.
  const handleBatchDecision = useCallback(
    async (triggerRefs: string[], decision: 'aceptar' | 'pospuesto') => {
      const set = new Set(triggerRefs);
      setBatchError(null);
      const res = await persist(
        decisiones.map((d) =>
          set.has(d.triggerRef) ? { ...d, ceoDecision: decision } : d
        )
      );
      if (!res.ok) setBatchError(res.error);
    },
    [decisiones, persist]
  );

  const handleApprove = useCallback(async () => {
    if (!planId || readOnly) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/action-plans/${planId}`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify({ estado: 'aprobado' }),
      });
      const json = await res.json();
      if (json.success) {
        setEstado('aprobado');
        setShowCheckout(true); // Acto 4: Checkout Ejecutivo
      }
    } catch {
      /* noop */
    } finally {
      setSaving(false);
    }
  }, [planId, readOnly]);

  const groups = useMemo(() => groupDecisionsByBlock(decisiones), [decisiones]);
  const decidedCount = useMemo(() => decisiones.filter((d) => d.ceoDecision).length, [decisiones]);
  /**
   * Frentes = bloques del carrusel con al menos 1 caso. NO es `decisiones.length`
   * (eso son casos individuales). Demo 2/11/0/4 → 3 frentes.
   */
  const frentes = useMemo(
    () => Object.values(groups).filter((items) => items.length > 0).length,
    [groups]
  );

  // Estado de los 4 bloques (orden de prioridad canónico) para el indicador de etapas
  // de la pantalla de cierre. INCLUYE gestion_corriente (el lote), que el gate cuenta.
  const blockStatuses: BlockStatus[] = useMemo(
    () =>
      CLIMA_PLAN_PATH_ORDER.map((b) => ({
        block: b,
        total: groups[b].length,
        pending: groups[b].filter((i) => !i.ceoDecision).length,
      })),
    [groups]
  );

  // Vista interna actual — reportada al shell para que oculte sus tabs fuera del carrusel.
  const view: ClimaPlanDeptView =
    status !== 'ready'
      ? 'carrusel'
      : !entered && decisiones.length > 0
        ? 'portada'
        : selectedPath === null
          ? 'carrusel'
          : 'path';
  useEffect(() => {
    onViewChange?.(view);
  }, [view, onViewChange]);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm font-light py-16 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Generando plan de acción…
      </div>
    );
  }
  if (status === 'error') {
    return <p className="text-sm font-light text-slate-500 py-16 text-center">{error}</p>;
  }

  const hasAnyContent = decisiones.length > 0 || sinDatos.length > 0;
  if (!hasAnyContent) {
    return <ClimaSinFocosState onExitToLobby={onExitToLobby} />;
  }

  return (
    <>
    <AnimatePresence mode="wait">
      {!entered && decisiones.length > 0 ? (
        <motion.div
          key="portada"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <ClimaPlanPortada frentes={frentes} onEnter={() => setEntered(true)} />
        </motion.div>
      ) : selectedPath === null ? (
        <motion.div
          key="carrusel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <ClimaPathCarousel
            groups={groups}
            sinDatos={sinDatos}
            total={decisiones.length}
            decided={decidedCount}
            saving={saving}
            readOnly={readOnly}
            canApprove={planId !== null && decidedCount === decisiones.length}
            onSelectPath={setSelectedPath}
            onApprove={handleApprove}
          />
        </motion.div>
      ) : (
        <motion.div
          key={`path-${selectedPath}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ClimaPathWorkspace
            block={selectedPath}
            items={groups[selectedPath]}
            readOnly={readOnly}
            onDecision={handleDecision}
            onBatchDecision={handleBatchDecision}
            batchError={batchError}
            onBackToCarousel={() => setSelectedPath(null)}
            blockStatuses={blockStatuses}
            onGoToPath={setSelectedPath}
            canApprove={planId !== null && decidedCount === decisiones.length}
            saving={saving}
            onApprove={handleApprove}
          />
        </motion.div>
      )}
    </AnimatePresence>

    <ClimaCheckout
      open={showCheckout}
      decisiones={decisiones}
      onExit={() => {
        setShowCheckout(false);
        // El plan quedó 100% aprobado (read-only): volver al carrusel sería un callejón.
        // El destino real es el Lobby (gauge + Zona Crítica) vía exitSubproducto.
        onExitToLobby?.();
      }}
    />
    </>
  );
}
