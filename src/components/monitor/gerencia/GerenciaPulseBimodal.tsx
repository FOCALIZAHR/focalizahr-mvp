// ====================================================================
// GERENCIA PULSE BIMODAL - ORQUESTADOR ENTERPRISE
// src/components/monitor/gerencia/GerenciaPulseBimodal.tsx
// Versión final profesional para FocalizaHR
// ====================================================================

'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, TrendingUp } from 'lucide-react';
import GerenciaCompetitivoView from './GerenciaCompetitivoView';
import GerenciaFocalizadoView from './GerenciaFocalizadoView';

// ====================================================================
// INTERFACES
// ====================================================================

interface DepartmentChild {
  id: string;
  displayName: string;
  scoreNum: number;
  rateNum: number;
  responded: number;
  participants: number;
  projection?: number;  // ← AGREGAR ESTA LÍNEA
}

interface GerenciaData {
  id: string;
  displayName: string;
  scoreNum: number;
  rateNum: number;
  responded: number;
  participants: number;
  trend?: string;
  velocity?: number;
  projection?: number;
  children: DepartmentChild[];
}

interface GerenciaPulseBimodalProps {
  gerenciaData?: GerenciaData[];
  hasHierarchy?: boolean;
  isLoading?: boolean;
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export function GerenciaPulseBimodal({ 
  gerenciaData = [],
  hasHierarchy = false,
  isLoading = false
}: GerenciaPulseBimodalProps) {
  
  const [mode, setMode] = useState<'competitivo' | 'focalizado'>('competitivo');
  const [selectedGerenciaIndex, setSelectedGerenciaIndex] = useState(0);
  
  // Procesar y ordenar gerencias por participación
  const processedGerencias = useMemo(() => {
    if (!gerenciaData || gerenciaData.length === 0) return [];
    
    return gerenciaData
      .map((gerencia, index) => ({
        ...gerencia,
        scoreNum: gerencia.scoreNum || 0,
        rateNum: gerencia.rateNum || 0,
        trend: gerencia.trend || 'estable',
        velocity: gerencia.velocity || 0,
        projection: gerencia.projection || gerencia.rateNum || 0,
        position: 0, // Se asignará después del sort
        children: gerencia.children?.map(child => ({
          ...child,
          scoreNum: child.scoreNum || 0,
          rateNum: child.rateNum || 0
        })) || []
      }))
      .sort((a, b) => b.rateNum - a.rateNum)
      .map((gerencia, idx) => ({
        ...gerencia,
        position: idx + 1
      }));
  }, [gerenciaData]);
  
  // Estado sin datos o sin jerarquía
  if (!hasHierarchy || processedGerencias.length === 0) {
    return (
      <div 
        className="p-8 rounded-2xl"
        style={{
          background: 'rgba(30, 41, 59, 0.9)',
          border: '1px solid rgba(71, 85, 105, 0.3)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div className="text-center text-slate-400">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
              <span>Cargando estructura jerárquica...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <Building2 className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-lg font-medium text-white">
                Vista Jerárquica No Disponible
              </p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Esta funcionalidad requiere una estructura organizacional configurada.
                Contacte al administrador para habilitar el análisis por gerencias.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      

      
      {/* CONTENEDOR PRINCIPAL */}
      <div 
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}
      >
        
        {/* HEADER CON TÍTULO Y TOGGLE */}
        <div 
          className="flex items-center justify-between px-6 py-5"
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(15, 23, 42, 0.4)'
          }}
        >
          <div>
            <h3 className="text-xl font-semibold text-white">
              Participación por Gerencia
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              {processedGerencias.length} gerencias • Análisis comparativo en tiempo real
            </p>
          </div>
          
          {/* TOGGLE BIMODAL MEJORADO */}
          <div 
            className="flex items-center p-0.5 rounded-lg"
            style={{
              background: 'rgba(71, 85, 105, 0.2)',
              border: '1px solid rgba(71, 85, 105, 0.3)'
            }}
          >
            <button
              onClick={() => setMode('competitivo')}
              className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                ${mode === 'competitivo' 
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-white'
                }
              `}
            >
              Competitivo
            </button>
            <button
              onClick={() => setMode('focalizado')}
              className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                ${mode === 'focalizado'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white'
                }
              `}
            >
              Focalizado
            </button>
          </div>
        </div>
        
        {/* CONTENIDO - VISTAS */}
        <div className="p-6">
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
      </div>
    </div>
  );
}

export default GerenciaPulseBimodal;