# ════════════════════════════════════════════════════════════════════════════
# TASK A: Backend - Agregar Campos Separados para Factores AAE
# ════════════════════════════════════════════════════════════════════════════
# Archivo: .claude/tasks/TASK_A_potential_factors_backend.md
# Proyecto: FocalizaHR
# Prioridad: Alta (PREREQUISITO)
# Estimación: 1-2 horas
# Dependencias: Ninguna
# ════════════════════════════════════════════════════════════════════════════

## 📋 RESUMEN

Agregar **3 campos separados** (NO JSON) al schema para los factores AAE:
- `potentialAspiration Int?` - Factor Aspiración (1-3)
- `potentialAbility Int?` - Factor Capacidad (1-3)  
- `potentialEngagement Int?` - Factor Compromiso (1-3)

**¿Por qué campos separados y NO JSON?**
```yaml
INTELIGENCIA FUTURA requiere queries como:
  - "¿Cuántos tienen alta capacidad pero baja aspiración?"
  - "¿Cuál es el engagement promedio de Marketing?"
  - "Correlación: bajo engagement + alta capacidad = riesgo fuga"

Con campos separados:
  SELECT COUNT(*) WHERE potential_ability = 3 AND potential_aspiration = 1  ✅ FÁCIL

Con JSON:
  SELECT COUNT(*) WHERE potential_factors->>'ability' = '3'...  ❌ DIFÍCIL/LENTO
```

**NO incluye cambios de UI** - eso va en Tasks B, C, D.

---

## 🎯 OBJETIVOS

1. Agregar 3 campos Int? separados a PerformanceRating (schema)
2. Crear función `calculatePotentialScore()` en lib
3. Modificar `PerformanceRatingService.ratePotential()` para aceptar los 3 factores
4. Modificar API PATCH para validar factores (1, 2 o 3)
5. Mantener backward compatibility (API sigue aceptando solo score + notes)

---

## ✅ CRITERIOS DE ÉXITO

```yaml
Schema:
  - [ ] Campo potentialAspiration Int? agregado
  - [ ] Campo potentialAbility Int? agregado
  - [ ] Campo potentialEngagement Int? agregado
  - [ ] Migración ejecutada sin errores

Service:
  - [ ] Acepta los 3 factores opcionales
  - [ ] Calcula score automáticamente si recibe factores
  - [ ] Sigue funcionando con score directo (backward compatible)

API:
  - [ ] Valida que cada factor sea 1, 2 o 3
  - [ ] Guarda en campos separados
  - [ ] Retorna el rating actualizado

Backward Compatible:
  - [ ] Página actual de /ratings sigue funcionando
  - [ ] potentialNotes se sigue guardando
  - [ ] nineBoxPosition se sigue calculando
```

---

## 📝 CAMBIO 1: lib/potential-assessment.ts (CREAR)

```typescript
// src/lib/potential-assessment.ts

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export type PotentialFactorLevel = 1 | 2 | 3

export interface PotentialFactorsInput {
  aspiration: PotentialFactorLevel
  ability: PotentialFactorLevel
  engagement: PotentialFactorLevel
}

export interface PotentialFactorsStored extends PotentialFactorsInput {
  assessedAt: string
  version: string
}

// ════════════════════════════════════════════════════════════════════════════
// ALGORITMO DE CÁLCULO
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calcula potentialScore (1-5) a partir de los 3 factores AAE (1-3)
 * 
 * Formula: score = 1 + (promedio - 1) * 2
 * Mapeo: avg=1 → score=1, avg=2 → score=3, avg=3 → score=5
 * 
 * @example
 * calculatePotentialScore({ aspiration: 3, ability: 3, engagement: 3 }) // → 5.0
 * calculatePotentialScore({ aspiration: 2, ability: 2, engagement: 2 }) // → 3.0
 * calculatePotentialScore({ aspiration: 1, ability: 1, engagement: 1 }) // → 1.0
 */
export function calculatePotentialScore(factors: PotentialFactorsInput): number {
  const { aspiration, ability, engagement } = factors
  const avg = (aspiration + ability + engagement) / 3
  const rawScore = 1 + (avg - 1) * 2
  return Math.round(rawScore * 10) / 10  // 1 decimal
}

/**
 * Valida que los factors sean válidos (cada uno 1, 2 o 3)
 */
export function validatePotentialFactors(factors: unknown): factors is PotentialFactorsInput {
  if (!factors || typeof factors !== 'object') return false
  
  const f = factors as Record<string, unknown>
  const validLevels = [1, 2, 3]
  
  return (
    validLevels.includes(f.aspiration as number) &&
    validLevels.includes(f.ability as number) &&
    validLevels.includes(f.engagement as number)
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TABLA DE REFERENCIA (para documentación)
// ════════════════════════════════════════════════════════════════════════════
/*
  COMBINACIONES → SCORES:
  
  {3, 3, 3} → avg=3.0 → score=5.0 (high)   - Máximo potencial
  {3, 3, 2} → avg=2.67 → score=4.3 (high)  - Alto con reserva
  {3, 2, 3} → avg=2.67 → score=4.3 (high)
  {2, 3, 3} → avg=2.67 → score=4.3 (high)
  {2, 2, 3} → avg=2.33 → score=3.7 (medium)
  {2, 2, 2} → avg=2.0 → score=3.0 (medium) - Potencial medio
  {2, 2, 1} → avg=1.67 → score=2.3 (low)
  {1, 2, 2} → avg=1.67 → score=2.3 (low)
  {1, 2, 1} → avg=1.33 → score=1.7 (low)
  {1, 1, 1} → avg=1.0 → score=1.0 (low)    - Mínimo potencial
*/
```

---

## 📝 CAMBIO 2: prisma/schema.prisma

### Agregar 3 campos separados

```prisma
model PerformanceRating {
  id String @id @default(cuid())
  
  // ... campos existentes ...
  
  // 9-Box: Potential Rating (EXISTENTES - NO MODIFICAR)
  potentialScore        Float?    @map("potential_score")
  potentialLevel        String?   @map("potential_level")
  potentialRatedBy      String?   @map("potential_rated_by")
  potentialRatedAt      DateTime? @map("potential_rated_at")
  potentialNotes        String?   @map("potential_notes") @db.Text  // ← MANTENER
  nineBoxPosition       String?   @map("nine_box_position")
  
  // ═══ NUEVOS CAMPOS SEPARADOS (para inteligencia/queries) ═══
  potentialAspiration   Int?      @map("potential_aspiration")   // 1, 2 o 3
  potentialAbility      Int?      @map("potential_ability")      // 1, 2 o 3
  potentialEngagement   Int?      @map("potential_engagement")   // 1, 2 o 3
  
  // ... resto de campos ...
}
```

### Ejecutar migración

```bash
npx prisma migrate dev --name add_potential_factor_fields
```

---

## 📝 CAMBIO 3: PerformanceRatingService.ts

### Modificar interface RatePotentialInput

```typescript
// UBICACIÓN: src/lib/services/PerformanceRatingService.ts
// BUSCAR: export interface RatePotentialInput

// ANTES:
export interface RatePotentialInput {
  ratingId: string
  potentialScore: number
  notes?: string
  ratedBy: string
}

// DESPUÉS: Agregar factores opcionales
import { calculatePotentialScore } from '@/lib/potential-assessment'

export interface RatePotentialInput {
  ratingId: string
  potentialScore?: number          // Ahora opcional si se envían factores
  aspiration?: 1 | 2 | 3           // NUEVO
  ability?: 1 | 2 | 3              // NUEVO
  engagement?: 1 | 2 | 3           // NUEVO
  notes?: string
  ratedBy: string
}
```

### Modificar método ratePotential

```typescript
// BUSCAR: static async ratePotential(input: RatePotentialInput)

static async ratePotential(input: RatePotentialInput) {
  const { 
    ratingId, 
    potentialScore: directScore, 
    aspiration, 
    ability, 
    engagement, 
    notes, 
    ratedBy 
  } = input

  const rating = await prisma.performanceRating.findUnique({
    where: { id: ratingId }
  })

  if (!rating) {
    throw new Error('Rating no encontrado')
  }

  // ═══ NUEVO: Calcular score desde factores o usar directo ═══
  const hasAllFactors = aspiration && ability && engagement
  let finalScore: number

  if (hasAllFactors) {
    // Si vienen los 3 factores, calcular score automáticamente
    finalScore = calculatePotentialScore({ aspiration, ability, engagement })
  } else if (directScore !== undefined) {
    // Backward compatible: usar score directo
    finalScore = directScore
  } else {
    throw new Error('Se requiere potentialScore o los 3 factores (aspiration, ability, engagement)')
  }

  // Calcular nivel y posición 9-Box (código existente)
  const potentialLevel = scoreToNineBoxLevel(finalScore)
  const performanceScore = rating.finalScore ?? rating.calculatedScore
  const performanceLevel = scoreToNineBoxLevel(performanceScore)
  const nineBoxPosition = calculate9BoxPosition(performanceLevel, potentialLevel)

  return prisma.performanceRating.update({
    where: { id: ratingId },
    data: {
      potentialScore: finalScore,
      potentialLevel,
      potentialRatedBy: ratedBy,
      potentialRatedAt: new Date(),
      potentialNotes: notes || null,
      nineBoxPosition,
      // ═══ NUEVOS CAMPOS SEPARADOS ═══
      potentialAspiration: aspiration || null,
      potentialAbility: ability || null,
      potentialEngagement: engagement || null,
      updatedAt: new Date()
    }
  })
}
```

---

## 📝 CAMBIO 4: API PATCH /api/performance-ratings/[id]/potential

### Archivo: src/app/api/performance-ratings/[id]/potential/route.ts

```typescript
// BUSCAR: export async function PATCH(request: NextRequest, ...)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ... código de autenticación existente ...

    const body = await request.json()
    const { potentialScore, notes, aspiration, ability, engagement } = body

    // ═══ VALIDACIÓN ═══
    // Debe venir score O los 3 factores
    const hasAllFactors = aspiration !== undefined && ability !== undefined && engagement !== undefined
    
    if (potentialScore === undefined && !hasAllFactors) {
      return NextResponse.json(
        { success: false, error: 'Se requiere potentialScore o los 3 factores (aspiration, ability, engagement)' },
        { status: 400 }
      )
    }

    // Validar factores si vienen (cada uno debe ser 1, 2 o 3)
    if (hasAllFactors) {
      const validLevels = [1, 2, 3]
      if (!validLevels.includes(aspiration) || 
          !validLevels.includes(ability) || 
          !validLevels.includes(engagement)) {
        return NextResponse.json(
          { success: false, error: 'Cada factor debe ser 1, 2 o 3' },
          { status: 400 }
        )
      }
    }

    // Validar score directo si viene (sin factores)
    if (potentialScore !== undefined && !hasAllFactors) {
      if (typeof potentialScore !== 'number' || potentialScore < 1 || potentialScore > 5) {
        return NextResponse.json(
          { success: false, error: 'potentialScore debe ser un número entre 1 y 5' },
          { status: 400 }
        )
      }
    }

    // Llamar servicio
    const updated = await PerformanceRatingService.ratePotential({
      ratingId: params.id,
      potentialScore: hasAllFactors ? undefined : potentialScore,
      aspiration: hasAllFactors ? aspiration : undefined,
      ability: hasAllFactors ? ability : undefined,
      engagement: hasAllFactors ? engagement : undefined,
      notes: notes || undefined,
      ratedBy: userEmail
    })

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error) {
    console.error('[API ERROR] PATCH potential:', error)
    return NextResponse.json(
      { success: false, error: 'Error actualizando potencial' },
      { status: 500 }
    )
  }
}
```

---

## 🧪 TESTING

### Test 1: API con factores (NUEVO)

```bash
PATCH /api/performance-ratings/{id}/potential
Content-Type: application/json
Authorization: Bearer <token>

{
  "aspiration": 3,
  "ability": 3,
  "engagement": 2,
  "notes": "Alto potencial identificado, compromiso a desarrollar"
}

# Esperar:
{
  "success": true,
  "data": {
    "potentialScore": 4.3,           // Calculado automáticamente
    "potentialLevel": "high",
    "potentialAspiration": 3,        // Campo separado
    "potentialAbility": 3,           // Campo separado
    "potentialEngagement": 2,        // Campo separado
    "potentialNotes": "Alto potencial identificado...",
    "nineBoxPosition": "STAR"
  }
}
```

### Test 2: API con score directo (BACKWARD COMPATIBLE)

```bash
PATCH /api/performance-ratings/{id}/potential
Content-Type: application/json

{
  "potentialScore": 4,
  "notes": "Asignación manual"
}

# Esperar: Funciona igual que antes
{
  "success": true,
  "data": {
    "potentialScore": 4,
    "potentialAspiration": null,     // No se guardaron factores
    "potentialAbility": null,
    "potentialEngagement": null,
    "potentialNotes": "Asignación manual"
  }
}
```

### Test 3: Página actual /ratings sigue funcionando

```yaml
1. Ir a /dashboard/performance/cycles/[id]/ratings
2. Usar botones 1-5 existentes
3. Agregar nota en textarea
4. Guardar
5. Verificar que se guarda correctamente (sin factores)
```

### SQL de Verificación - INTELIGENCIA

```sql
-- ¿Cuántos tienen alta capacidad pero baja aspiración?
SELECT COUNT(*) 
FROM performance_ratings
WHERE potential_ability = 3 
  AND potential_aspiration = 1;

-- Engagement promedio por departamento
SELECT 
  d.display_name as departamento,
  AVG(pr.potential_engagement) as engagement_promedio
FROM performance_ratings pr
JOIN employees e ON pr.employee_id = e.id
JOIN departments d ON e.department_id = d.id
WHERE pr.potential_engagement IS NOT NULL
GROUP BY d.display_name
ORDER BY engagement_promedio ASC;

-- Correlación: bajo engagement + alta capacidad = riesgo fuga
SELECT 
  e.full_name,
  pr.potential_ability,
  pr.potential_engagement,
  pr.potential_score
FROM performance_ratings pr
JOIN employees e ON pr.employee_id = e.id
WHERE pr.potential_ability = 3 
  AND pr.potential_engagement = 1;
```

---

## 📋 PASOS DE IMPLEMENTACIÓN

```yaml
1. Crear lib/potential-assessment.ts (10 min):
   - Tipos
   - Función calculatePotentialScore

2. Migración Prisma (5 min):
   - Agregar 3 campos Int? (aspiration, ability, engagement)
   - npx prisma migrate dev

3. Modificar PerformanceRatingService (15 min):
   - Actualizar interface
   - Modificar método ratePotential

4. Modificar API PATCH (15 min):
   - Agregar validaciones
   - Pasar factores al service

5. Testing (30 min):
   - API con factores
   - API con score directo
   - Página actual sigue funcionando
```

---

## ⚠️ NOTAS IMPORTANTES

### Backward Compatibility Garantizada

```yaml
✅ API sigue aceptando:
   - { potentialScore: 4, notes: "..." }  # Flujo actual (sin factores)
   - { aspiration: 3, ability: 3, engagement: 2, notes: "..." }  # Flujo nuevo
   
✅ Campos existentes NO se modifican:
   - potentialScore sigue siendo Float?
   - potentialNotes sigue siendo String?
   - nineBoxPosition se sigue calculando igual

✅ UI actual sigue funcionando:
   - Botones 1-5 en /ratings
   - Textarea para notas
   - Todo igual hasta que implementemos Task C
```

---

## 🏁 ENTREGABLES

```yaml
Archivos Nuevos:
  - src/lib/potential-assessment.ts

Archivos Modificados:
  - prisma/schema.prisma (3 campos Int? nuevos)
  - src/lib/services/PerformanceRatingService.ts
  - src/app/api/performance-ratings/[id]/potential/route.ts

Migraciones:
  - add_potential_factor_fields
```

---

**FIN DE TASK A**
**Siguiente: TASK B (Conectar Flujos)**

Migraciones:
  - add_potential_factors_json
```

---

**FIN DE TASK A**
**Siguiente: TASK B (Conectar Flujos)**
