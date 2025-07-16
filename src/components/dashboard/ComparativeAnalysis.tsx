// src/components/dashboard/ComparativeAnalysis.tsx
// COMPONENTE CORREGIDO - Estilos corporativos FocalizaHR + hover fixes
// VERSIÓN FINAL: Sin blancos + tooltips corporativos

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';

interface ComparativeAnalysisProps {
  analytics: {
    categoryScores?: Record<string, number>;
    responsesByDay?: Record<string, number>;
    trendData?: Array<{
      date: string;
      responses: number;
      score: number;
    }>;
    segmentationData?: Array<{
      segment: string;
      count: number;
      avgScore: number;
    }>;
    participationRate: number;
    averageScore: number;
  };
}

export default function ComparativeAnalysis({ analytics }: ComparativeAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'trends' | 'daily' | 'segments'>('categories');

  // ✅ COLORES CORPORATIVOS FOCALIZAHR
  const COLORS_CORPORATE = ['#22D3EE', '#A78BFA', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

  // ✅ TOOLTIP PERSONALIZADO CORPORATIVO
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="fhr-card-simple bg-slate-800/95 border border-cyan-500/30 backdrop-blur-sm p-3 shadow-lg">
          <p className="fhr-subtitle text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-slate-200 text-sm">
              <span className="fhr-text-accent">{entry.name}:</span> {entry.value.toFixed(1)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Preparar datos para gráfico de categorías
  const categoryData = analytics.categoryScores ? 
    Object.entries(analytics.categoryScores).map(([category, score]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      score: score,
      benchmark: 3.5, // Benchmark simulado
      difference: score - 3.5
    })) : [];

  // Preparar datos de tendencia temporal
  const trendData = analytics.trendData?.map((item, index) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    cumulative: analytics.trendData?.slice(0, index + 1).reduce((sum, curr) => sum + curr.responses, 0) || 0
  })) || [];

  // Preparar datos de respuestas por día
  const dailyResponseData = analytics.responsesByDay ?
    Object.entries(analytics.responsesByDay).map(([day, count]) => ({
      day: new Date(day).toLocaleDateString('es-ES', { weekday: 'short' }),
      responses: count
    })) : [];

  // Datos de segmentación para pie chart
  const segmentationPieData = analytics.segmentationData?.map((item, index) => ({
    name: item.segment,
    value: item.count,
    avgScore: item.avgScore,
    color: COLORS_CORPORATE[index % COLORS_CORPORATE.length]
  })) || [];

  // ✅ FUNCIÓN TREND CON COLORES CORPORATIVOS
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Activity className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* ✅ HEADER CON ESTILOS CORPORATIVOS */}
      <div className="flex items-center justify-between">
        <h2 className="fhr-title-gradient text-2xl font-bold">Análisis Comparativo</h2>
        <div className="flex items-center space-x-4">
          <div className="fhr-badge-active">
            Score General: {analytics.averageScore.toFixed(1)}/5.0
          </div>
          <div className="fhr-badge-completed">
            Participación: {analytics.participationRate.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* ✅ NAVIGATION TABS CORPORATIVOS */}
        <div className="flex space-x-2 border-b border-slate-700 pb-4">
          <button
            className={`fhr-btn-${activeTab === 'categories' ? 'primary' : 'secondary'} flex items-center gap-2`}
            onClick={() => setActiveTab('categories')}
          >
            <BarChart3 className="h-4 w-4" />
            Por Categorías
          </button>
          <button
            className={`fhr-btn-${activeTab === 'trends' ? 'primary' : 'secondary'} flex items-center gap-2`}
            onClick={() => setActiveTab('trends')}
          >
            <TrendingUp className="h-4 w-4" />
            Tendencias
          </button>
          <button
            className={`fhr-btn-${activeTab === 'daily' ? 'primary' : 'secondary'} flex items-center gap-2`}
            onClick={() => setActiveTab('daily')}
          >
            <Activity className="h-4 w-4" />
            Actividad Diaria
          </button>
          <button
            className={`fhr-btn-${activeTab === 'segments' ? 'primary' : 'secondary'} flex items-center gap-2`}
            onClick={() => setActiveTab('segments')}
          >
            <PieIcon className="h-4 w-4" />
            Segmentación
          </button>
        </div>

        {/* ✅ TAB CATEGORÍAS - ESTILOS CORPORATIVOS */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de barras con estilos corporativos */}
            <div className="fhr-card">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-6 w-6 text-cyan-400" />
                <h3 className="fhr-title-gradient text-lg font-bold">
                  Scores por Categoría vs Benchmark
                </h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      axisLine={{ stroke: '#4B5563' }}
                    />
                    <YAxis 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      axisLine={{ stroke: '#4B5563' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* ✅ COLORES CORPORATIVOS EN BARRAS */}
                    <Bar dataKey="score" fill="#22D3EE" name="Score Actual" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="benchmark" fill="#6B7280" name="Benchmark" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ✅ TABLA DETALLADA CON ESTILOS CORPORATIVOS */}
            <div className="fhr-card">
              <h3 className="fhr-title-gradient text-lg font-bold mb-6">Detalle por Categoría</h3>
              <div className="space-y-3">
                {categoryData.map((item, index) => (
                  <div 
                    key={index} 
                    className="fhr-card-simple bg-gradient-to-r from-slate-800/50 to-slate-700/30 border border-slate-600/50 hover:border-cyan-500/30 hover:from-cyan-500/5 hover:to-purple-500/5 transition-all duration-300 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="fhr-subtitle text-slate-200 font-medium">{item.category}</p>
                        <p className="text-sm text-slate-400">vs benchmark: {item.benchmark}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-100">{item.score.toFixed(1)}</p>
                        <div className="flex items-center gap-2 justify-end">
                          {getTrendIcon(item.score, item.benchmark)}
                          <span className={`text-sm font-medium ${
                            item.difference > 0 ? 'text-green-400' : 
                            item.difference < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ✅ TAB TENDENCIAS - ESTILOS CORPORATIVOS */}
        {activeTab === 'trends' && (
          <div className="fhr-card">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-purple-400" />
              <h3 className="fhr-title-gradient text-lg font-bold">Evolución Temporal</h3>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="responses" 
                    stroke="#22D3EE" 
                    strokeWidth={3}
                    name="Respuestas Diarias"
                    dot={{ fill: '#22D3EE', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="score" 
                    stroke="#A78BFA" 
                    strokeWidth={3}
                    name="Score Promedio"
                    dot={{ fill: '#A78BFA', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ✅ TAB ACTIVIDAD DIARIA - ESTILOS CORPORATIVOS */}
        {activeTab === 'daily' && (
          <div className="fhr-card">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-6 w-6 text-green-400" />
              <h3 className="fhr-title-gradient text-lg font-bold">Actividad por Día</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyResponseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="day"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <YAxis 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="responses" 
                    fill="#10B981" 
                    name="Respuestas"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ✅ TAB SEGMENTACIÓN - ESTILOS CORPORATIVOS */}
        {activeTab === 'segments' && segmentationPieData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="fhr-card">
              <div className="flex items-center gap-3 mb-6">
                <PieIcon className="h-6 w-6 text-amber-400" />
                <h3 className="fhr-title-gradient text-lg font-bold">Distribución por Segmento</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segmentationPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {segmentationPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="fhr-card">
              <h3 className="fhr-title-gradient text-lg font-bold mb-6">Scores por Segmento</h3>
              <div className="space-y-3">
                {segmentationPieData.map((item, index) => (
                  <div 
                    key={index}
                    className="fhr-card-simple bg-gradient-to-r from-slate-800/50 to-slate-700/30 border border-slate-600/50 hover:border-cyan-500/30 transition-all duration-300 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="fhr-subtitle text-slate-200">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-100">{item.avgScore.toFixed(1)}</p>
                        <p className="text-sm text-slate-400">{item.value} participantes</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}