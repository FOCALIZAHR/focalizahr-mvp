# TASK: Implementación Post-Encuesta Performance (Botón Volver + Status COMPLETED)

## 🎯 OBJETIVO

Implementar solución enterprise-grade para el flujo post-encuesta de evaluaciones de desempeño:
1. **Frontend:** Mostrar botón "Volver al Panel" cuando `flowType === 'employee-based'`
2. **Backend:** Actualizar `EvaluationAssignment.status = 'COMPLETED'` en transacción atómica

---

## 📋 CONTEXTO

### Problema Actual
- Evaluador completa encuesta → ve "Gracias" → NO puede volver al panel
- `EvaluationAssignment.status` queda en `PENDING` aunque `Participant.hasResponded = true`
- Stats muestran `0 de 3` aunque ya completó evaluaciones

### Solución Arquitectónica Elegida
- **Opción C:** Detectar `flowType` + `evaluationAssignmentId`
- Transacción atómica en backend
- Botón condicional en frontend

---

## 🔧 IMPLEMENTACIÓN BACKEND

### Archivo a modificar
Buscar el endpoint que guarda respuestas de encuesta. Posibles ubicaciones:
- `src/app/api/survey/[token]/submit/route.ts`
- `src/app/api/survey/[token]/responses/route.ts`
- `src/app/api/survey/[token]/route.ts` (POST)

### Código a agregar

Buscar donde se hace el UPDATE de `participant.hasResponded = true` y convertirlo en transacción:

```typescript
// ANTES (código actual aproximado):
await prisma.participant.update({
  where: { id: participant.id },
  data: { 
    hasResponded: true,
    responseDate: new Date()
  }
});

// DESPUÉS (transacción atómica):
await prisma.$transaction(async (tx) => {
  // 1. Guardar respuestas (si no se hace antes)
  // ... código existente de responses ...

  // 2. Marcar participant como respondido
  await tx.participant.update({
    where: { id: participant.id },
    data: { 
      hasResponded: true,
      responseDate: new Date()
    }
  });

  // 3. Actualizar contador de campaign
  await tx.campaign.update({
    where: { id: participant.campaignId },
    data: { 
      totalResponded: { increment: 1 }
    }
  });

  // 4. NUEVO: Si tiene EvaluationAssignment, marcarlo como COMPLETED
  if (participant.evaluationAssignmentId) {
    await tx.evaluationAssignment.update({
      where: { id: participant.evaluationAssignmentId },
      data: { 
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });
    
    console.log('[Performance] ✅ EvaluationAssignment marcado como COMPLETED', {
      assignmentId: participant.evaluationAssignmentId,
      participantId: participant.id
    });
  }
});
```

### Nota importante
- El campo `evaluationAssignmentId` está en `Participant` (verificar con schema)
- Relación: `Participant.evaluationAssignmentId` → `EvaluationAssignment.id`
- Solo actualizar si el campo existe (no es null)

---

## 🎨 IMPLEMENTACIÓN FRONTEND

### Archivo a modificar
Buscar la pantalla de agradecimiento/completado:
- `src/app/encuesta/[token]/page.tsx`
- `src/components/survey/SurveyComplete.tsx`
- `src/components/survey/ThankYouScreen.tsx`

### Paso 1: Verificar que `flowType` llega al frontend

En el endpoint GET de survey (ej: `/api/survey/[token]/route.ts`), verificar que retorna:

```typescript
return NextResponse.json({
  success: true,
  participant: { ... },
  campaign: { ... },
  campaignType: {
    flowType: campaignType.flowType,  // ← Debe incluir esto
    // ...
  },
  questions: [ ... ]
});
```

### Paso 2: Agregar botón en pantalla completada

Buscar el componente que muestra el mensaje de agradecimiento cuando `isCompleted = true`:

```tsx
// Importar
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Dentro del componente
const router = useRouter()

// Detectar si es flujo employee-based
const isEmployeeBased = surveyData?.campaignType?.flowType === 'employee-based'

// En el JSX, después del mensaje de agradecimiento:
{isCompleted && (
  <div className="text-center space-y-6">
    {/* Mensaje existente de agradecimiento */}
    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-white">¡Gracias por tu evaluación!</h2>
      <p className="text-gray-400">Tus respuestas han sido registradas exitosamente.</p>
    </div>
    
    {/* NUEVO: Botón Volver solo para Performance */}
    {isEmployeeBased && (
      <Button
        onClick={() => router.push('/dashboard/evaluaciones')}
        className="w-full max-w-md bg-cyan-600 hover:bg-cyan-700 text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Panel de Evaluaciones
      </Button>
    )}
  </div>
)}
```

### Alternativa: Si flowType no está disponible

Si `flowType` no llega al frontend, usar `evaluationAssignmentId` como fallback:

```tsx
// Detectar por relación con assignment
const hasEvaluationAssignment = !!surveyData?.participant?.evaluationAssignmentId

{hasEvaluationAssignment && (
  <Button onClick={() => router.push('/dashboard/evaluaciones')}>
    <ArrowLeft className="w-4 h-4 mr-2" />
    Volver al Panel de Evaluaciones
  </Button>
)}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Localizar endpoint de submit/complete encuesta
- [ ] Verificar que `participant` incluye `evaluationAssignmentId` en la query
- [ ] Envolver operaciones en `prisma.$transaction`
- [ ] Agregar UPDATE de `EvaluationAssignment.status = 'COMPLETED'`
- [ ] Agregar log para debugging
- [ ] Verificar que compila sin errores

### Frontend
- [ ] Localizar componente de pantalla completada
- [ ] Verificar que `flowType` o `evaluationAssignmentId` está disponible
- [ ] Agregar botón condicional "Volver al Panel"
- [ ] Importar dependencias (useRouter, Button, ArrowLeft)
- [ ] Verificar que compila sin errores

---

## 🧪 PRUEBAS

### Test Manual
1. Login como María (`maria@empresa.cl` / `Test123!`)
2. Ir a `/dashboard/evaluaciones`
3. Verificar stats iniciales (ej: `1 de 3` o `0 de 3`)
4. Clic en una evaluación pendiente
5. Completar la encuesta
6. **Verificar:** Aparece botón "Volver al Panel de Evaluaciones"
7. Clic en botón
8. **Verificar:** Redirige a `/dashboard/evaluaciones`
9. **Verificar:** Stats actualizados (ej: `2 de 3`)
10. **Verificar:** Evaluación aparece como "Completada" en lista

### Query de Verificación
```sql
-- Verificar que assignment se marcó como COMPLETED
SELECT 
  ea.id,
  ea.evaluatee_name,
  ea.status as assignment_status,
  p.has_responded,
  p.response_date
FROM evaluation_assignments ea
LEFT JOIN participants p ON ea.participant_id = p.id
WHERE ea.evaluator_id = 'cmkrlxw8i0003c6q5amursr0o'
ORDER BY ea.updated_at DESC;

-- Ambos deben coincidir:
-- has_responded = true Y assignment_status = 'COMPLETED'
```

---

## ⚠️ NOTAS IMPORTANTES

1. **NO romper otros flujos:** El botón SOLO aparece cuando `flowType === 'employee-based'`
2. **Transacción atómica:** Si falla cualquier paso, todo hace rollback
3. **Idempotencia:** Si ya está COMPLETED, no debería fallar (pero no debería llegar ahí)
4. **Logs:** Agregar console.log para facilitar debugging

---

## 🔍 ARCHIVOS CLAVE A BUSCAR

```bash
# Backend - endpoint de submit
find src -name "*.ts" | xargs grep -l "hasResponded.*true" 
find src -name "*.ts" | xargs grep -l "responseDate"

# Frontend - pantalla completada
find src -name "*.tsx" | xargs grep -l "isCompleted"
find src -name "*.tsx" | xargs grep -l "Gracias"
find src -name "*.tsx" | xargs grep -l "ThankYou"
```

---

## 📊 RESULTADO ESPERADO

| Antes | Después |
|-------|---------|
| Sin botón volver | Botón "Volver al Panel" visible |
| Stats: 0 de 3 | Stats: 1 de 3 (incrementa correctamente) |
| Assignment: PENDING | Assignment: COMPLETED |
| Evaluación aparece pendiente | Evaluación aparece completada |
