# 🧠 TAREA: ISD con Inteligencia Visible - Diseño FocalizaHR Premium

## CONTEXTO CRÍTICO

El ISD **NO es un número**. Es el **centro neurálgico** donde TODOS los productos FocalizaHR confluyen:
- Onboarding Journey → EXO Score + Alertas
- Exit Intelligence → EIS Score + Factores
- Culture Scope → ICC Score (el ALMA del departamento)
- Ambiente Sano → Ley Karin
- Clima/Pulso → Score actual
- Datos Duros → Rotación, Ausentismo, Denuncias

**El ISD detecta PATRONES cruzando estos datos.** Eso es la inteligencia. Eso es lo que nadie más tiene.

## ARCHIVO A MODIFICAR
```
src/app/dashboard/system/page.tsx
```

## FILOSOFÍA DISEÑO FOCALIZAHR
- 70% Apple: Minimalismo, espaciado generoso, font-light
- 20% Tesla: Datos elegantes, líneas de luz, dark mode
- 10% Institucional: Confianza, credibilidad
- **Cyan (#22D3EE)**: Innovación, acción, interacción
- **Púrpura (#A78BFA)**: Premium, inteligencia, sofisticación
- **NO semáforo escolar**: Los colores susurran, no gritan

## FONDO CORRECTO FOCALIZAHR
```css
/* EL FONDO ES SLATE OSCURO, NO LILA */
--fhr-bg-primary: #0F172A;  /* ← ESTE es el color correcto */

/* Usar clase: */
.fhr-bg-main {
  background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
}

/* NO usar fondos lila/púrpura como bg-purple-500/5 */
```

## BOTONES SISTEMA FOCALIZAHR
```tsx
/* Usar clases del sistema, NO crear botones custom */

// Botón primario (gradiente cyan→purple)
<button className="fhr-btn fhr-btn-primary">
  Ver plan de intervención
</button>

// Botón secundario (outline cyan)
<button className="fhr-btn fhr-btn-secondary">
  Cancelar
</button>

// O usar PremiumButton si está disponible
import { PrimaryButton } from '@/components/ui/PremiumButton';
<PrimaryButton icon={ArrowRight}>
  Ver plan de intervención
</PrimaryButton>
```

---

## ESTRUCTURA VISUAL PROPUESTA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ HERO: Dinero + Contexto                                           │ │
│  │                                                                   │ │
│  │                    $135M                                          │ │
│  │                  en riesgo                                        │ │
│  │           ━━━━━━━━━━━━━━━━━━━━━━━━━━━  (18% de nómina anual)      │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ PATRÓN DETECTADO (La inteligencia)                     [púrpura]  │ │
│  │                                                                   │ │
│  │  🧠 Patrón: "Hipocresía Corporativa"                              │ │
│  │                                                                   │ │
│  │  Correlación detectada:                                           │ │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐                       │ │
│  │  │ EXIT    │ ─► │ CULTURE │ ─► │ONBOARD  │  = Coincidencia 87%   │ │
│  │  │ EIS: 35 │    │ ICC: 42 │    │ EXO: 38 │                       │ │
│  │  └─────────┘    └─────────┘    └─────────┘                       │ │
│  │                                                                   │ │
│  │  "Los que se van, los que miden cultura, y los nuevos            │ │
│  │   coinciden: valores declarados ≠ conducta real"                 │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─────────────────────────────────┐ ┌─────────────────────────────────┐│
│  │ DEPARTAMENTO CRÍTICO    [cyan] │ │ PREDICCIÓN + ACCIÓN             ││
│  │                                │ │                                 ││
│  │ Operaciones                    │ │ Si no actúas en 30 días:        ││
│  │       34                       │ │                                 ││
│  │                                │ │ • 3 personas clave renunciarán  ││
│  │ ┌──────────────────────────┐   │ │ • Costo: $57M                   ││
│  │ │ Síntomas convergentes:   │   │ │ • Contagio a Ventas probable   ││
│  │ │ • ICC: 42 (cultura rota) │   │ │                                 ││
│  │ │ • 5 alertas onboarding   │   │ │ [Ver plan de intervención →]   ││
│  │ │ • Rotación: 25%          │   │ │                                 ││
│  │ └──────────────────────────┘   │ │                                 ││
│  └─────────────────────────────────┘ └─────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PASO 1: Actualizar interfaces

BUSCAR las interfaces existentes y AGREGAR estas nuevas:

```tsx
// Agregar después de las interfaces existentes

interface PatronDetectado {
  nombre: string;
  descripcion: string;
  correlacion: {
    productos: Array<{
      nombre: string;
      score: number;
      label: string;
    }>;
    coincidencia: number;
  };
  insight: string;
}

interface PrediccionRiesgo {
  timeline: string;
  consecuencias: string[];
  costoProyectado: string;
  probabilidad: number;
}

interface DepartmentoCritico {
  nombre: string;
  isd: number;
  sintomasConvergentes: string[];
  patronAsociado: string;
  costoEnJuego: string;
}
```

---

## PASO 2: Reemplazar componente ISDPreviewMock COMPLETO

BUSCAR `function ISDPreviewMock()` y REEMPLAZAR TODO con:

```tsx
function ISDPreviewMock() {
  // Datos mock que representan la inteligencia real
  const patronDetectado: PatronDetectado = {
    nombre: "Hipocresía Corporativa",
    descripcion: "Desconexión entre valores declarados y conducta real",
    correlacion: {
      productos: [
        { nombre: "Exit", score: 35, label: "EIS" },
        { nombre: "Culture", score: 42, label: "ICC" },
        { nombre: "Onboard", score: 38, label: "EXO" },
      ],
      coincidencia: 87
    },
    insight: "Los que se van, los que miden cultura, y los nuevos coinciden: valores declarados ≠ conducta real"
  };

  const prediccion: PrediccionRiesgo = {
    timeline: "30 días",
    consecuencias: [
      "3 personas clave con 85% prob. de renuncia",
      "Efecto contagio a Ventas y Marketing",
      "Pérdida conocimiento crítico irreversible"
    ],
    costoProyectado: "$57M",
    probabilidad: 85
  };

  const deptoCritico: DepartmentoCritico = {
    nombre: "Operaciones",
    isd: 34,
    sintomasConvergentes: [
      "ICC: 42 — cultura desalineada",
      "5 alertas onboarding abiertas",
      "Rotación 12m: 25%",
      "EIS menciona 'liderazgo' en 4/5 salidas"
    ],
    patronAsociado: "Hipocresía Corporativa",
    costoEnJuego: "$57M"
  };

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════════════
          HERO: Dinero + Contexto
          ═══════════════════════════════════════════════════════════════ */}
      <div className="text-center py-8">
        <p className="text-5xl sm:text-6xl font-light text-cyan-400 mb-2">
          $135M
        </p>
        <p className="text-lg text-slate-400 font-light mb-4">en riesgo organizacional</p>
        
        {/* Barra de contexto */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 justify-center mb-2">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '18%' }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-sm text-slate-400">18% de nómina</span>
          </div>
          <p className="text-xs text-slate-500">
            Calculado desde: rotación proyectada + costos reemplazo + pérdida productividad
          </p>
        </div>
      </div>

      {/* Divider con línea Tesla */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>
        <div className="relative flex justify-center">
          <div className="px-4 bg-slate-900">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PATRÓN DETECTADO - La Inteligencia
          ═══════════════════════════════════════════════════════════════ */}
      <motion.div 
        className="relative p-6 rounded-2xl border border-slate-700/50 bg-slate-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Línea Tesla superior - gradiente sutil */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{ 
            background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)' 
          }} 
        />
        
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-purple-400 uppercase tracking-wider mb-1">Patrón Detectado</p>
            <h3 className="text-xl font-light text-white">"{patronDetectado.nombre}"</h3>
          </div>
        </div>

        {/* Correlación visual de productos */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-3">Correlación entre productos FocalizaHR:</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {patronDetectado.correlacion.productos.map((prod, i) => (
              <div key={prod.nombre} className="flex items-center gap-2">
                <div className="px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-center min-w-[80px]">
                  <p className="text-xs text-slate-500 mb-1">{prod.nombre}</p>
                  <p className="text-lg font-light text-white">{prod.score}</p>
                  <p className="text-[10px] text-slate-600">{prod.label}</p>
                </div>
                {i < patronDetectado.correlacion.productos.length - 1 && (
                  <div className="text-purple-400/50">
                    <Zap className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div className="px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <p className="text-sm text-purple-400 font-medium">{patronDetectado.correlacion.coincidencia}%</p>
              <p className="text-[10px] text-purple-400/70">coincidencia</p>
            </div>
          </div>
        </div>

        {/* Insight */}
        <p className="text-sm text-slate-300 text-center italic">
          "{patronDetectado.insight}"
        </p>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════
          GRID: Departamento Crítico + Predicción
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Departamento Crítico */}
        <motion.div 
          className="relative p-5 rounded-2xl border border-slate-700/50 bg-slate-800/50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Línea Tesla cyan */}
          <div 
            className="absolute top-0 left-0 right-0 h-px"
            style={{ 
              background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)' 
            }} 
          />
          
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1">Requiere Intervención</p>
              <h3 className="text-2xl font-light text-white">{deptoCritico.nombre}</h3>
            </div>
            <div className="text-right">
              <p className="text-4xl font-light text-cyan-400">{deptoCritico.isd}</p>
              <p className="text-xs text-slate-500">ISD Score</p>
            </div>
          </div>

          {/* Síntomas convergentes */}
          <div className="space-y-2 mb-4">
            <p className="text-xs text-slate-500">Síntomas convergentes:</p>
            {deptoCritico.sintomasConvergentes.map((sintoma, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/70" />
                {sintoma}
              </div>
            ))}
          </div>

          {/* Costo */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-500">Costo en juego:</span>
            <span className="text-lg font-light text-cyan-400">{deptoCritico.costoEnJuego}</span>
          </div>
        </motion.div>

        {/* Predicción */}
        <motion.div 
          className="relative p-5 rounded-2xl border border-slate-700/50 bg-slate-800/30"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-700/50">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Predicción</p>
              <h3 className="text-lg font-light text-white">
                Si no actúas en <span className="text-amber-400">{prediccion.timeline}</span>
              </h3>
            </div>
          </div>

          <ul className="space-y-2 mb-4">
            {prediccion.consecuencias.map((cons, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="w-1 h-1 rounded-full bg-amber-400/70 mt-2" />
                {cons}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
            <div>
              <span className="text-xs text-slate-500">Costo proyectado: </span>
              <span className="text-lg font-light text-white">{prediccion.costoProyectado}</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
              <span className="text-sm text-amber-400">{prediccion.probabilidad}% prob.</span>
            </div>
          </div>

          {/* CTA - Usar sistema de botones FocalizaHR */}
          <button className="fhr-btn fhr-btn-primary fhr-btn-full mt-4 flex items-center justify-center gap-2">
            Ver plan de intervención
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DEPARTAMENTOS SECUNDARIOS (Compactos)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="pt-4">
        <p className="text-xs text-slate-500 mb-3">Otros departamentos:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DepartmentMiniCard name="TI" score={92} estado="saludable" size="compact" />
          <DepartmentMiniCard name="Finanzas" score={88} estado="saludable" size="compact" />
          <DepartmentMiniCard name="Comercial" score={74} estado="estable" size="compact" />
          <DepartmentMiniCard name="RRHH" score={71} estado="estable" size="compact" />
        </div>
      </div>

      {/* Badge Coming Soon */}
      <div className="text-center pt-4">
        <span className="fhr-badge fhr-badge-premium inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Próximamente en FocalizaHR
        </span>
      </div>

    </div>
  );
}
```

---

## PASO 3: Verificar imports

Asegurarse que estos imports existen al inicio del archivo:

```tsx
import { 
  // ... otros imports existentes ...
  Brain,
  Sparkles,
  AlertTriangle,
  Zap,
  ArrowRight
} from 'lucide-react';
```

---

## PASO 4: Mantener DepartmentMiniCard simplificado

El componente `DepartmentMiniCard` se mantiene pero simplificado para los departamentos secundarios:

```tsx
interface DepartmentMiniCardProps {
  name: string;
  score: number;
  estado: 'crisis' | 'observacion' | 'estable' | 'saludable';
  size?: 'normal' | 'compact';
}

function DepartmentMiniCard({ name, score, estado, size = 'normal' }: DepartmentMiniCardProps) {
  const ESTADOS_CONFIG = {
    crisis:      { label: 'Crisis',         color: 'text-slate-300' },
    observacion: { label: 'Observación',    color: 'text-slate-400' },
    estable:     { label: 'Estable',        color: 'text-slate-500' },
    saludable:   { label: 'Saludable',      color: 'text-emerald-400/70' },
  };

  const config = ESTADOS_CONFIG[estado];
  const isCompact = size === 'compact';
  
  return (
    <div className={`
      relative rounded-xl border border-slate-700/50
      bg-slate-800/30 backdrop-blur-sm
      ${isCompact ? 'p-3' : 'p-4'}
      transition-all duration-200 hover:bg-slate-800/50 hover:border-slate-600/50
    `}>
      <p className={`text-white font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>
        {name}
      </p>
      <p className={`font-light text-white ${isCompact ? 'text-xl' : 'text-2xl'}`}>
        {score}
      </p>
      <p className={`${config.color} ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
        {config.label}
      </p>
    </div>
  );
}
```

---

## VALIDACIÓN VISUAL

El resultado debe comunicar en 3 segundos:

1. **CUÁNTO** → $135M (18% de nómina) - el impacto financiero con contexto
2. **POR QUÉ** → Patrón "Hipocresía Corporativa" - la inteligencia detectada
3. **CÓMO LO SABE** → EXIT + CULTURE + ONBOARD coinciden 87% - la correlación
4. **QUÉ PASARÁ** → 3 renuncias en 30 días si no actúas - la predicción
5. **QUÉ HACER** → Botón "Ver plan de intervención" - la acción

---

## CHECKLIST DISEÑO FOCALIZAHR

**REFERENCIA VISUAL:** Ver `/dashboard/onboarding/inicio` como ejemplo correcto del diseño FocalizaHR.

- [ ] Fondo usa `fhr-bg-main` (slate #0F172A, NO lila/púrpura)
- [ ] Cards usan `bg-slate-800/50` con `border-slate-700/50` (NO bg-purple-500/5)
- [ ] Líneas Tesla usan gradient con `style={}` inline (NO clases via-purple-400)
- [ ] Botón CTA usa `fhr-btn fhr-btn-primary` del sistema
- [ ] Hero con gradiente solo en parte del texto (patrón: "Palabra <span gradient>Palabra</span>")
- [ ] Font-light en números grandes
- [ ] Animaciones Framer Motion para entrada escalonada
- [ ] Sin semáforo de colores saturados
- [ ] Departamentos secundarios neutros y compactos
- [ ] Línea decorativa `── • ──` si aplica

---

## RESULTADO ESPERADO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                           $135M                                         │
│                      en riesgo organizacional                           │
│                   ━━━━━━━━━━━  18% de nómina                           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  🧠 PATRÓN DETECTADO                                         [púrpura] │
│                                                                         │
│     "Hipocresía Corporativa"                                           │
│                                                                         │
│     ┌────────┐  ⚡  ┌────────┐  ⚡  ┌────────┐    ┌──────┐             │
│     │ Exit   │      │Culture │      │Onboard │    │ 87%  │             │
│     │  35    │      │  42    │      │  38    │    │coinc.│             │
│     └────────┘      └────────┘      └────────┘    └──────┘             │
│                                                                         │
│     "Los que se van y los nuevos coinciden: valores ≠ conducta"        │
│                                                                         │
├─────────────────────────────────┬───────────────────────────────────────┤
│  OPERACIONES           [cyan]  │  PREDICCIÓN                           │
│                                │                                        │
│         34                     │  Si no actúas en 30 días:             │
│                                │  • 3 personas clave renunciarán       │
│  Síntomas convergentes:        │  • Contagio a Ventas probable         │
│  • ICC: 42 — cultura rota      │                                        │
│  • 5 alertas onboarding        │  Costo: $57M    [85% prob.]           │
│  • Rotación: 25%               │                                        │
│                                │  [Ver plan de intervención →]         │
│  Costo en juego: $57M          │                                        │
└─────────────────────────────────┴───────────────────────────────────────┘
│                                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ TI   92 │ │ Fin  88 │ │ Com  74 │ │RRHH  71 │                       │
│  │Saludable│ │Saludable│ │ Estable │ │ Estable │                       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                       │
│                                                                         │
│              ✨ Próximamente en FocalizaHR                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ESTO ES LO QUE VENDE

Ahora el CEO ve en 3 segundos:
1. "$135M en riesgo" → OK, es mucho dinero
2. "Patrón: Hipocresía Corporativa" → ¿Qué es eso?
3. "EXIT + CULTURE + ONBOARD coinciden 87%" → WOW, el sistema CRUZA datos
4. "Operaciones: ICC 42 + 5 alertas + 25% rotación" → Los síntomas son REALES
5. "30 días → 3 renuncias → $57M" → Tengo que actuar AHORA
6. "Ver plan de intervención" → OK, ¿qué hago?

**ESO es FocalizaHR. ESO es inteligencia. ESO es lo que nadie más tiene.**
