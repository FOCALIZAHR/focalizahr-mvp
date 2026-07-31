'use client';

// src/app/dashboard/organizacion/responsables/page.tsx
// Mantenimiento del responsable de cada departamento, CARA AL CLIENTE.
//
// Contraparte de /dashboard/admin/accounts/[id]/structure (concierge). Mismo backend,
// dos superficies — patrón de Métricas Departamentales. Acá NO hay AccountSelector: la
// cuenta sale del JWT. Tampoco se crea/mueve/edita estructura, eso sigue Concierge-only.

import { useState, useEffect, useCallback } from 'react';
import { Users2, Loader2, UserCheck } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import DepartmentResponsableSelect, {
  type SelectedResponsable,
} from '@/components/admin/DepartmentResponsableSelect';
import { toast } from 'sonner';

interface DepartmentRow {
  id: string;
  displayName: string;
  level: number;
  parentId: string | null;
  standardCategory: string | null;
  responsableId: string | null;
  responsable: { id: string; fullName: string; position: string | null } | null;
}

export default function ResponsablesPage() {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

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
        toast.error('Error', { description: json.error || 'No se pudo cargar la estructura' });
      }
    } catch {
      toast.error('Error', { description: 'No se pudo cargar la estructura' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  async function handleChange(deptId: string, responsable: SelectedResponsable | null) {
    if (!token) return;
    setSavingId(deptId);
    try {
      const res = await fetch(`/api/departments/${deptId}/responsable`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ responsableId: responsable?.id ?? null }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error('No se pudo guardar', { description: json.error });
        return;
      }

      toast.success(responsable ? 'Responsable asignado' : 'Responsable desasignado', {
        description: responsable?.fullName,
      });
      await loadDepartments();
    } catch {
      toast.error('Error', { description: 'No se pudo guardar el responsable' });
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

  const gerencias = departments.filter((d) => d.level <= 2);
  const hijosDe = (id: string) => departments.filter((d) => d.parentId === id);
  const huerfanos = departments.filter((d) => d.level > 2 && !d.parentId);

  const sinResponsable = departments.filter((d) => !d.responsableId).length;

  return (
    <div className="fhr-bg-main min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
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
          {!loading && departments.length > 0 && sinResponsable > 0 && (
            <p className="text-[11px] text-slate-500 font-light mt-2">
              {sinResponsable} de {departments.length} unidades sin responsable
            </p>
          )}
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
          <div className="space-y-4">
            {gerencias.map((ger) => (
              <DeptCard
                key={ger.id}
                dept={ger}
                hijos={hijosDe(ger.id)}
                savingId={savingId}
                onChange={handleChange}
              />
            ))}

            {huerfanos.length > 0 && (
              <div className="space-y-4 pt-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  Sin gerencia asignada
                </p>
                {huerfanos.map((d) => (
                  <DeptCard
                    key={d.id}
                    dept={d}
                    hijos={[]}
                    savingId={savingId}
                    onChange={handleChange}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card de unidad + sus departamentos hijos ──
function DeptCard({
  dept,
  hijos,
  savingId,
  onChange,
}: {
  dept: DepartmentRow;
  hijos: DepartmentRow[];
  savingId: string | null;
  onChange: (id: string, r: SelectedResponsable | null) => void;
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

      <div className="px-4 py-5 md:px-6 md:py-6">
        <DeptRow dept={dept} savingId={savingId} onChange={onChange} destacado />

        {hijos.length > 0 && (
          <div className="mt-5 space-y-5 border-t border-slate-800/40 pt-5">
            {hijos.map((h) => (
              <DeptRow key={h.id} dept={h} savingId={savingId} onChange={onChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fila: nombre + responsable actual + selector ──
function DeptRow({
  dept,
  savingId,
  onChange,
  destacado = false,
}: {
  dept: DepartmentRow;
  savingId: string | null;
  onChange: (id: string, r: SelectedResponsable | null) => void;
  destacado?: boolean;
}) {
  const guardando = savingId === dept.id;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="min-w-0 md:flex-1">
        <p
          className={
            destacado
              ? 'text-white font-light text-base truncate'
              : 'text-slate-300 font-light text-sm truncate'
          }
        >
          {dept.displayName}
        </p>
        <p className="text-[11px] text-slate-500 font-light mt-0.5 flex items-center gap-1.5">
          {dept.responsable ? (
            <>
              <UserCheck className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {dept.responsable.fullName}
                {dept.responsable.position ? ` · ${dept.responsable.position}` : ''}
              </span>
            </>
          ) : (
            <span className="text-slate-600">Sin responsable</span>
          )}
        </p>
      </div>

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
            onChange={(r) => onChange(dept.id, r)}
          />
        )}
      </div>
    </div>
  );
}
