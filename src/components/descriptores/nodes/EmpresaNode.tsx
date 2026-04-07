import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Building2 } from 'lucide-react'

interface EmpresaNodeData {
  companyName: string
}

export default memo(function EmpresaNode({ data }: { data: EmpresaNodeData }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-cyan-500/25 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.08)] min-w-[220px]">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.15)]">
        <Building2 className="w-5 h-5 text-cyan-300" />
      </div>

      <div>
        <p className="text-sm font-bold text-white tracking-tight">
          {data.companyName}
        </p>
        <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">
          Organización
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400/60 !w-1.5 !h-1.5 !border-0" />
    </div>
  )
})
