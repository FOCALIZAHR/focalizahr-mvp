'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface SaveScenarioModalProps {
  year: number
  onSave: (name: string) => Promise<void>
  onClose: () => void
}

export default function SaveScenarioModal({ year, onSave, onClose }: SaveScenarioModalProps) {
  const [name, setName] = useState(`Presupuesto ${year}`)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave(name.trim())
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700/50 shadow-2xl overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)' }}
        />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
                Guardar escenario
              </p>
              <p className="text-sm text-slate-300 font-light mt-1">
                Puedes reabrir y recalcular en cualquier momento.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del escenario"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="w-full px-3 py-2 text-sm font-light text-white bg-slate-800/60 border border-slate-700/50 rounded-lg focus:outline-none focus:border-cyan-500/40 placeholder:text-slate-600"
          />

          {error && (
            <p className="text-xs text-red-400 font-light mt-2">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white font-light transition-colors px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-medium transition-colors"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
