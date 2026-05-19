'use client';

// src/components/compliance/cascada/ActoSintesis.tsx
// Síntesis de la Cascada Ejecutiva — "El Francotirador".
// Sin número ancla; texto puro + CTA primary al plan.

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import { ActSeparator, fadeIn } from './shared';
import type { ComplianceReportResponse } from '@/types/compliance';

interface ActoSintesisProps {
  data: ComplianceReportResponse;
  onIrAlPlan: () => void;
}

export default memo(function ActoSintesis({ data, onIrAlPlan }: ActoSintesisProps) {
  const s = data.narratives.cascada?.sintesis;
  if (!s) return null;

  return (
    <>
      <ActSeparator label="Síntesis" color="cyan" />
      <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6 text-center">
        <p className="text-xl md:text-2xl font-extralight text-white leading-relaxed">
          {s.classification}
        </p>
        <p className="text-base font-light italic text-slate-300 leading-relaxed">
          {s.implication}
        </p>
        <p className="text-sm font-light italic text-slate-500 leading-relaxed">
          {s.accountability}
        </p>
        <div className="flex justify-center pt-4">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onIrAlPlan}>
            {s.ctaLabel}
          </PrimaryButton>
        </div>
      </motion.div>
    </>
  );
});
