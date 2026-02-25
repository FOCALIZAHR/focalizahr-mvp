// src/components/goals/config/steps/StepEligibility.tsx
'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import GoalEligibilityManager from '@/components/goals/admin/GoalEligibilityManager'

const fetcher = (url: string) => {
  const token = localStorage.getItem('focalizahr_token')
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }).then(r => r.json())
}

interface StepEligibilityProps {
  onDataChange: (count: number) => void
}

export function StepEligibility({ onDataChange }: StepEligibilityProps) {
  const { data } = useSWR('/api/config/goal-eligibility', fetcher, { refreshInterval: 3000 })

  useEffect(() => {
    if (data?.data) {
      const eligible = data.data.filter((c: { hasGoals: boolean }) => c.hasGoals).length
      onDataChange(eligible)
    }
  }, [data, onDataChange])

  return <GoalEligibilityManager embedded />
}
