// src/app/dashboard/compliance/loading.tsx
// Loading UI Next.js (SSR skeleton mientras se hidrata el client).
// Skeleton mínimo inline — el ComplianceSkeleton real se reconstruye en Sesión 4.

export default function Loading() {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 md:p-8">
      <div className="relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] p-10 w-full max-w-xl animate-pulse">
        <div className="h-6 w-40 bg-slate-800 rounded" />
        <div className="h-24 w-64 bg-slate-800/60 rounded mt-6" />
        <div className="h-4 w-full bg-slate-800/40 rounded mt-8" />
        <div className="h-4 w-3/4 bg-slate-800/40 rounded mt-3" />
      </div>
    </div>
  );
}
