// ════════════════════════════════════════════════════════════════════════════
// TESLA LINE — identidad visual FocalizaHR para cards premium
// src/app/dashboard/workforce/components/instruments/_shared/TeslaLine.tsx
// ════════════════════════════════════════════════════════════════════════════
// Línea luminosa cyan→purple en el tope del card. Se usa en TODOS los
// instruments del Workforce Deck para identidad visual consistente.
//
// Uso: el padre debe tener `relative overflow-hidden` para clipear el glow.
// ════════════════════════════════════════════════════════════════════════════

export default function TeslaLine() {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-[2px] z-10 pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
        boxShadow: '0 0 20px #22D3EE',
      }}
    />
  )
}
