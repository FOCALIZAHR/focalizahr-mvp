// src/app/dashboard/exit/register/page.tsx
// Hub de Registro de Salidas - Selección Individual o Masivo

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  UserMinus,
  Users,
  Upload,
  ArrowRight,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import '@/styles/focalizahr-design-system.css';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ExitRegisterHubPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen fhr-bg-main p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/exit')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Exit Intelligence
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
              <UserMinus className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Registrar Salidas
              </h1>
              <p className="text-slate-400">
                Selecciona el método de registro de colaboradores que dejan la empresa
              </p>
            </div>
          </div>
        </div>
        
        {/* CARDS DE SELECCIÓN */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* CARD: REGISTRO INDIVIDUAL */}
          <button
            onClick={() => router.push('/dashboard/exit/register/individual')}
            className="fhr-card p-6 text-left hover:border-cyan-500/50 transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 group-hover:bg-cyan-500/20 transition-colors">
                <UserMinus className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  Registro Individual
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  Registra una salida a la vez con formulario guiado
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>~2 minutos por registro</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    <span>Ideal para 1-5 salidas</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400">
                  Autocompletado
                </span>
                <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400">
                  Validación RUT
                </span>
                <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400">
                  Selector departamentos
                </span>
              </div>
            </div>
          </button>
          
          {/* CARD: REGISTRO MASIVO */}
          <button
            onClick={() => router.push('/dashboard/exit/register-batch')}
            className="fhr-card p-6 text-left hover:border-purple-500/50 transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 group-hover:bg-purple-500/20 transition-colors">
                <Upload className="h-6 w-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  Registro Masivo
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  Carga múltiples salidas desde archivo CSV
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Plantilla CSV descargable</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    <span>Hasta 100 registros por carga</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400">
                  Drag & Drop
                </span>
                <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400">
                  Preview antes de guardar
                </span>
                <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400">
                  Reporte de errores
                </span>
              </div>
            </div>
          </button>
          
        </div>
        
        {/* INFO ADICIONAL */}
        <div className="mt-8 fhr-card p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-800/50">
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-300">
                <strong className="text-white">¿Cuándo se envía la encuesta?</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                El sistema programa automáticamente la encuesta de salida para el día siguiente al registro.
                Se envían hasta 2 recordatorios si no hay respuesta.
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}