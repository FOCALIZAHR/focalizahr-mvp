# 🎯 TASK CORREGIDA v2: Intelligence Panel DENTRO del Contenedor

## ⚠️ ERROR ANTERIOR
Claude Code puso el toggle y componentes FUERA del contenedor principal.
Deben estar DENTRO del área derecha, junto al PerformanceResultCard existente.

---

## 📍 ARCHIVO ÚNICO A MODIFICAR
```
src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
```

---

## 🎯 OBJETIVO VISUAL

El layout actual tiene 2 columnas dentro de un contenedor:
- **Izquierda:** Avatar + Badge "COMPLETADA" + Nombre
- **Derecha:** PerformanceResultCard (RESULTADO + score + barra)

### LO QUE QUIERO:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────┐    ┌────────────────────────────────────────────┐│
│  │                  │    │                                            ││
│  │       PI         │    │  [Calibración] [Alertas]  ← TOGGLE AQUÍ   ││
│  │    (Avatar)      │    │                                            ││
│  │                  │    │  ┌──────────────────────────────────────┐  ││
│  │  ✓ COMPLETADA    │    │  │                                      │  ││
│  │                  │    │  │  SI CALIBRACIÓN:                     │  ││
│  │  Paulina Isabel  │    │  │  - PerformanceResultCard (existente) │  ││
│  │  Montero Reyes   │    │  │  - TeamCalibrationHUD (ranking)      │  ││
│  │                  │    │  │                                      │  ││
│  │  SUPERVISOR...   │    │  │  SI ALERTAS:                         │  ││
│  │                  │    │  │  - ManagementAlertsHUD (consola)     │  ││
│  │                  │    │  │                                      │  ││
│  └──────────────────┘    │  └──────────────────────────────────────┘  ││
│                          └────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTACIÓN ESPECÍFICA

### PASO 1: Identificar el contenedor actual

Busca en el archivo el JSX que tiene la estructura de 2 columnas con el avatar a la izquierda y PerformanceResultCard a la derecha.

Probablemente se ve algo así:
```tsx
<div className="flex ...">
  {/* Columna izquierda - Avatar */}
  <div className="...">
    <Avatar />
    <Badge>COMPLETADA</Badge>
    <h2>{nombre}</h2>
  </div>
  
  {/* Columna derecha - Aquí va el panel */}
  <div className="...">
    {/* PerformanceResultCard existente */}
    <PerformanceResultCard score={...} />
  </div>
</div>
```

### PASO 2: Modificar SOLO la columna derecha

```tsx
{/* Columna derecha - Panel de Inteligencia */}
<div className="...">
  
  {/* Toggle minimalista - DENTRO de la columna */}
  <div className="flex justify-center mb-4">
    <div className="inline-flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
      <button
        onClick={() => setActiveView('calibracion')}
        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
          activeView === 'calibracion'
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Calibración
      </button>
      <button
        onClick={() => setActiveView('alertas')}
        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
          activeView === 'alertas'
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Alertas
      </button>
    </div>
  </div>

  {/* Contenido según vista activa */}
  {activeView === 'calibracion' ? (
    <>
      {/* PerformanceResultCard EXISTENTE - mantener */}
      {summary.averageScore !== null && (
        <PerformanceResultCard score={summary.averageScore} variant="compact" />
      )}
      
      {/* TeamCalibrationHUD - ranking del equipo */}
      {teamMembers.length > 0 ? (
        <TeamCalibrationHUD
          teamMembers={teamMembers}
          currentEvaluateeId={summary.evaluatee?.id}
          maxVisible={5}
          className="mt-4"
        />
      ) : (
        <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 text-center">
          <p className="text-sm text-slate-400">
            No hay suficientes evaluaciones completadas para mostrar el ranking.
          </p>
        </div>
      )}
    </>
  ) : (
    /* ManagementAlertsHUD - Consola de Inteligencia */
    <ManagementAlertsHUD
      competencies={competencies}
      employeeName={displayName}
    />
  )}
</div>
```

---

## 📊 DATOS NECESARIOS

### Estado para vista activa:
```tsx
const [activeView, setActiveView] = useState<'calibracion' | 'alertas'>('calibracion')
```

### Estado para team members (fetch adicional):
```tsx
const [teamMembers, setTeamMembers] = useState<Array<{id: string, name: string, score: number}>>([])

useEffect(() => {
  async function fetchTeam() {
    const token = localStorage.getItem('focalizahr_token')
    if (!token) return
    
    const res = await fetch('/api/evaluator/assignments', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const json = await res.json()
    if (json.success) {
      const members = json.assignments
        .filter((a: any) => a.status === 'COMPLETED' && a.avgScore !== null)
        .map((a: any) => ({
          id: a.evaluatee.id,
          name: a.evaluatee.fullName,
          score: a.avgScore / 20  // 0-100 → 1-5
        }))
        .sort((a: any, b: any) => b.score - a.score)
      
      setTeamMembers(members)
    }
  }
  fetchTeam()
}, [])
```

### Competencias desde categorizedResponses:
```tsx
const competencies = useMemo(() => {
  if (!data?.summary?.categorizedResponses) return []
  
  return Object.entries(data.summary.categorizedResponses).map(([name, responses]) => {
    const ratings = responses.filter((r: any) => r.rating !== null).map((r: any) => r.rating)
    const avg = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
    return { name, score: avg }
  })
}, [data?.summary?.categorizedResponses])
```

---

## ❌ LO QUE NO DEBE HACER

1. **NO** poner el toggle fuera del contenedor principal
2. **NO** crear una sección separada arriba del layout de 2 columnas
3. **NO** modificar la estructura del avatar (columna izquierda)
4. **NO** quitar PerformanceResultCard de la vista Calibración

---

## ✅ RESULTADO ESPERADO

- Toggle pequeño y minimalista DENTRO de la columna derecha
- Vista Calibración: PerformanceResultCard + TeamCalibrationHUD (debajo)
- Vista Alertas: ManagementAlertsHUD (reemplaza todo el contenido de la columna derecha)
- Las respuestas por categoría siguen apareciendo DEBAJO de todo el contenedor principal

---

## 🎨 TAMAÑOS

- Toggle: `text-xs`, `px-4 py-1.5` (compacto)
- Debe caber en el espacio de la columna derecha sin desbordar
