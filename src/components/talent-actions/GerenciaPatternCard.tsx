'use client'

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA PATTERN CARD — Filosofia "El Silencio Comunica"
// src/components/talent-actions/GerenciaPatternCard.tsx
//
// Tesla line: SIEMPRE cyan (marca, no semaforo)
// Punto amber pulsante: solo si requiere accion
// P&L: color neutro (slate-200), la narrativa da contexto
// Sin glow, sin bordes de colores, sin rainbow
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { ChevronRight, AlertTriangle, Users, Shield, Flag } from 'lucide-react'
import { formatCurrencyCLP } from '@/lib/financialCalculations'
import type { GerenciaMapItem } from '@/lib/services/TalentActionService'

interface GerenciaPatternCardProps {
  gerencia: GerenciaMapItem
  isFlagged?: boolean
  onClick: () => void
  severity?: 'red' | 'muted' | 'normal'
}

// Narrativas por patron para tooltip (lenguaje humano)
const PATRON_NARRATIVES: Record<string, string> = {
  FRAGIL: 'Talento clave concentrado en pocas personas. Riesgo de fuga en cadena.',
  QUEMADA: 'Equipo sobrecargado con senales de burnout activo.',
  ESTANCADA: 'Sin movimiento de talento en 12+ meses. Riesgo de desmotivacion.',
  EN_TRANSICION: 'Cambios recientes en estructura. Monitorear adaptacion.',
  RIESGO_OCULTO: 'Metricas estables pero patrones preocupantes bajo la superficie.',
  SALUDABLE: 'Equipo balanceado y en movimiento. Modelo a replicar.'
}

// Patrones que requieren accion (punto amber pulsante)
const REQUIRES_ACTION = new Set(['FRAGIL', 'QUEMADA', 'ESTANCADA', 'RIESGO_OCULTO'])

export default memo(function GerenciaPatternCard({ gerencia, isFlagged, onClick, severity = 'normal' }: GerenciaPatternCardProps) {

  // InsufficientDataGuard
  if (gerencia.dataInsufficient) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 opacity-60 cursor-default">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-medium text-slate-400">{gerencia.gerenciaName}</h4>
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">Datos insuficientes</span>
            </div>
          </div>
          <span className="text-xs text-slate-600">
            {gerencia.clasificadas} de {gerencia.totalPersonas} clasificados
          </span>
        </div>
      </div>
    )
  }

  const requiresAction = gerencia.pattern ? REQUIRES_ACTION.has(gerencia.pattern) : false
  const narrative = gerencia.pattern ? PATRON_NARRATIVES[gerencia.pattern] : null

  // P&L total
  const plTotal = gerencia.financialImpact
    ? gerencia.financialImpact.fugaCerebrosCostCLP + gerencia.financialImpact.iccRiskCLP
    : 0

  return (
    <button
      onClick={onClick}
      className="relative w-full text-left bg-slate-800/50 border border-slate-700/50 rounded-[20px] p-6 overflow-hidden
        hover:border-slate-600/50 hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* TESLA LINE — siempre cyan (marca FocalizaHR) */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]
          bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        style={{ boxShadow: '0 0 12px rgba(34, 211, 238, 0.6)' }}
      />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-white truncate">
            {gerencia.gerenciaName}
          </h3>

          {/* Punto sutil — solo si requiere accion */}
          {requiresAction && (
            <span
              className="w-2 h-2 rounded-full bg-amber-400 animate-pulse cursor-help shrink-0"
              title={narrative || 'Ver diagnostico para mas detalle.'}
            />
          )}

          {/* Flag badge */}
          {isFlagged && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700/50">
              <Flag className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] text-slate-400 font-medium">En revision</span>
            </span>
          )}
        </div>

        {/* P&L — color neutro */}
        {plTotal > 0 && (
          <div className="text-right ml-3 shrink-0">
            <span className="text-xl font-semibold text-slate-200">
              {formatCurrencyCLP(plTotal)}
            </span>
            <span className="block text-xs text-slate-400">en riesgo</span>
          </div>
        )}
      </div>

      {/* CONTEXTO — narrativa, no color */}
      <p className="text-sm text-slate-400 mb-4">
        {gerencia.totalPersonas} personas
        {gerencia.pattern && ` · Patron: ${gerencia.pattern.toLowerCase().replace('_', ' ')}`}
        {gerencia.icc !== null && ` · ICC ${gerencia.icc}%`}
      </p>

      {/* Metricas compactas */}
      <div className="flex items-center gap-3 mb-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {gerencia.clasificadas} de {gerencia.totalPersonas} clasificados
        </span>

        {gerencia.sucesores.total > 0 && (
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {gerencia.sucesores.enPlanFormal} de {gerencia.sucesores.total} con plan
          </span>
        )}

        {gerencia.riskDistribution.FUGA_CEREBROS > 0 && (
          <span className="text-slate-400">
            {gerencia.riskDistribution.FUGA_CEREBROS} en fuga
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-1 text-sm text-cyan-400 group-hover:text-cyan-300 transition-colors">
        <span>Ver diagnostico</span>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  )
})
