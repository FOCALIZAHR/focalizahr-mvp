'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  Users, 
  Plus, 
  Trash2, 
  Check,
  Layers,
  Network
} from 'lucide-react'
import StructureTreeView from '@/components/structure/StructureTreeView'
import { cn } from '@/lib/utils'
import '@/styles/structure-wizard-premium.css'

// Tipos para el wizard
interface Gerencia {
  id: string
  displayName: string
  departments: Department[]
}

interface Department {
  id: string
  displayName: string
  // standardCategory se asigna solo en backend por DepartmentAdapter
}

interface WizardData {
  model: 'simple' | 'hierarchical'
  gerencias: Gerencia[]
}

// Mapeo de categorías estándar sugeridas basado en nombres
const CATEGORY_SUGGESTIONS: Record<string, string> = {
  'personas': 'personas',
  'rrhh': 'personas',
  'talento': 'personas',
  'comercial': 'comercial',
  'ventas': 'comercial',
  'sales': 'comercial',
  'marketing': 'marketing',
  'comunicaciones': 'marketing',
  'tecnología': 'tecnologia',
  'ti': 'tecnologia',
  'sistemas': 'tecnologia',
  'operaciones': 'operaciones',
  'logística': 'operaciones',
  'producción': 'operaciones',
  'finanzas': 'finanzas',
  'contabilidad': 'finanzas',
  'tesorería': 'finanzas',
  'servicio': 'servicio',
  'atención': 'servicio',
  'soporte': 'servicio',
  'legal': 'legal',
  'jurídico': 'legal',
  'compliance': 'legal'
}

// Componente Paso 1: Selector de Modelo
const ModelSelector = ({ data, onUpdate, onNext }: any) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Modelo Organizacional</h2>
        <p className="text-muted-foreground">
          Selecciona cómo está estructurada tu empresa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg",
            data.model === 'simple' && "ring-2 ring-primary"
          )}
          onClick={() => onUpdate({ ...data, model: 'simple' })}
        >
          <CardHeader>
            <Building2 className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Simple</CardTitle>
            <CardDescription>
              Solo departamentos, sin niveles jerárquicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Ideal para empresas pequeñas</li>
              <li>• Gestión directa</li>
              <li>• Estructura plana</li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg",
            data.model === 'hierarchical' && "ring-2 ring-primary"
          )}
          onClick={() => onUpdate({ ...data, model: 'hierarchical' })}
        >
          <CardHeader>
            <Network className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Jerárquico</CardTitle>
            <CardDescription>
              Gerencias que agrupan departamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Empresas medianas y grandes</li>
              <li>• Estructura multinivel</li>
              <li>• Reporting por gerencia</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={onNext}
          disabled={!data.model}
          className="min-w-[120px]"
        >
          Siguiente
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Componente Paso 2: Definir Gerencias
const GerenciaSetup = ({ data, onUpdate, onNext, onBack }: any) => {
  const [newGerenciaName, setNewGerenciaName] = useState('')

  const addGerencia = () => {
    if (!newGerenciaName.trim()) return

    const newGerencia: Gerencia = {
      id: `ger_${Date.now()}`,
      displayName: newGerenciaName.trim(),
      departments: []
    }

    onUpdate({
      ...data,
      gerencias: [...data.gerencias, newGerencia]
    })
    setNewGerenciaName('')
  }

  const removeGerencia = (id: string) => {
    onUpdate({
      ...data,
      gerencias: data.gerencias.filter((g: Gerencia) => g.id !== id)
    })
  }

  // Si es modelo simple, crear una gerencia única y saltar al siguiente paso
  useEffect(() => {
    if (data.model === 'simple' && data.gerencias.length === 0) {
      onUpdate({
        ...data,
        gerencias: [{
          id: 'ger_main',
          displayName: 'Organización',
          departments: []
        }]
      })
      onNext()
    }
  }, [data.model])

  if (data.model === 'simple') {
    return null // Este paso se salta para modelo simple
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Define tus Gerencias</h2>
        <p className="text-muted-foreground">
          Agrega las gerencias principales de tu organización
        </p>
      </div>

      {/* Input para agregar gerencia */}
      <div className="flex gap-2">
        <Input
          placeholder="Ej: Gerencia de Personas"
          value={newGerenciaName}
          onChange={(e) => setNewGerenciaName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addGerencia()}
          className="bg-slate-700/50 border-slate-600 text-gray-100 placeholder:text-gray-500 focus:border-cyan-400"
        />
        <Button 
          onClick={addGerencia}
          disabled={!newGerenciaName.trim()}
          className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de gerencias */}
      <div className="space-y-2">
        {data.gerencias.map((gerencia: Gerencia) => (
          <Card key={gerencia.id} className="bg-slate-700/50 border-slate-600">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-cyan-400" />
                <span className="font-medium text-gray-100">{gerencia.displayName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeGerencia(gerencia.id)}
                className="hover:bg-slate-600/50"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Validación */}
      {data.gerencias.length < 2 && (
        <p className="text-sm text-gray-400 text-center">
          Agrega al menos 2 gerencias para continuar
        </p>
      )}

      {/* Navegación */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="border-slate-600 text-gray-300 hover:bg-slate-700/50"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>
        <Button 
          onClick={onNext}
          disabled={data.gerencias.length < 2}
          className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
        >
          Siguiente
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Componente Paso 3: Asignar Departamentos
const DepartmentAssignment = ({ data, onUpdate, onNext, onBack }: any) => {
  const [activeGerencia, setActiveGerencia] = useState<string>(data.gerencias[0]?.id || '')
  const [newDeptName, setNewDeptName] = useState('')

  const suggestCategory = (name: string): string | undefined => {
    const normalized = name.toLowerCase()
    for (const [key, category] of Object.entries(CATEGORY_SUGGESTIONS)) {
      if (normalized.includes(key)) {
        return category
      }
    }
    return undefined
  }

  const addDepartment = () => {
    if (!newDeptName.trim() || !activeGerencia) return

    const newDept: Department = {
      id: `dept_${Date.now()}`,
      displayName: newDeptName.trim(),
      standardCategory: suggestCategory(newDeptName)
    }

    const updatedGerencias = data.gerencias.map((g: Gerencia) => {
      if (g.id === activeGerencia) {
        return {
          ...g,
          departments: [...g.departments, newDept]
        }
      }
      return g
    })

    onUpdate({ ...data, gerencias: updatedGerencias })
    setNewDeptName('')
  }

  const removeDepartment = (gerenciaId: string, deptId: string) => {
    const updatedGerencias = data.gerencias.map((g: Gerencia) => {
      if (g.id === gerenciaId) {
        return {
          ...g,
          departments: g.departments.filter(d => d.id !== deptId)
        }
      }
      return g
    })

    onUpdate({ ...data, gerencias: updatedGerencias })
  }

  const activeGerenciaData = data.gerencias.find((g: Gerencia) => g.id === activeGerencia)

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Asigna Departamentos</h2>
        <p className="text-muted-foreground">
          Define los departamentos para cada {data.model === 'simple' ? 'área' : 'gerencia'}
        </p>
      </div>

      {/* Selector de gerencia (solo si es jerárquico) */}
      {data.model === 'hierarchical' && (
        <div className="flex gap-2 flex-wrap">
          {data.gerencias.map((gerencia: Gerencia) => (
            <Button
              key={gerencia.id}
              variant={activeGerencia === gerencia.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveGerencia(gerencia.id)}
            >
              {gerencia.displayName}
              <Badge variant="secondary" className="ml-2">
                {gerencia.departments.length}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      {/* Input para agregar departamento */}
      <div className="space-y-4">
        <Label>
          Agregar departamento a: <strong>{activeGerenciaData?.displayName}</strong>
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ej: Desarrollo de Software"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
          />
          <Button 
            onClick={addDepartment}
            disabled={!newDeptName.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Lista de departamentos */}
      <div className="space-y-2">
        {activeGerenciaData?.departments.map((dept: Department) => (
          <Card key={dept.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">{dept.displayName}</span>
                {dept.standardCategory && (
                  <Badge variant="outline" className="ml-2">
                    {dept.standardCategory}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDepartment(activeGerencia, dept.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Validación */}
      {data.gerencias.some((g: Gerencia) => g.departments.length === 0) && (
        <p className="text-sm text-amber-600 text-center">
          ⚠️ Todas las gerencias deben tener al menos un departamento
        </p>
      )}

      {/* Navegación */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>
        <Button 
          onClick={onNext}
          disabled={data.gerencias.some((g: Gerencia) => g.departments.length === 0)}
        >
          Siguiente
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Componente Paso 4: Validación Visual
const StructureValidation = ({ data, onUpdate, onBack, onComplete }: any) => {
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    setSaving(true)
    
    try {
      // Obtener accountId del localStorage o JWT
      const accountId = localStorage.getItem('accountId') || 'test-account'
      
      const response = await fetch('/api/onboarding/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accountId,
          structure: {
            model: data.model,
            gerencias: data.gerencias
          }
        })
      })

      if (!response.ok) throw new Error('Error al guardar estructura')

      const result = await response.json()
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('organizationStructure', JSON.stringify(data))
      
      // Completar wizard
      onComplete(result)
    } catch (error) {
      console.error('Error guardando estructura:', error)
      alert('Error al guardar la estructura. Por favor intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  // Calcular estadísticas
  const totalDepartments = data.gerencias.reduce(
    (acc: number, g: Gerencia) => acc + g.departments.length, 
    0
  )
  const totalGerencias = data.gerencias.length

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Validación de Estructura</h2>
        <p className="text-muted-foreground">
          Revisa y confirma tu estructura organizacional
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800 border-slate-600">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-100">{data.model === 'simple' ? 'Simple' : 'Jerárquico'}</div>
            <p className="text-xs text-gray-400">Modelo</p>
          </CardContent>
        </Card>
        {data.model === 'hierarchical' && (
          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-100">{totalGerencias}</div>
              <p className="text-xs text-gray-400">Gerencias</p>
            </CardContent>
          </Card>
        )}
        <Card className="bg-slate-800 border-slate-600">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-100">{totalDepartments}</div>
            <p className="text-xs text-gray-400">Departamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Vista de árbol */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa de Estructura</CardTitle>
        </CardHeader>
        <CardContent>
          <StructureTreeView 
            structure={data}
            editable={false}
          />
        </CardContent>
      </Card>

      {/* JSON Preview (opcional, para debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Ver JSON generado (desarrollo)
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}

      {/* Navegación */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? (
            <>Guardando...</>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Confirmar Estructura
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Componente principal del Wizard
export default function StructureWizardPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<WizardData>({
    model: 'hierarchical',
    gerencias: []
  })

  // Configuración de pasos
  const steps = [
    { 
      id: 0, 
      title: "Modelo Organizacional", 
      component: ModelSelector 
    },
    { 
      id: 1, 
      title: "Definir Gerencias", 
      component: GerenciaSetup 
    },
    { 
      id: 2, 
      title: "Asignar Departamentos", 
      component: DepartmentAssignment 
    },
    { 
      id: 3, 
      title: "Validación", 
      component: StructureValidation 
    }
  ]

  // Si es modelo simple, ajustar pasos
  const activeSteps = wizardData.model === 'simple' 
    ? steps.filter(s => s.id !== 1) // Omitir paso de gerencias
    : steps

  const handleNext = () => {
    if (wizardData.model === 'simple' && currentStep === 0) {
      setCurrentStep(2) // Saltar al paso de departamentos
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }

  const handleBack = () => {
    if (wizardData.model === 'simple' && currentStep === 2) {
      setCurrentStep(0) // Volver al selector de modelo
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0))
    }
  }

  const handleComplete = (result: any) => {
    console.log('Estructura guardada:', result)
    // Redirigir al dashboard o siguiente paso
    router.push('/dashboard?onboarding=complete')
  }

  const CurrentStepComponent = steps[currentStep].component

  // Cargar datos guardados si existen
  useEffect(() => {
    const saved = localStorage.getItem('wizardData')
    if (saved) {
      try {
        setWizardData(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading saved data:', e)
      }
    }
  }, [])

  // Guardar progreso en localStorage
  useEffect(() => {
    if (isAuthenticated && wizardData.gerencias.length > 0) {
      localStorage.setItem('wizardData', JSON.stringify(wizardData))
    }
  }, [wizardData, isAuthenticated])

  // Mostrar loading mientras verificamos autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (ya se redirigió)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con progreso */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            Configuración de Estructura Organizacional
          </h1>
          
          {/* Indicador de progreso */}
          <div className="flex items-center justify-center mb-8">
            {activeSteps.map((step, index) => {
              const stepNumber = wizardData.model === 'simple' && index > 0 ? index + 1 : index
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center">
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                        isActive && "bg-primary text-primary-foreground",
                        isCompleted && "bg-green-500 text-white",
                        !isActive && !isCompleted && "bg-gray-200 text-gray-600"
                      )}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : stepNumber + 1}
                    </div>
                    <span className={cn(
                      "ml-2 text-sm",
                      isActive && "font-medium",
                      !isActive && "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < activeSteps.length - 1 && (
                    <div className={cn(
                      "w-12 h-0.5 mx-4",
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    )} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Contenido del paso actual */}
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentStepComponent
                  data={wizardData}
                  onUpdate={setWizardData}
                  onNext={handleNext}
                  onBack={handleBack}
                  onComplete={handleComplete}
                />
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}