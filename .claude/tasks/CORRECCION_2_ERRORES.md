# 🔧 CORRECCIÓN: 2 Errores en Panel de Inteligencia

## ARCHIVO
```
src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
```

---

## ❌ ERROR 1: Toggle centrado y muy grande

### Problema:
- Toggle está centrado verticalmente en la columna
- Botones muy grandes, no son premium FocalizaHR

### Solución:
- Toggle ARRIBA de todo el contenido de la columna derecha
- Botones minimalistas, pequeños (`text-xs`, `py-1 px-3`)
- Usar clases FocalizaHR o colores corporativos (cyan activo)

### Código correcto del toggle:
```tsx
{/* Toggle - ARRIBA, minimalista */}
<div className="flex justify-end mb-4">
  <div className="inline-flex bg-slate-800/30 rounded-md p-0.5 border border-slate-700/30">
    <button
      onClick={() => setActiveView('calibracion')}
      className={`px-3 py-1 text-xs font-medium rounded transition-all ${
        activeView === 'calibracion'
          ? 'bg-cyan-500 text-white'
          : 'text-slate-400 hover:text-white'
      }`}
    >
      Calibración
    </button>
    <button
      onClick={() => setActiveView('alertas')}
      className={`px-3 py-1 text-xs font-medium rounded transition-all ${
        activeView === 'alertas'
          ? 'bg-cyan-500 text-white'
          : 'text-slate-400 hover:text-white'
      }`}
    >
      Alertas
    </button>
  </div>
</div>
```

---

## ❌ ERROR 2: Borró PerformanceResultCard

### Problema:
- La vista Calibración NO muestra el score ni la clasificación
- Solo muestra mensaje "No hay suficientes evaluaciones"
- PerformanceResultCard fue eliminado

### Solución:
- Vista Calibración = PerformanceResultCard (SIEMPRE) + TeamCalibrationHUD (si hay datos)
- El PerformanceResultCard con RESULTADO, clasificación y barra DEBE estar siempre visible

### Código correcto de la vista Calibración:
```tsx
{activeView === 'calibracion' ? (
  <div className="space-y-4">
    
    {/* 1. PerformanceResultCard - SIEMPRE VISIBLE */}
    {summary.averageScore !== null && (() => {
      const avgScore = summary.averageScore / 20  // 0-100 → 1-5
      const classification = getPerformanceClassification(avgScore)
      const progressPercent = (avgScore / 5) * 100
      
      return (
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
            Resultado
          </p>
          <p className="text-lg font-semibold mb-3" style={{ color: classification.color }}>
            {classification.label}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: `linear-gradient(90deg, ${classification.color}80, ${classification.color})`
                }}
              />
            </div>
            <span className="text-sm font-semibold" style={{ color: classification.color }}>
              {avgScore.toFixed(1)}/5
            </span>
          </div>
        </div>
      )
    })()}
    
    {/* 2. TeamCalibrationHUD - Solo si hay datos */}
    {teamMembers.length > 0 ? (
      <TeamCalibrationHUD
        teamMembers={teamMembers}
        currentEvaluateeId={summary.evaluatee?.id || assignmentId}
        maxVisible={5}
      />
    ) : (
      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 text-center">
        <p className="text-sm text-slate-400">
          No hay suficientes evaluaciones completadas para mostrar el ranking.
        </p>
      </div>
    )}
    
  </div>
) : (
  /* Vista Alertas */
  <ManagementAlertsHUD
    competencies={competencies}
    employeeName={displayName}
  />
)}
```

---

## 📋 RESUMEN DE CAMBIOS

1. **Toggle:** Mover ARRIBA con `justify-end`, botones pequeños `text-xs py-1 px-3`, color cyan sólido cuando activo

2. **Vista Calibración:** 
   - PRIMERO: PerformanceResultCard (RESULTADO + clasificación + barra)
   - SEGUNDO: TeamCalibrationHUD o mensaje "No hay suficientes"

3. **NO BORRAR** el código que renderiza el score y la clasificación

---

## 🎯 RESULTADO ESPERADO

Vista Calibración:
```
[Calibración] [Alertas]     ← arriba a la derecha, pequeño
─────────────────────────────
RESULTADO
Supera Expectativas         ← clasificación con color
████████████████░░░░ 4.0/5  ← barra de progreso
─────────────────────────────
🏆 RANKING DEL EQUIPO       ← o mensaje si no hay datos
1. Juan Pérez     4.2
2. Paulina ◀      4.0
3. Carlos         3.8
```
