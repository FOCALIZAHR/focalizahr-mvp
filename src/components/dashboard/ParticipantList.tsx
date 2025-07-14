// src/components/dashboard/ParticipantList.tsx
// PASO 3.5: Lista de Participantes - Usa API existente paginada

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Users, Search, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Participant {
  id: string;
  email: string;
  department?: string;
  position?: string;
  invitedAt: string;
  respondedAt?: string;
  completedAt?: string;
  status: 'pending' | 'responded' | 'completed';
  responseCount: number;
}

interface ParticipantListProps {
  campaignId: string;
}

export default function ParticipantList({ campaignId }: ParticipantListProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [limit] = useState(10);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Función para llamar a la API existente paginada
  const fetchParticipants = useCallback(async (page: number = 1, search?: string, status?: string, department?: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('focalizahr_token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Construir URL con parámetros
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      if (status && status !== 'all') {
        params.append('status', status);
      }
      if (department && department !== 'all') {
        params.append('department', department);
      }

      const response = await fetch(`/api/campaigns/${campaignId}/participants?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar participantes');
      }

      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.participants || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalParticipants(data.pagination?.total || 0);
        setCurrentPage(data.pagination?.page || 1);
      } else {
        throw new Error(data.error || 'Error al cargar participantes');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId, limit]);

  // Cargar participantes inicialmente
  useEffect(() => {
    fetchParticipants(1);
  }, [fetchParticipants]);

  // Handlers para filtros y búsqueda
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchParticipants(1, term, statusFilter, departmentFilter);
  }, [fetchParticipants, statusFilter, departmentFilter]);

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchParticipants(1, searchTerm, status, departmentFilter);
  }, [fetchParticipants, searchTerm, departmentFilter]);

  const handleDepartmentFilter = useCallback((department: string) => {
    setDepartmentFilter(department);
    setCurrentPage(1);
    fetchParticipants(1, searchTerm, statusFilter, department);
  }, [fetchParticipants, searchTerm, statusFilter]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    fetchParticipants(page, searchTerm, statusFilter, departmentFilter);
  }, [fetchParticipants, searchTerm, statusFilter, departmentFilter]);

  // Funciones de utilidad
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'responded': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <XCircle className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'responded': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-gray-50 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'responded': return 'En progreso';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  // Obtener departamentos únicos para filtro
  const uniqueDepartments = Array.from(
    new Set(participants.map(p => p.department).filter(Boolean))
  );

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button 
              onClick={() => fetchParticipants(currentPage)} 
              className="mt-4"
              size="sm"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Participantes
        </h2>
        <Badge variant="outline" className="text-sm">
          {totalParticipants} total
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por email o nombre..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="responded">En progreso</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>

              {uniqueDepartments.length > 0 && (
                <Select value={departmentFilter} onValueChange={handleDepartmentFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept || ''}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron participantes</p>
            </div>
          ) : (
            <>
              {/* Lista de participantes */}
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div 
                    key={participant.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(participant.status)}
                        <p className="font-medium text-gray-900">
                          {participant.email}
                        </p>
                        <Badge className={`${getStatusColor(participant.status)} text-xs`}>
                          {getStatusText(participant.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {participant.department && (
                          <span>{participant.department}</span>
                        )}
                        {participant.position && (
                          <span>• {participant.position}</span>
                        )}
                        <span>• Invitado: {new Date(participant.invitedAt).toLocaleDateString()}</span>
                        {participant.respondedAt && (
                          <span>• Respondió: {new Date(participant.respondedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {participant.responseCount} respuestas
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Página {currentPage} de {totalPages} ({totalParticipants} total)
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}