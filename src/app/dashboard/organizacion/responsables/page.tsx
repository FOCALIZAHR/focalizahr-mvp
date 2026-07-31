'use client';

// src/app/dashboard/organizacion/responsables/page.tsx
// Mantenimiento del responsable de cada departamento, CARA AL CLIENTE.
//
// Contraparte de /dashboard/admin/accounts/[id]/structure (concierge). Mismo backend,
// dos superficies. Acá NO hay AccountSelector: la cuenta sale del JWT. Tampoco se
// crea/mueve/edita estructura, eso sigue Concierge-only.
//
// Gate 0 (2026-07-31): el trabajo del usuario NO es "ver 57 departamentos", es vaciar
// la cola de los que HOY puede cubrir. Por eso los pills segmentan por trabajo
// (asignable / asignado / bloqueado) y no por el dato crudo con/sin responsable: de 57
// deptos, 34 no tienen a nadie en su rama y abrirían un selector vacío.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users2, Loader2, UserCheck, ChevronDown, Building2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { useToast } from '@/components/ui/toast-system';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import DepartmentResponsableSelect, {
  type SelectedResponsable,
} from '@/components/admin/DepartmentResponsableSelect';

interface DepartmentRow {
  id: string;
  displayName: string;
  level: number;
  parentId: string | null;
  standardCategory: string | null;
  responsableId: string | null;
  responsable: { id: string; fullName: string; position: string | null } | null;
  candidateCount: number;
}

type Filtro = 'porAsignar' | 'asignados' | 'sinCandidatos';

const FILTRO_LABEL: Record<Filtro, string> = {
  porAsignar: 'Por asignar',
  asignados: 'Asignados',
  sinCandidatos: 'Sin candidatos',
};

// Estilos de pill del Rail canónico (src/components/evaluator/cinema/Rail.tsx:10-27).
// El color distingue naturaleza de la cola, NO severidad: cyan = trabajo pendiente,
// emerald = resuelto, slate = fuera del alcance del usuario en esta pantalla.
const FILTRO_STYLES: Record<Filtro, { active: string; inactive: string }> = {
  porAsignar: {
    active: 'bg-cyan-400 text-slate-950 shadow-[0_2px_10px_rgba(34,211,238,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700',
  },
  asignados: {
    active: 'bg-emerald-400 text-slate-950 shadow-[0_2px_10px_rgba(16,185,129,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700',
  },
  sinCandidatos: {
    active: 'bg-slate-400 text-slate-950 shadow-[0_2px_10px_rgba(148,163,184,0.25)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700',
  },
};

const FILTRO_ORDER: Filtro[] = ['porAsignar', 'asignados', 'sinCandidatos'];

function clasificar(d: DepartmentRow): Filtro {
  if (d.responsableId) return 'asignados';
  return d.candidateCount > 0 ? 'porAsignar' : 'sinCandidatos';
}

export default function ResponsablesPage() {
  const { success, error } = useToast();
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('porAsignar');
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  useEffect(() => {
    const user = getCurrentUser();
    setRole((user as any)?.userRole ?? user?.role ?? null);
  }, []);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null;

  const loadDepartments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/departments?include=responsable', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setDepartments(json.departments ?? []);
      } else {
        error(json.error || 'No se pudo cargar la estructura organizacional.', 'Error');
      }
    } catch {
      error('No se pudo cargar la estructura organizacional.', 'Error');
    } finally {
      setLoading(false);
    }
  }, [token, error]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const conteos = useMemo(
    () => ({
      porAsignar: departments.filter((d) => clasificar(d) === 'porAsignar').length,
      asignados: departments.filter((d) => clasificar(d) === 'asignados').length,
      sinCandidatos: departments.filter((d) => clasificar(d) === 'sinCandidatos').length,
    }),
    [departments]
  );

  // Grupos = gerencia (nivel ≤2) + sus hijos. La gerencia es una fila más dentro de su
  // propio grupo: también puede tener responsable.
  const grupos = useMemo(() => {
    const visibles = departments.filter((d) => clasificar(d) === filtro);
    const visiblesIds = new Set(visibles.map((d) => d.id));

    const gerencias = departments.filter((d) => d.level <= 2);
    const armados = gerencias
      .map((g) => ({
        id: g.id,
        titulo: g.displayName,
        filas: [g, ...departments.filter((d) => d.parentId === g.id)].filter((d) =>
          visiblesIds.has(d.id)
        ),
      }))
      .filter((g) => g.filas.length > 0);

    const huerfanas = visibles.filter(
      (d) => d.level > 2 && (!d.parentId || !gerencias.some((g) => g.id === d.parentId))
    );
    if (huerfanas.length > 0) {
      armados.push({ id: '__sin_gerencia__', titulo: 'Sin gerencia asignada', filas: huerfanas });
    }

    return armados;
  }, [departments, filtro]);

  function toggle(id: string) {
    setAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleChange(dept: DepartmentRow, responsable: SelectedResponsable | null) {
    if (!token) return;
    setSavingId(dept.id);
    try {
      const res = await fetch(`/api/departments/${dept.id}/responsable`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ responsableId: responsable?.id ?? null }),
      });
      const json = await res.json();

      if (!res.ok) {
        error(json.error || 'No se pudo guardar el responsable.', 'Error');
        return;
      }

      if (responsable) {
        success(`Responsable de "${dept.displayName}" actualizado`, '¡Éxito!');
      } else {
        success(`"${dept.displayName}" quedó sin responsable`, 'Actualizado');
      }
      await loadDepartments();
    } catch {
      error('No se pudo guardar el responsable. Intenta nuevamente.', 'Error');
    } finally {
      setSavingId(null);
    }
  }

  // Gate de UI. La API vuelve a validar: esto solo evita mostrar algo inoperable.
  if (role && !hasPermission(role, 'departments:responsable:manage')) {
    return (
      <div className="fhr-bg-main min-h-screen px-4 py-6 md:px-8 md:py-10">
        <div className="max-w-5xl mx-auto">
          <FHREmptyState
            type="requires"
            title="Sección restringida"
            description="El mantenimiento de responsables está reservado a la administración de la cuenta."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fhr-bg-main min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
              <Users2 className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="fhr-hero-title text-2xl md:text-3xl font-extralight text-white">
              Responsables por{' '}
              <span className="fhr-title-gradient">departamento</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-light leading-relaxed max-w-2xl">
            Quien figure acá recibe los planes de acción y avisos de su equipo. Sin
            responsable asignado, esos avisos llegan al administrador de la cuenta.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[280px]">
            <div className="text-center space-y-3">
              <Loader2 className="h-7 w-7 animate-spin mx-auto text-cyan-400" />
              <p className="text-slate-400 text-sm font-light">Cargando estructura…</p>
            </div>
          </div>
        ) : departments.length === 0 ? (
          <FHREmptyState
            type="pending"
            title="Estructura no configurada"
            description="Todavía no hay departamentos cargados en tu cuenta. La estructura organizacional se define durante la puesta en marcha."
            insight="Escribinos si necesitás ajustarla."
          />
        ) : (
          <>
            {/* Pills de cola de trabajo */}
            <div className="flex gap-2 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {FILTRO_ORDER.map((f) => {
                const activo = filtro === f;
                const styles = FILTRO_STYLES[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px] ${
                      activo ? styles.active : styles.inactive
                    }`}
                  >
                    {FILTRO_LABEL[f]} {conteos[f]}
                  </button>
                );
              })}
            </div>

            {/* Contenido del filtro activo */}
            {grupos.length === 0 ? (
              <FHREmptyState
                type={filtro === 'porAsignar' ? 'clear' : 'pending'}
                title={
                  filtro === 'porAsignar'
                    ? 'No queda nada por asignar'
                    : `Sin unidades en "${FILTRO_LABEL[filtro]}"`
                }
                description={
                  filtro === 'porAsignar'
                    ? 'Todas las unidades que hoy tienen personas en su línea jerárquica ya tienen responsable.'
                    : 'No hay unidades en esta categoría.'
                }
              />
            ) : (
              <div className="space-y-4">
                {filtro === 'sinCandidatos' && (
                  <p className="text-xs text-slate-500 font-light leading-relaxed max-w-2xl">
                    Estas unidades no tienen personas cargadas ni en sí mismas, ni en su
                    gerencia, ni en las que dependen de ellas. El responsable debe pertenecer
                    a esa línea jerárquica, así que todavía no hay a quién asignar.
                  </p>
                )}

                {grupos.map((g) => (
                  <GrupoCard
                    key={g.id}
                    titulo={g.titulo}
                    filas={g.filas}
                    abierto={abiertos.has(g.id)}
                    onToggle={() => toggle(g.id)}
                    filtro={filtro}
                    savingId={savingId}
                    onChange={handleChange}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Grupo colapsable por gerencia ──
function GrupoCard({
  titulo,
  filas,
  abierto,
  onToggle,
  filtro,
  savingId,
  onChange,
}: {
  titulo: string;
  filas: DepartmentRow[];
  abierto: boolean;
  onToggle: () => void;
  filtro: Filtro;
  savingId: string | null;
  onChange: (d: DepartmentRow, r: SelectedResponsable | null) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm">
      {/* Línea Tesla */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
          opacity: 0.7,
        }}
      />

      <button
        onClick={onToggle}
        aria-expanded={abierto}
        className="w-full min-h-[44px] px-4 py-4 md:px-6 md:py-5 flex items-center gap-3 text-left transition-colors hover:bg-slate-800/30"
      >
        <Building2 className="h-4 w-4 text-cyan-400/70 flex-shrink-0" />
        <span className="flex-1 min-w-0 truncate text-white font-light text-base">
          {titulo}
        </span>
        <span className="text-[11px] text-slate-500 font-light flex-shrink-0">
          {filas.length}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 flex-shrink-0 transition-transform ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {abierto && (
        <div className="px-4 pb-5 md:px-6 md:pb-6 space-y-5 border-t border-slate-800/40 pt-5">
          {filas.map((d) => (
            <DeptRow
              key={d.id}
              dept={d}
              filtro={filtro}
              savingId={savingId}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Fila: nombre + responsable actual + selector ──
function DeptRow({
  dept,
  filtro,
  savingId,
  onChange,
}: {
  dept: DepartmentRow;
  filtro: Filtro;
  savingId: string | null;
  onChange: (d: DepartmentRow, r: SelectedResponsable | null) => void;
}) {
  const guardando = savingId === dept.id;
  const bloqueado = filtro === 'sinCandidatos';

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="min-w-0 md:flex-1">
        <p className="text-slate-300 font-light text-sm truncate">{dept.displayName}</p>
        <p className="text-[11px] text-slate-500 font-light mt-0.5 flex items-center gap-1.5">
          {dept.responsable ? (
            <>
              <UserCheck className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {dept.responsable.fullName}
                {dept.responsable.position ? ` · ${dept.responsable.position}` : ''}
              </span>
            </>
          ) : bloqueado ? (
            <span className="text-slate-600">Sin personas en su línea jerárquica</span>
          ) : (
            <span className="text-slate-600">Sin responsable</span>
          )}
        </p>
      </div>

      {!bloqueado && (
        <div className="w-full md:w-72 md:flex-shrink-0">
          {guardando ? (
            <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              <span className="text-sm text-slate-400">Guardando…</span>
            </div>
          ) : (
            <DepartmentResponsableSelect
              forDepartmentId={dept.id}
              value={dept.responsableId}
              currentName={dept.responsable?.fullName ?? null}
              onChange={(r) => onChange(dept, r)}
            />
          )}
        </div>
      )}
    </div>
  );
}
