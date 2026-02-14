# REF_TASK_03D: Referencia Técnica Refactor Flujo Admin

## 1. Página Actual (Referencia)

Ubicación: `src/app/dashboard/admin/job-mapping-review/page.tsx`

Problemas identificados:
- Trabaja sobre `Participant.standardJobLevel` en vez de `Employee`
- No tiene selector de empresa
- UI no sigue design system FocalizaHR
- No hay feedback loop con JobMappingHistory

## 2. Nueva Implementación

```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, ChevronDown, Search } from 'lucide-react'
import JobClassificationGate from '@/components/job-classification/JobClassificationGate'

interface Account {
  id: string
  companyName: string
  adminEmail: string
}

export default function JobMappingReviewPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Cargar lista de empresas
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

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Revisión de Clasificación de Cargos
        </h1>
        <p className="text-slate-400 mt-2">
          Gestiona la clasificación de cargos por empresa
        </p>
      </div>

      {/* Selector de Empresa */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Seleccionar Empresa
        </label>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          
          {!selectedAccountId ? (
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {filteredAccounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-white/5 hover:border-cyan-500/30 transition-colors text-left"
                >
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-white font-medium">{account.companyName}</div>
                    <div className="text-slate-400 text-sm">{account.adminEmail}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-cyan-500/30">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-white font-medium">{selectedAccount?.companyName}</div>
                  <div className="text-slate-400 text-sm">{selectedAccount?.adminEmail}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccountId(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gate de Clasificación */}
      {selectedAccountId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <JobClassificationGate
            mode="admin"
            accountId={selectedAccountId}
            onComplete={() => {
              // En admin, no hay "siguiente paso"
              // Solo mostrar mensaje de éxito
              alert('✅ Clasificación completada para esta empresa')
            }}
          />
        </motion.div>
      )}

      {/* Estado vacío */}
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
```

## 3. API para Listar Empresas

Ya existe: `/api/admin/accounts`

```typescript
// GET /api/admin/accounts?limit=100
// Response:
{
  data: [
    { id: "xxx", companyName: "Empresa ABC", adminEmail: "admin@empresa.com" },
    ...
  ],
  pagination: { ... }
}
```

## 4. Diferencias Cliente vs Admin

| Aspecto | Cliente | Admin |
|---------|---------|-------|
| Selector empresa | NO (usa su token) | SÍ (elige de lista) |
| accountId prop | No pasado | Pasado explícitamente |
| onComplete | Avanza al paso 4 del wizard | Muestra mensaje éxito |
| Contexto | Dentro del wizard campaña | Página standalone |

## 5. Layout Admin

Asegurar que la página use el layout de admin:
- Navegación lateral visible
- Breadcrumb: Admin > Revisión Cargos
- Consistencia con otras páginas admin

## 6. Eliminar Código Antiguo

Una vez implementada la nueva versión, eliminar:
- Lógica que trabaja sobre Participant
- API antigua `/api/admin/job-mapping-review` (si existe duplicada)
- Cualquier referencia a Participant.standardJobLevel para clasificación

## 7. Navegación Relacionada

Agregar links útiles:
- Ver anomalías: `/dashboard/admin/employees/anomalies`
- Ver empleados: `/dashboard/admin/employees`
- Volver a cuentas: `/dashboard/admin/accounts`
