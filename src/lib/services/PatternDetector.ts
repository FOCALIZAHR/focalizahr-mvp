// src/lib/services/PatternDetector.ts
/**
 * PatternDetector Service
 * Motor de detección de patrones organizacionales profundos
 * Analiza demografía + comportamiento + tiempo para revelar insights únicos
 */

export interface Participant {
  id: string;
  email: string;
  department: string;
  hasResponded: boolean;
  responseDate: string | null;
  createdAt: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  dateOfBirth: string | null;
  hireDate: string | null;
  seniorityLevel?: string | null;
  position?: string;
  location?: string;
}

export interface DemographicPattern {
  type: 'HOMOGENEITY' | 'ECHO_CHAMBER' | 'DIVERSITY_GAP';
  dimension: 'GENDER' | 'AGE' | 'SENIORITY' | 'COMBINED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  insight: string;
  metrics: {
    diversityIndex: number;
    dominantGroup: string;
    dominantPercentage: number;
  };
}

export interface ParticipationAnomaly {
  segment: string;
  dimension: string;
  participationRate: number;
  departmentRate: number;
  deviation: number;
  insight: string;
  affectedCount: number;
}

export interface LeadershipFingerprint {
  department: string;
  overallImpact: 'ACCELERATOR' | 'NEUTRAL' | 'BLOCKER';
  impactScore: number; // -1 a +1
  consistencyScore: number; // 0 a 1
  evidence: string[];
  recommendation: string;
}

export class PatternDetector {
  
  /**
   * Detecta patrones demográficos problemáticos en un departamento
   * Analiza género, edad y antigüedad para identificar silos y cámaras de eco
   */
  static detectDemographicPatterns(participants: Participant[]): DemographicPattern | null {
    if (!participants.length) return null;
    
    // Análisis por GÉNERO
    const genderGroups = this.groupByGender(participants);
    const genderDiversity = this.calculateDiversityIndex(genderGroups);
    
    // Análisis por EDAD/GENERACIÓN
    const ageGroups = this.groupByGeneration(participants);
    const ageDiversity = this.calculateDiversityIndex(ageGroups);
    
    // Análisis por ANTIGÜEDAD
    const seniorityGroups = this.groupBySeniority(participants);
    const seniorityDiversity = this.calculateDiversityIndex(seniorityGroups);
    
    // Encontrar la dimensión más problemática
    const patterns = [
      { dimension: 'GENDER' as const, diversity: genderDiversity, groups: genderGroups },
      { dimension: 'AGE' as const, diversity: ageDiversity, groups: ageGroups },
      { dimension: 'SENIORITY' as const, diversity: seniorityDiversity, groups: seniorityGroups }
    ];
    
    const mostProblematic = patterns.reduce((prev, curr) => 
      curr.diversity < prev.diversity ? curr : prev
    );
    
    // Si algún grupo supera 70%, es problemático
    const dominantEntry = Object.entries(mostProblematic.groups)
      .find(([_, count]) => (count / participants.length) > 0.7);
    
    if (dominantEntry) {
      const [dominantGroup, count] = dominantEntry;
      const percentage = (count / participants.length) * 100;
      
      return {
        type: percentage > 85 ? 'ECHO_CHAMBER' : percentage > 75 ? 'HOMOGENEITY' : 'DIVERSITY_GAP',
        dimension: mostProblematic.dimension,
        severity: this.calculateSeverity(percentage),
        insight: this.generatePatternInsight(mostProblematic.dimension, dominantGroup, percentage),
        metrics: {
          diversityIndex: mostProblematic.diversity,
          dominantGroup,
          dominantPercentage: percentage
        }
      };
    }
    
    return null;
  }
  
  /**
   * Encuentra anomalías de participación por segmento demográfico
   * Detecta grupos que participan significativamente menos que el promedio
   */
  static findParticipationAnomalies(participants: Participant[]): ParticipationAnomaly | null {
    if (!participants.length) return null;
    
    const departmentRate = participants.filter(p => p.hasResponded).length / participants.length;
    const anomalies: ParticipationAnomaly[] = [];
    
    // Por GÉNERO
    const genderGroups = this.groupByGender(participants);
    for (const [gender, count] of Object.entries(genderGroups)) {
      if (count > 0) {
        const genderParticipants = participants.filter(p => this.getGender(p) === gender);
        const genderRate = genderParticipants.filter(p => p.hasResponded).length / genderParticipants.length;
        const deviation = departmentRate - genderRate;
        
        if (deviation > 0.2) { // 20 puntos porcentuales
          anomalies.push({
            segment: gender,
            dimension: 'GÉNERO',
            participationRate: genderRate,
            departmentRate,
            deviation,
            insight: `El grupo ${this.translateGender(gender)} participa ${(deviation * 100).toFixed(0)}% menos que el promedio del departamento.`,
            affectedCount: count
          });
        }
      }
    }
    
    // Por GENERACIÓN
    const ageGroups = this.groupByGeneration(participants);
    for (const [generation, count] of Object.entries(ageGroups)) {
      if (count > 0) {
        const genParticipants = participants.filter(p => 
          this.getGeneration(p) === generation
        );
        const genRate = genParticipants.filter(p => p.hasResponded).length / genParticipants.length;
        const deviation = departmentRate - genRate;
        
        if (deviation > 0.2) {
          anomalies.push({
            segment: generation,
            dimension: 'GENERACIÓN',
            participationRate: genRate,
            departmentRate,
            deviation,
            insight: `La generación ${this.translateGeneration(generation)} participa ${(deviation * 100).toFixed(0)}% menos.`,
            affectedCount: count
          });
        }
      }
    }
    
    // Por ANTIGÜEDAD
    const seniorityGroups = this.groupBySeniority(participants);
    for (const [seniority, count] of Object.entries(seniorityGroups)) {
      if (count > 0) {
        const senParticipants = participants.filter(p => 
          this.getSeniorityGroup(p) === seniority
        );
        const senRate = senParticipants.filter(p => p.hasResponded).length / senParticipants.length;
        const deviation = departmentRate - senRate;
        
        if (deviation > 0.2) {
          anomalies.push({
            segment: seniority,
            dimension: 'ANTIGÜEDAD',
            participationRate: senRate,
            departmentRate,
            deviation,
            insight: `El grupo con ${seniority} de antigüedad participa ${(deviation * 100).toFixed(0)}% menos.`,
            affectedCount: count
          });
        }
      }
    }
    
    // Retornar la anomalía más severa
    return anomalies.length > 0 
      ? anomalies.reduce((prev, curr) => curr.deviation > prev.deviation ? curr : prev)
      : null;
  }
  
  /**
   * Genera un insight de liderazgo combinando patrones y anomalías
   * Diagnóstica si el problema es de liderazgo o demográfico
   */
  static generateLeadershipInsight(
    pattern: DemographicPattern | null,
    anomaly: ParticipationAnomaly | null,
    participants: Participant[]
  ): string {
    const department = participants[0]?.department || 'el departamento';
    
    // Caso 1: Cámara de eco con baja participación del grupo dominante
    if (pattern && anomaly && pattern.metrics.dominantGroup === anomaly.segment) {
      return `Alerta crítica en ${department}: Detectamos una cámara de eco ${this.describeDimension(pattern.dimension)} ` +
             `donde el ${pattern.metrics.dominantPercentage.toFixed(0)}% del equipo comparte el mismo perfil (${this.translateGroup(pattern.metrics.dominantGroup)}). ` +
             `Este grupo dominante participa ${(anomaly.deviation * 100).toFixed(0)}% menos que el promedio. ` +
             `Diagnóstico: El liderazgo no está conectando con el perfil predominante del equipo. ` +
             `Acción recomendada: Revisar prácticas de comunicación, autonomía y reconocimiento específicas para este grupo.`;
    }
    
    // Caso 2: Solo anomalía (grupo minoritario excluido)
    if (anomaly && !pattern) {
      return `Problema de inclusión detectado en ${department}: ` +
             `El grupo ${anomaly.segment} (${anomaly.dimension.toLowerCase()}) muestra una participación ` +
             `${(anomaly.deviation * 100).toFixed(0)}% menor al promedio del departamento. ` +
             `Diagnóstico: Posibles barreras culturales o de comunicación que excluyen a este segmento. ` +
             `Acción recomendada: Implementar prácticas inclusivas y canales de comunicación adaptados.`;
    }
    
    // Caso 3: Solo patrón (homogeneidad sin anomalías)
    if (pattern && !anomaly) {
      return `Riesgo de pensamiento grupal en ${department}: ` +
             `El ${pattern.metrics.dominantPercentage.toFixed(0)}% del equipo comparte el mismo perfil ${this.describeDimension(pattern.dimension)} ` +
             `(${this.translateGroup(pattern.metrics.dominantGroup)}). ` +
             `Aunque la participación es normal, la falta de diversidad limita las perspectivas. ` +
             `Acción recomendada: Considerar diversificación en futuras contrataciones y fomentar voces diversas.`;
    }
    
    // Caso 4: Sin patrones ni anomalías
    return `${department} muestra un balance saludable: ` +
           `Diversidad demográfica equilibrada y participación uniforme entre todos los grupos. ` +
           `Recomendación: Documentar las prácticas actuales como modelo para otros departamentos.`;
  }
  
  /**
   * Detecta la huella dactilar del liderazgo analizando consistencia de efectos
   * Si todas las demografías responden igual (positiva o negativamente), es efecto liderazgo
   */
  static detectLeadershipFingerprint(
    departmentParticipants: Participant[],
    companyAverage: { participationRate: number; avgResponseDays: number }
  ): LeadershipFingerprint {
    if (!departmentParticipants.length) {
      return {
        department: 'Unknown',
        overallImpact: 'NEUTRAL',
        impactScore: 0,
        consistencyScore: 0,
        evidence: [],
        recommendation: 'Sin datos suficientes para análisis.'
      };
    }
    
    const evidence: string[] = [];
    const deviations: number[] = [];
    
    // Analizar por cada dimensión demográfica
    const dimensions = [
      { name: 'género', groups: this.groupByGender(departmentParticipants) },
      { name: 'generación', groups: this.groupByGeneration(departmentParticipants) },
      { name: 'antigüedad', groups: this.groupBySeniority(departmentParticipants) }
    ];
    
    dimensions.forEach(({ name, groups }) => {
      Object.entries(groups).forEach(([group, count]) => {
        if (count >= 3) { // Mínimo 3 personas para ser significativo
          const groupParticipants = departmentParticipants.filter(p => {
            if (name === 'género') return this.getGender(p) === group;
            if (name === 'generación') return this.getGeneration(p) === group;
            return this.getSeniorityGroup(p) === group;
          });
          
          const groupRate = groupParticipants.filter(p => p.hasResponded).length / groupParticipants.length;
          const deviation = groupRate - companyAverage.participationRate;
          deviations.push(deviation);
          
          evidence.push(`${this.translateGroup(group)}: ${deviation > 0 ? '+' : ''}${(deviation * 100).toFixed(0)}% vs promedio empresa`);
        }
      });
    });
    
    // Calcular consistencia (qué tan uniformes son las desviaciones)
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const consistency = deviations.length > 0 
      ? 1 - (this.standardDeviation(deviations) / (Math.abs(avgDeviation) || 1))
      : 0;
    
    // Si alta consistencia = efecto liderazgo
    let impact: 'ACCELERATOR' | 'NEUTRAL' | 'BLOCKER' = 'NEUTRAL';
    if (consistency > 0.7) {
      impact = avgDeviation > 0.1 ? 'ACCELERATOR' : avgDeviation < -0.1 ? 'BLOCKER' : 'NEUTRAL';
    }
    
    return {
      department: departmentParticipants[0]?.department || 'Unknown',
      overallImpact: impact,
      impactScore: avgDeviation,
      consistencyScore: consistency,
      evidence,
      recommendation: this.getLeadershipRecommendation(impact, avgDeviation)
    };
  }
  
  // ==================== FUNCIONES AUXILIARES ====================
  
  private static groupByGender(participants: Participant[]): Record<string, number> {
    const groups: Record<string, number> = {};
    participants.forEach(p => {
      const gender = this.getGender(p);
      groups[gender] = (groups[gender] || 0) + 1;
    });
    return groups;
  }
  
  private static groupByGeneration(participants: Participant[]): Record<string, number> {
    const groups: Record<string, number> = {};
    participants.forEach(p => {
      const gen = this.getGeneration(p);
      groups[gen] = (groups[gen] || 0) + 1;
    });
    return groups;
  }
  
  private static groupBySeniority(participants: Participant[]): Record<string, number> {
    const groups: Record<string, number> = {};
    participants.forEach(p => {
      const sen = this.getSeniorityGroup(p);
      groups[sen] = (groups[sen] || 0) + 1;
    });
    return groups;
  }
  
  private static getGender(p: Participant): string {
    return p.gender || 'DESCONOCIDO';
  }
  
  private static getGeneration(p: Participant): string {
    if (!p.dateOfBirth) return 'DESCONOCIDO';
    const birthYear = new Date(p.dateOfBirth).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    if (age < 28) return 'GenZ';
    if (age < 43) return 'Millennial';
    if (age < 59) return 'GenX';
    return 'Boomer';
  }
  
  private static getSeniorityGroup(p: Participant): string {
    if (p.seniorityLevel) return p.seniorityLevel;
    if (!p.hireDate) return 'DESCONOCIDO';
    
    const hireYear = new Date(p.hireDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const years = currentYear - hireYear;
    
    if (years < 1) return 'Menos de 1 año';
    if (years < 3) return '1-3 años';
    if (years < 5) return '3-5 años';
    if (years < 10) return '5-10 años';
    return 'Más de 10 años';
  }
  
  private static calculateDiversityIndex(groups: Record<string, number>): number {
    const total = Object.values(groups).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    
    // Simpson's Diversity Index
    let sum = 0;
    for (const count of Object.values(groups)) {
      const proportion = count / total;
      sum += proportion * proportion;
    }
    return 1 - sum;
  }
  
  private static calculateSeverity(percentage: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (percentage >= 90) return 'CRITICAL';
    if (percentage >= 80) return 'HIGH';
    if (percentage >= 70) return 'MEDIUM';
    return 'LOW';
  }
  
  private static standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }
  
  private static getLeadershipRecommendation(impact: string, score: number): string {
    switch(impact) {
      case 'ACCELERATOR':
        return `Liderazgo ejemplar detectado (+${(score * 100).toFixed(0)}% vs promedio empresa). ` +
               `ACCIÓN: Documentar y replicar las prácticas de este departamento en otras áreas. ` +
               `Este líder logra engagement superior consistente en todos los grupos demográficos.`;
               
      case 'BLOCKER':
        return `Fricción de liderazgo detectada (${(score * 100).toFixed(0)}% vs promedio empresa). ` +
               `ACCIÓN: Revisar urgentemente prácticas de comunicación, autonomía y reconocimiento. ` +
               `El patrón consistente sugiere problemas sistémicos de gestión, no demográficos.`;
               
      default:
        return `Liderazgo neutral detectado. Sin efectos significativos positivos o negativos. ` +
               `OPORTUNIDAD: Comparar con departamentos de alto rendimiento para identificar mejoras. ` +
               `Considerar mentoría con líderes aceleradores de la organización.`;
    }
  }
  
  private static generatePatternInsight(dimension: string, dominantGroup: string, percentage: number): string {
    const translatedGroup = this.translateGroup(dominantGroup);
    const dimensionDesc = this.describeDimension(dimension);
    
    if (percentage >= 85) {
      return `Cámara de eco crítica detectada: ${percentage.toFixed(0)}% del equipo comparte el mismo perfil ${dimensionDesc} (${translatedGroup}). ` +
             `Riesgo muy alto de pensamiento grupal y pérdida de innovación.`;
    } else if (percentage >= 75) {
      return `Homogeneidad significativa: ${percentage.toFixed(0)}% del equipo es ${translatedGroup}. ` +
             `La falta de diversidad ${dimensionDesc} limita perspectivas y creatividad.`;
    } else {
      return `Concentración moderada de ${translatedGroup} (${percentage.toFixed(0)}%). ` +
             `Considerar aumentar diversidad ${dimensionDesc} para mejorar dinámicas.`;
    }
  }
  
  private static translateGender(gender: string): string {
    const translations: Record<string, string> = {
      'MALE': 'masculino',
      'FEMALE': 'femenino',
      'OTHER': 'otro',
      'DESCONOCIDO': 'género no especificado'
    };
    return translations[gender] || gender.toLowerCase();
  }
  
  private static translateGeneration(generation: string): string {
    const translations: Record<string, string> = {
      'GenZ': 'Generación Z (nacidos después de 1996)',
      'Millennial': 'Millennials (nacidos 1981-1996)',
      'GenX': 'Generación X (nacidos 1965-1980)',
      'Boomer': 'Baby Boomers (nacidos antes de 1965)',
      'DESCONOCIDO': 'edad no especificada'
    };
    return translations[generation] || generation;
  }
  
  private static translateGroup(group: string): string {
    // Primero intentar traducción de género
    if (['MALE', 'FEMALE', 'OTHER'].includes(group)) {
      return this.translateGender(group);
    }
    
    // Luego generación
    if (['GenZ', 'Millennial', 'GenX', 'Boomer'].includes(group)) {
      return this.translateGeneration(group);
    }
    
    // Si es antigüedad, ya está en español
    return group.toLowerCase();
  }
  
  private static describeDimension(dimension: string): string {
    const descriptions: Record<string, string> = {
      'GENDER': 'de género',
      'AGE': 'generacional',
      'SENIORITY': 'de antigüedad',
      'COMBINED': 'demográfico combinado'
    };
    return descriptions[dimension] || dimension.toLowerCase();
  }
}

// Exportar también las funciones individuales para uso directo
export const {
  detectDemographicPatterns,
  findParticipationAnomalies,
  generateLeadershipInsight,
  detectLeadershipFingerprint
} = PatternDetector;