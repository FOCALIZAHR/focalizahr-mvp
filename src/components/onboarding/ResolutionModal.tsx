// src/components/onboarding/ResolutionModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ClipboardList, Check, Sparkles } from 'lucide-react';
import { InsightAccionable } from '@/components/insights/InsightAccionable';

// ============================================================================
// INTERFACES
// ============================================================================

interface ResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (notes: string) => Promise<void>;
  alertType: string;
  employeeName: string;
  businessCase: any; // BusinessCase type del OnboardingAlertEngine
}

// ============================================================================
// QUICK PICKS ALINEADOS A NARRATIVAS (PRODUCCIÓN)
// ============================================================================

const STRATEGY_TEMPLATES = {
  // 🔴 RIESGO_FUGA
  // Plan sugerido: 1. Reunión 1:1 (Ventilación) -> 2. Escucha Activa -> 3. Quick Win
  'riesgo_fuga': [
    'Apliqué el "Paso 1": Reunión 1:1 de emergencia para escuchar frustraciones',
    'Logré identificar el "Dolor Real" detrás de la intención de salida',
    'Acordamos un "Quick Win" (solución rápida) ejecutable esta misma semana',
    'El caso es complejo: Escalé a RRHH para plan de retención mayor o salida'
  ],

  // 🚨 ABANDONO_DIA_1
  // Plan sugerido: 1. Contacto/Disculpa -> 2. Bienvenida Manager -> 3. Fix Logístico
  'abandono_dia_1': [
    'Contacté al colaborador y ofrecí disculpas por el error de recepción',
    'El Manager realizó la bienvenida personal correctiva (cubriendo el vacío)',
    'Resolví los accesos/herramientas críticas que faltaban (Acción Inmediata)',
    'Agendamos sesión de "Re-Onboarding" para reiniciar la experiencia'
  ],

  // 🚨 BIENVENIDA_FALLIDA (Logística/Herramientas)
  // Plan sugerido: 1. Corrección Express -> 2. Plan Contingencia -> 3. Involucrar Equipo
  'bienvenida_fallida': [
    'Gestioné la entrega inmediata de las herramientas faltantes',
    'Designé un "Tutor" temporal para suplir las carencias logísticas',
    'Realicé la presentación formal con el equipo (que no se había hecho)',
    'Corregí el proceso para evitar que esto afecte su primera semana'
  ],

  // ⚠️ CONFUSION_ROL (Claridad)
  // Plan sugerido: 1. Reunión Expectativas -> 2. Doc Escrito -> 3. Check-in Corto
  'confusion_rol': [
    'Realizamos la sesión de "Clarificación de Expectativas" (Rol vs Realidad)',
    'Entregué y revisamos juntos la descripción de cargo y objetivos (30-60-90)',
    'Establecimos reuniones de chequeo de 15 min al final de cada día',
    'Asigné un par técnico para resolver dudas operativas en tiempo real'
  ],

  // 🚨 DESAJUSTE_ROL (El más crítico - "Estafa")
  // Plan sugerido: 1. Validar Gaps -> 2. Ajustar Carga -> 3. Reasignar/Sincerar
  'desajuste_rol': [
    'Validé con el colaborador qué tareas no coinciden con lo prometido',
    'Ajusté la carga laboral para alinearla a sus fortalezas reales',
    'Diseñamos un plan de capacitación express para cubrir las brechas técnicas',
    'Iniciamos evaluación para reasignación interna (el rol actual no es viable)'
  ],

  // ⚠️ DETRACTOR_CULTURAL (Values/Fit)
  // Plan sugerido: 1. Indagar el "Porqué" -> 2. Conectar con Propósito -> 3. Mentoría
  'detractor_cultural': [
    'Tuve la conversación difícil para entender el origen de su crítica',
    'Identificamos un conflicto de valores específico y cómo manejarlo',
    'Asigné un "Mentor Cultural" para facilitar su integración al grupo',
    'Acordamos una salida ética (el fit cultural no es recuperable)'
  ]
};
// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ResolutionModal({
  isOpen,
  onClose,
  onResolve,
  alertType,
  employeeName,
  businessCase
}: ResolutionModalProps) {
  
  const [strategy, setStrategy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResolutionSection, setShowResolutionSection] = useState(false);
  
  // Ref para scroll automático a sección de resolución
  const resolutionSectionRef = useRef<HTMLDivElement>(null);
  
  // Scroll automático cuando se expande la sección
  useEffect(() => {
    if (showResolutionSection && resolutionSectionRef.current) {
      setTimeout(() => {
        resolutionSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [showResolutionSection]);
  
  // Calcular quickPicks ANTES del useEffect que lo usa
  const quickPicks = STRATEGY_TEMPLATES[alertType.toLowerCase() as keyof typeof STRATEGY_TEMPLATES] || [];
  
  // Debug alertType y quickPicks
  useEffect(() => {
    console.log('🔍 DEBUG ResolutionModal:');
    console.log('  alertType recibido:', alertType);
    console.log('  alertType normalizado:', alertType.toLowerCase());
    console.log('  Keys disponibles:', Object.keys(STRATEGY_TEMPLATES));
    console.log('  quickPicks length:', quickPicks.length);
    console.log('  quickPicks:', quickPicks);
    
    if (quickPicks.length === 0) {
      console.warn('⚠️ ALERTA: No hay quickPicks. Verificar que alertType coincida con keys.');
    }
  }, [alertType, quickPicks]);
  
  const handleConfirm = async () => {
    // Validar: Quick Pick seleccionado O estrategia manual con 10+ chars
    const isQuickPick = quickPicks.includes(strategy);
    const isManualValid = strategy.trim().length >= 10;
    
    if (!isQuickPick && !isManualValid) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onResolve(strategy);
      // onClose se ejecuta automáticamente en el parent
    } catch (error) {
      console.error('Error al resolver alerta:', error);
      setIsSubmitting(false);
    }
  };
  
  const handleClose = (open: boolean) => {
    // Usuario puede cerrar en cualquier momento
    if (!open) {
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="w-[95vw] max-w-2xl sm:max-w-3xl fhr-modal border-2 border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.15)] max-h-[90vh] overflow-y-auto overflow-x-hidden p-0"
        showCloseButton={false}
      >
        
        {/* DialogTitle OBLIGATORIO para accesibilidad Radix UI */}
        <DialogTitle className="sr-only">
          Resolución de Alerta - {employeeName}
        </DialogTitle>
        
        {/* ========================================
            SECCIÓN 1: INSIGHT ACCIONABLE (siempre visible)
            ======================================== */}
        <div className="px-6 py-6">
          <InsightAccionable
            businessCase={businessCase}
            onActionClick={(action) => {
              console.log('Action triggered:', action);
              setShowResolutionSection(true);
            }}
          />
        </div>

        {/* ========================================
            SECCIÓN 2: RESOLUCIÓN (aparece después de acción)
            ======================================== */}
        {showResolutionSection && (
          <div 
            ref={resolutionSectionRef}
            className="px-6 pb-6 space-y-6 pt-6 border-t border-slate-700/50"
          >
            {/* Header sección resolución */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl fhr-title-gradient font-semibold">
                    Reporte de Intervención
                  </h2>
                  <p className="text-slate-400 mt-1 text-sm">
                    <span className="text-cyan-400 font-semibold">{employeeName}</span> • Validación para Algoritmo de Efectividad
                  </p>
                </div>
              </div>
            </div>
            
            {/* ✅ NUEVO: HINT MEDICIÓN AUTOMÁTICA */}
            <div className="p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-cyan-400 mb-1">
                    Enfócate en ejecutar el plan
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    El sistema medirá automáticamente la efectividad de tu intervención 
                    en 60 días (retención del empleado + mejora de score). 
                    No necesitas volver a reportar resultados.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="space-y-5">
              
              {/* Texto contexto natural */}
              <p className="text-sm text-slate-300 leading-relaxed">
                ¿Qué hiciste para ayudar a <span className="text-cyan-400 font-semibold">{employeeName}</span>?
                Selecciona la acción que tomaste o describe qué hiciste:
              </p>
              
              {/* Quick Picks */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-3 block flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-cyan-400" />
                  Selecciona la acción que tomaste:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {quickPicks.map((pick, idx) => (
                    <button
                      key={idx}
                      onClick={() => setStrategy(pick)}
                      className={`
                        group p-4 text-left text-sm rounded-lg border-2 transition-all duration-300
                        ${strategy === pick 
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20 text-white' 
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/30 hover:bg-slate-800/70'
                        }
                      `}
                    >
                      <span className="font-medium">{pick}</span>
                      {strategy === pick && (
                        <CheckCircle className="h-4 w-4 text-cyan-400 mt-2 inline-block" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Textarea Opcional */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-3 block">
                  O describe otra acción que tomaste:
                </label>
                <Textarea
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  placeholder="Ejemplo: 'Hablé con Juan y descubrí que su problema era el horario inflexible, entonces coordiné con su manager para permitir home office 2 días a la semana...'"
                  className="min-h-[120px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 transition-colors"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-500">
                    {quickPicks.includes(strategy) 
                      ? 'Acción seleccionada. Puedes agregar detalles adicionales si quieres.' 
                      : 'Describe qué hiciste (mínimo 10 caracteres)'
                    }
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      quickPicks.includes(strategy) || strategy.length >= 10 
                        ? 'text-green-400' 
                        : 'text-slate-500'
                    }`}>
                      {strategy.length} {!quickPicks.includes(strategy) && '/ 10'}
                    </span>
                    {(quickPicks.includes(strategy) || strategy.length >= 10) && (
                      <Badge className="bg-green-600 text-white animate-in fade-in duration-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Válido
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Footer con PremiumButton */}
            <DialogFooter className="mt-6 flex gap-3">
              <GhostButton
                onClick={() => setShowResolutionSection(false)}
                disabled={isSubmitting}
              >
                Volver
              </GhostButton>
              
              <PrimaryButton
                onClick={handleConfirm}
                disabled={
                  (!quickPicks.includes(strategy) && strategy.trim().length < 10) || 
                  isSubmitting
                }
                isLoading={isSubmitting}
                icon={Check}
              >
                {isSubmitting 
                  ? 'Guardando...'
                  : 'Registrar Plan y Cerrar Alerta'
                }
              </PrimaryButton>
            </DialogFooter>
          </div>
        )}
        
      </DialogContent>
    </Dialog>
  );
}

export default ResolutionModal;