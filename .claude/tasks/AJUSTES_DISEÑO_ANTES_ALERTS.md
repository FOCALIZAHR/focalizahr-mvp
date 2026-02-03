# 🎨 AJUSTES DE DISEÑO: Vista Calibración

## ARCHIVOS A MODIFICAR
```
1. src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
2. src/components/performance/TeamCalibrationHUD.tsx
```

---

# 📐 AJUSTE 1: Ancho de componentes al 70%

## Problema:
Los componentes PerformanceScoreCard y TeamCalibrationHUD ocupan todo el ancho y se ven muy grandes.

## Solución en summary/page.tsx:

```tsx
{/* Columna derecha - contenedor con max-width */}
<div className="flex-1 flex flex-col items-center">
  
  {/* Toggle - mantener arriba a la derecha */}
  <div className="w-full flex justify-end mb-4">
    {/* ... toggle code ... */}
  </div>

  {/* Contenedor de componentes con ancho limitado */}
  <div className="w-full max-w-sm space-y-4">
    
    {activeView === 'calibracion' ? (
      <>
        {/* PerformanceScoreCard */}
        {summary.averageScore !== null && (
          <PerformanceScoreCard 
            score={summary.averageScore}
            showProgressBar
            showTeslaLine
            size="sm"  // ← CAMBIAR de "md" a "sm"
          />
        )}
        
        {/* TeamCalibrationHUD */}
        {teamMembers.length > 0 ? (
          <TeamCalibrationHUD
            teamMembers={teamMembers}
            currentEvaluateeId={summary.evaluatee?.id || assignmentId}
            maxVisible={5}
          />
        ) : (
          /* mensaje sin datos */
        )}
      </>
    ) : (
      <ManagementAlertsHUD ... />
    )}
    
  </div>
</div>
```

**Clave:** `max-w-sm` (384px) o `max-w-md` (448px) limita el ancho.

---

# 🏆 AJUSTE 2: Destacar persona actual en ranking

## Problema:
Paulina (la persona siendo evaluada) no está destacada visualmente en el ranking.

## Solución en TeamCalibrationHUD.tsx:

### El componente ya tiene `currentEvaluateeId` pero debe usarlo para destacar:

```tsx
{visibleMembers.map((member) => {
  const isCurrentUser = member.id === currentEvaluateeId
  
  return (
    <div
      key={member.id}
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
        isCurrentUser 
          ? 'bg-cyan-500/15 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
          : 'hover:bg-slate-700/30'
      }`}
    >
      {/* Posición con highlight */}
      <span className={`w-6 text-xs font-mono ${
        isCurrentUser ? 'text-cyan-400 font-bold' : 'text-slate-500'
      }`}>
        {String(rank).padStart(2, '0')}
      </span>
      
      {/* Nombre con highlight + indicador */}
      <span className={`flex-1 text-sm truncate ${
        isCurrentUser ? 'text-cyan-300 font-semibold' : 'text-slate-300'
      }`}>
        {shortName}
        {isCurrentUser && (
          <span className="ml-2 text-cyan-400 text-xs">← Tú</span>
        )}
      </span>
      
      {/* Score con color de clasificación */}
      <span 
        className={`text-sm font-medium ${isCurrentUser ? 'font-bold' : ''}`}
        style={{ color: classification.color }}
      >
        {member.score.toFixed(1)}
      </span>
      
      {/* Barra */}
      <div className={`w-20 h-1.5 rounded-full overflow-hidden ${
        isCurrentUser ? 'bg-slate-600' : 'bg-slate-700/50'
      }`}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${barWidth}%`,
            backgroundColor: classification.color
          }}
        />
      </div>
    </div>
  )
})}
```

---

# 📝 AJUSTE 3: Reducir tamaños de fuente

## En TeamCalibrationHUD.tsx:

```tsx
// Header más compacto
<div className="px-3 py-2 border-b border-slate-700/30 flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Trophy className="w-3.5 h-3.5 text-amber-400" />
    <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">
      Calibración de Equipo
    </span>
  </div>
  {isTopPerformer && (
    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded">
      TOP 10%
    </span>
  )}
</div>

// Lista con padding reducido
<div className="p-2.5 space-y-1.5">
  {/* items */}
</div>

// Nombres más cortos
const shortName = formatShortName(member.name)  // "G. Veliz, Ivalu" → "Ivalu G."

// Footer más compacto
<div className="px-3 py-2 border-t border-slate-700/30 bg-slate-800/30">
  <div className="flex items-center justify-between text-[10px]">
    <span className="text-slate-500">
      Promedio: <span className="text-slate-300 font-medium">{teamAvg.toFixed(1)}</span>
    </span>
    {currentPosition > 0 && (
      <span className="text-slate-500">
        Posición <span className="text-cyan-400 font-bold">#{currentPosition}</span>/{sorted.length}
      </span>
    )}
  </div>
</div>
```

---

# 🔧 FUNCIÓN HELPER: Formatear nombre corto

```tsx
// Formatear nombre: "VELIZ,IVALU XIMENA" → "Ivalu V."
function formatShortName(fullName: string): string {
  // Si tiene coma, está en formato "APELLIDO,NOMBRE"
  if (fullName.includes(',')) {
    const [apellido, nombres] = fullName.split(',').map(s => s.trim())
    const primerNombre = nombres.split(' ')[0]
    // Capitalizar
    const nombreCap = primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase()
    const inicialApe = apellido.charAt(0).toUpperCase()
    return `${nombreCap} ${inicialApe}.`
  }
  
  // Formato normal "Nombre Apellido"
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    const nombre = parts[0]
    const apellido = parts[parts.length - 1]
    return `${nombre} ${apellido[0]}.`
  }
  
  return fullName
}
```

**Ejemplos:**
- "G. VELIZ,IVALU XIMENA" → "Ivalu V."
- "M. REYES,PAULINA ISABEL" → "Paulina R."
- "Paulina Isabel Montero" → "Paulina M."

---

# 📋 CHECKLIST

```
□ 1. En summary/page.tsx:
     - Agregar max-w-sm al contenedor de componentes
     - Cambiar PerformanceScoreCard size="md" → size="sm"

□ 2. En TeamCalibrationHUD.tsx:
     - Reducir paddings (px-3 py-2 en lugar de px-4 py-3)
     - Reducir fuentes (text-xs, text-[10px])
     - Destacar currentEvaluateeId con:
       • Borde cyan
       • Background cyan/15
       • Indicador "← Tú"
       • Fuente bold
     - Agregar función formatShortName para nombres más legibles

□ 3. Verificar visualmente que:
     - Componentes ocupan ~70% del ancho
     - Paulina está claramente destacada
     - Fuentes son legibles pero no gigantes
```

---

# 🎯 RESULTADO ESPERADO

```
┌──────────────────┬─────────────────────────────────────┐
│                  │                 [Calibración][Alert]│
│       PI         │                                     │
│                  │  ┌─────────────────────────┐        │
│  ✓ COMPLETADA    │  │  Score de Desempeño     │        │
│                  │  │  4.0 /5.0               │        │
│  Paulina Isabel  │  │  Supera Expectativas    │        │
│  Montero Reyes   │  │  ████████████████░░░░   │        │
│                  │  └─────────────────────────┘        │
│  SUPERVISOR...   │                                     │
│                  │  ┌─────────────────────────┐        │
│                  │  │ 🏆 CALIBRACIÓN EQUIPO   │        │
│                  │  │                         │        │
│                  │  │ 01  Ivalu V.    4.2 ███ │        │
│                  │  │ 02  Paulina R.  4.0 ███ │← Tú    │ ← DESTACADA
│                  │  │ 03  Juan G.     4.0 ███ │        │
│                  │  │ 04  Claudia S.  3.8 ██▓ │        │
│                  │  │ 05  Herman F.   3.3 ██  │        │
│                  │  │    ▼ +3 más             │        │
│                  │  │─────────────────────────│        │
│                  │  │ Prom: 3.8   Pos #2/8    │        │
│                  │  └─────────────────────────┘        │
│                  │                                     │
└──────────────────┴─────────────────────────────────────┘
```

Componentes centrados, ~70% ancho, Paulina destacada con borde cyan.
