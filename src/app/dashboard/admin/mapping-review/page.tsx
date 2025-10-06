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
  Users,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

// Interface para términos CSV individuales
interface UnmappedTerm {
  id: string;
  csvTerm: string;
  displayName: string;
  companyId: string;
  companyName: string;
  participantCount: number;
  suggestedCategory: string | null;
  confidence: 'high' | 'low';
  departmentId: string;
}

interface MappingStats {
  totalUnmappedTerms: number;
  companiesAffected: number;
  totalParticipants: number;
}

export default function MappingReviewPage() {
  // Estados
  const [terms, setTerms] = useState<UnmappedTerm[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<UnmappedTerm[]>([]);
  const [stats, setStats] = useState<MappingStats>({
    totalUnmappedTerms: 0,
    companiesAffected: 0,
    totalParticipants: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<{ [csvTerm: string]: string }>({});

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

  // Cargar términos CSV sin mapear
  const loadUnmappedTerms = useCallback(async () => {
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
        throw new Error('Error al cargar términos sin mapear');
      }

      const result = await response.json();
      if (result.success) {
        setTerms(result.data);
        setFilteredTerms(result.data);
        setStats(result.stats);
        
        // Auto-seleccionar sugerencias con alta confianza
        const autoSelected: { [key: string]: string } = {};
        result.data.forEach((term: UnmappedTerm) => {
          if (term.suggestedCategory && term.confidence === 'high') {
            autoSelected[term.csvTerm] = term.suggestedCategory;
          }
        });
        setSelectedCategories(autoSelected);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error loading unmapped terms:', error);
      toast.error('Error al cargar términos sin mapear');
    } finally {
      setLoading(false);
    }
  }, [companyFilter]);

  // Guardar mapeo creando departamento nuevo
  const handleSaveMapping = async (term: UnmappedTerm) => {
    const selectedCategory = selectedCategories[term.csvTerm];
    
    if (!selectedCategory) {
      toast.error('Por favor selecciona una categoría');
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error('No se encontró token de sesión');
      return;
    }

    setSaving(term.csvTerm);
    try {
      const response = await fetch('/api/admin/mapping-review', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          csvTerm: term.csvTerm,
          accountId: term.companyId,
          departmentId: term.departmentId,
          standardCategory: selectedCategory
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear departamento');
      }

      toast.success(
        result.message || 
        `Departamento "${term.csvTerm}" creado. ${result.data?.participantsReassigned || 0} participantes reasignados`
      );

      // Remover término procesado de la lista
      setTerms(prev => prev.filter(t => t.csvTerm !== term.csvTerm));
      setFilteredTerms(prev => prev.filter(t => t.csvTerm !== term.csvTerm));
      
      // Actualizar estadísticas
      setStats(prev => ({
        ...prev,
        totalUnmappedTerms: prev.totalUnmappedTerms - 1,
        totalParticipants: prev.totalParticipants - term.participantCount
      }));

      // Limpiar selección
      setSelectedCategories(prev => {
        const newSelections = { ...prev };
        delete newSelections[term.csvTerm];
        return newSelections;
      });

    } catch (error) {
      console.error('Error saving mapping:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar mapeo');
    } finally {
      setSaving(null);
    }
  };

  // Filtrar términos por empresa
  useEffect(() => {
    if (companyFilter) {
      const filtered = terms.filter(t => 
        t.companyName.toLowerCase().includes(companyFilter.toLowerCase())
      );
      setFilteredTerms(filtered);
    } else {
      setFilteredTerms(terms);
    }
  }, [companyFilter, terms]);

  // Cargar datos al montar
  useEffect(() => {
    loadUnmappedTerms();
  }, [loadUnmappedTerms]);

  // Detectar si todas las filas son de una sola empresa
  const isSingleCompany = new Set(filteredTerms.map(t => t.companyId)).size === 1;
  const singleCompanyName = isSingleCompany ? filteredTerms[0]?.companyName : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-400" />
            <p className="text-gray-400">Cargando términos sin mapear...</p>
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
            Términos CSV individuales pendientes de categorización
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
                  <p className="text-sm text-gray-400">Términos Sin Mapear</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUnmappedTerms}</p>
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

        {/* Tabla de términos CSV */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                Términos CSV Pendientes de Mapeo
              </CardTitle>
              {/* Mostrar empresa si es única */}
              {isSingleCompany && singleCompanyName && (
                <div className="text-sm text-gray-400">
                  Empresa: <span className="text-white font-medium">{singleCompanyName}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredTerms.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">
                  {companyFilter 
                    ? 'No hay términos sin mapear para esta empresa' 
                    : '¡Excelente! No hay términos pendientes de mapeo'}
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-3 text-gray-300 text-sm">Término CSV</th>
                        {!isSingleCompany && (
                          <th className="text-left py-3 px-2 text-gray-300 text-sm">Empresa</th>
                        )}
                        <th className="text-left py-3 px-2 text-gray-300 text-sm">Part.</th>
                        <th className="text-left py-3 px-2 text-gray-300 text-sm">Sugerencia</th>
                        <th className="text-left py-3 px-3 text-gray-300 text-sm">Asignar</th>
                        <th className="text-center py-3 px-2 text-gray-300 text-sm">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTerms.map((term) => (
                        <tr key={term.csvTerm} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                          <td className="py-3 px-3">
                            <span className="text-white font-medium text-sm">{term.csvTerm}</span>
                          </td>
                          {!isSingleCompany && (
                            <td className="py-3 px-2">
                              <span className="text-gray-300 text-sm">{term.companyName}</span>
                            </td>
                          )}
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                              {term.participantCount}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            {term.suggestedCategory ? (
                              <div className="flex items-center gap-1">
                                <Lightbulb className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs">
                                  {validCategories.find(c => c.value === term.suggestedCategory)?.label || term.suggestedCategory}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic text-xs">Sin sugerencia</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <Select
                              value={selectedCategories[term.csvTerm] || ''}
                              onValueChange={(value) => 
                                setSelectedCategories(prev => ({ ...prev, [term.csvTerm]: value }))
                              }
                            >
                              <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-600 text-white text-sm h-9">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {validCategories.map(cat => (
                                  <SelectItem 
                                    key={cat.value} 
                                    value={cat.value}
                                    className="text-white hover:bg-slate-700 text-sm"
                                  >
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Button
                              size="sm"
                              onClick={() => handleSaveMapping(term)}
                              disabled={!selectedCategories[term.csvTerm] || saving === term.csvTerm}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 text-xs h-9"
                            >
                              {saving === term.csvTerm ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Save className="h-3 w-3 mr-1" />
                                  Crear
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Indicador de scroll si hay overflow */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-800/90 to-transparent pointer-events-none" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}