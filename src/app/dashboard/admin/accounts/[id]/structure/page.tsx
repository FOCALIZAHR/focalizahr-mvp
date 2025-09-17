// src/app/dashboard/admin/accounts/[id]/structure/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useStructureManager } from '@/hooks/useStructureManager';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Power,
  Users,
  Loader2,
  AlertCircle,
  Briefcase,
  BarChart3,
  Target,
  TrendingUp
} from 'lucide-react';

// SOLO usar estilos existentes
import '@/styles/focalizahr-design-system.css';
import '@/app/dashboard/dashboard.css';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function StructurePage() {
  const params = useParams();
  const accountId = params.id as string;

  const {
    structure,
    loading,
    saving,
    editingUnit,
    isModalOpen,
    formData,
    handleSave,
    handleToggleActive,
    handleOpenCreate,
    handleOpenEdit,
    updateFormField,
    setIsModalOpen
  } = useStructureManager(accountId);

  // Loading state con estilo FocalizaHR
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-400" />
            <p className="text-gray-400">Cargando estructura organizacional...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state con diseño premium
  if (!structure || (structure.gerencias.length === 0 && structure.orphanDepartments.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="container mx-auto max-w-7xl">
          <Card className="professional-card border-slate-700/50 bg-slate-800/50 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-gradient-to-br from-cyan-400/10 to-purple-400/10 rounded-2xl mb-4">
                <Building2 className="h-12 w-12 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Sin estructura organizacional</h3>
              <p className="text-gray-400 text-center mb-8 max-w-md">
                Comienza creando las gerencias principales de la organización para gestionar departamentos y visualizar métricas.
              </p>
              <Button 
                onClick={() => handleOpenCreate('gerencia')}
                className="btn-gradient"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Gerencia
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header con estilo dashboard FocalizaHR */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Estructura Organizacional
              </h1>
              <p className="text-gray-400 mt-2">
                Gestiona las gerencias y departamentos de la organización
              </p>
            </div>
            <Button 
              onClick={() => handleOpenCreate('gerencia')}
              className="btn-gradient"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Gerencia
            </Button>
          </div>

          {/* Métricas resumen al estilo dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="metric-card border-slate-700/50 bg-slate-800/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Gerencias</p>
                    <p className="text-2xl font-bold text-white">{structure.gerencias.length}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-cyan-400/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card border-slate-700/50 bg-slate-800/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Departamentos</p>
                    <p className="text-2xl font-bold text-white">
                      {structure.gerencias.reduce((acc, g) => acc + (g.children?.length || 0), 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-400/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card border-slate-700/50 bg-slate-800/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Sin Asignar</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {structure.orphanDepartments?.length || 0}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-400/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Gerencias con diseño FocalizaHR mejorado */}
        <div className="space-y-4">
          {structure.gerencias.map((gerencia) => (
            <Card 
              key={gerencia.id} 
              className="professional-card border-slate-700/50 bg-slate-800/50 backdrop-blur overflow-hidden hover:border-cyan-400/30 transition-all duration-300"
            >
              {/* Header de Gerencia con gradiente sutil */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-xl">
                      <Building2 className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {gerencia.displayName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className="bg-gradient-to-r from-cyan-400/10 to-purple-400/10 text-cyan-300 border-cyan-400/20"
                        >
                          {gerencia.standardCategory}
                        </Badge>
                        {gerencia.participantCount > 0 && (
                          <span className="text-xs text-gray-500">
                            {gerencia.participantCount} participantes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(gerencia)}
                      className="hover:bg-slate-700/50 text-gray-400 hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(gerencia.id, !gerencia.isActive)}
                      className="hover:bg-slate-700/50"
                    >
                      <Power className={`h-4 w-4 ${gerencia.isActive ? 'text-green-400' : 'text-gray-500'}`} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Departamentos con mejor jerarquía visual */}
              {gerencia.children && gerencia.children.length > 0 && (
                <div className="bg-slate-900/30">
                  {gerencia.children.map((dept, index) => (
                    <div 
                      key={dept.id} 
                      className={`px-6 py-3 hover:bg-slate-800/40 transition-colors ${
                        index !== gerencia.children.length - 1 ? 'border-b border-slate-700/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ChevronRight className="h-4 w-4 text-cyan-400/50" />
                          <div className="p-1.5 bg-slate-800/50 rounded-lg">
                            <Users className="h-4 w-4 text-purple-400/70" />
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white/90 font-medium">
                              {dept.displayName}
                            </span>
                            <Badge 
                              variant="outline" 
                              className="text-xs border-slate-600 text-gray-400"
                            >
                              {dept.standardCategory}
                            </Badge>
                            {dept.participantCount > 0 && (
                              <span className="text-xs text-gray-500">
                                {dept.participantCount} participantes
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(dept.id, !dept.isActive)}
                          className="h-7 w-7 hover:bg-slate-700/50"
                        >
                          <Power className={`h-3 w-3 ${dept.isActive ? 'text-green-400' : 'text-gray-500'}`} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón agregar departamento con hover effect */}
              <div className="p-3 bg-slate-900/20 border-t border-slate-700/30">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-500 hover:text-cyan-400 hover:bg-slate-800/50 transition-all"
                  onClick={() => handleOpenCreate('departamento', gerencia.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Departamento
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Departamentos Huérfanos con diseño de alerta premium */}
        {structure.orphanDepartments && structure.orphanDepartments.length > 0 && (
          <div className="mt-8">
            <Card className="professional-card border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-orange-900/10">
              <div className="p-4 border-b border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Departamentos sin Gerencia</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Requieren asignación a una gerencia para análisis completo
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {structure.orphanDepartments.map((dept) => (
                    <div 
                      key={dept.id} 
                      className="p-3 rounded-lg bg-slate-800/50 border border-yellow-500/20 hover:border-yellow-400/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-4 w-4 text-yellow-400/70" />
                          <span className="text-white/90">{dept.displayName}</span>
                          <Badge 
                            variant="outline" 
                            className="border-yellow-500/30 text-yellow-400"
                          >
                            {dept.standardCategory || 'sin_asignar'}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(dept)}
                          className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                        >
                          Asignar a Gerencia
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal con estilo FocalizaHR */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">
                {editingUnit ? 'Editar' : 'Crear'} {formData.unitType === 'gerencia' ? 'Gerencia' : 'Departamento'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Nombre</Label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => updateFormField('displayName', e.target.value)}
                  placeholder={`Nombre de la ${formData.unitType === 'gerencia' ? 'gerencia' : 'departamento'}`}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {formData.unitType === 'departamento' && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Gerencia Padre</Label>
                  <Select
                    value={formData.parentId || ''}
                    onValueChange={(value) => updateFormField('parentId', value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Seleccionar gerencia" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {structure.gerencias.map((ger) => (
                        <SelectItem key={ger.id} value={ger.id} className="text-white hover:bg-slate-800">
                          {ger.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                className="border-slate-700 text-gray-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving || !formData.displayName}
                className="btn-gradient"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingUnit ? 'Guardar Cambios' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}