import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  Edit,
  Save,
  X,
  Mail,
  Building2,
  MapPin,
  UserCheck,
  Download,
  Upload,
  BarChart3,
  Eye,
  Settings
} from 'lucide-react';

// Tipos para participantes (extendiendo sistema existente)
interface Participant {
  id: string;
  email: string;
  department?: string;
  position?: string;
  seniorityLevel?: 'junior' | 'mid' | 'senior' | 'executive';
  location?: string;
  status: 'pending' | 'validated' | 'error';
  errorMessage?: string;
}

interface ParticipantSummary {
  total: number;
  byDepartment: Record<string, number>;
  byPosition: Record<string, number>;
  bySeniority: Record<string, number>;
  byLocation: Record<string, number>;
  validEmails: number;
  duplicates: number;
  errors: number;
}

interface ParticipantPreviewProps {
  campaignId: string;
  participants: Participant[];
  summary: ParticipantSummary;
  onParticipantUpdate: (participant: Participant) => void;
  onParticipantRemove: (participantId: string) => void;
  onBulkAction: (action: string, participantIds: string[]) => void;
  isEditable: boolean;
  isLoading?: boolean;
}

const ParticipantPreview: React.FC<ParticipantPreviewProps> = ({
  campaignId,
  participants,
  summary,
  onParticipantUpdate,
  onParticipantRemove,
  onBulkAction,
  isEditable,
  isLoading = false
}) => {
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('summary');
  const [filterBy, setFilterBy] = useState<'all' | 'errors' | 'validated'>('all');

  // Filtrar participantes según el filtro seleccionado
  const filteredParticipants = participants.filter(participant => {
    if (filterBy === 'errors') return participant.status === 'error';
    if (filterBy === 'validated') return participant.status === 'validated';
    return true;
  });

  // Manejar selección de participantes
  const handleSelectParticipant = (participantId: string, selected: boolean) => {
    const newSelection = new Set(selectedParticipants);
    if (selected) {
      newSelection.add(participantId);
    } else {
      newSelection.delete(participantId);
    }
    setSelectedParticipants(newSelection);
  };

  // Seleccionar todos los participantes filtrados
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const newSelection = new Set(filteredParticipants.map(p => p.id));
      setSelectedParticipants(newSelection);
    } else {
      setSelectedParticipants(new Set());
    }
  };

  // Obtener configuración de estado
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        badge: { variant: 'secondary' as const, text: 'Pendiente' },
        icon: Info,
        color: 'text-gray-600'
      },
      validated: {
        badge: { variant: 'default' as const, text: 'Validado' },
        icon: CheckCircle,
        color: 'text-green-600'
      },
      error: {
        badge: { variant: 'destructive' as const, text: 'Error' },
        icon: AlertTriangle,
        color: 'text-red-600'
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className="space-y-6">
      
      {/* Header con Estadísticas Principales */}
      <Card className="professional-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Preview de Participantes
              </CardTitle>
              <CardDescription>
                {summary.total} participantes cargados por el equipo FocalizaHR
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'summary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('summary')}
                className="focus-ring"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Resumen
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="focus-ring"
              >
                <Eye className="h-4 w-4 mr-1" />
                Lista
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Métricas Principales */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{summary.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.validEmails}</div>
              <div className="text-sm text-muted-foreground">Válidos</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
              <div className="text-sm text-muted-foreground">Errores</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{summary.duplicates}</div>
              <div className="text-sm text-muted-foreground">Duplicados</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((summary.validEmails / summary.total) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Calidad</div>
            </div>
          </div>

          {/* Alertas de Validación */}
          {summary.errors > 0 && (
            <Alert className="border-destructive mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Se encontraron {summary.errors} participantes con errores. 
                Por favor revisa y corrige antes de activar la campaña.
              </AlertDescription>
            </Alert>
          )}

          {summary.duplicates > 0 && (
            <Alert className="border-yellow-500 bg-yellow-50 mb-4">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Se detectaron {summary.duplicates} emails duplicados que fueron eliminados automáticamente.
              </AlertDescription>
            </Alert>
          )}

          {summary.total < 5 && (
            <Alert className="border-destructive mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Se requieren al menos 5 participantes para activar la campaña. 
                Actualmente tienes {summary.total}.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Vista Resumen */}
      {viewMode === 'summary' && (
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Por Departamento */}
          <Card className="professional-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.byDepartment)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dept || 'Sin especificar'}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(count / Math.max(...Object.values(summary.byDepartment))) * 100}%` }}
                        />
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  </div>
                ))}
                {Object.keys(summary.byDepartment).length > 8 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{Object.keys(summary.byDepartment).length - 8} departamentos más
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Por Posición/Cargo */}
          <Card className="professional-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Por Posición
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.byPosition)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([position, count]) => (
                  <div key={position} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{position || 'Sin especificar'}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary rounded-full transition-all"
                          style={{ width: `${(count / Math.max(...Object.values(summary.byPosition))) * 100}%` }}
                        />
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Por Nivel de Seniority */}
          <Card className="professional-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Por Seniority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.bySeniority)
                  .sort(([,a], [,b]) => b - a)
                  .map(([level, count]) => {
                    const levelLabels = {
                      junior: 'Junior',
                      mid: 'Intermedio',
                      senior: 'Senior',
                      executive: 'Ejecutivo'
                    };
                    return (
                      <div key={level} className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {levelLabels[level as keyof typeof levelLabels] || level}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full transition-all"
                              style={{ width: `${(count / Math.max(...Object.values(summary.bySeniority))) * 100}%` }}
                            />
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Por Ubicación */}
          {Object.keys(summary.byLocation).length > 0 && (
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Por Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(summary.byLocation)
                    .sort(([,a], [,b]) => b - a)
                    .map(([location, count]) => (
                    <div key={location} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{location || 'Sin especificar'}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${(count / Math.max(...Object.values(summary.byLocation))) * 100}%` }}
                          />
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Vista Lista */}
      {viewMode === 'list' && (
        <Card className="professional-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Lista de Participantes</CardTitle>
              
              <div className="flex items-center gap-2">
                {/* Filtros */}
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="text-sm border rounded px-2 py-1 focus-ring"
                >
                  <option value="all">Todos ({participants.length})</option>
                  <option value="validated">Válidos ({summary.validEmails})</option>
                  <option value="errors">Con errores ({summary.errors})</option>
                </select>

                {/* Acciones en lote */}
                {selectedParticipants.size > 0 && isEditable && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onBulkAction('validate', Array.from(selectedParticipants))}
                      className="focus-ring"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Validar ({selectedParticipants.size})
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onBulkAction('remove', Array.from(selectedParticipants))}
                      className="focus-ring"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Header de la tabla */}
            <div className="border-b pb-2 mb-4">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                <div className="col-span-1">
                  {isEditable && (
                    <input
                      type="checkbox"
                      checked={selectedParticipants.size === filteredParticipants.length && filteredParticipants.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4"
                    />
                  )}
                </div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Departamento</div>
                <div className="col-span-2">Posición</div>
                <div className="col-span-1">Nivel</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-1">Acciones</div>
              </div>
            </div>

            {/* Lista de participantes */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredParticipants.map((participant) => {
                const statusConfig = getStatusConfig(participant.status);
                const StatusIcon = statusConfig.icon;
                const isEditing = editingParticipant === participant.id;

                return (
                  <div key={participant.id} className="grid grid-cols-12 gap-2 items-center py-2 px-1 hover:bg-muted/50 rounded text-sm">
                    <div className="col-span-1">
                      {isEditable && (
                        <input
                          type="checkbox"
                          checked={selectedParticipants.has(participant.id)}
                          onChange={(e) => handleSelectParticipant(participant.id, e.target.checked)}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                    
                    <div className="col-span-3">
                      {isEditing ? (
                        <Input
                          type="email"
                          defaultValue={participant.email}
                          className="text-xs h-8"
                          onBlur={(e) => {
                            onParticipantUpdate({
                              ...participant,
                              email: e.target.value
                            });
                            setEditingParticipant(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onParticipantUpdate({
                                ...participant,
                                email: e.currentTarget.value
                              });
                              setEditingParticipant(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingParticipant(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate" title={participant.email}>
                            {participant.email}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        {participant.department || '-'}
                      </span>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        {participant.position || '-'}
                      </span>
                    </div>
                    
                    <div className="col-span-1">
                      {participant.seniorityLevel && (
                        <Badge variant="outline" className="text-xs">
                          {participant.seniorityLevel}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                        <Badge variant={statusConfig.badge.variant} className="text-xs">
                          {statusConfig.badge.text}
                        </Badge>
                      </div>
                      {participant.errorMessage && (
                        <div className="text-xs text-destructive mt-1" title={participant.errorMessage}>
                          {participant.errorMessage.length > 30 
                            ? `${participant.errorMessage.substring(0, 30)}...` 
                            : participant.errorMessage
                          }
                        </div>
                      )}
                    </div>
                    
                    <div className="col-span-1">
                      {isEditable && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingParticipant(participant.id)}
                            className="h-6 w-6 p-0 focus-ring"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onParticipantRemove(participant.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive focus-ring"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredParticipants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay participantes que coincidan con el filtro seleccionado
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Acciones del Enfoque Concierge */}
      <Card className="professional-card border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gestión Concierge FocalizaHR
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Los datos han sido procesados y validados por nuestro equipo
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Simular descarga de datos procesados
                  const dataStr = JSON.stringify(participants, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `participantes-${campaignId}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="focus-ring"
              >
                <Download className="h-3 w-3 mr-1" />
                Exportar
              </Button>
              
              {isEditable && summary.errors > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('auto-fix', participants.filter(p => p.status === 'error').map(p => p.id))}
                  className="focus-ring"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Auto-Corregir
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de Soporte */}
      <Alert className="border-primary bg-primary/5">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>¿Necesitas modificaciones?</strong> Nuestro equipo puede ajustar la lista de participantes, 
          corregir datos o agregar participantes adicionales. Contáctanos en soporte@focalizahr.com
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ParticipantPreview;