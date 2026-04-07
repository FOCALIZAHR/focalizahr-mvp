import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { CheckCircle, FileText } from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'

interface CargoNodeData {
  jobTitle: string
  employeeCount: number
  descriptorStatus: 'CONFIRMED' | 'DRAFT' | 'NONE'
}

export default memo(function CargoNode({ data }: { data: CargoNodeData }) {
  const isConfirmed = data.descriptorStatus === 'CONFIRMED'
  const glowColor = isConfirmed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.08)'
  const borderColor = isConfirmed ? 'border-emerald-500/30' : 'border-amber-500/20'
  const ringColor = isConfirmed ? 'border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.03] bg-slate-900/70 backdrop-blur-lg min-w-[150px] max-w-[200px] ${borderColor}`}
      style={{ boxShadow: `0 0 20px ${glowColor}` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />

      {/* Avatar circle */}
      <div className={`w-9 h-9 rounded-full bg-slate-800/80 border flex items-center justify-center flex-shrink-0 ${ringColor}`}>
        {isConfirmed
          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          : <FileText className="w-3.5 h-3.5 text-amber-400/60" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-white truncate leading-tight">
          {formatDisplayName(data.jobTitle, 'full')}
        </p>
        <p className="text-[9px] text-slate-500 mt-0.5">
          {data.employeeCount} persona{data.employeeCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
})
