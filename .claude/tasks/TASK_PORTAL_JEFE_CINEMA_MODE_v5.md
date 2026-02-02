# 🎬 TASK: PORTAL DEL JEFE "CINEMA MODE" v5.0

## Control del Documento
| Campo | Valor |
|-------|-------|
| **Versión** | 5.0 FINAL |
| **Fecha** | Febrero 2025 |
| **Base** | Código Gemini funcional + Datos reales |
| **Ruta** | `/dashboard/evaluaciones` |

---

## 1. ARQUITECTURA VALIDADA

### 1.1 Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (h-14, fixed top)                                   │
│  Logo + "CICLO 2026-Q1"                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STAGE (flex-1, centrado vertical)                          │
│                                                             │
│  Renderiza según estado:                                    │
│  - selectedId === null  →  <MissionControl />               │
│  - selectedId !== null  →  <SpotlightCard />                │
│  - stats.pending === 0  →  <VictoryScreen />                │
│                                                             │
│  Padding bottom dinámico:                                   │
│  - Rail expandido: mb-[280px]                               │
│  - Rail colapsado: mb-[50px]                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  RAIL (fixed bottom, colapsable)                            │
│  - Expandido: height 280px, cards visibles                  │
│  - Colapsado: height 50px, solo toggle bar                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Estados del Sistema

```typescript
type ViewState = 
  | { type: 'lobby' }                    // Anillo + CTA
  | { type: 'spotlight', id: string }    // Card persona
  | { type: 'victory' }                  // 100% completado
```

### 1.3 Flujo de Navegación

```
LOBBY
  │
  ├── Click "Siguiente: María N." ──────────────► SPOTLIGHT + Rail colapsa
  │
  └── Click card en Rail ───────────────────────► SPOTLIGHT + Rail colapsa

SPOTLIGHT
  │
  ├── Click "← Dashboard" ──────────────────────► LOBBY + Rail expande
  │
  ├── Click otra card en Rail ──────────────────► SPOTLIGHT (cambia persona)
  │
  └── Click "COMENZAR EVALUACIÓN" ──────────────► /encuesta/[token]

VICTORY (automático cuando pending === 0)
  │
  └── Click "Ver mi equipo" ────────────────────► Rail expande (ver completadas)
```

---

## 2. TOKENS DE DISEÑO (EXACTOS)

```typescript
// src/lib/constants/design-tokens.ts

export const TOKENS = {
  // Colores principales
  cyan: "#22D3EE",
  purple: "#A78BFA",
  emerald: "#10B981",
  amber: "#F59E0B",
  
  // Fondos
  bgDeep: "#0F172A",
  bgCard: "rgba(15, 23, 42, 0.8)",
  bgCardHover: "rgba(30, 41, 59, 0.8)",
  
  // Línea Tesla
  teslaGradient: "linear-gradient(90deg, transparent, #22D3EE, transparent)",
  teslaGlow: "0 0 15px #22D3EE",
  
  // Glassmorphism
  glass: "bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800",
  glassSubtle: "bg-slate-900/40 backdrop-blur-sm border border-white/5",
} as const;
```

---

## 3. COMPONENTE: MISSION CONTROL (LOBBY)

### 3.1 Props

```typescript
interface MissionControlProps {
  stats: {
    total: number
    completed: number
    pending: number
  }
  cycle: {
    name: string
    startDate: string
    endDate: string
    daysRemaining: number
  }
  nextEmployee: {
    id: string
    displayName: string
  } | null
  onStart: (employeeId: string) => void
}
```

### 3.2 Anillo Segmentado SVG (CÓDIGO EXACTO)

```tsx
// Dentro de MissionControl.tsx

const SegmentedRing = ({ total, completed }: { total: number, completed: number }) => {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const gap = 4; // Espacio entre segmentos
  const segmentLength = (circumference / total) - gap;
  
  // Crear array de segmentos
  const segments = Array.from({ length: total }, (_, i) => ({
    index: i,
    isCompleted: i < completed,
    isReady: i >= completed && i < completed + 1, // Siguiente a completar
  }));

  return (
    <div className="relative w-[340px] h-[340px] flex items-center justify-center">
      {/* Glow sutil */}
      <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-[80px]" />
      
      <svg className="w-full h-full -rotate-90" viewBox="0 0 340 340">
        {segments.map((seg) => {
          const color = seg.isCompleted 
            ? '#10B981'           // Verde completado
            : seg.isReady 
              ? '#22D3EE'         // Cyan siguiente
              : '#1E293B';        // Gris pendiente
          
          return (
            <circle
              key={seg.index}
              cx="170"
              cy="170"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={`${segmentLength} ${gap}`}
              strokeDashoffset={-((segmentLength + gap) * seg.index)}
              strokeLinecap="round"
              className="transition-all duration-500"
              style={{ opacity: seg.isCompleted || seg.isReady ? 1 : 0.4 }}
            />
          );
        })}
      </svg>

      {/* Centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-7xl font-black text-white tracking-tighter font-mono">
          {Math.round((completed / total) * 100)}%
        </span>
        <span className="text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase mt-2">
          {getInsightText(completed, total)}
        </span>
        <span className="text-xs text-slate-500 font-mono mt-1">
          {total - completed} Pendientes · ~{(total - completed) * 10}m
        </span>
      </div>
    </div>
  );
};

function getInsightText(completed: number, total: number): string {
  const pct = (completed / total) * 100;
  if (pct === 0) return "Inicio de Ciclo";
  if (pct < 50) return "Ritmo Constante";
  if (pct < 100) return "Recta Final";
  return "Misión Cumplida";
}
```

### 3.3 CTA Principal

```tsx
{nextEmployee && (
  <button
    onClick={() => onStart(nextEmployee.id)}
    className="group relative bg-gradient-to-r from-cyan-400 to-cyan-500 
               hover:to-cyan-300 text-slate-950 pl-8 pr-2 py-3 rounded-xl 
               flex items-center gap-6 
               shadow-[0_10px_40px_-10px_rgba(34,211,238,0.25)] 
               hover:shadow-[0_10px_40px_-5px_rgba(34,211,238,0.4)] 
               transition-all transform hover:-translate-y-1"
  >
    <div className="text-left">
      <span className="block text-[10px] text-slate-800 uppercase tracking-wider font-bold opacity-70">
        Siguiente Evaluación
      </span>
      <span className="block text-lg font-bold leading-none">
        {nextEmployee.displayName}
      </span>
    </div>
    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
      <ArrowRight className="w-6 h-6" />
    </div>
  </button>
)}
```

---

## 4. COMPONENTE: SPOTLIGHT CARD

### 4.1 Props

```typescript
interface SpotlightCardProps {
  employee: {
    id: string
    displayName: string        // Formateado
    displayNameFull: string    // Completo para el card grande
    position: string
    departmentName: string
    tenure: string
    status: 'ready' | 'waiting' | 'in_progress' | 'completed'
    participantToken: string | null
  }
  insights: Insight[]
  onBack: () => void
  onEvaluate: (token: string) => void
}

interface Insight {
  type: 'tenure' | 'lastScore' | 'gap' | 'selfEval'
  icon: LucideIcon
  label: string
  value: string
  variant: 'default' | 'warning' | 'success'
}
```

### 4.2 Layout (2 columnas)

```tsx
<motion.div 
  initial={{ opacity: 0, scale: 0.95, y: 30 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 30 }}
  transition={{ type: "spring", stiffness: 220, damping: 30 }}
  className="w-full max-w-5xl"
>
  <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 
                  rounded-[24px] overflow-hidden shadow-2xl 
                  flex flex-col md:flex-row relative">
    
    {/* LÍNEA TESLA */}
    <div 
      className="absolute top-0 left-0 right-0 h-[1px] z-20" 
      style={{ 
        background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
        boxShadow: '0 0 15px #22D3EE'
      }}
    />

    {/* Botón Volver */}
    <button 
      onClick={onBack}
      className="absolute top-6 left-6 z-20 flex items-center gap-2 
                 text-slate-500 hover:text-white transition-colors 
                 text-[10px] font-bold uppercase tracking-wider 
                 bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg 
                 border border-white/5 hover:border-white/20"
    >
      <ArrowLeft className="w-3 h-3" /> Dashboard
    </button>

    {/* COLUMNA IZQUIERDA: Identidad (35%) */}
    <div className="w-full md:w-[35%] bg-slate-900/50 p-10 
                    flex flex-col items-center justify-center 
                    border-b md:border-b-0 md:border-r border-slate-800">
      
      {/* Avatar con ring de estado */}
      <div className="relative mb-6">
        <div className="w-36 h-36 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 
                        flex items-center justify-center text-3xl font-bold text-slate-400 
                        border border-slate-700 shadow-2xl">
          {getInitials(employee.displayNameFull)}
        </div>
        
        {employee.status === 'ready' && (
          <div className="absolute inset-[-4px] rounded-full border border-cyan-500/30 animate-pulse" />
        )}
        
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <StatusBadge status={employee.status} />
        </div>
      </div>
      
      {/* Info */}
      <div className="text-center mt-4">
        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
          {employee.displayNameFull}
        </h2>
        <p className="text-sm text-slate-400 font-medium">{employee.position}</p>
        <p className="text-[10px] text-slate-600 font-mono mt-2 uppercase tracking-widest">
          {employee.departmentName}
        </p>
      </div>
    </div>

    {/* COLUMNA DERECHA: Inteligencia (65%) */}
    <div className="w-full md:w-[65%] p-10 md:p-12 flex flex-col justify-between 
                    bg-gradient-to-br from-[#0F172A] to-[#162032]">
      
      {/* Grid de datos */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {insights.map((insight) => (
          <InsightCard key={insight.type} insight={insight} />
        ))}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-800">
        
        {/* CTA Primario */}
        {employee.status !== 'completed' && employee.participantToken && (
          <button 
            onClick={() => onEvaluate(employee.participantToken!)}
            className="flex-1 h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 
                       hover:to-cyan-400 text-white rounded-xl font-semibold text-sm 
                       shadow-lg shadow-cyan-500/20 transition-all 
                       transform hover:-translate-y-0.5 
                       flex items-center justify-center gap-3"
          >
            <span>COMENZAR EVALUACIÓN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        
        {employee.status === 'completed' && (
          <div className="flex-1 h-14 bg-emerald-500/10 border border-emerald-500/30 
                          text-emerald-400 rounded-xl font-semibold text-sm 
                          flex items-center justify-center gap-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>Evaluación Completada</span>
          </div>
        )}
        
        {/* CTA Secundario */}
        <button className="h-14 px-6 rounded-xl border border-slate-700 
                           text-slate-400 hover:text-white hover:border-slate-500 
                           hover:bg-slate-800/50 transition-all text-sm font-medium">
          Historial
        </button>
      </div>
    </div>
  </div>
</motion.div>
```

### 4.3 InsightCard

```tsx
const InsightCard = ({ insight }: { insight: Insight }) => {
  const Icon = insight.icon;
  
  // Estilos según variante
  const variantStyles = {
    default: 'bg-slate-800/40 border-slate-700/50',
    warning: 'bg-amber-950/10 border-amber-500/20',
    success: 'bg-emerald-950/10 border-emerald-500/20',
  };
  
  const isFullWidth = insight.type === 'gap'; // Gap ocupa 2 columnas
  
  return (
    <div className={cn(
      "p-5 rounded-xl border",
      variantStyles[insight.variant],
      isFullWidth && "col-span-2"
    )}>
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 
                      uppercase tracking-wider mb-2">
        <Icon className="w-3 h-3" />
        {insight.label}
      </div>
      <div className="text-xl text-white font-mono font-medium">
        {insight.value}
      </div>
    </div>
  );
};
```

---

## 5. COMPONENTE: RAIL (CARRUSEL COLAPSABLE)

### 5.1 Props

```typescript
interface RailProps {
  employees: EmployeeCardData[]
  selectedId: string | null
  isExpanded: boolean
  activeTab: 'all' | 'pending' | 'completed'
  onToggle: () => void
  onSelect: (id: string) => void
  onTabChange: (tab: 'all' | 'pending' | 'completed') => void
}
```

### 5.2 Implementación

```tsx
const Rail = ({ 
  employees, 
  selectedId, 
  isExpanded, 
  activeTab,
  onToggle, 
  onSelect,
  onTabChange 
}: RailProps) => {
  
  const selectedEmployee = employees.find(e => e.id === selectedId);
  
  // Filtrar según tab activo
  const filteredEmployees = employees.filter(emp => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return emp.status !== 'completed';
    return emp.status === 'completed';
  });
  
  const counts = {
    all: employees.length,
    pending: employees.filter(e => e.status !== 'completed').length,
    completed: employees.filter(e => e.status === 'completed').length,
  };

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-40 
                 bg-gradient-to-t from-[#0F172A] via-[#0F172A] to-transparent 
                 flex flex-col justify-end border-t border-white/5 backdrop-blur-xl"
      initial={false}
      animate={{ 
        height: isExpanded ? 320 : 50,
        backgroundColor: isExpanded ? "rgba(15, 23, 42, 0.95)" : "transparent",
        borderColor: isExpanded ? "rgba(255,255,255,0.05)" : "transparent"
      }}
      transition={{ type: "spring", stiffness: 250, damping: 30 }}
    >
      
      {/* Toggle Bar - Siempre visible */}
      <div 
        className="px-8 h-[50px] flex justify-between items-center cursor-pointer 
                   hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Tu Equipo ({employees.length})
          </h3>
          <ChevronUp className={cn(
            "w-3 h-3 text-slate-600 transition-transform duration-300",
            isExpanded ? "rotate-180" : "rotate-0"
          )} />
        </div>
        
        {/* Mostrar nombre seleccionado cuando colapsado */}
        {!isExpanded && selectedId && selectedEmployee && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Viendo a:</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
              {selectedEmployee.displayName}
            </span>
          </div>
        )}
      </div>

      {/* Contenido expandible */}
      <div className={cn(
        "transition-opacity duration-200",
        isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        
        {/* TABS DE FILTRO */}
        <div className="px-8 pb-4 flex gap-2">
          {(['all', 'pending', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={(e) => {
                e.stopPropagation();
                onTabChange(tab);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                activeTab === tab
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-slate-800/50 text-slate-500 border border-slate-700 hover:text-slate-300"
              )}
            >
              {tab === 'all' && `Todos ${counts.all}`}
              {tab === 'pending' && `Pendientes ${counts.pending}`}
              {tab === 'completed' && `Completadas ${counts.completed}`}
            </button>
          ))}
        </div>
        
        {/* CARRUSEL HORIZONTAL */}
        <div className="flex overflow-x-auto gap-3 px-8 pb-6 
                        scrollbar-hide snap-x scroll-smooth">
          {filteredEmployees.map((employee) => (
            <EmployeeRailCard
              key={employee.id}
              employee={employee}
              isSelected={selectedId === employee.id}
              onClick={() => onSelect(employee.id)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
```

### 5.3 EmployeeRailCard

```tsx
const EmployeeRailCard = ({ 
  employee, 
  isSelected, 
  onClick 
}: { 
  employee: EmployeeCardData
  isSelected: boolean
  onClick: () => void 
}) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -5 }}
      className={cn(
        "snap-start flex-shrink-0 w-[160px] h-[200px] rounded-xl cursor-pointer",
        "transition-all duration-300 relative group overflow-hidden border",
        isSelected 
          ? "bg-slate-800 border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(34,211,238,0.15)]" 
          : "bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10"
      )}
    >
      {/* Línea Tesla Mini */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px] transition-all duration-300",
        isSelected 
          ? "bg-cyan-400 opacity-100" 
          : "bg-cyan-400 opacity-0 group-hover:opacity-50"
      )} />

      <div className="flex flex-col items-center justify-center h-full p-4">
        
        {/* Avatar */}
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center",
          "text-sm font-bold border transition-all mb-3 shadow-lg",
          isSelected 
            ? "bg-gradient-to-br from-slate-700 to-slate-800 border-cyan-500/30 text-white" 
            : "bg-slate-800 border-slate-700/50 text-slate-500 group-hover:text-slate-300"
        )}>
          {getInitials(employee.displayName)}
        </div>

        {/* Info */}
        <div className="text-center w-full space-y-1">
          <h4 className={cn(
            "font-bold text-xs truncate transition-colors",
            isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-200"
          )}>
            {employee.displayName}
          </h4>
          <p className="text-[9px] text-slate-600 truncate font-medium">
            {employee.position}
          </p>
        </div>
        
        {/* Status Indicator */}
        <div className="mt-3">
          <StatusDot status={employee.status} />
        </div>
      </div>
    </motion.div>
  );
};

const StatusDot = ({ status }: { status: string }) => {
  if (status === 'ready' || status === 'in_progress') {
    return <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />;
  }
  if (status === 'completed') {
    return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
  }
  return <div className="w-2 h-2 rounded-full bg-slate-700" />;
};
```

---

## 6. COMPONENTE: STATUS BADGE

```tsx
// src/components/evaluator/cinema/StatusBadge.tsx

import { Clock, CheckCircle2, Edit } from 'lucide-react';

type EmployeeStatus = 'ready' | 'waiting' | 'in_progress' | 'completed';

const STATUS_CONFIG = {
  ready: { 
    color: "text-cyan-400 bg-cyan-950/30 border-cyan-500/20", 
    icon: Clock, 
    text: "Listo para ti" 
  },
  waiting: { 
    color: "text-slate-400 bg-slate-800/50 border-slate-700", 
    icon: Clock, 
    text: "Espera auto" 
  },
  in_progress: { 
    color: "text-amber-400 bg-amber-950/30 border-amber-500/20", 
    icon: Edit, 
    text: "En progreso" 
  },
  completed: { 
    color: "text-emerald-400 bg-emerald-950/30 border-emerald-500/20", 
    icon: CheckCircle2, 
    text: "Completada" 
  },
};

export const StatusBadge = ({ status }: { status: EmployeeStatus }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-md border",
      "text-[10px] font-mono font-bold uppercase tracking-wide backdrop-blur-sm",
      config.color
    )}>
      <Icon className="w-3 h-3" />
      <span>{config.text}</span>
    </div>
  );
};
```

---

## 7. UTILIDADES

### 7.1 formatDisplayName (OBLIGATORIO)

```typescript
// src/lib/utils/formatName.ts

/**
 * Transforma nombres del backend a formato legible
 * 
 * "NUÑEZ AHUMADA,MARIA ANTONIETA" → "María Núñez"
 * "GUTIERREZ VELIZ,IVALU XIMENA" → "Ivalu Gutiérrez"
 * "Andres Soto" → "Andrés Soto"
 */
export function formatDisplayName(fullName: string): string {
  if (!fullName) return '';
  
  // Detectar formato "APELLIDO,NOMBRE"
  if (fullName.includes(',')) {
    const [apellidos, nombres] = fullName.split(',').map(s => s.trim());
    const primerNombre = toTitleCase(nombres.split(' ')[0]);
    const primerApellido = toTitleCase(apellidos.split(' ')[0]);
    return `${primerNombre} ${primerApellido}`;
  }
  
  // Formato normal "Nombre Apellido"
  return toTitleCase(fullName);
}

/**
 * Versión completa del nombre
 * "NUÑEZ AHUMADA,MARIA ANTONIETA" → "María Antonieta Núñez Ahumada"
 */
export function formatDisplayNameFull(fullName: string): string {
  if (!fullName) return '';
  
  if (fullName.includes(',')) {
    const [apellidos, nombres] = fullName.split(',').map(s => s.trim());
    return `${toTitleCase(nombres)} ${toTitleCase(apellidos)}`;
  }
  
  return toTitleCase(fullName);
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Obtener iniciales para avatar
 */
export function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '??';
}
```

### 7.2 Calcular Insights

```typescript
// src/lib/utils/calculateInsights.ts

import { Calendar, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function calculateInsights(employee: EmployeeData): Insight[] {
  const insights: Insight[] = [];
  
  // Siempre: Antigüedad
  insights.push({
    type: 'tenure',
    icon: Calendar,
    label: 'Antigüedad',
    value: employee.tenure || 'Sin datos',
    variant: 'default'
  });
  
  // Si tiene score previo
  if (employee.lastScore) {
    insights.push({
      type: 'lastScore',
      icon: TrendingUp,
      label: 'Última Evaluación',
      value: employee.lastScore,
      variant: 'default'
    });
  }
  
  // Si tiene gap detectado (futuro)
  if (employee.gap) {
    insights.push({
      type: 'gap',
      icon: AlertTriangle,
      label: 'Foco Detectado',
      value: `Se recomienda observar: ${employee.gap}`,
      variant: 'warning'
    });
  }
  
  // Estado de autoevaluación
  if (employee.selfEvalStatus === 'completed') {
    insights.push({
      type: 'selfEval',
      icon: CheckCircle2,
      label: 'Autoevaluación',
      value: 'Completada',
      variant: 'success'
    });
  }
  
  return insights;
}
```

---

## 8. HOOK: useEvaluatorCinemaMode

```typescript
// src/hooks/useEvaluatorCinemaMode.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatDisplayName, formatDisplayNameFull } from '@/lib/utils/formatName';
import { calculateInsights } from '@/lib/utils/calculateInsights';

export function useEvaluatorCinemaMode() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRailExpanded, setRailExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/evaluator/assignments');
        if (!res.ok) throw new Error('Error cargando datos');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Transformar datos
  const employees = useMemo(() => {
    if (!data?.assignments) return [];
    
    return data.assignments.map(a => ({
      id: a.id,
      fullName: a.evaluatee.fullName,
      displayName: formatDisplayName(a.evaluatee.fullName),
      displayNameFull: formatDisplayNameFull(a.evaluatee.fullName),
      position: a.evaluatee.position || 'Sin cargo',
      departmentName: a.evaluatee.departmentName || 'Sin departamento',
      tenure: a.evaluatee.tenure || 'Sin datos',
      status: mapStatus(a.status),
      participantToken: a.participantToken,
    }));
  }, [data]);

  // Empleado seleccionado
  const selectedEmployee = useMemo(() => {
    if (!selectedId) return null;
    const emp = employees.find(e => e.id === selectedId);
    if (!emp) return null;
    return {
      ...emp,
      insights: calculateInsights(emp)
    };
  }, [selectedId, employees]);

  // Siguiente empleado (prioridad)
  const nextEmployee = useMemo(() => {
    return employees.find(e => e.status === 'ready' || e.status === 'in_progress')
      || employees.find(e => e.status === 'waiting')
      || null;
  }, [employees]);

  // Handlers
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setRailExpanded(false);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedId(null);
    setRailExpanded(true);
  }, []);

  const handleEvaluate = useCallback((token: string) => {
    window.location.href = `/encuesta/${token}`;
  }, []);

  const handleToggleRail = useCallback(() => {
    setRailExpanded(prev => !prev);
  }, []);

  return {
    // Data
    employees,
    selectedEmployee,
    nextEmployee,
    stats: data?.stats || { total: 0, completed: 0, pending: 0 },
    cycle: data?.cycle || null,
    
    // UI State
    selectedId,
    isRailExpanded,
    activeTab,
    isLoading,
    error,
    
    // Actions
    handleSelect,
    handleBack,
    handleEvaluate,
    handleToggleRail,
    setActiveTab,
  };
}

function mapStatus(apiStatus: string): 'ready' | 'waiting' | 'in_progress' | 'completed' {
  switch (apiStatus) {
    case 'COMPLETED': return 'completed';
    case 'IN_PROGRESS': return 'in_progress';
    case 'PENDING': return 'ready'; // Simplificado, ajustar según selfEval
    default: return 'ready';
  }
}
```

---

## 9. ORQUESTADOR PRINCIPAL

```tsx
// src/app/dashboard/evaluaciones/components/CinemaModeOrchestrator.tsx

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEvaluatorCinemaMode } from '@/hooks/useEvaluatorCinemaMode';

import MissionControl from '@/components/evaluator/cinema/MissionControl';
import SpotlightCard from '@/components/evaluator/cinema/SpotlightCard';
import VictoryScreen from '@/components/evaluator/cinema/VictoryScreen';
import Rail from '@/components/evaluator/cinema/Rail';
import CinemaHeader from '@/components/evaluator/cinema/CinemaHeader';

export default function CinemaModeOrchestrator() {
  const {
    employees,
    selectedEmployee,
    nextEmployee,
    stats,
    cycle,
    selectedId,
    isRailExpanded,
    activeTab,
    isLoading,
    error,
    handleSelect,
    handleBack,
    handleEvaluate,
    handleToggleRail,
    setActiveTab,
  } = useEvaluatorCinemaMode();

  // Determinar vista
  const isVictory = stats.pending === 0 && stats.total > 0;
  const isSpotlight = selectedId !== null && selectedEmployee !== null;

  if (isLoading) return <CinemaModeSkeleton />;
  if (error) return <CinemaModeError error={error} />;

  return (
    <div className="h-screen w-full bg-[#0F172A] text-white flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <CinemaHeader cycle={cycle} />

      {/* Stage */}
      <div className={cn(
        "flex-1 relative flex items-center justify-center p-4 md:p-8",
        "transition-all duration-500 ease-in-out",
        isRailExpanded ? "mb-[320px]" : "mb-[50px]"
      )}>
        <AnimatePresence mode="wait">
          
          {isVictory && (
            <VictoryScreen 
              key="victory"
              total={stats.total}
              onViewTeam={handleToggleRail}
            />
          )}
          
          {!isVictory && !isSpotlight && (
            <MissionControl
              key="lobby"
              stats={stats}
              cycle={cycle}
              nextEmployee={nextEmployee}
              onStart={handleSelect}
            />
          )}
          
          {!isVictory && isSpotlight && (
            <SpotlightCard
              key={`spotlight-${selectedId}`}
              employee={selectedEmployee}
              insights={selectedEmployee.insights}
              onBack={handleBack}
              onEvaluate={handleEvaluate}
            />
          )}
          
        </AnimatePresence>
      </div>

      {/* Rail */}
      <Rail
        employees={employees}
        selectedId={selectedId}
        isExpanded={isRailExpanded}
        activeTab={activeTab}
        onToggle={handleToggleRail}
        onSelect={handleSelect}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
```

---

## 10. ESTRUCTURA DE ARCHIVOS

```
src/
├── app/
│   └── dashboard/
│       └── evaluaciones/
│           ├── page.tsx
│           └── components/
│               └── CinemaModeOrchestrator.tsx
│
├── components/
│   └── evaluator/
│       └── cinema/
│           ├── MissionControl.tsx
│           ├── SegmentedRing.tsx
│           ├── SpotlightCard.tsx
│           ├── InsightCard.tsx
│           ├── VictoryScreen.tsx
│           ├── Rail.tsx
│           ├── EmployeeRailCard.tsx
│           ├── StatusBadge.tsx
│           ├── StatusDot.tsx
│           └── CinemaHeader.tsx
│
├── hooks/
│   └── useEvaluatorCinemaMode.ts
│
└── lib/
    └── utils/
        ├── formatName.ts
        └── calculateInsights.ts
```

---

## 11. CHECKLIST FINAL

### Funcionalidad
- [ ] Lobby con anillo segmentado SVG
- [ ] CTA "Siguiente: [Nombre]" funciona
- [ ] Rail se colapsa al seleccionar
- [ ] Rail se expande al volver
- [ ] Tabs filtran correctamente
- [ ] Spotlight muestra datos formateados
- [ ] Botón "Evaluar" navega a /encuesta/[token]
- [ ] Victory aparece al 100%

### Visual
- [ ] Línea Tesla con glow
- [ ] Nombres formateados (nunca mayúsculas raw)
- [ ] Anillo con gaps y round caps
- [ ] Porcentaje en font monospace
- [ ] Glassmorphism en cards
- [ ] Animaciones suaves (spring)

### Datos
- [ ] Conectado a /api/evaluator/assignments
- [ ] formatDisplayName aplicado a todos los nombres
- [ ] Insights calculados dinámicamente
- [ ] Estados mapeados correctamente

---

## 12. PROMPT PARA CLAUDE CODE

```
Lee y ejecuta: .claude/task/TASK_PORTAL_JEFE_CINEMA_MODE_v5.md

BASADO EN: Código Gemini funcional (referencia en el Task)

CRÍTICO:
1. Anillo SVG segmentado con strokeDasharray + strokeLinecap="round"
2. Rail COLAPSABLE (280px → 50px), no desaparece
3. formatDisplayName() para TODOS los nombres
4. Línea Tesla con gradient + boxShadow glow
5. Tabs de filtro en el Rail

DISEÑO: .claude/docs/focalizahr-ui-design-standards.md

Fase por fase, validando compilación.
```

---

**FocalizaHR Cinema Mode v5.0**
*Basado en código que YA funciona.*
