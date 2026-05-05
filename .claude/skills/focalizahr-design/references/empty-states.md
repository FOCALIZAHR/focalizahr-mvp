# 🕳️ EMPTY STATES — La Ausencia También es Dato
## Referencia de diseño FocalizaHR — leer cuando un componente puede no tener datos

> **MANDAMIENTO ABSOLUTO:** `return null` no existe en FocalizaHR.
> Una pantalla vacía le dice al CEO "el sistema no tiene nada".
> Un estado con significado le dice "analizamos — y esto es lo que encontramos".
> Apple no muestra pantallas vacías. FocalizaHR tampoco.

---

### Los 4 Estados Obligatorios

Cada componente que puede no tener datos DEBE implementar uno de estos cuatro estados.
Nunca `return null`. Nunca `return <></>`. Nunca ausencia sin intención.

---

#### Estado 1 — SIN CICLO ACTIVO
**Cuándo:** El módulo existe pero aún no se ha completado ningún ciclo.

```tsx
<FHREmptyState
  type="pending"
  title="Inteligencia en espera"
  description="Este análisis se activará al completar el primer ciclo de medición."
  cta={{ label: "Configurar primer ciclo", href: "/dashboard/campaigns/new" }}
/>
```

**Textos por módulo:**
- Exit Intelligence → *"Los patrones de salida se construyen con el primer ciclo completado."*
- Onboarding Journey → *"El seguimiento de integración comienza con el primer colaborador activo."*
- Exposición IA → *"El diagnóstico de exposición requiere cargar la nómina de colaboradores."*
- 9-Box → *"La matriz de talento se activa al completar el primer ciclo 360°."*

---

#### Estado 2 — VOLUMEN INSUFICIENTE
**Cuándo:** Hay datos pero no alcanzan el umbral mínimo para análisis confiable (n < 5).

```tsx
<FHREmptyState
  type="insufficient"
  title="Volumen insuficiente para análisis"
  description="El número de respuestas no alcanzó el umbral mínimo. La brevedad de la participación puede ser en sí misma una señal a observar."
  meta="Se requieren mínimo 5 respuestas por departamento."
/>
```

**Regla crítica:** Nunca suprimir sin explicar.
La frase *"puede ser en sí misma una señal"* convierte la limitación en inteligencia.

---

#### Estado 3 — ANÁLISIS COMPLETO SIN SEÑALES
**Cuándo:** El ciclo se completó, el análisis corrió, y no se detectaron patrones de riesgo.

```tsx
<FHREmptyState
  type="clear"
  title="Sin señales de riesgo detectadas"
  description="El análisis no identificó patrones que requieran atención este ciclo."
  insight="Las respuestas sugieren un ambiente psicológicamente seguro para expresarse."
/>
```

**Este es el estado más importante de todos.**
Un sistema que solo habla cuando hay problemas genera desconfianza.
Un sistema que confirma cuando todo está bien genera confianza.

**Textos por módulo:**
- Ambiente Sano → *"No se detectaron patrones de silencio, hostilidad ni señales Ley Karin."*
- Exit Intelligence → *"Las salidas de este período no muestran patrones sistemáticos de liderazgo o clima."*
- Onboarding → *"Todos los colaboradores activos muestran EXO Day-30 sobre el umbral saludable."*
- Performance → *"No se detectaron contradicciones críticas entre dominio y compromiso este ciclo."*

---

#### Estado 4 — CRUCE REQUERIDO
**Cuándo:** El análisis necesita datos de otro módulo que aún no está activo.

```tsx
<FHREmptyState
  type="requires"
  title="Análisis bloqueado — dato cruzado pendiente"
  description="Para activar esta vista se requiere completar el módulo de Performance 360°."
  cta={{ label: "Activar Performance 360°", href: "/dashboard/performance" }}
/>
```

**No es un error — es una invitación.**
El tono nunca es de falla. Es de *"el sistema está listo, falta un ingrediente"*.

---

### Componente `FHREmptyState` — Implementación Canónica

```tsx
// components/ui/FHREmptyState.tsx

type EmptyStateType = 'pending' | 'insufficient' | 'clear' | 'requires'

interface FHREmptyStateProps {
  type: EmptyStateType
  title: string
  description: string
  insight?: string   // Frase interpretativa adicional (solo en 'clear' e 'insufficient')
  meta?: string      // Dato técnico secundario (ej: "n mínimo = 5")
  cta?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

const TYPE_CONFIG = {
  pending:      { icon: Clock,        color: 'text-slate-400',  border: 'border-slate-700/50' },
  insufficient: { icon: BarChart2,    color: 'text-amber-400',  border: 'border-amber-500/20' },
  clear:        { icon: ShieldCheck,  color: 'text-emerald-400',border: 'border-emerald-500/20' },
  requires:     { icon: Link2,        color: 'text-cyan-400',   border: 'border-cyan-500/20' },
}

export function FHREmptyState({ type, title, description, insight, meta, cta }: FHREmptyStateProps) {
  const config = TYPE_CONFIG[type]
  const Icon = config.icon

  return (
    <div className={`
      rounded-xl border ${config.border}
      bg-slate-900/40 backdrop-blur-sm
      px-6 py-8 text-center
      flex flex-col items-center gap-3
    `}>
      {/* Ícono */}
      <div className={`${config.color} opacity-60`}>
        <Icon size={32} strokeWidth={1.5} />
      </div>

      {/* Título */}
      <h3 className="text-slate-200 font-light text-base">
        {title}
      </h3>

      {/* Descripción */}
      <p className="text-slate-400 font-light text-sm max-w-sm leading-relaxed">
        {description}
      </p>

      {/* Insight interpretativo (opcional) */}
      {insight && (
        <p className="text-slate-500 font-light text-xs italic max-w-xs">
          {insight}
        </p>
      )}

      {/* Dato técnico (opcional) */}
      {meta && (
        <span className="text-[10px] uppercase tracking-widest text-slate-600">
          {meta}
        </span>
      )}

      {/* CTA (opcional) */}
      {cta && (
        <div className="mt-2">
          {cta.href ? (
            <Link href={cta.href} className="fhr-btn-secondary text-sm px-4 py-2">
              {cta.label}
            </Link>
          ) : (
            <button onClick={cta.onClick} className="fhr-btn-secondary text-sm px-4 py-2">
              {cta.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

---

### Reglas de Uso — Checklist

```yaml
ANTES de retornar null o vacío, preguntarse:

□ ¿Por qué no hay datos? → Elegir el tipo correcto (pending/insufficient/clear/requires)
□ ¿El título describe qué se analizó? → No "Sin datos", sino "Sin señales de riesgo detectadas"
□ ¿La descripción interpreta la ausencia? → La ausencia siempre tiene un significado
□ ¿El tono es de inteligencia o de error? → Nunca error, siempre diagnóstico
□ ¿Hay un CTA cuando la acción tiene sentido? → No siempre — solo cuando hay algo que hacer
□ ¿El componente usa FHREmptyState? → Nunca implementar ad-hoc
```

---

### Anti-Patrones Prohibidos

```yaml
❌ return null
❌ return <></>
❌ {data?.length === 0 && <div></div>}
❌ "No hay datos disponibles"
❌ "Sin información"
❌ "N/A"
❌ Pantalla en blanco sin texto
❌ Spinner infinito cuando no hay datos

✅ FHREmptyState con type correcto
✅ Título que describe qué se analizó
✅ Descripción que interpreta la ausencia
✅ Insight cuando la ausencia es dato
✅ CTA cuando hay acción disponible
```

---

### Dónde se Aplica — Inventario de Módulos Prioritarios

```yaml
Alta prioridad (return null confirmados o probables):
  - Componente La Voz (Ambiente Sano) — variante null render
  - Efficiency Hub lentes sin datos de seed
  - Exit Intelligence sin ciclos completados
  - Onboarding Journey sin colaboradores activos
  - 9-Box sin ciclo 360° previo
  - Benchmarks con n < threshold

Media prioridad (verificar):
  - Sucesión Inteligente sin candidatos definidos
  - Metas sin cascadeo corporativo activo
  - Signos Vitales / ISD con departamentos sin datos
  - Performance 360° antes de primer ciclo
```
