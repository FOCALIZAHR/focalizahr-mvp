# 🔧 CORRECCIÓN QUIRÚRGICA: CINEMA MODE v5.1

## CONTEXTO
El Cinema Mode v5 tiene problemas visuales y perdió funcionalidades del portal original.
Este prompt corrige SIN reescribir - solo ajustes específicos.

---

## 🚫 ARCHIVOS QUE NO DEBES TOCAR (YA FUNCIONAN)

**EVALUACIÓN REAL (1 Feb 2025) confirmó que estos YA FUNCIONAN:**

```
❌ NO MODIFICAR ESTOS ARCHIVOS:
├── src/app/dashboard/evaluaciones/[assignmentId]/page.tsx  ← Welcome FUNCIONA
├── src/components/survey/WelcomeScreenManager.tsx          ← Welcome FUNCIONA
```

**El punto 7 (Página Welcome) está VERIFICADO y FUNCIONANDO.**
- Click [Evaluar] → Va a Welcome → Luego a Survey ✅
- NO implementar el código de referencia del punto 7
- Si ves código del punto 7 en este prompt, es SOLO REFERENCIA histórica

---

## REFERENCIAS (leer antes de implementar)
- Diseño UI: `.claude/docs/focalizahr-ui-design-standards.md`
- Gauge existente: `src/app/dashboard/system/page.tsx` (ScoreGauge)
- Botones premium: `src/components/ui/PremiumButton.tsx`
- API evaluator: `src/app/api/evaluator/assignments/route.ts`
- **Toast system:** `src/components/ui/toast-system.tsx` (OBLIGATORIO para punto 11)

---

## 🎯 CORRECCIONES VISUALES (6 puntos)

### 1. GAUGE: Usar Componente Existente

**Problema:** El anillo actual se ve pixelado/dibujado.

**Solución:** Copiar el `ScoreGauge` de `src/app/dashboard/system/page.tsx` y adaptarlo.

```tsx
// Buscar en src/app/dashboard/system/page.tsx el componente ScoreGauge
// Copiarlo a src/components/evaluator/cinema/SegmentedRing.tsx
// Adaptarlo para mostrar segmentos por persona

// El ScoreGauge existente tiene:
// - strokeLinecap="round"
// - filter: drop-shadow(0 0 4px ${strokeColor})
// - motion.circle con animación
// - Colores cyan/purple configurables
```

---

### 2. BOTÓN CTA EN RAIL COLAPSADO

**Problema:** Cuando rail está colapsado (50px), no hay forma obvia de expandirlo.

**Solución:** Agregar botón "Ver mi equipo" siempre visible en toggle bar.

```tsx
// En Rail.tsx, dentro del toggle bar (h-[50px])

<div className="px-8 h-[50px] flex justify-between items-center">
  {/* Izquierda: Título + chevron */}
  <div className="flex items-center gap-3">
    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
      Tu Equipo ({employees.length})
    </h3>
    <ChevronUp className={cn(
      "w-3 h-3 text-slate-600 transition-transform",
      isExpanded ? "rotate-180" : "rotate-0"
    )} />
  </div>
  
  {/* Centro: Info cuando colapsado */}
  {!isExpanded && selectedId && (
    <span className="text-[10px] text-slate-400">
      Viendo a: <span className="text-cyan-400 font-mono font-bold">{selectedEmployee?.displayName}</span>
    </span>
  )}
  
  {/* NUEVO: Botón CTA siempre visible */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 
               px-4 py-1.5 rounded-full text-[10px] font-bold 
               uppercase tracking-wider transition-all
               shadow-[0_2px_10px_rgba(34,211,238,0.3)]"
  >
    {isExpanded ? 'Ocultar' : 'Ver Equipo'}
  </button>
</div>
```

---

### 3. BACKDROP BLUR CUANDO RAIL EXPANDIDO

**Problema:** El gauge/lobby se ve detrás del carrusel, genera ruido visual.

**Solución:** Agregar overlay blur cuando rail está expandido.

```tsx
// En CinemaModeOrchestrator.tsx, antes del Rail

{/* Backdrop blur cuando rail expandido */}
<AnimatePresence>
  {isRailExpanded && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30"
      onClick={handleToggleRail}
    />
  )}
</AnimatePresence>

{/* Rail debe tener z-40 para estar encima del backdrop */}
<Rail className="z-40" ... />
```

---

### 4. TABS PREMIUM CON COLORES SÓLIDOS

**Problema:** Los tabs se ven genéricos, no premium.

**Solución:** Usar colores sólidos cyan/purple según filosofía FocalizaHR.

```tsx
// En CarouselTabs.tsx o dentro de Rail.tsx

const TAB_STYLES = {
  all: {
    active: 'bg-cyan-400 text-slate-950 shadow-[0_2px_10px_rgba(34,211,238,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
  pending: {
    active: 'bg-purple-400 text-slate-950 shadow-[0_2px_10px_rgba(167,139,250,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
  completed: {
    active: 'bg-emerald-400 text-slate-950 shadow-[0_2px_10px_rgba(16,185,129,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  }
};

// Renderizar tabs
{(['all', 'pending', 'completed'] as const).map((tab) => {
  const isActive = activeTab === tab;
  const styles = TAB_STYLES[tab];
  
  return (
    <button
      key={tab}
      onClick={() => onTabChange(tab)}
      className={cn(
        "px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all",
        isActive ? styles.active : styles.inactive
      )}
    >
      {tab === 'all' && `Todos ${counts.all}`}
      {tab === 'pending' && `Pendientes ${counts.pending}`}
      {tab === 'completed' && `Completadas ${counts.completed}`}
    </button>
  );
})}
```

---

### 5. FLECHAS NAVEGACIÓN CARRUSEL

**Problema:** Usuarios de computador no tienen forma obvia de navegar sin scroll táctil.

**Solución:** Agregar flechas a los costados.

```tsx
// En Rail.tsx, envolver el carrusel con contenedor relativo

import { ChevronLeft, ChevronRight } from 'lucide-react';

// Referencia al contenedor del carrusel
const carouselRef = useRef<HTMLDivElement>(null);

const scrollLeft = () => {
  carouselRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
};

const scrollRight = () => {
  carouselRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
};

// En el JSX
<div className="relative">
  {/* Flecha izquierda */}
  <button
    onClick={scrollLeft}
    className="absolute left-2 top-1/2 -translate-y-1/2 z-10
               w-10 h-10 bg-slate-800/90 hover:bg-slate-700 
               rounded-full flex items-center justify-center
               border border-slate-700 shadow-lg
               opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <ChevronLeft className="w-5 h-5 text-white" />
  </button>
  
  {/* Carrusel */}
  <div 
    ref={carouselRef}
    className="flex overflow-x-auto gap-3 px-8 pb-6 scrollbar-hide snap-x scroll-smooth group"
  >
    {filteredEmployees.map((employee) => (
      <EmployeeRailCard key={employee.id} ... />
    ))}
  </div>
  
  {/* Flecha derecha */}
  <button
    onClick={scrollRight}
    className="absolute right-2 top-1/2 -translate-y-1/2 z-10
               w-10 h-10 bg-slate-800/90 hover:bg-slate-700 
               rounded-full flex items-center justify-center
               border border-slate-700 shadow-lg
               opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <ChevronRight className="w-5 h-5 text-white" />
  </button>
</div>
```

---

### 6. DATOS RICOS EN SPOTLIGHT CARD

**Problema:** La SpotlightCard perdió datos que el backend SÍ envía.

**Solución:** Mostrar todos los datos disponibles.

```tsx
// En SpotlightCard.tsx

// COLUMNA IZQUIERDA (Identidad)
<div className="text-center mt-4">
  <h2 className="text-2xl font-bold text-white mb-1">
    {employee.displayNameFull}
  </h2>
  <p className="text-sm text-slate-400 font-medium">
    {employee.position || 'Sin cargo'}
  </p>
  {/* AGREGAR: Departamento */}
  <p className="text-[10px] text-slate-600 font-mono mt-2 uppercase tracking-widest">
    {employee.departmentName || 'Sin departamento'}
  </p>
</div>

// COLUMNA DERECHA (Insights) - Grid de datos
<div className="grid grid-cols-2 gap-4 mb-8">
  
  {/* Antigüedad - SIEMPRE */}
  <InsightCard
    icon={Calendar}
    label="Antigüedad"
    value={employee.tenure || 'Sin datos'}
    variant="default"
  />
  
  {/* Tipo Evaluación - AGREGAR */}
  <InsightCard
    icon={ClipboardList}
    label="Tipo"
    value={employee.evaluationType || 'Evaluación'}
    variant="default"
  />
  
  {/* SOLO SI PENDIENTE: Fecha límite */}
  {employee.status !== 'completed' && employee.dueDate && (
    <InsightCard
      icon={Clock}
      label="Fecha Límite"
      value={formatDate(employee.dueDate)}
      variant={isUrgent(employee.dueDate) ? 'warning' : 'default'}
    />
  )}
  
  {/* SOLO SI COMPLETADA: Score promedio */}
  {employee.status === 'completed' && employee.avgScore && (
    <InsightCard
      icon={TrendingUp}
      label="Score Promedio"
      value={`${employee.avgScore.toFixed(1)}/5`}
      variant="success"
    />
  )}
  
  {/* SOLO SI COMPLETADA: Fecha completado */}
  {employee.status === 'completed' && employee.completedAt && (
    <InsightCard
      icon={CheckCircle}
      label="Completada"
      value={formatDate(employee.completedAt)}
      variant="success"
    />
  )}
</div>

// BOTONES según estado
<div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-800">
  
  {/* PENDIENTE: Botón Evaluar */}
  {employee.status !== 'completed' && employee.participantToken && (
    <button 
      onClick={() => onEvaluate(employee.participantToken!)}
      className="flex-1 h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 
                 hover:to-cyan-400 text-white rounded-xl font-semibold 
                 shadow-lg shadow-cyan-500/20 transition-all 
                 flex items-center justify-center gap-3"
    >
      <Zap className="w-5 h-5" />
      <span>EVALUAR AHORA</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  )}
  
  {/* COMPLETADA: Botón Ver Resumen */}
  {employee.status === 'completed' && (
    <button 
      onClick={() => onViewSummary(employee.id)}
      className="flex-1 h-14 bg-emerald-500/10 border border-emerald-500/30 
                 text-emerald-400 hover:bg-emerald-500/20 rounded-xl 
                 font-semibold flex items-center justify-center gap-3"
    >
      <Eye className="w-5 h-5" />
      <span>VER RESUMEN</span>
    </button>
  )}
  
  {/* Siempre: Botón Historial (ghost) */}
  <button className="h-14 px-6 rounded-xl border border-slate-700 
                     text-slate-400 hover:text-white hover:border-slate-500 
                     hover:bg-slate-800/50 transition-all text-sm font-medium">
    Historial
  </button>
</div>
```

---

## 🔄 FUNCIONALIDADES PERDIDAS A RESTAURAR

### 7. PÁGINA WELCOME - ✅ YA FUNCIONA (NO MODIFICAR)

**Evaluación real (1 Feb 2025):** El usuario confirmó que Welcome SÍ funciona.
- Click [Evaluar] → Va a Welcome → Luego a Survey ✅

**⚠️ NO TOCAR ESTOS ARCHIVOS:**
- `src/app/dashboard/evaluaciones/[assignmentId]/page.tsx`
- `src/components/survey/WelcomeScreenManager.tsx`

**Nota:** Si faltan datos en Welcome (cargo, departamento, tenure), eso se corrige en el punto 6 (SpotlightCard) que comparte los mismos datos.

---
⚠️ **CÓDIGO DE REFERENCIA ABAJO** - Solo usar si Welcome NO funciona (pero el usuario confirmó que SÍ funciona). 
Mantener como referencia para comparar o si se rompe en el futuro.
---

```tsx
// REFERENCIA: src/app/dashboard/evaluaciones/[assignmentId]/page.tsx

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import WelcomeScreenManager from '@/components/survey/WelcomeScreenManager';

interface PageProps {
  params: Promise<{ assignmentId: string }>;
}

export default async function EvaluarWelcomePage({ params }: PageProps) {
  const { assignmentId } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login?redirect=/dashboard/evaluaciones');
  }
  
  // Fetch assignment data
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/evaluator/assignments/${assignmentId}`, {
    headers: { /* auth headers */ }
  });
  
  if (!res.ok) {
    redirect('/dashboard/evaluaciones');
  }
  
  const { assignment } = await res.json();
  
  // Si ya completado, redirect al summary
  if (assignment.status === 'completed') {
    redirect(`/dashboard/evaluaciones/${assignmentId}?view=summary`);
  }
  
  return (
    <WelcomeScreenManager
      evaluatee={assignment.evaluatee}
      estimatedMinutes={10}
      surveyToken={assignment.participantToken}
      onBack="/dashboard/evaluaciones"
    />
  );
}
```

**Componente WelcomeScreenManager:** `src/components/survey/WelcomeScreenManager.tsx`

```tsx
'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Building2, Calendar, Clock, ArrowLeft, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface WelcomeScreenManagerProps {
  evaluatee: {
    fullName: string;
    position: string;
    departmentName: string;
    tenure: string;
  };
  estimatedMinutes: number;
  surveyToken: string;
  onBack: string;
}

export default memo(function WelcomeScreenManager({
  evaluatee,
  estimatedMinutes,
  surveyToken,
  onBack
}: WelcomeScreenManagerProps) {
  const router = useRouter();
  
  const handleStart = () => {
    router.push(`/encuesta/${surveyToken}`);
  };
  
  const firstName = evaluatee.fullName.split(' ')[0];
  
  // Obtener iniciales
  const initials = evaluatee.fullName
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
  
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 
                   rounded-2xl max-w-md w-full p-8 text-center relative overflow-hidden"
      >
        {/* Línea Tesla */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]" 
          style={{ 
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 15px #22D3EE'
          }}
        />
        
        {/* Avatar */}
        <div className="mb-6">
          <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br 
                          from-slate-700 to-slate-800 border border-slate-600
                          flex items-center justify-center shadow-xl">
            <span className="text-2xl font-bold text-slate-300">
              {initials}
            </span>
          </div>
        </div>
        
        {/* Nombre */}
        <h1 className="text-2xl font-bold text-white mb-6">
          {evaluatee.fullName}
        </h1>
        
        {/* Datos del evaluado */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3 text-slate-300">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <span>{evaluatee.position || 'Sin cargo'}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>{evaluatee.departmentName || 'Sin departamento'}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <span>{evaluatee.tenure || 'Sin datos'} en la empresa</span>
          </div>
        </div>
        
        {/* Mensaje motivacional */}
        <p className="text-slate-400 mb-8 leading-relaxed">
          Tu evaluación ayudará a <span className="text-cyan-400 font-medium">{firstName}</span> a 
          identificar sus fortalezas y oportunidades de desarrollo.
          <br /><br />
          <span className="text-slate-500">
            Tómate el tiempo necesario para dar feedback constructivo y específico.
          </span>
        </p>
        
        {/* CTA Principal */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 
                     hover:to-cyan-400 text-white rounded-xl font-semibold 
                     text-lg shadow-lg shadow-cyan-500/25 transition-all
                     flex items-center justify-center gap-3 mb-4"
        >
          <Zap className="w-5 h-5" />
          Comenzar Evaluación
        </button>
        
        {/* Volver */}
        <button
          onClick={() => router.push(onBack)}
          className="w-full py-3 border border-slate-700 text-slate-400 
                     hover:text-white hover:border-slate-500 rounded-xl
                     flex items-center justify-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Portal
        </button>
        
        {/* Tiempo estimado */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Clock className="w-4 h-4" />
          <span>Tiempo estimado: ~{estimatedMinutes} minutos</span>
        </div>
      </motion.div>
    </div>
  );
});
```

**Actualizar handleEvaluate en Cinema Mode:**

```tsx
// En useEvaluatorCinemaMode.ts o CinemaModeOrchestrator.tsx

const handleEvaluate = useCallback((assignmentId: string, token: string | null) => {
  // ANTES: router.push(`/encuesta/${token}`)
  // AHORA: Ir a Welcome primero
  router.push(`/dashboard/evaluaciones/${assignmentId}`);
}, [router]);
```

---

### 8. PÁGINA SUMMARY (EVALUACIONES COMPLETADAS) - ❌ PROBLEMA REAL DETECTADO

**Evaluación real (1 Feb 2025):** El botón "Ver Resumen" EXISTE pero NO navega a ningún lado.

**El problema NO es que falte la página, es que:**
1. El botón en SpotlightCard no tiene `onClick` conectado
2. O el handler `handleViewSummary` no existe/no está pasado al componente

**PASO 1: Verificar si la página existe:**
```
src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
```

**PASO 2: Conectar el botón (ESTO ES LO QUE FALTA):**

En SpotlightCard.tsx, buscar el botón de completadas y agregar onClick:
```tsx
{employee.status === 'completed' && (
  <button 
    onClick={() => onViewSummary(employee.id)}  // ← AGREGAR ESTO
    className="..."
  >
    VER RESUMEN
  </button>
)}
```

En el hook o componente padre, crear el handler:
```tsx
const handleViewSummary = useCallback((assignmentId: string) => {
  router.push(`/dashboard/evaluaciones/${assignmentId}/summary`);
}, [router]);
```

Y pasarlo al componente:
```tsx
<SpotlightCard onViewSummary={handleViewSummary} ... />
```

**PASO 3: Si la página NO existe, crearla:**

**Ubicación:** `src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx`

```tsx
// src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

interface PageProps {
  params: Promise<{ assignmentId: string }>;
}

export default async function EvaluationSummaryPage({ params }: PageProps) {
  const { assignmentId } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Fetch summary data
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/evaluator/assignments/${assignmentId}/summary`,
    { headers: { /* auth */ } }
  );
  
  if (!res.ok) {
    redirect('/dashboard/evaluaciones');
  }
  
  const { summary } = await res.json();
  
  return (
    <div className="min-h-screen bg-[#0F172A] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/evaluaciones')}
            className="text-slate-400 hover:text-white flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Mis Evaluaciones
          </button>
          
          <h1 className="text-2xl font-bold text-white">
            Resumen de Evaluación
          </h1>
          <p className="text-slate-400">
            {summary.evaluatee.fullName} · {summary.evaluatee.position}
          </p>
        </div>
        
        {/* Banner Read-Only */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 
                        flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-emerald-400 font-medium">Evaluación Completada</p>
            <p className="text-emerald-400/70 text-sm">
              Completada el {formatDate(summary.completedAt)}
            </p>
          </div>
        </div>
        
        {/* Score Promedio */}
        {summary.averageScore && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-slate-400 text-sm mb-2">Score Promedio</p>
            <p className="text-4xl font-bold text-cyan-400">
              {summary.averageScore.toFixed(1)}<span className="text-xl text-slate-500">/5</span>
            </p>
          </div>
        )}
        
        {/* Respuestas por Categoría */}
        {Object.entries(summary.categorizedResponses).map(([category, responses]) => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">{category}</h3>
            <div className="space-y-3">
              {responses.map((r: any) => (
                <div key={r.questionId} className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-300 text-sm mb-2">{r.questionText}</p>
                  {r.rating && (
                    <p className="text-cyan-400 font-medium">{r.rating}/5</p>
                  )}
                  {r.textResponse && (
                    <p className="text-slate-400 italic">"{r.textResponse}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
      </div>
    </div>
  );
}
```

**Actualizar handleViewSummary en Cinema Mode:**

```tsx
const handleViewSummary = useCallback((assignmentId: string) => {
  router.push(`/dashboard/evaluaciones/${assignmentId}/summary`);
}, [router]);
```

---

### 9. VICTORY SCREEN CON CONFETTI

**Original:** Estado 100% completado con confetti y mensaje de éxito
**Actual:** VictoryScreen básico

**Instalar dependencia:**
```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

**Actualizar VictoryScreen.tsx:**

```tsx
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Users, ArrowRight } from 'lucide-react';

interface VictoryScreenProps {
  total: number;
  onViewTeam: () => void;
}

export default function VictoryScreen({ total, onViewTeam }: VictoryScreenProps) {
  
  useEffect(() => {
    // Disparar confetti al montar
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22D3EE', '#A78BFA', '#10B981']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22D3EE', '#A78BFA', '#10B981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
      className="text-center max-w-md mx-auto"
    >
      {/* Trophy animado */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="mb-8"
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 
                        rounded-full flex items-center justify-center shadow-xl 
                        shadow-amber-500/30">
          <Trophy className="w-12 h-12 text-white" />
        </div>
      </motion.div>
      
      {/* Mensaje principal */}
      <h2 className="text-3xl font-bold text-white mb-4">
        ¡Misión Cumplida!
      </h2>
      
      <p className="text-slate-400 mb-2">
        Completaste todas las evaluaciones de tu equipo.
      </p>
      
      <p className="text-cyan-400 font-medium mb-8">
        Tu feedback es valioso para el desarrollo de {total} colaboradores.
      </p>
      
      {/* Stats */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-center gap-4">
          <Users className="w-8 h-8 text-emerald-400" />
          <div className="text-left">
            <p className="text-2xl font-bold text-white">{total}</p>
            <p className="text-slate-400 text-sm">Evaluaciones completadas</p>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <button
        onClick={onViewTeam}
        className="bg-gradient-to-r from-cyan-500 to-purple-500 
                   text-white px-8 py-4 rounded-xl font-semibold
                   shadow-lg hover:shadow-xl transition-all
                   flex items-center justify-center gap-3 mx-auto"
      >
        Ver mi equipo
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
```

---

### 10. ESTADO VACÍO (Sin Asignaciones)

**Verificar** que el estado vacío se muestre correctamente:

```tsx
// En CinemaModeOrchestrator.tsx

if (!isLoading && employees.length === 0) {
  return (
    <div className="h-screen w-full bg-[#0F172A] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto p-8"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-slate-800 rounded-full 
                        flex items-center justify-center">
          <ClipboardList className="w-10 h-10 text-slate-600" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-3">
          No tienes evaluaciones asignadas
        </h2>
        
        <p className="text-slate-400 mb-6">
          Actualmente no hay ciclos de evaluación activos donde debas evaluar colaboradores.
        </p>
        
        <button
          onClick={() => router.push('/dashboard')}
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
      </motion.div>
    </div>
  );
}
```

---

### 11. TOAST CONFIRMACIÓN POST-ENVÍO

**Verificar** que el survey muestre toast al completar.

Si no existe, agregar en el handler de submit del survey:

```tsx
import { useToast } from '@/hooks/use-toast';

// En el handler de submit exitoso
const { toast } = useToast();

toast({
  title: '✅ Evaluación Enviada',
  description: `Tu evaluación de ${evaluateeName} ha sido enviada correctamente.`,
  duration: 5000
});

// Esperar un momento para que se vea el toast
await new Promise(resolve => setTimeout(resolve, 2000));

// Redirect al portal
router.push('/dashboard/evaluaciones');
```

---

### 12. BREADCRUMBS (Opcional pero recomendado)

**Agregar** navegación clara en páginas internas:

```tsx
// Componente reutilizable
interface BreadcrumbItem {
  label: string;
  href?: string;
}

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="w-4 h-4" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-white transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-white">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

// Uso en Welcome:
<Breadcrumbs items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Mis Evaluaciones', href: '/dashboard/evaluaciones' },
  { label: evaluatee.fullName }
]} />

// Uso en Summary:
<Breadcrumbs items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Mis Evaluaciones', href: '/dashboard/evaluaciones' },
  { label: 'Resumen' }
]} />
```

---

## ✅ CHECKLIST DE CORRECCIÓN COMPLETO

### 📊 EVALUACIÓN REAL DEL USUARIO (1 Feb 2025)

### Visual (Puntos 1-6)
- [ ] 1. Gauge usa componente existente (ScoreGauge adaptado) - ⚠️ Se ve pixelado
- [ ] 2. Botón "Ver Equipo" visible en rail colapsado - ❓ NO EVALUADO
- [ ] 3. Backdrop blur cuando rail expandido - ❓ NO EVALUADO
- [ ] 4. Tabs con colores sólidos premium (cyan/purple/emerald) - ❓ NO EVALUADO
- [ ] 5. Flechas navegación en carrusel - ❓ NO EVALUADO
- [ ] 6. SpotlightCard muestra todos los datos del backend - ⚠️ FALTAN DATOS

### Funcionalidades (Puntos 7-12)
- [x] 7. Página Welcome existe y funciona - ✅ **CONFIRMADO FUNCIONA**
- [ ] 8. Página Summary existe y funciona (read-only) - ❌ **BOTÓN SIN LINK** (existe botón pero NO navega)
- [ ] 9. VictoryScreen tiene confetti - ❓ NO EVALUADO
- [ ] 10. Estado vacío funciona correctamente - ❓ NO EVALUADO (no probado)
- [ ] 11. Toast confirmación post-envío - ❌ **NO EXISTE** (usar sistema FocalizaHR)
- [ ] 12. Breadcrumbs en páginas internas (opcional) - ➖ OPCIONAL

### Navegación (Verificar flujos completos)
- [x] Click "Evaluar Ahora" → va a Welcome (NO directo a survey) - ✅ **FUNCIONA**
- [ ] Click "Ver Resumen" → va a Summary (completadas) - ❌ **ROTO**
- [ ] Completar survey → Toast → Redirect a portal - ❌ **SIN TOAST**
- [ ] 100% completado → VictoryScreen con confetti - ❓ NO EVALUADO

---

## 🎯 ORDEN DE EJECUCIÓN ACTUALIZADO (Post-Evaluación)

### ⚠️ IMPORTANTE: NO TOCAR lo que ya funciona
- ✅ Welcome funciona → NO MODIFICAR
- ✅ Navegación a Welcome funciona → NO MODIFICAR

### Fase 1: CRÍTICOS (Hacer primero)
1. **Punto 8:** Conectar botón "Ver Resumen" → página Summary - 30 min
2. **Punto 11:** Agregar toast post-envío con sistema FocalizaHR - 20 min

### Fase 2: Datos faltantes
3. **Punto 6:** Completar datos en SpotlightCard - 20 min

### Fase 3: Correcciones Visuales (según comentarios usuario)
4. **Punto 1:** Gauge pixelado → usar ScoreGauge existente - 45 min
5. **Punto 2:** Botón CTA en rail colapsado - 10 min
6. **Punto 3:** Backdrop blur cuando rail expandido - 5 min
7. **Punto 4:** Tabs con colores sólidos premium - 15 min
8. **Punto 5:** Flechas navegación carrusel - 15 min

### Fase 4: Polish (si hay tiempo)
9. **Punto 9:** VictoryScreen con confetti - 15 min
10. **Punto 10:** Estado vacío - 10 min
11. **Punto 12:** Breadcrumbs (opcional) - 10 min

**Total estimado: 2-3 horas** (menos porque Welcome ya funciona)

---

## 📁 ARCHIVOS A MODIFICAR/CREAR

```
🚫 NO TOCAR (Ya funciona):
├── src/app/dashboard/evaluaciones/[assignmentId]/page.tsx  # Welcome ✅
├── src/components/survey/WelcomeScreenManager.tsx          # Welcome ✅

MODIFICAR:
├── src/components/evaluator/cinema/
│   ├── Rail.tsx                    # Puntos 2,3,4,5
│   ├── SpotlightCard.tsx           # Punto 6, 8 (conectar botón Ver Resumen)
│   ├── VictoryScreen.tsx           # Punto 9
│   ├── SegmentedRing.tsx           # Punto 1 (gauge)
│   └── CinemaModeOrchestrator.tsx  # Punto 3,10

├── src/hooks/
│   └── useEvaluatorCinemaMode.ts   # Handler handleViewSummary

├── src/app/encuesta/[token]/
│   └── (buscar donde se hace submit) # Punto 11 (toast)

VERIFICAR/CREAR:
├── src/app/dashboard/evaluaciones/
│   └── [assignmentId]/
│       └── summary/
│           └── page.tsx            # Punto 8 (Summary read-only)

REFERENCIA OBLIGATORIA PARA TOAST:
├── src/components/ui/toast-system.tsx  # Sistema FocalizaHR
│   └── useToast() → { success, error, warning, info }
```

---

## ⚠️ NOTAS IMPORTANTES

1. **NO reescribir componentes completos** - Solo modificar lo necesario
2. **Validar compilación** después de cada cambio
3. **El gauge pixelado** es el cambio más delicado - dejarlo para el final
4. **Verificar que Welcome/Summary existan** antes de crear - puede que ya estén pero rotos
5. **Instalar canvas-confetti** antes de punto 9: `npm install canvas-confetti`

---

**Ejecutar correcciones una por una, validando compilación entre cada una.**
