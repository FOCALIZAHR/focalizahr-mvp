// ====================================================================
// FOCALIZAHR COCKPIT VIEW HOOK - CEREBRO DE LA UI INTELIGENTE
// src/hooks/useCockpitView.ts
// Chat 1: Fundación Arquitectónica - Hook UI personalizado
// ====================================================================

import { useState, useCallback, useEffect } from 'react';

export type CockpitViewType = 'predictive' | 'dynamic';

export interface CockpitViewState {
  activeView: CockpitViewType;
  isTransitioning: boolean;
  lastViewSwitchTime: Date;
  userPreference: CockpitViewType | null;
}

export interface CockpitViewHook {
  activeView: CockpitViewType;
  isTransitioning: boolean;
  lastViewSwitchTime: Date;
  userPreference: CockpitViewType | null;
  handleToggle: (view: CockpitViewType) => void;
  intelligentViewSuggestion: (monitorData: any) => CockpitViewType;
  getViewInsight: () => string | null;
  shouldShowPulse: boolean;
  canSwitch: boolean;
}

export function useCockpitView(): CockpitViewHook {
  const [state, setState] = useState<CockpitViewState>({
    activeView: 'predictive',
    isTransitioning: false,
    lastViewSwitchTime: new Date(),
    userPreference: null
  });

  // 🎯 INTELIGENCIA: Auto-detección contexto óptimo
  const intelligentViewSuggestion = useCallback((monitorData: any): CockpitViewType => {
    // Si hay anomalías críticas → sugerir vista dinámica
    if (monitorData?.negativeAnomalies?.length > 0) {
      return 'dynamic';
    }
    // Si campaña está estable → vista predictiva
    return 'predictive';
  }, []);

  // 🎨 TRANSICIONES PREMIUM: Control estado animaciones
  const handleToggle = useCallback((view: CockpitViewType) => {
    if (view !== state.activeView && !state.isTransitioning) {
      setState(prev => ({
        ...prev,
        isTransitioning: true,
        userPreference: view
      }));
      
      // Delay para animación suave Tesla-level
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          activeView: view,
          isTransitioning: false,
          lastViewSwitchTime: new Date()
        }));
      }, 150);
    }
  }, [state.activeView, state.isTransitioning]);

  // 🔮 PREDICCIÓN: Context-aware recommendations
  const getViewInsight = useCallback((): string | null => {
    const timeSinceSwitch = Date.now() - state.lastViewSwitchTime.getTime();
    
    if (timeSinceSwitch < 30000 && state.activeView === 'dynamic') {
      return "Vista táctica activada - Diagnóstico departamental en curso";
    }
    
    if (state.activeView === 'predictive') {
      return "Vista estratégica - Proyección organizacional con IA predictiva";
    }
    
    return null;
  }, [state.activeView, state.lastViewSwitchTime]);

  // 🎯 AUTO-SUGERENCIA INTELIGENTE: Cambiar vista según contexto
  const getSmartSuggestion = useCallback((monitorData: any) => {
    if (!monitorData) return null;
    
    // Si hay múltiples anomalías críticas → sugerir vista dinámica
    if (monitorData.negativeAnomalies?.length >= 2) {
      return {
        suggestedView: 'dynamic' as CockpitViewType,
        reason: 'Múltiples departamentos requieren atención inmediata'
      };
    }
    
    // Si proyección es muy baja → sugerir vista predictiva para análisis
    if (monitorData.participationRate < 50 && state.activeView === 'dynamic') {
      return {
        suggestedView: 'predictive' as CockpitViewType,
        reason: 'Proyección requiere análisis estratégico'
      };
    }
    
    return null;
  }, [state.activeView]);

  // 🎨 INDICADORES VISUALES: Estados para animaciones
  const getViewStatus = useCallback(() => {
    return {
      showPredictivePulse: state.activeView === 'predictive' && !state.isTransitioning,
      showDynamicAlert: state.activeView === 'dynamic' && !state.isTransitioning,
      transitionProgress: state.isTransitioning ? 0.5 : 1
    };
  }, [state.activeView, state.isTransitioning]);

  // 🧠 DETECCIÓN INTELIGENTE: Sugerir cambio de vista basado en datos
  useEffect(() => {
    // Implementar lógica futura de auto-sugerencias
    // Por ejemplo: si detecta anomalías críticas, sugerir cambio a vista dinámica
  }, [state.activeView]);

  return {
    // Estado principal
    activeView: state.activeView,
    isTransitioning: state.isTransitioning,
    lastViewSwitchTime: state.lastViewSwitchTime,
    userPreference: state.userPreference,
    
    // Funciones
    handleToggle,
    intelligentViewSuggestion,
    getViewInsight,
    
    // Estados derivados para animaciones premium
    shouldShowPulse: state.isTransitioning,
    canSwitch: !state.isTransitioning
  };
}