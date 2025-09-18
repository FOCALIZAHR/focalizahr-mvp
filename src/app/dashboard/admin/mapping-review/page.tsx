// src/app/dashboard/admin/mapping-review/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  Building2, 
  Search, 
  Save,
  Loader2,
  CheckCircle2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

interface UnmappedDepartment {
  id: string;
  displayName: string;
  companyId: string;
  companyName: string;
  participantCount: number;
  level: number;
  unitType: string;
  createdAt: string;
}

interface MappingStats {
  totalUnmapped: number;
  companiesAffected: number;
  totalParticipants: number;
}

export default function MappingReviewPage() {
  // Estados
  const [departments, setDepartments] = useState<UnmappedDepartment[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<UnmappedDepartment[]>([]);
  const [stats, setStats] = useState<MappingStats>({
    totalUnmapped: 0,
    companiesAffected: 0,
    totalParticipants: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<{ [key: string]: string }>({});

  // Categorías válidas para el mapeo
  const validCategories = [
    { value: 'personas', label: 'Personas / RRHH' },
    { value: 'comercial', label: 'Comercial / Ventas' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'tecnologia', label: 'Tecnología / IT' },
    { value: 'operaciones', label: 'Operaciones' },
    { value: 'finanzas', label: 'Finanzas' },
    { value: 'servicio', label: 'Servicio al Cliente' },
    { value: 'legal', label: 'Legal / Compliance' }
  ];

  // Obtener token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('focalizahr_token');
    }
    return null;
  };

  // Cargar departamentos sin asignar
  const loadUnmappedDepartments = useCallback(async () => {
    const token = getToken();
    if (!token) {
      toast.error('No se encontró token de sesión');
      return;
    }

    setLoading(true);
    try {
      const url = companyFilter 
        ? `/api/admin/mapping-review?company=${encodeURIComponent(companyFilter)}`
        : '/api/admin/mapping-review';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar departamentos');
      }

      const result = await response.json();
      if (result.success) {
        setDepartments(result.data);
        setFilteredDepartments(result.data);
        setStats(result.stats);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error loading unmapped departments:', error);
      toast.error('Error al cargar departamentos sin asignar');
    } finally {
      setLoading(false);
    }
  }, [companyFilter]);

  // Guardar categoría de un departamento
  const handleSaveCategory = async (departmentId: string) => {
    const newCategory = selectedCategories[departmentId];
    if (!newCategory) {
      toast.error('Por favor selecciona una categoría');
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error('No se encontró token de sesión');
      return;
    }

    setSaving(departmentId);
    try {
      const response = await fetch('/api/admin/mapping-review', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          departmentId,
          newStandardCategory: newCategory
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar categoría');
      }

      toast.success(result.message || 'Categoría actualizada exitosamente');

      // Remover el departamento de la lista
      setDepartments(prev => prev.filter(d => d.id !== departmentId));
      setFilteredDepartments(prev => prev.filter(d => d.id !== departmentId));
      
      // Actualizar estadísticas
      setStats(prev => ({
        ...prev,
        totalUnmapped: prev.totalUnmapped - 1
      }));

      // Limpiar la selección
      setSelectedCategories(prev => {
        const newSelections = { ...prev };
        delete newSelections[departmentId];
        return newSelections;
      });

    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar categoría');
    } finally {
      setSaving(null);
    }
  };

  // Obtener sugerencia del DepartmentAdapter
  const getSuggestedCategory = (displayName: string): string | null => {
    try {
      return DepartmentAdapter.getGerenciaCategory(displayName);
    } catch (error) {
      return null;
    }
  };

  // Filtrar departamentos por empresa
  useEffect(() => {
    if (companyFilter) {
      const filtered = departments.filter(d => 
        d.companyName.toLowerCase().includes(companyFilter.toLowerCase())
      );
      setFilteredDepartments(filtered);
    } else {
      setFilteredDepartments(departments);
    }
  }, [companyFilter, departments]);

  // Cargar datos al montar
  useEffect(() => {
    loadUnmappedDepartments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-400" />
            <p className="text-gray-400">Cargando departamentos sin asignar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Revisión de Mapeo Concierge
          </h1>
          <p className="text-gray-400">
            Centro de triage para departamentos sin categoría asignada
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Sin Asignar</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUnmapped}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-cyan-500/20 rounded-xl">
                  <Building2 className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Empresas Afectadas</p>
                  <p className="text-2xl font-bold text-white">{stats.companiesAffected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Participantes Afectados</p>
                  <p className="text-2xl font-bold text-white">{stats.totalParticipants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtro */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="company-filter" className="text-gray-300 whitespace-nowrap">
                Filtrar por empresa:
              </Label>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="company-filter"
                  type="text"
                  placeholder="Buscar empresa..."
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-gray-500"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setCompanyFilter('')}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de departamentos */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Departamentos Pendientes de Mapeo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDepartments.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">
                  {companyFilter 
                    ? 'No hay departamentos sin asignar para esta empresa' 
                    : '¡Excelente! No hay departamentos pendientes de mapeo'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-gray-300">Departamento</th>
                      <th className="text-left py-3 px-4 text-gray-300">Empresa</th>
                      <th className="text-left py-3 px-4 text-gray-300">Participantes</th>
                      <th className="text-left py-3 px-4 text-gray-300">Sugerencia</th>
                      <th className="text-left py-3 px-4 text-gray-300">Asignar Categoría</th>
                      <th className="text-center py-3 px-4 text-gray-300">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((dept) => {
                      const suggestion = getSuggestedCategory(dept.displayName);
                      return (
                        <tr key={dept.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <span className="text-white font-medium">{dept.displayName}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-300">{dept.companyName}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                              {dept.participantCount} usuarios
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {suggestion ? (
                              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                                {validCategories.find(c => c.value === suggestion)?.label || suggestion}
                              </Badge>
                            ) : (
                              <span className="text-gray-500 italic">Sin sugerencia</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Select
                              value={selectedCategories[dept.id] || ''}
                              onValueChange={(value) => 
                                setSelectedCategories(prev => ({ ...prev, [dept.id]: value }))
                              }
                            >
                              <SelectTrigger className="w-[200px] bg-slate-900/50 border-slate-600 text-white">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {validCategories.map(cat => (
                                  <SelectItem 
                                    key={cat.value} 
                                    value={cat.value}
                                    className="text-white hover:bg-slate-700"
                                  >
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              size="sm"
                              onClick={() => handleSaveCategory(dept.id)}
                              disabled={!selectedCategories[dept.id] || saving === dept.id}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50"
                            >
                              {saving === dept.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-1" />
                                  Guardar
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}