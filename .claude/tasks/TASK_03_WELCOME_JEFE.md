# 🎯 TASK 03: WELCOME JEFE - VARIANTE SIN ANONIMATO

## CONTEXTO
Cuando el jefe hace clic en [Evaluar] desde el portal, pasa por una pantalla Welcome antes de las preguntas.
Esta pantalla muestra datos del subordinado y prepara mentalmente al evaluador.

**Diferencia con Impact Pulse:** SIN mensaje de anonimato (el jefe se identifica).

---

## OBJETIVO
Crear la página y componente Welcome para cuando un jefe va a evaluar a un subordinado.

---

## COMPONENTES A CREAR

### 1. Página Welcome
```
Ubicación: src/app/dashboard/evaluaciones/[assignmentId]/page.tsx
```

```typescript
interface PageProps {
  params: { assignmentId: string };
}

export default async function EvaluarWelcomePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  const assignment = await getAssignmentWithEvaluatee(params.assignmentId);
  
  // Verificar que el assignment pertenece al usuario
  if (assignment.evaluatorUserId !== user.id) {
    redirect('/dashboard/evaluaciones');
  }
  
  // Si ya completado, redirect al portal
  if (assignment.status === 'completed') {
    redirect('/dashboard/evaluaciones');
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

---

### 2. WelcomeScreenManager.tsx
```
Ubicación: src/components/survey/WelcomeScreenManager.tsx
```

```typescript
interface WelcomeScreenManagerProps {
  evaluatee: {
    fullName: string;
    position: string;
    departmentName: string;
    tenure: string;  // "2 años 3 meses"
    avatarUrl?: string;
  };
  estimatedMinutes: number;
  surveyToken: string;
  onBack: string;  // URL para volver
}
```

---

## WIREFRAME

```
┌─────────────────────────────────────────────────────────────────┐
│  ████████████████████████  (fhr-top-line)                       │
│                                                                  │
│  FocalizaHR                                        2/5 ● ● ○ ○ ○│
│                                                                  │
│         ┌─────────────────────────────────────────────┐         │
│         │                                              │         │
│         │                 ┌────────────┐               │         │
│         │                 │            │               │         │
│         │                 │    👤      │               │         │
│         │                 │  (avatar)  │               │         │
│         │                 │            │               │         │
│         │                 └────────────┘               │         │
│         │                                              │         │
│         │            María García                      │         │
│         │            ─────────────                     │         │
│         │                                              │         │
│         │      ┌────────────────────────────────┐     │         │
│         │      │                                 │     │         │
│         │      │  💼  Analista Comercial Senior │     │         │
│         │      │                                 │     │         │
│         │      │  🏢  Departamento Comercial    │     │         │
│         │      │                                 │     │         │
│         │      │  📅  2 años 3 meses            │     │         │
│         │      │                                 │     │         │
│         │      └────────────────────────────────┘     │         │
│         │                                              │         │
│         │  ─────────────────────────────────────────  │         │
│         │                                              │         │
│         │   Tu evaluación ayudará a María a           │         │
│         │   identificar sus fortalezas y              │         │
│         │   oportunidades de desarrollo.              │         │
│         │                                              │         │
│         │   Tómate el tiempo necesario para dar       │         │
│         │   feedback constructivo y específico.       │         │
│         │                                              │         │
│         │      ┌─────────────────────────────────┐    │         │
│         │      │                                  │    │         │
│         │      │    Comenzar Evaluación →        │    │         │
│         │      │                                  │    │         │
│         │      │      (fhr-btn-primary)          │    │         │
│         │      │                                  │    │         │
│         │      └─────────────────────────────────┘    │         │
│         │                                              │         │
│         │      ┌─────────────────────────────────┐    │         │
│         │      │     ← Volver al Portal          │    │         │
│         │      │      (fhr-btn-ghost)            │    │         │
│         │      └─────────────────────────────────┘    │         │
│         │                                              │         │
│         │      ⏱️ Tiempo estimado: 8-10 minutos       │         │
│         │                                              │         │
│         └─────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## CÓDIGO DEL COMPONENTE

```typescript
'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Building2, Calendar, Clock, ArrowLeft } from 'lucide-react';

interface WelcomeScreenManagerProps {
  evaluatee: {
    fullName: string;
    position: string;
    departmentName: string;
    tenure: string;
    avatarUrl?: string;
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
  
  const handleBack = () => {
    router.push(onBack);
  };
  
  // Extraer primer nombre para mensaje personalizado
  const firstName = evaluatee.fullName.split(' ')[0];
  
  return (
    <div className="min-h-screen fhr-bg-main flex items-center justify-center p-4">
      <div className="fhr-card max-w-md w-full p-8 text-center">
        
        {/* Avatar */}
        <div className="mb-6">
          {evaluatee.avatarUrl ? (
            <img 
              src={evaluatee.avatarUrl} 
              alt={evaluatee.fullName}
              className="w-24 h-24 rounded-full mx-auto border-4 border-cyan-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {evaluatee.fullName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        {/* Nombre */}
        <h1 className="text-2xl font-bold text-white mb-6">
          {evaluatee.fullName}
        </h1>
        
        {/* Datos */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3 text-slate-300">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <span>{evaluatee.position}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>{evaluatee.departmentName}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <span>{evaluatee.tenure} en la empresa</span>
          </div>
        </div>
        
        {/* Mensaje motivacional */}
        <p className="text-slate-400 mb-8">
          Tu evaluación ayudará a <span className="text-cyan-400">{firstName}</span> a 
          identificar sus fortalezas y oportunidades de desarrollo.
          <br /><br />
          Tómate el tiempo necesario para dar feedback constructivo y específico.
        </p>
        
        {/* CTA Principal */}
        <button
          onClick={handleStart}
          className="fhr-btn-primary w-full py-4 text-lg font-semibold mb-4"
        >
          Comenzar Evaluación →
        </button>
        
        {/* Volver */}
        <button
          onClick={handleBack}
          className="fhr-btn-ghost w-full flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Portal
        </button>
        
        {/* Tiempo estimado */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Clock className="w-4 h-4" />
          <span>Tiempo estimado: {estimatedMinutes} minutos</span>
        </div>
        
      </div>
    </div>
  );
});
```

---

## COMPARACIÓN CON WELCOME SUBORDINADO (Impact Pulse)

```yaml
WELCOME JEFE (Este componente):
  ✓ Muestra datos del subordinado
  ✓ Avatar del subordinado
  ✓ Mensaje: "ayudará a [Nombre] a desarrollarse"
  ✗ SIN badge de anonimato
  ✗ SIN mensaje "tu respuesta es anónima"

WELCOME SUBORDINADO (WelcomeScreen existente):
  ✓ Muestra datos del jefe
  ✓ Avatar del jefe
  ✓ Mensaje: "ayuda a mejorar el liderazgo"
  ✓ CON badge "🔒 100% Anónimo" prominente
  ✓ CON mensaje de confidencialidad
```

---

## NOTAS IMPORTANTES

1. **SIN anonimato:** El jefe se identifica, su nombre aparece en la evaluación
2. **Ruta:** /dashboard/evaluaciones/[assignmentId] (dentro de /dashboard)
3. **Después del Welcome:** Redirect a /encuesta/[token] que usa el survey existente
4. **Progress indicator:** Mostrar "2/5" en header (cuántas evaluaciones lleva)

---

## CRITERIO DE ÉXITO

- [ ] Página /dashboard/evaluaciones/[assignmentId] renderiza
- [ ] Requiere autenticación
- [ ] Verifica que assignment pertenece al usuario
- [ ] Muestra datos del subordinado correctamente
- [ ] NO muestra mensaje de anonimato
- [ ] Botón "Comenzar" navega a /encuesta/[token]
- [ ] Botón "Volver" navega al portal
- [ ] Tiempo estimado visible
- [ ] Responsive (375px mínimo)
- [ ] Usa clases .fhr-* del design system

---

## ARCHIVOS A CREAR

```
src/app/dashboard/evaluaciones/
  [assignmentId]/
    page.tsx

src/components/survey/
  WelcomeScreenManager.tsx
```

---

## DEPENDENCIAS

- Requiere que TASK_02 (Portal) esté completado
- Usa el survey existente en /encuesta/[token]
- Usa layout de /dashboard existente
