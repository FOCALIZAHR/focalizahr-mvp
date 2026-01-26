# 🎯 TASK: REFACTOR UI - REVISIÓN DE INCONSISTENCIAS
## FocalizaHR | Split View + Premium Buttons + Agrupamiento

---

## 📋 CONTEXTO

La página de **Revisión de Inconsistencias** (`/admin/employees/inconsistencies` o similar) necesita un refactor de UX. Actualmente es una tabla plana con scroll horizontal y 72+ botones visibles.

**Propósito del módulo:** Validación Human-in-the-Loop antes de activar evaluaciones de desempeño. El cliente debe confirmar si cada empleado es Manager o Colaborador.

---

## 🎯 OBJETIVO

Transformar la UI en un **Split View** con dos secciones jerárquicas:
1. **Liderazgo Oculto** (CRÍTICO) - Colaboradores con personas a cargo
2. **Cargos Nuevos** (VOLUMEN) - Cargos no reconocidos, agrupados

---

## 📐 ESTRUCTURA FINAL (Layout)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  ├── Título: "Revisión de Inconsistencias"                              │
│  ├── Subtítulo: "Valida los roles antes de activar evaluaciones..."    │
│  ├── Selector empresa (existente)                                       │
│  └── Botón Actualizar (GhostButton con RefreshCw icon)                 │
├─────────────────────────────────────────────────────────────────────────┤
│  MÉTRICAS (3 cards existentes - mantener)                               │
│  [Pendientes: 36] [Liderazgo Oculto: 4] [Cargos Nuevos: 32]            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║ SECCIÓN A: LIDERAZGO OCULTO                                       ║  │
│  ║ border-top: 2px solid #EF4444 (LÍNEA TESLA ROJA)                  ║  │
│  ╠═══════════════════════════════════════════════════════════════════╣  │
│  ║                                                                    ║  │
│  ║  Header:                                                           ║  │
│  ║  🚨 LIDERAZGO OCULTO (4)                                          ║  │
│  ║  "Cargos clasificados como contribuidor individual, pero el       ║  │
│  ║   sistema detectó personas a su cargo. Define qué evaluación      ║  │
│  ║   de desempeño les corresponde."                                  ║  │
│  ║                                                                    ║  │
│  ║  Lista (ordenada DESC por reportes):                              ║  │
│  ║  ┌────────────────────────────────────────────────────────────┐   ║  │
│  ║  │ 👤 Nombre Completo                    ⚠️ Gestiona X personas│   ║  │
│  ║  │    Cargo · Empresa                                          │   ║  │
│  ║  │                    [Corregir a Manager]  Ignorar            │   ║  │
│  ║  └────────────────────────────────────────────────────────────┘   ║  │
│  ║                                                                    ║  │
│  ║  Footer:                                                           ║  │
│  ║  [Corregir Todos a Manager (N)]  ← PrimaryButton lg               ║  │
│  ║                                                                    ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                          │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║ SECCIÓN B: CARGOS NUEVOS                                          ║  │
│  ║ border-top: 2px solid #22D3EE (LÍNEA TESLA CYAN)                  ║  │
│  ╠═══════════════════════════════════════════════════════════════════╣  │
│  ║                                                                    ║  │
│  ║  Header:                                                           ║  │
│  ║  📝 CARGOS NUEVOS POR CLASIFICAR (32)                             ║  │
│  ║  "Cargos que no estaban en nuestro diccionario. Define qué        ║  │
│  ║   evaluación de desempeño les corresponde."                       ║  │
│  ║                                                                    ║  │
│  ║  Lista AGRUPADA por cargo (NO 30 filas de "Músico"):              ║  │
│  ║  ┌────────────────────────────────────────────────────────────┐   ║  │
│  ║  │ 📌 "Analista"                            5 empleados        │   ║  │
│  ║  │                                                             │   ║  │
│  ║  │     [Es Colaborador]        [Es Manager]                    │   ║  │
│  ║  │     (primary si recomendado) (secondary si no)              │   ║  │
│  ║  └────────────────────────────────────────────────────────────┘   ║  │
│  ║                                                                    ║  │
│  ║  Footer (si hay más de 5 grupos):                                 ║  │
│  ║  [Ver los N cargos nuevos →]                                      ║  │
│  ║                                                                    ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 COMPONENTES A USAR

### Botones (de `@/components/ui/PremiumButton`)

```tsx
import { 
  PrimaryButton,    // Acciones principales (cyan gradient)
  SecondaryButton,  // Acciones secundarias (outline)
  GhostButton       // Acciones terciarias (transparente)
} from '@/components/ui/PremiumButton';
```

| Acción | Componente | Props |
|--------|------------|-------|
| Corregir a Manager (individual) | `PrimaryButton` | `size="md"` |
| Ignorar | `<span className="text-slate-400 hover:text-slate-300 cursor-pointer text-sm">Ignorar</span>` | - |
| Corregir Todos a Manager | `PrimaryButton` | `size="lg" fullWidth` |
| Es Colaborador (recomendado) | `PrimaryButton` | `size="md"` |
| Es Colaborador (no recomendado) | `SecondaryButton` | `size="md"` |
| Es Manager (recomendado) | `PrimaryButton` | `size="md"` |
| Es Manager (no recomendado) | `SecondaryButton` | `size="md"` |
| Actualizar (header) | `GhostButton` | `icon={RefreshCw} size="sm"` |

### Cards con Línea Tesla

```tsx
// Card Liderazgo Oculto
<div className="fhr-card relative">
  {/* Línea Tesla Roja */}
  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
  
  {/* Contenido */}
</div>

// Card Cargos Nuevos
<div className="fhr-card relative">
  {/* Línea Tesla Cyan */}
  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
  
  {/* Contenido */}
</div>
```

---

## 📊 LÓGICA DE DATOS

### Separar por Tipo de Anomalía

```typescript
// Tipos de anomalías
type AnomalyType = 'COLABORADOR_WITH_REPORTS' | 'CARGO_NUEVO';

// Separar datos
const liderazgoOculto = anomalies
  .filter(a => a.anomalyType === 'COLABORADOR_WITH_REPORTS')
  .sort((a, b) => b.directReportsCount - a.directReportsCount); // DESC por reportes

const cargosNuevos = anomalies
  .filter(a => a.anomalyType === 'CARGO_NUEVO');
```

### Agrupar Cargos Nuevos por Nombre

```typescript
// Agrupar por cargo
const cargosAgrupados = cargosNuevos.reduce((acc, item) => {
  const cargo = item.position.toUpperCase().trim();
  if (!acc[cargo]) {
    acc[cargo] = {
      cargo: item.position,
      empleados: [],
      count: 0
    };
  }
  acc[cargo].empleados.push(item);
  acc[cargo].count++;
  return acc;
}, {} as Record<string, { cargo: string; empleados: Anomaly[]; count: number }>);

// Convertir a array ordenado alfabéticamente
const cargosLista = Object.values(cargosAgrupados)
  .sort((a, b) => a.cargo.localeCompare(b.cargo));
```

### Heurística de Recomendación

```typescript
// Sugerir track basado en nombre del cargo
const suggestTrack = (cargo: string): 'MANAGER' | 'COLABORADOR' => {
  const managerKeywords = [
    'CEO', 'Gerente', 'Director', 'Jefe', 'Coordinador', 
    'Supervisor', 'Líder', 'Lead', 'Head', 'Chief', 'Manager'
  ];
  const isLikelyManager = managerKeywords.some(k => 
    cargo.toLowerCase().includes(k.toLowerCase())
  );
  return isLikelyManager ? 'MANAGER' : 'COLABORADOR';
};
```

---

## 🔧 ACCIONES

### Acción Individual (Liderazgo Oculto)

```typescript
const handleCorregirAManager = async (employeeId: string) => {
  await updateEmployeeTrack(employeeId, 'MANAGER');
  // Refrescar lista
};

const handleIgnorar = async (employeeId: string) => {
  await dismissAnomaly(employeeId);
  // Refrescar lista
};
```

### Acción Masiva (Liderazgo Oculto)

```typescript
const handleCorregirTodos = async () => {
  const ids = liderazgoOculto.map(a => a.employeeId);
  await bulkUpdateEmployeeTrack(ids, 'MANAGER');
  // Refrescar lista
};
```

### Acción Agrupada (Cargos Nuevos)

```typescript
const handleClasificarCargo = async (
  cargo: string, 
  empleadoIds: string[], 
  track: 'MANAGER' | 'COLABORADOR'
) => {
  // 1. Actualizar todos los empleados con ese cargo
  await bulkUpdateEmployeeTrack(empleadoIds, track);
  
  // 2. Opcional: Agregar cargo al diccionario
  await addCargoToDictionary(cargo, track);
  
  // 3. Refrescar lista
};
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Funcionales
- [ ] Sección Liderazgo Oculto muestra casos ordenados por N° reportes (DESC)
- [ ] Sección Cargos Nuevos agrupa por nombre de cargo
- [ ] Botón "Corregir a Manager" individual funciona
- [ ] Botón "Corregir Todos a Manager" aplica a todos los casos
- [ ] Botones "Es Colaborador" / "Es Manager" aplican a todo el grupo
- [ ] Acción exitosa remueve el item/grupo de la lista
- [ ] Métricas se actualizan después de cada acción

### Visuales
- [ ] Línea Tesla roja en sección Liderazgo Oculto
- [ ] Línea Tesla cyan en sección Cargos Nuevos
- [ ] Botones usando PremiumButton (no CSS plano)
- [ ] "Ignorar" como text link, no botón
- [ ] Recomendación visual (primary vs secondary) según heurística
- [ ] Sin scroll horizontal
- [ ] Responsive (mobile-friendly)

### UX
- [ ] Copy actualizado según especificación
- [ ] Botón recomendado es PrimaryButton
- [ ] Botón alternativo es SecondaryButton
- [ ] Loading states en acciones
- [ ] Empty state si no hay inconsistencias

---

## 📁 ARCHIVOS A MODIFICAR

```
src/
├── app/admin/employees/inconsistencies/
│   └── page.tsx                    # Página principal (refactor)
├── components/admin/employees/
│   ├── InconsistenciesView.tsx     # Nuevo: Vista Split
│   ├── LiderazgoOcultoSection.tsx  # Nuevo: Sección A
│   ├── CargosNuevosSection.tsx     # Nuevo: Sección B
│   └── InconsistencyCard.tsx       # Nuevo: Card individual
└── hooks/
    └── useInconsistencies.ts       # Hook con lógica de datos
```

---

## 🚫 NO HACER

- ❌ No usar tabla HTML plana
- ❌ No mostrar 30 filas del mismo cargo
- ❌ No usar botones CSS (solo PremiumButton)
- ❌ No mezclar ambos tipos de anomalías en una lista
- ❌ No crear modales de confirmación (acción directa)

---

## 📚 REFERENCIAS

- `FocalizaHR_Premium_Buttons_Guide.md` - Sistema de botones
- `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md` - Design system
- `FILOSOFIA_DISENO_FOCALIZAHR_v1.md` - Principios UX
- `IMPLEMENTACION_POST_BACKEND_PERFORMANCE_v1.md` - Contexto del módulo

---

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Estado:** READY FOR IMPLEMENTATION
