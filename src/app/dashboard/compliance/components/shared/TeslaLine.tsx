'use client';

// src/app/dashboard/compliance/components/shared/TeslaLine.tsx
// Línea luminosa superior del card premium FocalizaHR.
// Tokens canónicos (SKILL focalizahr-design + premium-components.md):
//   h-[2px] + gradient cyan→purple + boxShadow 20px sin alpha.
// El parent debe tener `relative overflow-hidden` para clipear correctamente.

interface TeslaLineProps {
  color?: string; // color primario del gradiente; default cyan
  accent?: string; // color secundario; default purple
}

export default function TeslaLine({
  color = '#22D3EE',
  accent = '#A78BFA',
}: TeslaLineProps) {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
      style={{
        background: `linear-gradient(90deg, transparent 0%, ${color} 35%, ${accent} 65%, transparent 100%)`,
        boxShadow: `0 0 20px ${color}`,
      }}
    />
  );
}
