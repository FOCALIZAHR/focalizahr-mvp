// src/app/dashboard/admin/users/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Search,
  Users,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Shield,
  Edit2,
  UserX,
  UserCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getCurrentUser, isAdmin as checkIsAdmin } from '@/lib/auth';
import AccountSelector from '@/components/admin/AccountSelector';
import { useUsersManagement, type UserData } from '@/hooks/useUsersManagement';
import { useToast } from '@/components/ui/toast-system';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import { ALL_ROLES } from '@/lib/services/AuthorizationService';

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const ROLE_COLORS: Record<string, string> = {
  FOCALIZAHR_ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ACCOUNT_OWNER: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  CEO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  HR_ADMIN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  HR_MANAGER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  HR_OPERATOR: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  AREA_MANAGER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  EVALUATOR: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  VIEWER: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  CLIENT: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const ROLE_LABELS: Record<string, string> = {
  FOCALIZAHR_ADMIN: 'Admin Sistema',
  ACCOUNT_OWNER: 'Dueño Cuenta',
  CEO: 'CEO',
  HR_ADMIN: 'HR Admin',
  HR_MANAGER: 'HR Manager',
  HR_OPERATOR: 'HR Operador',
  AREA_MANAGER: 'Gerente Área',
  EVALUATOR: 'Evaluador',
  VIEWER: 'Viewer',
  CLIENT: 'Cliente',
};

// Roles filtrables: todos excepto FOCALIZAHR_ADMIN y CLIENT (legacy)
const FILTERABLE_ROLES = ALL_ROLES.filter(
  (r) => r !== 'FOCALIZAHR_ADMIN' && r !== 'CLIENT'
);

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function UsersListPage() {
  const router = useRouter();
  const toast = useToast();
  const [isFocalizaAdmin, setIsFocalizaAdmin] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedAccountName, setSelectedAccountName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // Edit modal state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    users,
    isLoading,
    error,
    pagination,
    fetchUsers,
    updateUser,
    toggleUserStatus,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
  } = useUsersManagement({ accountId: selectedAccountId || undefined });

  // Check admin role
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setIsFocalizaAdmin(checkIsAdmin(currentUser));
    }
  }, []);

  // Fetch users on mount and filter change
  useEffect(() => {
    fetchUsers({ page: 1 });
  }, [selectedAccountId, roleFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers({ page: 1, search: searchTerm });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close menu on outside click
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [openMenuId]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchUsers({ page: newPage });
    },
    [fetchUsers]
  );

  const handleToggleStatus = useCallback(
    async (user: UserData) => {
      const success = await toggleUserStatus(user.id, user.isActive);
      if (success) {
        toast.success(
          user.isActive ? 'Usuario desactivado' : 'Usuario reactivado'
        );
      } else {
        toast.error('Error al cambiar estado del usuario');
      }
      setOpenMenuId(null);
    },
    [toggleUserStatus, toast]
  );

  const handleOpenEdit = useCallback((user: UserData) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setOpenMenuId(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingUser) return;
    setIsUpdating(true);

    const payload: Record<string, string> = {};
    if (editName !== editingUser.name) payload.name = editName;
    if (editRole !== editingUser.role) payload.role = editRole;

    if (Object.keys(payload).length === 0) {
      setEditingUser(null);
      setIsUpdating(false);
      return;
    }

    const result = await updateUser(editingUser.id, payload);
    setIsUpdating(false);

    if (result) {
      toast.success('Usuario actualizado');
      setEditingUser(null);
    } else {
      toast.error('Error al actualizar usuario');
    }
  }, [editingUser, editName, editRole, updateUser, toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </button>
          <h1 className="text-2xl font-light text-white">
            <span className="fhr-title-gradient">Gestión de Usuarios</span>
          </h1>
          {selectedAccountName && (
            <p className="text-sm text-slate-400 mt-1">{selectedAccountName}</p>
          )}
        </div>

        <PrimaryButton
          icon={Plus}
          onClick={() =>
            router.push(
              `/dashboard/admin/users/new${selectedAccountId ? `?accountId=${selectedAccountId}` : ''}`
            )
          }
        >
          Nuevo Usuario
        </PrimaryButton>
      </div>

      {/* AccountSelector (solo FOCALIZAHR_ADMIN) */}
      {isFocalizaAdmin && (
        <div className="fhr-card p-4 relative z-30">
          <label className="text-xs text-slate-400 block mb-2">
            Seleccionar empresa
          </label>
          <AccountSelector
            value={selectedAccountId}
            onChange={(id, name) => {
              setSelectedAccountId(id);
              setSelectedAccountName(name);
            }}
          />
        </div>
      )}

      {/* Filtros */}
      <div className="fhr-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="fhr-input pl-10 w-full"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter || ''}
            onChange={(e) => setRoleFilter(e.target.value || null)}
            className="fhr-input min-w-[160px]"
          >
            <option value="">Todos los roles</option>
            {FILTERABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] || r}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="fhr-input min-w-[130px]"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="fhr-card overflow-visible">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="ml-3 text-slate-400">Cargando usuarios...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              {searchTerm || roleFilter || statusFilter
                ? 'No se encontraron usuarios con esos filtros'
                : isFocalizaAdmin && !selectedAccountId
                  ? 'Selecciona una empresa para ver sus usuarios'
                  : 'No hay usuarios registrados'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">
                      Nombre
                    </th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">
                      Email
                    </th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">
                      Rol
                    </th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">
                      Departamento
                    </th>
                    <th className="text-center text-xs text-slate-500 font-medium px-4 py-3">
                      Estado
                    </th>
                    <th className="text-right text-xs text-slate-500 font-medium px-4 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm text-white font-medium">
                          {u.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-400">{u.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                            ROLE_COLORS[u.role] || ROLE_COLORS.VIEWER
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-400">
                          {u.department?.displayName || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === u.id ? null : u.id
                              );
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === u.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                                  u.isActive
                                    ? 'text-red-400 hover:bg-red-500/10'
                                    : 'text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                              >
                                {u.isActive ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    Reactivar
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-800/50">
              {users.map((u) => (
                <div key={u.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium">{u.name}</span>
                    <div className="flex items-center gap-2">
                      {u.isActive ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === u.id ? null : u.id);
                        }}
                        className="p-1 rounded hover:bg-slate-700/50 text-slate-400"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{u.email}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                        ROLE_COLORS[u.role] || ROLE_COLORS.VIEWER
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                    {u.department?.displayName && (
                      <span className="text-xs text-slate-500">
                        {u.department.displayName}
                      </span>
                    )}
                  </div>

                  {/* Mobile menu */}
                  {openMenuId === u.id && (
                    <div className="flex gap-2 pt-2 border-t border-slate-800/50">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="flex-1 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`flex-1 px-3 py-1.5 text-xs rounded-lg flex items-center justify-center gap-1 transition-colors ${
                          u.isActive
                            ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                            : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="w-3 h-3" /> Desactivar
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3" /> Reactivar
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/50">
                <span className="text-xs text-slate-500">
                  {pagination.totalCount} usuario{pagination.totalCount !== 1 ? 's' : ''} total
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-400 px-2">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5"
            >
              <h3 className="text-lg font-medium text-white">Editar Usuario</h3>
              <p className="text-xs text-slate-500">{editingUser.email}</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="fhr-input w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">
                    Rol
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="fhr-input w-full"
                  >
                    {FILTERABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r] || r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="fhr-btn fhr-btn-ghost text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="fhr-btn fhr-btn-primary text-sm flex items-center gap-2"
                >
                  {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
