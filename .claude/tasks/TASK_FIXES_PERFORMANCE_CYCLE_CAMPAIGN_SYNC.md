# TASK: Fixes Performance Cycle y Campaign Sync

## 🎯 OBJETIVO

Corregir dos bugs relacionados con la sincronización entre PerformanceCycle y Campaign en el módulo de Evaluaciones de Desempeño.

---

## 🐛 BUG 1: API Evaluator Assignments no filtra por status ACTIVE

### Problema
La API `/api/evaluator/assignments/route.ts` busca ciclos activos por rango de fechas pero **NO filtra por `status: 'ACTIVE'`**. Esto causa que encuentre ciclos en `DRAFT` que también están en el rango de fechas.

### Archivo
`src/app/api/evaluator/assignments/route.ts`

### Código actual (líneas ~60-70)
```typescript
const activeCycle = await prisma.performanceCycle.findFirst({
  where: {
    accountId: userContext.accountId,
    startDate: { lte: now },
    endDate: { gte: now }
  },
  // ...
})
```

### Código corregido
```typescript
const activeCycle = await prisma.performanceCycle.findFirst({
  where: {
    accountId: userContext.accountId,
    status: 'ACTIVE',  // ← AGREGAR ESTE FILTRO
    startDate: { lte: now },
    endDate: { gte: now }
  },
  // ...
})
```

### Test
1. Tener múltiples ciclos con fechas superpuestas (algunos DRAFT, uno ACTIVE)
2. Login como evaluador
3. Verificar que solo ve evaluaciones del ciclo ACTIVE

---

## 🐛 BUG 2: Activar PerformanceCycle no activa Campaign asociada

### Problema
Cuando se activa un PerformanceCycle (`status: 'ACTIVE'`), la Campaign asociada permanece en `draft`. Esto causa que las encuestas de evaluación retornen error "Esta encuesta no está disponible actualmente".

### Relación de datos
```
PerformanceCycle (ACTIVE)
    ↓ tiene relación 1:1 via nombre
Campaign (debe ser 'active')
    ↓ tiene participantes
Participant (tiene uniqueToken para encuesta)
```

### Archivos a revisar
Buscar donde se actualiza el status del PerformanceCycle. Posibles ubicaciones:
- `src/app/api/performance/cycles/[id]/route.ts` (PATCH)
- `src/app/api/performance/cycles/[id]/activate/route.ts`
- `src/lib/services/PerformanceCycleService.ts`

### Lógica a implementar
Cuando `PerformanceCycle.status` cambia a `'ACTIVE'`:

```typescript
// 1. Actualizar el ciclo
const updatedCycle = await prisma.performanceCycle.update({
  where: { id: cycleId },
  data: { status: 'ACTIVE' }
});

// 2. Buscar y activar Campaign asociada (mismo nombre o relación directa)
const campaign = await prisma.campaign.findFirst({
  where: {
    accountId: updatedCycle.accountId,
    name: updatedCycle.name  // O usar relación si existe
  }
});

if (campaign && campaign.status === 'draft') {
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { 
      status: 'active',
      activatedAt: new Date()
    }
  });
  console.log(`[Performance] Campaign ${campaign.id} activada junto con ciclo`);
}
```

### Consideraciones
- La relación puede ser por nombre (ambos tienen `name: 'TOPITO_EVALUADOR'`)
- O puede haber un campo `performanceCycleId` en Campaign (verificar schema)
- También considerar el caso inverso: si se desactiva el ciclo, ¿desactivar campaign?

### Test
1. Crear PerformanceCycle en DRAFT
2. Activar desde UI o API
3. Verificar que Campaign asociada también está en 'active'
4. Probar acceder a encuesta como evaluador

---

## 📋 CHECKLIST

- [ ] Bug 1: Agregar `status: 'ACTIVE'` al filtro en `/api/evaluator/assignments/route.ts`
- [ ] Bug 2: Localizar endpoint/servicio de activación de ciclos
- [ ] Bug 2: Agregar lógica de sincronización con Campaign
- [ ] Probar flujo completo: activar ciclo → campaign se activa → encuesta funciona

---

## 🔍 QUERIES DE VERIFICACIÓN

```sql
-- Ver ciclos y campaigns con mismo nombre
SELECT 
  pc.id as cycle_id,
  pc.name,
  pc.status as cycle_status,
  c.id as campaign_id,
  c.status as campaign_status
FROM performance_cycles pc
LEFT JOIN campaigns c ON c.name = pc.name AND c.account_id = pc.account_id
WHERE pc.account_id = 'cmfgedx7b00012413i92048wl';

-- Después del fix, ambos status deben coincidir
```

---

## ⚠️ NOTAS

- NO crear endpoints nuevos, solo modificar existentes
- Mantener logs para debugging
- Si no existe endpoint de activación, puede estar en un PATCH genérico del ciclo
