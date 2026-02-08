import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  X, 
  History, 
  Lock, 
  Maximize2,
  MoreHorizontal,
  LayoutGrid,
  TrendingUp,
  Target,
  GripVertical,
  BarChart3,
  CheckCircle2
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// 0. DESIGN TOKENS & CONFIG
// ═══════════════════════════════════════════════════════════════════════

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// Paleta Semántica Sobria
const STATUS_COLORS = {
  STARS: { line: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/20" },
  HIGH: { line: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500/20" },
  CORE: { line: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/20" },
  RISK: { line: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/20" },
  NEUTRAL: { line: "bg-slate-600", text: "text-slate-400", border: "border-slate-700" },
};

// Matriz 3x3 Lógica
const GRID_BOXES = [
  // Row 1 (High Potential)
  { id: "q7", title: "Enigma", status: "HIGH", label: "Alto Potencial / Bajo Desempeño" },
  { id: "q8", title: "Crecimiento", status: "HIGH", label: "Alto Potencial / Medio Desempeño" },
  { id: "q9", title: "ESTRELLAS", status: "STARS", label: "Top Talent", highlight: true },
  // Row 2 (Med Potential)
  { id: "q4", title: "Dilema", status: "NEUTRAL", label: "Medio Potencial / Bajo Desempeño" },
  { id: "q5", title: "Core", status: "CORE", label: "El motor de la empresa" },
  { id: "q6", title: "Alto Desempeño", status: "HIGH", label: "Medio Potencial / Alto Desempeño" },
  // Row 3 (Low Potential)
  { id: "q1", title: "Riesgo", status: "RISK", label: "Bajo Potencial / Bajo Desempeño", danger: true },
  { id: "q2", title: "Efectivo", status: "NEUTRAL", label: "Bajo Potencial / Medio Desempeño" },
  { id: "q3", title: "Experto", status: "CORE", label: "Especialista Técnico" },
];

const INITIAL_EMPLOYEES = [
  { id: 1, name: "Ana P.", role: "VP Ventas", avatar: "AP", performance: 4.8, potential: 4.8, quadrant: "q9", status: "STARS", history: [] },
  { id: 2, name: "Carlos M.", role: "Tech Lead", avatar: "CM", performance: 4.2, potential: 4.5, quadrant: "q9", status: "STARS", history: [{ user: "CEO", action: "Move", date: "10:15", note: "Promovido a Top Talent" }] },
  { id: 3, name: "Sofia L.", role: "Marketing", avatar: "SL", performance: 3.1, potential: 3.8, quadrant: "q5", status: "CORE", history: [] },
  { id: 4, name: "Javier R.", role: "Ops Mgr", avatar: "JR", performance: 2.5, potential: 2.2, quadrant: "q4", status: "NEUTRAL", history: [] },
  { id: 5, name: "Elena T.", role: "HR BP", avatar: "ET", performance: 3.8, potential: 4.0, quadrant: "q6", status: "HIGH", history: [] },
  { id: 6, name: "David B.", role: "Jr Dev", avatar: "DB", performance: 1.8, potential: 1.5, quadrant: "q1", status: "RISK", history: [] },
  { id: 7, name: "Lucia G.", role: "Product", avatar: "LG", performance: 4.5, potential: 3.5, quadrant: "q6", status: "HIGH", history: [] },
];

// ═══════════════════════════════════════════════════════════════════════
// 1. COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

// --- A. THE DYNAMIC GAUSSIAN WIDGET (Cinema Style) ---
const CinemaGaussianWidget = ({ 
  realPercentage, 
  targetPercentage, 
  onClick 
}: { 
  realPercentage: number, 
  targetPercentage: number, 
  onClick: () => void 
}) => {
  
  // Interpolación simple para la altura de la curva basada en el porcentaje
  // Base Y es 45 (abajo), Pico Y varía. Target suele ser 10-15%.
  // Si realPercentage sube, el pico sube (Y disminuye hacia 0).
  const peakY = Math.max(5, 45 - (realPercentage * 1.5)); // Simple scaling logic
  
  const targetPath = "M0,45 C30,45 40,25 50,25 C60,25 70,45 100,45"; 
  const actualPath = `M0,45 C20,45 45,${peakY} 60,${peakY} C75,${peakY} 90,45 100,45`;

  const isDeviated = realPercentage > targetPercentage + 5; // Alert if > 5% over target

  return (
    <div 
      onClick={onClick}
      className="flex items-center h-full px-5 bg-[#0B1120] rounded-xl border border-slate-800 relative overflow-hidden group cursor-pointer hover:border-slate-700 transition-colors"
    >
       {/* Background Glow */}
       <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
       
       <div className="relative z-10 flex gap-6 items-center">
          {/* Legend / Stats */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Distribución</span>
                <Maximize2 size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
             <div className="flex items-center gap-3 font-mono text-xs">
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-0.5 bg-cyan-500/50"></div>
                   <span className="text-slate-400">Target <span className="text-cyan-400 font-bold">{targetPercentage}%</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-0.5 bg-purple-500"></div>
                   <span className="text-slate-400">Real <span className={cn("font-bold transition-colors duration-500", isDeviated ? "text-amber-400" : "text-purple-400")}>{realPercentage.toFixed(0)}%</span></span>
                </div>
             </div>
          </div>

          {/* The Dynamic Graph */}
          <div className="w-32 h-10 relative">
             <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                {/* Grid Lines Verticlaes Sutiles */}
                <line x1="50" y1="0" x2="50" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                
                {/* Target Curve (Cyan Dotted) */}
                <path d={targetPath} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="2,2" className="opacity-40" />
                
                {/* Actual Curve (Purple Glowing Animated) */}
                <motion.path 
                  d={actualPath} 
                  fill="none" 
                  stroke={isDeviated ? "#fbbf24" : "#d946ef"} // Amber if warning, else Purple
                  strokeWidth="2" 
                  className="drop-shadow-[0_0_6px_currentColor]"
                  animate={{ d: actualPath, stroke: isDeviated ? "#fbbf24" : "#d946ef" }}
                  transition={{ type: "spring", stiffness: 50, damping: 15 }}
                />
                
                {/* Área de relleno sutil bajo la curva real */}
                <motion.path 
                  d={`${actualPath} L100,50 L0,50 Z`} 
                  fill="url(#purpleFade)" 
                  className="opacity-20" 
                  animate={{ d: `${actualPath} L100,50 L0,50 Z` }}
                />
                
                <defs>
                   <linearGradient id="purpleFade" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={isDeviated ? "#fbbf24" : "#d946ef"} />
                      <stop offset="100%" stopColor="transparent" />
                   </linearGradient>
                </defs>
             </svg>
          </div>
       </div>

       {/* Alert Icon (Si hay desviación) */}
       {isDeviated && (
         <div className="ml-4 pl-4 border-l border-slate-800">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/20 animate-pulse">
               <AlertTriangle size={12} className="text-amber-500" />
            </div>
         </div>
       )}
    </div>
  );
};

// --- B. THE CARD (Stealth Mode + Draggable) ---
const CinemaCard = ({ employee, onDragStart, onClick }) => {
  const style = STATUS_COLORS[employee.status] || STATUS_COLORS.NEUTRAL;

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, employee)}
      onClick={() => onClick(employee)}
      className={cn(
        "group relative w-full p-3 rounded-lg border transition-all duration-200 cursor-grab active:cursor-grabbing",
        "bg-[#111827] border-slate-800 hover:border-slate-700 hover:bg-[#161e2e]", // Fondo sobrio
        "hover:shadow-lg"
      )}
    >
      {/* 1. La "Línea Tesla" Vertical (Sobria) */}
      <div className={cn(
        "absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-300",
        style.line,
        "opacity-60 group-hover:opacity-100 group-hover:shadow-[0_0_8px_currentColor]"
      )} />

      <div className="flex items-center gap-3 pl-2">
         {/* Avatar Minimal */}
         <div className="w-8 h-8 rounded-full bg-[#0B1120] border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-white group-hover:border-slate-600 transition-colors">
            {employee.avatar}
         </div>

         {/* Info */}
         <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
               {employee.name}
            </h4>
            <p className="text-[10px] text-slate-500 truncate group-hover:text-slate-400">
               {employee.role}
            </p>
         </div>

         {/* Grip Handle (Solo visible en hover para indicar drag) */}
         <div className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={14} />
         </div>
      </div>
    </div>
  );
};

// --- C. DISTRIBUTION MODAL ("Big Data" View) ---
const DistributionModal = ({ 
  isOpen, 
  onClose, 
  stats 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  stats: any 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
       <motion.div 
         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
         className="absolute inset-0 bg-black/80 backdrop-blur-sm"
         onClick={onClose}
       />
       <motion.div 
         initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
         className="relative w-full max-w-2xl bg-[#0B1120] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
       >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#111827]">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700">
                   <BarChart3 size={20} />
                </div>
                <div>
                   <h2 className="text-lg font-bold text-white uppercase tracking-wide">Análisis de Distribución</h2>
                   <p className="text-xs text-slate-400">Calibración vs Modelo Ideal</p>
                </div>
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
          </div>

          {/* Body */}
          <div className="p-8">
             <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Big Stat Real */}
                <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 shadow-[0_0_10px_#d946ef]"></div>
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Real Estrellas</span>
                   <span className="text-6xl font-black text-white tracking-tighter">{stats.real}%</span>
                   <span className="text-xs text-purple-400 font-bold mt-2">{stats.real > stats.target ? `+${stats.real - stats.target}% sobre meta` : 'Bajo meta'}</span>
                </div>

                {/* Big Stat Target */}
                <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden opacity-70">
                   <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500"></div>
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Ideal</span>
                   <span className="text-6xl font-black text-slate-300 tracking-tighter">{stats.target}%</span>
                   <span className="text-xs text-cyan-400 font-bold mt-2">Modelo Gaussiano</span>
                </div>
             </div>

             {/* Detailed Breakdown */}
             <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Desglose por Categoría</h3>
                {['STARS', 'HIGH', 'CORE', 'NEUTRAL', 'RISK'].map(cat => {
                   const count = stats.counts[cat] || 0;
                   const pct = ((count / stats.total) * 100).toFixed(0);
                   const color = STATUS_COLORS[cat]?.line || "bg-slate-500";
                   
                   return (
                      <div key={cat} className="flex items-center gap-4">
                         <div className="w-24 text-xs font-bold text-slate-300">{cat}</div>
                         <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                               className={cn("h-full rounded-full", color)}
                            />
                         </div>
                         <div className="w-12 text-right text-xs font-mono text-slate-400">{pct}%</div>
                      </div>
                   )
                })}
             </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800 bg-[#111827] flex justify-end">
             <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase rounded border border-slate-700">
                Cerrar
             </button>
          </div>
       </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 2. MAIN LOGIC & LAYOUT
// ═══════════════════════════════════════════════════════════════════════

export default function CinemaNineBox() {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [draggedEmp, setDraggedEmp] = useState<any>(null);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [showDistModal, setShowDistModal] = useState(false);
  const [justification, setJustification] = useState("");

  // --- Statistics Logic ---
  const stats = useMemo(() => {
     const total = employees.length;
     const starsCount = employees.filter(e => e.status === 'STARS').length;
     
     // Count by status for detailed modal
     const counts: Record<string, number> = {};
     employees.forEach(e => {
        counts[e.status] = (counts[e.status] || 0) + 1;
     });

     return {
        total,
        real: total > 0 ? Number(((starsCount / total) * 100).toFixed(0)) : 0,
        target: 15, // Fixed target for example
        counts
     };
  }, [employees]);

  // --- Drag & Drop Logic ---
  const handleDragStart = (e: React.DragEvent, emp: any) => {
    setDraggedEmp(emp);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, targetBoxId: string) => {
    e.preventDefault();
    if (!draggedEmp) return;

    const targetBox = GRID_BOXES.find(b => b.id === targetBoxId);
    const newStatus = targetBox?.status || 'NEUTRAL';

    const updated = employees.map(emp => 
       emp.id === draggedEmp.id 
          ? { ...emp, quadrant: targetBoxId, status: newStatus } 
          : emp
    );
    
    setEmployees(updated);
    
    if (targetBoxId === 'q9' || targetBoxId === 'q1') {
       setSelectedEmp({ ...draggedEmp, quadrant: targetBoxId, status: newStatus });
    }
    
    setDraggedEmp(null);
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      {/* 1. HEADER: COMMAND CENTER */}
      <header className="h-16 bg-[#0B1120] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-xl relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
        
        {/* Left: Título */}
        <div className="flex items-center gap-4">
           <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-cyan-400 border border-slate-700 shadow-inner">
              <LayoutGrid size={18} />
           </div>
           <div>
              <h1 className="text-sm font-bold text-white tracking-wide uppercase">Calibración Q3 2025</h1>
              <div className="flex items-center gap-2 mt-0.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">En Progreso</span>
              </div>
           </div>
        </div>

        {/* Center: DYNAMIC GAUSSIAN WIDGET */}
        <div className="h-12 hidden md:block">
           <CinemaGaussianWidget 
              realPercentage={stats.real} 
              targetPercentage={stats.target} 
              onClick={() => setShowDistModal(true)}
           />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
           <div className="text-right hidden lg:block mr-2">
              <div className="text-[9px] text-slate-500 uppercase font-bold">Impacto Financiero</div>
              <div className="text-sm font-mono font-bold text-white">$20.8M</div>
           </div>
           <button className="bg-[#111827] hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-lg border border-slate-700 transition-colors">
              <Search size={16} />
           </button>
           <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all">
              Finalizar
           </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 relative p-6 flex flex-col overflow-hidden">
         
         <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold tracking-[0.3em] text-slate-600 flex items-center gap-2 pointer-events-none select-none">
            <TrendingUp size={10} /> DESEMPEÑO
         </div>
         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-[0.3em] text-slate-600 flex items-center gap-2 pointer-events-none select-none">
            <Target size={10} /> POTENCIAL
         </div>

         {/* 3x3 GRID */}
         <div className="flex-1 ml-6 mb-4 grid grid-cols-3 grid-rows-3 gap-3">
            {GRID_BOXES.map((box) => {
               const boxEmployees = employees.filter(e => e.quadrant === box.id);
               const isTarget = draggedEmp !== null;
               
               return (
                  <div 
                     key={box.id}
                     onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                     onDrop={(e) => handleDrop(e, box.id)}
                     className={cn(
                        "relative rounded-xl border flex flex-col p-2 transition-all duration-300",
                        "bg-[#0B1120]/60 backdrop-blur-sm",
                        box.highlight ? "border-purple-500/30 bg-purple-900/5" : 
                        box.danger ? "border-rose-500/30 bg-rose-900/5" : "border-slate-800",
                        isTarget && "hover:border-cyan-500/50 hover:bg-cyan-900/10"
                     )}
                  >
                     <div className="flex justify-between items-start mb-2 px-1">
                        <div>
                           <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider block",
                              box.highlight ? "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]" : 
                              box.danger ? "text-rose-400" : "text-slate-400"
                           )}>
                              {box.title}
                           </span>
                           <span className="text-[8px] text-slate-600 font-medium truncate max-w-[120px] block">
                              {box.label}
                           </span>
                        </div>
                        <span className="text-[9px] font-mono bg-[#111827] text-slate-500 px-1.5 py-0.5 rounded border border-slate-800">
                           {boxEmployees.length}
                        </span>
                     </div>

                     <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {boxEmployees.map(emp => (
                           <CinemaCard 
                              key={emp.id} 
                              employee={emp} 
                              onDragStart={handleDragStart}
                              onClick={setSelectedEmp}
                           />
                        ))}
                        {boxEmployees.length === 0 && (
                           <div className={cn(
                              "h-full flex items-center justify-center transition-opacity",
                              isTarget ? "opacity-100" : "opacity-0 hover:opacity-100"
                           )}>
                              <div className="border border-dashed border-slate-800 rounded px-3 py-2 text-[9px] text-slate-700 uppercase">
                                 Vacío
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>
      </main>

      {/* 3. DRAWERS & MODALS */}
      <AnimatePresence>
         {/* Detail Drawer */}
         {selectedEmp && (
            <>
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setSelectedEmp(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30"
               />
               <motion.div 
                  initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute top-0 right-0 h-full w-[400px] bg-[#0B1120] border-l border-slate-800 z-40 shadow-2xl flex flex-col"
               >
                  <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#111827]">
                     <div className="flex items-center gap-2">
                        <Lock size={14} className="text-cyan-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Justificación</h3>
                     </div>
                     <button onClick={() => setSelectedEmp(null)} className="text-slate-500 hover:text-white">
                        <X size={18} />
                     </button>
                  </div>

                  <div className="p-6 bg-[#0f1523] border-b border-slate-800">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-[#111827] border border-slate-700 flex items-center justify-center text-lg font-bold text-white">
                           {selectedEmp.avatar}
                        </div>
                        <div>
                           <h2 className="text-lg font-bold text-white">{selectedEmp.name}</h2>
                           <p className="text-xs text-slate-400">{selectedEmp.role}</p>
                           <div className={cn("mt-2 inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase border", 
                              STATUS_COLORS[selectedEmp.status as keyof typeof STATUS_COLORS]?.border || "border-slate-700",
                              STATUS_COLORS[selectedEmp.status as keyof typeof STATUS_COLORS]?.text || "text-slate-400",
                              STATUS_COLORS[selectedEmp.status as keyof typeof STATUS_COLORS]?.line.replace('bg-', 'bg-') + "/10"
                           )}>
                              {GRID_BOXES.find(b => b.id === selectedEmp.quadrant)?.title}
                           </div>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#111827] p-3 rounded border border-slate-800">
                           <span className="text-[9px] text-slate-500 uppercase font-bold">Desempeño</span>
                           <div className="text-lg font-mono font-bold text-white">{selectedEmp.performance}</div>
                        </div>
                        <div className="bg-[#111827] p-3 rounded border border-slate-800">
                           <span className="text-[9px] text-slate-500 uppercase font-bold">Potencial</span>
                           <div className="text-lg font-mono font-bold text-cyan-400">{selectedEmp.potential}</div>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto">
                     <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Motivo del Movimiento</label>
                     <textarea 
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Explique por qué este colaborador pertenece a este cuadrante..."
                        className="w-full h-32 bg-[#111827] border border-slate-700 rounded-lg p-3 text-sm text-slate-300 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none mb-6 transition-all"
                     />
                     {/* History would go here */}
                  </div>

                  <div className="p-6 border-t border-slate-800 bg-[#111827]">
                     <button 
                        onClick={() => setSelectedEmp(null)}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded shadow-lg shadow-cyan-900/20 transition-all"
                     >
                        Confirmar y Guardar
                     </button>
                  </div>
               </motion.div>
            </>
         )}

         {/* Distribution Modal */}
         <DistributionModal 
            isOpen={showDistModal} 
            onClose={() => setShowDistModal(false)} 
            stats={stats} 
         />
      </AnimatePresence>

    </div>
  );
}