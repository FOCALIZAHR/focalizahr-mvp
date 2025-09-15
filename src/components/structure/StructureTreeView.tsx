'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, 
  ChevronDown,
  Building2, 
  Users, 
  Layers,
  Edit2,
  Network,
  Briefcase
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Tipos
interface Department {
  id: string
  displayName: string
  standardCategory?: string
}

interface Gerencia {
  id: string
  displayName: string
  departments: Department[]
}

interface TreeViewProps {
  structure: {
    model: 'simple' | 'hierarchical'
    gerencias: Gerencia[]
  }
  editable?: boolean
  onEdit?: (nodeId: string, nodeType: 'gerencia' | 'department') => void
  className?: string
}

// Mapeo de categorías a colores
const CATEGORY_COLORS: Record<string, string> = {
  personas: 'bg-blue-100 text-blue-800 border-blue-200',
  comercial: 'bg-green-100 text-green-800 border-green-200',
  marketing: 'bg-purple-100 text-purple-800 border-purple-200',
  tecnologia: 'bg-orange-100 text-orange-800 border-orange-200',
  operaciones: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  finanzas: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  servicio: 'bg-pink-100 text-pink-800 border-pink-200',
  legal: 'bg-gray-100 text-gray-800 border-gray-200',
  sin_asignar: 'bg-red-100 text-red-800 border-red-200'
}

// Componente para un nodo de departamento
const DepartmentNode: React.FC<{
  department: Department
  level: number
  editable?: boolean
  onEdit?: () => void
}> = ({ department, level, editable, onEdit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 transition-colors",
        level > 0 && "ml-8"
      )}
    >
      <div className="flex items-center gap-3">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="font-medium text-sm">{department.displayName}</span>
        {department.standardCategory && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs border",
              CATEGORY_COLORS[department.standardCategory] || CATEGORY_COLORS.sin_asignar
            )}
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)'
            }}
          >
            {department.standardCategory}
          </Badge>
        )}
      </div>
      {editable && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
    </motion.div>
  )
}

// Componente para un nodo de gerencia
const GerenciaNode: React.FC<{
  gerencia: Gerencia
  editable?: boolean
  onEdit?: (nodeId: string, nodeType: 'gerencia' | 'department') => void
  isSimpleModel?: boolean
}> = ({ gerencia, editable, onEdit, isSimpleModel }) => {
  const [isExpanded, setIsExpanded] = useState(true)

  // No mostrar el nodo de gerencia si es modelo simple
  if (isSimpleModel) {
    return (
      <div className="space-y-1">
        {gerencia.departments.map(dept => (
          <DepartmentNode
            key={dept.id}
            department={dept}
            level={0}
            editable={editable}
            onEdit={() => onEdit?.(dept.id, 'department')}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group",
          "hover:shadow-md hover:border-primary/30 bg-white"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </motion.div>
          <Layers className="h-5 w-5 text-primary" />
          <span className="font-semibold">{gerencia.displayName}</span>
          <Badge variant="secondary" className="ml-2">
            {gerencia.departments.length} departamentos
          </Badge>
        </div>
        {editable && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(gerencia.id, 'gerencia')
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="ml-4 space-y-1 overflow-hidden"
          >
            {gerencia.departments.map(dept => (
              <DepartmentNode
                key={dept.id}
                department={dept}
                level={1}
                editable={editable}
                onEdit={() => onEdit?.(dept.id, 'department')}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Componente principal StructureTreeView
const StructureTreeView: React.FC<TreeViewProps> = ({ 
  structure, 
  editable = false, 
  onEdit,
  className 
}) => {
  const isSimpleModel = structure.model === 'simple'
  
  // Calcular estadísticas
  const totalDepartments = structure.gerencias.reduce(
    (acc, g) => acc + g.departments.length, 
    0
  )
  const totalGerencias = structure.gerencias.length

  // Agrupar departamentos por categoría para estadísticas
  const categoryStats = structure.gerencias.reduce((acc, gerencia) => {
    gerencia.departments.forEach(dept => {
      const category = dept.standardCategory || 'sin_asignar'
      acc[category] = (acc[category] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Network className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold text-lg">
              Estructura Organizacional
            </h3>
            <p className="text-sm text-muted-foreground">
              Modelo {isSimpleModel ? 'Simple' : 'Jerárquico'}
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          {!isSimpleModel && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span className="text-muted-foreground">
                {totalGerencias} gerencias
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-muted-foreground">
              {totalDepartments} departamentos
            </span>
          </div>
        </div>
      </div>

      {/* Distribución por categorías */}
      {Object.keys(categoryStats).length > 0 && (
        <div className="flex flex-wrap gap-2 pb-4 border-b">
          <span className="text-sm text-muted-foreground mr-2">
            Distribución:
          </span>
          {Object.entries(categoryStats).map(([category, count]) => (
            <Badge 
              key={category}
              variant="outline"
              className={cn(
                "text-xs",
                CATEGORY_COLORS[category] || CATEGORY_COLORS.sin_asignar
              )}
            >
              {category}: {count}
            </Badge>
          ))}
        </div>
      )}

      {/* Árbol de estructura */}
      <div className="space-y-3">
        {structure.gerencias.map(gerencia => (
          <GerenciaNode
            key={gerencia.id}
            gerencia={gerencia}
            editable={editable}
            onEdit={onEdit}
            isSimpleModel={isSimpleModel}
          />
        ))}
      </div>

      {/* Mensaje si está vacío */}
      {totalDepartments === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No hay departamentos definidos aún</p>
        </div>
      )}

      {/* Leyenda de categorías */}
      {totalDepartments > 0 && (
        <div className="pt-4 border-t border-slate-700">
          <p className="text-xs text-gray-400 mb-2">
            Categorías estándar del sistema:
          </p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {Object.keys(categoryStats).filter(cat => cat !== 'sin_asignar').map(category => (
              <div key={category} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]?.backgroundColor || '#374151'
                  }}
                />
                <span className="capitalize text-gray-400">{category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StructureTreeView