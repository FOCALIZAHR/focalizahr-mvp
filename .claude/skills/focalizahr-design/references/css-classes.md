# 🎨 CLASES CSS FOCALIZAHR

> Usar estas clases en lugar de Tailwind directo para mantener consistencia.

---

## 📊 TABLA DE CLASES PRINCIPALES

### Fondos

| Clase | Uso | Descripción |
|-------|-----|-------------|
| `.fhr-bg-main` | Páginas principales | Gradiente oscuro slate-900 → slate-800 |
| `.fhr-bg-pattern` | Overlay sobre fhr-bg-main | Patrón radial sutil cyan |

### Tipografía

| Clase | Uso | Descripción |
|-------|-----|-------------|
| `.fhr-title-gradient` | Títulos destacados | Gradiente cyan → blue → purple |
| `.fhr-hero-title` | Títulos de página | text-2xl md:text-3xl font-bold |
| `.fhr-subtitle` | Subtítulos | text-slate-400 text-sm |
| `.fhr-text-accent` | Texto destacado | Color cyan font-medium |

### Cards

| Clase | Uso | Descripción |
|-------|-----|-------------|
| `.fhr-card` | Contenedores estándar | Glassmorphism básico, blur-20px |
| `.fhr-glass-card` | Cards premium | Glassmorphism intenso, blur-24px |
| `.fhr-card-metric` | Cards de métricas | Border-left con color |

### Botones

| Clase | Uso | Descripción |
|-------|-----|-------------|
| `.fhr-btn-primary` | Acción principal | Gradiente cyan, glow, hover lift |
| `.fhr-btn-secondary` | Acción secundaria | Outline, backdrop-blur |
| `.fhr-btn-ghost` | Acción terciaria | Transparente, hover sutil |
| `.fhr-btn-danger` | Acciones destructivas | Rojo con glow |

### Badges

| Clase | Uso | Color |
|-------|-----|-------|
| `.fhr-badge-success` | Completado/Éxito | Verde #10B981 |
| `.fhr-badge-active` | En progreso | Cyan #22D3EE |
| `.fhr-badge-warning` | Atención | Amarillo #F59E0B |
| `.fhr-badge-error` | Error/Crítico | Rojo #EF4444 |
| `.fhr-badge-draft` | Borrador | Gris #9CA3AF |
| `.fhr-badge-purple` | Especial | Purple #A78BFA |

### Severidad (Border-left)

| Clase | Uso | Color |
|-------|-----|-------|
| `.fhr-severity-critical` | Crítico | Rojo border-left |
| `.fhr-severity-high` | Alto | Naranja border-left |
| `.fhr-severity-medium` | Medio | Amarillo border-left |
| `.fhr-severity-low` | Bajo | Cyan border-left |
| `.fhr-severity-success` | OK | Verde border-left |

### Utilidades

| Clase | Uso |
|-------|-----|
| `.fhr-divider` | Línea separadora sutil |
| `.fhr-skeleton` | Loading placeholder |
| `.fhr-focus` | Focus ring cyan |

---

## 🎨 VARIABLES CSS

```css
:root {
  /* Colores Principales */
  --focalizahr-cyan: #22D3EE;
  --focalizahr-purple: #A78BFA;
  
  /* Estados */
  --focalizahr-success: #10B981;
  --focalizahr-warning: #F59E0B;
  --focalizahr-error: #EF4444;
  --focalizahr-info: #06B6D4;
  
  /* Grises */
  --focalizahr-slate-900: #0f172a;
  --focalizahr-slate-800: #1e293b;
  --focalizahr-slate-700: #334155;
  --focalizahr-slate-600: #475569;
  
  /* Gradientes */
  --focalizahr-gradient: linear-gradient(135deg, #22D3EE, #A78BFA);
  --focalizahr-gradient-text: linear-gradient(135deg, #22D3EE, #3B82F6, #A78BFA);
  --focalizahr-bg-main: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}
```

---

## 📱 BREAKPOINTS

```css
/* Mobile-First Approach */

/* Base: 320px+ (mobile) */
.clase { ... }

/* sm: 640px+ (tablet) */
@media (min-width: 640px) { ... }

/* md: 1024px+ (desktop) */
@media (min-width: 1024px) { ... }

/* lg: 1280px+ (large) */
@media (min-width: 1280px) { ... }
```

### Ejemplos Responsive

```tsx
// Padding
className="px-4 py-6 md:px-8 md:py-10"

// Texto
className="text-2xl md:text-3xl"

// Flex direction
className="flex-col md:flex-row"

// Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Ocultar/mostrar
className="hidden md:block"
className="md:hidden"
```

---

## ✅ CUÁNDO USAR CADA CLASE

### Páginas

```tsx
// SIEMPRE para páginas de dashboard
<div className="fhr-bg-main min-h-screen">
  <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
    ...
  </div>
</div>
```

### Títulos

```tsx
// Título principal de página
<h1 className="fhr-hero-title text-2xl md:text-3xl">
  Texto Normal{' '}
  <span className="fhr-title-gradient">Con Gradiente</span>
</h1>

// Subtítulo
<p className="text-slate-400 text-sm mt-1">
  Descripción de la página
</p>
```

### Cards

```tsx
// Card estándar
<div className="fhr-card p-6">
  ...
</div>

// Card premium con Línea Tesla
<div className="fhr-glass-card p-6 relative">
  {/* Línea Tesla */}
  <div className="absolute top-0 left-0 right-0 h-[2px]"
    style={{
      background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
      boxShadow: '0 0 20px #22D3EE',
    }}
  />
  ...
</div>
```

### Badges

```tsx
// Según estado
<span className="fhr-badge-success">Completado</span>
<span className="fhr-badge-active">En Progreso</span>
<span className="fhr-badge-warning">Pendiente</span>
<span className="fhr-badge-error">Crítico</span>
<span className="fhr-badge-draft">Borrador</span>
```

---

## 📖 REFERENCIA COMPLETA

Para CSS detallado, consultar en Project Knowledge:
- `📬 SISTEMA DE NOTIFICACIONES FOCALIZAHR.docx` - Todas las clases con CSS completo
