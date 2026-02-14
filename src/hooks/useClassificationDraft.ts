'use client'

// ============================================================================
// useClassificationDraft - Draft State Hook for Job Classification
// src/hooks/useClassificationDraft.ts
//
// All classification changes stay in localStorage until handleContinue().
// NO API persistence calls until the user explicitly confirms.
// ============================================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useToast } from '@/components/ui/toast-system'
import type {
  ClassificationDraft,
  ClassificationEmployee,
  ClassificationSummaryData,
  PerformanceTrack,
  UseClassificationDraftReturn
} from '@/types/job-classification'

const STORAGE_KEY_PREFIX = 'fhr-classification-draft-'
const DEBOUNCE_MS = 500
const EXPIRY_HOURS = 24

interface UseClassificationDraftOptions {
  accountId?: string  // Optional: client mode uses middleware auth; admin mode passes explicit ID
  onComplete?: () => void
  onCancel?: () => void
}

export function useClassificationDraft({
  accountId,
  onComplete,
  onCancel
}: UseClassificationDraftOptions): UseClassificationDraftReturn {
  const { success: toastSuccess, error: toastError } = useToast()

  const [draft, setDraft] = useState<ClassificationDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const storageKey = `${STORAGE_KEY_PREFIX}${accountId || 'self'}`

  // Stable refs for callbacks used in effects
  const toastErrorRef = useRef(toastError)
  toastErrorRef.current = toastError

  // ══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // Load from localStorage (if fresh) or fetch from review API
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    async function initialize() {
      setIsLoading(true)
      setError(null)

      try {
        // 1. Check localStorage for existing draft
        const draftKey = accountId || 'self'
        const savedRaw = localStorage.getItem(storageKey)
        if (savedRaw) {
          const saved = JSON.parse(savedRaw) as ClassificationDraft
          const createdAt = new Date(saved.createdAt)
          const hoursDiff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)

          if (hoursDiff < EXPIRY_HOURS && saved.accountId === draftKey) {
            setDraft(saved)
            setIsLoading(false)
            return
          }
          // Draft expired or wrong account, clean up
          localStorage.removeItem(storageKey)
        }

        // 2. Fetch fresh data from review API (READ only)
        // Client mode: middleware provides x-account-id via cookies
        // Admin mode: explicit accountId passed as query param
        const url = accountId
          ? `/api/job-classification/review?accountId=${encodeURIComponent(accountId)}`
          : '/api/job-classification/review'

        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) throw new Error('Error cargando clasificaciones')

        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Error desconocido')

        // 3. Transform API position groups into draft employees
        const unclassified = json.data?.unclassified || []

        const employees: ClassificationEmployee[] = unclassified.map(
          (item: Record<string, unknown>, idx: number) => ({
            id: `pos-${idx}`,
            fullName: (item.position as string) || '',
            position: (item.position as string) || '',
            departmentName: null,
            directReportsCount: 0,
            currentTrack: null,
            currentJobLevel: null,
            draftTrack: null,
            draftJobLevel: null,
            suggestedTrack: ((item.suggestedTrack as string) || 'COLABORADOR') as PerformanceTrack,
            suggestedJobLevel: (item.suggestedLevel as string) || null,
            confidence: item.suggestedLevel ? 0.85 : 0,
            anomalyType: 'NONE' as const,
            isReviewed: false,
            employeeCount: (item.employeeCount as number) || 0,
            employeeIds: (item.employeeIds as string[]) || []
          })
        )

        const newDraft: ClassificationDraft = {
          accountId: draftKey,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          employees,
          apiTotalEmployees: json.summary?.totalEmployees || 0,
          apiClassified: json.summary?.classified || 0,
          apiByTrack: json.byTrack || { ejecutivo: 0, manager: 0, colaborador: 0 },
          apiAnomalies: json.summary?.withAnomalies || 0
        }

        setDraft(newDraft)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error inicializando'
        setError(msg)
        toastErrorRef.current(msg)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [accountId, storageKey])

  // ══════════════════════════════════════════════════════════════════════════
  // LOCALSTORAGE PERSISTENCE (debounced)
  // Saves draft to localStorage after changes, with 500ms debounce
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!draft || !isDirty) return

    const timeout = setTimeout(() => {
      const toSave: ClassificationDraft = {
        ...draft,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(toSave))
      setIsDirty(false)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [draft, isDirty, storageKey])

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTED SUMMARY
  // Combines API baseline + draft changes for real-time display
  // ══════════════════════════════════════════════════════════════════════════

  const summary = useMemo<ClassificationSummaryData>(() => {
    if (!draft) {
      return {
        total: 0,
        classified: 0,
        pending: 0,
        byTrack: { EJECUTIVO: 0, MANAGER: 0, COLABORADOR: 0 },
        anomalies: 0,
        classificationRate: 0
      }
    }

    const draftClassified = draft.employees.filter(e => e.draftTrack !== null)
    const draftPending = draft.employees.filter(e => e.draftTrack === null)

    const totalClassified = draft.apiClassified + draftClassified.length
    const total = draft.apiTotalEmployees

    // Track distribution: API baseline + draft additions
    const byTrack = {
      EJECUTIVO:
        draft.apiByTrack.ejecutivo +
        draftClassified.filter(e => e.draftTrack === 'EJECUTIVO').length,
      MANAGER:
        draft.apiByTrack.manager +
        draftClassified.filter(e => e.draftTrack === 'MANAGER').length,
      COLABORADOR:
        draft.apiByTrack.colaborador +
        draftClassified.filter(e => e.draftTrack === 'COLABORADOR').length
    }

    return {
      total,
      classified: totalClassified,
      pending: draftPending.length,
      byTrack,
      anomalies: draft.apiAnomalies,
      classificationRate: total > 0 ? Math.round((totalClassified / total) * 100) : 0
    }
  }, [draft])

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIONS (all local, no API calls)
  // ══════════════════════════════════════════════════════════════════════════

  const updateClassification = useCallback(
    (employeeId: string, track: PerformanceTrack, jobLevel: string) => {
      setDraft(prev => {
        if (!prev) return prev
        return {
          ...prev,
          employees: prev.employees.map(emp =>
            emp.id === employeeId
              ? { ...emp, draftTrack: track, draftJobLevel: jobLevel, isReviewed: true }
              : emp
          )
        }
      })
      setIsDirty(true)
    },
    []
  )

  const approveAll = useCallback(() => {
    setDraft(prev => {
      if (!prev) return prev
      return {
        ...prev,
        employees: prev.employees.map(emp => {
          // Only approve if we have a suggestion and hasn't been manually reviewed
          if (emp.isReviewed || !emp.suggestedJobLevel) return emp
          return {
            ...emp,
            draftTrack: emp.suggestedTrack,
            draftJobLevel: emp.suggestedJobLevel,
            isReviewed: true
          }
        })
      }
    })
    setIsDirty(true)
  }, [])

  const approveByTrack = useCallback((track: PerformanceTrack) => {
    setDraft(prev => {
      if (!prev) return prev
      return {
        ...prev,
        employees: prev.employees.map(emp =>
          emp.suggestedTrack === track && !emp.isReviewed && emp.suggestedJobLevel
            ? {
                ...emp,
                draftTrack: track,
                draftJobLevel: emp.suggestedJobLevel,
                isReviewed: true
              }
            : emp
        )
      }
    })
    setIsDirty(true)
  }, [])

  const resetEmployee = useCallback((employeeId: string) => {
    setDraft(prev => {
      if (!prev) return prev
      return {
        ...prev,
        employees: prev.employees.map(emp =>
          emp.id === employeeId
            ? { ...emp, draftTrack: null, draftJobLevel: null, isReviewed: false }
            : emp
        )
      }
    })
    setIsDirty(true)
  }, [])

  // ══════════════════════════════════════════════════════════════════════════
  // PERSISTENCE (API calls ONLY here)
  // handleContinue is the ONLY function that calls a write API
  // ══════════════════════════════════════════════════════════════════════════

  const handleContinue = useCallback(async (): Promise<boolean> => {
    if (!draft) return false

    // Validate no pending positions
    const pending = draft.employees.filter(e => e.draftTrack === null)
    if (pending.length > 0) {
      toastError(`Aún hay ${pending.length} cargos sin clasificar`)
      return false
    }

    try {
      // Build batch-assign payload from draft
      const assignments = draft.employees
        .filter(emp => emp.draftJobLevel !== null)
        .map(emp => ({
          position: emp.position,
          standardJobLevel: emp.draftJobLevel!
        }))

      if (assignments.length === 0) {
        // Nothing to persist, just clean up
        localStorage.removeItem(storageKey)
        toastSuccess('Clasificación confirmada')
        onComplete?.()
        return true
      }

      // POST to batch-assign API (the ONLY write call)
      const res = await fetch('/api/job-classification/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...(accountId ? { accountId } : {}),
          assignments
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error guardando clasificaciones')
      }

      // Success: clear draft from localStorage
      localStorage.removeItem(storageKey)
      toastSuccess(`${assignments.length} clasificaciones guardadas`)
      onComplete?.()
      return true
    } catch (err) {
      // On error, keep draft in localStorage for retry
      const msg = err instanceof Error ? err.message : 'Error guardando'
      toastError(msg)
      return false
    }
  }, [draft, storageKey, accountId, toastSuccess, toastError, onComplete])

  const handleCancel = useCallback(() => {
    localStorage.removeItem(storageKey)
    setDraft(null)
    onCancel?.()
  }, [storageKey, onCancel])

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  const getEmployee = useCallback(
    (employeeId: string) => {
      return draft?.employees.find(e => e.id === employeeId)
    },
    [draft]
  )

  const getPendingEmployees = useCallback(() => {
    return draft?.employees.filter(e => e.draftTrack === null) || []
  }, [draft])

  const getClassifiedEmployees = useCallback(() => {
    return draft?.employees.filter(e => e.draftTrack !== null) || []
  }, [draft])

  // ══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════════

  return {
    draft,
    summary,
    isLoading,
    error,
    isDirty,
    approveAll,
    approveByTrack,
    updateClassification,
    resetEmployee,
    handleContinue,
    handleCancel,
    getEmployee,
    getPendingEmployees,
    getClassifiedEmployees
  }
}
