'use client'

// ════════════════════════════════════════════════════════════════════════════
// JOB MAPPING REVIEW PAGE - Revisión de Clasificación de Cargos (Admin)
// src/app/dashboard/admin/job-mapping-review/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Search, Loader2, ArrowLeft } from 'lucide-react'
import { JobClassificationGate } from '@/components/job-classification'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Account {
  id: string
  companyName: string
  adminEmail: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function JobMappingReviewPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH ACCOUNTS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/admin/accounts?limit=100')
        const json = await res.json()
        if (json.data) {
          setAccounts(json.data)
        }
      } catch (error) {
        console.error('Error fetching accounts:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAccounts()
  }, [])

  const filteredAccounts = accounts.filter(acc =>
    acc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedAccount = accounts.find(a => a.id === selectedAccountId)

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-slate-200 flex items-center gap-3">
          <Building2 className="w-6 h-6 text-cyan-400" />
          Revisión de Clasificación de Cargos
        </h1>
        <p className="text-slate-400 mt-1">
          Gestiona la clasificación de cargos por empresa
        </p>
      </div>

      {/* Account Selector */}
      <div className="fhr-card p-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Seleccionar Empresa
        </label>

        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
            <p className="text-slate-500 text-sm">Cargando empresas...</p>
          </div>
        )}

        {/* Account List (when none selected) */}
        {!loading && !selectedAccountId && (
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                No se encontraron empresas
              </p>
            ) : (
              filteredAccounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-white/5 hover:border-cyan-500/30 transition-colors text-left"
                >
                  <Building2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">{account.companyName}</div>
                    <div className="text-slate-400 text-sm truncate">{account.adminEmail}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Selected Account Display */}
        {!loading && selectedAccountId && selectedAccount && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-cyan-500/30">
            <div className="flex items-center gap-3 min-w-0">
              <Building2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-white font-medium truncate">{selectedAccount.companyName}</div>
                <div className="text-slate-400 text-sm truncate">{selectedAccount.adminEmail}</div>
              </div>
            </div>
            <button
              onClick={() => setSelectedAccountId(null)}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm flex-shrink-0 ml-4"
            >
              <ArrowLeft className="w-3 h-3" />
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* Job Classification Gate */}
      {selectedAccountId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <JobClassificationGate
            mode="admin"
            accountId={selectedAccountId}
            onComplete={() => {
              // Reset selection to allow choosing another account
              setSelectedAccountId(null)
            }}
          />
        </motion.div>
      )}

      {/* Empty State */}
      {!selectedAccountId && !loading && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            Selecciona una empresa para revisar su clasificación de cargos
          </p>
        </div>
      )}
    </div>
  )
}
