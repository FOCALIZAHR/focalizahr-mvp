'use client';

// src/components/vitals/VitalsCTA.tsx
// Único componente cliente de la portada. Existe SOLO porque un server
// component no puede pasar onClick a PrimaryButton. Cero lógica de negocio.

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';

interface VitalsCTAProps {
  label: string;
  href: string;
}

export default function VitalsCTA({ label, href }: VitalsCTAProps) {
  const router = useRouter();

  return (
    <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={() => router.push(href)}>
      {label}
    </PrimaryButton>
  );
}
