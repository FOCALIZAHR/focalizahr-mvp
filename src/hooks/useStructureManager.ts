// src/hooks/useStructureManager.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner'; // ✅ Usa sonner, no @/components/ui/use-toast

// Responsable del departamento (EX Clima Gate 1 — Department.responsableId → Employee.id)
export interface DepartmentResponsable {
  id: string;
  fullName: string;
  position: string | null;
}

interface Department {
  id: string;
  displayName: string;
  parentId: string | null;
  unitType: 'gerencia' | 'departamento';
  level: number;
  standardCategory: string;
  isActive: boolean;
  participantCount: number;
  responsableId: string | null;
  responsable?: DepartmentResponsable | null;
  departments?: Department[];
  children: Department[];  // ✅ EL API LO DEVUELVE
}

interface StructureData {
  gerencias: Department[];
  orphanDepartments: Department[];
  totalGerencias: number;
  totalDepartments: number;
  companyName?: string;  // ✅ LO EXTRAEREMOS DE account.name
}

interface FormData {
  displayName: string;
  parentId: string | null;
  unitType: 'gerencia' | 'departamento';
  responsableId: string | null;
  // Nombre del responsable actual — solo para pintar el chip sin re-consultar la API
  responsableName: string | null;
}

export function useStructureManager(accountId: string) {
  // Estados principales
  const [structure, setStructure] = useState<StructureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Department | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    parentId: null,
    unitType: 'gerencia',
    responsableId: null,
    responsableName: null
  });

  // Obtener token para todas las llamadas
  const token = typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null;

  // Cargar estructura organizacional
  const loadStructure = useCallback(async () => {
    if (!token) {
      toast.error('Error de autenticación', {
        description: 'No se encontró token de sesión',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/accounts/${accountId}/structure`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar estructura');
      }

      const result = await response.json();
      if (result.success) {
        setStructure({
          ...result.data,
          companyName: result.data.account?.name || 'Cliente'
        });
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error loading structure:', error);
      toast.error('Error', {
        description: 'No se pudo cargar la estructura organizacional',
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, token]);

  // Crear o actualizar unidad organizacional
  const handleSave = useCallback(async () => {
    if (!token) {
      toast.error('Error de autenticación', {
        description: 'No se encontró token de sesión'
      });
      return;
    }

    if (!formData.displayName.trim()) {
      toast.error('Error de validación', {
        description: 'El nombre es requerido'
      });
      return;
    }

    setSaving(true);
    try {
      const isUpdate = !!editingUnit;
      const url = isUpdate
        ? `/api/admin/accounts/${accountId}/structure/${editingUnit.id}`
        : `/api/admin/accounts/${accountId}/structure`;
      
      const method = isUpdate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          parentId: formData.parentId,
          unitType: formData.unitType,
          // Solo en edición: el POST de creación no acepta responsableId (se asigna
          // editando la unidad, que es el flujo real del concierge).
          ...(isUpdate && { responsableId: formData.responsableId })
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar');
      }

      toast.success('Éxito', {
        description: result.message || 
          `${formData.unitType === 'gerencia' ? 'Gerencia' : 'Departamento'} 
          ${isUpdate ? 'actualizado' : 'creado'} exitosamente`
      });

      // Recargar estructura
      await loadStructure();
      
      // Cerrar modal y limpiar formulario
      setIsModalOpen(false);
      setEditingUnit(null);
      setFormData({
        displayName: '',
        parentId: null,
        unitType: 'gerencia',
        responsableId: null,
        responsableName: null
      });

    } catch (error) {
      console.error('Error saving unit:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al guardar'
      });
    } finally {
      setSaving(false);
    }
  }, [accountId, editingUnit, formData, token, loadStructure]);

  // Activar/desactivar unidad organizacional
  const handleToggleActive = useCallback(async (unitId: string, currentStatus: boolean) => {
    if (!token) {
      toast.error('Error de autenticación', {
        description: 'No se encontró token de sesión'
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/accounts/${accountId}/structure/${unitId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            isActive: !currentStatus
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cambiar estado');
      }

      toast.success('Éxito', {
        description: result.message
      });

      // Recargar estructura
      await loadStructure();

    } catch (error) {
      console.error('Error toggling unit status:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al cambiar estado'
      });
    }
  }, [accountId, token, loadStructure]);

  // Abrir modal para crear nueva unidad
  const handleOpenCreate = useCallback((type: 'gerencia' | 'departamento', parentId?: string) => {
    setEditingUnit(null);
    setFormData({
      displayName: '',
      parentId: parentId || null,
      unitType: type,
      responsableId: null,
      responsableName: null
    });
    setIsModalOpen(true);
  }, []);

  // Abrir modal para editar unidad existente
  const handleOpenEdit = useCallback((unit: Department) => {
    setEditingUnit(unit);
    setFormData({
      displayName: unit.displayName,
      parentId: unit.parentId,
      unitType: unit.unitType,
      responsableId: unit.responsableId ?? null,
      responsableName: unit.responsable?.fullName ?? null
    });
    setIsModalOpen(true);
  }, []);

  // Actualizar campo del formulario
  const updateFormField = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Seleccionar/desasignar el responsable del departamento (id + nombre van juntos)
  const updateResponsable = useCallback(
    (responsable: DepartmentResponsable | null) => {
      setFormData(prev => ({
        ...prev,
        responsableId: responsable?.id ?? null,
        responsableName: responsable?.fullName ?? null
      }));
    },
    []
  );

  // Función para crear Gerencia General
  const handleCreateGeneralManager = useCallback(async () => {
    if (!token) {
      toast.error('Error de autenticación');
      return;
    }
    
    try {
      console.log('🟢 Ejecutando handleCreateGeneralManager');
      const response = await fetch(
        `/api/admin/accounts/${accountId}/structure/apply-general-manager`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Gerencia General creada exitosamente');
        await loadStructure();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear Gerencia General');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear Gerencia General');
    }
  }, [accountId, token, loadStructure]);

  // Función para aplicar estructura estándar
  const handleApplyStandardTemplate = useCallback(async () => {
    if (!token) {
      toast.error('Error de autenticación');
      return;
    }
    
    try {
      console.log('🟪 Ejecutando handleApplyStandardTemplate');
      const response = await fetch(
        `/api/admin/accounts/${accountId}/structure/apply-standard-template`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Estructura estándar aplicada exitosamente');
        await loadStructure();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al aplicar estructura estándar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al aplicar estructura estándar');
    }
  }, [accountId, token, loadStructure]);

  // Cargar estructura al montar el componente
  useEffect(() => {
    if (accountId) {
      loadStructure();
    }
  }, [accountId, loadStructure]);

  return {
    // Estados
    structure,
    loading,
    saving,
    editingUnit,
    isModalOpen,
    formData,
    
    // Funciones
    loadStructure,
    handleSave,
    handleToggleActive,
    handleOpenCreate,
    handleOpenEdit,
    updateFormField,
    updateResponsable,
    setIsModalOpen,
    handleCreateGeneralManager,      // ← AGREGAR ESTA LÍNEA
    handleApplyStandardTemplate,     // ← AGREGAR ESTA LÍNEA
    fetchStructure: loadStructure,    // ← AGREGAR ESTA LÍNEA
  };
}