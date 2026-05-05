# FocalizaHR — Frontend Design Rules
glob: src/**/*.tsx

---

## Patrón Maestro ÚNICO

**ÚNICO archivo de referencia canónica:**

```
src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationPortada.tsx
```

**NO HAY excepciones por módulo.** Si un componente de otro módulo tiene tokens distintos, ese componente está mal — NO es referencia válida.

Específicamente: el módulo `src/app/dashboard/compliance/` tiene tokens divergentes (`bg-[#0F172A]/90`, `backdrop-blur-2xl`, `rounded-[20px]`, componente `SectionShell`). **Es deuda técnica reconocida — NO usar ninguno de esos como canónico**, ni replicar ese patrón en componentes nuevos. La skill `focalizahr-design` es la fuente de verdad sobre tokens y patrones.

---

## Los 5 Elementos Obligatorios

Si falta uno → el componente no está terminado.

1. **Línea Tesla** — `absolute top-0 h-[2px]` gradient cyan→purple inline
2. **Word-split títulos** — primera palabra `text-white`, segunda `fhr-title-gradient`
3. **Glassmorphism** — `rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm`
4. **Botones** — solo `PrimaryButton` / `SecondaryButton` de `@/components/ui/PremiumButton`
5. **Número hero** — `text-[72px] font-extralight tabular-nums text-white`

---

## Tokens Canónicos Exactos (de CompensationPortada)

### Card outer (chrome de cualquier sección/portada)

```
relative overflow-hidden
rounded-2xl
border border-slate-800/40
bg-slate-900/60
backdrop-blur-sm
```

### Hero number

```
text-[72px] font-extralight tabular-nums text-white leading-[0.9]
```

### Title pattern (word-split con gradient)

```tsx
<h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
  Primera palabra
</h2>
<p className="text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
  Segunda palabra
</p>
```

### Body narrative

```
text-base font-light text-slate-400 leading-relaxed
```

### Sub-narrative

```
text-sm font-light text-slate-500 leading-relaxed
```

### Padding de card

```
px-6 py-14 md:px-10 md:py-20
```

---

## Tokens PROHIBIDOS (deuda técnica del módulo compliance)

Estos tokens aparecen en el módulo `src/app/dashboard/compliance/` pero **NO son canónicos**. Si los detectás copiando de algún `Section*.tsx` del compliance o de `SectionShell.tsx`, **detenete** — usá los canónicos de arriba.

```
❌ bg-[#0F172A]/90               → usar bg-slate-900/60
❌ backdrop-blur-2xl               → usar backdrop-blur-sm
❌ rounded-[20px]                  → usar rounded-2xl
❌ border border-slate-800         → usar border-slate-800/40
❌ <SectionShell sectionId={...}>  → no usar; replicar patrón CompensationPortada
❌ p-6 md:p-10 (padding del Shell) → usar px-6 py-14 md:px-10 md:py-20
```

Adicionalmente, **anti-patterns visuales** (skill `focalizahr-design` → `references/anti-patterns.md` sección "Patrón G"):

```
❌ Borde de color (red/amber/emerald) en cards según severidad → semáforo prohibido
❌ Background de color en cards según severidad                 → bg semántico prohibido
❌ Shadow glow de color en cards (shadow-red, shadow-amber)     → glow alarma prohibido
❌ Badge fhr-badge-warning con texto "X críticos"               → badge gritando prohibido
❌ Tamaño de score variable según severidad (text-[44px] vs 36) → semáforo de tamaño prohibido
```

**Regla general**: la severidad la canta UNA cosa — el color del número. Todo lo demás permanece uniforme entre cards.

Para badges de focos/info en cards: tag ghost neutro
```tsx
<span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
  2 focos departamentales
</span>
```

---

## Mobile-First — Verificación Obligatoria

Antes de reportar un componente como terminado:

- ¿Funciona en 320px sin scroll horizontal?
- Padding: `px-4 py-6` → `md:px-8 md:py-10`
- Texto: `text-xl md:text-3xl` (nunca tamaño fijo)
- Layout: `flex-col` → `md:flex-row` o `grid-cols-1` → `md:grid-cols-2`
- Tap targets ≥ 44×44px

---

## Clases Obligatorias

| Elemento | Clase |
|----------|-------|
| Fondo página | `fhr-bg-main` |
| Título gradiente | `fhr-title-gradient` |
| Card estándar | `fhr-card` |
| Card premium | `fhr-glass-card` |
| Botón primario | `PrimaryButton` de `@/components/ui/PremiumButton` |
| Botón secundario | `SecondaryButton` de `@/components/ui/PremiumButton` |
| Toast / feedback | skill `focalizahr-notificaciones` — nunca shadcn `use-toast` |

---

## Reutilizar Antes de Crear

Antes de crear un componente nuevo:

```bash
ls src/components/
ls src/components/dashboard/
ls src/components/monitor/
ls src/components/ui/
grep -r "ConceptoQueNecesitas" src/components/
```

Si existe → extender. Nunca duplicar.

---

## Anti-Patrones Prohibidos (resumen)

- CSS inline para colores: `style={{ background: '#22D3EE' }}`
- Tailwind crudo sin `.fhr-*` cuando existe la clase: `className="bg-slate-900 border border-slate-700 rounded-xl"` → buscar primero `.fhr-card` / `.fhr-glass-card`
- Botones custom sin PremiumButton: `<button className="bg-cyan-500 px-4 py-2 rounded">`
- Texto sin breakpoint: `className="text-3xl"` → debe ser `text-xl md:text-3xl`
- Toast shadcn: `import { useToast } from '@/components/ui/use-toast'`
- **Tokens del módulo compliance/SectionShell** (ver "Tokens Prohibidos" arriba)
- **Semáforos de color en cards según severidad** (ver "anti-patterns visuales" arriba)

---

## Conocimiento Profundo

Para patrones complejos (Cinema Mode, Guided Intelligence, Patrón G, anti-patterns visuales):
→ Cargar skill `focalizahr-design` y leer `references/anti-patterns.md` y `references/page-patterns.md` ANTES de escribir.
