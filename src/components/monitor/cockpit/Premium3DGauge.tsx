import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

// ============================================================================
// ENTERPRISE INTERFACES - FOCALIZAHR DATA STRUCTURE
// ============================================================================

interface CockpitIntelligence {
  vectorMomentum: string;
  projection: {
    finalProjection: number;    // 87.2
    confidence: number;         // 92
    methodology: string;        // "Regresión lineal + momentum"
    confidenceText: string;     // "Alta confianza"
  };
  action: {
    primary: string;
    reasoning: string;
    urgency: 'baja' | 'media' | 'alta' | 'crítica';
    nextSteps: string[];
    urgencyColor: string;
  };
  pattern: {
    dominantPattern: string;
    description: string;
    insights: string[];
    patternColor: string;
  };
}

interface PremiumD3GaugeProps {
  cockpitIntelligence: CockpitIntelligence;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'focalizahr' | 'dark' | 'executive';
  showAnimation?: boolean;
  showConfidenceRing?: boolean;
}

// ============================================================================
// PREMIUM D3 GAUGE COMPONENT - ENTERPRISE LEVEL
// ============================================================================

export default function PremiumD3Gauge({
  cockpitIntelligence,
  size = 'lg',
  theme = 'focalizahr',
  showAnimation = true,
  showConfidenceRing = true
}: PremiumD3GaugeProps) {
  
  const svgRef = useRef<SVGSVGElement>(null);
  const { projection, action } = cockpitIntelligence;
  
  // Size configurations
  const sizeConfig = {
    sm: { width: 200, height: 120, radius: 60 },
    md: { width: 280, height: 170, radius: 85 },
    lg: { width: 360, height: 220, radius: 110 },
    xl: { width: 440, height: 270, radius: 135 }
  };
  
  const config = sizeConfig[size];
  
  // Theme colors
  const themeColors = {
    focalizahr: {
      primary: '#22D3EE',
      secondary: '#A78BFA',
      background: '#1e293b',
      text: '#ffffff',
      accent: '#3B82F6'
    },
    dark: {
      primary: '#60A5FA',
      secondary: '#C084FC',
      background: '#0f172a',
      text: '#e2e8f0',
      accent: '#34D399'
    },
    executive: {
      primary: '#059669',
      secondary: '#7C3AED',
      background: '#111827',
      text: '#f9fafb',
      accent: '#F59E0B'
    }
  };
  
  const colors = themeColors[theme];
  
  // Calculate angles and values
  const value = projection.finalProjection;
  const confidence = projection.confidence;
  const urgency = action.urgency;
  
  const startAngle = -Math.PI * 0.75; // -135 degrees
  const endAngle = Math.PI * 0.75;    // 135 degrees
  const valueAngle = startAngle + (value / 100) * (endAngle - startAngle);
  
  // Urgency color mapping
  const urgencyColors = {
    'baja': colors.primary,
    'media': '#F59E0B',
    'alta': '#F97316',
    'crítica': '#EF4444'
  };
  
  const needleColor = urgencyColors[urgency] || colors.primary;
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render
    
    const centerX = config.width / 2;
    const centerY = config.height - 30;
    const outerRadius = config.radius;
    const innerRadius = outerRadius - 15;
    
    // Create main group
    const g = svg.append('g');
    
    // Define gradients
    const defs = svg.append('defs');
    
    // Primary gradient
    const primaryGradient = defs.append('linearGradient')
      .attr('id', 'primaryGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    
    primaryGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colors.primary)
      .attr('stop-opacity', 1);
    
    primaryGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colors.secondary)
      .attr('stop-opacity', 1);
    
    // Metallic gradient
    const metallicGradient = defs.append('linearGradient')
      .attr('id', 'metallicGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    
    metallicGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#f8fafc')
      .attr('stop-opacity', 0.9);
    
    metallicGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', colors.primary)
      .attr('stop-opacity', 0.8);
    
    metallicGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#334155')
      .attr('stop-opacity', 0.9);
    
    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    // Background arc
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startAngle)
      .endAngle(endAngle);
    
    g.append('path')
      .attr('d', arc as any)
      .attr('transform', `translate(${centerX}, ${centerY})`)
      .attr('fill', colors.background)
      .attr('stroke', colors.primary)
      .attr('stroke-width', 2)
      .attr('opacity', 0.3);
    
    // Value arc
    const valueArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startAngle)
      .endAngle(valueAngle);
    
    const valueArcPath = g.append('path')
      .attr('transform', `translate(${centerX}, ${centerY})`)
      .attr('fill', 'url(#primaryGradient)')
      .attr('filter', 'url(#glow)')
      .attr('stroke', colors.primary)
      .attr('stroke-width', 1);
    
    // Animate value arc
    if (showAnimation) {
      valueArcPath
        .transition()
        .duration(2000)
        .ease(d3.easeElastic.period(0.3))
        .attrTween('d', function() {
          const interpolate = d3.interpolate(startAngle, valueAngle);
          return function(t) {
            const currentAngle = interpolate(t);
            const currentArc = d3.arc()
              .innerRadius(innerRadius)
              .outerRadius(outerRadius)
              .startAngle(startAngle)
              .endAngle(currentAngle);
            return currentArc(null as any) || '';
          };
        });
    } else {
      valueArcPath.attr('d', valueArc as any);
    }
    
    // Confidence ring
    if (showConfidenceRing) {
      const confidenceRadius = outerRadius + 8;
      const confidenceArc = d3.arc()
        .innerRadius(confidenceRadius)
        .outerRadius(confidenceRadius + 4)
        .startAngle(startAngle)
        .endAngle(startAngle + (confidence / 100) * (endAngle - startAngle));
      
      g.append('path')
        .attr('d', confidenceArc as any)
        .attr('transform', `translate(${centerX}, ${centerY})`)
        .attr('fill', colors.accent)
        .attr('opacity', 0.7);
    }
    
    // Scale marks
    const scaleData = d3.range(0, 101, 10);
    scaleData.forEach(d => {
      const angle = startAngle + (d / 100) * (endAngle - startAngle);
      const x1 = centerX + (outerRadius + 5) * Math.cos(angle);
      const y1 = centerY + (outerRadius + 5) * Math.sin(angle);
      const x2 = centerX + (outerRadius + 15) * Math.cos(angle);
      const y2 = centerY + (outerRadius + 15) * Math.sin(angle);
      
      g.append('line')
        .attr('x1', x1).attr('y1', y1)
        .attr('x2', x2).attr('y2', y2)
        .attr('stroke', colors.text)
        .attr('stroke-width', d % 50 === 0 ? 2 : 1)
        .attr('opacity', 0.7);
      
      // Scale labels
      if (d % 50 === 0) {
        const labelX = centerX + (outerRadius + 25) * Math.cos(angle);
        const labelY = centerY + (outerRadius + 25) * Math.sin(angle);
        
        g.append('text')
          .attr('x', labelX)
          .attr('y', labelY)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', colors.text)
          .attr('font-size', '12px')
          .attr('font-weight', '500')
          .attr('opacity', 0.8)
          .text(`${d}%`);
      }
    });
    
    // Needle
    const needleLength = outerRadius - 10;
    const needleBase = 8;
    
    const needleData: [number, number][] = [
      [0, -needleBase / 2],
      [needleLength - 15, -3],
      [needleLength, 0],
      [needleLength - 15, 3],
      [0, needleBase / 2],
      [0, -needleBase / 2]
    ];
    
    const needlePath = d3.line().curve(d3.curveCardinal);
    
    const needle = g.append('path')
      .attr('d', needlePath(needleData) || '')
      .attr('transform', `translate(${centerX}, ${centerY})`)
      .attr('fill', 'url(#metallicGradient)')
      .attr('stroke', needleColor)
      .attr('stroke-width', 1)
      .attr('filter', 'url(#glow)');
    
    // Animate needle
    if (showAnimation) {
      needle
        .transition()
        .delay(500)
        .duration(1500)
        .ease(d3.easeElastic.period(0.4))
        .attr('transform', `translate(${centerX}, ${centerY}) rotate(${(valueAngle * 180) / Math.PI})`);
    } else {
      needle.attr('transform', `translate(${centerX}, ${centerY}) rotate(${(valueAngle * 180) / Math.PI})`);
    }
    
    // Center hub
    g.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 12)
      .attr('fill', colors.background)
      .attr('stroke', needleColor)
      .attr('stroke-width', 3);
    
    g.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 6)
      .attr('fill', needleColor)
      .attr('opacity', 0.8);
    
    // Value display
    g.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.text)
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Space Grotesk, monospace')
      .text(`${value.toFixed(1)}%`);
    
    // Confidence text
    g.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 60)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.accent)
      .attr('font-size', '14px')
      .attr('font-weight', '500')
      .text(`${confidence}% confianza`);
    
    // Methodology text
    g.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 80)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.text)
      .attr('font-size', '11px')
      .attr('opacity', 0.7)
      .text(projection.methodology);
    
  }, [value, confidence, urgency, config, colors, showAnimation, showConfidenceRing, projection.methodology]);
  
  // Loading skeleton
  const LoadingSkeleton = () => (
    <div 
      style={{ width: config.width, height: config.height }}
      className="flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-600/30"
    >
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-3 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
        <div className="text-cyan-400 text-sm font-medium">Cargando gauge...</div>
      </div>
    </div>
  );
  
  if (!cockpitIntelligence) {
    return <LoadingSkeleton />;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
    >
      {/* Main gauge container */}
      <div 
        className="rounded-xl overflow-hidden border border-slate-600/30 bg-gradient-to-br from-slate-900 to-slate-800 p-4"
        style={{ width: config.width, height: config.height }}
      >
        <svg
          ref={svgRef}
          width={config.width}
          height={config.height}
          className="overflow-visible"
        />
      </div>
      
      {/* Info overlay */}
      <motion.div 
        className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        <div className="text-xs text-white/70">
          {projection.confidenceText}
        </div>
        <div className={`text-xs font-medium ${
          urgency === 'crítica' ? 'text-red-400' :
          urgency === 'alta' ? 'text-orange-400' :
          urgency === 'media' ? 'text-yellow-400' :
          'text-green-400'
        }`}>
          Urgencia: {urgency}
        </div>
      </motion.div>
      
      {/* Performance indicator */}
      <div className="absolute bottom-1 left-2 text-xs text-white/40">
        D3.js Premium • SVG Optimized
      </div>
      
      {/* Urgency indicator */}
      <div className="absolute top-2 left-2">
        <div 
          className={`w-3 h-3 rounded-full ${
            urgency === 'crítica' ? 'bg-red-400 animate-pulse' :
            urgency === 'alta' ? 'bg-orange-400' :
            urgency === 'media' ? 'bg-yellow-400' :
            'bg-green-400'
          }`}
          style={{ 
            boxShadow: `0 0 10px ${needleColor}` 
          }}
        />
      </div>
    </motion.div>
  );
}