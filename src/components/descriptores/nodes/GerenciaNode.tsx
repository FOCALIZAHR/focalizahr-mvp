import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface GerenciaNodeData {
  displayName: string
  headcount: number
  positionCount: number
  confirmedPercent: number
  expanded: boolean
}

// Mini ring SVG halo
function ProgressHalo({ percent, size = 44 }: { percent: number; size?: number }) {
  const r = (size / 2) - 3
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  const color = percent >= 80 ? '#10B981' : percent > 0 ? '#F59E0B' : '#334155'

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(51,65,85,0.3)" strokeWidth={2} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
      />
    </svg>
  )
}

export default memo(function GerenciaNode({ data }: { data: GerenciaNodeData }) {
  const initials = data.displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border cursor-pointer transition-all min-w-[180px] ${
      data.expanded
        ? 'border-cyan-500/30 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
        : 'border-slate-700/40 hover:border-cyan-500/20 hover:shadow-[0_0_16px_rgba(34,211,238,0.04)]'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />

      {/* Avatar with progress halo */}
      <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
        <ProgressHalo percent={data.confirmedPercent} />
        <div className="absolute inset-[4px] rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-400">
            {initials}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">
          {data.displayName}
        </p>
        <p className="text-[9px] text-slate-500 mt-0.5">
          {data.headcount} personas · {data.positionCount} cargos
        </p>

        {/* Expand indicator */}
        <div className="flex items-center gap-1 mt-1.5">
          {data.expanded ? (
            <ChevronDown className="w-2.5 h-2.5 text-cyan-400/60" />
          ) : (
            <>
              <ChevronRight className="w-2.5 h-2.5 text-slate-600" />
              <span className="text-[8px] text-slate-600">
                +{data.positionCount}
              </span>
            </>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
    </div>
  )
})
