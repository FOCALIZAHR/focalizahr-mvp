// src/hooks/useUsersManagement.ts
// Hook compartido para gestión de usuarios multi-tenant
'use client';

import { useState, useCallback } from 'react';

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  department: {
    id: string;
    displayName: string;
    standardCategory?: string;
  } | null;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role: string;
  departmentId?: string;
  targetAccountId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: string;
  departmentId?: string | null;
  isActive?: boolean;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FetchFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: string;
  accountId?: string;
}

interface UseUsersManagementProps {
  accountId?: string;
}

export function useUsersManagement({ accountId }: UseUsersManagementProps = {}) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('focalizahr_token');
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }, []);

  // ============================================
  // FETCH USERS
  // ============================================
  const fetchUsers = useCallback(
    async (filters?: FetchFilters) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        const page = filters?.page || pagination.currentPage;
        const limit = filters?.limit || pagination.limit;
        const search = filters?.search ?? searchTerm;
        const role = filters?.role ?? roleFilter;
        const isActive = filters?.isActive ?? statusFilter;
        const effectiveAccountId = filters?.accountId || accountId;

        params.set('page', page.toString());
        params.set('limit', limit.toString());
        if (search) params.set('search', search);
        if (role) params.set('role', role);
        if (isActive !== null && isActive !== undefined) params.set('isActive', isActive);
        if (effectiveAccountId) params.set('accountId', effectiveAccountId);

        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al cargar usuarios');
        }

        const data = await response.json();
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [accountId, searchTerm, roleFilter, statusFilter, pagination.currentPage, pagination.limit, getAuthHeaders]
  );

  // ============================================
  // CREATE USER
  // ============================================
  const createUser = useCallback(
    async (payload: CreateUserPayload): Promise<UserData | null> => {
      setError(null);

      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al crear usuario');
        }

        return data.data as UserData;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        return null;
      }
    },
    [getAuthHeaders]
  );

  // ============================================
  // UPDATE USER
  // ============================================
  const updateUser = useCallback(
    async (userId: string, payload: UpdateUserPayload): Promise<UserData | null> => {
      setError(null);

      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al actualizar usuario');
        }

        // Actualizar la lista local
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...data.data } : u))
        );

        return data.data as UserData;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        return null;
      }
    },
    [getAuthHeaders]
  );

  // ============================================
  // TOGGLE USER STATUS
  // ============================================
  const toggleUserStatus = useCallback(
    async (userId: string, currentStatus: boolean): Promise<boolean> => {
      setError(null);

      try {
        if (currentStatus) {
          // Desactivar via DELETE
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al desactivar usuario');
          }

          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, isActive: false } : u))
          );
        } else {
          // Reactivar via PATCH
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ isActive: true }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al reactivar usuario');
          }

          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, isActive: true } : u))
          );
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        return false;
      }
    },
    [getAuthHeaders]
  );

  return {
    // Data
    users,
    isLoading,
    error,

    // Pagination
    pagination,

    // Actions
    fetchUsers,
    createUser,
    updateUser,
    toggleUserStatus,

    // Filters
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
  };
}
