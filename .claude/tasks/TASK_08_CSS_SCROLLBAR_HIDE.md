# TASK 08: Agregar CSS para Scrollbar Oculto

## Objetivo
Agregar clase CSS utilitaria para ocultar scrollbar en carruseles horizontales.

## Archivo a Modificar
```
src/styles/focalizahr-unified.css
```

## Contexto
- El carrusel de competencias usa scroll horizontal
- Necesitamos ocultar el scrollbar pero mantener funcionalidad de scroll
- La clase `scrollbar-hide` se usa en CompetencyCarouselOrchestrator

## Cambios Específicos

Agregar al **FINAL** del archivo `src/styles/focalizahr-unified.css`:

```css
/* ============================================================================
   SCROLLBAR UTILITIES
   Clases para control de scrollbar en carruseles y contenedores
   ============================================================================ */

/**
 * Oculta el scrollbar pero mantiene funcionalidad de scroll
 * Uso: <div className="overflow-x-auto scrollbar-hide">
 */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;     /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;             /* Chrome, Safari, Opera */
}

/**
 * Scrollbar sutil para contenedores largos
 * Uso: <div className="overflow-y-auto scrollbar-thin">
 */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(100, 116, 139, 0.5);
}

/* ============================================================================
   CINEMA MODE SPECIFIC STYLES
   Estilos específicos para el modo Cinema
   ============================================================================ */

/**
 * Contenedor de carrusel con snap scroll
 */
.cinema-carousel {
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.cinema-carousel > * {
  scroll-snap-align: start;
}

/**
 * Fade edges para indicar scroll disponible
 */
.carousel-fade-edges {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 20px,
    black calc(100% - 20px),
    transparent
  );
  mask-image: linear-gradient(
    to right,
    transparent,
    black 20px,
    black calc(100% - 20px),
    transparent
  );
}
```

## Validación

```bash
# Verificar que el CSS es válido
# El archivo debe compilar sin errores

# Probar en navegador:
# 1. Ir a la página de Cinema Summary
# 2. Verificar que el carrusel no muestra scrollbar
# 3. Verificar que el scroll horizontal funciona con mouse/touch
# 4. Verificar en diferentes navegadores (Chrome, Firefox, Safari)
```

## Criterios de Éxito
- [ ] El archivo CSS compila sin errores
- [ ] La clase `scrollbar-hide` oculta el scrollbar en Chrome
- [ ] La clase `scrollbar-hide` oculta el scrollbar en Firefox
- [ ] La clase `scrollbar-hide` oculta el scrollbar en Safari
- [ ] El scroll horizontal sigue funcionando
- [ ] No hay conflictos con estilos existentes

## NO Modificar
- Ningún estilo existente en el archivo
- Variables CSS existentes
- Clases `.fhr-*` existentes
