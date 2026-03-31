# ✨ COMPONENTES PREMIUM FOCALIZAHR

> Elementos visuales distintivos que definen la identidad FocalizaHR.

---

## 🔷 LÍNEA TESLA

Línea luminosa en la parte superior de cards premium. Identidad visual FocalizaHR.

### Versión Estática

```tsx
{/* Dentro de un div con position: relative */}
<div className="fhr-card relative overflow-hidden">
  
  {/* Línea Tesla */}
  <div
    className="absolute top-0 left-0 right-0 h-[2px]"
    style={{
      background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
      boxShadow: '0 0 20px #22D3EE',
    }}
  />
  
  {/* Contenido */}
  <div className="p-6">
    ...
  </div>
</div>
```

### Versión Dinámica (Framer Motion)

```tsx
import { motion } from 'framer-motion'

// Colores según estado
const TESLA_COLORS = {
  default: '#22D3EE',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  premium: '#A78BFA',
}

function TeslaLine({ color = 'default', isActive = true }) {
  const lineColor = TESLA_COLORS[color]
  
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-[2px] z-10"
      style={{
        background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)`,
        boxShadow: `0 0 15px ${lineColor}`,
      }}
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ 
        x: isActive ? '0%' : '-100%', 
        opacity: isActive ? 1 : 0 
      }}
      transition={{ duration: 0.6, ease: 'circOut' }}
    />
  )
}
```

### Uso por Contexto

| Contexto | Color | Código |
|----------|-------|--------|
| Default/Normal | Cyan | `#22D3EE` |
| Éxito/Completado | Verde | `#10B981` |
| Alerta/Atención | Amarillo | `#F59E0B` |
| Error/Crítico | Rojo | `#EF4444` |
| Premium/Destacado | Purple | `#A78BFA` |

---

## 🔮 GLASSMORPHISM

Efecto cristal oscuro con blur para cards y contenedores.

### Card Glassmorphism Básica

```tsx
<div className="fhr-card">
  {/* Contenido */}
</div>
```

```css
.fhr-card {
  background: rgba(30, 41, 59, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fhr-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(34, 211, 238, 0.5);
}
```

### Card Premium (blur intenso)

```tsx
<div className="fhr-glass-card">
  {/* Contenido premium */}
</div>
```

```css
.fhr-glass-card {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 20px;
  box-shadow: 
    0 0 40px rgba(34, 211, 238, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

---

## 📊 GAUGES (ANILLOS DE PROGRESO)

Indicadores circulares estilo Tesla para métricas principales.

### Gauge Básico con SVG

```tsx
function Gauge({ value, size = 176 }: { value: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size / 2) - strokeWidth - 10
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Track (fondo) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(51, 65, 85, 0.5)"
          strokeWidth={strokeWidth}
        />
        {/* Progress (valor) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 1.2s ease-out',
            filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.3))',
          }}
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>

      {/* Valor central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{value}%</span>
        <span className="text-xs text-slate-400 uppercase tracking-wider">Completado</span>
      </div>
    </div>
  )
}
```

### Gauge con Glow Exterior

```tsx
{/* Agregar glow detrás del gauge */}
<div className="relative">
  {/* Glow */}
  <div
    className="absolute rounded-full blur-[50px] opacity-20"
    style={{
      width: size * 0.5,
      height: size * 0.5,
      backgroundColor: '#22D3EE',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}
  />
  
  {/* Gauge */}
  <Gauge value={80} />
</div>
```

---

## 🔘 PREMIUM BUTTONS

Botones con efecto glow y animaciones premium.

### Import

```tsx
import { 
  PrimaryButton, 
  SecondaryButton, 
  GhostButton,
  DangerButton,
  SuccessButton 
} from '@/components/ui/PremiumButton'
```

### Variantes

```tsx
// Acción principal (cyan gradient + glow)
<PrimaryButton icon={ArrowRight} iconPosition="right">
  Continuar
</PrimaryButton>

// Acción secundaria (purple outline)
<SecondaryButton icon={Plus}>
  Agregar
</SecondaryButton>

// Acción terciaria (transparente)
<GhostButton icon={Settings}>
  Configurar
</GhostButton>

// Acción destructiva (rojo)
<DangerButton icon={Trash2}>
  Eliminar
</DangerButton>

// Acción de éxito (verde)
<SuccessButton icon={Check}>
  Confirmar
</SuccessButton>
```

### Props Disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `icon` | LucideIcon | - | Icono de lucide-react |
| `iconPosition` | 'left' \| 'right' | 'left' | Posición del icono |
| `size` | 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Tamaño |
| `isLoading` | boolean | false | Estado de carga |
| `fullWidth` | boolean | false | Ancho completo |
| `glow` | boolean | true (Primary) | Efecto glow |

### Tamaños

```tsx
<PrimaryButton size="sm">Pequeño</PrimaryButton>  // px-3 py-1.5 text-sm
<PrimaryButton size="md">Mediano</PrimaryButton>  // px-4 py-2 text-sm
<PrimaryButton size="lg">Grande</PrimaryButton>   // px-6 py-3 text-base
<PrimaryButton size="xl">Extra</PrimaryButton>    // px-8 py-4 text-lg
```

---

## 🎭 ANIMACIONES PREMIUM

### Spring Estándar FocalizaHR

```tsx
import { motion } from 'framer-motion'

// Spring para la mayoría de animaciones
const springConfig = {
  type: 'spring',
  stiffness: 220,
  damping: 30
}

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={springConfig}
>
  ...
</motion.div>
```

### Reglas de Timing

| Tipo | Duración | Easing |
|------|----------|--------|
| Entrada | 300ms | ease-out |
| Salida | 200ms | ease-in |
| Hover | 150ms | ease |
| Gauge | 1200ms | ease-out |

### Container + Items Pattern

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 220, damping: 30 }
  }
}

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <motion.div variants={itemVariants}>Item 1</motion.div>
  <motion.div variants={itemVariants}>Item 2</motion.div>
</motion.div>
```

---

## 📱 EJEMPLO COMPLETO: HERO CARD

```tsx
function HeroCard({ title, value, subtitle, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="fhr-glass-card p-8 relative overflow-hidden"
    >
      {/* Línea Tesla */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
          boxShadow: '0 0 20px #22D3EE',
        }}
      />

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Gauge */}
        <Gauge value={value} />

        {/* Contenido */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-slate-400 mb-4">{subtitle}</p>
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onAction}>
            Continuar
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  )
}
```
