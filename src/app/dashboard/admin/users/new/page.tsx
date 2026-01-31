// src/app/dashboard/admin/users/new/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { getCurrentUser, isAdmin as checkIsAdmin } from '@/lib/auth';
import AccountSelector from '@/components/admin/AccountSelector';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import { useToast } from '@/components/ui/toast-system';

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const AVAILABLE_ROLES = [
  { value: 'ACCOUNT_OWNER', label: 'Dueño de Cuenta', description: 'Acceso total a su empresa' },
  { value: 'CEO', label: 'CEO / Ejecutivo', description: 'Solo lectura - ve toda la empresa' },
  { value: 'HR_ADMIN', label: 'HR Admin', description: 'Gestiona campañas y participantes' },
  { value: 'HR_MANAGER', label: 'HR Manager', description: 'Jefe de RRHH' },
  { value: 'HR_OPERATOR', label: 'HR Operador', description: 'Ejecuta campañas' },
  { value: 'AREA_MANAGER', label: 'Gerente de Área', description: 'Ve solo su departamento' },
  { value: 'EVALUATOR', label: 'Evaluador', description: 'Portal de evaluaciones' },
  { value: 'VIEWER', label: 'Viewer', description: 'Solo lectura limitada' },
];

interface DepartmentOption {
  id: string;
  displayName: string;
  standardCategory: string;
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function NewUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [isFocalizaAdmin, setIsFocalizaAdmin] = useState(false);

  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState(
    searchParams.get('accountId') || ''
  );
  const [selectedAccountName, setSelectedAccountName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Departments
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);

  const { createUser } = useUsersManagement({
    accountId: selectedAccountId || undefined,
  });

  // Check admin role
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setIsFocalizaAdmin(checkIsAdmin(currentUser));
    }
  }, []);

  // Load departments when account changes
  useEffect(() => {
    const loadDepartments = async () => {
      // Only load when AREA_MANAGER is selected and we have an account context
      if (role !== 'AREA_MANAGER') return;

      setIsLoadingDepts(true);
      try {
        const token = localStorage.getItem('focalizahr_token');
        if (!token) return;

        const url = selectedAccountId
          ? `/api/departments?accountId=${selectedAccountId}`
          : '/api/departments';

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setDepartments(data.departments || []);
        }
      } catch (err) {
        console.error('Error loading departments:', err);
      } finally {
        setIsLoadingDepts(false);
      }
    };

    loadDepartments();
  }, [role, selectedAccountId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      // Validations
      if (!name.trim()) {
        setFormError('El nombre es requerido');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setFormError('Ingresa un email válido');
        return;
      }
      if (password.length < 8) {
        setFormError('La contraseña debe tener al menos 8 caracteres');
        return;
      }
      if (!role) {
        setFormError('Selecciona un rol');
        return;
      }
      if (role === 'AREA_MANAGER' && !departmentId) {
        setFormError('AREA_MANAGER requiere un departamento asignado');
        return;
      }
      if (isFocalizaAdmin && !selectedAccountId) {
        setFormError('Selecciona una empresa');
        return;
      }

      setIsSubmitting(true);

      const result = await createUser({
        email: email.trim(),
        name: name.trim(),
        password,
        role,
        departmentId: departmentId || undefined,
        targetAccountId: isFocalizaAdmin ? selectedAccountId : undefined,
      });

      setIsSubmitting(false);

      if (result) {
        toast.success(`Usuario ${result.name} creado exitosamente`);
        router.push('/dashboard/admin/users');
      } else {
        setFormError('Error al crear usuario. Verifica los datos e intenta de nuevo.');
      }
    },
    [
      name,
      email,
      password,
      role,
      departmentId,
      selectedAccountId,
      isFocalizaAdmin,
      createUser,
      router,
      toast,
    ]
  );

  const needsDepartment = role === 'AREA_MANAGER';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/dashboard/admin/users')}
          className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Usuarios
        </button>
        <h1 className="text-2xl font-light text-white">
          <span className="fhr-title-gradient">Nuevo Usuario</span>
        </h1>
      </div>

      {/* AccountSelector (solo FOCALIZAHR_ADMIN) */}
      {isFocalizaAdmin && (
        <div className="fhr-card p-5">
          <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Empresa
          </label>
          <AccountSelector
            value={selectedAccountId}
            onChange={(id, name) => {
              setSelectedAccountId(id);
              setSelectedAccountName(name);
              setDepartmentId('');
            }}
          />
          {selectedAccountName && (
            <p className="text-xs text-cyan-400 mt-2">{selectedAccountName}</p>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="fhr-card p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Nombre completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              className="fhr-input w-full"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Email corporativo *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@empresa.cl"
              className="fhr-input w-full"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Contraseña temporal *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="fhr-input w-full pr-10"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              El usuario deberá cambiarla en su primer login
            </p>
          </div>

          {/* Rol */}
          <div>
            <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Shield className="w-3.5 h-3.5" />
              Rol *
            </label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (e.target.value !== 'AREA_MANAGER') {
                  setDepartmentId('');
                }
              }}
              className="fhr-input w-full"
              required
            >
              <option value="">Seleccionar rol...</option>
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} — {r.description}
                </option>
              ))}
            </select>
          </div>

          {/* Department (solo AREA_MANAGER) */}
          {needsDepartment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Departamento asignado *
              </label>
              {isLoadingDepts ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando departamentos...
                </div>
              ) : departments.length === 0 ? (
                <p className="text-xs text-amber-400 py-2">
                  No hay departamentos disponibles para esta cuenta
                </p>
              ) : (
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="fhr-input w-full"
                  required={needsDepartment}
                >
                  <option value="">Seleccionar departamento...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.displayName} ({d.standardCategory})
                    </option>
                  ))}
                </select>
              )}
            </motion.div>
          )}

          {/* Error */}
          {formError && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {formError}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/admin/users')}
            className="fhr-btn fhr-btn-ghost"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="fhr-btn fhr-btn-primary flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear Usuario
          </button>
        </div>
      </form>
    </div>
  );
}
