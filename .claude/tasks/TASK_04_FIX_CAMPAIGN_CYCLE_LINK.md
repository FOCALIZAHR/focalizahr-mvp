# TASK_04: Fix Vinculación Campaign ↔ PerformanceCycle

## 📋 INFORMACIÓN DEL TASK

| Campo | Valor |
|-------|-------|
| **Prioridad** | 🔴 CRÍTICA |
| **Complejidad** | Baja |
| **Tiempo estimado** | 30-45 minutos |
| **Riesgo** | Mínimo (cambios quirúrgicos) |
| **Dependencias** | Ninguna |
| **Bloqueante para** | TASK_05, TASK_06, TASK_07 |

---

## 🎯 OBJETIVO

Corregir el bug donde el wizard crea `Campaign` y `PerformanceCycle` pero **NO los vincula** (`campaignId = null`).

---

## 🐛 DIAGNÓSTICO DEL BUG

### Ubicación del Problema:

| Archivo | Problema |
|---------|----------|
| `src/app/dashboard/campaigns/new/page.tsx` | Wizard NO pasa `campaignId` al crear el cycle |
| `src/app/api/admin/performance-cycles/route.ts` | API NO recibe ni guarda `campaignId` |

### Evidencia del Schema (VERIFICADO):

```prisma
// prisma/schema.prisma - El campo SÍ EXISTE
model PerformanceCycle {
  id        String @id @default(cuid())
  accountId String @map("account_id")

  // Vínculo con Campaign (para Questions)
  campaignId String?   @unique @map("campaign_id")  // ✅ EXISTE
  campaign   Campaign? @relation(fields: [campaignId], references: [id])
  // ...
}
```

### Código Actual con Bug:

**Frontend (wizard):**
```typescript
// src/app/dashboard/campaigns/new/page.tsx (~línea 590-620)
const cycleResponse = await fetch('/api/admin/performance-cycles', {
  method: 'POST',
  body: JSON.stringify({
    name: formData.name.trim(),
    description: formData.description?.trim(),
    startDate: formData.startDate,
    endDate: formData.endDate,
    // ❌ FALTA: campaignId: createdCampaign.id
  })
});
```

**Backend (API):**
```typescript
// src/app/api/admin/performance-cycles/route.ts (~línea 45-80)
const { name, description, startDate, endDate, ... } = body;
// ❌ FALTA: const { campaignId, ... } = body;

const cycle = await prisma.performanceCycle.create({
  data: {
    accountId: userContext.accountId,
    name,
    description,
    // ... otros campos ...
    // ❌ FALTA: campaignId
  }
});
```

---

## ✅ SOLUCIÓN PASO A PASO

### FIX 1: Modificar Wizard (Frontend)

**Archivo:** `src/app/dashboard/campaigns/new/page.tsx`

**Buscar este bloque (~línea 590-620):**
```typescript
body: JSON.stringify({
  name: formData.name.trim(),
  description: formData.description?.trim() || `Ciclo de evaluación: ${formData.name
```

**Agregar `campaignId` como primera propiedad:**
```typescript
body: JSON.stringify({
  campaignId: createdCampaign.id,  // ✅ AGREGAR ESTA LÍNEA
  name: formData.name.trim(),
  description: formData.description?.trim() || `Ciclo de evaluación: ${formData.name
```

---

### FIX 2: Modificar API (Backend)

**Archivo:** `src/app/api/admin/performance-cycles/route.ts`

#### Paso 2.1: Agregar campaignId al destructuring

**Buscar (~línea 45-55):**
```typescript
const {
  name,
  description,
  startDate,
  endDate,
  cycleType,
```

**Reemplazar con:**
```typescript
const {
  campaignId,  // ✅ AGREGAR ESTA LÍNEA
  name,
  description,
  startDate,
  endDate,
  cycleType,
```

#### Paso 2.2: Agregar campaignId al create

**Buscar (~línea 75-95):**
```typescript
const cycle = await prisma.performanceCycle.create({
  data: {
    accountId: userContext.accountId,
    name,
    description,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
```

**Reemplazar con:**
```typescript
const cycle = await prisma.performanceCycle.create({
  data: {
    accountId: userContext.accountId,
    campaignId: campaignId || undefined,  // ✅ AGREGAR (opcional para backwards compatibility)
    name,
    description,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
```

---

## 🧪 VERIFICACIÓN

### Test Manual:

1. **Ir al wizard:** `/dashboard/campaigns/new`
2. **Seleccionar:** Tipo de campaña con `flowType: 'employee-based'` (ej: "Evaluación de Desempeño")
3. **Completar:** Los 3 pasos del wizard
4. **Verificar en consola del navegador:** Debe mostrar el cycleId y campaignId vinculados

### Query de Verificación en BD:

```sql
-- Verificar que el ciclo tiene campaignId
SELECT 
  pc.id as cycle_id,
  pc.name as cycle_name,
  pc.campaign_id,
  c.name as campaign_name
FROM performance_cycles pc
LEFT JOIN campaigns c ON pc.campaign_id = c.id
WHERE pc.campaign_id IS NOT NULL
ORDER BY pc.created_at DESC
LIMIT 5;
```

**Resultado esperado:** `campaign_id` debe tener valor (NO null)

---

## ⚠️ NOTAS IMPORTANTES

1. **Backwards Compatibility:** El `campaignId || undefined` permite que ciclos sin campaña sigan funcionando
2. **Relación 1:1:** El campo `campaignId` tiene `@unique`, una Campaign solo puede tener un PerformanceCycle
3. **No tocar otros archivos:** Este fix es quirúrgico, solo 2 archivos

---

## 📁 RESUMEN DE CAMBIOS

| Archivo | Acción | Líneas |
|---------|--------|--------|
| `src/app/dashboard/campaigns/new/page.tsx` | Agregar `campaignId: createdCampaign.id` | ~1 línea |
| `src/app/api/admin/performance-cycles/route.ts` | Extraer y guardar `campaignId` | ~2 líneas |

**Total:** 2 archivos, ~3 líneas modificadas

---

## ✅ CHECKLIST PRE-COMMIT

- [ ] Wizard pasa `campaignId: createdCampaign.id`
- [ ] API extrae `campaignId` del body
- [ ] API incluye `campaignId` en prisma.create
- [ ] Probado manualmente: ciclo tiene campaign_id en BD
- [ ] Sin errores TypeScript
- [ ] Sin errores de compilación
