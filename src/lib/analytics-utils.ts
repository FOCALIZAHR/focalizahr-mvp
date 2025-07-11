// -----------------------------------------------------------------------------
// 6. UTILITIES: Funciones helper para cálculos estadísticos
// -----------------------------------------------------------------------------

// src/lib/analytics-utils.ts
export class AnalyticsCalculator {
  
  static calculateParticipationRate(participants: number, responses: number): number {
    return participants > 0 ? (responses / participants) * 100 : 0;
  }

  static calculateAverageScore(ratings: (number | null)[]): number {
    const validRatings = ratings.filter(r => r !== null) as number[];
    return validRatings.length > 0 
      ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
      : 0;
  }

  static calculateStandardDeviation(ratings: number[]): number {
    if (ratings.length <= 1) return 0;
    
    const mean = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - mean, 2), 0) / (ratings.length - 1);
    
    return Math.sqrt(variance);
  }

  static calculatePercentile(ratings: number[], percentile: number): number {
    const sorted = [...ratings].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (index === Math.floor(index)) {
      return sorted[index];
    }
    
    const lower = sorted[Math.floor(index)];
    const upper = sorted[Math.ceil(index)];
    return lower + (upper - lower) * (index - Math.floor(index));
  }

  static compareToBenchmark(userValue: number, benchmarkValue: number): {
    difference: number;
    percentage: number;
    status: 'above' | 'below' | 'equal';
    significance: 'significant' | 'minor';
  } {
    const difference = userValue - benchmarkValue;
    const percentage = Math.abs(difference / benchmarkValue) * 100;
    
    return {
      difference: Number(difference.toFixed(2)),
      percentage: Number(percentage.toFixed(1)),
      status: difference > 0 ? 'above' : difference < 0 ? 'below' : 'equal',
      significance: Math.abs(difference) > 0.3 ? 'significant' : 'minor'
    };
  }

  static generateInsights(campaignData: any): string[] {
    const insights: string[] = [];
    const { participationRate, avgScore, responses } = campaignData;
    
    // Insight participación
    if (participationRate > 80) {
      insights.push(`Excelente participación del ${participationRate.toFixed(1)}% indica alto engagement organizacional`);
    } else if (participationRate > 60) {
      insights.push(`Participación moderada del ${participationRate.toFixed(1)}% sugiere oportunidades de comunicación`);
    } else {
      insights.push(`Participación baja del ${participationRate.toFixed(1)}% requiere revisión de estrategia de engagement`);
    }
    
    // Insight score
    if (avgScore > 4.0) {
      insights.push(`Score promedio de ${avgScore.toFixed(1)} refleja clima organizacional muy positivo`);
    } else if (avgScore > 3.5) {
      insights.push(`Score de ${avgScore.toFixed(1)} indica satisfacción general con áreas de mejora identificables`);
    } else {
      insights.push(`Score de ${avgScore.toFixed(1)} señala necesidad de intervención en factores críticos`);
    }
    
    // Insight tamaño muestra
    if (responses > 100) {
      insights.push(`Muestra robusta de ${responses} respuestas proporciona alta confiabilidad estadística`);
    }
    
    return insights;
  }
}