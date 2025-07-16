// src/components/kit-comunicacion/components/LoadingState.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-400" />
          Kit Comunicación FocalizaHR
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Generando templates inteligentes...
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          {/* Spinner animado */}
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-purple-400 rounded-full animate-spin animate-reverse"></div>
          </div>
          
          {/* Texto loading con animación */}
          <div className="text-center space-y-2">
            <div className="text-gray-300 text-sm font-medium">
              Analizando datos de campaña...
            </div>
            <div className="text-gray-500 text-xs">
              Aplicando lógica inteligente para seleccionar templates óptimos
            </div>
          </div>
          
          {/* Indicadores de progreso */}
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Consultando BD templates</span>
              <span>✓</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Análisis multi-dimensional</span>
              <span className="animate-pulse">...</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Evaluando reglas condición</span>
              <span className="animate-pulse">...</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Procesando variables</span>
              <span className="animate-pulse">...</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingState;