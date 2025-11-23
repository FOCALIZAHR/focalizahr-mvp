// ====================================================================
// BENCHMARK COUNTRY SELECTOR - SELECTOR PAÍS/REGIÓN
// src/components/onboarding/BenchmarkCountrySelector.tsx
// 🌎 Permite seleccionar mercado de comparación
// ====================================================================

'use client';

import { memo } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface BenchmarkCountrySelectorProps {
  value: string;
  onChange: (country: string) => void;
  disabled?: boolean;
}

interface Country {
  code: string;
  name: string;
  flag: string;
}

// ============================================
// CONSTANTS
// ============================================
const COUNTRIES: Country[] = [
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'ALL', name: 'Todos los países', flag: '🌎' }
];

// ============================================
// COMPONENT
// ============================================
const BenchmarkCountrySelector = memo(function BenchmarkCountrySelector({
  value,
  onChange,
  disabled = false
}: BenchmarkCountrySelectorProps) {
  
  // Encontrar país seleccionado para mostrar flag
  const selectedCountry = COUNTRIES.find(c => c.code === value);
  
  return (
    <Select 
      value={value} 
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-52 fhr-card border-slate-700/50 hover:border-cyan-400/50 transition-colors">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-cyan-400" />
          <SelectValue placeholder="Seleccionar mercado">
            {selectedCountry && (
              <span className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="font-light">{selectedCountry.name}</span>
              </span>
            )}
          </SelectValue>
        </div>
      </SelectTrigger>
      
      <SelectContent className="bg-slate-800 border-slate-700">
        {COUNTRIES.map(country => (
          <SelectItem 
            key={country.code} 
            value={country.code}
            className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
          >
            <div className="flex items-center gap-3 py-1">
              <span className="text-xl">{country.flag}</span>
              <span className="font-light text-slate-200">{country.name}</span>
              {country.code === 'CL' && (
                <span className="ml-auto text-xs text-cyan-400 font-medium">
                  Default
                </span>
              )}
              {country.code === 'ALL' && (
                <span className="ml-auto text-xs text-purple-400 font-medium">
                  Global
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

export default BenchmarkCountrySelector;