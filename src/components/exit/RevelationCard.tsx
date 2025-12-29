// src/components/exit/RevelationCard.tsx
// 🎯 PROTAGONISTA - ACTO 2: La Revelación
// Filosofía: "El diamante merece una presentación premium"
// v3.5: Botón Evidencia con borde cyan sólido + animación suave
// ⚡ CAMBIOS v3.5:
//    - Botón con borde cyan sólido (visible pero elegante)
//    - Animación más suave (0.5s con easing natural)
//    - 0 cambios en lógica/props/config

'use client';

import { memo, useMemo, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Scale, ChevronDown, BookOpen, Target } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTAR DESDE CONFIG CENTRALIZADA
// ═══════════════════════════════════════════════════════════════════════════════
import {
  getExitAlertConfig,
  ALERT_COLOR_CLASSES,
  type ExitAlertTypeConfig,
  type AlertColor
} from '@/config/exitAlertConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface RevelationCardProps {
  alertType: string;
  summary: string;
  questionText: string;
  questionId: string;
  scoreValue: number;
  scoreMax: number;
  interpretation: string;
  disclaimer?: string;
  departmentName?: string;
  companyName?: string;
  eisFactors?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Highlights de texto
// ═══════════════════════════════════════════════════════════════════════════════

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface HighlightRule {
  text: string;
  className: string;
}

function highlightText(text: string, rules: HighlightRule[]): JSX.Element {
  if (!text || rules.length === 0) return <>{text}</>;

  const validRules = rules.filter(r => r.text && r.text.trim().length > 0);
  if (validRules.length === 0) return <>{text}</>;

  const pattern = validRules.map(r => `(${escapeRegex(r.text)})`).join('|');
  const regex = new RegExp(pattern, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        const matchedRule = validRules.find(r => r.text.toLowerCase() === part.toLowerCase());
        if (matchedRule) {
          return <span key={index} className={matchedRule.className}>{part}</span>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Score Display
// ═══════════════════════════════════════════════════════════════════════════════

function ScoreDisplay({ 
  value, 
  max, 
  label,
  sublabel 
}: { 
  value: number; 
  max: number; 
  label: string;
  sublabel: string;
}) {
  const percent = (value / max) * 100;

  return (
    <div className="relative p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
      <div className="fhr-top-line" />
      
      <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-medium mb-3">
        {label}
      </p>
      
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-light tracking-tight text-slate-200">
          {value.toFixed(1)}
        </span>
        <span className="text-slate-500 text-sm">
          / {max}
        </span>
      </div>
      
      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        />
      </div>
      
      <p className="text-[9px] text-slate-600">{sublabel}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Marco Legal
// ═══════════════════════════════════════════════════════════════════════════════

function LegalNote({ 
  title, 
  text, 
  prominent 
}: { 
  title: string; 
  text: string; 
  prominent: boolean;
}) {
  return (
    <div className={`
      relative p-4 rounded-xl border
      ${prominent 
        ? 'bg-amber-500/5 border-amber-500/20' 
        : 'bg-slate-800/30 border-slate-700/30'
      }
    `}>
      <div className="fhr-top-line-purple" />
      
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg ${prominent ? 'bg-amber-500/10' : 'bg-slate-700/30'}`}>
          <Scale className={`h-3.5 w-3.5 ${prominent ? 'text-amber-400' : 'text-slate-400'}`} />
        </div>
        <div>
          <p className={`
            text-[10px] uppercase tracking-wider mb-1.5 font-medium
            ${prominent ? 'text-amber-400' : 'text-slate-500'}
          `}>
            {title}
          </p>
          <p className={`
            text-xs leading-relaxed
            ${prominent ? 'text-amber-400/80' : 'text-slate-400'}
          `}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Evidencia Metodológica Colapsable
// ⚡ v3.5: Botón con borde cyan sólido + animación suave
// ═══════════════════════════════════════════════════════════════════════════════

function EvidenceCollapsible({
  config,
  questionText,
  questionId,
  eisFactors
}: {
  config: ExitAlertTypeConfig;
  questionText?: string;
  questionId?: string;
  eisFactors?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { evidence } = config;

  // Contenido dinámico según triggerType - NO TOCAR
  const renderTriggerContent = () => {
    switch (evidence.triggerType) {
      case 'question':
        return (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium">
                {evidence.triggerLabel}
              </p>
            </div>
            <blockquote className="pl-4 py-3 border-l-2 border-slate-600/50 bg-slate-800/20 rounded-r-lg">
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "{questionText}"
              </p>
              <cite className="block mt-2 text-[10px] text-slate-500 not-italic">
                — {questionId}
              </cite>
            </blockquote>
          </div>
        );
      
      case 'factors':
        return (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium">
                {evidence.triggerLabel}
              </p>
            </div>
            <div className="p-3 bg-slate-800/20 rounded-lg border border-slate-700/30">
              <p className="text-sm text-slate-300 mb-3">
                El Exit Intelligence Score integra:
              </p>
              <ul className="space-y-1.5">
                {(eisFactors || [
                  'Factores críticos de decisión de salida (mayor peso)',
                  'Calidad de liderazgo percibido',
                  'Oportunidades de desarrollo profesional',
                  'Employee Net Promoter Score'
                ]).map((factor, index) => (
                  <li key={index} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                    {factor}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] text-slate-500 italic">
                Algoritmo propietario FocalizaHR v2.0
              </p>
            </div>
          </div>
        );
      
      case 'pattern':
        return (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-purple-400" />
              <p className="text-xs text-purple-400 uppercase tracking-wider font-medium">
                {evidence.triggerLabel}
              </p>
            </div>
            <div className="p-3 bg-slate-800/20 rounded-lg border border-slate-700/30">
              <p className="text-sm text-slate-300">
                Se detectaron <span className="text-purple-400 font-medium">3 o más salidas</span> con 
                el mismo factor crítico en los últimos <span className="text-purple-400 font-medium">90 días</span>.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Esto indica un problema sistémico que requiere intervención estructural.
              </p>
            </div>
          </div>
        );
      
      case 'correlation':
        return (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium">
                {evidence.triggerLabel}
              </p>
            </div>
            <div className="p-3 bg-slate-800/20 rounded-lg border border-slate-700/30">
              <p className="text-sm text-slate-300">
                El sistema detectó que este colaborador tuvo 
                <span className="text-cyan-400 font-medium"> alertas de onboarding </span>
                que no fueron gestionadas.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                El sistema ADVIRTIÓ sobre riesgos durante la integración que ahora se confirman en la salida.
              </p>
            </div>
          </div>
        );
      
      case 'protocol':
        return (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-red-400" />
              <p className="text-xs text-red-400 uppercase tracking-wider font-medium">
                {evidence.triggerLabel}
              </p>
            </div>
            <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
              <p className="text-sm text-slate-300 mb-2">
                Se activó el protocolo de investigación según Ley 21.643:
              </p>
              <ul className="space-y-1.5">
                {[
                  'Plazo máximo de investigación: 30 días',
                  'Obligación de implementar medidas de resguardo',
                  'Documentación obligatoria de todas las acciones',
                  'Comunicación formal a las partes involucradas'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-xs text-red-400/80">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="mt-6 border-t border-slate-700/30 pt-4">
      {/* ⚡ v3.5: Botón con BORDE CYAN SÓLIDO - visible pero elegante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between 
          p-4 rounded-xl
          bg-slate-800/40
          border border-cyan-500/50
          hover:bg-slate-800/60 hover:border-cyan-500/70
          transition-all duration-300
          group
        "
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <span className="text-sm text-white font-medium">Ver Evidencia Metodológica</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronDown className="h-4 w-4 text-cyan-400 group-hover:text-cyan-300" />
        </motion.div>
      </button>

      {/* Contenido expandible - animación suave */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.5,  // ⚡ v3.5: Más lento
              ease: [0.4, 0, 0.2, 1]  // ⚡ v3.5: Easing natural
            }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-2 px-1">
              {renderTriggerContent()}
              
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-700/50" />
                <span className="text-[10px] text-slate-600">•</span>
                <div className="flex-1 h-px bg-slate-700/50" />
              </div>
              
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-medium">
                  📖 Fuentes
                </p>
                <ul className="space-y-2">
                  {evidence.sources.map((source, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-slate-600 mt-0.5">•</span>
                      <span>{source}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function RevelationCard({
  alertType,
  summary,
  questionText,
  questionId,
  scoreValue,
  scoreMax,
  interpretation,
  disclaimer,
  departmentName,
  companyName,
  eisFactors
}: RevelationCardProps) {
  
  const config = useMemo(() => getExitAlertConfig(alertType), [alertType]);
  
  const highlightRules = useMemo((): HighlightRule[] => {
    const rules: HighlightRule[] = [];
    if (departmentName) {
      rules.push({ text: departmentName, className: 'text-cyan-400 font-medium' });
    }
    if (companyName) {
      rules.push({ text: companyName, className: 'text-cyan-400 font-medium' });
    }
    config.revelation.emphasisWords.forEach(word => {
      rules.push({ text: word, className: 'text-red-400 font-semibold' });
    });
    return rules;
  }, [departmentName, companyName, config.revelation.emphasisWords]);
  
  const HeaderIcon = config.header.icon;
  const iconColorClasses = ALERT_COLOR_CLASSES[config.header.iconColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="
        relative overflow-hidden w-full
        bg-slate-900/40 backdrop-blur-xl
        border border-slate-700/50 rounded-2xl 
        p-6 md:p-8
      "
    >
      {/* Efectos decorativos */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        
        {/* HEADER */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-xl border ${iconColorClasses.bg} ${iconColorClasses.border}`}>
            <HeaderIcon className={`h-6 w-6 ${iconColorClasses.icon}`} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-white uppercase tracking-wide">
              {config.header.title}
            </h2>
            <p className="text-sm text-purple-400 font-light">
              {config.header.subtitle}
            </p>
            <p className="text-[10px] text-slate-500 mt-1.5 tracking-wider uppercase">
              {config.header.contextLabel}
            </p>
          </div>
        </div>

        {/* Línea decorativa */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        </div>

        {/* SUMMARY - PROTAGONISTA */}
        <div className="
          relative pl-5 py-5 mb-6
          border-l-[3px] border-cyan-500/70
          bg-gradient-to-r from-cyan-500/8 via-transparent to-transparent
          rounded-r-xl
        ">
          <p className="text-lg md:text-xl text-slate-100 leading-relaxed font-light">
            {highlightText(summary, highlightRules)}
          </p>
        </div>

        {/* GRID: MÉTRICA | MARCO LEGAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ScoreDisplay
            value={scoreValue}
            max={scoreMax}
            label={config.revelation.scoreLabel}
            sublabel={config.revelation.sourceLabel}
          />
          
          <LegalNote
            title={config.revelation.legalNoteTitle}
            text={config.revelation.legalNoteText}
            prominent={config.revelation.showLegalNote}
          />
        </div>

        {/* CONCLUSIÓN */}
        <div className="relative p-5 bg-slate-800/30 rounded-xl border border-slate-700/20">
          <div className="fhr-top-line" />
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg mt-0.5">
              <Lightbulb className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-medium">
                Conclusión
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {interpretation}
              </p>
            </div>
          </div>
        </div>

        {/* EVIDENCIA METODOLÓGICA */}
        <EvidenceCollapsible
          config={config}
          questionText={questionText}
          questionId={questionId}
          eisFactors={eisFactors}
        />
      </div>
    </motion.div>
  );
});