# 🚫 ANTI-PATRONES FOCALIZAHR

> Lo que NUNCA hacer al crear componentes frontend.

---

## ❌ ANTI-PATRONES UX

### 1. Tabla como Pantalla Principal

```tsx
// ❌ MAL - Tabla gigante sin contexto
export default function CampaignsPage() {
  return (
    <DataTable columns={columns} data={campaigns} />
  )
}

// ✅ BIEN - Smart Router con Gauge + CTA
export default function CampaignsPage() {
  return (
    <div className="fhr-bg-main min-h-screen">
      <MissionControl gauge={completionRate} cta={nextAction} />
      <CampaignRail campaigns={campaigns} />
    </div>
  )
}
```

### 2. Múltiples CTAs del Mismo Peso

```tsx
// ❌ MAL - 3 botones primarios compitiendo
<div className="flex gap-4">
  <PrimaryButton>Crear Campaña</PrimaryButton>
  <PrimaryButton>Ver Reportes</PrimaryButton>
  <PrimaryButton>Exportar</PrimaryButton>
</div>

// ✅ BIEN - 1 primario, resto secundarios
<div className="flex gap-4">
  <PrimaryButton>Crear Campaña</PrimaryButton>
  <SecondaryButton>Ver Reportes</SecondaryButton>
  <GhostButton>Exportar</GhostButton>
</div>
```

### 3. Formulario sin Landing Card

```tsx
// ❌ MAL - Directo al formulario
<Form onSubmit={handleSubmit}>
  <Input name="nombre" />
  <Input name="email" />
</Form>

// ✅ BIEN - Contexto primero
<LandingCard
  person={currentPerson}
  mission="Tu misión es completar la evaluación"
  cta="Iniciar Evaluación"
  onCTA={() => setShowForm(true)}
/>
{showForm && <EvaluationForm />}
```

### 4. Listas Largas No Colapsables

```tsx
// ❌ MAL - Lista de 50 items visible
{employees.map(emp => <EmployeeCard key={emp.id} {...emp} />)}

// ✅ BIEN - Rail colapsable
<CollapsibleRail
  items={employees}
  initialVisible={4}
  showMoreLabel="Ver más colaboradores"
/>
```

### 5. Modales Anidados

```tsx
// ❌ MAL - Modal dentro de modal
<Modal isOpen={showDetails}>
  <button onClick={() => setShowConfirm(true)}>Eliminar</button>
  <Modal isOpen={showConfirm}>
    <p>¿Confirmar?</p>
  </Modal>
</Modal>

// ✅ BIEN - Un solo modal, confirmación inline
<Modal isOpen={showDetails}>
  {confirmMode ? (
    <ConfirmationPanel onConfirm={handleDelete} onCancel={() => setConfirmMode(false)} />
  ) : (
    <DetailsPanel onDelete={() => setConfirmMode(true)} />
  )}
</Modal>
```

### 6. Filtros Complejos (>4 Pills)

```tsx
// ❌ MAL - Demasiados filtros
<FilterBar>
  <Filter name="status" />
  <Filter name="department" />
  <Filter name="dateRange" />
  <Filter name="score" />
  <Filter name="manager" />
  <Filter name="type" />
</FilterBar>

// ✅ BIEN - Máximo 4 pills + "Más filtros"
<FilterPills
  primary={['status', 'department']}
  secondary={['dateRange', 'score', 'manager', 'type']}
  showSecondaryAs="dropdown"
/>
```

---

## ❌ ANTI-PATRONES VISUALES

### 1. Fondos Claros

```tsx
// ❌ MAL - Fondo blanco/claro
<div className="bg-white min-h-screen">

// ✅ BIEN - Fondo oscuro FocalizaHR
<div className="fhr-bg-main min-h-screen">
```

### 2. Colores Fuera de Paleta

```tsx
// ❌ MAL - Colores random
<div className="bg-blue-500 text-pink-400">

// ✅ BIEN - Colores corporativos
<div className="bg-cyan-500/20 text-cyan-400">
// O usando variables
style={{ color: 'var(--focalizahr-cyan)' }}
```

### 3. Emojis Infantiles

```tsx
// ❌ MAL - Emojis decorativos
<h1>🎉 ¡Bienvenido! 🚀</h1>

// ✅ BIEN - Iconos Lucide limpios
import { Sparkles } from 'lucide-react'
<h1><Sparkles className="w-5 h-5 text-cyan-400" /> Bienvenido</h1>
```

### 4. Bordes Redondeados Inconsistentes

```tsx
// ❌ MAL - Mezcla de border-radius
<div className="rounded-sm">
  <button className="rounded-full">
  <card className="rounded-xl">

// ✅ BIEN - Consistente (12-16-20px)
<div className="rounded-xl">        {/* 12px */}
  <button className="rounded-xl">   {/* 12px */}
  <card className="rounded-2xl">    {/* 16px */}
```

### 5. Sombras Pesadas

```tsx
// ❌ MAL - Sombras muy marcadas
<div className="shadow-2xl shadow-black">

// ✅ BIEN - Sombras sutiles con glow
<div className="shadow-lg shadow-slate-900/50">
// O con glow cyan
style={{ boxShadow: '0 0 40px rgba(34, 211, 238, 0.1)' }}
```

---

## ❌ ANTI-PATRONES DE CÓDIGO

### 1. Estilos Inline Excesivos

```tsx
// ❌ MAL - Todo inline
<div style={{ 
  background: 'rgba(30, 41, 59, 0.9)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  borderRadius: '16px',
  padding: '24px'
}}>

// ✅ BIEN - Clases FocalizaHR
<div className="fhr-card">
```

### 2. Crear Nuevas Clases CSS

```tsx
// ❌ MAL - Inventar clases
<div className="my-custom-card fancy-gradient super-button">

// ✅ BIEN - Usar clases existentes
<div className="fhr-card">
<button className="fhr-btn-primary">
```

### 3. Tailwind Directo para Componentes Core

```tsx
// ❌ MAL - Tailwind directo para cards
<div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">

// ✅ BIEN - Clase semántica
<div className="fhr-card p-6">
```

### 4. Gradientes Hardcodeados

```tsx
// ❌ MAL - Gradiente hardcodeado
<span style={{ background: 'linear-gradient(135deg, #22D3EE, #3B82F6, #A78BFA)' }}>

// ✅ BIEN - Clase existente
<span className="fhr-title-gradient">
```

### 5. Ignorar Estados de Carga

```tsx
// ❌ MAL - Sin loading state
{data.map(item => <Card {...item} />)}

// ✅ BIEN - Loading skeleton
{isLoading ? (
  <div className="grid grid-cols-2 gap-4">
    {[1,2,3,4].map(i => <div key={i} className="fhr-skeleton h-40 rounded-xl" />)}
  </div>
) : (
  data.map(item => <Card key={item.id} {...item} />)
)}
```

### 6. Sin Empty States

```tsx
// ❌ MAL - Lista vacía sin mensaje
{items.length === 0 && null}

// ✅ BIEN - Empty state útil
{items.length === 0 && (
  <div className="fhr-card p-8 text-center">
    <EmptyIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
    <p className="text-slate-400 mb-4">No hay elementos aún</p>
    <PrimaryButton onClick={onAdd}>Crear Primero</PrimaryButton>
  </div>
)}
```

---

## ❌ ANTI-PATRONES RESPONSIVE

### 1. Desktop-First

```tsx
// ❌ MAL - Diseñar para desktop primero
className="w-[800px] lg:w-[400px]"

// ✅ BIEN - Mobile-first
className="w-full md:w-[800px]"
```

### 2. Tamaños Fijos

```tsx
// ❌ MAL - Pixeles fijos
<div style={{ width: '450px', height: '300px' }}>

// ✅ BIEN - Relativo/responsive
<div className="w-full max-w-md aspect-video">
```

### 3. Scroll Horizontal No Intencional

```tsx
// ❌ MAL - Contenido desborda
<div className="flex gap-4">
  {manyItems.map(...)}
</div>

// ✅ BIEN - Scroll controlado
<div className="flex gap-4 overflow-x-auto scrollbar-hide">
  {manyItems.map(...)}
</div>
```

---

## ❌ ANTI-PATRONES DE TEXTO

### 1. Strings de BD Sin Formatear

```tsx
// ❌ MAL - Valor crudo de BD
<p>{employee.created_at}</p>
// Muestra: "2024-01-15T14:30:00.000Z"

// ✅ BIEN - Formateado para humanos
<p>{formatDate(employee.created_at)}</p>
// Muestra: "15 enero 2024"
```

### 2. Mensajes Técnicos

```tsx
// ❌ MAL - Lenguaje técnico
<p>Error: ECONNREFUSED at port 5432</p>

// ✅ BIEN - Lenguaje humano
<p>No pudimos conectar con el servidor. Por favor intenta de nuevo.</p>
```

### 3. Sin Indicar Siguiente Paso

```tsx
// ❌ MAL - Pantalla sin guía
<p>Evaluación completada.</p>

// ✅ BIEN - Siguiente acción clara
<p>Evaluación completada.</p>
<p className="text-slate-400">Tu siguiente misión es revisar el Plan de Desarrollo.</p>
<PrimaryButton>Ver Plan de Desarrollo</PrimaryButton>
```

---

## 📋 CHECKLIST ANTI-PATRONES

Antes de entregar, verificar que NO exista:

```yaml
UX:
  □ Tabla como pantalla principal
  □ Múltiples CTAs primarios
  □ Formulario sin contexto previo
  □ Listas largas sin colapsar
  □ Modales anidados
  □ Más de 4 filtros visibles

VISUAL:
  □ Fondos claros
  □ Colores fuera de paleta
  □ Emojis decorativos
  □ Border-radius inconsistentes
  □ Sombras muy pesadas

CÓDIGO:
  □ Estilos inline excesivos
  □ Clases CSS inventadas
  □ Tailwind directo para componentes core
  □ Sin loading states
  □ Sin empty states

RESPONSIVE:
  □ Desktop-first
  □ Tamaños fijos en pixeles
  □ Scroll horizontal no controlado

TEXTO:
  □ Valores crudos de BD
  □ Mensajes técnicos al usuario
  □ Pantallas sin siguiente paso
```

---

## ❌ ANTI-PATRONES CONFIRMADOS (Patrón G)

Validados en CompensationBoard v2 — **NUNCA hacer**:

### Indicadores Visuales

```yaml
❌ Zero semáforos rojo/verde/amarillo como indicadores primarios
❌ Zero badges de alarma gritando (NO AUDITABLE en uppercase amarillo)
❌ Zero colores de fondo en filas de persona (bg-amber, bg-red)
```

### Nombres y Labels

```yaml
❌ Zero ALL CAPS en nombres de persona
❌ Zero "—" (em dash) antes de títulos de sección
❌ Zero labels inventados (usar solo los del motor: SEVERA, INDULGENTE, CENTRAL, ÓPTIMA)
```

### Métricas

```yaml
❌ Zero score360 visible al CEO (usar roleFitScore como canónico)
❌ Zero "desconexión" como métrica visible (traducir a lenguaje ejecutivo)
❌ Zero Pearson sin contexto (siempre con "azar puro" o equivalente)
```

### Estructura

```yaml
❌ Zero modales para contenido que se puede expandir inline
```

### Ejemplos Concretos

```tsx
// ❌ MAL - Badge gritando
<span className="bg-amber-500 text-white uppercase font-bold px-3 py-1">
  NO AUDITABLE
</span>

// ✅ BIEN - Veredicto narrativo sutil
<p className="text-sm font-medium text-amber-400/70">
  Integridad de medición: no auditable
</p>
```

```tsx
// ❌ MAL - Semáforo de colores
<div className={`w-3 h-3 rounded-full ${
  score > 80 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500'
}`} />

// ✅ BIEN - Tags ghost uniformes
<span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 
                 border border-slate-700/30 font-light">
  {label}
</span>
```

```tsx
// ❌ MAL - score360 al CEO
<p>Score 360: {employee.score360}</p>

// ✅ BIEN - RoleFit como métrica canónica
<p>RoleFit: {employee.roleFitScore}%</p>
```

```tsx
// ❌ MAL - Nombre en UPPERCASE
<span>{employee.name.toUpperCase()}</span>

// ✅ BIEN - formatDisplayName siempre
import { formatDisplayName } from '@/lib/utils/formatName'
<span>{formatDisplayName(employee.name)}</span>
```
