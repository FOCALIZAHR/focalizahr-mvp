# 🎨 TAREA PERMANENTE: Estándares FocalizaHR - Diseño + Código Enterprise v2.0

> **APLICAR AUTOMÁTICAMENTE A TODO DESARROLLO UI + BACKEND**
> Esta tarea garantiza código production-ready, seguro y premium desde el primer intento.

**Versión:** 2.0  
**Actualización:** Febrero 2026  
**Changelog v2.0:**
- ✅ Copywriting Essentials (5 reglas core)
- ✅ Charts Quick Guide (datos efectivos)
- ✅ Motion Timing Chart (animaciones consistentes)
- ✅ Filosofía Carruseles FocalizaHR (swipe + navegación)
- ✅ Seguridad: 6 Checks Obligatorios (CRÍTICO - validado contra incidentes reales)
- ✅ Referencias actualizadas a Filosofía Diseño v2.0

---

## 📋 NAVEGACIÓN RÁPIDA

**Fundamentos:** [Filosofía](#-filosofía-core) · [7 Mandamientos](#los-7-mandamientos) · [ADN Visual](#adn-visual)

**Diseño:** [Mobile-First](#-diseño-práctico) · [Paleta](#paleta-emocional) · [Clases CSS](#catálogo-clases-esenciales)

**Principios v2.0:** [Copy](#-copywriting-essentials-nuevo) 🆕 · [Charts](#-charts-quick-guide-nuevo) 🆕 · [Motion](#-motion-timing-chart-nuevo) 🆕

**Componentes:** [Botones](#-premium-buttons-obligatorio) · [Carruseles](#-filosofía-carruseles-focalizahr-nuevo) 🆕

**Código:** [Patrones](#-patrones-código) · [Seguridad](#-seguridad-6-checks-obligatorios-crítico) 🆕

**Validación:** [Checklist](#-checklist-validación) · [Anti-Patrones](#-anti-patterns)

---

## 🎯 FILOSOFÍA CORE

### Principio Rector

**"FocalizaHR no muestra datos. FocalizaHR guía decisiones."**

Un ejecutivo que usa FocalizaHR debe:
1. **ENTENDER** en 3 segundos
2. **DECIDIR** en 10 segundos  
3. **ACTUAR** en 1 clic

Si requiere scroll para entender → Fallamos  
Si requiere pensar dónde hacer clic → Fallamos  
Si ve datos pero no sabe qué hacer → Fallamos

---

### Los 7 Mandamientos

#### 1. JERARQUÍA ABSOLUTA
```
El ojo tiene UN camino. No dos. No tres. UNO.

✅ BIEN:
┌─────────────────┐
│       A         │ ← PROTAGONISTA (grande, gradiente)
├────────┬────────┤
│   B    │   C    │ ← CONTEXTO (secundario)
└────────┴────────┘

❌ MAL:
┌─────┬─────┬─────┐
│ A   │ B   │ C   │ ← Todo igual = nada importante
└─────┴─────┴─────┘
```

#### 2. ABOVE THE FOLD = DECISIÓN
```
Lo que se ve SIN scroll debe permitir DECIDIR.

ABOVE THE FOLD (sin scroll):
- Qué pasó (título hero)
- Qué tan grave (contexto breve)
- Qué hacer (CTA visible)

BELOW THE FOLD (scroll opcional):
- [▸ Más contexto] - COLAPSADO
- [▸ Evidencia] - COLAPSADO
```

#### 3. UN CTA POR PANTALLA
```
Si hay 5 botones, no hay ninguno.

✅ BIEN:
┌─────────────────────┐
│  CTA PRINCIPAL      │ ← <PrimaryButton />
└─────────────────────┘
[link secundario]      ← <GhostButton />

❌ MAL:
[Ver] [Exportar] [Compartir] [Editar] [Archivar]
```

#### 4. DATOS → INSIGHT → ACCIÓN
```
No mostramos números. Mostramos significado.

❌ MAL: "EIS: 23.5"
✅ BIEN: "Exit Tóxico Detectado"
         23.5/100 · Riesgo de contagio

❌ MAL: "Rotación: 18%"
✅ BIEN: "Rotación 3x sobre mercado"
         18% vs 6% industria
```

#### 5. PROGRESSIVE DISCLOSURE
```
Revela información en capas.

CAPA 1: El headline (3 segundos)
        "Alguien dijo que no se sintió seguro"
        
CAPA 2: El contexto (10 segundos)
        Score 1.0/5 · $33M en riesgo · 20h para actuar
        
CAPA 3: La profundidad (opcional, colapsada)
        [▸ Ver evidencia metodológica]
```

#### 6. EL SILENCIO COMUNICA
```
El espacio vacío NO es desperdicio. Es respiro.

✅ BIEN:
┌────────────────────┐
│                    │
│   Mensaje claro    │ ← Espaciado generoso
│                    │
└────────────────────┘

❌ MAL:
┌────────────────────┐
│texto texto texto   │
│más texto sin parar │ ← Todo apretado
└────────────────────┘
```

#### 7. CONSISTENCIA PREDECIBLE
```
El usuario nunca debe preguntarse "¿dónde está X?"

UBICACIONES FIJAS:
- Logo: arriba izquierda
- Usuario/Menú: arriba derecha
- CTA principal: centro o abajo
- Navegación: izquierda o arriba
```

---

### ADN Visual

**Inspiración: 70% Apple + 20% Tesla + 10% Institucional**

```yaml
APPLE (70%):
  - Minimalismo extremo
  - Espaciado generoso (breathing room)
  - Tipografía delgada (font-light en hero)
  - "El espacio vacío ES diseño activo"

TESLA (20%):
  - Datos elegantes y futuristas
  - Dark mode como estándar
  - Líneas de luz características
  - Inteligencia sin agresividad

INSTITUCIONAL (10%):
  - Confianza y seriedad
  - Garantías visibles
  - Credibilidad Big 4
```

---

## 📱 DISEÑO PRÁCTICO

### REGLA INQUEBRANTABLE: Mobile-First

**⚠️ SI NO FUNCIONA EN MÓVIL, NO ESTÁ LISTO PARA PRODUCCIÓN**

```yaml
OBLIGATORIO:
  ✅ Diseñar primero para 375px (iPhone SE)
  ✅ Escalar hacia arriba, NUNCA hacia abajo
  ✅ Touch targets mínimo 44px altura
  ✅ Textos 16px+ en inputs (evita zoom iOS)
  ✅ Navegación con pulgar
  ✅ SIN scroll horizontal

Breakpoints (ya incluidos en clases .fhr-*):
  - Mobile: 0-767px (BASE)
  - Tablet: 768px+
  - Desktop: 1024px+
  - Large: 1280px+
```

---

### Paleta Emocional

```css
/* PROTAGONISTA - Interacción (60% uso) */
--fhr-cyan: #22D3EE        /* Botones, links, estados activos */

/* ACENTO - Premium (25% uso) */
--fhr-purple: #A78BFA      /* Gradientes, detalles, complemento */

/* SOPORTE - Profesional (15% uso) */
--fhr-blue: #3B82F6        /* Gráficos, analytics, datos */

/* ESTADOS */
--fhr-success: #10B981     /* Completado, positivo */
--fhr-warning: #F59E0B     /* Alerta, atención */
--fhr-error: #EF4444       /* Error, crítico */

/* NEUTROS */
--fhr-bg-primary: #0F172A  /* Fondo principal (slate-900) */
--fhr-bg-secondary: #1E293B /* Cards (slate-800) */
--fhr-text-primary: #E2E8F0 /* Texto principal (slate-200) */
--fhr-text-secondary: #94A3B8 /* Texto secundario (slate-400) */
```

**REGLA:** Un solo color protagonista por sección. Cyan domina, Purple decora.

---

### ⚠️ INSTALACIÓN OBLIGATORIA

**El archivo CSS debe importarse UNA SOLA VEZ:**

```tsx
// src/app/layout.tsx
import '@/styles/focalizahr-unified.css'

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
```

**Ubicación del archivo:** `src/styles/focalizahr-unified.css`

**Sin esta importación, las clases `.fhr-*` NO funcionarán.**

---

### Catálogo Clases Esenciales

```css
/* CONTENEDORES */
.fhr-bg-main          /* Fondo principal con patrón sutil */
.fhr-content          /* Wrapper centrado responsive */
.fhr-hero             /* Contenedor hero con padding vertical */

/* TIPOGRAFÍA (auto-responsive) */
.fhr-hero-title       /* 2.25rem → 3.75rem, font-light */
.fhr-title-section    /* 1.5rem → 1.875rem, font-semibold */
.fhr-title-card       /* 1.125rem → 1.25rem, font-semibold */
.fhr-title-gradient   /* Gradiente cyan→blue→purple (en <span>) */
.fhr-text             /* Body text (0.875rem → 1rem) */
.fhr-text-sm          /* Captions, labels (0.75rem) */

/* CARDS (glassmorphism incluido) */
.fhr-card             /* Card estándar con hover lift */
.fhr-card-metric      /* Card métrica con hover sutil */
.fhr-card-glass       /* Glassmorphism intenso */

/* BOTONES → VER SECCIÓN "Premium Buttons" MÁS ABAJO */
/* Los botones son COMPONENTES, no clases CSS */
/* ❌ NO usar: <button className="fhr-btn fhr-btn-primary"> */
/* ✅ USAR: <PrimaryButton icon={Send}>Texto</PrimaryButton> */

/* BADGES */
.fhr-badge                  /* Base (SIEMPRE requerido) */
.fhr-badge-success          /* Verde - Completado */
.fhr-badge-active           /* Cyan - En progreso */
.fhr-badge-warning          /* Amarillo - Pendiente */
.fhr-badge-error            /* Rojo - Error */
.fhr-badge-confidential     /* Especial con punto pulsante */

/* ELEMENTOS DISTINTIVOS */
.fhr-divider          /* Línea decorativa ── • ── */
.fhr-top-line         /* Línea de luz Tesla superior (USO SELECTIVO) */
.fhr-top-line-purple  /* Variante purple de línea Tesla */
.fhr-hero-badge       /* Badge superior del hero */
.fhr-hero-badge-icon  /* Ícono dentro del badge */

/* FORMULARIOS */
.fhr-input            /* Input text, email, number */
.fhr-textarea         /* Textarea multiline */
.fhr-select           /* Select dropdown */
.fhr-label            /* Label de form */

/* LOADING */
.fhr-skeleton         /* Skeleton loader animado */
.fhr-spinner          /* Spinner circular */
.fhr-empty-state      /* Estado vacío centrado */

/* UTILIDADES */
.fhr-hide-mobile      /* Ocultar < 768px */
.fhr-hide-desktop     /* Ocultar >= 768px */
```

**Referencia completa:** `/mnt/project/GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md`

---

### Iconografía Enterprise

**SOLO Lucide Icons** - outline, monocromáticos

```tsx
// ✅ CORRECTO
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react'

<Shield className="w-5 h-5 text-cyan-400" />

// ❌ INCORRECTO
import { FaShield } from 'react-icons/fa'  // NO usar Font Awesome
```

**Tamaños estándar:**
- Inline texto: `w-4 h-4` (16px)
- Botón: `w-5 h-5` (20px)
- Hero/badge: `w-6 h-6` (24px)
- Decorativo: `w-8 h-8` (32px)

---

## 📝 COPYWRITING ESSENTIALS (NUEVO)

### Las 5 Reglas de Oro

#### 1. PRIMERA PERSONA SIEMPRE
```
❌ "El usuario debe completar todos los campos"
✅ "Necesitamos tu email para enviarte los resultados"

❌ "Los datos indican..."
✅ "Tus respuestas muestran que..."

PRINCIPIO: "tu/tus" > "el usuario"
```

#### 2. ERRORES ACCIONABLES
```
❌ "Error de validación"
✅ "Revisa estos campos antes de continuar: Email, Teléfono"

❌ "Acceso denegado"
✅ "No tienes permiso para esta sección. Contacta a tu manager."

❌ "Sesión expirada"
✅ "Tu sesión expiró por seguridad. Vuelve a iniciar sesión."

PRINCIPIO: Error + solución clara
```

#### 3. NÚMEROS CON CONTEXTO
```
❌ "Score: 72.5"
✅ "72.5/100 · 15pts sobre promedio de tu industria"

❌ "Rotación: 18%"
✅ "Tu rotación (18%) es 3x mayor que el mercado (6%)"

❌ "15 participantes"
✅ "15 de 20 colaboradores ya respondieron (75%)"

PRINCIPIO: Número + comparación = insight
```

#### 4. BOTONES ESPECÍFICOS
```
❌ "Enviar" / "Aceptar" / "OK"
✅ "Enviar Encuesta" / "Guardar Cambios" / "Descargar Reporte"

❌ "Cancelar" (genérico)
✅ "Volver sin Guardar" / "Mantener Cambios"

PRINCIPIO: El botón dice EXACTAMENTE qué va a pasar
```

#### 5. ESTADOS VACÍOS MOTIVADORES
```
❌ "No hay datos"
✅ "Comienza tu primera encuesta para ver resultados aquí"

❌ "Lista vacía"
✅ "Tu equipo está listo. Inicia la primera evaluación 360°."

❌ "Sin resultados"
✅ "Cuando tus colaboradores completen la encuesta, verás insights aquí."

PRINCIPIO: Empty state = próxima acción sugerida
```

### Quick Reference - Tone por Contexto

| Contexto | Ejemplo |
|----------|---------|
| **Welcome** | "Hola Juan, tu opinión es valiosa. 5 minutos, 100% anónimo." |
| **Error** | "No pudimos guardar. Revisa tu conexión y reintenta." |
| **Success** | "¡Listo! Tus cambios fueron guardados." |
| **Dashboard** | "Tu rotación (18%) es 3x mayor que el mercado" |
| **Alerta Crítica** | "Alguien reportó acoso. Tienes 24h para actuar (Ley Karin)" |

---

## 📊 CHARTS QUICK GUIDE (NUEVO)

### Jerarquía de Datos

```
ESTRUCTURA OBLIGATORIA:

┌─────────────────────────────┐
│  72.5 / 100    ← HEADLINE   │  (5xl font, protagonista)
│  ▲ +12% vs mes anterior     │  (xs font, contexto)
│                             │
│  ░░░░░░▓▓▓░░  52%           │  (comparación benchmark)
│  ▼ Tu Industria             │
│                             │
│  [▸ Ver detalle]            │  (profundidad colapsada)
└─────────────────────────────┘

NUNCA al revés: Gráfico arriba, número abajo
```

### Colores en Charts (Máximo 3)

```yaml
PALETA STANDARD:
  • NOSOTROS: Cyan (#22D3EE)
  • BENCHMARK: Purple (#A78BFA) 
  • CRÍTICO: Red (#EF4444)

EJEMPLOS:
  
✅ BIEN (2 colores):
  [Cyan line] Tu departamento
  [Purple line] Promedio industria
  
✅ BIEN (3 colores):
  [Cyan] Onboarding Score
  [Purple] Benchmark
  [Red area] Zona crítica (<50)
  
❌ MAL (rainbow):
  [7 colores] para 7 departamentos
  → Usar 1 color con opacidad variable
```

### Formato de Números

```typescript
// Sistema consistente:

MILES:      1,234 (con separador)
DECIMALES:  72.5% (1 decimal máximo)
MONEDA:     $1.2M (abreviado si >$1000)
SCORE:      72/100 (entero si no requiere precisión)
DATES:      6 Feb 2025, 2:30 PM (humano-readable)
```

### Recharts Snippet Base

```tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis 
      dataKey="date" 
      stroke="#64748B"
      style={{ fontSize: 12 }}
    />
    <YAxis 
      stroke="#64748B"
      style={{ fontSize: 12 }}
    />
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="#22D3EE" 
      strokeWidth={2}
      dot={false}
    />
  </LineChart>
</ResponsiveContainer>
```

---

## 🎬 MOTION TIMING CHART (NUEVO)

### Timing Universal FocalizaHR

```typescript
export const MOTION_TIMING = {
  instant: 100,     // Tap feedback, hover inicial
  fast: 200,        // Button states, toggles
  medium: 300,      // Modal open/close, drawer slide
  normal: 400,      // Route change, tab switch
  slow: 500,        // Complex layout shifts
  storytelling: 800 // WOW moments únicamente
}
```

### Easing por Caso de Uso

```typescript
// ENTRADA (aparecer)
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

// SALIDA (desaparecer)  
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)'

// SPRING (interacciones)
const SPRING = { type: 'spring', stiffness: 300, damping: 30 }
```

### Snippet Modal Premium

```tsx
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
      />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Regla de Oro

```
❌ "¿El usuario preguntó '¿ya terminó?'" → muy lento
❌ "¿El usuario no notó la transición?" → muy rápido  
✅ "¿Fluyó naturalmente?" → perfecto
```

---

## 🎯 PREMIUM BUTTONS (OBLIGATORIO)

### Sistema de Botones

**CRÍTICO:** Los botones son COMPONENTES React, NO clases CSS.

```tsx
// ✅ CORRECTO
import { PrimaryButton, SecondaryButton, GhostButton } from '@/components/ui/PremiumButton'

<PrimaryButton icon={Send} size="lg" glow={true}>
  Enviar Encuesta
</PrimaryButton>

// ❌ INCORRECTO
<button className="fhr-btn fhr-btn-primary">Enviar</button>
```

### Variantes y Uso

#### 1. PrimaryButton (Cyan Gradient)
```tsx
// Uso: Acción principal de la vista
// Máximo: 1 por pantalla

<PrimaryButton 
  icon={Send}
  iconPosition="right"
  size="lg"
  isLoading={saving}
  onClick={handleSubmit}
>
  Enviar Encuesta
</PrimaryButton>
```

#### 2. SecondaryButton (Purple Gradient)
```tsx
// Uso: Acciones secundarias importantes
// Ejemplo: Exportar, Compartir, Configurar

<SecondaryButton 
  icon={Download}
  size="md"
  onClick={handleExport}
>
  Descargar Reporte
</SecondaryButton>
```

#### 3. GhostButton (Transparente + Border)
```tsx
// Uso: Acciones terciarias, cancelar, volver
// Ejemplo: Cancelar, Cerrar, Ver más

<GhostButton 
  icon={X}
  size="sm"
  onClick={onClose}
>
  Cancelar
</GhostButton>
```

#### 4. DangerButton (Red Gradient)
```tsx
// Uso: SOLO acciones destructivas irreversibles
// Ejemplo: Eliminar campaña, archivar permanentemente

<DangerButton 
  icon={Trash2}
  size="md"
  onClick={handleDelete}
>
  Eliminar Campaña
</DangerButton>
```

#### 5. SuccessButton (Green Gradient)
```tsx
// Uso: Confirmaciones positivas, completar, aprobar
// Ejemplo: Aprobar, Completar, Publicar

<SuccessButton 
  icon={CheckCircle}
  size="md"
  onClick={handleApprove}
>
  Aprobar Evaluación
</SuccessButton>
```

### Tamaños Disponibles

```typescript
size="sm"   // h-9  px-3 text-xs  (inline, tablas)
size="md"   // h-11 px-4 text-sm  (formularios, cards)
size="lg"   // h-14 px-6 text-base (CTAs hero)
size="xl"   // h-16 px-8 text-lg  (landing pages)
```

### Estados de Loading

```tsx
// ❌ MAL (texto estático)
<PrimaryButton isLoading={saving}>
  Guardar
</PrimaryButton>

// ✅ BIEN (texto dinámico)
<PrimaryButton isLoading={saving}>
  {saving ? 'Guardando...' : 'Guardar Cambios'}
</PrimaryButton>
```

### Jerarquía Visual

```yaml
REGLA: 1 PrimaryButton + secundarios

✅ CORRECTO:
  <PrimaryButton>Enviar Encuesta</PrimaryButton>
  <SecondaryButton>Ver Preview</SecondaryButton>
  <GhostButton>Cancelar</GhostButton>

❌ INCORRECTO:
  <PrimaryButton>Guardar</PrimaryButton>
  <PrimaryButton>Enviar</PrimaryButton>  ← Dos Primary compiten
```

---

## 🎪 FILOSOFÍA CARRUSELES FOCALIZAHR (NUEVO)

### Principios Fundamentales

```yaml
CARRUSELES SON PARA:
  ✅ Navegar múltiples items del mismo tipo
  ✅ Progressive disclosure de contenido categorizado
  ✅ Experiencias inmersivas (Cinema Mode)
  ✅ Mobile-first con swipe natural
  
CARRUSELES NO SON PARA:
  ❌ Ocultar información crítica (debe estar above fold)
  ❌ Compensar mala jerarquía
  ❌ "Carrusel porque se ve cool"
```

### Anatomía Carrusel FocalizaHR

```
┌──────────────────────────────────────────────┐
│  ◀ [Card] [Card] [Card] [Card] [Card] ▶     │
│     200px  200px  200px  200px  200px        │
│                                              │
│  • Ancho fijo 200px por card                 │
│  • Flechas laterales centradas verticalmente │
│  • Swipe táctil (threshold 50px)             │
│  • scrollbar-hide para limpieza              │
│  • scroll-smooth + snap points               │
└──────────────────────────────────────────────┘
```

### Características Técnicas

```yaml
SCROLL OPTIMIZATION:
  • overflow-x: auto
  • scroll-smooth
  • scroll-snap-type: x mandatory
  • scroll-snap-align: start (en cards)
  • scrollbar-hide (webkit + firefox)
  
NAVEGACIÓN DUAL:
  • Flechas laterales (desktop hover)
    - Position: absolute left/right-2 top-1/2 -translate-y-1/2
    - Opacity: 0 → 100 en group-hover
    - Z-index: 10
    
  • Swipe táctil (mobile primero)
    - drag="x" con framer-motion
    - dragConstraints={{ left: 0, right: 0 }}
    - dragElastic={0.2}
    - onDragEnd con threshold 50px
    
CARDS DESIGN:
  • Ancho fijo: w-[200px] (no flex-1)
  • Altura: min-h-[280px] o según contenido
  • Border visible cuando isSelected
  • Hover: scale(1.02) + translateY(-2px)
  • Active: scale(0.98)
```

### Implementación Base

```tsx
import { useRef, useCallback } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function CarouselBase({ items, onSelect }: Props) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const SWIPE_THRESHOLD = 50
  
  // Navegación con flechas
  const scrollLeft = useCallback(() => {
    carouselRef.current?.scrollBy({ left: -220, behavior: 'smooth' })
  }, [])
  
  const scrollRight = useCallback(() => {
    carouselRef.current?.scrollBy({ left: 220, behavior: 'smooth' })
  }, [])
  
  // Swipe handler
  const handleDragEnd = useCallback((
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      scrollLeft()
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      scrollRight()
    }
  }, [scrollLeft, scrollRight])
  
  return (
    <div className="relative group">
      {/* Flecha izquierda */}
      {items.length > 3 && (
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 
                     w-10 h-10 bg-slate-800/90 hover:bg-slate-700 
                     rounded-full flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}
      
      {/* Contenedor del carrusel */}
      <motion.div
        ref={carouselRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="flex gap-3 overflow-x-auto scrollbar-hide 
                   scroll-smooth cursor-grab active:cursor-grabbing"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="w-[200px] min-h-[280px] shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <CarouselCard item={item} onSelect={onSelect} />
          </div>
        ))}
      </motion.div>
      
      {/* Flecha derecha */}
      {items.length > 3 && (
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 
                     w-10 h-10 bg-slate-800/90 hover:bg-slate-700 
                     rounded-full flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  )
}
```

### CSS Helpers Requeridos

```css
/* Agregar a focalizahr-unified.css si no existe */

/* Hide scrollbar - Webkit (Chrome, Safari) */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar - Firefox */
.scrollbar-hide {
  scrollbar-width: none;
}

/* Cinema carousel specific */
.cinema-carousel {
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.cinema-carousel > * {
  scroll-snap-align: start;
}
```

### Casos de Uso

```yaml
CARRUSELES IMPLEMENTADOS:

1. InsightCarousel:
   • Ubicación: src/components/performance/summary/InsightCarousel.tsx
   • Uso: Alertas de gestión (gaps, fortalezas, riesgos)
   • Navegación: Flechas + swipe + dots
   
2. CompetencyCarouselCard:
   • Ubicación: Evaluaciones 360°
   • Uso: Categorías de competencias
   • Ancho: 200px fijo
   • Color dinámico según score
   
3. Rail (Colapsable):
   • Ubicación: src/components/evaluator/cinema/Rail.tsx
   • Uso: Lista evaluados con filtros
   • Colapsa: 320px → 50px
   • Tabs: Todos/Pendientes/Completadas

CUÁNDO CREAR NUEVO CARRUSEL:
  ✅ Tienes 4+ items del mismo tipo
  ✅ Usuario navega entre opciones similares
  ✅ Mobile es prioridad (swipe natural)
  ✅ Contenido categorizado (productos, competencias, evaluados)
```

---

## 💻 PATRONES CÓDIGO

### Componentes React Enterprise

```typescript
'use client'
import { memo, useCallback, useMemo } from 'react'

interface ComponentProps {
  data: DataType
  onAction?: () => void
}

export default memo(function Component({ 
  data, 
  onAction 
}: ComponentProps) {
  // 1. Hooks de estado
  const [loading, setLoading] = useState(false)
  
  // 2. Memoización de cálculos pesados
  const processedData = useMemo(() => 
    expensiveCalculation(data), 
    [data]
  )
  
  // 3. Callbacks estables
  const handleAction = useCallback(() => {
    setLoading(true)
    onAction?.()
    setLoading(false)
  }, [onAction])
  
  // 4. Early returns
  if (loading) return <div className="fhr-skeleton h-20" />
  if (!data) return <EmptyState />
  
  // 5. Render principal
  return (
    <div className="fhr-card">
      <h3 className="fhr-title-card">{processedData.title}</h3>
      <PrimaryButton 
        icon={Check}
        size="sm"
        onClick={handleAction}
      >
        Acción
      </PrimaryButton>
    </div>
  )
})
```

**Reglas:**
- Siempre usar `memo` en componentes
- `useMemo` para cálculos pesados
- `useCallback` para funciones que se pasan como props
- Early returns para estados de carga/error

---

### Custom Hooks con SWR

```tsx
import { useMemo } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => {
  const token = localStorage.getItem('focalizahr_token')
  return fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(res => res.json())
}

export function useMyData(id: string) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/resource/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache 30s
    }
  )
  
  // ✅ IMPORTANTE: Estabilizar return con useMemo
  const stableReturn = useMemo(() => ({
    data: data?.result,
    isLoading,
    error
  }), [data?.result, isLoading, error])
  
  return stableReturn
}
```

---

### Error Handling Estándar

```typescript
// En APIs
try {
  // ... lógica
} catch (error: any) {
  console.error('[API ERROR]:', error)
  return NextResponse.json(
    { 
      success: false, 
      error: error.message || 'Error interno',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack 
      })
    },
    { status: 500 }
  )
}

// En componentes
if (error) {
  return (
    <div className="fhr-card">
      <p className="text-red-400">Error: {error.message}</p>
      <GhostButton 
        icon={RefreshCw}
        size="sm"
        onClick={refetch}
      >
        Reintentar
      </GhostButton>
    </div>
  )
}
```

---

## 🔒 SEGURIDAD: 6 CHECKS OBLIGATORIOS (CRÍTICO)

> **Cada endpoint API DEBE pasar los 6 checks. Si falla 1, no se mergea.**
> **Validado contra incidentes reales de Feb 2026.**

### CHECK 1 - extractUserContext

```typescript
import { extractUserContext } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  // ✅ OBLIGATORIO: Extraer contexto del usuario
  const userContext = extractUserContext(request)
  
  // ✅ OBLIGATORIO: Validar que existe
  if (!userContext.accountId) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401 }
    )
  }
  
  // ... resto de la lógica
}
```

**Por qué:** Headers vienen del middleware. Sin esto, no hay contexto de seguridad.

---

### CHECK 2 - hasPermission

```typescript
import { hasPermission } from '@/lib/services/AuthorizationService'

export async function DELETE(request: NextRequest) {
  const userContext = extractUserContext(request)
  
  // ✅ OBLIGATORIO: Validar permisos con mapa centralizado
  if (!hasPermission(userContext.role, 'campaigns:delete')) {
    return NextResponse.json(
      { success: false, error: 'Sin permisos para esta acción' },
      { status: 403 }
    )
  }
  
  // ❌ PROHIBIDO: Arrays hardcodeados
  // if (!['ADMIN', 'HR_MANAGER'].includes(role)) { ... }
}
```

**Por qué:** Centraliza permisos. Si cambias roles, cambias UN archivo, no 50 endpoints.

---

### CHECK 3 - accountId en WHERE

```typescript
// ❌ PROHIBIDO (vulnerable)
const campaign = await prisma.campaign.findUnique({
  where: { id: campaignId }
  // ← Sin accountId, puede acceder a otra empresa
})

// ✅ OBLIGATORIO (seguro)
const campaign = await prisma.campaign.findFirst({
  where: { 
    id: campaignId,
    accountId: userContext.accountId  // ← Multi-tenant obligatorio
  }
})
```

**Por qué:** Defense-in-depth. Doble candado SIEMPRE, incluso si el recurso padre ya está filtrado.

**Caso real:** Performance Ratings endpoint accesible cross-tenant antes del fix (Feb 2026).

---

### CHECK 4 - Filtrado Jerárquico AREA_MANAGER

```typescript
import { buildParticipantAccessFilter } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  const userContext = extractUserContext(request)
  
  // ✅ OBLIGATORIO: Construir filtros con contexto
  const accessFilter = await buildParticipantAccessFilter(
    userContext,
    { 
      dataType: 'results'  // 'participation' | 'results' | 'administrative'
    }
  )
  
  const data = await prisma.participant.findMany({
    where: {
      campaignId,
      ...accessFilter  // ← Aplica multi-tenant + departamental
    }
  })
}
```

**Por qué:** AREA_MANAGER solo ve su gerencia + hijos. CEO/HR_MANAGER ven toda la empresa.

---

### CHECK 5 - Backend Calcula, Frontend Muestra

```typescript
// ❌ PROHIBIDO (inseguro + lento)
// Frontend:
const all = await fetch('/api/ratings?limit=500')
const filtered = all.filter(r => r.departmentId === myDept)  // ← Cliente filtra
const stats = { avg: calcAvg(filtered), count: filtered.length }  // ← Cliente calcula

// ✅ OBLIGATORIO (seguro + rápido)
// Backend API:
export async function GET(request: NextRequest) {
  const userContext = extractUserContext(request)
  const accessFilter = await buildParticipantAccessFilter(userContext)
  
  // Stats en backend con agregaciones SQL
  const [ratings, stats] = await Promise.all([
    prisma.rating.findMany({
      where: { ...accessFilter },
      take: 20,  // Paginación real
      skip: page * 20
    }),
    prisma.rating.aggregate({
      where: { ...accessFilter },
      _avg: { score: true },
      _count: true
    })
  ])
  
  return NextResponse.json({ ratings, stats })
}

// Frontend:
const { ratings, stats } = await fetch('/api/ratings?page=1')  // ← Ya filtrado y calculado
```

**Por qué:** 
- Seguridad: Cliente no debe tener acceso a datos de otros departamentos
- Performance: Agregaciones SQL son 100x más rápidas que loops JS

**Caso real:** Performance Ratings usaba limit=500 + filtrado cliente antes del fix (Feb 2026).

---

### CHECK 6 - Validación en Escritura

```typescript
// PUT /api/ratings/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userContext = extractUserContext(request)
  
  // ✅ 1. Validar permisos
  if (!hasPermission(userContext.role, 'ratings:edit')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
  }
  
  // ✅ 2. Validar que el recurso pertenece al usuario
  const existing = await prisma.rating.findFirst({
    where: { 
      id: params.id,
      accountId: userContext.accountId  // ← Multi-tenant
    },
    include: { employee: true }
  })
  
  if (!existing) {
    return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 })
  }
  
  // ✅ 3. Si es AREA_MANAGER, validar scope departamental
  if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
    const childIds = await getChildDepartmentIds(userContext.departmentId)
    const allowedIds = [userContext.departmentId, ...childIds]
    
    if (!allowedIds.includes(existing.employee.departmentId)) {
      return NextResponse.json({ success: false, error: 'Fuera de tu scope' }, { status: 403 })
    }
  }
  
  // ✅ 4. Ahora sí, actualizar
  const body = await request.json()
  const updated = await prisma.rating.update({
    where: { id: params.id },
    data: body
  })
  
  return NextResponse.json({ success: true, data: updated })
}
```

**Por qué:** Previene que AREA_MANAGER modifique ratings fuera de su gerencia.

---

### Anti-Patrones de Seguridad (PROHIBIDOS)

```yaml
❌ NUNCA:
  • APIs sin extractUserContext
  • Queries sin filtro accountId
  • Arrays hardcodeados: ['ADMIN', 'HR_MANAGER'].includes(role)
  • Filtrado client-side de datos sensibles
  • limit=500 en frontend + filter manual
  • Confiar en "CUID indivinable" como seguridad
  • Modificar sin validar ownership

✅ SIEMPRE:
  • extractUserContext en TODOS los endpoints
  • hasPermission para validación de permisos
  • accountId en TODAS las queries
  • buildParticipantAccessFilter para jerarquía
  • Stats y agregaciones en backend
  • Validar ownership antes de modificar
```

---

## ✅ CHECKLIST VALIDACIÓN

### Filosófico (Antes de Diseñar)

```yaml
□ ¿El usuario sabe QUÉ HACER en 3 segundos?
□ ¿Hay UN SOLO punto focal claro?
□ ¿Cada elemento justifica su existencia?
□ ¿Hay suficiente espacio para respirar?
□ ¿El CTA principal es obvio sin scroll?
```

### Mobile-First (Pre-Entrega UI)

```yaml
□ ¿Funciona en 375px sin scroll horizontal?
□ ¿Botones tienen 44px+ de altura táctil?
□ ¿Texto legible sin zoom (16px+ en inputs)?
□ ¿Navegación accesible con pulgar?
□ ¿Probado en dispositivo móvil real?
```

### Identidad FocalizaHR (Pre-Entrega UI)

```yaml
□ ¿Tiene línea decorativa ── • ── donde corresponde?
□ ¿Gradiente está en PARTE del título, no todo?
□ ¿Tipografía hero es font-light?
□ ¿Cyan es el color dominante de interacción?
□ ¿Iconos son Lucide outline monocromáticos?
□ ¿Cards usan .fhr-card con glassmorphism?
□ ¿Hay UN CTA principal visible above the fold?
□ ¿Todos los botones son Premium Buttons (no clases CSS)?
□ ¿Loading states cambian texto del botón?
□ ¿Jerarquía clara: Ghost → Secondary → Primary?
□ ¿DangerButton solo en acciones irreversibles?
```

### Copywriting (Pre-Entrega)

```yaml
□ ¿Usé "tu/tus" en vez de "el usuario"?
□ ¿Los errores explican QUÉ hacer?
□ ¿Los botones dicen la ACCIÓN exacta?
□ ¿Los números tienen contexto/comparación?
□ ¿Los estados vacíos motivan siguiente acción?
```

### Charts (Pre-Entrega)

```yaml
□ ¿El número principal es el elemento más grande?
□ ¿Usé máximo 3 colores?
□ ¿Cyan = nosotros, Purple = benchmark?
□ ¿Los números tienen formato con separador miles?
□ ¿Hay comparación visible (vs benchmark)?
```

### Motion (Pre-Entrega)

```yaml
□ ¿Usé los timings del sistema (100/200/300/400/500ms)?
□ ¿Las entradas usan ease-out, salidas ease-in?
□ ¿Hover = scale(1.02) + duration 200ms?
□ ¿Tap = scale(0.98) + duration 100ms?
□ ¿Ninguna animación supera 800ms sin razón?
```

### Carruseles (Pre-Entrega)

```yaml
□ ¿Cards tienen ancho fijo 200px?
□ ¿Swipe táctil implementado (threshold 50px)?
□ ¿Flechas solo visibles si >3 items?
□ ¿scrollbar-hide aplicado?
□ ¿scroll-smooth + snap points habilitados?
```

### Seguridad (Pre-Entrega Backend) ⭐ CRÍTICO

```yaml
CHECK 1 - extractUserContext:
  □ ¿Importa y usa extractUserContext(request)?
  □ ¿Valida que accountId existe (401 si no)?

CHECK 2 - hasPermission:
  □ ¿Valida permisos con hasPermission(role, action)?
  □ ¿NO usa arrays hardcodeados de roles?

CHECK 3 - accountId en WHERE:
  □ ¿TODA query incluye accountId en where?
  □ ¿Incluso en recursos hijos?

CHECK 4 - Filtrado jerárquico:
  □ ¿Usa buildParticipantAccessFilter con dataType correcto?
  □ ¿AREA_MANAGER solo ve su scope?

CHECK 5 - Backend calcula:
  □ ¿Stats se calculan en backend (no cliente)?
  □ ¿Paginación real (skip/take), no limit=500?

CHECK 6 - Validación escritura:
  □ ¿Valida ownership antes de modificar?
  □ ¿AREA_MANAGER no puede modificar fuera de scope?
```

### Performance (Pre-Entrega)

```yaml
□ ¿Componentes usan memo + useCallback?
□ ¿Custom hooks estabilizan return con useMemo?
□ ¿Cálculos pesados usan useMemo?
□ ¿Queries tienen paginación?
```

### Design System (Pre-Entrega)

```yaml
□ ¿CSS importado en layout.tsx?
□ ¿Usa clases .fhr-* exclusivamente?
□ ¿Línea Tesla solo en cards destacados?
□ ¿Premium Buttons en vez de clases CSS?
```

---

## 🚫 ANTI-PATTERNS (Evitar)

```yaml
DISEÑO:
❌ Múltiples gradientes compitiendo
❌ Cyan y purple al mismo nivel de jerarquía
❌ Tipografía bold en títulos hero (usar light)
❌ Más de 1 CTA principal por vista
❌ Todo el título con gradiente (solo parte)
❌ Usar Font Awesome u otros iconos (solo Lucide)
❌ Línea Tesla en todos los cards (pierde impacto)
❌ Fondos blur muy saturados (máx 5% opacity)

COPY:
❌ "El usuario debe..." → usar "Necesitamos tu..."
❌ "Error" sin explicación → agregar qué hacer
❌ "Enviar" genérico → "Enviar Encuesta" específico
❌ Números sin contexto → agregar comparación

CHARTS:
❌ Gráfico protagonista, número pequeño → invertir
❌ Rainbow colors (>3) → máximo 3 colores
❌ Leyenda externa → labels directos en línea
❌ Ejes que no inician en 0 → siempre desde 0

MOTION:
❌ Animaciones >800ms → reducir timing
❌ Animar width/height → usar scale/translate
❌ Múltiples springs simultáneos → stagger
❌ Sin prefers-reduced-motion → implementar

BOTONES:
❌ Usar clases CSS (.fhr-btn-primary) → usar <PrimaryButton />
❌ Dos PrimaryButton compitiendo → usar Secondary + Primary
❌ DangerButton en acciones reversibles → solo irreversibles
❌ Texto estático en loading → cambiar texto durante isLoading
❌ Botones sin icono en acciones importantes → icon siempre en CTA

CARRUSELES:
❌ Cards con flex-1 → ancho fijo 200px
❌ Sin swipe táctil → implementar drag + threshold
❌ Flechas siempre visibles → solo si >3 items
❌ scrollbar visible → scrollbar-hide

CÓDIGO:
❌ APIs sin extractUserContext → CRÍTICO, siempre incluir
❌ Queries sin filtro accountId → VULNERABILIDAD, siempre filtrar
❌ Arrays hardcodeados de roles → usar hasPermission
❌ Filtrado client-side de seguridad → backend filtra
❌ limit=500 + filter manual → paginación real
❌ Componentes sin memo → agregar memo
❌ Cálculos pesados sin useMemo → memoizar
❌ Funciones inline sin useCallback → estabilizar
❌ Custom hooks sin estabilizar return → usar useMemo
❌ Error handling ausente → try/catch siempre
❌ Prisma queries sin paginación → skip/take
❌ Importar CSS en múltiples lugares → solo layout.tsx
```

---

## 📚 REFERENCIAS RÁPIDAS

```yaml
Filosofía Diseño v2.0:
  /mnt/project/FILOSOFIA_DISENO_FOCALIZAHR_v2.md
  Novedades v2.0:
    • Tone of Voice (copywriting)
    • Data Visualization (charts)
    • Motion Design (animaciones)
    • Patrón Cinema Mode

Guía Estilos Completa:
  /mnt/project/GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md

Premium Buttons:
  /mnt/project/FocalizaHR_Premium_Buttons_Guide.md
  Componente: src/components/ui/PremiumButton.tsx

RBAC y Seguridad (CRÍTICO):
  /mnt/project/GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_1.md
  /mnt/project/GUIA_MAESTRA_TECNICA_FOCALIZAHR_ENTERPRISE_v3_5_2.md
  Servicio: src/lib/services/AuthorizationService.ts

Carruseles Implementados:
  src/components/performance/summary/InsightCarousel.tsx
  src/components/evaluator/cinema/Rail.tsx
  src/components/performance/summary/CompetencyCarouselCard.tsx

Stack Tecnológico:
  Framework: Next.js 14.2.3 (App Router)
  UI: React 18.3.1
  Language: TypeScript 5.8.3
  ORM: Prisma 5.22.0
  DB: PostgreSQL (Supabase)
  Styling: Tailwind + .fhr-* classes
  Icons: Lucide React (SOLO este)
  Animation: framer-motion (v10+)
```

---

## 🎯 FLUJO DESARROLLO

```yaml
1. PLANIFICAR:
   - ¿Cuál es el propósito?
   - ¿Qué debe DECIDIR el usuario?
   - ¿Cuál es el CTA principal?
   - ¿Qué copy necesita? (tone of voice)
   - ¿Necesita carrusel? (solo si 4+ items similares)

2. DISEÑAR (Mobile-First):
   - Estructura vertical 375px
   - Aplicar clases .fhr-* exclusivamente
   - Lucide icons monocromáticos
   - Premium Buttons (no clases CSS)
   - Copy siguiendo 5 reglas

3. IMPLEMENTAR (Seguridad First):
   - extractUserContext obligatorio
   - hasPermission si es restrictivo
   - accountId en TODAS las queries
   - buildParticipantAccessFilter si jerárquico
   - Backend calcula stats

4. ANIMAR (Motion consistente):
   - Usar timing chart (100/200/300/400/500ms)
   - Entry: ease-out, Exit: ease-in
   - Hover: scale(1.02) + 200ms
   - Tap: scale(0.98) + 100ms

5. OPTIMIZAR (Performance):
   - memo en componentes
   - useMemo para cálculos
   - useCallback para props
   - Custom hooks estabilizados

6. VALIDAR:
   - Checklist filosófico ✅
   - Checklist mobile ✅
   - Checklist seguridad ✅ (CRÍTICO)
   - Checklist técnico ✅
   - Probar en móvil real

7. REFINAR:
   - Reducir, no agregar
   - Espaciado generoso
   - Un protagonista claro
   - Copy humano y accionable
```

---

## 💎 MANTRA FINAL

```
"¿Parece Apple? ¿Se siente FocalizaHR? ¿Funciona en móvil? ¿Es seguro?"

Si las 4 respuestas son SÍ → Ship it 🚀
Si alguna es NO → Refinar hasta que lo sea

PRIORIDAD DE VALIDACIÓN:
1. Seguridad (6 checks) → Sin esto, NO ship
2. Mobile-first → Sin esto, NO ship
3. Identidad FocalizaHR → Sin esto, refinar
4. Performance → Sin esto, optimizar
```

---

**Esta tarea se aplica AUTOMÁTICAMENTE a todo desarrollo.**
**No requiere activación manual - está siempre activa.**

🎨 **FocalizaHR - Donde la inteligencia organizacional se convierte en acción.**

---

**Documento compilado por:** Equipo Producto FocalizaHR  
**Última actualización:** Febrero 2026  
**Versión:** 2.0  
**Próxima revisión:** Junio 2026
