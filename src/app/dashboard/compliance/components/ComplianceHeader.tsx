'use client';

// src/app/dashboard/compliance/components/ComplianceHeader.tsx
// Header fino del Cinema Mode — 56px, chrome mínimo.
// Contiene: marca, selector de campañas, 2 botones PDF (Fase 6 → disabled + tooltip).

import Link from 'next/link';
import { ArrowLeft, FileText, FileSearch } from 'lucide-react';
import type {
  ComplianceCampaignSummary,
  CompliancePageState,
} from '@/types/compliance';

interface ComplianceHeaderProps {
  campaigns: ComplianceCampaignSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  pageState: CompliancePageState;
}

export default function ComplianceHeader({
  campaigns,
  selectedId,
  onSelect,
  pageState,
}: ComplianceHeaderProps) {
  const disabled = pageState === 'loading' || pageState === 'error';

  return (
    <div className="h-14 flex items-center justify-between px-6 md:px-8 border-b border-white/5 flex-shrink-0 relative z-20">
      {/* Marca + back */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          FocalizaHR
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
          Ambiente Sano
        </span>
      </div>

      {/* Selector de campañas + PDFs */}
      <div className="flex items-center gap-3">
        {campaigns.length > 0 && (
          <select
            value={selectedId ?? ''}
            onChange={(e) => onSelect(e.target.value)}
            disabled={disabled}
            className="text-xs bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500/40 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed min-w-[220px]"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.status === 'active' && ' — en curso'}
                {c.status === 'draft' && ' — borrador'}
              </option>
            ))}
          </select>
        )}

        <PDFButton
          icon={<FileText className="w-3.5 h-3.5" />}
          label="Reporte ejecutivo"
        />
        <PDFButton
          icon={<FileSearch className="w-3.5 h-3.5" />}
          label="Evidencia legal"
        />
      </div>
    </div>
  );
}

function PDFButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      disabled
      title="Generador de Evidencia Legal en preparación (Disponible en Fase 6)"
      className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-slate-900/70 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}
