'use client';

// src/app/dashboard/compliance/components/states/ComplianceEmptyState.tsx
// Estado 0 — sin campañas Ambiente Sano. Brochure completo se construye en Sesión 5.

export default function ComplianceEmptyState() {
  return (
    <div className="relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] p-10 w-full text-center">
      <h2 className="text-2xl font-light text-white mb-3">
        Aún no hay mediciones
      </h2>
      <p className="text-sm text-slate-400 font-light">
        Lanza tu primera medición para empezar a leer el ambiente del equipo.
      </p>
      <p className="text-[11px] text-slate-600 font-light mt-8 italic">
        Estado inicial — contenido completo en la próxima entrega.
      </p>
    </div>
  );
}
