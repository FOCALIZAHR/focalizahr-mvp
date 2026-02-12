# TASK: Fix Evaluation Type Filter - Performance Dashboard

## 🎯 OBJETIVO
Corregir fuga de contexto entre autoevaluaciones (SELF) y evaluaciones del jefe (MANAGER_TO_EMPLOYEE) que causa falsos positivos en dashboard del evaluador.

## 🐛 PROBLEMA DETECTADO
**Síntoma:** Dashboard del jefe muestra colaboradores como "evaluados" cuando solo completaron autoevaluación.

**Causa Raíz:** 
1. API `/api/evaluator/assignments` NO filtra por `evaluationType`
2. Redirección post-encuesta envía usuarios anónimos a rutas protegidas

## 📝 CAMBIOS REQUERIDOS

### CAMBIO 1: Filtrar evaluaciones en API del evaluador
**Archivo:** `src/app/api/evaluator/assignments/route.ts`

**Ubicación:** Línea ~93-100 (dentro del método GET)

**BEFORE:**
```typescript
const assignments = await prisma.evaluationAssignment.findMany({
  where: {
    cycleId: activeCycle.id,
    accountId: userContext.accountId,
    evaluatorId: employee.id
  },
  include: {
```

**AFTER:**
```typescript
const assignments = await prisma.evaluationAssignment.findMany({
  where: {
    cycleId: activeCycle.id,
    accountId: userContext.accountId,
    evaluatorId: employee.id,
    evaluationType: 'MANAGER_TO_EMPLOYEE'  // ✅ SOLO evaluaciones downward del jefe
  },
  include: {
```

---

### CAMBIO 2: Eliminar redirección automática post-encuesta
**Archivo:** `src/app/encuesta/[token]/page.tsx`

**Ubicación:** Línea ~40-50 (dentro de `handleSubmit`)

**BEFORE:**
```typescript
    // Para evaluaciones de desempeño (employee-based), toast + redirect automático
    if (flowType === 'employee-based') {
      const evaluateeName = surveyData?.evaluationContext?.evaluateeName || surveyData?.participant.campaign.name || 'el colaborador'
      setPostSubmitMessage(`Tu evaluacion de ${evaluateeName} ha sido enviada exitosamente.`)
      toast.success(
        `Tu evaluacion de ${evaluateeName} ha sido enviada correctamente.`,
        'Evaluacion Enviada'
      )
      setTimeout(() => {
        router.push('/dashboard/evaluaciones')
      }, 3000)
    }
```

**AFTER:**
```typescript
    // Para evaluaciones de desempeño (employee-based), toast + redirect condicional
    if (flowType === 'employee-based') {
      const evaluateeName = surveyData?.evaluationContext?.evaluateeName || surveyData?.participant.campaign.name || 'el colaborador'
      setPostSubmitMessage(`Tu evaluacion de ${evaluateeName} ha sido enviada exitosamente.`)
      toast.success(
        `Tu evaluacion de ${evaluateeName} ha siendo enviada correctamente.`,
        'Evaluacion Enviada'
      )
      
      // ✅ SOLO redirigir si hay sesión activa
      setTimeout(() => {
        const token = localStorage.getItem('focalizahr_token')
        if (token) {
          router.push('/dashboard/evaluaciones')
        }
        // Si no hay token, quedarse en pantalla de éxito
      }, 3000)
    }
```

---

### CAMBIO 3: Protección adicional en PerformanceResultsService
**Archivo:** `src/lib/services/PerformanceResultsService.ts`

**Ubicación:** Método `listEvaluateesInCycle` (aprox. línea 230-250)

**BEFORE:**
```typescript
  static async listEvaluateesInCycle(cycleId: string): Promise<Array<{
```

**AFTER:**
```typescript
  static async listEvaluateesInCycle(
    cycleId: string, 
    evaluatorId?: string  // ✅ AGREGAR parámetro opcional
  ): Promise<Array<{
```

**Y modificar el query (aprox. línea 250-260):**

**BEFORE:**
```typescript
    const assignments = await prisma.evaluationAssignment.findMany({
      where: { cycleId },
      select: {
```

**AFTER:**
```typescript
    // Construir where dinámicamente
    const whereClause: any = { cycleId }
    
    // Si se especifica evaluatorId, filtrar por evaluador Y tipo
    if (evaluatorId) {
      whereClause.evaluatorId = evaluatorId
      whereClause.evaluationType = 'MANAGER_TO_EMPLOYEE'
    }
    
    const assignments = await prisma.evaluationAssignment.findMany({
      where: whereClause,
      select: {
```

---

## ✅ CRITERIOS DE VALIDACIÓN

### Test Case 1: Autoevaluación no contamina dashboard del jefe
```bash
1. Usuario completa autoevaluación (SELF) con token único
2. Verificar dashboard del jefe: debe mostrar "Pendiente (0/X)"
3. NO debe mostrar como "Completado (1/X)"
```

### Test Case 2: Evaluación del jefe se refleja correctamente
```bash
1. Jefe completa evaluación MANAGER_TO_EMPLOYEE
2. Verificar dashboard: debe mostrar "Completado (1/X)"
3. Stats deben calcular solo evaluaciones tipo MANAGER
```

### Test Case 3: Redirección condicional post-encuesta
```bash
1. Completar encuesta sin sesión activa (solo token)
2. Verificar: NO debe redirigir a /dashboard/evaluaciones
3. Usuario debe permanecer en pantalla de éxito
```

---

## 📊 IMPACTO ESPERADO

**ANTES:**
- Dashboard jefe muestra falsos positivos (SELF contamina MANAGER)
- Módulo Potencial se activa prematuramente
- Usuarios anónimos "secuestran" sesión del jefe

**DESPUÉS:**
- Dashboard jefe muestra solo evaluaciones MANAGER_TO_EMPLOYEE
- Módulo Potencial se activa solo cuando jefe completa su parte
- Usuarios anónimos permanecen aislados (no acceden a rutas protegidas)

---

## 🚨 NOTAS CRÍTICAS

1. **NO tocar lógica de consolidación 360°:** El método `consolidate360()` debe seguir procesando TODOS los tipos (SELF, MANAGER, PEER, UPWARD) para calcular el score completo.

2. **Cambios quirúrgicos:** Solo agregar filtros en puntos específicos, NO refactorizar componentes completos.

3. **Preservar tipos:** El parámetro `evaluatorId` en `listEvaluateesInCycle` es opcional para mantener retrocompatibilidad.

---

## 📁 ARCHIVOS A MODIFICAR

```
src/app/api/evaluator/assignments/route.ts          (1 línea agregada)
src/app/encuesta/[token]/page.tsx                   (6 líneas modificadas)
src/lib/services/PerformanceResultsService.ts       (8 líneas agregadas)
```

**Total: 3 archivos, ~15 líneas de código**

---

## 🎯 PROMPT SUGERIDO PARA CLAUDE CODE

```
Ejecuta la task en /task_fix_evaluation_type_filter.md.

Aplica los 3 cambios quirúrgicos exactos:
1. Agregar filtro evaluationType en API evaluator
2. Condicionar redirección post-encuesta
3. Agregar parámetro evaluatorId en PerformanceResultsService

NO refactorizar, solo cambios precisos indicados.
```
