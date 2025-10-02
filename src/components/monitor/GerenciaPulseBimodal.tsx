// ====================================================================
// GERENCIA PULSE BIMODAL - ORQUESTADOR PRINCIPAL ENTERPRISE
// src/components/monitor/gerencia/GerenciaPulseBimodal.tsx
// 🎯 RESPONSABILIDAD: Toggle bimodal + coordinación de vistas
// ====================================================================

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { GerenciaCompetitivoView } from './GerenciaCompetitivoView';
import { GerenciaFocalizadoView } from './GerenciaFocalizadoView';

// ====================================================================
// INTERFACES - TIPADO ESTRICTO
// ====================================================================

interface DepartmentChild {
  id: string;
  displayName: string;
  unitType: 'departamento';
  level: 3;
  score: string;
  participants: number;
  responded: number;
  rate: string;
}

interface GerenciaData {
  id: string;
  displayName: string;
  unitType: 'gerencia';
  level: 2;
  score: string;
  participants: number;
  responded: number;
  rate: string;
  children: DepartmentChild[];
}

interface ProcessedGerencia extends GerenciaData {
  scoreNum: number;
  rateNum: number;
  momentum: number;
  velocity: number;
  position: number;
  children: (DepartmentChild & { scoreNum: number; rateNum: number })[];
}

interface GerenciaPulseBimodalProps {
  hierarchicalData?: GerenciaData[] | null;
  hasHierarchy?: boolean;
}

// ====================================================================
// COMPONENTE ORQUESTADOR - ENTERPRISE ARCHITECTURE
// ====================================================================

export function GerenciaPulseBimodal({ 
  hierarchicalData = [],
  hasHierarchy = false
}: GerenciaPulseBimodalProps) {
  
  // 🎛️ ESTADO BIMODAL
  const [mode, setMode] = useState<'competitivo' | 'focalizado'>('competitivo');
  const [selectedGerenciaIndex, setSelectedGerenciaIndex] = useState(0);
  
  // 📊 PROCESAMIENTO DATOS CENTRALIZADO
  const processedGerencias: ProcessedGerencia[] = useMemo(() => {
    if (!hierarchicalData || hierarchicalData.length === 0) return [];
    
    return hierarchicalData.map((gerencia) => {
      const scoreNum = parseFloat(gerencia.score) || 0;
      const rateNum = parseFloat(gerencia.rate) || 0;
      
      // Mock de métricas adicionales (en producción vendrían del hook)
      const momentum = Math.floor(Math.random() * 20) - 5;
      const velocity = Math.floor(Math.random() * 30) + 10;
      
      return {
        ...gerencia,
        scoreNum,
        rateNum,
        momentum,
        velocity,
        position: 0, // Se calculará después del sort
        children: gerencia.children?.map(child => ({
          ...child,
          scoreNum: parseFloat(child.score) || 0,
          rateNum: parseFloat(child.rate) || 0
        })) || []
      };
    })
    .sort((a, b) => b.rateNum - a.rateNum) // Ordenar por participación
    .map((g, idx) => ({ ...g, position: idx + 1 })); // Asignar posición
  }, [hierarchicalData]);
  
  // 🚫 ESTADO SIN DATOS - DESIGN SYSTEM CORPORATIVO
  if (!hasHierarchy || !hierarchicalData || hierarchicalData.length === 0) {
    return (
      <div 
        className="relative p-8 text-center rounded-2xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(71, 85, 105, 0.3)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-3">
          Vista Jerárquica No Disponible
        </h3>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
          {!hasHierarchy 
            ? "Esta cuenta no tiene estructura jerárquica configurada. Contacte al administrador para habilitar el análisis por gerencias."
            : "No hay datos de gerencias disponibles para esta campaña."}
        </p>
      </div>
    );
  }
  
  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(71, 85, 105, 0.3)',
        backdropFilter: 'blur(20px)',
        padding: '32px'
      }}
    >
      
      {/* ================== HEADER ENTERPRISE ================== */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Análisis por Gerencia
          </h2>
          <p className="text-slate-400 text-sm">
            {processedGerencias.length} gerencias • Análisis comparativo y detallado
          </p>
        </div>
        
        {/* 🎛️ TOGGLE BIMODAL ENTERPRISE - TESLA STYLE */}
        <div className="relative">
          <div 
            className="relative flex items-center rounded-xl overflow-hidden"
            style={{
              width: '180px',
              height: '40px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* LÍNEA SUPERIOR LUMINOSA */}
            <div 
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)'
              }}
            />
            
            {/* INDICADOR ANIMADO */}
            <motion.div
              className="absolute top-1 left-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                width: '86px',
                background: mode === 'competitivo' 
                  ? 'linear-gradient(135deg, #22D3EE, #3B82F6)' 
                  : 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
                color: 'rgba(15, 23, 42, 0.9)',
                boxShadow: mode === 'competitivo'
                  ? '0 4px 12px rgba(34, 211, 238, 0.4)'
                  : '0 4px 12px rgba(167, 139, 250, 0.4)'
              }}
              animate={{
                x: mode === 'competitivo' ? 0 : 90
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30
              }}
            >
              {mode === 'competitivo' ? '🏆' : '🎯'}
            </motion.div>
            
            {/* BOTONES */}
            <button
              onClick={() => setMode('competitivo')}
              className="relative z-10 flex-1 h-full flex items-center justify-center text-xs font-semibold transition-colors"
              style={{
                color: mode === 'competitivo' ? 'transparent' : '#94A3B8'
              }}
            >
              Competitivo
            </button>
            <button
              onClick={() => setMode('focalizado')}
              className="relative z-10 flex-1 h-full flex items-center justify-center text-xs font-semibold transition-colors"
              style={{
                color: mode === 'focalizado' ? 'transparent' : '#94A3B8'
              }}
            >
              Focalizado
            </button>
          </div>
        </div>
      </div>
      
      {/* ================== VISTAS BIMODALES ================== */}
      <AnimatePresence mode="wait">
        {mode === 'competitivo' ? (
          <GerenciaCompetitivoView
            key="competitivo"
            gerencias={processedGerencias}
            selectedIndex={selectedGerenciaIndex}
            onSelectGerencia={setSelectedGerenciaIndex}
          />
        ) : (
          <GerenciaFocalizadoView
            key="focalizado"
            gerencias={processedGerencias}
            selectedIndex={selectedGerenciaIndex}
            onChangeGerencia={setSelectedGerenciaIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default GerenciaPulseBimodal;