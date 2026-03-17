Rediseñar GerenciaCover.tsx con la siguiente estructura vertical clara.

ARCHIVO: src/components/talent-actions/GerenciaCover.tsx
lee antes la guia de diseño focalzia, ya que son los unicos estilos y diseños que peudes usar: .claude/task/focalizahr-ui-design-standards-v2.md

═══════════════════════════════════════════════════════════════
ESTRUCTURA DEL LAYOUT (de arriba hacia abajo):
═══════════════════════════════════════════════════════════════

1. HEADER CON VOLVER
   - Botón "← Volver a gerencias" arriba izquierda
   - className="text-slate-400 hover:text-cyan-400 flex items-center gap-2"

2. CARD PRINCIPAL (Insight + Métricas)
   - Container: className="rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 p-8"
   - Fondo con esferas difusas:
     <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
       <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px]" />
       <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
     </div>
   
   Contenido:
   a) BADGE DE PATRÓN (centrado arriba)
      - className="inline-flex px-4 py-1.5 rounded-full text-sm font-medium"
      - Color según patrón: QUEMADA=orange, FRAGIL=red, SALUDABLE=emerald
   
   b) NOMBRE GERENCIA (centrado, grande)
      - className="text-3xl font-light text-white mt-4"
   
   c) LÍNEA TESLA
      <div className="flex items-center justify-center gap-3 my-6">
        <div className="h-px w-16 bg-white/20" />
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <div className="h-px w-16 bg-white/20" />
      </div>
   
   d) NARRATIVA INSIGHT (centrada, texto más grande)
      - className="text-lg text-slate-300 text-center max-w-2xl mx-auto leading-relaxed"
      - Ejemplo: "Equipo sobrecargado con señales de burnout activo. 17 personas operando al límite, 1 talento clave evaluando opciones. $41.7M CLP en riesgo."
   
   e) MÉTRICAS (grid de 4, centrado)
      - className="grid grid-cols-4 gap-4 mt-8 max-w-xl mx-auto"
      - Cada card: className="rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 p-4 text-center"
      - Número grande: className="text-2xl font-semibold" con color según tipo (amber=fuga, red=burnout, emerald=motor, slate=bajo)
      - Label: className="text-xs text-slate-400 mt-1"
   
   f) LINK VER DETALLE (centrado, debajo de métricas)
      - className="text-cyan-400 hover:text-cyan-300 text-sm mt-6 inline-flex items-center gap-1"
      - "Ver distribución de talento completa →"

3. SECCIÓN COACHING TIP (separada)
   - Separador: <div className="h-px bg-slate-700/50 my-8" />
   - Icono 💡 + "COACHING TIP" en label pequeño
   - className="text-slate-400 text-sm italic max-w-xl mx-auto text-center"
   - Texto según patrón detectado

4. SECCIÓN ACCIONES (abajo, separada)
   - Separador visual
   - Título: "¿Qué quieres hacer?" className="text-slate-500 text-sm uppercase tracking-wider text-center mb-6"
   - Grid de 3 botones: className="grid grid-cols-3 gap-4 max-w-2xl mx-auto"
   - Cada botón:
     className="rounded-xl bg-slate-800/50 border border-slate-700/30 p-5 text-left hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all cursor-pointer"
   - Icono + Título + Descripción pequeña

═══════════════════════════════════════════════════════════════
IMPORTANTE - NO HACER:
═══════════════════════════════════════════════════════════════
- NO usar layout de 2 columnas (izq/der)
- NO mezclar métricas con acciones
- NO poner el avatar grande a la izquierda
- NO usar clases legacy como fhr-card-metric con borde lateral
- NO cambiar la lógica de datos, solo el layout/estilos