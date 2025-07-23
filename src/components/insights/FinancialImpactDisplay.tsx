// src/components/insights/FinancialImpactDisplay.tsx
// 🎯 FOCALIZAHR - CHAT 6B: FINANCIAL IMPACT DISPLAY
// Componente especializado para mostrar impacto financiero transparente

'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  PieChart,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { BusinessCaseFinancials } from '@/types/BusinessCase';

interface FinancialImpactDisplayProps {
  financials: BusinessCaseFinancials;
  evidenceData?: {
    score: number;
    benchmark: number;
    participantsAffected: number;
  };
  compactMode?: boolean;
  className?: string;
}

/**
 * FinancialImpactDisplay - Componente especializado transparencia financiera
 * Diferenciación: Metodología auditable vs estimaciones vagas competencia
 */
export const FinancialImpactDisplay: React.FC<FinancialImpactDisplayProps> = ({
  financials,
  evidenceData,
  compactMode = false,
  className = ''
}) => {
  // 💰 FORMATEO MONEDA CHILENA
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 📊 CÁLCULO BENEFICIO NETO
  const netBenefit = financials.potentialAnnualLoss - financials.recommendedInvestment;
  const isPositiveROI = financials.estimatedROI > 0;

  // 🎨 ROI COLOR CODING
  const getROIColor = (roi: number) => {
    if (roi >= 100) return 'text-green-400';
    if (roi >= 50) return 'text-cyan-400';
    if (roi >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  // ⚡ URGENCY SCORE basado en financials
  const getUrgencyScore = () => {
    const costRatio = financials.potentialAnnualLoss / financials.currentAnnualCost;
    if (costRatio > 5) return { level: 'CRÍTICA', color: 'text-red-400', icon: AlertCircle };
    if (costRatio > 3) return { level: 'ALTA', color: 'text-orange-400', icon: TrendingDown };
    if (costRatio > 1.5) return { level: 'MEDIA', color: 'text-yellow-400', icon: Calculator };
    return { level: 'BAJA', color: 'text-green-400', icon: CheckCircle };
  };

  const urgency = getUrgencyScore();
  const UrgencyIcon = urgency.icon;

  if (compactMode) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700/50 ${className}`}>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-red-400 font-bold text-lg">
                {formatCurrency(financials.potentialAnnualLoss)}
              </div>
              <div className="text-white/60 text-xs">Riesgo Anual</div>
            </div>
            <div>
              <div className={`font-bold text-lg ${getROIColor(financials.estimatedROI)}`}>
                {financials.estimatedROI > 0 ? '+' : ''}{financials.estimatedROI}%
              </div>
              <div className="text-white/60 text-xs">ROI Estimado</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <PieChart className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Impacto Financiero</h3>
              <p className="text-white/60 text-sm">Análisis transparente con metodología auditable</p>
            </div>
          </div>
          <Badge className={`${urgency.color} bg-white/10 border-white/20`}>
            <UrgencyIcon className="h-3 w-3 mr-1" />
            {urgency.level}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 📊 MÉTRICAS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Costo Actual */}
          <div className="text-center p-4 rounded-lg bg-black/20 border border-white/10">
            <DollarSign className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <div className="text-orange-400 font-bold text-lg">
              {formatCurrency(financials.currentAnnualCost)}
            </div>
            <div className="text-white/60 text-xs">Costo Actual Anual</div>
          </div>

          {/* Riesgo Potencial */}
          <div className="text-center p-4 rounded-lg bg-red-900/20 border border-red-500/30">
            <TrendingDown className="h-6 w-6 text-red-400 mx-auto mb-2" />
            <div className="text-red-400 font-bold text-lg">
              {formatCurrency(financials.potentialAnnualLoss)}
            </div>
            <div className="text-white/60 text-xs">Pérdida Potencial Anual</div>
          </div>

          {/* ROI */}
          <div className="text-center p-4 rounded-lg bg-green-900/20 border border-green-500/30">
            <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className={`font-bold text-lg ${getROIColor(financials.estimatedROI)}`}>
              {financials.estimatedROI > 0 ? '+' : ''}{financials.estimatedROI}%
            </div>
            <div className="text-white/60 text-xs">ROI en {financials.paybackPeriod} meses</div>
          </div>
        </div>

        {/* 💡 ANÁLISIS COSTO-BENEFICIO */}
        <div className="space-y-3">
          <h4 className="text-white font-medium flex items-center">
            <Calculator className="h-4 w-4 mr-2 text-cyan-400" />
            Análisis Costo-Beneficio
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Inversión Requerida:</span>
                <span className="text-cyan-400 font-medium">
                  {formatCurrency(financials.recommendedInvestment)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Beneficio Anual:</span>
                <span className="text-green-400 font-medium">
                  {formatCurrency(financials.potentialAnnualLoss * 0.6)}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                <span className="text-white font-medium">Beneficio Neto:</span>
                <span className={`font-bold ${netBenefit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(netBenefit)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Período Retorno:</span>
                <span className="text-white font-medium">{financials.paybackPeriod} meses</span>
              </div>
              {evidenceData && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Colaboradores Afectados:</span>
                    <span className="text-purple-400 font-medium">{evidenceData.participantsAffected}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Costo por Colaborador:</span>
                    <span className="text-white font-medium">
                      {formatCurrency(financials.recommendedInvestment / evidenceData.participantsAffected)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 📈 INDICADOR VISUAL ROI */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm font-medium">Indicador ROI</span>
            <span className={`text-sm font-bold ${getROIColor(financials.estimatedROI)}`}>
              {isPositiveROI ? 'POSITIVO' : 'NEGATIVO'}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                financials.estimatedROI >= 100 ? 'bg-green-400' :
                financials.estimatedROI >= 50 ? 'bg-cyan-400' :
                financials.estimatedROI >= 0 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(Math.max(financials.estimatedROI, 0), 200)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
            <span>200%+</span>
          </div>
        </div>

        {/* 📋 TRANSPARENCIA METODOLÓGICA COMPACTA */}
        <details className="group">
          <summary className="cursor-pointer text-white/80 text-sm font-medium hover:text-white transition-colors">
            <Target className="h-4 w-4 inline mr-2" />
            Metodología y Supuestos
            <span className="group-open:rotate-180 inline-block transition-transform ml-2">▼</span>
          </summary>
          <div className="mt-3 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong className="text-white/90 block mb-1">Fuentes:</strong>
                <ul className="space-y-1 text-white/70">
                  {financials.methodologySources.map((source, index) => (
                    <li key={index} className="text-xs">• {source.substring(0, 50)}...</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong className="text-white/90 block mb-1">Supuestos Clave:</strong>
                <ul className="space-y-1 text-white/70">
                  {financials.keyAssumptions.slice(0, 3).map((assumption, index) => (
                    <li key={index} className="text-xs">• {assumption.substring(0, 50)}...</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </details>

        {/* ⚡ INDICADOR CONFIANZA */}
        {evidenceData && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-white/80 text-sm">Nivel de Confianza en Cálculos</span>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {evidenceData.participantsAffected >= 30 ? 'ALTO' : 
               evidenceData.participantsAffected >= 15 ? 'MEDIO' : 'BAJO'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};