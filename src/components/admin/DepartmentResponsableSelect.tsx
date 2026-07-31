'use client';

// src/components/admin/DepartmentResponsableSelect.tsx
// Selector del responsable de un departamento (Department.responsableId → Employee.id).
// Uso: modal de edición de /dashboard/admin/accounts/[id]/structure (pantalla concierge).
//
// NOTA DE ESTILO — deuda consciente: esta pantalla es 100% legacy (professional-card,
// btn-gradient, Card/Input de shadcn, sonner directo). El componente iguala ese entorno
// a propósito; un widget con tokens .fhr-* aislado acá se vería roto. La migración
// completa de structure/page.tsx al design system canónico es una tarea aparte.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, UserCheck, Loader2 } from 'lucide-react';

interface EmployeeOption {
  id: string;
  fullName: string;
  position: string | null;
  standardJobLevel: string | null;
  department: { id: string; displayName: string } | null;
}

export interface SelectedResponsable {
  id: string;
  fullName: string;
  position: string | null;
}

interface DepartmentResponsableSelectProps {
  /** Cuenta CLIENTE cuya nómina se busca (params.id de la ruta, no la del admin) */
  accountId: string;
  /** responsableId actual del formulario (null = sin asignar) */
  value: string | null;
  /** Nombre del responsable actual, para pintar el chip sin re-consultar */
  currentName: string | null;
  onChange: (responsable: SelectedResponsable | null) => void;
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export default function DepartmentResponsableSelect({
  accountId,
  value,
  currentName,
  onChange,
}: DepartmentResponsableSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Búsqueda con debounce ──
  const searchEmployees = useCallback(
    async (q: string) => {
      if (q.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('focalizahr_token')
          : null;

      if (!token) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/accounts/${accountId}/employees?search=${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();

        if (response.ok && result.success) {
          setResults(result.data);
          setShowDropdown(true);
        } else {
          setResults([]);
          setShowDropdown(true);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [accountId]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchEmployees(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchEmployees]);

  // ── Cerrar dropdown al hacer click fuera ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(employee: EmployeeOption) {
    onChange({
      id: employee.id,
      fullName: employee.fullName,
      position: employee.position,
    });
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  }

  function handleClear() {
    onChange(null);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  }

  // ── Estado seleccionado: chip con opción de desasignar ──
  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-800 px-3 py-2">
        <UserCheck className="h-4 w-4 flex-shrink-0 text-cyan-400" />
        <span className="min-w-0 flex-1 truncate text-sm text-white">
          {currentName || 'Responsable asignado'}
        </span>
        <button
          type="button"
          onClick={handleClear}
          aria-label="Quitar responsable"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-gray-500 transition-colors hover:bg-slate-700/50 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ── Estado de búsqueda ──
  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          placeholder="Buscar por nombre o email..."
          className="w-full rounded-md border border-slate-700 bg-slate-800 py-2 pl-9 pr-9 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-400" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 max-h-[240px] w-full overflow-y-auto rounded-md border border-slate-700 bg-slate-900 shadow-2xl">
          {results.length === 0 && !isLoading ? (
            <p className="px-3 py-3 text-xs text-gray-500">
              Sin empleados que coincidan con &quot;{query}&quot;
            </p>
          ) : (
            results.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => handleSelect(emp)}
                className="flex w-full min-h-[44px] items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{emp.fullName}</p>
                  <p className="truncate text-[10px] text-gray-500">
                    {[emp.position, emp.department?.displayName]
                      .filter(Boolean)
                      .join(' · ') || 'Sin cargo'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {query.length > 0 && query.length < MIN_QUERY_LENGTH && (
        <p className="mt-1 text-[10px] text-gray-500">
          Escribe al menos {MIN_QUERY_LENGTH} caracteres
        </p>
      )}
    </div>
  );
}
