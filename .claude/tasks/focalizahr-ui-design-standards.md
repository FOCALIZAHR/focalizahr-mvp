# 🎨 TAREA PERMANENTE: Estándares FocalizaHR - Diseño + Código Enterprise

> **APLICAR AUTOMÁTICAMENTE A TODO DESARROLLO UI + BACKEND**
> Esta tarea garantiza código production-ready desde el primer intento.

---

## 📋 ÍNDICE RÁPIDO

1. [Filosofía Core](#-filosofía-core) - El "por qué"
2. [Diseño Práctico](#-diseño-práctico) - El "cómo visual"
3. [Patrones Código](#-patrones-código) - El "cómo técnico"
4. [Checklist Validación](#-checklist-validación) - Pre-entrega

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
│  CTA PRINCIPAL      │ ← .fhr-btn-primary
└─────────────────────┘
[link secundario]      ← .fhr-btn-ghost

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

### Pregunta para Cada Elemento

```yaml
1. ¿Reduce fricción cognitiva?
2. ¿Aporta valor inmediato?
3. ¿Respeta la jerarquía visual?

→ Si alguna es NO → eliminar o refinar
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

/* BOTONES (con estados hover/active) */
.fhr-btn              /* Base (SIEMPRE requerido) */
.fhr-btn-primary      /* Gradiente cyan-purple - CTA principal */
.fhr-btn-secondary    /* Outline cyan - Acción secundaria */
.fhr-btn-ghost        /* Transparente - Terciaria */
.fhr-btn-danger       /* Rojo - Eliminar/Destruir */

/* BADGES */
.fhr-badge                  /* Base (SIEMPRE requerido) */
.fhr-badge-success          /* Verde - Completado */
.fhr-badge-active           /* Cyan - En progreso */
.fhr-badge-warning          /* Amarillo - Pendiente */
.fhr-badge-error            /* Rojo - Error */
.fhr-badge-confidential     /* Especial con punto pulsante */

/* ELEMENTOS DISTINTIVOS */
.fhr-divider          /* Línea decorativa ── • ── */
.fhr-top-line         /* Línea de luz Tesla superior */
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

### Template Base (Copiable)

```tsx
'use client'
import { memo } from 'react'
import { Shield } from 'lucide-react'

export default memo(function MiPagina() {
  return (
    <div className="fhr-bg-main">
      <div className="fhr-content">
        
        {/* HERO - Above the fold */}
        <div className="fhr-hero">
          
          {/* Badge superior (opcional) */}
          <div className="fhr-hero-badge">
            <Shield className="fhr-hero-badge-icon" />
            <span className="fhr-hero-badge-text">Garantía</span>
          </div>
          
          {/* Título - font-light con gradiente PARCIAL */}
          <h1 className="fhr-hero-title">
            Mi Página <span className="fhr-title-gradient">FocalizaHR</span>
          </h1>
          
          {/* Línea decorativa Tesla */}
          <div className="fhr-divider"></div>
          
          {/* Subtítulo */}
          <p className="fhr-hero-subtitle">
            Descripción clara del propósito
          </p>
          
          {/* CTA Principal - UN SOLO botón protagonista */}
          <button className="fhr-btn fhr-btn-primary">
            Acción Principal
          </button>
          
        </div>
        
        {/* CONTENIDO */}
        <div className="fhr-card">
          <h2 className="fhr-title-card">Sección</h2>
          <p className="fhr-text">Contenido...</p>
        </div>
        
      </div>
    </div>
  )
})
```

---

## 💻 PATRONES CÓDIGO

### Seguridad y RBAC

**PATRÓN OFICIAL:** Copiar de `/api/exit/records/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  extractUserContext, 
  hasPermission,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  // 1. Extraer contexto (headers inyectados por middleware)
  const userContext = extractUserContext(request)
  
  // 2. Validar autenticación
  if (!userContext.accountId) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401 }
    )
  }
  
  // 3. Validar permisos (opcional si endpoint es restrictivo)
  if (!hasPermission(userContext.role, 'resource:read')) {
    return NextResponse.json(
      { success: false, error: 'Sin permisos' },
      { status: 403 }
    )
  }
  
  // 4. Filtrado jerárquico (si es AREA_MANAGER)
  const departmentIds = userContext.departmentId
    ? await getChildDepartmentIds(userContext.departmentId)
    : null
  
  // 5. Query con filtros de seguridad
  const where = {
    accountId: userContext.accountId,
    ...(departmentIds && { departmentId: { in: departmentIds } })
  }
  
  const data = await prisma.model.findMany({ where })
  
  return NextResponse.json({ success: true, data })
}
```

**Permisos disponibles:** Ver en `/mnt/project/GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_1.md`

```typescript
// Ejemplos de permisos
'participants:read'
'participants:write'
'onboarding:enroll'
'exit:register'
'admin:access'
'employees:sync'
```

---

### API Routes con Paginación

**PATRÓN OFICIAL:** Copiar de `/api/admin/employees/route.ts`

```typescript
export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    const { searchParams } = new URL(request.url)
    
    // Parse params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit
    
    // Filtros de seguridad
    const where = {
      accountId: userContext.accountId,
      // ... otros filtros
    }
    
    // Query con count paralelo
    const [data, total] = await Promise.all([
      prisma.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { relations: true }
      }),
      prisma.model.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error: any) {
    console.error('[API ERROR]:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

---

### Componentes React Optimizados

**PATRÓN OFICIAL:** Copiar de `EXOScoreGauge.tsx`

```tsx
'use client'
import { memo, useState, useCallback, useMemo } from 'react'

interface MiComponenteProps {
  data: DataType
  onAction?: () => void
}

export default memo(function MiComponente({ 
  data, 
  onAction 
}: MiComponenteProps) {
  
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
  if (loading) return <div className="fhr-skeleton" />
  if (!data) return <EmptyState />
  
  // 5. Render principal
  return (
    <div className="fhr-card">
      <h3 className="fhr-title-card">{processedData.title}</h3>
      <button 
        onClick={handleAction}
        className="fhr-btn fhr-btn-primary"
      >
        Acción
      </button>
    </div>
  )
})
```

**Reglas optimización:**
- Siempre usar `memo` en componentes
- `useMemo` para cálculos pesados
- `useCallback` para funciones que se pasan como props
- Early returns para estados de carga/error

---

### Custom Hooks con SWR

**PATRÓN OFICIAL:** Copiar de `useCampaignDetails.ts`

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
      <button 
        onClick={refetch}
        className="fhr-btn fhr-btn-secondary"
      >
        Reintentar
      </button>
    </div>
  )
}
```

---

### Prisma Client Singleton

**Ubicación:** `lib/prisma.ts` (ya implementado)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error']
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**Uso:** Siempre importar `import { prisma } from '@/lib/prisma'`

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
```

### Técnico (Pre-Entrega Backend)

```yaml
□ ¿Usa extractUserContext en APIs?
□ ¿Valida permisos con hasPermission?
□ ¿Aplica filtrado jerárquico si es AREA_MANAGER?
□ ¿Query incluye accountId en where?
□ ¿Tiene error handling con try-catch?
□ ¿Paginación implementada (skip/take)?
□ ¿Componentes usan memo + useCallback?
□ ¿Custom hooks estabilizan return con useMemo?
```

### Accesibilidad (Pre-Entrega)

```yaml
□ ¿Contraste mínimo 4.5:1?
□ ¿Focus ring visible en navegación teclado?
□ ¿Textos alternativos en imágenes?
□ ¿Navegable solo con teclado?
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

CÓDIGO:
❌ APIs sin extractUserContext
❌ Queries sin filtro accountId
❌ Componentes sin memo
❌ Cálculos pesados sin useMemo
❌ Funciones inline sin useCallback
❌ Custom hooks sin estabilizar return
❌ Error handling ausente
❌ Prisma queries sin paginación
```

---

## 📚 REFERENCIAS RÁPIDAS

```yaml
Filosofía Diseño:
  /mnt/project/FILOSOFIA_DISENO_FOCALIZAHR_v1.md

Guía Estilos Completa:
  /mnt/project/GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md

RBAC y Seguridad:
  /mnt/project/GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_1.md

Stack Tecnológico:
  Framework: Next.js 14.2.3 (App Router)
  UI: React 18.3.1
  Language: TypeScript 5.8.3
  ORM: Prisma 5.22.0
  DB: PostgreSQL (Supabase)
  Styling: Tailwind + .fhr-* classes
  Icons: Lucide React (SOLO este)
```

---

## 🎯 FLUJO DESARROLLO

```yaml
1. PLANIFICAR:
   - ¿Cuál es el propósito?
   - ¿Qué debe DECIDIR el usuario?
   - ¿Cuál es el CTA principal?

2. DISEÑAR (Mobile-First):
   - Estructura vertical 375px
   - Template base como punto de partida
   - Aplicar clases .fhr-* exclusivamente
   - Lucide icons monocromáticos

3. IMPLEMENTAR (Seguridad First):
   - Copiar patrón API correspondiente
   - extractUserContext obligatorio
   - hasPermission si es restrictivo
   - Filtrado jerárquico si aplica

4. OPTIMIZAR (Performance):
   - memo en componentes
   - useMemo para cálculos
   - useCallback para props
   - Custom hooks estabilizados

5. VALIDAR:
   - Checklist filosófico ✅
   - Checklist mobile ✅
   - Checklist técnico ✅
   - Probar en móvil real

6. REFINAR:
   - Reducir, no agregar
   - Espaciado generoso
   - Un protagonista claro
```

---

## 💎 MANTRA FINAL

```
"¿Parece Apple? ¿Se siente FocalizaHR? ¿Funciona en móvil? ¿Es seguro?"

Si las 4 respuestas son SÍ → Ship it 🚀
Si alguna es NO → Refinar hasta que lo sea
```

---

**Esta tarea se aplica AUTOMÁTICAMENTE a todo desarrollo.**
**No requiere activación manual - está siempre activa.**

🎨 **FocalizaHR - Donde la inteligencia organizacional se convierte en acción.**
