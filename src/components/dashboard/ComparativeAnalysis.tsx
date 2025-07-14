// src/components/dashboard/ComparativeAnalysis.tsx
// PASO 3.3: Análisis Comparativo - Gráficos y Tablas usando datos de analytics

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

  // Colores para gráficos
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

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
    color: COLORS[index % COLORS.length]
  })) || [];

  // Helper para determinar tendencia
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Análisis Comparativo</h2>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Score General: {analytics.averageScore.toFixed(1)}/5.0
          </Badge>
          <Badge variant="outline" className="text-sm">
            Participación: {analytics.participationRate.toFixed(1)}%
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* Navigation buttons */}
        <div className="flex space-x-2 border-b pb-4">
          <Button
            variant={activeTab === 'categories' ? 'default' : 'outline'}
            onClick={() => setActiveTab('categories')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Por Categorías
          </Button>
          <Button
            variant={activeTab === 'trends' ? 'default' : 'outline'}
            onClick={() => setActiveTab('trends')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Tendencias
          </Button>
          <Button
            variant={activeTab === 'daily' ? 'default' : 'outline'}
            onClick={() => setActiveTab('daily')}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Actividad Diaria
          </Button>
          <Button
            variant={activeTab === 'segments' ? 'default' : 'outline'}
            onClick={() => setActiveTab('segments')}
            className="flex items-center gap-2"
          >
            <PieIcon className="h-4 w-4" />
            Segmentación
          </Button>
        </div>

        {/* Content sections */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de barras comparativo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Scores por Categoría vs Benchmark
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value, name) => [value, name === 'score' ? 'Score Actual' : 'Benchmark']}
                    />
                    <Bar dataKey="score" fill="#3B82F6" name="score" />
                    <Bar dataKey="benchmark" fill="#E5E7EB" name="benchmark" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tabla detallada */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.category}</p>
                        <p className="text-sm text-gray-500">vs benchmark: {item.benchmark}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{item.score.toFixed(1)}</p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(item.score, item.benchmark)}
                          <span className={`text-sm ${item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'trends' && (
          <Card>
            <CardHeader>
              <CardTitle>Evolución Temporal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="responses" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Respuestas Diarias"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Score Promedio"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {activeTab === 'daily' && (
          <Card>
            <CardHeader>
              <CardTitle>Actividad por Día de la Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyResponseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="responses" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {activeTab === 'segments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Segmento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scores por Segmento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segmentationPieData.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <div>
                          <p className="font-medium">{segment.name}</p>
                          <p className="text-sm text-gray-500">{segment.value} participantes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{segment.avgScore.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">score promedio</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}