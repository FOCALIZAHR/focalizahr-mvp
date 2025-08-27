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
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          <span className="text-cyan-400">Análisis Demográfico</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resumen general */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-cyan-400">Total</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalParticipants}</p>
          </div>
          
          <div className="bg-white/5 rounded-lg border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-cyan-400">Con Demografía</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.withDemographics}</p>
            <p className="text-xs text-white/60">
              {Math.round((stats.withDemographics / stats.totalParticipants) * 100)}%
            </p>
          </div>
          
          <div className="bg-white/5 rounded-lg border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-cyan-400">Edad Promedio</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.averageAge > 0 ? `${stats.averageAge} años` : 'N/D'}
            </p>
          </div>
          
          <div className="bg-white/5 rounded-lg border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-cyan-400">Rango Principal</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {mostCommonAgeRange[1] > 0 ? mostCommonAgeRange[0] : 'N/D'}
            </p>
          </div>
        </div>
        
        {/* Distribución por género */}
        {stats.genderDistribution && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <User className="h-4 w-4" />
              Distribución por Género
            </h3>
            
            <div className="space-y-2">
              {Object.entries(stats.genderDistribution).map(([gender, count]) => {
                if (count === 0) return null;
                const percentage = genderPercentages[gender as keyof typeof genderPercentages];
                
                return (
                  <div key={gender} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/80">
                        {genderLabels[gender as keyof typeof genderLabels]}
                      </span>
                      <span className="text-sm font-medium text-white">
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