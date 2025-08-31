// src/components/admin/ParticipantUploader/DemographicsStats.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, User, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
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
    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          Análisis Demográfico
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        
        {/* Resumen de participantes */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Participantes
              </h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalParticipants}</p>
          </div>
          
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Con Datos Demográficos
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-white">{stats.withDemographics}</p>
              <Badge variant="secondary" className="text-xs">
                {Math.round((stats.withDemographics / stats.totalParticipants) * 100)}%
              </Badge>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                <User className="h-4 w-4" />
                Edad Promedio
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-white">
                {stats.averageAge > 0 ? stats.averageAge : '-'}
              </p>
              <span className="text-sm text-white/60">años</span>
            </div>
          </div>
        </div>

        {/* Card de Antigüedad Promedio - NUEVO */}
        {stats.averageSeniority !== undefined && stats.averageSeniority !== null && (
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Antigüedad Promedio
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-white">
                {stats.averageSeniority.toFixed(1)}
              </p>
              <span className="text-sm text-white/60">años</span>
            </div>
            {stats.seniorityDistribution && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">0-1 año</span>
                  <span className="text-white">{stats.seniorityDistribution['0-1'] || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">1-3 años</span>
                  <span className="text-white">{stats.seniorityDistribution['1-3'] || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">3-5 años</span>
                  <span className="text-white">{stats.seniorityDistribution['3-5'] || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">5+ años</span>
                  <span className="text-white">{stats.seniorityDistribution['5+'] || 0}</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Distribución por género */}
        {stats.genderDistribution && Object.values(stats.genderDistribution).some(v => v > 0) && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Distribución por Género
            </h3>
            
            <div className="space-y-2">
              {Object.entries(stats.genderDistribution).map(([gender, count]) => {
                if (count === 0) return null;
                const percentage = genderPercentages[gender as keyof typeof genderPercentages];
                
                return (
                  <div key={gender} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">
                        {genderLabels[gender as keyof typeof genderLabels]}
                      </span>
                      <span className="text-white font-medium">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
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
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Distribución por Edad
            </h3>
            
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(stats.ageDistribution).map(([range, count]) => {
                const percentage = Math.round((count / stats.totalParticipants) * 100);
                
                return (
                  <div key={range} className="text-center">
                    <div className="bg-white/5 rounded-lg border border-white/10 p-2 mb-1">
                      <p className="text-lg font-bold text-white">{count}</p>
                      <p className="text-xs text-white/60">{percentage}%</p>
                    </div>
                    <Badge variant="outline" className="text-xs w-full justify-center">
                      {range}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Insights demográficos */}
        {stats.withDemographics > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
            <h4 className="text-sm font-medium text-cyan-400 mb-2 flex items-center gap-2">
              💡 Insights Demográficos
            </h4>
            <ul className="text-xs text-white/80 space-y-1">
              {stats.averageAge > 0 && (
                <li>• La edad promedio del equipo es de {stats.averageAge} años</li>
              )}
              {stats.averageSeniority !== undefined && stats.averageSeniority > 0 && (
                <li>• La antigüedad promedio es de {stats.averageSeniority.toFixed(1)} años en la empresa</li>
              )}
              {mostCommonAgeRange[1] > 0 && (
                <li>• El {Math.round((mostCommonAgeRange[1] as number / stats.totalParticipants) * 100)}% del equipo tiene entre {mostCommonAgeRange[0]} años</li>
              )}
              {genderPercentages.female > 0 && genderPercentages.male > 0 && (
                <li>• Ratio de género: {genderPercentages.male}% masculino, {genderPercentages.female}% femenino</li>
              )}
              <li>• {Math.round((stats.withDemographics / stats.totalParticipants) * 100)}% de los participantes tiene datos demográficos completos</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}