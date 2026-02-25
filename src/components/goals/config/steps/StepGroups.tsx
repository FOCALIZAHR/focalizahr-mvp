// src/components/goals/config/steps/StepGroups.tsx
'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import GoalGroupManager from '@/components/goals/admin/GoalGroupManager'

const fetcher = (url: string) => {
  const token = localStorage.getItem('focalizahr_token')
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }).then(r => r.json())
}

interface StepGroupsProps {
  onDataChange: (count: number) => void
}

export function StepGroups({ onDataChange }: StepGroupsProps) {
  const { data } = useSWR('/api/config/goal-groups', fetcher, { refreshInterval: 3000 })

  useEffect(() => {
    if (data?.data) {
      onDataChange(data.data.length)
    }
  }, [data, onDataChange])

  return <GoalGroupManager embedded />
}
