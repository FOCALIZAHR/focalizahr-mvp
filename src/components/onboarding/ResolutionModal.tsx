// src/components/onboarding/ResolutionModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface ResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (notes: string) => Promise<void>;
  alertType: string;
  employeeName: string;
}

// ============================================================================
// QUICK PICKS POR TIPO DE ALERTA
// ============================================================================

const STRATEGY_TEMPLATES = {
  'riesgo_fuga': [
    'Conversación 1:1 + Reasignación proyecto estructurado',
    'Conversación 1:1 + Ajuste expectativas claras',
    'Plan desarrollo + Mentor senior asignado',
    'Salida ética acordada (incompatibilidad cultural)'
  ],
  'abandono_dia_1': [
    'Contacto inmediato + Corrección logística',
    'Bienvenida personal líder + Tour oficina',
    'IT provisiona accesos + Tutor asignado',
    'Rediseño proceso onboarding completo'
  ],
  'bienvenida_fallida': [
    'Corrección logística inmediata + Disculpa formal',
    'Reasignación tutor + Plan integración',
    'Reunión equipo + Presentación formal',
    'Ajuste proceso bienvenida departamento'
  ],
  'confusion_rol': [
    'Job description detallado + Objetivos 30-60-90',
    'Sesión clarificación expectativas + Firma acuerdo',
    'Shadowing peer 2 semanas',
    'Check-ins semanales estructurados'
  ],
  'desajuste_rol': [
    'Assessment skills + Identificación gaps',
    'Reasignación tareas del rol',
    'Capacitación técnica + Práctica supervisada',
    'Reasignación interna a rol compatible'
  ],
  'detractor_cultural': [
    'Sesión valores/cultura + Identificación fricción',
    'Asignación tutor cultural + Integración gradual',
    'Salida ética acordada (incompatibilidad fundamental)',
    'Ajuste dinámicas equipo'
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
  employeeName
}: ResolutionModalProps) {
  
  const [strategy, setStrategy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const quickPicks = STRATEGY_TEMPLATES[alertType as keyof typeof STRATEGY_TEMPLATES] || [];
  
  const handleConfirm = async () => {
    if (strategy.trim().length < 20) {
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
    // No permitir cerrar sin completar
    if (!open && strategy.trim().length < 20) {
      return;
    }
    if (!open) {
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl fhr-card border-2 border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
        
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
              <Sparkles className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl fhr-title-gradient">
                Registro de Estrategia
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-1">
                {employeeName} - Sistema de Aprendizaje
              </DialogDescription>
            </div>
          </div>
          
          <Alert className="bg-blue-500/10 border-blue-500/30 mt-4">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-sm text-blue-200">
              Este registro permite mejorar el sistema con datos reales. 
              En 3 meses podrás ver qué estrategias tienen mayor efectividad (ej: "Reasignación = 90% vs Solo charla = 60%").
            </AlertDescription>
          </Alert>
        </DialogHeader>
        
        {/* Content */}
        <div className="space-y-5 mt-4">
          
          {/* Quick Picks */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-3 block flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-cyan-400" />
              Estrategias comunes (selecciona o escribe la tuya):
            </label>
            <div className="grid grid-cols-2 gap-3">
              {quickPicks.map((pick, idx) => (
                <button
                  key={idx}
                  onClick={() => setStrategy(pick)}
                  className={`
                    group p-4 text-left text-sm rounded-lg border transition-all duration-300
                    ${strategy === pick 
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                      : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-cyan-500/50 hover:bg-slate-800'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 transition-colors ${
                      strategy === pick ? 'text-cyan-400' : 'text-slate-600 group-hover:text-cyan-500'
                    }`} />
                    <span className="leading-tight">{pick}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-slate-900 text-slate-500">O PERSONALIZA TU ESTRATEGIA</span>
            </div>
          </div>
          
          {/* Textarea personalizado */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">
              Describe tu estrategia específica:
            </label>
            <Textarea
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="Ej: Conversé con Ana, identificamos preferencia proyectos estructurados vs ágiles. La reasigné al proyecto Migración BD con mentor senior. Seguimiento en 15 días..."
              rows={4}
              className="
                bg-slate-900/50 border-slate-700 text-slate-200 
                focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20
                placeholder:text-slate-600
                resize-none
              "
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">
                Mínimo 20 caracteres para análisis efectividad
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${
                  strategy.length >= 20 ? 'text-green-400' : 'text-slate-500'
                }`}>
                  {strategy.length} / 20
                </span>
                {strategy.length >= 20 && (
                  <Badge className="bg-green-600 text-white animate-in fade-in duration-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completo
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Motivación */}
          <Alert className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <Lightbulb className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-sm text-blue-200">
              <strong className="text-blue-100">Valor de este registro:</strong> En 3 meses verás 
              tu tasa de éxito por estrategia en tu dashboard personal. Ejemplo: "Reasignación 
              proyecto = 90% retención vs Solo conversación = 60%". El sistema aprende de tus 
              decisiones.
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Footer */}
        <DialogFooter className="mt-6">
          <Button
            onClick={handleConfirm}
            disabled={strategy.trim().length < 20 || isSubmitting}
            className={`
              w-full h-14 text-base font-semibold
              ${strategy.trim().length >= 20
                ? 'fhr-btn-primary'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
              transition-all duration-300
            `}
          >
            {isSubmitting 
              ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              )
              : strategy.trim().length < 20
                ? '✏️ Completa el registro para continuar'
                : '✓ Confirmar Intervención y Cerrar'
            }
          </Button>
        </DialogFooter>
        
      </DialogContent>
    </Dialog>
  );
}

export default ResolutionModal;