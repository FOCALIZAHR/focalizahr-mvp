// ════════════════════════════════════════════════════════════════════════════
// STEP 3: Invitar Participantes
// src/components/calibration/steps/StepInviteParticipants.tsx
// ════════════════════════════════════════════════════════════════════════════
// Roles: FACILITATOR | REVIEWER | OBSERVER (compatible TASK_12 v2)
// Campo name requerido por API CalibrationParticipant
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { UserPlus, X, Mail, Shield, Users, Eye, User } from 'lucide-react'

interface Participant {
  email: string
  name: string
  role: 'FACILITATOR' | 'REVIEWER' | 'OBSERVER'
}

interface StepInviteParticipantsProps {
  participants: Participant[]
  onParticipantsChange: (participants: Participant[]) => void
  currentUserEmail?: string
}

export default memo(function StepInviteParticipants({
  participants,
  onParticipantsChange,
  currentUserEmail
}: StepInviteParticipantsProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'FACILITATOR' | 'REVIEWER' | 'OBSERVER'>('REVIEWER')
  const [error, setError] = useState('')

  const handleAdd = () => {
    setError('')

    if (!name.trim()) {
      setError('Ingresa el nombre completo')
      return
    }

    if (!email.trim()) {
      setError('Ingresa un email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Email inválido')
      return
    }

    if (participants.some(p => p.email === email)) {
      setError('Este email ya fue agregado')
      return
    }

    if (email === currentUserEmail) {
      setError('No puedes agregarte a ti mismo')
      return
    }

    onParticipantsChange([...participants, { email, name, role }])
    setEmail('')
    setName('')
    setRole('REVIEWER')
  }

  const handleRemove = (emailToRemove: string) => {
    onParticipantsChange(participants.filter(p => p.email !== emailToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'FACILITATOR':
        return <span className="fhr-badge fhr-badge-active text-xs">Facilitador</span>
      case 'REVIEWER':
        return <span className="fhr-badge fhr-badge-success text-xs">Revisor</span>
      case 'OBSERVER':
        return <span className="fhr-badge text-xs bg-slate-700 text-slate-300">Observador</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Invita a los managers que calibrarán
        </h2>
        <p className="text-sm text-slate-400">
          Agrega participantes y asigna su rol en la sesión de calibración.
        </p>
      </div>

      {/* Agregar participante */}
      <div className="fhr-card p-4 space-y-4">
        <div className="grid gap-4">
          {/* Nombre */}
          <div>
            <label className="fhr-label">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Juan Pérez"
                className="fhr-input pl-10"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="fhr-label">
                Email corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="juan.perez@empresa.com"
                  className="fhr-input pl-10"
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="fhr-label">
                Rol en la sesión
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'FACILITATOR' | 'REVIEWER' | 'OBSERVER')}
                className="fhr-select"
              >
                <option value="REVIEWER">Revisor (puede ajustar)</option>
                <option value="FACILITATOR">Facilitador (conduce + ajusta + cierra)</option>
                <option value="OBSERVER">Observador (solo visualiza)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Botón agregar */}
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Agregar Participante
        </button>
      </div>

      {/* Descripción de roles */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="fhr-card p-3 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Facilitador</span>
          </div>
          <p className="text-xs text-slate-500">
            Conduce la sesión, puede ajustar ratings y cerrarla.
          </p>
        </div>

        <div className="fhr-card p-3 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Revisor</span>
          </div>
          <p className="text-xs text-slate-500">
            Puede ver evaluaciones y hacer ajustes con justificación.
          </p>
        </div>

        <div className="fhr-card p-3 border border-slate-600/20">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-400">Observador</span>
          </div>
          <p className="text-xs text-slate-500">
            Solo puede ver la sesión, no puede hacer ajustes.
          </p>
        </div>
      </div>

      {/* Lista de participantes */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">
          Participantes agregados ({participants.length})
        </h3>

        {participants.length === 0 ? (
          <div className="fhr-empty-state py-6">
            <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">
              Aún no has agregado participantes
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Agrega al menos un facilitador para continuar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {participants.map((participant, index) => (
                <motion.div
                  key={participant.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="fhr-card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{participant.name}</div>
                      <div className="text-xs text-slate-500">{participant.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getRoleBadge(participant.role)}
                    <button
                      onClick={() => handleRemove(participant.email)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
})
