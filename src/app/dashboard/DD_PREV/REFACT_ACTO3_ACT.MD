TAREA: Rediseñar panel derecho de TACSpotlightCard.tsx

ARCHIVO A MODIFICAR:
src/components/talent-actions/cinema/TACSpotlightCard.tsx

ARCHIVO DE NARRATIVAS (YA EXISTE, SOLO IMPORTAR):
src/config/GerenciaPatternNarratives.ts

Uso:
import { getGerenciaPatternNarrative, getActionTooltip } from '@/config/GerenciaPatternNarratives'
const narrative = getGerenciaPatternNarrative(pattern)
narrative.coachingTip  // texto del coaching tip
getActionTooltip(pattern, 'agendar_comite')  // tooltip específico


LAYOUT (MANTENER SIN CAMBIOS):
- 2 columnas: avatar izquierda (35%) + contenido derecha (65%)
- Avatar con iniciales + badge patrón + nombre gerencia + stats
- Tesla line arriba del panel


PANEL DERECHO - NUEVO CONTENIDO (de arriba a abajo):

1. COACHING TIP
   - Ícono: Lightbulb (cyan-400, 20px)
   - Texto: narrative.coachingTip (dinámico según patrón)
   - Estilo: bg-slate-800/30, border-cyan-400/10, backdrop-blur-[12px]
   - rounded-2xl, padding 16px

2. TESLA LINE (separador)
   - height: 1px
   - gradient: transparent → cyan-400 → transparent
   - shadow: 0 0 8px cyan-400/40
   - margin: 20px vertical

3. CTA PRIMARIO
   - Ícono: Calendar (slate-900, 20px, left)
   - Texto: "Agendar Comité de Riesgo"
   - Ícono derecho: Info (para tooltip)
   - Tooltip: getActionTooltip(pattern, 'agendar_comite')
   - Estilo: 
     - height: 56px, rounded-full
     - bg: gradient from-cyan-400 to-cyan-600
     - text: slate-900, font-semibold
     - shadow: 0 8px 24px -8px cyan-400/50
     - hover: scale(1.02)

4. ACCIONES GHOST (2 botones en fila)
   - Botón 1: 
     - Ícono: Mail
     - Texto: "Notificar"
     - Tooltip: getActionTooltip(pattern, 'notificar')
   - Botón 2:
     - Ícono: Flag (o Bookmark)
     - Texto: "Marcar"
     - Tooltip: getActionTooltip(pattern, 'marcar')
   - Estilo ambos:
     - height: 40px, rounded-full
     - bg: transparent, border: slate-600/40
     - text: slate-400, font-medium
     - hover: border-cyan-400/50, text-cyan-400

5. LINK FINAL
   - Texto: "Ver las {peopleAtRisk} personas →"
   - Estilo: text-cyan-400, hover:text-cyan-300, text-sm
   - onClick: abre TACDetailModal (comportamiento existente)


ELIMINAR DEL PANEL DERECHO:
- Las 4 métricas (En fuga, Burnout, Motor, Bajo rend.)
- El link "Ver distribución de talento completa →"
- La narrativa/insight estática anterior
- Cualquier acción duplicada


ICONOS LUCIDE (importar):
import { Lightbulb, Calendar, Mail, Flag, Info } from 'lucide-react'

TOOLTIPS:
Usar Tooltip de shadcn/ui o el componente existente del proyecto.
El ícono Info (i) junto a cada acción muestra el tooltip en hover.

NO TOCAR:
- TACGerenciaCover.tsx
- TACDetailModal.tsx
- GerenciaPatternNarratives.ts
- Layout 2 columnas existente
- Panel izquierdo (avatar)

ALTURA MÁXIMA:
El contenido debe caber sin scroll en viewport 900px altura.