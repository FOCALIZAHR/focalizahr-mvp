// src/components/admin/DemographicsStats.tsx
// VERSIÓN FINAL COMPLETA - Con insights ejecutivos
'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, User, Calendar, TrendingUp, BarChart3, Briefcase } from 'lucide-react';
import { DemographicsStats as DemographicsStatsType } from '@/hooks/useParticipantUpload/types';

interface DemographicsStatsProps {
  stats: DemographicsStatsType;
}

export default function DemographicsStats({ stats }: DemographicsStatsProps) {
  
  // Calcular porcentajes para género
  const genderPercentages = {
    male: Math.round((stats.genderDistribution.male / stats.totalParticipants) * 100),
    female: Math.round((stats.genderDistribution.female / stats.totalParticipants) * 100),
    nonBinary: Math.round((stats.genderDistribution.nonBinary / stats.totalParticipants) * 100),
    notSpecified: Math.round((stats.genderDistribution.notSpecified / stats.totalParticipants) * 100)
  };
  
  // Colores para cada género
  const genderColors = {
    male: 'bg-blue-500',
    female: 'bg-pink-500',
    nonBinary: 'bg-purple-500',
    notSpecified: 'bg-gray-500'
  };
  
  // Labels para género
  const genderLabels = {
    male: 'Masculino',
    female: 'Femenino',
    nonBinary: 'No binario',
    notSpecified: 'No especificado'
  };
  
  // Encontrar el rango de edad más común
  const mostCommonAgeRange = Object.entries(stats.ageDistribution)
    .reduce((prev, current) => current[1] > prev[1] ? current : prev, ['', 0]);
  
  return (
    <div className="space-y-6">
      
      {/* Header minimalista */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
        <BarChart3 className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-light text-white">Análisis Demográfico</h2>
      </div>
      
      {/* Resumen de participantes - Grid limpio */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm text-gray-400">Total Participantes</h3>
          </div>
          <p className="text-3xl font-light text-white">{stats.totalParticipants}</p>
        </div>
        
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm text-gray-400">Con Datos Demográficos</h3>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-light text-white">{stats.withDemographics}</p>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              {Math.round((stats.withDemographics / stats.totalParticipants) * 100)}%
            </Badge>
          </div>
        </div>
        
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm text-gray-400">Edad Promedio</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-light text-white">
              {stats.averageAge > 0 ? stats.averageAge : '-'}
            </p>
            <span className="text-sm text-gray-500">años</span>
          </div>
        </div>
      </div>

      {/* Antigüedad Promedio - Card ancho */}
      {stats.averageSeniority !== undefined && stats.averageSeniority !== null && (
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm text-gray-400">Antigüedad Promedio</h3>
          </div>
          
          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-3xl font-light text-white">
              {stats.averageSeniority.toFixed(1)}
            </p>
            <span className="text-sm text-gray-500">años</span>
          </div>
          
          {stats.seniorityDistribution && (
            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-800">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">0-1 año</p>
                <p className="text-lg font-medium text-white">
                  {stats.seniorityDistribution['0-1'] || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">1-3 años</p>
                <p className="text-lg font-medium text-white">
                  {stats.seniorityDistribution['1-3'] || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">3-5 años</p>
                <p className="text-lg font-medium text-white">
                  {stats.seniorityDistribution['3-5'] || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">5+ años</p>
                <p className="text-lg font-medium text-white">
                  {stats.seniorityDistribution['5+'] || 0}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Distribución por género */}
      {stats.genderDistribution && Object.values(stats.genderDistribution).some(v => v > 0) && (
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm text-gray-400">Distribución por Género</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(stats.genderDistribution).map(([gender, count]) => {
              if (count === 0) return null;
              const percentage = genderPercentages[gender as keyof typeof genderPercentages];
              
              return (
                <div key={gender} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {genderLabels[gender as keyof typeof genderLabels]}
                    </span>
                    <span className="text-white">
                      {count} <span className="text-gray-500">({percentage}%)</span>
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2 bg-gray-800"
                    indicatorClassName={genderColors[gender as keyof typeof genderColors]}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Distribución por edad */}
      {stats.ageDistribution && Object.values(stats.ageDistribution).some(v => v > 0) && (
        <div className="bg-white/5 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm text-gray-400">Distribución por Edad</h3>
          </div>
          
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(stats.ageDistribution).map(([range, count]) => {
              const percentage = Math.round((count / stats.totalParticipants) * 100);
              
              return (
                <div key={range} className="text-center">
                  <div className="bg-gray-900 rounded-lg p-3 mb-2">
                    <p className="text-2xl font-light text-white">{count}</p>
                    <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
                  </div>
                  <p className="text-xs text-gray-400">{range}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Insights demográficos - VERSIÓN EJECUTIVA */}
      {stats.withDemographics > 0 && (
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl blur"></div>
          <div className="relative bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-2xl p-6">
            
            {/* Header minimalista premium */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white/80" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">
                  Hallazgos Clave
                </h3>
                <p className="text-xs text-gray-500">Inteligencia demográfica</p>
              </div>
            </div>

            {/* Grid de hallazgos - Estilo ejecutivo */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Hallazgo 1: Edad promedio */}
              {stats.averageAge > 0 && (
                <div className="bg-white/5 border border-gray-800 rounded-lg p-4 hover:bg-white/10 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Edad Promedio</span>
                    <Calendar className="h-4 w-4 text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-light text-white">{stats.averageAge}</span>
                    <span className="text-sm text-gray-500">años</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Perfil del equipo</p>
                </div>
              )}

              {/* Hallazgo 2: Antigüedad promedio */}
              {stats.averageSeniority !== undefined && stats.averageSeniority > 0 && (
                <div className="bg-white/5 border border-gray-800 rounded-lg p-4 hover:bg-white/10 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Antigüedad</span>
                    <Briefcase className="h-4 w-4 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-light text-white">{stats.averageSeniority.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">años</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Experiencia en empresa</p>
                </div>
              )}

              {/* Hallazgo 3: Rango edad predominante */}
              {mostCommonAgeRange[1] > 0 && (
                <div className="bg-white/5 border border-gray-800 rounded-lg p-4 hover:bg-white/10 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Grupo Principal</span>
                    <Users className="h-4 w-4 text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-light text-white">
                      {Math.round((mostCommonAgeRange[1] as number / stats.totalParticipants) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Entre {mostCommonAgeRange[0]} años</p>
                </div>
              )}

              {/* Hallazgo 4: Ratio de género */}
              {genderPercentages.female > 0 && genderPercentages.male > 0 && (
                <div className="bg-white/5 border border-gray-800 rounded-lg p-4 hover:bg-white/10 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Ratio Género</span>
                    <User className="h-4 w-4 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-light text-blue-400">{genderPercentages.male}%</span>
                      <span className="text-xs text-gray-500">M</span>
                    </div>
                    <span className="text-gray-600">/</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-light text-pink-400">{genderPercentages.female}%</span>
                      <span className="text-xs text-gray-500">F</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {Math.abs(genderPercentages.male - genderPercentages.female) <= 10 
                      ? 'Distribución balanceada' 
                      : genderPercentages.male > genderPercentages.female
                        ? 'Mayoría masculina'
                        : 'Mayoría femenina'}
                  </p>
                </div>
              )}

            </div>

            {/* Badge de completitud */}
            <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">
                {Math.round((stats.withDemographics / stats.totalParticipants) * 100)}% datos demográficos completos
              </span>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}