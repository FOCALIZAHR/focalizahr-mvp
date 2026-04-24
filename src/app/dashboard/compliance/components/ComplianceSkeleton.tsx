'use client';

// src/app/dashboard/compliance/components/ComplianceSkeleton.tsx
// Skeleton mínimo inline — mismo token que los cards reales.

export default function ComplianceSkeleton() {
  return (
    <div className="relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] p-10 w-full animate-pulse">
      <div className="h-6 w-40 bg-slate-800 rounded" />
      <div className="h-24 w-64 bg-slate-800/60 rounded mt-6" />
      <div className="h-4 w-full bg-slate-800/40 rounded mt-8" />
      <div className="h-4 w-3/4 bg-slate-800/40 rounded mt-3" />
      <div className="h-4 w-2/3 bg-slate-800/40 rounded mt-3" />
    </div>
  );
}
