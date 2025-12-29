// src/components/exit/DepartmentContextCard.tsx
// 🎯 Ciclo de Vida del Empleado - Vista rápida departamento vs empresa
// Filosofía: "Un vistazo para hacerse una idea"
// Pregunta que responde: "¿Debo preocuparme por este departamento?"
// STATUS: MOCK - Datos hardcodeados

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS (mismas props que versión anterior para compatibilidad)
// ═══════════════════════════════════════════════════════════════════════════════

interface DepartmentContextCardProps {
  departmentId: string;
  departmentName: string;
  currentEIS: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA - Reemplazar con datos reales de APIs
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_DATA = {
  ingreso: {
    value: 72,
    label: 'EXO',
    empresa: 78,
  },
  estadia: {
    value: 15,
    label: 'Rotación',
    empresa: 8,
    isPercentage: true,
    invertDelta: true, // Mayor rotación = peor
  },
  salida: {
    value: 42,
    label: 'EIS',
    empresa: 58,
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

interface DeltaInfo {
  value: number;
  isPositive: boolean;
  color: string;
}

function calculateDelta(
  value: number, 
  empresa: number, 
  invertDelta: boolean = false
): DeltaInfo {
  const delta = value - empresa;
  // Para rotación, mayor = peor, así que invertimos la lógica
  const isPositive = invertDelta ? delta < 0 : delta > 0;
  
  return {
    value: Math.abs(delta),
    isPositive,
    color: isPositive ? 'text-emerald-400' : 'text-amber-400'
  };
}

function generateInsight(data: typeof MOCK_DATA): string {
  const deltas = [
    calculateDelta(data.ingreso.value, data.ingreso.empresa),
    calculateDelta(data.estadia.value, data.estadia.empresa, data.estadia.invertDelta),
    calculateDelta(data.salida.value, data.salida.empresa)
  ];
  
  const bajosCount = deltas.filter(d => !d.isPositive).length;
  
  if (bajosCount === 0) return 'Departamento saludable. Esta alerta parece un caso aislado.';
  if (bajosCount === 1) return 'Mayormente saludable. Foco específico requerido.';
  if (bajosCount === 2) return 'Bajo en 2/3 etapas. Revisar experiencia durante estadía.';
  return 'Problema estructural en todo el ciclo.';
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function DepartmentContextCard({
  departmentId,
  departmentName,
  currentEIS
}: DepartmentContextCardProps) {
  
  // TODO: Usar departmentId y currentEIS para obtener datos reales
  // Por ahora usamos MOCK_DATA
  const data = MOCK_DATA;
  
  const deltas = useMemo(() => ({
    ingreso: calculateDelta(data.ingreso.value, data.ingreso.empresa),
    estadia: calculateDelta(data.estadia.value, data.estadia.empresa, data.estadia.invertDelta),
    salida: calculateDelta(data.salida.value, data.salida.empresa)
  }), [data]);
  
  const insight = useMemo(() => generateInsight(data), [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="
        relative overflow-hidden
        bg-slate-900/40 backdrop-blur-xl
        border border-slate-700/50 rounded-xl
        p-6
      "
    >
      {/* Línea Tesla cyan sutil */}
      <div className="fhr-top-line opacity-40" />
      
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-6 pt-1">
        <p className="text-sm font-light text-slate-400">
          Ciclo de Vida
        </p>
        <p className="text-xs font-light text-slate-500">
          {departmentName}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          JOURNEY - 3 Etapas con línea conectora
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        
        {/* Línea conectora horizontal */}
        <div className="absolute top-8 left-[15%] right-[15%] h-px bg-gradient-to-r from-cyan-500/30 via-slate-600/50 to-purple-500/30" />
        
        {/* Grid de 3 etapas */}
        <div className="grid grid-cols-3 gap-4 relative">
          
          {/* INGRESO */}
          <div className="text-center">
            <p className="text-[10px] font-light text-slate-500 uppercase tracking-wider mb-3">
              Ingreso
            </p>
            <div className="relative inline-block">
              <p className="text-3xl font-light text-slate-200">
                {data.ingreso.value}
              </p>
              <p className="text-xs font-light text-slate-500 mt-1">
                {data.ingreso.label}
              </p>
            </div>
            <p className={`text-sm font-light mt-2 ${deltas.ingreso.color}`}>
              {deltas.ingreso.isPositive ? '↑' : '↓'}{deltas.ingreso.value}
            </p>
          </div>

          {/* ESTADÍA */}
          <div className="text-center">
            <p className="text-[10px] font-light text-slate-500 uppercase tracking-wider mb-3">
              Estadía
            </p>
            <div className="relative inline-block">
              <p className="text-3xl font-light text-slate-200">
                {data.estadia.value}
                <span className="text-lg text-slate-500">%</span>
              </p>
              <p className="text-xs font-light text-slate-500 mt-1">
                {data.estadia.label}
              </p>
            </div>
            <p className={`text-sm font-light mt-2 ${deltas.estadia.color}`}>
              {deltas.estadia.isPositive ? '↓' : '↑'}{deltas.estadia.value}
            </p>
          </div>

          {/* SALIDA */}
          <div className="text-center">
            <p className="text-[10px] font-light text-slate-500 uppercase tracking-wider mb-3">
              Salida
            </p>
            <div className="relative inline-block">
              <p className="text-3xl font-light text-slate-200">
                {data.salida.value}
              </p>
              <p className="text-xs font-light text-slate-500 mt-1">
                {data.salida.label}
              </p>
            </div>
            <p className={`text-sm font-light mt-2 ${deltas.salida.color}`}>
              {deltas.salida.isPositive ? '↑' : '↓'}{deltas.salida.value}
            </p>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          REFERENCIA EMPRESA (muy sutil)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mt-4 pt-3 border-t border-slate-700/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <p className="text-xs font-light text-slate-600">
            emp: {data.ingreso.empresa}
          </p>
          <p className="text-xs font-light text-slate-600">
            emp: {data.estadia.empresa}%
          </p>
          <p className="text-xs font-light text-slate-600">
            emp: {data.salida.empresa}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          INSIGHT (susurra)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mt-4 pt-3 border-t border-slate-700/30">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-cyan-400 flex-shrink-0" />
          <p className="text-sm font-light text-slate-400">
            {insight}
          </p>
        </div>
      </div>

      {/* TODO Banner - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 rounded border border-dashed border-purple-500/30 bg-purple-500/5">
          <p className="text-[10px] font-light text-purple-400 text-center">
            🚧 MOCK: Conectar con APIs reales de Onboarding + Exit
          </p>
        </div>
      )}
    </motion.div>
  );
});