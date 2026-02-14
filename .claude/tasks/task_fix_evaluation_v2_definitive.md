# TASK V2: Fix Evaluation Filter + Score Corruption + Redirect Hijack

## 🎯 RESUMEN EJECUTIVO
Corregir 3 bugs críticos que causan "secuestro de sesión" y contaminación de datos entre autoevaluaciones (SELF) y evaluaciones del jefe (MANAGER_TO_EMPLOYEE).

---

## 🔧 CAMBIO 1/3: Agregar filtro `evaluationType` en API del Evaluador

### Archivo: `src/app/api/evaluator/assignments/route.ts`

### Ubicación Exacta: Línea 88-95 (búsqueda: `const whereClause: any = {`)

### BEFORE:
```typescript
    const whereClause: any = {
      accountId: userContext.accountId,
      evaluatorId: employee.id,
      status: { in: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] }
    }
```

### AFTER:
```typescript
    const whereClause: any = {
      accountId: userContext.accountId,
      evaluatorId: employee.id,
      evaluationType: 'MANAGER_TO_EMPLOYEE',  // ✅ SOLO evaluaciones downward
      status: { in: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] }
    }
```

### Validación:
```bash
# Buscar en el archivo la línea exacta:
grep -n "const whereClause: any = {" src/app/api/evaluator/assignments/route.ts

# Verificar que la salida muestra:
# evaluationType: 'MANAGER_TO_EMPLOYEE',
```

---

## 🔧 CAMBIO 2/3: Corregir cálculo de `avgScore` a escala consistente

### Archivo: `src/app/api/evaluator/assignments/route.ts`

### Ubicación Exacta: Línea 64-90 (búsqueda: `// Mapear a formato de UI`)

### BEFORE:
```typescript
    // Mapear a formato de UI
    const mappedAssignments = assignments.map(a => {
      // Calculate avgScore for completed assignments (0-100 scale)
      let avgScore: number | null = null
      if (a.status === 'COMPLETED' && a.participant?.responses?.length) {
        // Try normalizedScore first (0-100)
        const normalizedScores = a.participant.responses
          .map(r => r.normalizedScore)
          .filter((s): s is number => s !== null)

        if (normalizedScores.length > 0) {
          avgScore = normalizedScores.reduce((sum, s) => sum + s, 0) / normalizedScores.length
        } else {
          // Fallback: calculate from rating (1-5) → convert to 0-100
          const ratings = a.participant.responses
            .map(r => r.rating)
            .filter((r): s is number => r !== null)
          if (ratings.length > 0) {
            const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            avgScore = (avgRating / 5) * 100
          }
        }
      }
```

### AFTER:
```typescript
    // Mapear a formato de UI
    const mappedAssignments = assignments.map(a => {
      // Calculate avgScore (escala 1-5, como normalizedScore)
      let avgScore: number | null = null
      if (a.status === 'COMPLETED' && a.participant?.responses?.length) {
        // Priorizar normalizedScore (ya está en escala 1-5)
        const normalizedScores = a.participant.responses
          .map(r => r.normalizedScore)
          .filter((s): s is number => s !== null)

        if (normalizedScores.length > 0) {
          avgScore = normalizedScores.reduce((sum, s) => sum + s, 0) / normalizedScores.length
        } else {
          // Fallback: rating directo (también escala 1-5)
          const ratings = a.participant.responses
            .map(r => r.rating)
            .filter((r): r is number => r !== null)
          if (ratings.length > 0) {
            avgScore = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          }
        }
      }
```

### Validación:
```bash
# Verificar que NO existe conversión a escala 0-100
grep -n "(avgRating / 5) \* 100" src/app/api/evaluator/assignments/route.ts
# Debe retornar: (ningún resultado)

# Verificar comentario correcto
grep -n "// Calculate avgScore (escala 1-5" src/app/api/evaluator/assignments/route.ts
# Debe retornar: línea con el comentario nuevo
```

---

## 🔧 CAMBIO 3/3: Eliminar redirección automática para usuarios anónimos

### Archivo: `src/app/encuesta/[token]/page.tsx`

### Ubicación Exacta: Línea 40-55 (búsqueda: `if (flowType === 'employee-based')`)

### BEFORE:
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
        const token = localStorage.getItem('focalizahr_token')
        if (token) {
          router.push('/dashboard/evaluaciones')
        }
        // Si no hay token, quedarse en pantalla de éxito
      }, 3000)
    }
```

### AFTER:
```typescript
    // Para evaluaciones de desempeño (employee-based), toast SIN redirección automática
    if (flowType === 'employee-based') {
      const evaluateeName = surveyData?.evaluationContext?.evaluateeName || surveyData?.participant.campaign.name || 'el colaborador'
      setPostSubmitMessage(`Tu evaluacion de ${evaluateeName} ha sido enviada exitosamente. Puedes cerrar esta ventana.`)
      toast.success(
        `Tu evaluacion de ${evaluateeName} ha sido enviada correctamente.`,
        'Evaluacion Enviada'
      )
      // ✅ NO redirigir - usuario anónimo debe permanecer en pantalla de éxito
      // El jefe puede navegar desde su sesión autenticada si lo desea
    }
```

### Validación:
```bash
# Verificar que NO existe redirección a dashboard
grep -n "router.push('/dashboard/evaluaciones')" src/app/encuesta/\[token\]/page.tsx
# Debe retornar: (ningún resultado en bloque employee-based)

# Verificar mensaje actualizado
grep -n "Puedes cerrar esta ventana" src/app/encuesta/\[token\]/page.tsx
# Debe retornar: línea con el mensaje nuevo
```

---

## ✅ PRUEBAS DE VALIDACIÓN POST-IMPLEMENTACIÓN

### Test 1: Autoevaluación (SELF) no contamina dashboard del jefe
```yaml
Precondición:
  - Usuario completa autoevaluación con token único
  - Jefe tiene sesión activa en otra pestaña

Resultado Esperado:
  - Dashboard del jefe muestra "Pendiente (0/1)"
  - NO muestra "Completado (1/1)"
  - avgScore del colaborador: null (no visible hasta que jefe complete)
```

### Test 2: Evaluación MANAGER_TO_EMPLOYEE se refleja correctamente
```yaml
Precondición:
  - Jefe completa evaluación downward

Resultado Esperado:
  - Dashboard muestra "Completado (1/1)"
  - avgScore en escala 1-5 (ej: 3.8, NO 76.66)
  - Stats calculan solo evaluaciones tipo MANAGER
```

### Test 3: Usuarios anónimos no secuestran sesión
```yaml
Precondición:
  - Usuario completa encuesta con token (sin login)
  - Jefe tiene sesión activa en otra pestaña del navegador

Resultado Esperado:
  - Pantalla de éxito muestra: "Puedes cerrar esta ventana"
  - NO redirige a /dashboard/evaluaciones
  - Usuario permanece en página de éxito
```

### Test 4: avgScore en escala consistente 1-5
```yaml
Precondición:
  - Jefe completa evaluación con 20 preguntas rating promedio 3.8

Resultado Esperado:
  - API retorna avgScore: 3.8 (NO 76.66)
  - Frontend muestra score correcto sin conversión adicional
```

---

## 📊 IMPACTO ESPERADO

### ANTES (Con bugs):
```yaml
Dashboard Jefe:
  - Muestra colaborador "Completado (1/1)" ← FALSO POSITIVO (era SELF)
  - avgScore: 76.66 ← ESCALA INCORRECTA (debería ser 3.8)
  - Módulo Potencial activado ← PREMATURO (jefe no ha evaluado)
  
Redirección Post-Encuesta:
  - Usuario anónimo → /dashboard/evaluaciones ← SECUESTRO DE SESIÓN
  - Middleware detecta cookie del jefe ← CONTAMINACIÓN DE MUNDOS
```

### DESPUÉS (Corregido):
```yaml
Dashboard Jefe:
  - Muestra colaborador "Pendiente (0/1)" ← CORRECTO (SELF no cuenta)
  - avgScore: 3.8 ← ESCALA CORRECTA (1-5)
  - Módulo Potencial bloqueado ← LÓGICA INTACTA
  
Redirección Post-Encuesta:
  - Usuario anónimo → Pantalla de éxito ← AISLAMIENTO CORRECTO
  - Middleware NO involucrado ← MUNDOS SEPARADOS
```

---

## 🚨 NOTAS CRÍTICAS

### 1. NO tocar lógica de consolidación 360°
El método `PerformanceResultsService.consolidate360()` debe seguir procesando **TODOS** los tipos (SELF, MANAGER, PEER, UPWARD) para calcular el score 360° completo. Los cambios son **SOLO** en:
- API del evaluador (filtro visualización)
- Cálculo de avgScore (escala consistente)
- Redirección post-encuesta (aislamiento)

### 2. Escala 1-5 es la estándar del sistema
- `normalizedScore` siempre está en escala 1-5
- `rating` también está en escala 1-5 (por defecto)
- **NO convertir a 0-100** en ningún punto de la API del evaluador

### 3. Frontend NO necesita cambios
Si la API retorna avgScore en escala 1-5, el `TeamCalibrationHUD` ya está preparado para recibirlo (hace división por 20 internamente si detecta escala 0-100, pero con escala 1-5 directa funciona mejor).

---

## 📁 RESUMEN DE ARCHIVOS MODIFICADOS

```
src/app/api/evaluator/assignments/route.ts      (2 cambios: filtro + avgScore)
src/app/encuesta/[token]/page.tsx                (1 cambio: eliminar redirección)
```

**Total: 2 archivos, ~25 líneas modificadas**

---

## 🎯 PROMPT PARA CLAUDE CODE

```
Ejecuta task_fix_evaluation_v2_definitive.md

Aplica EXACTAMENTE los 3 cambios especificados:
1. Línea 91: Agregar evaluationType: 'MANAGER_TO_EMPLOYEE' en whereClause
2. Línea 78: Eliminar conversión (avgRating / 5) * 100, usar rating directo
3. Línea 48: Eliminar router.push('/dashboard/evaluaciones') de bloque employee-based

Validar cada cambio con grep antes de confirmar.
NO refactorizar código adicional.
```
