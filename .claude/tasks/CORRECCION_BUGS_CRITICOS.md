# 🚨 CORRECCIÓN CRÍTICA: 2 Bugs en Página Summary

## ARCHIVO
```
src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
```

---

## 🐛 BUG 1: Score 0.0 (Conversión incorrecta)

### Causa raíz:
El API `/api/evaluator/assignments/[id]/summary` retorna `averageScore` **YA en escala 1-5** (es el promedio de `normalizedScore`).

Pero Claude Code copió lógica de otra página que usa `/api/evaluator/assignments` donde `avgScore` está en **escala 0-100**.

### ❌ CÓDIGO INCORRECTO (buscar y eliminar):
```typescript
const avgScore = summary.averageScore / 20  // ❌ ESTO ESTÁ MAL
```

### ✅ CÓDIGO CORRECTO:
```typescript
// El averageScore del API /summary YA está en escala 1-5
// NO dividir por 20
const avgScore = summary.averageScore  // ✅ Ya está en 1-5
```

### Verificar en el render del PerformanceResultCard:
```typescript
{summary.averageScore !== null && (() => {
  // ✅ CORRECTO: averageScore YA está en escala 1-5, NO dividir
  const avgScore = summary.averageScore
  const classification = getPerformanceClassification(avgScore)
  const progressPercent = (avgScore / 5) * 100
  
  return (
    <div className="...">
      {/* ... */}
      <span>{avgScore.toFixed(1)}/5</span>
    </div>
  )
})()}
```

---

## 🐛 BUG 2: Ranking sin datos (8 completados pero dice "No hay suficientes")

### Causa probable:
El fetch de team members está fallando silenciosamente o tiene un error.

### ✅ CÓDIGO CORRECTO para fetchTeamData:

```typescript
// Estado para team members
const [teamMembers, setTeamMembers] = useState<Array<{
  id: string
  name: string
  score: number
}>>([])

// Fetch team data
useEffect(() => {
  async function fetchTeamData() {
    try {
      const token = localStorage.getItem('focalizahr_token')
      if (!token) {
        console.log('[Summary] No token for team fetch')
        return
      }

      console.log('[Summary] Fetching team data...')
      
      const res = await fetch('/api/evaluator/assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        console.error('[Summary] Team fetch failed:', res.status)
        return
      }

      const json = await res.json()
      console.log('[Summary] Team response:', json.success, 'assignments:', json.assignments?.length)
      
      if (json.success && json.assignments) {
        // Filtrar solo completados con score
        const completedWithScore = json.assignments.filter((a: any) => 
          a.status === 'completed' && a.avgScore !== null
        )
        
        console.log('[Summary] Completed with score:', completedWithScore.length)
        
        // Transformar y ordenar
        const members = completedWithScore.map((a: any) => ({
          id: a.evaluatee.id,
          name: a.evaluatee.fullName,
          // avgScore de /api/evaluator/assignments está en 0-100, convertir a 1-5
          score: a.avgScore / 20
        }))
        .sort((a: any, b: any) => b.score - a.score)
        
        console.log('[Summary] Team members:', members.length, members)
        setTeamMembers(members)
      }
    } catch (err) {
      console.error('[Summary] Error fetching team data:', err)
    }
  }

  fetchTeamData()
}, [])
```

### Verificar que el filtro de status sea correcto:
El API retorna status en **lowercase**: `'completed'`, `'pending'`, etc.

```typescript
// ❌ INCORRECTO
.filter(a => a.status === 'COMPLETED')  // Mayúsculas no match

// ✅ CORRECTO  
.filter(a => a.status === 'completed')  // Minúsculas
```

---

## 📋 RESUMEN DE CAMBIOS

| Bug | Problema | Solución |
|-----|----------|----------|
| Score 0.0 | `summary.averageScore / 20` | NO dividir, ya está en 1-5 |
| Ranking vacío | `status === 'COMPLETED'` | Usar `status === 'completed'` (lowercase) |
| Ranking vacío | Sin console.log | Agregar logs para debug |

---

## 🔍 CÓMO VERIFICAR

1. Abrir DevTools → Console
2. Buscar logs `[Summary]`
3. Verificar:
   - "Fetching team data..." aparece
   - "Team response: true assignments: 8" 
   - "Completed with score: X"
   - "Team members: X [array]"

Si no aparecen logs, el useEffect no se está ejecutando.
Si aparece "Team response" pero "Completed with score: 0", el filtro está mal.

---

## 🎯 RESULTADO ESPERADO

```
┌──────────────────┬─────────────────────────────────────┐
│                  │            [Calibración] [Alertas] │
│       PI         ├─────────────────────────────────────┤
│                  │  RESULTADO                          │
│  ✓ COMPLETADA    │  Supera Expectativas               │
│                  │  ████████████████░░░░ 4.0/5        │ ← Ya no 0.0
│  Paulina...      ├─────────────────────────────────────┤
│                  │  🏆 RANKING DEL EQUIPO              │
│                  │  1. Juan      4.2                   │ ← Ya no "sin datos"
│                  │  2. Paulina ◀ 4.0                   │
│                  │  3. Carlos    3.8                   │
└──────────────────┴─────────────────────────────────────┘
```
