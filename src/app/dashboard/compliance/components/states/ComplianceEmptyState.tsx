'use client';

// src/app/dashboard/compliance/components/states/ComplianceEmptyState.tsx
// Estado 0 — brochure del producto cuando la cuenta aún no tiene mediciones
// Ambiente Sano lanzadas. Copy EXACTO del TASK § PASO 5, sin Rail.

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';

interface Bloque {
  stat: string;
  texto: string;
}

const BLOQUES: Bloque[] = [
  {
    stat: '68%',
    texto:
      'de los incidentes laborales nunca entra a un canal formal. No porque no ocurran. Porque el equipo ha aprendido que reportar no cambia nada — o empeora las cosas.',
  },
  {
    stat: '2 años',
    texto:
      'es el ciclo del instrumento obligatorio. Entre una medición y la siguiente, tu organización puede cambiar completamente. FocalizaHR opera en ese intervalo.',
  },
  {
    stat: '4 fuentes',
    texto:
      'cruza simultáneamente: lo que responden, lo que escriben sin ser juzgados, lo que dicen quienes se van, lo que revelan quienes acaban de llegar. Cuando tres apuntan al mismo lugar, eso no es coincidencia.',
  },
  {
    stat: 'Antes',
    texto:
      'Una empresa que mide, registra y actúa antes de la denuncia está en una posición completamente distinta ante cualquier fiscalización. No explica por qué no actuó. Demuestra cuándo actuó y con qué evidencia.',
  },
];

export default function ComplianceEmptyState() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 w-full">
      <div className="text-center mb-16 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-extralight text-white leading-tight">
          Tu organización tiene un ambiente de trabajo hoy.
        </h1>
        <p className="text-xl font-extralight text-slate-400 mt-3">
          No sabes si es el que crees que tiene.
        </p>
      </div>

      <div className="w-full max-w-lg space-y-4">
        {BLOQUES.map((bloque) => (
          <div
            key={bloque.stat}
            className="relative overflow-hidden w-full p-6 bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px]"
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                opacity: 0.7,
              }}
            />
            <span className="text-[48px] font-extralight text-white leading-none tabular-nums">
              {bloque.stat}
            </span>
            <p className="text-slate-400 font-light text-sm mt-3 leading-relaxed">
              {bloque.texto}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <PrimaryButton
          icon={Plus}
          size="lg"
          onClick={() => router.push('/dashboard/campaigns/new')}
        >
          Lanzar primera medición
        </PrimaryButton>
        <p className="text-slate-600 text-xs mt-3 max-w-md mx-auto">
          La primera medición establece la línea base. Todo lo que venga después
          se mide contra ella.
        </p>
      </div>
    </div>
  );
}
