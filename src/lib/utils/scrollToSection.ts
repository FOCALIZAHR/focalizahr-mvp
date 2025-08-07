// ====================================================================
// FOCALIZAHR SCROLL TO SECTION - NAVEGACIÓN INTELIGENTE CLICK-TO-SCROLL
// src/lib/utils/scrollToSection.ts
// Chat 3: Sistema navegación desde paneles header → componentes WOW
// ====================================================================

export type ComponentWOWSection = 
  | 'champion-momentum'      // → TopMoversPanel / DepartmentPulsePanel
  | 'risk-focus'            // → AnomalyDetectorPanel
  | 'pattern-analysis'      // → CampaignRhythmPanel
  | 'engagement-heatmap'    // → EngagementHeatmapCard
  | 'cross-study'           // → CrossStudyComparatorCard
  | 'actions-panel';        // → ActionButtons

interface ScrollOptions {
  behavior?: 'smooth' | 'instant';
  block?: 'start' | 'center' | 'end';
  offset?: number;
}

/**
 * Navegar a sección específica de componente WOW
 * Usado desde paneles Vista Dinámica para enfocar análisis detallado
 */
export function scrollToSection(
  section: ComponentWOWSection, 
  options: ScrollOptions = {}
) {
  const {
    behavior = 'smooth',
    block = 'center',
    offset = -20
  } = options;

  // 🎯 MAPEO SECCIONES → SELECTORES
  const sectionSelectors: Record<ComponentWOWSection, string> = {
    'champion-momentum': '[data-component="TopMoversPanel"], [data-component="DepartmentPulsePanel"]',
    'risk-focus': '[data-component="AnomalyDetectorPanel"]',
    'pattern-analysis': '[data-component="CampaignRhythmPanel"]', 
    'engagement-heatmap': '[data-component="EngagementHeatmapCard"]',
    'cross-study': '[data-component="CrossStudyComparatorCard"]',
    'actions-panel': '[data-component="ActionButtons"]'
  };

  const selector = sectionSelectors[section];
  if (!selector) {
    console.warn(`ScrollToSection: Sección '${section}' no reconocida`);
    return;
  }

  // 🔍 BUSCAR ELEMENTO
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`ScrollToSection: No se encontró elemento para '${section}' con selector '${selector}'`);
    return;
  }

  // ✨ EFECTO VISUAL TEMPORAL (highlight)
  element.classList.add('scroll-highlight');
  setTimeout(() => {
    element.classList.remove('scroll-highlight');
  }, 2000);

  // 📍 SCROLL INTELIGENTE CON OFFSET
  const elementRect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset + elementRect.top + offset;

  window.scrollTo({
    top: scrollTop,
    behavior: behavior
  });

  // 📊 TRACKING OPCIONAL (analytics)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'cockpit_navigation', {
      section: section,
      scroll_method: 'click_to_scroll'
    });
  }
}

/**
 * Hook React para usar scroll navigation en componentes
 */
export function useScrollToSection() {
  const navigateToSection = (section: ComponentWOWSection, options?: ScrollOptions) => {
    scrollToSection(section, options);
  };

  return { navigateToSection };
}

