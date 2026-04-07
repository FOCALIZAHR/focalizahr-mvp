'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTOR TASK LIST — Lista de tareas con switch ON/OFF
// CRÍTICO: NO mostrar betaScore, isAutomated, ni colores de exposición IA.
// La pantalla de edición es NEUTRA. Solo tareas e importance.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ProposedTask } from '@/lib/services/JobDescriptorService'

interface DescriptorTaskListProps {
  tasks: ProposedTask[]
  onToggle: (taskId: string) => void
}

export default memo(function DescriptorTaskList({ tasks, onToggle }: DescriptorTaskListProps) {
  return (
    <div className="space-y-1.5">
      {tasks.map((task, idx) => (
        <motion.div
          key={task.taskId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.02, duration: 0.2 }}
          className={cn(
            'flex items-start gap-3 rounded-xl border px-4 py-3 transition-all',
            task.isActive
              ? 'border-slate-800/50 bg-slate-900/40'
              : 'border-slate-800/20 bg-slate-950/30 opacity-50'
          )}
        >
          {/* Switch toggle */}
          <button
            onClick={() => onToggle(task.taskId)}
            className={cn(
              'mt-0.5 w-9 h-5 rounded-full flex-shrink-0 transition-colors relative',
              task.isActive ? 'bg-cyan-500/30' : 'bg-slate-700/30'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full transition-all',
                task.isActive
                  ? 'left-[18px] bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]'
                  : 'left-0.5 bg-slate-500'
              )}
            />
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-light leading-relaxed',
              task.isActive ? 'text-slate-300' : 'text-slate-600 line-through'
            )}>
              {task.description}
            </p>
            {/* Importance como dots sutiles — zero betaScore, zero IA info */}
            <div className="flex items-center gap-0.5 mt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1 h-1 rounded-full',
                    i < Math.round(task.importance)
                      ? 'bg-slate-500'
                      : 'bg-slate-800'
                  )}
                />
              ))}
              <span className="text-[9px] text-slate-600 ml-1.5">importancia</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
})
