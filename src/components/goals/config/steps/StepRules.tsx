// src/components/goals/config/steps/StepRules.tsx
'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import GoalCascadeRuleManager from '@/components/goals/admin/GoalCascadeRuleManager'

const fetcher = (url: string) => {
  const token = localStorage.getItem('focalizahr_token')
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }).then(r => r.json())
}

interface StepRulesProps {
  onDataChange: (count: number) => void
}

export function StepRules({ onDataChange }: StepRulesProps) {
  const { data } = useSWR('/api/config/goal-rules', fetcher, { refreshInterval: 3000 })

  useEffect(() => {
    if (data?.data) {
      onDataChange(data.data.length)
    }
  }, [data, onDataChange])

  return <GoalCascadeRuleManager embedded />
}
