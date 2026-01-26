# 🎯 TASK: REFINAMIENTOS FINALES - REVISIÓN DE INCONSISTENCIAS
## FocalizaHR | Polish UX según Filosofía de Diseño

---

## 📋 CONTEXTO

La página de **Revisión de Inconsistencias** ya tiene implementado el Split View. Este documento contiene los **refinamientos finales** para alcanzar el estándar visual FocalizaHR.

**Ruta:** `src/app/dashboard/admin/employees/quarantine/page.tsx`

**Componentes relacionados:**
- `src/components/admin/employees/LiderazgoOcultoSection.tsx`
- `src/components/admin/employees/CargosNuevosSection.tsx`

---

## 🔧 REFINAMIENTOS A IMPLEMENTAR

### 1. BOTONES: MISMO ANCHO FIJO

**Problema:** Los botones "Es Colaborador" y "Es Manager" tienen anchos diferentes.

**Solución:** Aplicar ancho mínimo igual a ambos botones.

```tsx
// En CargosNuevosSection.tsx
<div className="flex gap-3">
  <PrimaryButton className="min-w-[160px]">
    Es Colaborador
  </PrimaryButton>
  <SecondaryButton className="min-w-[160px]">
    Es Manager
  </SecondaryButton>
</div>
```

**Alternativa con grid:**
```tsx
<div className="grid grid-cols-2 gap-3 max-w-[340px]">
  <PrimaryButton className="w-full">Es Colaborador</PrimaryButton>
  <SecondaryButton className="w-full">Es Manager</SecondaryButton>
</div>
```

---

### 2. BOTONES APILADOS VERTICALMENTE (Liderazgo Oculto)

**Problema:** Botones en línea horizontal ocupan mucho espacio.

**Solución:** Apilar verticalmente en la card individual.

```tsx
// En LiderazgoOcultoSection.tsx - Card individual
<div className="flex flex-col gap-2 items-end">
  <PrimaryButton size="md" className="w-[200px]">
    Corregir a Manager
  </PrimaryButton>
  <button className="text-slate-400 hover:text-slate-300 text-sm transition-colors">
    Mantener Colaborador
  </button>
</div>
```

**Layout de la card:**
```tsx
<div className="fhr-card p-4">
  <div className="flex items-start justify-between">
    {/* Izquierda: Info del empleado */}
    <div className="flex items-start gap-3">
      <Avatar />
      <div>
        <p className="font-semibold text-white">{nombre}</p>
        <p className="text-sm text-slate-400">{cargo} · {empresa}</p>
        <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-1">
          <AlertTriangle className="w-3 h-3" />
          Gestiona {count} personas
        </span>
      </div>
    </div>
    
    {/* Derecha: Acciones apiladas */}
    <div className="flex flex-col gap-2 items-end">
      <PrimaryButton size="md">Corregir a Manager</PrimaryButton>
      <button className="text-slate-400 hover:text-slate-300 text-sm">
        Mantener Colaborador
      </button>
    </div>
  </div>
</div>
```

---

### 3. COPY: "IGNORAR" → "MANTENER COLABORADOR"

**Problema:** "Ignorar" no comunica la acción real.

**Solución:** Cambiar el texto en todos los lugares donde aparece.

```tsx
// ANTES
<button>Ignorar</button>

// DESPUÉS  
<button>Mantener Colaborador</button>
```

**También aplica al botón masivo si existe:**
```tsx
// Si existe botón "Ignorar Todos"
<button>Mantener Todos como Colaborador</button>
```

---

### 4. BADGE REUBICADO: DEBAJO DEL NOMBRE

**Problema:** Badge "Gestiona X personas" está a la derecha, rompe simetría.

**Solución:** Mover debajo del cargo, más pequeño.

```tsx
// ANTES (badge a la derecha)
<div className="flex justify-between">
  <div>{nombre}</div>
  <Badge>Gestiona 112 personas</Badge>  {/* ← Aquí */}
</div>

// DESPUÉS (badge debajo)
<div className="flex items-start gap-3">
  <Avatar />
  <div>
    <p className="font-semibold text-white">{nombre}</p>
    <p className="text-sm text-slate-400">{cargo} · {empresa}</p>
    <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-1">
      <AlertTriangle className="w-3 h-3" />
      Gestiona {count} {count === 1 ? 'persona' : 'personas'}
    </span>
  </div>
</div>
```

**Estilo del badge pequeño:**
```tsx
<span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-1">
  <AlertTriangle className="w-3 h-3" />
  Gestiona {count} personas
</span>
```

---

### 5. FIX Z-INDEX DROPDOWN EMPRESAS

**Problema:** El dropdown del selector de empresas queda detrás de las tarjetas métricas.

**Solución:** Agregar z-index al contenedor del dropdown.

```tsx
// En el componente del filtro de empresas
<div className="relative z-50">
  <Select>
    {/* ... */}
  </Select>
</div>

// O en el Popover/DropdownMenu content
<SelectContent className="z-50">
  {/* opciones */}
</SelectContent>
```

**Si usa Radix/shadcn:**
```tsx
<SelectContent 
  className="z-50"
  position="popper"
  sideOffset={5}
>
```

---

### 6. LÍNEAS TESLA MÁS VISIBLES

**Problema:** Las líneas decorativas superiores no se distinguen bien.

**Solución:** Aumentar altura a 2px y asegurar gradiente correcto.

```tsx
// Liderazgo Oculto - Línea ROJA
<div className="relative">
  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
  {/* contenido */}
</div>

// Cargos Nuevos - Línea CYAN
<div className="relative">
  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
  {/* contenido */}
</div>
```

---

### 7. NÚMEROS EN CYAN

**Problema:** Los números (4) y (32) en los títulos son blancos, no destacan.

**Solución:** Colorear en cyan para consistencia FocalizaHR.

```tsx
// ANTES
<h2>LIDERAZGO OCULTO (4)</h2>

// DESPUÉS
<h2 className="text-lg font-semibold text-white flex items-center gap-2">
  <AlertTriangle className="w-5 h-5 text-red-500" />
  LIDERAZGO OCULTO
  <span className="text-cyan-400">(4)</span>
</h2>

// Para Cargos Nuevos
<h2 className="text-lg font-semibold text-white flex items-center gap-2">
  <FileText className="w-5 h-5 text-cyan-400" />
  CARGOS NUEVOS POR CLASIFICAR
  <span className="text-cyan-400">(32)</span>
</h2>
```

---

### 8. BOTÓN RECOMENDADO = PRIMARY

**Problema:** Ambos botones lucen similares, no hay jerarquía clara.

**Solución:** El botón recomendado por la heurística debe ser PrimaryButton (sólido), el otro SecondaryButton (outline).

```tsx
// Función de recomendación
const suggestTrack = (cargo: string): 'MANAGER' | 'COLABORADOR' => {
  const managerKeywords = ['CEO', 'Gerente', 'Director', 'Jefe', 'Coordinador', 'Supervisor', 'Líder', 'Lead', 'Head', 'Chief', 'Manager'];
  const isLikelyManager = managerKeywords.some(k => 
    cargo.toLowerCase().includes(k.toLowerCase())
  );
  return isLikelyManager ? 'MANAGER' : 'COLABORADOR';
};

// Renderizado condicional
const recommendation = suggestTrack(cargo);

{recommendation === 'COLABORADOR' ? (
  <>
    <PrimaryButton className="min-w-[160px]">Es Colaborador</PrimaryButton>
    <SecondaryButton className="min-w-[160px]">Es Manager</SecondaryButton>
  </>
) : (
  <>
    <SecondaryButton className="min-w-[160px]">Es Colaborador</SecondaryButton>
    <PrimaryButton className="min-w-[160px]">Es Manager</PrimaryButton>
  </>
)}
```

---

### 9. ELIMINAR GUÍA DE RESOLUCIÓN

**Problema:** La card "Guía de Resolución" al final ocupa espacio y es redundante (el copy de cada sección ya explica).

**Solución:** Eliminar completamente o mover a tooltip.

```tsx
// ELIMINAR este componente del page.tsx
// <GuiaResolucion /> ← BORRAR

// OPCIONAL: Agregar tooltip en el título
<h2 className="flex items-center gap-2">
  LIDERAZGO OCULTO
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Info className="w-4 h-4 text-slate-500" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Corregir a Manager si efectivamente lidera un equipo.</p>
        <p>Mantener Colaborador si los reportes están mal asignados.</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</h2>
```

---

### 10. COPY MÁS LIGERO (FONT-LIGHT)

**Problema:** El texto explicativo se siente denso.

**Solución:** Usar font-light y color más tenue.

```tsx
// ANTES
<p className="text-slate-400 text-sm">
  Cargos clasificados como contribuidor individual...
</p>

// DESPUÉS
<p className="text-slate-400 text-sm font-light leading-relaxed">
  Cargos clasificados como contribuidor individual, pero el sistema 
  detectó personas a su cargo. Define qué evaluación de desempeño 
  les corresponde.
</p>
```

---

### 11. ESPACIADO "BREATHING ROOM"

**Problema:** Elementos pueden sentirse apretados.

**Solución:** Verificar y ajustar espaciados según filosofía Apple.

```tsx
// Gap entre cards individuales
<div className="space-y-4">  {/* Mínimo gap-4 (16px) */}
  {items.map(item => <Card key={item.id} />)}
</div>

// Padding interno de secciones
<div className="fhr-card p-6">  {/* Mínimo p-6 (24px) */}

// Espacio entre secciones principales
<div className="space-y-8">  {/* gap-8 (32px) entre Liderazgo y Cargos */}
  <LiderazgoOcultoSection />
  <CargosNuevosSection />
</div>
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Botones
- [ ] Botones "Es Colaborador" / "Es Manager" tienen mismo ancho
- [ ] Botones en Liderazgo Oculto están apilados verticalmente
- [ ] "Ignorar" cambiado a "Mantener Colaborador"
- [ ] Botón recomendado es PrimaryButton, alternativo es SecondaryButton

### Layout
- [ ] Badge "Gestiona X personas" está debajo del nombre, pequeño
- [ ] Dropdown de empresas tiene z-index correcto (z-50)
- [ ] Líneas Tesla visibles (h-[2px])
- [ ] Espaciado correcto (gap-4 cards, gap-8 secciones, p-6 padding)

### Tipografía
- [ ] Números (4) y (32) en color cyan
- [ ] Copy explicativo usa font-light
- [ ] Guía de Resolución eliminada del footer

### Funcional
- [ ] Todas las acciones siguen funcionando
- [ ] Loading states presentes
- [ ] Responsive en móvil

---

## 📐 WIREFRAME ACTUALIZADO (Referencia Visual)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LIDERAZGO OCULTO (4)  ← número en cyan                                 │
│  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ← línea roja h-[2px]     │
│                                                                          │
│  Cargos clasificados como contribuidor individual... (font-light)       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  👤 VENEGAS CASTRO, GERARDO ALEJANDRO                              │ │
│  │     ENFERMERA_COORD · Corporación Enterprise                       │ │
│  │     ⚠️ Gestiona 112 personas  ← badge pequeño debajo               │ │
│  │                                                                     │ │
│  │                                    ┌──────────────────────┐        │ │
│  │                                    │  Corregir a Manager  │        │ │
│  │                                    └──────────────────────┘        │ │
│  │                                    Mantener Colaborador            │ │
│  │                                    (text link)                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  [Corregir Todos a Manager (4)]                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  CARGOS NUEVOS POR CLASIFICAR (32)  ← número en cyan                    │
│  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ← línea cyan h-[2px]     │
│                                                                          │
│  Cargos que no estaban en nuestro diccionario... (font-light)           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  📌 "Analista"                                    4 empleados       │ │
│  │     Sugerencia: Es probable que sea Colaborador                    │ │
│  │                                                                     │ │
│  │     ┌─────────────────┐  ┌─────────────────┐                       │ │
│  │     │ Es Colaborador  │  │   Es Manager    │  ← mismo ancho        │ │
│  │     └─────────────────┘  └─────────────────┘                       │ │
│  │     (Primary/solid)      (Secondary/outline)                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚫 NO HACER

- ❌ No cambiar la lógica de datos (ya funciona)
- ❌ No modificar las APIs
- ❌ No alterar el agrupamiento por cargo
- ❌ No romper el responsive existente

---

## 📚 REFERENCIAS

- `FILOSOFIA_DISENO_FOCALIZAHR_v1.md` — Principios UX
- `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md` — Design system
- `FocalizaHR_Premium_Buttons_Guide.md` — Sistema de botones

---

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Estado:** READY FOR IMPLEMENTATION
