# REF_TASK_03C: Referencia Técnica Integración Flujo Cliente

## 1. Estructura del Wizard Actual

```typescript
// src/app/dashboard/campaigns/new/page.tsx
// Estructura aproximada (verificar en código real)

const WIZARD_STEPS = [
  { id: 'type', title: 'Tipo de Estudio' },
  { id: 'config', title: 'Configuración' },
  { id: 'participants', title: 'Participantes' },
  { id: 'confirm', title: 'Confirmar' }
]
```

## 2. Nueva Estructura con Paso 3B

```typescript
const WIZARD_STEPS = [
  { id: 'type', title: 'Tipo de Estudio' },
  { id: 'config', title: 'Configuración' },
  { id: 'participants', title: 'Participantes' },
  { id: 'classification', title: 'Clasificación' },  // ← NUEVO
  { id: 'confirm', title: 'Confirmar' }
]
```

## 3. Lógica de Transición

```typescript
// Después de carga CSV exitosa en paso 'participants':

const handleParticipantsUploaded = async (result: UploadResult) => {
  // 1. Guardar resultado de carga
  setUploadResult(result)
  
  // 2. Ejecutar clasificación automática sobre Employee
  // (esto ya debería ocurrir en el backend durante el upload,
  //  pero podemos verificar/reforzar aquí)
  
  // 3. Verificar si hay pendientes
  const validateRes = await fetch('/api/job-classification/validate')
  const validation = await validateRes.json()
  
  if (validation.canProceed) {
    // Todo clasificado, saltar paso 3B
    setCurrentStep('confirm')
  } else {
    // Hay pendientes, mostrar paso 3B
    setCurrentStep('classification')
  }
}
```

## 4. Componente del Paso 3B

```tsx
// Dentro del wizard, renderizar condicionalmente:

{currentStep === 'classification' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <JobClassificationGate
      mode="client"
      // NO pasar accountId - viene del token
      onComplete={() => setCurrentStep('confirm')}
      onCancel={() => setCurrentStep('participants')}
    />
  </motion.div>
)}
```

## 5. Progress Bar del Wizard

```tsx
// Actualizar para mostrar 5 pasos:

const steps = [
  { number: 1, label: 'Tipo', completed: stepIndex > 0 },
  { number: 2, label: 'Config', completed: stepIndex > 1 },
  { number: 3, label: 'Datos', completed: stepIndex > 2 },
  { number: 4, label: 'Cargos', completed: stepIndex > 3 },  // ← NUEVO
  { number: 5, label: 'Lanzar', completed: stepIndex > 4 }
]
```

## 6. Flujo Visual Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    WIZARD CAMPAÑA                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ① ──── ② ──── ③ ──── ④ ──── ⑤                                 │
│  Tipo   Config  Datos  Cargos  Lanzar                          │
│                          ↑                                      │
│                      PASO NUEVO                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PASO 3: Carga CSV                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✅ 200 participantes cargados correctamente            │   │
│  │                                                         │   │
│  │  [ Siguiente ]                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                         ↓                                       │
│                                                                 │
│  PASO 3B: Clasificación de Cargos                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │      <JobClassificationGate mode="client" />            │   │
│  │                                                         │   │
│  │  - Muestra resumen de clasificación                     │   │
│  │  - Permite resolver pendientes                          │   │
│  │  - Bloquea avance si hay pendientes                     │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                         ↓                                       │
│                                                                 │
│  PASO 4: Confirmar y Lanzar                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Resumen de campaña                                     │   │
│  │  [ Lanzar Campaña ]                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 7. Consideraciones UX

### Saltar Paso si No Hay Pendientes
```typescript
// Si PositionAdapter clasificó 100% automáticamente,
// saltar paso 3B y ir directo a confirm
if (validation.canProceed && validation.pendingCount === 0) {
  // Mostrar toast de éxito
  toast.success('✨ Todos los cargos fueron clasificados automáticamente')
  setCurrentStep('confirm')
}
```

### Mensaje Motivacional
```typescript
// En el paso 3B, mensaje contextual:
const getMessage = (rate: number) => {
  if (rate >= 95) return "¡Casi listo! Solo faltan unos pocos cargos"
  if (rate >= 80) return "Buen avance. Tu equipo necesita tu conocimiento"
  if (rate >= 50) return "Ayúdanos a conocer mejor tu organización"
  return "Clasifica los cargos para personalizar la experiencia"
}
```

## 8. Backend: Ejecutar Clasificación en Upload

```typescript
// En el endpoint de carga de participantes/empleados
// Asegurar que PositionAdapter se ejecute:

// src/app/api/campaigns/[id]/participants/route.ts (o similar)

for (const employee of employeesToCreate) {
  // Clasificar automáticamente
  const classification = await PositionAdapter.classifyPositionWithHistory(
    employee.position,
    accountId
  )
  
  // Guardar con clasificación
  await prisma.employee.create({
    data: {
      ...employee,
      standardJobLevel: classification.standardJobLevel,
      acotadoGroup: classification.acotadoGroup,
      performanceTrack: classification.performanceTrack,
      jobLevelMethod: classification.mappingMethod,
      jobLevelMappedAt: classification.standardJobLevel ? new Date() : null
    }
  })
}
```

## 9. Verificar Archivos Existentes

Antes de modificar, revisar:
- `src/app/dashboard/campaigns/new/page.tsx`
- Componentes del wizard existente
- Flujo de carga de participantes actual
- Integración con Employee vs Participant
