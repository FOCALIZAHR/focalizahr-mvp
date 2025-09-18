// src/app/dashboard/admin/accounts/[id]/structure/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
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
  FolderTree,
  ArrowLeft
} from 'lucide-react';

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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function StructurePage() {
  const params = useParams();
  const router = useRouter();
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
    setIsModalOpen,
    fetchStructure, // Necesitamos exponer esta función desde el hook
    handleCreateGeneralManager,    // ← AGREGAR SI NO ESTÁ
    handleApplyStandardTemplate,    // ← AGREGAR SI NO ESTÁ
  } = useStructureManager(accountId);

  // Debug: Verificar qué viene del hook
  useEffect(() => {
    console.log('🔍 Hook values check:');
    console.log('  - structure:', structure);
    console.log('  - handleCreateGeneralManager type:', typeof handleCreateGeneralManager);
    console.log('  - handleApplyStandardTemplate type:', typeof handleApplyStandardTemplate);
  }, [structure, handleCreateGeneralManager, handleApplyStandardTemplate]);


  // Estado de carga
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

  // NUEVO: Detectar si necesita configuración inicial
  const needsInitialSetup = !loading && 
    structure.gerencias.length === 0 && 
    structure.orphanDepartments && 
    structure.orphanDepartments.length > 0;

  // VISTA DE DECISIÓN PARA EL CONCIERGE
  if (needsInitialSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="container mx-auto max-w-5xl">
          {/* Header con navegación */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/admin/structures')}
              className="mb-4 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Torre de Control
            </Button>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Configuración Inicial de Estructura
            </h1>
            <p className="text-gray-400 mt-2">
              Empresa: {structure.companyName || 'Cliente'}
            </p>
          </div>

          {/* Info Card del Concierge */}
          <Card className="professional-card border-amber-500/30 bg-amber-950/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-amber-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-300 mb-2">
                    Protocolo Concierge - Acción Requerida
                  </h3>
                  <p className="text-amber-200/80 mb-3">
                    Se detectaron <span className="font-bold">{structure.orphanDepartments.length}</span> departamentos 
                    sin estructura definida.
                  </p>
                  <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-amber-200 mb-2 font-semibold">
                      📞 Antes de continuar, contacta al cliente:
                    </p>
                    <p className="text-sm text-gray-300 italic">
                      "Hemos recibido su lista de departamentos. Para asegurar que los análisis 
                      sean lo más precisos posible, ¿podría confirmarnos si estos reportan a 
                      gerencias específicas o si su estructura es plana, reportando a un único 
                      líder (como un Gerente General o Dueño)?"
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de departamentos detectados */}
          <Card className="professional-card border-slate-700/50 bg-slate-800/50 mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Departamentos Detectados ({structure.orphanDepartments.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {structure.orphanDepartments.map((dept: any) => (
                  <Badge 
                    key={dept.id}
                    className="bg-slate-700/50 text-slate-300 border-slate-600/50"
                  >
                    {dept.displayName}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tarjetas de decisión */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Opción A: Estructura Plana */}
            <Card 
              className="professional-card border-slate-700/50 bg-slate-800/50 hover:border-cyan-400/30 transition-all"
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-2xl flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Crear Gerencia General
                </h3>
                <p className="text-gray-400 mb-6">
                  Para empresas con estructura plana donde todos los departamentos 
                  reportan a un único líder (CEO, Gerente General, Dueño)
                </p>
                <div className="space-y-2 text-left text-sm text-gray-500">
                  <p>✓ Crea una única gerencia contenedora</p>
                  <p>✓ Asigna todos los departamentos automáticamente</p>
                  <p>✓ Ideal para PyMEs y startups</p>
                </div>
                <Button 
                  className="btn-gradient w-full mt-6"
                  onClick={() => {
                    console.log('🔵 Button clicked - Crear Gerencia General');
                    console.log('🔵 handleCreateGeneralManager exists?', typeof handleCreateGeneralManager);
                    console.log('🔵 accountId:', accountId);
                    if (handleCreateGeneralManager) {
                      handleCreateGeneralManager();
                    } else {
                      console.error('❌ handleCreateGeneralManager is undefined');
                    }
                  }}
                >
                  Aplicar Estructura Plana
                </Button>
              </CardContent>
            </Card>

            {/* Opción B: Estructura Jerárquica */}
            <Card 
              className="professional-card border-slate-700/50 bg-slate-800/50 hover:border-purple-400/30 transition-all"
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-2xl flex items-center justify-center">
                    <FolderTree className="h-10 w-10 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Aplicar Estructura Estándar
                </h3>
                <p className="text-gray-400 mb-6">
                  Para empresas con estructura jerárquica donde los departamentos 
                  reportan a diferentes gerencias especializadas
                </p>
                <div className="space-y-2 text-left text-sm text-gray-500">
                  <p>✓ Crea las 8 gerencias estándar</p>
                  <p>✓ Requiere personalización posterior</p>
                  <p>✓ Ideal para empresas medianas y grandes</p>
                </div>
                <div className="bg-purple-950/30 rounded-lg p-3 mt-4">
                  <p className="text-xs text-purple-300">
                    ⚠️ Recuerda: Después debes editar cada gerencia para 
                    usar la terminología exacta del cliente
                  </p>
                </div>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-full mt-6"
                  onClick={() => {
                    console.log('🟣 Button clicked - Aplicar Estructura Estándar');
                    console.log('🟣 handleApplyStandardTemplate exists?', typeof handleApplyStandardTemplate);
                    console.log('🟣 accountId:', accountId);
                    if (handleApplyStandardTemplate) {
                      handleApplyStandardTemplate();
                    } else {
                      console.error('❌ handleApplyStandardTemplate is undefined');
                    }
                  }}
                >
                  Aplicar 8 Gerencias
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // VISTA NORMAL: Árbol de estructura existente (tu código original mejorado)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/admin/structures')}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Torre de Control
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Estructura Organizacional
              </h1>
              <p className="text-gray-400 mt-2">
                {structure.companyName || 'Gestiona las gerencias y departamentos de la organización'}
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

          {/* Métricas resumen */}
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

        {/* Gerencias existentes */}
        <div className="space-y-4">
          {structure.gerencias.map((gerencia) => (
            <Card 
              key={gerencia.id} 
              className="professional-card border-slate-700/50 bg-slate-800/50 backdrop-blur overflow-hidden hover:border-cyan-400/30 transition-all duration-300"
            >
              {/* Header de Gerencia */}
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
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50">
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

              {/* Departamentos de la gerencia */}
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
                            <Badge variant="outline" className="text-xs border-slate-600 text-gray-400">
                              {dept.standardCategory}
                            </Badge>
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

              {/* Botón agregar departamento */}
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

        {/* Departamentos huérfanos si existen */}
        {structure.orphanDepartments && structure.orphanDepartments.length > 0 && (
          <div className="mt-8">
            <Card className="professional-card border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-orange-950/10">
              <div className="p-4 border-b border-amber-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Departamentos sin Gerencia</h3>
                    <p className="text-sm text-amber-200/60 mt-1">
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
                      className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 hover:bg-amber-950/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-4 w-4 text-amber-400/70" />
                          <span className="text-white/90">{dept.displayName}</span>
                          <Badge className="border-amber-500/30 text-amber-300 bg-amber-950/30">
                            {dept.standardCategory || 'sin_asignar'}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleOpenEdit(dept)}
                          className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
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

        {/* Modal de edición (tu código original) */}
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